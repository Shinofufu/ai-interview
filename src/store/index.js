// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    userInfo: {
      name: '',
      email: '',
      phone: '',
      experience: '', // 建议与后端 InterviewSetupRequest 的 experience 结构对齐
      education: ''   // 建议与后端 InterviewSetupRequest 的 educationSummary 对齐
    },
    progress: 0,
    // --- 时间相关状态修改 ---
    interviewTotalDurationSeconds: 15 * 60, // 默认15分钟，以秒为单位
    timeRemainingSeconds: 15 * 60,        // 剩余时间，以秒为单位
    isInterviewActive: false,            // 面试是否正在进行
    // --- 时间相关状态修改结束 ---
    interviewResults: {
      totalTime: 0, // 这个可以考虑在面试结束时根据 interviewTotalDurationSeconds - timeRemainingSeconds 计算
      completionRate: 0,
      codingAbility: 0,
      communicationSkill: 0,
      overallScore: 0,
      suggestion: '',
    }
  },
  getters: {
    userName(state) {
      return state.userInfo.name || '未填写';
    },
    // --- 新增或修改的时间相关 Getters ---
    timeRemainingFormatted(state) { // 用于显示 xx:xx 格式
      const minutes = Math.floor(state.timeRemainingSeconds / 60);
      const seconds = state.timeRemainingSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
    isInterviewActive: state => state.isInterviewActive,
    interviewProgressPercentage: state => { // 用于进度条
      if (state.interviewTotalDurationSeconds === 0) return 0;
      const elapsedSeconds = state.interviewTotalDurationSeconds - state.timeRemainingSeconds;
      return Math.max(0, Math.min(100, (elapsedSeconds / state.interviewTotalDurationSeconds) * 100));
    },
    // --- Getters结束 ---
  },
  mutations: {
    setUserInfo(state, userInfo) {
      state.userInfo = { ...state.userInfo, ...userInfo };
    },
    setProgress(state, progress) {
      state.progress = progress;
    },
    // --- 时间相关 Mutations ---
    SET_INTERVIEW_TOTAL_DURATION(state, seconds) {
      state.interviewTotalDurationSeconds = seconds;
    },
    SET_TIME_REMAINING_SECONDS(state, seconds) {
      state.timeRemainingSeconds = seconds;
    },
    DECREMENT_TIME_REMAINING_SECONDS(state) {
      if (state.timeRemainingSeconds > 0) {
        state.timeRemainingSeconds--;
      }
    },
    SET_INTERVIEW_ACTIVE(state, isActive) {
      state.isInterviewActive = isActive;
    },
    // --- 时间相关 Mutations 结束 ---
    setInterviewResults(state, results) {
      // 计算实际面试用时并存入
      const actualTimeTakenSeconds = state.interviewTotalDurationSeconds - state.timeRemainingSeconds;
      state.interviewResults = {
        ...state.interviewResults,
        ...results,
        totalTime: Math.round(actualTimeTakenSeconds / 60) // 存为分钟
      };
    }
  },
  actions: {
    // 这个 action 在 ResumeView.vue 提交简历并准备开始面试时调用
    initializeAndStartInterview({ commit }, payload) {
      commit('setUserInfo', payload.userInfo); // <--- 确保这里的 payload.userInfo 包含 name
      commit('setProgress', 33);

      const durationSeconds = (payload.initialDurationMinutes || 15) * 60;
      commit('SET_INTERVIEW_TOTAL_DURATION', durationSeconds);
      commit('SET_TIME_REMAINING_SECONDS', durationSeconds);
      commit('SET_INTERVIEW_ACTIVE', true);

      commit('setInterviewResults', { /* ... 重置旧结果 ... */ });
      console.log("Vuex: 面试初始化完成, 用户信息已设置, 计时器已激活。", payload.userInfo);
    },
    // 当面试实际结束时（例如时间到，或用户主动结束）
    finalizeInterview({ commit}) {
      commit('SET_INTERVIEW_ACTIVE', false); // 停止计时器
      // 可以在这里触发获取AI总结的API调用，然后用结果commit('setInterviewResults', evaluationData)
      // 例如:
      // const evaluationData = await yourApiService.getEvaluation(state.interviewTranscript, state.userInfo);
      // commit('setInterviewResults', evaluationData);
      // 注意：totalTime 应该在 setInterviewResults 中根据剩余时间计算
      console.log("Vuex: 面试已结束。");
    },

  },
  modules: {
  }
})