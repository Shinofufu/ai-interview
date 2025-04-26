<template>
  <div class="progress-area">
    <div class="progress-info">
      <span class="task-name">{{ taskName }}</span>
      <el-progress :percentage="progress" :stroke-width="15" :show-text="false"></el-progress>
      <span class="progress-text">{{ progress }}%</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

export default {
  name: 'ProgressBar',
  setup() {
    const store = useStore()
    const route = useRoute()
    
    const progress = computed(() => store.state.progress)
    
    const taskName = computed(() => {
      switch (route.path) {
        case '/': return '当前任务：提交简历'
        case '/interview': return '当前任务：第一部分 - 视频面试'
        case '/coding': return '当前任务：第二部分 - 代码题'
        case '/summary': return '当前任务：面试总结'
        default: return '当前任务'
      }
    })
    
    return {
      progress,
      taskName
    }
  }
}
</script>

<style scoped>
.progress-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.task-name {
  min-width: 200px;
  font-size: 14px;
  color: var(--text-color);
}

.progress-text {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: bold;
}

:deep(.el-progress-bar__outer) {
  background-color: #e9ecef;
}

:deep(.el-progress-bar__inner) {
  background-color: var(--primary-color);
}
</style> 