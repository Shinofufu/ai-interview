<template>
  <div class="page-container">
    <app-sidebar position="left" />

    <div class="main-content">
      <progress-bar />

      <div class="main-container">
        <div class="content-card interviewer-container">
          <div class="interviewer-video-placeholder">
            <div class="placeholder">
              <el-icon><VideoCamera /></el-icon>
              <p v-if="!interviewInProgress">点击“开始面试”按钮，将在新标签页中启动AI数字人面试官。</p>
              <p v-else>AI数字人面试官已在另一标签页打开。请完成面试后，返回此页面点击“结束面试”。</p>
            </div>
          </div>

          <div class="user-video" v-if="showUserVideoPreview && !interviewInProgress">
            <video ref="localUserVideoRef" autoplay playsinline muted class="video-element"></video>
            <div id="user-camera-placeholder" v-if="!localUserMediaActive" class="placeholder-overlay">
              <el-icon><Avatar /></el-icon>
              <p>摄像头预览</p>
            </div>
          </div>

          <div class="text-overlay">
            <p>{{ currentSubtitle }}</p>
          </div>
        </div>
      </div>

      <div class="controls">
        <el-button
            type="primary"
            @click="startInterviewInNewTab"
            :loading="isPreparingInterview"
            v-if="!interviewInProgress"
        >
          开始面试
        </el-button>
        <el-button
            type="primary"
            @click="confirmEndInterview"
            v-if="interviewInProgress"
        >
          我已完成面试，查看总结
        </el-button>
      </div>
    </div>

    <app-sidebar position="right" />
  </div>
</template>

<script>
import {ref, onMounted, onUnmounted, nextTick, computed} from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { VideoCamera, Avatar } from '@element-plus/icons-vue';
import AppSidebar from '../components/AppSidebar.vue';
import ProgressBar from '../components/ProgressBar.vue';
import { ElMessage, ElMessageBox } from 'element-plus'; // 引入ElMessageBox



