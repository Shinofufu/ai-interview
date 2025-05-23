// src/views/InterviewView.vue
<template>
  <div class="interview-page-container">
    <el-row :gutter="20" class="interview-layout-row">
      <el-col :xs="24" :sm="7" :md="6" :lg="5" class="sidebar-column">
        <AppSidebar position="left" class="interview-page-sidebar" />
      </el-col>

      <el-col :xs="24" :sm="10" :md="12" :lg="14" class="main-content-column">
        <el-card class="interview-main-card" shadow="lg">
          <template #header>
            <div class="interview-card-header">
              <el-icon :size="28" class="header-icon"><ChatDotRound /></el-icon>
              <span class="header-title">AI 数字人视频面试</span>
            </div>
          </template>

          <div class="interview-content-area">
            <div class="status-icon-container">
              <el-icon v-if="currentStep === 'ready'" :size="80" color="var(--el-color-primary)"><VideoCameraFilled /></el-icon>
              <el-icon v-if="currentStep === 'preparing'" class="is-loading" :size="80" color="var(--el-color-primary)"><Loading /></el-icon>
              <el-icon v-if="currentStep === 'started'" :size="80" color="var(--el-color-success)"><SuccessFilled /></el-icon>
              <el-icon v-if="currentStep === 'ended'" :size="80" color="var(--el-color-success)"><CircleCheckFilled /></el-icon>
            </div>

            <h2 class="status-main-title">{{ statusTitle }}</h2>
            <p class="status-description-text">{{ statusDescription }}</p>

            <div class="action-buttons-group">
              <el-button
                  v-if="currentStep === 'ready'"
                  type="primary"
                  @click="initiateInterviewStart"
                  :loading="isPreparingInterview"
                  size="large"
                  round
                  class="action-btn"
                  :icon="VideoPlay"
              >
                启动 AI 面试官
              </el-button>
              <el-button
                  v-if="currentStep === 'started'"
                  type="success"
                  @click="confirmUserCompletedInterview"
                  size="large"
                  round
                  class="action-btn"
                  :icon="CircleCheck"
              >
                我已完成面试，查看总结
              </el-button>
              <el-button
                  v-if="currentStep === 'ended'"
                  type="primary"
                  @click="navigateToSummaryPage"
                  size="large"
                  round
                  class="action-btn"
                  :icon="ViewIcon"
              >
                查看面试总结报告
              </el-button>
            </div>

            <el-alert
                v-if="currentStep === 'started'"
                title="重要提示"
                type="warning"
                show-icon
                :closable="false"
                class="interview-tips"
                description="请确保您已在新打开的浏览器标签页中与AI面试官完成了所有互动问答。面试过程中请保持网络畅通。"
            />

            <div v-if="isInterviewActiveInStore && (currentStep === 'ready' || currentStep === 'started')" class="countdown-timer">
              <el-icon><AlarmClock /></el-icon>
              面试参考剩余时间: <strong>{{ timeRemainingFormattedString }}</strong>
            </div>

            <div v-if="showUserVideoPreview && currentStep === 'ready'" class="user-video-preview-toggle">
              <el-switch
                  v-model="previewEnabled"
                  size="small"
                  @change="toggleLocalUserMedia"
                  active-text="开启摄像头预览"
                  inactive-text="关闭摄像头预览"
              />
            </div>
            <div v-if="previewEnabled && currentStep === 'ready'" class="user-video-preview-area">
              <video ref="localUserVideoRef" autoplay playsinline muted class="video-preview-element"></video>
              <div v-if="!localUserMediaActive && previewEnabled" class="video-preview-placeholder">
                <el-icon :size="30"><CameraFilled /></el-icon>
                <span>摄像头加载中...</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="7" :md="6" :lg="5" class="sidebar-column">
        <AppSidebar position="right" class="interview-page-sidebar" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import {
  ElMessage,
  ElMessageBox,
  ElCard,
  ElRow,
  ElCol,
  ElButton,
  ElIcon,
  ElAlert,
  ElSwitch,
  ElLoading
} from 'element-plus'; // 添加 ElSwitch
import AppSidebar from '../components/AppSidebar.vue';
import {
  ChatDotRound, VideoCameraFilled, Loading, SuccessFilled, CircleCheckFilled,
  VideoPlay, CircleCheck, View as ViewIcon, AlarmClock, CameraFilled
} from '@element-plus/icons-vue';

const store = useStore();
const router = useRouter();

const currentStep = ref('ready');
const isPreparingInterview = ref(false);
const interviewerUrl = ref('http://127.0.0.1:8282/ui/');
let newInterviewWindow = null;
let timerIntervalId = null;

const localUserVideoRef = ref(null);
const localUserMediaActive = ref(false);
const showUserVideoPreview = ref(true); // 控制预览区域是否出现（包括开关）
const previewEnabled = ref(false); // Switch 的 v-model，控制是否实际启用摄像头

const statusTitle = computed(() => {
  switch (currentStep.value) {
    case 'ready': return '准备开始面试';
    case 'preparing': return '正在为您连接AI面试官...';
    case 'started': return 'AI面试官已启动';
    case 'ended': return '面试环节已完成';
    default: return 'AI视频面试';
  }
});

