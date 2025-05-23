// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';
import {ElMessage} from "element-plus";

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'resume',
    component: () => import('../views/ResumeView.vue'),
    meta: { requiresAuth: true, title: '提交简历' } // 添加 title
  },
  {
    path: '/interview',
    name: 'interview',
    component: () => import('../views/InterviewView.vue'),
    meta: { requiresAuth: true, title: '进行面试' }
  },
  {
    path: '/summary',
    name: 'summary',
    component: () => import('../views/SummaryView.vue'),
    meta: { requiresAuth: true, title: '面试总结' }
  },
  { // 新增历史记录页路由
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
    meta: { requiresAuth: true, title: '面试历史' } // 需要认证，并添加标题
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isUserAuthenticated;
  const pageTitle = to.meta.title || 'AI 面试平台'; // 设置页面标题
  document.title = pageTitle;

  if (to.meta.requiresAuth && !isAuthenticated) {
    ElMessage.warning('请先登录后再访问！');
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'resume' });
  } else {
    next();
  }
});

export default router;