export default {
  name: 'InterviewView',
  components: {
    AppSidebar,
    ProgressBar,
    VideoCamera,
    Avatar,
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const interviewInProgress = ref(false); // 标记面试是否在新标签页中“进行中”
    const isPreparingInterview = ref(false); // 用于按钮加载状态
    const currentSubtitle = ref('准备开始AI数字人面试。');
    const interviewerUrl = ref('http://127.0.0.1:8282/ui/'); // Gradio界面URL

    const localUserVideoRef = ref(null);
    const localUserMediaActive = ref(false);
    const showUserVideoPreview = ref(true); // 默认显示本地摄像头预览
    let localStream = null;

    let timerInterval = null;

    const getLocalPreview = async () => {
      if (!showUserVideoPreview.value) return;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (localUserVideoRef.value) {
          localUserVideoRef.value.srcObject = localStream;
          localUserMediaActive.value = true;
        }
      } catch (error) {
        console.warn('VUE: 获取本地摄像头预览失败:', error);
        localUserMediaActive.value = false;
        // ElMessage.warning('无法访问摄像头用于本地预览。'); // 可以选择不提示，或者只在用户明确要预览时提示
      }
    };

    const stopLocalPreview = () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        localUserMediaActive.value = false;
        if (localUserVideoRef.value) {
          localUserVideoRef.value.srcObject = null;
        }
      }
    };



    const isInterviewActive = computed(() => store.getters.isInterviewActive);

    let timerIntervalId = ref(null);
    onMounted(() => {
      // 当组件挂载时，如果面试是激活状态，则启动倒计时
      // isInterviewActive 应该在 initializeAndStartInterview action 中被设为 true
      if (isInterviewActive.value) {
        startCountdown();
      }
      // 如果用户刷新页面，isInterviewActive 可能会丢失，需要持久化或重新初始化逻辑
    });
    const startCountdown = () => {
      // 清理可能存在的旧计时器
      if (timerIntervalId.value) {
        clearInterval(timerIntervalId.value);
        timerIntervalId.value = null;
      }

      if (store.state.timeRemainingSeconds > 0 && isInterviewActive.value) {
        console.log('启动面试倒计时...');
        timerIntervalId.value = setInterval(() => {
          if (store.state.timeRemainingSeconds > 0 && isInterviewActive.value) {
            store.commit('DECREMENT_TIME_REMAINING_SECONDS');
          } else {
            clearInterval(timerIntervalId.value);
            timerIntervalId.value = null;
            if (isInterviewActive.value) { // 确保是在面试激活时时间耗尽
              console.log("面试时间到！");
              ElMessage.warning('面试时间已到！将跳转到总结页面...');
              store.dispatch('finalizeInterview'); // 触犯面试结束的action
              // 这里可以等待一个Promise（如果finalizeInterview是异步获取总结）或直接跳转
              router.push('/summary'); // 假设总结页路由是 /summary
            }
          }
        }, 1000);
      }
    };
    const startInterviewInNewTab = () => {
      isPreparingInterview.value = true;
      currentSubtitle.value = '正在打开AI数字人面试官...';

      // 尝试在新标签页打开Gradio界面
      const newWindow = window.open(interviewerUrl.value, '_blank');

      if (newWindow) {
        newWindow.focus(); // 尝试将焦点给新标签页
        interviewInProgress.value = true;
        currentSubtitle.value = 'AI数字人面试官已在另一标签页打开。请完成面试后，返回此页面继续。';
        ElMessage.success('AI数字人面试官已在新标签页中打开。');
        stopLocalPreview(); // 面试开始，停止本地预览
        showUserVideoPreview.value = false; // 隐藏本地预览区域
        startTimer(); // 启动计时器
      } else {
        ElMessage.error('无法打开新标签页。请检查您的浏览器设置，允许弹出窗口。');
        currentSubtitle.value = '打开AI面试官失败，请检查浏览器设置。';
      }
      isPreparingInterview.value = false;
    };

    const confirmEndInterview = () => {
      ElMessageBox.confirm(
          '请确认您已在AI数字人面试官标签页完成所有面试环节。',
          '结束面试确认',
          {
            confirmButtonText: '是的，已完成并继续',
            cancelButtonText: '我还没完成',
            type: 'warning',
          }
      ).then(() => {
        // 用户确认完成
        proceedToNextStep();
      }).catch(() => {
        // 用户点击“我还没完成”
        ElMessage.info('请在AI数字人面试官标签页完成面试后，再返回此处继续。');
      });
    };

    const proceedToNextStep = () => {
      interviewInProgress.value = false;
      // 修改提示文本和路由
      currentSubtitle.value = 'AI数字人面试环节已结束，正在生成面试总结...';
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      // 假设 store.dispatch('completeVideoInterview'); 只是标记视频面试完成
      // 不再需要它来触发代码题，但可能需要它来记录某些状态
      store.dispatch('completeVideoInterview');

      // --- 直接导航到总结页面 ---
      router.push('/summary');
      ElMessage.success('即将查看您的面试总结。');
    };


    const startTimer = () => {
      let duration = store.state.timeRemaining || 30 * 60; // 默认30分钟
      if (duration <=0 ) duration = 30 * 60; // 如果vuex里是0或负数，重置

      store.commit('setTimeRemaining', duration); // 初始化或更新vuex中的时间

      timerInterval = setInterval(() => {
        const currentTimeRemaining = store.state.timeRemaining;
        if (currentTimeRemaining > 0) {
          store.commit('setTimeRemaining', currentTimeRemaining - 0.1 * 60); // 每次减少6秒
        } else {
          ElMessage.warning("面试参考时间已到！");
          // 时间到了，不自动跳转，让用户决定是否结束
          clearInterval(timerInterval);
          timerInterval = null;
          // 可以考虑给一个提示，让用户尽快结束面试
          currentSubtitle.value = "面试参考时间已结束，请尽快完成AI面试并返回。";
        }
      }, 6000);
    };

    onMounted(() => {
      console.log('InterviewView (New Tab mode) Mounted');
      if (showUserVideoPreview.value) {
        nextTick(() => { // 确保DOM元素已准备好
          getLocalPreview();
        });
      }
      currentSubtitle.value = '点击“开始面试”按钮，将在新标签页中启动AI数字人面试官。';
    });

    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      stopLocalPreview();
    });

    return {
      interviewInProgress,
      currentSubtitle,
      // interviewerUrl, // 模板中不再直接使用，startInterviewInNewTab 中使用
      startInterviewInNewTab, // 修改了方法名
      confirmEndInterview,   // 新的结束方法
      localUserVideoRef,
      localUserMediaActive,
      showUserVideoPreview,
      isPreparingInterview,
    };
  }
}
</script>

<style scoped>
.interviewer-container {
  position: relative;
  height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 移除了 .interviewer-video iframe 样式，因为iframe不再直接显示 */
.interviewer-video-placeholder { /* 用于显示提示信息 */
  width: 100%;
  height: 100%;
  background-color: #333;
  border-radius: var(--border-radius);
  display: flex; /* 使用flex来居中placeholder内容 */
  justify-content: center;
  align-items: center;
}

.placeholder {
  width: 80%; /* 调整宽度以适应内容 */
  max-width: 400px; /* 最大宽度 */
  text-align: center; /* 文本居中 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}

.placeholder .el-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.user-video {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  background-color: #555;
  border-radius: var(--border-radius);
  z-index: 10;
  overflow: hidden;
}
.user-video .video-element, .user-video .placeholder-overlay {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-video .placeholder-overlay {
  background-color: rgba(85, 85, 85, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}
.user-video .placeholder-overlay .el-icon {
  font-size: 30px;
  margin-bottom: 10px;
}
.video-element.hidden {
  display: none;
}


.text-overlay {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 15px;
  text-align: center;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  z-index: 15;
}

@media (max-width: 768px) {
  .interviewer-container {
    height: 50vh;
  }
  .user-video {
    width: 120px;
    height: 90px;
  }
}
</style>