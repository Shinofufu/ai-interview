<template>
  <div class="resume-page-container">
    <el-alert
        title="温馨提示"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
        description="请上传您的PDF简历，我们将通过AI技术智能解析您的信息，以便为您定制更精准的面试体验。确保简历内容清晰、准确，以便AI更好地理解您的专业背景和经历。"
    />

    <el-row :gutter="24" class="content-row">
      <el-col :xs="24" :sm="24" :md="10" :lg="9" class="fixed-height-col">
        <el-card class="upload-card" shadow="lg">
          <template #header>
            <div class="card-header-title">
              <el-icon><Upload /></el-icon>
              <span>上传简历 (PDF)</span>
            </div>
          </template>

          <div class="upload-section">
            <el-upload
                class="resume-uploader"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :show-file-list="false"
                accept="application/pdf"
                :disabled="aiAnalyzing"
            >
              <div class="upload-icon-container">
                <el-icon :size="60" color="var(--el-color-primary)"><Files /></el-icon>
              </div>
              <div class="el-upload__text">
                将PDF文件拖到此处，或 <em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  <el-icon :size="14"><WarningFilled /></el-icon>
                  仅支持PDF，不超过5MB，AI将助您快速填写表单
                </div>
              </template>
            </el-upload>

            <div v-if="uploadedFile" class="file-status-display">
              <div class="file-icon-name">
                <el-icon color="var(--el-color-success)" :size="24"><CircleCheckFilled /></el-icon>
                <span class="file-name" :title="uploadedFile.name">{{ uploadedFile.name }}</span>
              </div>
              <div class="file-actions">
                <el-button
                    type="primary"
                    @click="analyzeResumeWithAI"
                    :loading="aiAnalyzing"
                    :icon="Reading"
                    round
                    class="ai-parse-button"
                >
                  AI智能解析
                </el-button>
                <el-button
                    type="danger"
                    @click="confirmRemoveFile"
                    :icon="Delete"
                    circle
                    :disabled="aiAnalyzing"
                    title="移除文件"
                />
              </div>
            </div>
            <el-empty v-else-if="!aiAnalyzing" description="请上传您的简历开始" :image-size="100" style="padding: 20px 0;" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="14" :lg="15" class="fixed-height-col">
        <el-card class="form-details-card" shadow="lg">
          <template #header>
            <div class="card-header-title">
              <el-icon><DocumentChecked /></el-icon>
              <span>信息确认与编辑</span>
              <el-tag v-if="aiAnalyzing" type="warning" effect="light" size="small" round style="margin-left: 10px;">
                <el-icon class="is-loading" style="vertical-align: middle; margin-right: 4px;"><Loading /></el-icon>
                AI解析中...
              </el-tag>
            </div>
          </template>

          <div class="form-scrollable-content">
            <el-form
                :model="formData"
                :rules="rules"
                ref="resumeFormRef"
                label-position="top"
                label-width="100px"
                class="resume-form"
                hide-required-asterisk
            >
              <el-tabs v-model="activeTab" class="form-tabs">
                <el-tab-pane label="基本信息" name="basic">
                  <el-scrollbar class="tab-pane-scrollbar">
                    <div class="tab-pane-content-wrapper">
                      <el-row :gutter="20">
                        <el-col :xs="24" :sm="12">
                          <el-form-item label="姓名" prop="name">
                            <el-input v-model="formData.name" placeholder="请输入姓名" clearable :prefix-icon="User" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12">
                          <el-form-item label="电话" prop="phone">
                            <el-input v-model="formData.phone" placeholder="请输入电话号码" clearable :prefix-icon="PhoneFilled" />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="20">
                        <el-col :xs="24" :sm="12">
                          <el-form-item label="邮箱" prop="email">
                            <el-input v-model="formData.email" placeholder="请输入邮箱" clearable :prefix-icon="Message" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12">
                          <el-form-item label="期望岗位" prop="expectedPosition">
                            <el-input v-model="formData.expectedPosition" placeholder="例如：AI算法工程师" clearable :prefix-icon="OfficeBuilding" />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-form-item label="教育背景摘要" prop="education">
                        <el-input
                            v-model="formData.education"
                            type="textarea" :rows="3"
                            placeholder="请填写或由AI解析您的主要教育经历"
                            show-word-limit
                            maxlength="500"
                        />
                      </el-form-item>
                    </div>
                  </el-scrollbar>
                </el-tab-pane>

                <el-tab-pane label="面试侧重点选择" name="experience" :disabled="!formData.experience || formData.experience.length === 0">
                  <el-scrollbar class="tab-pane-scrollbar">
                    <div class="tab-pane-content-wrapper">
                      <div v-if="formData.experience && formData.experience.length > 0" class="experience-section">
                        <div class="tag-selection-guide">
                          <el-icon :size="16" color="var(--el-color-warning)" style="margin-right: 6px;"><Opportunity /></el-icon>
                          请从下方AI解析出的经历中，选择本次面试期望侧重考察的技术方向 (最多选 {{ MAX_TAGS_SELECTION }} 个)。
                        </div>
                        <el-collapse v-model="activeCollapseNames" accordion class="experience-collapse">
                          <el-collapse-item
                              v-for="(project, index) in formData.experience"
                              :key="project.projectName || index"
                              :name="index.toString()"
                              class="experience-item"
                          >
                            <template #title>
                              <span class="project-title-text">
                                <el-icon><CollectionTag /></el-icon>
                                {{ project.projectName || `经历 ${index + 1}` }}
                              </span>
                            </template>
                            <div v-if="project.tags && project.tags.length > 0" class="project-tags-list">
                              <el-check-tag
                                  v-for="tag in project.tags"
                                  :key="tag"
                                  :checked="isTagSelected(tag)"
                                  @change="() => toggleProjectTagSelection(tag)"
                                  class="tech-tag"
                              >
                                {{ tag }}
                              </el-check-tag>
                            </div>
                            <el-text v-else type="info" size="small" style="padding: 10px 0;">此经历未解析出技术标签。</el-text>
                          </el-collapse-item>
                        </el-collapse>
                      </div>
                      <el-empty v-else description="AI未解析出项目或工作经历，或简历中不包含此类信息。" :image-size="100" />
                    </div>
                  </el-scrollbar>
                </el-tab-pane>
              </el-tabs>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-footer-actions">
      <el-button @click="confirmResetAll" :icon="Refresh" :disabled="aiAnalyzing" plain>
        清空重填
      </el-button>
      <el-button
          type="primary"
          @click="submitAndStartInterview"
          :loading="submitLoading"
          :disabled="!uploadedFile || aiAnalyzing || !isFormPotentiallyValid()"
          size="large"
          :icon="Promotion"
          class="submit-button"
      >
        提交简历，开始AI面试
      </el-button>
    </div>
  </div>
