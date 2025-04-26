<template>
  <div class="page-container">
    <app-sidebar position="left" />
    
    <div class="main-content">
      <progress-bar />
      
      <div class="main-container">
        <div class="content-card interviewer-container">
          <div class="interviewer-video">
            <iframe 
              src="https://example.com/ai-interviewer" 
              frameborder="0" 
              allowfullscreen
              v-if="interviewStarted"
            ></iframe>
            <div class="placeholder" v-else>
              <el-icon><VideoCamera /></el-icon>
              <p>点击开始面试按钮启动AI面试官</p>
            </div>
          </div>
          
          <div class="user-video">
            <div id="user-camera">
              <el-icon><Avatar /></el-icon>
              <p>用户摄像头</p>
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
          @click="startInterview" 
          v-if="!interviewStarted"
        >
          开始面试
        </el-button>
        <el-button 
          type="primary" 
          @click="nextQuestion" 
          v-else
        >
          下一题
        </el-button>
      </div>
    </div>
    
    <app-sidebar position="right" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { VideoCamera, Avatar } from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import ProgressBar from '../components/ProgressBar.vue'

export default {
  name: 'InterviewView',
  components: {
    AppSidebar,
    ProgressBar,
    VideoCamera,
    Avatar
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const interviewStarted = ref(false)
    const currentSubtitle = ref('点击"开始面试"按钮，开始与AI面试官对话...')
    
    // 模拟面试问题
    const questions = [
      '请简要介绍一下您自己和您的技术背景。',
      '您能描述一下您参与过的最具挑战性的项目吗？',
      '您如何处理团队中的冲突？',
      '您对我们公司了解多少？为什么想加入我们？'
    ]
    
    const currentQuestionIndex = ref(0)
    
    const startInterview = () => {
      interviewStarted.value = true
      currentSubtitle.value = questions[currentQuestionIndex.value]
      
      // 启动计时器
      startTimer()
    }
    
    const nextQuestion = () => {
      currentQuestionIndex.value++
      
      if (currentQuestionIndex.value < questions.length) {
        currentSubtitle.value = questions[currentQuestionIndex.value]
      } else {
        // 完成视频面试，前往代码题
        store.dispatch('completeVideoInterview')
        router.push('/coding')
      }
    }
    
    // 倒计时功能
    let timerInterval = null
    
    const startTimer = () => {
      timerInterval = setInterval(() => {
        if (store.state.timeRemaining > 0) {
          store.commit('setTimeRemaining', store.state.timeRemaining - 0.1)
        } else {
          clearInterval(timerInterval)
          nextQuestion()
        }
      }, 6000) // 每6秒减少0.1分钟（模拟）
    }
    
    onMounted(() => {
      // 初始化摄像头（实际项目中需要使用WebRTC或类似技术）
      console.log('初始化摄像头...')
    })
    
    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    })
    
    return {
      interviewStarted,
      currentSubtitle,
      startInterview,
      nextQuestion
    }
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

.interviewer-video {
  width: 100%;
  height: 100%;
  background-color: #333;
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
}

.interviewer-video iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.placeholder {
  width: 100%;
  height: 100%;
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
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: #fff;
}

.user-video .el-icon {
  font-size: 30px;
  margin-bottom: 10px;
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