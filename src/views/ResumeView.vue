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

          <div v-if="formData.experience.length > 0" class="parsed-projects">
            <el-divider>
              <el-icon><View /></el-icon>
              <span style="margin-left: 5px;">AI 解析的项目经历</span>
            </el-divider>
            <el-card v-for="(project, index) in formData.experience" :key="index" shadow="never" class="project-card">
              <template #header>
                <div class="card-header">
                  <span><strong>{{ project.projectName }}</strong></span>
                  <span class="date-range">{{ project.dateRange }}</span>
                </div>
              </template>
              <p style="white-space: pre-wrap;">{{ project.description }}</p>
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
import { Document, UploadFilled } from '@element-plus/icons-vue'
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
    UploadFilled
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const resumeForm = ref(null)
    const parsing = ref(false)
    const uploadedFile = ref(null) // 存储 File 对象
    const aiAnalyzing = ref(false) // AI 分析按钮的加载状态
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
      if (resumeForm.value) {
        resumeForm.value.clearValidate();
      }
    }


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
    const submitResume = () => {
      resumeForm.value.validate(valid => {
        if (valid) {
          const finalFormData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            education: formData.education,
            experience: formData.experience, // 提交项目数组
          };
          console.log('提交的简历数据:', finalFormData);
          // 确保 Vuex store action 'submitResume' 能处理 experience 是数组的情况
          store.dispatch('submitResume', finalFormData)
          router.push('/interview')
        } else {
          ElMessage.error('请检查表单，确保姓名、邮箱、电话已正确填写');
          return false;
        }
      })
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
      submitResume
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
</style> 