</template>

<script setup>
// 确保导入的图标和方法都正确。
// 主要关注点是与本地解析相关的代码已移除。
import { ref, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus';
import {
  Upload, Files, WarningFilled, CircleCheckFilled, Delete, Reading, DocumentChecked, Loading,
  User, PhoneFilled, Message, OfficeBuilding, CollectionTag, Opportunity, Refresh, Promotion,
} from '@element-plus/icons-vue';
import axios from 'axios';

const store = useStore();
const router = useRouter();

const resumeFormRef = ref(null);
const uploadedFile = ref(null);
const aiAnalyzing = ref(false);
const submitLoading = ref(false);
const selectedProjectTags = ref([]);
const activeCollapseNames = ref('0');
const activeTab = ref('basic');

const MAX_TAGS_SELECTION = 5;

const formData = reactive({
  name: '',
  email: '',
  phone: '',
  education: '',
  expectedPosition: '',
  experience: [],
});

const rules = reactive({
  name: [{ required: true, message: '请输入您的姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入您的邮箱地址', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }
  ],
  phone: [{ required: true, message: '请输入您的电话号码', trigger: 'blur' }],
  expectedPosition: [{ required: false, message: '请输入期望岗位', trigger: 'blur' }],
});

const isFormPotentiallyValid = () => {
  return formData.name && formData.email && formData.phone;
};

const resetFormAndSelections = () => {
  formData.name = '';
  formData.email = '';
  formData.phone = '';
  formData.education = '';
  formData.expectedPosition = '';
  formData.experience = [];
  selectedProjectTags.value = [];
  activeCollapseNames.value = '0';
  activeTab.value = 'basic';
  if (resumeFormRef.value) {
    resumeFormRef.value.clearValidate();
  }
};

const confirmResetAll = () => {
  ElMessageBox.confirm(
      '您确定要清空已上传的简历和所有已填写/解析的信息吗？此操作不可恢复。',
      '清空确认',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
        draggable: true,
      }
  ).then(() => {
    uploadedFile.value = null;
    resetFormAndSelections();
    ElMessage.success('所有信息已清空，您可以重新上传简历。');
  }).catch(() => { /* ElMessage.info('已取消清空操作。'); */ });
};

