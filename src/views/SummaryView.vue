<template>
  <div class="summary-page-container">
    <el-card class="summary-card" shadow="lg">
      <template #header>
        <div class="card-header-title">
          <el-icon><DocumentChecked /></el-icon>
          <span>面试总结报告</span>
        </div>
      </template>

      <div v-if="isLoadingSummary" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else class="summary-content">
        <el-alert
            title="面试已完成！"
            type="success"
            :description="`感谢您参与本次AI面试，${currentUserDisplayName}。以下是您的表现评估。`"
            show-icon
            :closable="false"
            style="margin-bottom: 25px;"
        />

        <el-row :gutter="24" class="summary-main-row">
          <el-col :xs="24" :sm="24" :md="12">
            <div class="score-panel">
              <div class="overall-score-display">
                <el-progress
                    type="dashboard"
                    :percentage="results.overallScore || 0"
                    :color="getScoreColors(results.overallScore || 0)"
                    :width="180"
                    :stroke-width="15"
                >
                  <template #default="{ percentage }">
                    <span class="percentage-value">{{ percentage }}</span>
                    <span class="percentage-label">综合评分</span>
                  </template>
                </el-progress>
              </div>

              <el-descriptions :column="1" border size="large" class="core-info-desc">
                <el-descriptions-item label="面试岗位" label-align="right" align="left" label-class-name="desc-label">
                  <el-tag effect="dark" round size="default">{{ results.expectedPosition || '未指定' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="面试用时" label-align="right" align="left" label-class-name="desc-label">
                  {{ results.totalTime || 0 }} 分钟
                </el-descriptions-item>
                <el-descriptions-item v-if="results.selectedInterviewTags && results.selectedInterviewTags.length > 0" label="侧重考察" label-align="right" align="left" label-class-name="desc-label" class-name="tags-cell">
                  <el-tooltip
                      effect="dark"
                      :content="results.selectedInterviewTags.join('，')"
                      placement="top"
                      :disabled="results.selectedInterviewTags.length <= 3"
                  >
                    <div class="focused-tags-summary">
                      <el-tag
                          v-for="tag in results.selectedInterviewTags.slice(0, 3)"
                          :key="tag"
                          type="info"
                          effect="plain"
                          round
                          size="small"
                          style="margin-right: 5px; margin-bottom: 5px;"
                      >
                        {{ tag }}
                      </el-tag>
                      <el-tag v-if="results.selectedInterviewTags.length > 3" type="info" effect="plain" round size="small" style="margin-bottom: 5px;">
                        +{{ results.selectedInterviewTags.length - 3 }}
                      </el-tag>
                    </div>
                  </el-tooltip>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12">
            <div class="ability-panel">
              <h3 class="panel-subtitle">
                <el-icon><Histogram /></el-icon>详细能力评估
              </h3>
              <div class="ability-item">
                <span class="ability-label">回答完整度</span>
                <el-progress
                    :percentage="results.completionRate || 0"
                    :color="getScoreColors(results.completionRate || 0, true).color"
                    :stroke-width="12"
                    class="ability-progress"
                />
              </div>
              <div class="ability-item">
                <span class="ability-label">沟通表达力</span>
                <el-progress
                    :percentage="results.communicationSkill || 0"
                    :color="getScoreColors(results.communicationSkill || 0, true).color"
                    :stroke-width="12"
                    class="ability-progress"
                />
              </div>
              <div class="ability-item">
                <span class="ability-label">技术能力 ({{ results.codingAbility > 0 ? '含编程' : '主要考察理论' }})</span>
                <el-progress
                    :percentage="results.codingAbility || 0"
                    :color="getScoreColors(results.codingAbility || 0, true).color"
                    :stroke-width="12"
                    class="ability-progress"
                />
              </div>
            </div>
          </el-col>
        </el-row>

        <el-divider class="section-divider"><el-icon><Comment /></el-icon> AI 综合建议</el-divider>
        <div class="suggestion-panel">
          <el-scrollbar wrap-style="max-height: 200px;">
            <p class="suggestion-text">{{ results.suggestion || 'AI导师正在总结建议，请稍等片刻或刷新查看。' }}</p>
          </el-scrollbar>
        </div>

        <div class="page-actions-footer">
          <el-button :icon="Download" @click="downloadReport" plain>下载详细报告 (PDF)</el-button>
          <el-button type="primary" :icon="RefreshLeft" @click="restartInterview" size="large" class="restart-button">
            再来一次面试
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElLoading, ElMessage, ElMessageBox, ElProgress, ElDescriptions, ElDescriptionsItem, ElTag, ElIcon, ElAlert, ElRow, ElCol, ElCard, ElDivider, ElButton, ElScrollbar, ElTooltip, ElSkeleton } from 'element-plus'; // 引入所有用到的组件
import { DocumentChecked, Histogram, Comment, Download, RefreshLeft } from '@element-plus/icons-vue';
import axios from "axios"; // 重命名UserFilled

const store = useStore();
const router = useRouter();

const isLoadingSummary = ref(true);
let summaryFetchedAndSaved = false;

const results = computed(() => store.state.interviewResults || {
  totalTime: 0,
  completionRate: 0,
  communicationSkill: 0,
  overallScore: 0,
  suggestion: '正在生成总结...',
  codingAbility: 0,
  expectedPosition: store.state.interviewResults.expectedPosition || '未指定',
  selectedInterviewTags: store.state.interviewResults.selectedInterviewTags || [],
});

const currentUserDisplayName = computed(() => {
  const user = store.getters.getCurrentUser;
  return user ? user.username : (store.state.userName || '求职者');
});


onMounted(async () => {
  isLoadingSummary.value = true;
  const loadingInstance = ElLoading.service({
    target: '.summary-page-container',
    text: '正在生成您的专属面试评估报告...',
    background: 'rgba(255, 255, 255, 0.85)', // 使用更柔和的加载背景
  });

  try {
    // 模拟API延迟 (实际项目中移除)
    // await new Promise(resolve => setTimeout(resolve, 1500));

    const response = await axios.post('http://localhost:8123/api/ai/generate-evaluation');
    const evaluationData = response.data;

    const newResults = {
      ...store.state.interviewResults,
      completionRate: evaluationData.completionRate || 0,
      communicationSkill: evaluationData.communicationSkill || 0,
      codingAbility: evaluationData.codingAbility || 0,
      overallScore: evaluationData.overallScore || 0,
      suggestion: evaluationData.suggestion || '本次面试暂无AI建议。',
      totalTime: evaluationData.totalTime || store.state.interviewResults.totalTime || 0,
    };
    store.commit('setInterviewResults', newResults);
    // ElMessage.success('面试评估已成功加载！'); // 加载提示已在loadingInstance中

    if (!summaryFetchedAndSaved) {
      await store.dispatch('finalizeInterview');
      summaryFetchedAndSaved = true;
    }

  } catch (error) {
    console.error('获取面试评估失败:', error);
    let errorMessage = '抱歉，面试评估报告生成失败';
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      errorMessage += `: ${error.response.status} - ${typeof errorData === 'string' ? errorData : (errorData?.message || error.message)}`;
    } else if (error.request) {
      errorMessage += ': 无法连接到评估服务，请检查网络';
    } else {
      errorMessage += `: ${error.message}`;
    }
    ElMessage.error(errorMessage);
    store.commit('setInterviewResults', {
      ...results.value, // 保留已有的如岗位信息
      suggestion: '评估结果获取失败，请稍后在历史记录中查看或联系支持。'
    });
  } finally {
    loadingInstance.close();
    isLoadingSummary.value = false;
  }
});

