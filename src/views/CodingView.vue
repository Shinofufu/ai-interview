<template>
  <div class="page-container">
    <app-sidebar position="left" />
    
    <div class="main-content">
      <progress-bar />
      
      <div class="main-container">
        <div class="content-card video-container">
          <div class="interviewer-video">
            <div class="video-placeholder">
              <el-icon><VideoCamera /></el-icon>
              <p>AI面试官</p>
            </div>
          </div>
          
          <div class="user-video">
            <div class="video-placeholder">
              <el-icon><Avatar /></el-icon>
              <p>用户摄像头</p>
            </div>
          </div>
        </div>
        
        <div class="content-card code-area">
          <div class="problem-description">
            <h3>代码题：{{ currentProblem.title }}</h3>
            <div v-html="currentProblem.description"></div>
          </div>
          
          <div class="code-editor">
            <el-input
              v-model="code"
              type="textarea"
              :rows="15"
              resize="none"
              spellcheck="false"
              placeholder="请在此输入您的代码..."
              class="code-textarea"
            />
          </div>
        </div>
      </div>
      
      <div class="controls">
        <el-button type="default" @click="runCode">运行代码</el-button>
        <el-button type="primary" @click="submitCode">提交</el-button>
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
import { ElMessage } from 'element-plus'
import AppSidebar from '../components/AppSidebar.vue'
import ProgressBar from '../components/ProgressBar.vue'

export default {
  name: 'CodingView',
  components: {
    AppSidebar,
    ProgressBar,
    VideoCamera,
    Avatar
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    
    // 模拟代码题
    const problems = [
      {
        id: 1,
        title: '两数之和',
        description: `<p>给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。</p>
        <p>你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。</p>
        <p>你可以按任意顺序返回答案。</p>
        <h4>示例：</h4>
        <pre>输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1]</pre>`
      }
    ]
    
    const currentProblem = ref(problems[0])
    const code = ref('')
    
    // 倒计时功能
    let timerInterval = null
    
    const startTimer = () => {
      timerInterval = setInterval(() => {
        if (store.state.timeRemaining > 0) {
          store.commit('setTimeRemaining', store.state.timeRemaining - 0.1)
        } else {
          clearInterval(timerInterval)
          submitCode()
        }
      }, 6000) // 每6秒减少0.1分钟
    }
    
    const runCode = () => {
      if (code.value.trim() === '') {
        ElMessage.warning('请先编写代码')
        return
      }
      
      ElMessage.success('代码运行成功')
    }
    
    const submitCode = () => {
      if (code.value.trim() === '') {
        ElMessage.warning('请先编写代码')
        return
      }
      
      store.dispatch('submitCoding')
      
      // 生成模拟结果
      const results = {
        totalTime: 30,
        completionRate: 85,
        codingAbility: 90,
        communicationSkill: 80,
        overallScore: 85,
        suggestion: '您的代码能力非常出色，但可以在沟通表达方面更加清晰，注意语速和逻辑性。'
      }
      
      store.dispatch('generateResults', results)
      router.push('/summary')
    }
    
    onMounted(() => {
      startTimer()
    })
    
    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    })
    
    return {
      currentProblem,
      code,
      runCode,
      submitCode
    }
  }
}
</script>

<style scoped>
.video-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.interviewer-video, .user-video {
  flex: 1;
  height: 200px;
  background-color: #333;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}

.video-placeholder .el-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.code-area {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.problem-description {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd;
}

.problem-description h3 {
  margin-bottom: 15px;
  color: var(--text-color);
}

.code-editor {
  flex: 1;
}

.code-textarea {
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

:deep(.el-textarea__inner) {
  font-family: 'Courier New', monospace;
  padding: 12px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .video-container {
    flex-direction: column;
    height: auto;
  }
  
  .interviewer-video, .user-video {
    height: 150px;
  }
}
</style> 