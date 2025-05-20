<template>
  <div class="page-container">
    <app-sidebar position="left" />

    <div class="main-content">
      <progress-bar />

      <div class="main-container">
        <div class="content-card resume-form">
          <h2>提交您的简历</h2>

          <div class="upload-area">
            <el-upload
                class="resume-uploader"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :show-file-list="false"
                accept="application/pdf"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                拖拽PDF简历到此处，或 <em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传PDF文件
                </div>
              </template>
            </el-upload>

            <div v-if="uploadedFile" class="file-info">
              <div class="file-name">
                <el-icon><document /></el-icon>
                <span>{{ uploadedFile.name }}</span>
              </div>
              <div class="file-actions">
                <el-button type="primary" plain size="small" @click="parseResume" :loading="parsing">
                  本地解析
                </el-button>
                <el-button type="success" plain size="small" @click="analyzeResumeWithAI" :loading="aiAnalyzing">
                  云端 AI 解析
                </el-button>
                <el-button type="danger" size="small" @click="removeFile">
                  删除
                </el-button>
              </div>
            </div>
          </div>

          <el-divider>
            <el-tag type="info">请核对信息或手动填写</el-tag>
          </el-divider>


          <el-form :model="formData" :rules="rules" ref="resumeForm" label-position="top">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="formData.name" placeholder="候选人姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="formData.email" placeholder="候选人邮箱" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="电话" prop="phone">
                  <el-input v-model="formData.phone" placeholder="候选人电话" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="教育背景" prop="education">
              <el-input
                  v-model="formData.education"
                  type="textarea" :rows="4"
                  placeholder="教育背景摘要"
              />
            </el-form-item>

          </el-form>

          <div v-if="formData.experience.length > 0" class="parsed-projects section-block">
            <el-divider content-position="left">
              <el-icon><View /></el-icon> <span style="margin-left: 5px;">AI 解析的项目经历和工作经历</span>
            </el-divider>

            <div class="tag-selection-hint">
              <el-icon style="vertical-align: middle; margin-right: 4px; color: #E6A23C;"><Opportunity /></el-icon> <span>提示：请点击下方各项目中的技术标签，选择您期望在后续面试环节侧重考察的领域。</span>
            </div>
            <el-card v-for="(project, index) in formData.experience" :key="index" shadow="never" class="project-card">
              <template #header>
                <div class="card-header">
                  <span><strong>{{ project.projectName }}</strong></span>
                  <span class="date-range">{{ project.dateRange }}</span>
                </div>
              </template>
              <div v-if="project.tags && project.tags.length > 0" class="project-tags">
                <el-tag
                    v-for="tag in project.tags"
                    :key="tag"
                    :type="isTagSelected(tag) ? 'primary' : 'info'"
                    :effect="isTagSelected(tag) ? 'dark' : 'light'"
                    size="default"
                    class="project-tag-item"
                    @click="toggleProjectTagSelection(tag)"
                    style="cursor: pointer; user-select: none;"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <div class="controls">
        <el-button type="primary" @click="submitResume">提交并开始面试</el-button>
      </div>
    </div>
    <app-sidebar position="right" />
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { Document, UploadFilled,View,Opportunity } from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import ProgressBar from '../components/ProgressBar.vue'
import axios from 'axios'; // 导入 axios
// 导入PDF.js
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;

