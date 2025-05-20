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
import {computed, onMounted, ref} from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import {ElLoading, ElMessage} from 'element-plus'
import AppSidebar from '../components/AppSidebar.vue'
import ProgressBar from '../components/ProgressBar.vue'
import axios from "axios";

export default {
  name: 'SummaryView',
  components: {
    AppSidebar,
    ProgressBar
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    const results = computed(() => store.state.interviewResults || {
      // 提供一些默认值，防止模板在数据加载前报错
      totalTime: 0,
      completionRate: 0,
      communicationSkill: 0,
      overallScore: 0,
      suggestion: '正在生成总结...'
    });

    const isLoadingSummary = ref(true); // 控制加载状态
    onMounted(async () => {
      isLoadingSummary.value = true;
      const loadingInstance = ElLoading.service({
        text: '正在获取面试评估结果...',
        background: 'rgba(0, 0, 0, 0.8)'
      });

      try {


        const response = await axios.post('http://localhost:8123/api/ai/generate-evaluation');

        // 后端返回 InterviewEvaluationResult DTO
        const evaluationData = response.data;

        // 更新 Vuex store 中的 interviewResults
        // 你需要一个 mutation (例如 'setInterviewResults') 来处理这个
        // 确保 evaluationData 的字段名与 store.state.interviewResults 中的 key 匹配
        // 或者在这里进行映射
        const newResults = {
          ...store.state.interviewResults, // 保留可能已有的字段，比如 totalTime
          completionRate: evaluationData.completionRate || 0,         // 现在直接从后端获取
          communicationSkill: evaluationData.communicationSkill || 0, // 现在直接从后端获取
          codingAbility: evaluationData.codingAbility || 0,           // 后端JSON键是 "codingAbility"
          overallScore: evaluationData.overallScore || 0,           // 后端JSON键是 "overallScore"
          suggestion: evaluationData.suggestion || '暂无建议。'      // 后端JSON键是 "suggestion"
        };
        store.commit('setInterviewResults', newResults); // 或者 dispatch 一个 action

        console.log('面试评估结果已更新到 Vuex store:', newResults);
        ElMessage.success('面试评估已加载！');

      } catch (error) {
        console.error('获取面试评估失败:', error);
        let errorMessage = '获取面试评估失败';
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          errorMessage += `: ${error.response.status} - ${typeof errorData === 'string' ? errorData : (errorData?.message || error.message)}`;
        } else if (error.request) {
          errorMessage += ': 无法连接到服务器';
        } else {
          errorMessage += `: ${error.message}`;
        }
        ElMessage.error(errorMessage);
        // 设置一个错误提示到 suggestion
        store.commit('setInterviewResults', {
          ...results.value,
          suggestion: '获取评估结果失败，请稍后重试。'
        });
      } finally {
        loadingInstance.close();
        isLoadingSummary.value = false;
      }
    });
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