const statusDescription = computed(() => {
  switch (currentStep.value) {
    case 'ready': return '点击下方“启动AI面试官”按钮，将在新标签页中打开AI数字人。请在新标签页中完成所有问答。';
    case 'preparing': return '请稍候，系统正在努力连接中。如果长时间无响应，请检查网络或联系技术支持。';
    case 'started': return '请切换到新打开的浏览器标签页与AI面试官进行互动。完成后，请务必返回此页面点击“我已完成面试”按钮。';
    case 'ended': return '您的面试回答已记录。系统将根据您的表现生成一份详细的总结报告。';
    default: return '请按照指引完成面试流程。';
  }
});

const isInterviewActiveInStore = computed(() => store.getters.isInterviewActive);
const timeRemainingFormattedString = computed(() => store.getters.timeRemainingFormatted);


const setupCountdownTimer = () => {
  if (timerIntervalId) clearInterval(timerIntervalId);
  if (store.state.timeRemainingSeconds > 0 && isInterviewActiveInStore.value) {
    timerIntervalId = setInterval(() => {
      if (store.state.timeRemainingSeconds > 0 && isInterviewActiveInStore.value) {
        store.commit('DECREMENT_TIME_REMAINING_SECONDS');
      } else {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        if (isInterviewActiveInStore.value) {
          ElMessage.warning('面试参考时间已到！请尽快完成。');
        }
      }
    }, 1000);
  }
};

const getLocalUserMedia = async () => {
  if (!localUserVideoRef.value) return;
  localUserMediaActive.value = false; // 先标记为非活动
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (localUserVideoRef.value) { // 再次检查 ref 是否存在
      localUserVideoRef.value.srcObject = stream;
      localUserMediaActive.value = true;
    } else { // 如果 video 元素已不存在（例如用户快速切换开关）
      stream.getTracks().forEach(track => track.stop());
    }
  } catch (error) {
    console.warn('摄像头预览获取失败:', error);
    ElMessage.warning('无法访问您的摄像头进行预览。请检查设备权限。');
    previewEnabled.value = false; // 获取失败则关闭开关
  }
};

const stopLocalUserMedia = () => {
  if (localUserVideoRef.value && localUserVideoRef.value.srcObject) {
    localUserVideoRef.value.srcObject.getTracks().forEach(track => track.stop());
    localUserVideoRef.value.srcObject = null;
  }
  localUserMediaActive.value = false;
};

const toggleLocalUserMedia = async (enabled) => {
  await nextTick(); // 确保DOM更新（如果video元素是v-if控制的）
  if (enabled) {
    getLocalUserMedia();
  } else {
    stopLocalUserMedia();
  }
};


const initiateInterviewStart = () => {
  isPreparingInterview.value = true;
  currentStep.value = 'preparing';

  if (!isInterviewActiveInStore.value) {
    console.error("InterviewView: Vuex state isInterviewActive is false. Cannot start.");
    ElMessage.error("面试状态异常，无法启动。请返回首页重试。");
    isPreparingInterview.value = false;
    currentStep.value = 'ready'; // 回到准备状态
    return;
  }
  setupCountdownTimer(); // 启动倒计时

  setTimeout(() => {
    newInterviewWindow = window.open(interviewerUrl.value, '_blank');
    isPreparingInterview.value = false;

    if (newInterviewWindow) {
      newInterviewWindow.focus();
      currentStep.value = 'started';
      // sessionStorage.setItem('interviewWindowOpened', 'true'); // 可选：标记窗口已打开
      ElMessage.success({
        message: 'AI面试官已在新标签页打开，祝您面试顺利！',
        duration: 4000 // 延长提示时间
      });
      if(previewEnabled.value) stopLocalUserMedia(); // 如果预览开启，则关闭
      previewEnabled.value = false; // 无论如何，面试开始后禁用预览开关
      showUserVideoPreview.value = false; // 面试开始，彻底隐藏预览区域
    } else {
      currentStep.value = 'ready';
      ElMessage.error('启动AI面试官失败，请检查浏览器是否拦截了弹出窗口，并允许本站点的弹出窗口。');
    }
  }, 1200); // 模拟准备和打开窗口的时间
};

const confirmUserCompletedInterview = () => {
  ElMessageBox.confirm(
      '请确认您已在AI数字人面试官的标签页中完成了所有问答环节。结束后将无法返回继续作答。',
      '确认完成面试',
      {
        confirmButtonText: '是的，我已全部完成',
        cancelButtonText: '返回继续面试',
        type: 'warning',
        roundButton: true,
        draggable: true,
      }
  ).then(() => {
    proceedToSummaryGeneration();
  }).catch(() => {
    ElMessage.info('请继续在AI面试官标签页完成面试。');
    if (newInterviewWindow && !newInterviewWindow.closed) {
      newInterviewWindow.focus(); // 尝试将焦点切回数字人窗口
    }
  });
};