export default {
  name: 'ResumeView',
  components: {
    AppSidebar,
    ProgressBar,
    Document,
    UploadFilled,
    View,
    Opportunity
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const resumeForm = ref(null)
    const parsing = ref(false)
    const uploadedFile = ref(null) // 存储 File 对象
    const aiAnalyzing = ref(false) // AI 分析按钮的加载状态
    const selectedProjectTags = ref([]);
    // 修改 formData 结构，experience 用于存储 AI 返回的项目列表
    const formData = reactive({
      name: '',
      email: '',
      phone: '',
      education: '',
      experience: [], // 用于存储 AI 解析出的项目经历列表 { projectName, dateRange, description }
    })

    // 基础字段校验规则
    const rules = {
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱地址', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
      phone: [{ required: true, message: '请输入电话号码', trigger: 'blur' }]
    }
    // 重置表单
    const resetFormData = () => {
      formData.name = '';
      formData.email = '';
      formData.phone = '';
      formData.education = '';
      formData.experience = []; // 重置为数组
      selectedProjectTags.value = [];
      if (resumeForm.value) {
        resumeForm.value.clearValidate();
      }
    }
    const isTagSelected = (tag) => {
      return selectedProjectTags.value.includes(tag);
    };
    // 【新增】切换标签选中状态的函数
    const toggleProjectTagSelection = (tag) => {
      const index = selectedProjectTags.value.indexOf(tag);
      if (index > -1) {
        selectedProjectTags.value.splice(index, 1); // 如果已选中，则移除
      } else {
        selectedProjectTags.value.push(tag); // 如果未选中，则添加
      }
      console.log('当前选中的标签:', selectedProjectTags.value);
    };



    // 处理文件上传
    const handleFileChange = (uploadFile) => {
      if (uploadFile.raw?.type !== 'application/pdf') {
        ElMessage.error('请上传PDF文件')
        uploadedFile.value = null;
        resetFormData(); // 清空表单
        return false
      }
      uploadedFile.value = uploadFile.raw;
      resetFormData(); // 选择新文件时重置表单和提取的文本
      ElMessage.success(`已选择文件: ${uploadedFile.value.name}`);
      return false
    }

    // 移除上传的文件
    const removeFile = () => {
      uploadedFile.value = null
      resetFormData(); // 移除文件时清空所有数据
    }

    // --- 方法一：本地解析 PDF ---
    const parseResume = async () => {
      if (!uploadedFile.value) {
        ElMessage.warning('请先上传PDF简历')
        return
      }
      if (parsing.value) return; // 防止重复点击
      parsing.value = true
      aiAnalyzing.value = false; // 确保 AI 分析按钮不是 loading
      const loadingInstance = ElLoading.service({ text: '正在本地解析简历...', background: 'rgba(0, 0, 0, 0.7)' });

      // 清空上次的AI结果
      formData.experience = [];
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
          let resumeText = '';
          try {
            const typedArray = new Uint8Array(this.result);
            const loadingTask = pdfjsLib.getDocument({ data: typedArray });
            const pdf = await loadingTask.promise;
            let pageTexts = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              pageTexts.push(textContent.items.map(item => item.str).join(' '));
            }
            resumeText = pageTexts.join('\n\n');
            console.log('本地解析完成，文本长度:', resumeText.length);

            // 调用本地正则提取，填充基础信息
            extractInformation(resumeText);

            ElMessage.success('本地解析完成！部分基础信息已填充。');
          } catch (error) {
            console.error('本地 PDF 解析错误:', error);
            ElMessage.error('本地解析失败: ' + (error.message || '未知错误'));
          } finally {
            parsing.value = false;
            loadingInstance.close();
          }
        }
        fileReader.onerror = function() { /* ... 错误处理 ... */
          console.error('FileReader 读取错误');
          ElMessage.error('文件读取失败');
          parsing.value = false;
          loadingInstance.close();
        }
        fileReader.readAsArrayBuffer(uploadedFile.value);
      } catch (error) { /* ... 错误处理 ... */
        console.error('启动文件读取过程出错:', error);
        ElMessage.error('无法开始读取文件');
        parsing.value = false;
        loadingInstance.close();
      }
    }

    // 本地正则提取函数 (简化版)
    const extractInformation = (text) => {
      // 只填充基础信息和教育背景
      const nameMatch = text.substring(0, 50).match(/^([\u4e00-\u9fa5]{2,4})\s*\n/);
      if (nameMatch && nameMatch[1]) formData.name = nameMatch[1].trim();
      else { /* ... 备用规则 ... */ }

      const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
      if (emailMatch && emailMatch[0]) formData.email = emailMatch[0].trim();

      const phoneSearchText = text.substring(0, 200);
      const phoneMatch = phoneSearchText.match(/(?:phone|电话|手机|联系方式)?[:：\s]*?(\b1[3-9]\d[\s-]*?\d{4}[\s-]*?\d{4}\b)/);
      if (phoneMatch && phoneMatch[1]) formData.phone = phoneMatch[1].replace(/[\s-]/g, '');
      else { /* ... 备用规则 ... */ }

      const eduMatch = text.match(/(教育背景|学历信息|教育经历)[\s：:]*([\s\S]*?)(?=工作经历|项目经验|专业技能|$)/i);
      if (eduMatch && eduMatch[2]) formData.education = eduMatch[2].trim();
      else formData.education = ''; // 没匹配到则清空

      // 本地解析不再填充 experience 数组
      // formData.experience = [];

      console.log("本地正则提取完成 (姓名，邮箱，电话，教育)");
    }

    // --- 方法二：上传云端进行 AI 分析 ---
    const analyzeResumeWithAI = async () => {
      if (!uploadedFile.value) {
        ElMessage.warning('请先选择一个PDF简历文件');
        return;
      }


      if (aiAnalyzing.value) return; // 防止重复点击

      aiAnalyzing.value = true;
      parsing.value = false;
      selectedProjectTags.value = []; // <--- 【修改】AI分析前清空已选标签
      const loadingInstance = ElLoading.service({ text: '上传文件并请求 AI 分析...', background: 'rgba(0, 0, 0, 0.7)' });

      const apiFormData = new FormData();
      apiFormData.append('file', uploadedFile.value);

      try {
        // 调用接收文件上传的后端 API，并指定完整 URL
        const response = await axios.post('http://localhost:8123/api/resume/analyze', apiFormData, {
          // headers: { 'Content-Type': 'multipart/form-data' } // 通常 axios 会自动处理
        });

        console.log('收到后端 AI 分析结果:', response.data);
        const backendData = response.data;

        // 用 AI 的结果填充表单 (可能覆盖本地解析的结果)
        formData.name = backendData.name || '';
        formData.email = backendData.email || '';
        formData.phone = backendData.phone || '';
        formData.education = backendData.educationSummary || ''; // 使用 AI 的教育摘要
        formData.experience = backendData.projects || []; // 填充项目经历数组
        store.commit('setAnalyzedResumeData', backendData);
        ElMessage.success('云端 AI 分析完成！');

      } catch (error) {
        // ... (同之前的错误处理逻辑) ...
        console.error('调用后端 AI 分析 API 时出错:', error);
        let errorMessage = 'AI 分析请求失败';
        if (error.response) {
          const errorData = error.response.data;
          errorMessage += `: ${error.response.status} - ${typeof errorData === 'string' ? errorData : (errorData?.message || error.message)}`;
        } else if (error.request) {
          errorMessage += ': 无法连接到服务器';
        } else {
          errorMessage += `: ${error.message}`;
        }
        ElMessage.error(errorMessage);
        // 出错时清空项目经历
        formData.experience = [];
      } finally {
        aiAnalyzing.value = false;
        loadingInstance.close();
      }
    }


    // 提交简历 (现在 experience 是项目数组)
    const submitResume = async () => {
      resumeForm.value.validate(async valid => {
        if (valid) {
          const finalPayload = {
            resumeInfo: { // 对应后端的 resumeInfo 字段
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              educationSummary: formData.education, // 确保字段名与 ResumeInfo 一致
              projects: formData.experience.map(exp => ({ // 确保字段名与 ResumeInfo.ProjectExperience 一致
                projectName: exp.projectName,
                dateRange: exp.dateRange,
                description: exp.description || '',
                tags: exp.tags || []
              }))
            },
            selectedInterviewTags: selectedProjectTags.value
          };
          console.log('准备提交给后端 /api/interview/setup 的数据:', finalPayload);
          const payloadForVuex = {
            userInfo: { // 从 finalPayload.resumeInfo 中提取用户信息
              name: finalPayload.resumeInfo.name,
              email: finalPayload.resumeInfo.email,
              phone: finalPayload.resumeInfo.phone,
              education: finalPayload.resumeInfo.educationSummary, // 与Vuex state中字段名(education)对应
              experience: finalPayload.resumeInfo.projects // 与Vuex state中字段名(experience)对应 (注意：结构可能仍需匹配)
            },
            initialDurationMinutes: 15
          };
          await store.dispatch('initializeAndStartInterview', payloadForVuex);
          await router.push('/interview');
          const loadingInstance = ElLoading.service({text: '正在初始化面试环境...', background: 'rgba(0, 0, 0, 0.7)'});
          try {
            // 【新增】调用后端 /api/interview/setup 接口
            const response = await axios.post('http://localhost:8123/api/interview/setup-current', finalPayload);

              console.log(response);
              ElMessage.success('面试环境已准备就绪！');
              router.push('/interview'); // 跳转到面试聊天页面

          } catch (error) {
            console.error('调用 /api/interview/setup 失败:', error);
            let errorMessage = '面试初始化请求失败';
            if (error.response) {
              const errorData = error.response.data;
              errorMessage += `: ${error.response.status} - ${typeof errorData === 'string' ? errorData : (errorData?.error?.message || errorData?.message || error.message)}`;
            } else if (error.request) {
              errorMessage += ': 无法连接到服务器';
            } else {
              errorMessage += `: ${error.message}`;
            }
            ElMessage.error(errorMessage);
          } finally {
            loadingInstance.close();
          }
        } else {
          ElMessage.error('请检查表单，确保姓名、邮箱、电话已正确填写');
          return false;
        }
      });
    }

