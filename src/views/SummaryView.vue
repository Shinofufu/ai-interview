<template>
  <div class="page-container">
    <app-sidebar position="left" />
    
    <div class="main-content">
      <progress-bar />
      
      <div class="main-container">
        <div class="content-card summary-box">
          <h2>面试总结</h2>
          
          <p class="summary-intro">感谢您参与本次AI面试！以下是您的表现总结：</p>
          
          <div class="summary-details">
            <div class="summary-item">
              <span class="item-label">总时长：</span>
              <span class="item-value">{{ results.totalTime }}分钟</span>
            </div>
            
            <div class="summary-item">
              <span class="item-label">回答完整度：</span>
              <el-progress
                :percentage="results.completionRate"
                :color="getColorForScore(results.completionRate)"
                :format="format"
                class="summary-progress"
              ></el-progress>
            </div>
            
            <div class="summary-item">
              <span class="item-label">代码能力：</span>
              <el-progress
                :percentage="results.codingAbility"
                :color="getColorForScore(results.codingAbility)"
                :format="format"
                class="summary-progress"
              ></el-progress>
            </div>
            
            <div class="summary-item">
              <span class="item-label">沟通表达：</span>
              <el-progress
                :percentage="results.communicationSkill"
                :color="getColorForScore(results.communicationSkill)"
                :format="format"
                class="summary-progress"
              ></el-progress>
            </div>
          </div>
          
          <div class="overall-score">
            <div class="score-circle">
              <div class="score-value">{{ results.overallScore }}</div>
              <div class="score-label">综合评分</div>
            </div>
          </div>
          
          <div class="suggestion-box">
            <h3>建议：</h3>
            <p>{{ results.suggestion }}</p>
          </div>
        </div>
      </div>
      
      <div class="controls">
        <el-button type="default" @click="downloadReport">下载报告</el-button>
        <el-button type="primary" @click="restartInterview">重新开始</el-button>
      </div>
    </div>
    
    <app-sidebar position="right" />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppSidebar from '../components/AppSidebar.vue'
import ProgressBar from '../components/ProgressBar.vue'

export default {
  name: 'SummaryView',
  components: {
    AppSidebar,
    ProgressBar
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const results = computed(() => store.state.interviewResults)
    
    const getColorForScore = (score) => {
      if (score >= 90) return '#67C23A'
      if (score >= 75) return '#409EFF'
      if (score >= 60) return '#E6A23C'
      return '#F56C6C'
    }
    
    const format = (percentage) => {
      return `${percentage}%`
    }
    
    const downloadReport = () => {
      ElMessage.success('报告已生成，正在下载...')
      // 这里实际项目中需要调用后端API生成报告
    }
    
    const restartInterview = () => {
      // 重置状态
      store.commit('setProgress', 0)
      store.commit('setTimeRemaining', 15)
      router.push('/')
    }
    
    return {
      results,
      getColorForScore,
      format,
      downloadReport,
      restartInterview
    }
  }
}
</script>

<style scoped>
.summary-box {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.summary-box h2 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--text-color);
}

.summary-intro {
  text-align: center;
  color: var(--light-text);
  margin-bottom: 30px;
}

.summary-details {
  margin-bottom: 40px;
}

.summary-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.item-label {
  width: 120px;
  font-weight: bold;
  color: var(--text-color);
}

.item-value {
  color: var(--light-text);
}

.summary-progress {
  flex: 1;
}

.overall-score {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.score-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.score-value {
  font-size: 50px;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  margin-top: 10px;
  font-size: 14px;
}

.suggestion-box {
  background-color: #f9f9f9;
  border-left: 4px solid var(--primary-color);
  padding: 15px;
  border-radius: 4px;
}

.suggestion-box h3 {
  margin-bottom: 10px;
  color: var(--text-color);
}

.suggestion-box p {
  color: var(--light-text);
  line-height: 1.6;
}
</style> 