const getScoreColors = (score, forProgressLine = false) => {
  // 返回颜色数组给 el-progress type="dashboard"
  // 或返回单个颜色给 el-progress type="line"
  if (score >= 90) return forProgressLine ? { color: '#52c41a'} : [{ color: '#52c41a', percentage: 100 }]; // 绿色 (优秀)
  if (score >= 75) return forProgressLine ? { color: '#1890ff'} : [{ color: '#1890ff', percentage: 100 }]; // 蓝色 (良好)
  if (score >= 60) return forProgressLine ? { color: '#faad14'} : [{ color: '#faad14', percentage: 100 }]; // 黄色 (中等)
  return forProgressLine ? { color: '#f5222d'} : [{ color: '#f5222d', percentage: 100 }];       // 红色 (需提高)
};


const downloadReport = () => {
  ElMessage.info('下载详细PDF报告功能正在开发中，敬请期待！');
};

const restartInterview = () => {
  ElMessageBox.confirm(
      '您确定要放弃当前总结并重新开始一次AI面试吗？',
      '重新开始确认',
      {
        confirmButtonText: '是的，重新开始',
        cancelButtonText: '不了，谢谢',
        type: 'warning',
        roundButton: true,
      }
  ).then(() => {
    console.log('SummaryView: Attempting to reset state and navigate to /');
    store.commit('resetInterviewState');
    router.push('/');
  }).catch(() => {
    // ElMessage.info('已取消重新开始。');
  });
};