const handleFileChange = (uploadFile) => {
  if (uploadedFile.value && uploadFile.raw?.name !== uploadedFile.value.name) {
    ElMessageBox.confirm(
        `您已选择简历 "${uploadedFile.value.name}"。是否替换为新文件 "${uploadFile.name}"？替换将清空当前解析内容。`,
        '替换简历确认',
        {
          confirmButtonText: '替换',
          cancelButtonText: '取消',
          type: 'warning',
        }
    ).then(() => {
      performFileSelection(uploadFile);
    }).catch(() => { /* ElMessage.info('已取消替换操作。'); */ });
  } else {
    performFileSelection(uploadFile);
  }
  return false;
};

const performFileSelection = (uploadFile) => {
  if (uploadFile.raw?.type !== 'application/pdf') {
    ElMessage.error('文件格式错误：请选择PDF格式的简历文件。');
    return;
  }
  if (uploadFile.size / 1024 / 1024 > 5) {
    ElMessage.error('文件过大：简历PDF文件大小不能超过5MB。');
    return;
  }
  uploadedFile.value = uploadFile.raw;
  resetFormAndSelections();
  ElMessage.success(`简历 "${uploadedFile.value.name}" 已准备就绪，请点击“AI智能解析”。`);
};

const confirmRemoveFile = () => {
  ElMessageBox.confirm(
      '确定要移除当前已上传的简历吗？相关解析信息也将被清空。',
      '移除确认',
      {
        confirmButtonText: '确定移除',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(() => {
    uploadedFile.value = null;
    resetFormAndSelections();
    ElMessage.info('简历文件已移除。');
  }).catch(() => { /* ElMessage.info('已取消移除操作。'); */ });
};

const analyzeResumeWithAI = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先选择您的PDF简历文件再进行解析。');
    return;
  }
  if (aiAnalyzing.value) return;

  aiAnalyzing.value = true;
  selectedProjectTags.value = [];
  activeTab.value = 'basic';
  const loadingInstance = ElLoading.service({
    lock: true,
    text: 'AI引擎正在努力解析您的简历，请稍候...',
    background: 'rgba(0, 0, 0, 0.75)',
  });

  const apiFormData = new FormData();
  apiFormData.append('file', uploadedFile.value);

  try {
    const response = await axios.post('http://localhost:8123/api/resume/analyze', apiFormData);
    const backendData = response.data;

    formData.name = backendData.name || '';
    formData.email = backendData.email || '';
    formData.phone = backendData.phone || '';
    formData.education = backendData.educationSummary || '';
    formData.expectedPosition = backendData.expectedPosition || formData.expectedPosition || '';
    formData.experience = backendData.projects || [];

    store.commit('setAnalyzedResumeData', backendData);
    ElMessage.success('AI智能解析完成！信息已填充，请检查并确认。');

    if (formData.experience.length > 0) {
      activeCollapseNames.value = '0';
      setTimeout(() => { activeTab.value = 'experience'; }, 300);
    } else {
      ElMessage.info('AI未从简历中解析出项目或工作经历信息。您可以手动填写或检查简历内容。');
    }
  } catch (error) {
    console.error('AI简历分析API请求失败:', error);
    let errorMessage = 'AI简历分析服务暂时不可用';
    if (error.response) {
      errorMessage += `: ${error.response.status} - ${error.response.data?.message || error.message}`;
    } else if (error.request) {
      errorMessage += ': 无法连接到分析服务器';
    } else {
      errorMessage += `: ${error.message}`;
    }
    ElMessage.error(errorMessage);
    formData.experience = [];
  } finally {
    aiAnalyzing.value = false;
    loadingInstance.close();
  }
};

const isTagSelected = (tag) => selectedProjectTags.value.includes(tag);

const toggleProjectTagSelection = (tag) => {
  const index = selectedProjectTags.value.indexOf(tag);
  if (index > -1) {
    selectedProjectTags.value.splice(index, 1);
  } else {
    if (selectedProjectTags.value.length >= MAX_TAGS_SELECTION) {
      ElMessage.warning(`面试侧重点最多选择 ${MAX_TAGS_SELECTION} 个技术标签。`);
      return;
    }
    selectedProjectTags.value.push(tag);
  }
};

