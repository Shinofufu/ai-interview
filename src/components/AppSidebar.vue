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
          <p><strong>剩余时间：</strong>{{ timeRemainingFormattedString }}</p>
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
        case '/': return 0; // 提交简历页
        case '/interview': return 1; // 面试中（自我介绍、专业问题、情景模拟可能都在这个页面）
                                     // 您可能需要更细致的步骤划分，例如通过面试内部状态
          // case '/coding': return 2; // 如果有单独的编码题页面
        case '/summary': return 4; // 面试总结页 (假设跳过了2,3步，或者它们是/interview的一部分)
        default:
          // 如果在面试页，但不是特定子路由，可以根据progress来判断
          if (route.path.startsWith('/interview')) { // 更通用地判断是否在面试中
            // 这里可以根据更详细的面试阶段状态来设置activeStep，
            // 例如，如果面试分为自我介绍(1)、专业提问(2)、情景模拟(3)等阶段
            // 当前简单处理为只要在/interview就是第1步之后（或特定值）
            if (store.state.progress >= 66) return 3; // 情景模拟阶段
            if (store.state.progress >= 33) return 2; // 专业问题阶段 (假设33代表自我介绍完成)
            return 1; // 自我介绍阶段
          }
          return 0; // 其他未知路径或初始状态
      }
    })
    
    const userName = computed(() => store.getters.userName)
    const timeRemainingFormattedString = computed(() => store.getters.timeRemainingFormatted); // 使用新的getter

    const totalTimeInMinutes = computed(() => {
      // 确保 interviewResults 和 totalTime 存在且是数字
      return (store.state.interviewResults && typeof store.state.interviewResults.totalTime === 'number')
          ? store.state.interviewResults.totalTime
          : 0; // 提供默认值
    });
    const formatTotalTime = (minutes) => {
      if (typeof minutes !== 'number' || isNaN(minutes)) { // 增加校验
        return '00:00'; // 或其他默认显示
      }
      const mins = Math.floor(minutes);
      const secsPart = Math.round((minutes - mins) * 60); // 注意：如果totalTime已经是整数分钟，这里secsPart会是0
      // 如果 totalTime 就是整数分钟，可以直接显示，或者也格式化为 mm:00
      return `${String(mins).padStart(2, '0')}:${String(secsPart).padStart(2, '0')}`;
    };
    
    return {
      activeStep,
      userName,
      timeRemainingFormattedString, // <--- 暴露格式化好的剩余时间
      totalTime: totalTimeInMinutes, // <--- 暴露处理过的总时长（分钟）
      formatTime: formatTotalTime   // <--- 暴露处理过的 totalTime 格式化函数
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