onBeforeUnmount(() => {
  if (results.value.overallScore > 0 && !summaryFetchedAndSaved && store.state.isInterviewActive === false) {
    console.warn("SummaryView is unmounting. Attempting to finalize interview as a fallback.");
    store.dispatch('finalizeInterview');
  }
});

</script>

<style scoped>
.summary-page-container {
  width: 100%; /* 确保它能利用父级提供的flex布局能力 */
  padding: 24px;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column; /* 如果内部还有其他元素与卡片并列 */
  justify-content: flex-start; /* 从顶部开始排列 */
  align-items: center; /* 让 .summary-card 水平居中 */
  flex-grow: 1; /* 填充 App.vue 中 el-main 的可用空间 */
  overflow-y: auto; /* 如果总结卡片本身内容可能超长，允许页面自身滚动 */
}

.summary-card {
  width: 100%;
  max-width: 960px;
  margin-top: 20px; /* 给卡片一点顶部外边距，使其不紧贴AppHeader */
  margin-bottom: 20px; /* 底部也给点外边距 */
  /* ... 其他卡片样式 ... */
}
.summary-card :deep(.el-card__header) {
  padding: 18px 24px; /* 调整头部内边距 */
  border-bottom: 1px solid var(--el-border-color-lighter); /* 头部下边框 */
}
.summary-card :deep(.el-card__body) {
  padding: 24px 30px; /* 调整内容区内边距 */
}

.card-header-title {
  display: flex;
  align-items: center;
  font-size: 1.2rem; /* 标题字体稍大 */
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.card-header-title .el-icon {
  margin-right: 10px;
  font-size: 1.4rem;
}

.loading-container {
  padding: 40px 20px;
}

.summary-main-row {
  margin-bottom: 25px;
}

.score-panel, .ability-panel {
  padding: 15px;
  background-color: var(--el-fill-color-lighter); /* 面板背景色 */
  border-radius: 8px;
  height: 100%; /* 尝试让左右面板等高 */
  display: flex;
  flex-direction: column;
}

.overall-score-display {
  text-align: center;
  margin-bottom: 25px;
  padding-top: 10px;
}
.percentage-value {
  display: block;
  font-size: 2.8em; /* 仪表盘中间数字 */
  font-weight: bold;
  color: var(--el-text-color-primary);
  line-height: 1;
}
.percentage-label {
  display: block;
  margin-top: 8px;
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}

.core-info-desc {
  margin-top: 10px;
}
.core-info-desc :deep(.desc-label) { /* 自定义描述列表标签样式 */
  font-weight: 500 !important;
  color: var(--el-text-color-secondary) !important;
  width: 100px; /* 固定标签宽度 */
}
.core-info-desc :deep(.el-descriptions__content) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.core-info-desc :deep(.tags-cell .el-descriptions__content) {
  padding-top: 8px; /* 给标签一点上边距，避免和边框太近 */
}


.panel-subtitle {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
  margin-top: 5px; /* 与面板顶部对齐 */
  display: flex;
  align-items: center;
}
.panel-subtitle .el-icon {
  margin-right: 8px;
  color: var(--el-color-primary);
}

.ability-item {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  font-size: 0.95rem;
}
.ability-label {
  width: 180px; /* 能力标签宽度 */
  color: var(--el-text-color-regular);
  padding-right: 10px;
}
.ability-progress {
  flex-grow: 1;
}
.ability-progress :deep(.el-progress-bar__innerText) {
  font-size: 0.85em !important;
  color: var(--el-text-color-primary) !important; /* 让进度条内文字更清晰 */
}


.section-divider {
  margin: 30px 0 25px 0 !important;
}
.section-divider .el-icon {
  margin-right: 6px;
  vertical-align: middle;
  font-size: 1.1em;
}
.section-divider :deep(.el-divider__text) {
  font-size: 1.05rem;
  font-weight: 500;
  background-color: var(--el-bg-color-page); /* 让分割线文字背景与页面背景一致 */
}

.suggestion-panel {
  background-color: var(--el-fill-color-light);
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed var(--el-border-color-lighter); /* 虚线边框 */
}
.suggestion-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
}

.page-actions-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: center;
  gap: 15px;
}
.page-actions-footer .el-button {
  min-width: 180px; /* 按钮统一最小宽度 */
  font-size: 1rem; /* 按钮字体 */
}
.restart-button {
  box-shadow: 0 2px 12px -3px rgba(var(--el-color-primary-rgb), 0.4);
}
.restart-button:hover {
  box-shadow: 0 4px 14px -2px rgba(var(--el-color-primary-rgb), 0.5);
}
.focused-tags-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>