// src/components/AppSidebar.vue
<template>
  <div class="sidebar" :class="{ 'sidebar-left': position === 'left', 'sidebar-right': position === 'right' }">
    <template v-if="position === 'left'">
      <div class="sidebar-header">
        <h3>面试流程</h3>
      </div>
      <div class="sidebar-content">
        <el-steps direction="vertical" :active="activeStepIndex" finish-status="success" class="interview-steps">
          <el-step title="简历准备" description="上传并确认简历信息" :icon="DocumentCopy" />
          <el-step title="视频面试" description="与AI面试官互动问答" :icon="VideoCamera" />
          <el-step title="能力评估" description="AI分析您的面试表现" :icon="Opportunity" />
          <el-step title="获取总结" description="查看详细的面试报告" :icon="Memo" />
        </el-steps>
      </div>
    </template>

    <template v-else-if="position === 'right'">
      <div class="sidebar-header">
        <h3>面试信息</h3>
      </div>
      <div class="sidebar-content right-sidebar-content">
        <div class="info-item">
          <el-icon><UserIcon /></el-icon>
          <span><strong>候选人：</strong>{{ displayedUserName }}</span>
        </div>
        <div class="info-item" v-if="currentInterviewStage !== 'summary' && isInterviewActive">
          <el-icon><AlarmClock /></el-icon>
          <span><strong>剩余时间：</strong>{{ timeRemainingFormattedString }}</span>
        </div>
        <div class="info-item" v-if="currentInterviewStage === 'summary'">
          <el-icon><Finished /></el-icon>
          <span><strong>面试已完成</strong></span>
        </div>
        <div class="info-item" v-if="currentInterviewStage === 'summary' && resultsForSidebar.totalTime > 0">
          <el-icon><TimerIcon /></el-icon>
          <span><strong>总用时：</strong>{{ resultsForSidebar.totalTime }} 分钟</span>
        </div>

        <el-divider v-if="progressBarVisibleInRightSidebar" style="margin: 15px 0;" />
        <ProgressBar v-if="progressBarVisibleInRightSidebar" class="sidebar-progress-bar"/>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'; // 确保 defineProps 导入
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import ProgressBar from './ProgressBar.vue';
import { DocumentCopy, VideoCamera, Opportunity, Memo, User as UserIcon, AlarmClock, Finished, Timer as TimerIcon } from '@element-plus/icons-vue';

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  position: {
    type: String,
    required: true,
    validator: (value) => ['left', 'right'].includes(value)
  }
});

const store = useStore();
const route = useRoute();

const interviewStageMap = {
  '/': { name: 'resume', stepIndex: 0 },
  '/interview': { name: 'interview', stepIndex: 1 },
  '/summary': { name: 'summary', stepIndex: 3 }
  // 如果有 /coding 页面，也应加入
  // '/coding': { name: 'coding', stepIndex: 2 },
};
console.log('[AppSidebar] Current route.path:', route.path);

const currentInterviewStage = computed(() => {
  const stage = interviewStageMap[route.path]?.name || 'unknown';
  console.log('[AppSidebar] currentInterviewStage:', stage, '(based on path:', route.path, ')');
  return stage;
});

const activeStepIndex = computed(() => {
  const index = interviewStageMap[route.path]?.stepIndex ?? 0; // 默认0
  console.log('[AppSidebar] activeStepIndex:', index, '(based on path:', route.path, ')');
  return index;
});

const displayedUserName = computed(() => {
  const user = store.getters.getCurrentUser;
  const name = user ? user.username : (store.state.userName || '访客');
  console.log('[AppSidebar] displayedUserName:', name);
  return name;
});

const timeRemainingFormattedString = computed(() => {
  const formattedTime = store.getters.timeRemainingFormatted;
  // console.log('[AppSidebar] timeRemainingFormattedString:', formattedTime); // 这个会频繁打印，暂时注释
  return formattedTime;
});

const isInterviewActive = computed(() => {
  const active = store.getters.isInterviewActive;
  console.log('[AppSidebar] isInterviewActive (from Vuex):', active);
  return active;
});

// 右侧边栏进度条的可见性逻辑调整
const progressBarVisibleInRightSidebar = computed(() => {
  // 进度条只在简历准备阶段和视频面试阶段，且面试激活时显示
  const visible = (currentInterviewStage.value === 'resume' || currentInterviewStage.value === 'interview') && isInterviewActive.value;
  console.log('[AppSidebar] progressBarVisibleInRightSidebar:', visible);
  return visible;
});

const resultsForSidebar = computed(() => {
  const results = store.state.interviewResults;
  // console.log('[AppSidebar] resultsForSidebar (from Vuex):', results); // 可能包含很多信息，暂时注释
  return results;
});

</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.06);
  box-sizing: border-box;
  /* 确保 sidebar 本身可见 */
  border: 1px dashed #ccc; /* 临时边框用于调试可见性 */
  min-width: 150px; /* 确保有个最小宽度 */
}

.sidebar-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebar-header h3 {
  font-size: 1.1rem;
  color: var(--el-text-color-primary);
  margin: 0;
  font-weight: 600;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.interview-steps :deep(.el-step__icon) {
  background-color: var(--el-bg-color-page);
}
.interview-steps :deep(.el-step__title) {
  font-size: 0.95rem;
  font-weight: 500;
}
.interview-steps :deep(.el-step.is-vertical .el-step__line) {
  left: 11px;
}
.interview-steps :deep(.el-step__description) {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.right-sidebar-content .info-item {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
}
.right-sidebar-content .info-item .el-icon {
  margin-right: 10px;
  font-size: 1.1em;
  color: var(--el-color-primary);
}
.right-sidebar-content .info-item strong {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.sidebar-progress-bar {
  margin-top: 5px;
}
</style>