const submitAndStartInterview = async () => {
  if (!resumeFormRef.value) return;
  await resumeFormRef.value.validate(async (valid) => {
    if (valid) {
      if (formData.experience.length > 0 && selectedProjectTags.value.length === 0) {
        ElMessage.warning('为了更好地定制面试，请至少从解析出的经历中选择一个技术标签。');
        activeTab.value = 'experience';
        return;
      }
      submitLoading.value = true;
      const loadingInstance = ElLoading.service({
        lock: true,
        text: '正在提交信息并为您准备面试环境...',
        background: 'rgba(0, 0, 0, 0.75)',
      });

      const finalPayload = {
        resumeInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          educationSummary: formData.education,
          expectedPosition: formData.expectedPosition,
          projects: formData.experience.map(exp => ({
            projectName: exp.projectName,
            tags: exp.tags || []
          }))
        },
        selectedInterviewTags: selectedProjectTags.value
      };

      try {
        await store.dispatch('initializeAndStartInterview', {
          userInfo: {
            name: finalPayload.resumeInfo.name,
            email: finalPayload.resumeInfo.email,
            education: finalPayload.resumeInfo.educationSummary,
            expectedPosition: finalPayload.resumeInfo.expectedPosition,
          },
          // 将 selectedInterviewTags 也传递给 action，以便存入 store.state.interviewResults
          selectedInterviewTags: finalPayload.selectedInterviewTags
        });

        const response = await axios.post('http://localhost:8123/api/interview/setup-current', finalPayload);
        console.log(response)
        ElMessage.success('信息提交成功，面试环境已准备就绪！即将跳转...');
        router.push('/interview');

      } catch (error) {
        console.error('提交或初始化面试失败:', error);
        let errorMessage = '操作失败，未能开始面试';
        if (error.response) {
          errorMessage += `: ${error.response.status} - ${error.response.data?.error?.message || error.response.data?.message || '服务器内部错误'}`;
        } else if (error.request) {
          errorMessage += ': 无法连接服务器，请检查网络';
        } else {
          errorMessage += `: ${error.message}`;
        }
        ElMessage.error(errorMessage);
      } finally {
        submitLoading.value = false;
        loadingInstance.close();
      }
    } else {
      ElMessage.error('请检查表单，确保姓名、邮箱、电话等必填项已正确填写。');
      if (resumeFormRef.value.fields) {
        for (const field of resumeFormRef.value.fields) {
          if (field.validateState === 'error') {
            if (field.labelFor) {
              const el = document.getElementById(field.labelFor);
              if (el) {
                const tabPane = el.closest('.el-tab-pane');
                if (tabPane && tabPane.getAttribute('aria-labelledby')) {
                  const tabId = tabPane.getAttribute('aria-labelledby');
                  const tabName = tabId.replace('tab-', '');
                  activeTab.value = tabName;
                  break;
                }
              }
            }
            activeTab.value = 'basic';
            break;
          }
        }
      } else {
        activeTab.value = 'basic';
      }
      return false;
    }
  });
};

watch(uploadedFile, (newFile) => {
  if (!newFile) {
    activeCollapseNames.value = '0';
    activeTab.value = 'basic';
  }
});

watch(activeTab, (newTab) => {
  if (newTab === 'experience' && formData.experience.length > 0 && (!activeCollapseNames.value || activeCollapseNames.value.length === 0)) {
    activeCollapseNames.value = '0';
  }
});

</script>

<style scoped>
.resume-page-container {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  /* 确保页面容器至少和视口一样高，减去App.vue中Header的高度 */
  min-height: calc(100vh - 60px); /* 假设App.vue的Header是60px */
  box-sizing: border-box;
}

.content-row {
  flex-grow: 1;
  display: flex; /* 使得内部的col可以更好地控制高度 */
}

.fixed-height-col {
  display: flex;
  flex-direction: column;
  /* 确保列本身能占据一定高度，以便内部卡片能flex-grow */
  /* 可以考虑给一个 min-height 或让父级 .content-row 有明确高度 */
}

.upload-card, .form-details-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-lighter);
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* 卡片占据其Col的可用垂直空间 */
  margin-bottom: 0; /* 移除卡片自身的下外边距，由父级row的gutter控制间距 */
}
.upload-card:hover, .form-details-card:hover {
  box-shadow: var(--el-box-shadow-light);
}


