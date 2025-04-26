<template>
  <div class="sidebar" :class="{ 'sidebar-left': position === 'left', 'sidebar-right': position === 'right' }">
    <template v-if="position === 'left'">
      <div class="sidebar-header">
        <h3>面试流程</h3>
      </div>
      <div class="sidebar-content">
        <el-steps direction="vertical" :active="activeStep">
          <el-step title="提交简历" />
          <el-step title="自我介绍" />
          <el-step title="专业问题" />
          <el-step title="情景模拟" />
          <el-step v-if="$route.path === '/summary'" title="面试总结" />
        </el-steps>
      </div>
    </template>
    
    <template v-else>
      <div class="sidebar-header">
        <h3>面试信息</h3>
      </div>
      <div class="sidebar-content">
        <p><strong>姓名：</strong>{{ userName }}</p>
        <template v-if="$route.path !== '/summary'">
          <p><strong>剩余时间：</strong>{{ formatTime(timeRemaining) }}</p>
        </template>
        <template v-else>
          <p><strong>总时长：</strong>{{ formatTime(totalTime) }}</p>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

export default {
  name: 'AppSidebar',
  props: {
    position: {
      type: String,
      required: true,
      validator: (value) => ['left', 'right'].includes(value)
    }
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    
    const activeStep = computed(() => {
      switch (route.path) {
        case '/': return 0
        case '/interview': return 1
        case '/coding': return 2
        case '/summary': return 4
        default: return 0
      }
    })
    
    const userName = computed(() => store.getters.userName)
    const timeRemaining = computed(() => store.state.timeRemaining)
    const totalTime = computed(() => store.state.interviewResults.totalTime)
    
    const formatTime = (minutes) => {
      const mins = Math.floor(minutes)
      const secs = Math.round((minutes - mins) * 60)
      return `${mins}:${secs < 10 ? '0' + secs : secs}`
    }
    
    return {
      activeStep,
      userName,
      timeRemaining,
      totalTime,
      formatTime
    }
  }
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.sidebar-header h3 {
  font-size: 18px;
  color: var(--text-color);
  margin: 0;
}

.sidebar-content {
  flex: 1;
}

.sidebar-content p {
  margin-bottom: 15px;
  font-size: 14px;
  color: var(--light-text);
}

.sidebar-content strong {
  color: var(--text-color);
}
</style> 