const proceedToSummaryGeneration = () => {
  currentStep.value = 'ended';
  if (timerIntervalId) clearInterval(timerIntervalId);

  store.dispatch('completeVideoInterview'); // 更新面试进度/状态

  // finalizeInterview (保存历史) 将在 SummaryView.vue 的 onMounted 中调用
  // 这里只是准备跳转
  const summaryLoading = ElLoading.service({
    lock: true,
    text: '正在为您生成面试总结报告，请稍候...',
    background: 'rgba(255, 255, 255, 0.85)',
  });
  setTimeout(() => {
    summaryLoading.close();
    router.push('/summary');
  }, 2500); // 模拟生成总结的耗时
};

const navigateToSummaryPage = () => {
  router.push('/summary');
};

onMounted(async () => {
  currentStep.value = 'ready'; // 每次进入页面重置为准备状态
  isPreparingInterview.value = false;
  previewEnabled.value = false; // 默认关闭预览

  if (isInterviewActiveInStore.value) {
    setupCountdownTimer(); // 如果Vuex中面试已激活（例如刷新），恢复倒计时
    // 对于 interviewWindowOpened 状态，如果之前用 sessionStorage 标记了，可以在这里恢复
    // if (sessionStorage.getItem('interviewWindowOpened') === 'true' && !newInterviewWindow) {
    //   currentStep.value = 'started'; // 假设用户刷新后，数字人窗口仍在
    // }
  } else {
    ElMessage.warning("当前没有正在进行的面试。如需开始，请先提交简历。");
    // 可以考虑禁用“启动面试官”按钮，或者直接导航离开
    // router.replace('/'); // 不自动跳转，让用户决定
  }
});

onUnmounted(() => {
  if (timerIntervalId) clearInterval(timerIntervalId);
  stopLocalUserMedia();
  // sessionStorage.removeItem('interviewWindowOpened'); // 清理标记
});

</script>

<style scoped>
.interview-page-container {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 60px); /* 假设App.vue页眉60px */
  box-sizing: border-box;
  display: flex; /* 新增 */
}

.interview-layout-row {
  flex-grow: 1;
  width: 100%; /* 确保行宽度正确 */
}

.sidebar-column {
  display: flex; /* 使内部 AppSidebar 可以正确应用高度100% */
  height: 100%; /* 尝试让侧边栏列和内容列等高 */
}
.interview-page-sidebar {
  width: 100%; /* 侧边栏组件宽度占满其列 */
  height: 100%; /* 侧边栏组件高度占满其列 */
}

.main-content-column {
  display: flex; /* 使卡片可以 flex-grow */
  flex-direction: column;
}

.interview-main-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.interview-main-card :deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9); /* 头部淡色背景 */
  padding: 18px 24px;
  border-bottom: 1px solid var(--el-color-primary-light-7);
}
.interview-card-header {
  display: flex;
  align-items: center;
  font-size: 1.3rem; /* 标题更大 */
  font-weight: 600;
  color: var(--el-color-primary); /* 标题使用主题色 */
}
.header-icon {
  margin-right: 12px;
}

.interview-content-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 30px 20px; /* 内容区域内边距 */
}

.status-icon-container {
  margin-bottom: 25px;
}
.status-icon-container .el-icon {
  animation: gentlePulse 2s infinite ease-in-out;
}
@keyframes gentlePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
.status-icon-container .is-loading .el-icon { /* 给加载图标不同动画 */
  animation: rotateLoading 1.5s linear infinite;
}
@keyframes rotateLoading {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}


.status-main-title {
  font-size: 1.8rem; /* 主状态标题 */
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}
.status-description-text {
  font-size: 1rem;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
  max-width: 550px;
  margin: 0 auto 30px auto; /* 增加底部间距 */
}

.action-buttons-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  margin-bottom: 30px; /* 与下方提示或计时器的间距 */
}
.action-btn {
  min-width: 260px; /* 按钮更宽 */
  font-size: 1.05rem;
  padding: 20px 30px; /* 按钮更大 */
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}
.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px -3px rgba(0,0,0,0.2);
}

.interview-tips {
  max-width: 550px;
  margin: 0 auto 20px auto; /* 提示居中并有上下间距 */
}
.interview-tips :deep(.el-alert__title) {
  font-size: 1rem; /* 提示标题大小 */
}
.interview-tips :deep(.el-alert__description) {
  font-size: 0.9rem; /* 提示描述大小 */
}

.countdown-timer {
  margin-top: 20px;
  font-size: 0.95rem;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-light);
  padding: 8px 15px;
  border-radius: 20px;
}
.countdown-timer .el-icon {
  margin-right: 6px;
  color: var(--el-color-warning);
}
.countdown-timer strong {
  color: var(--el-text-color-primary);
  margin-left: 4px;
}

.user-video-preview-toggle {
  margin-top: 25px;
  margin-bottom: 10px;
}
.user-video-preview-area {
  width: 200px; /* 预览区域大小调整 */
  height: 150px;
  background-color: #2c2c2c; /* 深色背景 */
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.video-preview-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.video-preview-placeholder {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #e0e0e0;
  font-size: 0.8rem;
}
.video-preview-placeholder .el-icon {
  margin-bottom: 6px;
  font-size: 24px;
}
</style>