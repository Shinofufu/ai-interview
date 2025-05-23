// src/store/index.js
import { createStore } from 'vuex';
import { ElMessage } from 'element-plus'; // 引入 ElMessage，如果 action 中需要
// import router from '../router'; // 避免在 store 中直接导入 router

export default createStore({
  state: {
    // --- 您已有的 state ---
    progress: 0,
    timeRemaining: 15,
    timeRemainingSeconds: 15 * 60,
    isInterviewActive: false,
    userName: '', // 考虑从 currentUser 获取
    userEmail: '', // 考虑从 currentUser 获取
    resumeData: null,
    interviewResults: {
      totalTime: 0,
      completionRate: 0,
      communicationSkill: 0,
      overallScore: 0,
      suggestion: '正在生成总结...',
      codingAbility:0,
      expectedPosition: '', // 新增，用于显示在总结页和保存到历史
      selectedInterviewTags: [], // 新增，用于显示在总结页和保存到历史
    },
    analyzedResumeData: null,
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true' || false,
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,

    // --- 新增：面试历史记录 state ---
    interviewHistory: JSON.parse(localStorage.getItem('interviewHistory')) || [],
  },
  getters: {
    // --- 您已有的 getters ---
    timeRemainingFormatted(state) {
      const minutes = Math.floor(state.timeRemainingSeconds / 60);
      const seconds = state.timeRemainingSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
    isInterviewActive: state => state.isInterviewActive,
    userName: state => state.currentUser ? state.currentUser.username : (state.userName || '用户'), //优先从currentUser获取
    isUserAuthenticated: state => state.isAuthenticated,
    getCurrentUser: state => state.currentUser,

    // --- 新增：获取历史记录的 getter ---
    getInterviewHistory: state => state.interviewHistory,
    // 获取单条历史记录详情 (如果需要)
    getInterviewHistoryById: (state) => (id) => {
      return state.interviewHistory.find(record => record.id === id);
    }
  },
  mutations: {
    // --- 您已有的 mutations ---
    setProgress(state, value) {
      state.progress = value;
    },
    setTimeRemaining(state, minutes) {
      state.timeRemaining = minutes;
      state.timeRemainingSeconds = minutes * 60;
    },
    DECREMENT_TIME_REMAINING_SECONDS(state) {
      if (state.timeRemainingSeconds > 0) {
        state.timeRemainingSeconds--;
        state.timeRemaining = Math.ceil(state.timeRemainingSeconds / 60);
      }
    },
    SET_IS_INTERVIEW_ACTIVE(state, isActive) {
      state.isInterviewActive = isActive;
    },
    setUserName(state, name) { // 此 mutation 可能可以被 setUserInfo 替代或整合
      state.userName = name;
    },
    setUserEmail(state, email) {
      state.userEmail = email;
    },
    setResumeData(state, data) {
      state.resumeData = data;
    },
    setInterviewResults(state, results) {
      state.interviewResults = { ...state.interviewResults, ...results };
    },
    resetInterviewState(state) {
      state.progress = 0;
      state.timeRemaining = 15;
      state.timeRemainingSeconds = 15 * 60;
      state.isInterviewActive = false;
      // 用户名和邮箱通常在登录后不应被轻易重置，除非是登出操作
      // state.userName = '';
      // state.userEmail = '';
      state.resumeData = null;
      state.interviewResults = { // 重置为包含所有字段的初始值
        totalTime: 0,
        completionRate: 0,
        communicationSkill: 0,
        overallScore: 0,
        suggestion: '正在生成总结...',
        codingAbility:0,
        expectedPosition: '',
        selectedInterviewTags: [],
      };
      state.analyzedResumeData = null;
    },
    setAnalyzedResumeData(state, data) {
      state.analyzedResumeData = data;
      if (data && data.name) state.userName = data.name; // 仍然可以用于简历提交时的临时显示
      if (data && data.email) state.userEmail = data.email;
      if (data && data.expectedPosition) state.interviewResults.expectedPosition = data.expectedPosition; // 从简历分析中获取期望岗位
    },
    setLoginStatus(state, isAuthenticated) {
      state.isAuthenticated = isAuthenticated;
      if (isAuthenticated) {
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        localStorage.removeItem('isAuthenticated');
        // state.currentUser = null; // 在 clearAuthData 中处理
      }
    },
    setUserInfo(state, userInfo) {
      state.currentUser = userInfo;
      if (userInfo) {
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        if (userInfo.username) {
          state.userName = userInfo.username; // 确保 userName 也被更新
        }
      } else { // 如果 userInfo 为 null (例如登出时)
        localStorage.removeItem('currentUser');
      }
    },
    clearAuthData(state) {
      state.isAuthenticated = false;
      state.currentUser = null;
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      state.userName = '';
      state.userEmail = '';
      // 清理可能与用户相关的面试状态，但历史记录保留
      state.progress = 0;
      state.timeRemaining = 15;
      state.timeRemainingSeconds = 15 * 60;
      state.isInterviewActive = false;
      state.resumeData = null;
      state.interviewResults = { /* 重置 interviewResults */
        totalTime: 0, completionRate: 0, communicationSkill: 0, overallScore: 0,
        suggestion: '', codingAbility:0, expectedPosition: '', selectedInterviewTags: []
      };
      state.analyzedResumeData = null;
    },

    // --- 新增：历史记录相关的 mutations ---
    ADD_INTERVIEW_TO_HISTORY(state, interviewRecord) {
      state.interviewHistory.unshift(interviewRecord); // 添加到数组开头，最新的在最前面
      localStorage.setItem('interviewHistory', JSON.stringify(state.interviewHistory));
    },
    DELETE_INTERVIEW_HISTORY_ITEM(state, recordId) {
      state.interviewHistory = state.interviewHistory.filter(record => record.id !== recordId);
      localStorage.setItem('interviewHistory', JSON.stringify(state.interviewHistory));
    },
    CLEAR_ALL_INTERVIEW_HISTORY(state) {
      state.interviewHistory = [];
      localStorage.removeItem('interviewHistory');
    }
  },
  actions: {
    // --- 您已有的 actions ---
    initializeAndStartInterview({ commit, state }, payload) {
      if (payload.userInfo) {
        commit('setUserName', payload.userInfo.name);
        commit('setUserEmail', payload.userInfo.email);
        // 将期望岗位和选择的标签也存入当前的 interviewResults，以便后续保存到历史
        let currentResults = { ...state.interviewResults };
        if(payload.userInfo.expectedPosition) {
          currentResults.expectedPosition = payload.userInfo.expectedPosition;
        }
        if(payload.selectedInterviewTags) { // 假设 payload 中传递了选中的标签
          currentResults.selectedInterviewTags = payload.selectedInterviewTags;
        }
        commit('setInterviewResults', currentResults);
      }
      const duration = payload.initialDurationMinutes || 15;
      commit('setTimeRemaining', duration);
      commit('setProgress', 5);
      commit('SET_IS_INTERVIEW_ACTIVE', true);
    },
    completeVideoInterview({ commit }) {
      commit('setProgress', 60);
    },
    finalizeInterview({ commit, state }) { // 修改这里以保存历史记录
      commit('setProgress', 100);
      commit('SET_IS_INTERVIEW_ACTIVE', false);

      // 准备要保存到历史的记录
      const now = new Date();
      const recordToSave = {
        id: `interview_${now.getTime()}_${Math.random().toString(36).substr(2, 5)}`, // 生成唯一ID
        interviewDate: now.toISOString(),
        userName: state.currentUser ? state.currentUser.username : state.userName, // 优先使用登录用户名
        // 从 state.interviewResults 中获取总结数据
        expectedPosition: state.interviewResults.expectedPosition || '未指定',
        overallScore: state.interviewResults.overallScore || 0,
        totalTime: state.interviewResults.totalTime || 0,
        completionRate: state.interviewResults.completionRate || 0,
        communicationSkill: state.interviewResults.communicationSkill || 0,
        codingAbility: state.interviewResults.codingAbility || 0,
        suggestion: state.interviewResults.suggestion || '无',
        selectedInterviewTags: state.interviewResults.selectedInterviewTags || [],
      };
      commit('ADD_INTERVIEW_TO_HISTORY', recordToSave);
      ElMessage.success('本次面试总结已保存到历史记录！');
    },
    logout({ commit }) {
      commit('clearAuthData');
      // 路由跳转由组件处理
      console.log('User logged out from Vuex action');
    },

    // --- 新增：历史记录相关的 actions (如果需要异步操作) ---
    deleteHistoryItem({ commit }, recordId) {
      // 这里可以添加与后端同步删除的逻辑（如果历史记录也存后端的话）
      commit('DELETE_INTERVIEW_HISTORY_ITEM', recordId);
      ElMessage.success('历史记录已删除。');
    },
    clearAllHistory({ commit }) {
      // 这里可以添加与后端同步删除的逻辑
      commit('CLEAR_ALL_INTERVIEW_HISTORY');
      ElMessage.success('所有历史记录已清空。');
    }
  },
  modules: {}
});