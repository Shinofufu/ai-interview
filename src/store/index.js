import { createStore } from 'vuex'

export default createStore({
  state: {
    // 用户信息
    userInfo: {
      name: '',
      email: '',
      phone: '',
      experience: '',
      education: ''
    },
    // 面试进度
    progress: 0,
    // 面试时间（分钟）
    timeRemaining: 15,
    // 面试结果
    interviewResults: {
      totalTime: 0,
      completionRate: 0,
      codingAbility: 0,
      communicationSkill: 0,
      overallScore: 0,
      suggestion: ''
    }
  },
  getters: {
    userName(state) {
      return state.userInfo.name || '未填写'
    }
  },
  mutations: {
    setUserInfo(state, userInfo) {
      state.userInfo = { ...state.userInfo, ...userInfo }
    },
    setProgress(state, progress) {
      state.progress = progress
    },
    setTimeRemaining(state, time) {
      state.timeRemaining = time
    },
    setInterviewResults(state, results) {
      state.interviewResults = { ...state.interviewResults, ...results }
    }
  },
  actions: {
    // 提交简历信息
    submitResume({ commit }, userInfo) {
      commit('setUserInfo', userInfo)
      commit('setProgress', 33)
    },
    // 完成视频面试
    completeVideoInterview({ commit }) {
      commit('setProgress', 66)
    },
    // 提交代码题
    submitCoding({ commit }) {
      commit('setProgress', 100)
    },
    // 生成面试结果
    generateResults({ commit }, results) {
      commit('setInterviewResults', results)
    }
  },
  modules: {
  }
}) 