// 返回给模板
    return {
      formData,
      rules,
      resumeForm,
      uploadedFile,
      parsing,        // 本地解析 loading
      aiAnalyzing,    // AI 解析 loading
      handleFileChange,
      removeFile,
      parseResume,         // 本地解析方法
      analyzeResumeWithAI, // 云端 AI 解析方法
      submitResume,
      selectedProjectTags,      // <--- 【新增】
      isTagSelected,          // <--- 【新增】
      toggleProjectTagSelection // <--- 【新增】
    }
  }
}
</script>

<style scoped>
.resume-form {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.resume-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--text-color);
}

.upload-area {
  margin-bottom: 20px;
}

.resume-uploader {
  width: 100%;
}

.file-info {
  margin-top: 15px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-actions {
  display: flex;
  gap: 10px;
}

.el-divider {
  margin: 30px 0;
}
.project-tags {
  margin-bottom: 10px;
  padding-bottom: 10px;
  /* border-bottom: 1px dashed #ebeef5; */ /* 这条分隔线可以保留或去掉 */
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 标签之间的水平和垂直间距 */
}

.project-tag-item {
  /* 你可以根据需要添加更多样式 */
  transition: all 0.2s ease-in-out; /* 平滑过渡效果 */
}
/* 在 <style scoped> 中 */
.tag-selection-hint {
  margin-bottom: 15px; /* 提示文字与下方第一个项目卡片的间距 */
  padding: 8px 12px;   /* 内边距 */
  background-color: #fdf6ec; /* 淡黄色背景，可选 */
  border: 1px solid #f3d19e; /* 淡黄色边框，可选 */
  border-radius: 4px;     /* 圆角 */
  color: #E6A23C;         /* 文字颜色，与图标颜色匹配 */
  font-size: 0.9em;       /* 稍小一点的字体 */
  text-align: left;       /* 文字左对齐，如果需要居中可以改为 center */
  display: flex;          /* 使用 flex 让图标和文字垂直居中 */
  align-items: center;    /* 垂直居中 */
}
</style> 