.card-header-title {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.card-header-title .el-icon {
  margin-right: 8px;
  font-size: 1.3rem;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  flex-grow: 1;
  justify-content: center;
}

.resume-uploader {
  width: 100%;
  margin-bottom: 24px;
}
.resume-uploader :deep(.el-upload-dragger) {
  padding: 30px 20px;
  border-radius: 10px;
  border: 2px dashed var(--el-border-color-lighter);
  transition: border-color 0.3s, box-shadow 0.3s;
}
.resume-uploader :deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
}
.upload-icon-container {
  margin-bottom: 16px;
  animation: floatIcon 2s ease-in-out infinite alternate;
}
@keyframes floatIcon {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-8px); }
}
.el-upload__text {
  font-size: 0.95rem;
  color: var(--el-text-color-regular);
}
.el-upload__text em {
  color: var(--el-color-primary);
  font-weight: 500;
}
.el-upload__tip {
  margin-top: 12px;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.el-upload__tip .el-icon {
  margin-right: 5px;
}

.file-status-display {
  width: 100%;
  margin-top: 10px;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
  text-align: center;
}
.file-icon-name {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.file-icon-name .el-icon {
  margin-right: 10px;
}
.file-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.ai-parse-button {
  box-shadow: 0 2px 12px -3px rgba(var(--el-color-primary-rgb), 0.4);
}
.ai-parse-button:hover {
  box-shadow: 0 4px 14px -2px rgba(var(--el-color-primary-rgb), 0.5);
}


.form-details-card :deep(.el-card__body) {
  padding: 0px 20px 20px 20px; /* 调整body padding，给tab header留出空间 */
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

.form-scrollable-content { /* 这个div包裹el-form */
  flex-grow: 1;
  display: flex; /* 使内部el-form也能flex-grow */
  flex-direction: column;
  overflow: hidden; /* 重要：让内部的el-tabs可以正确计算高度 */
}

.resume-form {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* el-form填满 .form-scrollable-content */
  overflow: hidden; /* 配合内部 el-tabs */
}
.form-tabs {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* el-tabs填满 el-form */
  overflow: hidden; /* 配合内部 el-tab-pane */
}
.form-tabs :deep(.el-tabs__content) {
  flex-grow: 1; /* el-tabs__content 填满 el-tabs 的剩余空间 */
  display: flex; /* 使内部 el-tab-pane 可以 flex-grow */
  overflow: hidden; /* 配合内部 el-scrollbar */
}
.form-tabs :deep(.el-tab-pane) {
  flex-grow: 1; /* el-tab-pane 填满 el-tabs__content */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 配合内部 el-scrollbar */
}

.tab-pane-scrollbar { /* el-scrollbar 组件 */
  flex-grow: 1; /* el-scrollbar 填满 el-tab-pane */
  width: 100%;
}
.tab-pane-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-x: hidden; /* 通常只需要垂直滚动 */
}
.tab-pane-content-wrapper { /* 包裹实际内容的div */
  padding: 5px 10px 20px 5px; /* 给滚动内容一些内边距，特别是右边给滚动条空间 */
  /* 不需要设置max-height在这里，el-scrollbar会处理 */
}


.form-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}
.form-tabs :deep(.el-tabs__item) {
  font-size: 1rem;
  font-weight: 500;
}

.experience-section {
  margin-top: 0px;
}
.tag-selection-guide {
  margin-bottom: 18px;
  padding: 10px 15px;
  background-color: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--el-color-warning-dark-2);
  display: flex;
  align-items: center;
}

.experience-collapse {
  border: none;
}
.experience-item {
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}
.experience-item :deep(.el-collapse-item__header) {
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-extra-light);
  padding: 0 18px;
  height: 52px;
  font-size: 1rem;
}
.project-title-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}
.project-title-text .el-icon {
  margin-right: 8px;
  color: var(--el-color-primary);
}
.experience-item :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background-color: var(--el-bg-color);
  padding: 18px;
}
.project-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 5px;
}
.tech-tag {
  padding: 5px 12px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}
.tech-tag:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}


.page-footer-actions {
  margin-top: 28px; /* 与上方内容的间距 */
  padding: 20px 0px; /* 上下padding，左右padding由页面容器控制 */
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page); /* 与页面背景一致 */
  /* position: sticky; bottom: 0; z-index: 10; */ /* 暂时移除吸底，依赖页面整体滚动 */
}
.submit-button {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.upload-card :deep(.el-empty__image),
.form-details-card :deep(.el-empty__image) {
  width: 100px;
}
.upload-card :deep(.el-empty__description p),
.form-details-card :deep(.el-empty__description p) {
  font-size: 0.9rem;
}
</style>