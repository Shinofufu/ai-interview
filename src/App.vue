// src/App.vue
<template>
  <el-config-provider :locale="locale">
    <div v-if="!isLoginPage" class="common-layout">
      <el-container style="height: 100vh;">
        <el-header class="app-header">
          <div class="header-content">
            <div class="logo-area">
              <img alt="Vue logo" src="./assets/logo.png" class="logo-img">
              <span class="platform-title">AI 面试平台</span>
            </div>
            <div class="user-actions">
              <el-dropdown @command="handleUserCommand" v-if="isAuthenticated" trigger="click">
                <span class="el-dropdown-link">
                  欢迎, {{ currentUser?.username || '用户' }}
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="resume" :icon="DocumentAdd">开始新面试</el-dropdown-item>
                    <el-dropdown-item command="history" :icon="Clock">面试历史</el-dropdown-item>
                    <el-dropdown-item command="profile" :icon="UserFilled" disabled>个人中心</el-dropdown-item>
                    <el-dropdown-item command="settings" :icon="Setting" disabled>设置</el-dropdown-item>
                    <el-dropdown-item command="logout" divided :icon="SwitchButton">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button v-else type="primary" @click="goToLogin" :icon="Promotion">登录/注册</el-button>
            </div>
          </div>
        </el-header>
        <el-main class="app-main">
          <router-view v-slot="{ Component, route: currentRoute }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="currentRoute.path" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </div>
    <div v-else class="login-layout">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="currentRoute.path" />
        </transition>
      </router-view>
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { ElConfigProvider, ElMessage } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { ArrowDown, DocumentAdd, Clock, UserFilled, Setting, SwitchButton, Promotion } from '@element-plus/icons-vue'; // 确保 Promotion 已导入

const store = useStore();
const router = useRouter();
const route = useRoute(); // useRoute() 用于获取当前路由信息

const locale = zhCn;

const isAuthenticated = computed(() => store.getters.isUserAuthenticated);
const currentUser = computed(() => store.getters.getCurrentUser);

const isLoginPage = computed(() => route.name === 'login' || route.name === 'register');

const handleUserCommand = (command) => {
  console.log('Dropdown command received:', command); // 添加日志，看命令是否收到
  switch (command) {
    case 'logout':
      store.dispatch('logout').then(() => {
        router.push({ name: 'login' }); // 使用 name 跳转更可靠
        ElMessage.success('您已成功退出登录！');
      });
      break;
    case 'resume':
      // 如果当前已在 resume 页，router.push('/') 可能不会强制刷新组件
      // 使用 router.push({ name: 'resume' }) 并配合 router-view 的 :key 可能会更好
      if (route.name === 'resume') {
        // 如果已经在简历页，可能需要一种方式来“重置”或重新加载
        // 简单地 ElMessage 提示，或者可以考虑 window.location.reload() (不推荐)
        // 或者在 ResumeView 内部提供一个重置方法，并通过事件调用
        ElMessage.info('您已在简历提交页面。如需重新开始，请使用页面内重置功能。');
        // 或者强制导航，如果组件有 :key="$route.fullPath"
        // router.push({ name: 'resume', force: true }); // Vue Router 没有 force 选项
        // router.replace({ path: '/redirect' + route.fullPath }) // 复杂的方式
      } else {
        router.push({ name: 'resume' });
      }
      break;
    case 'history':
      router.push({ name: 'history' });
      break;
    case 'profile':
      ElMessage.info('个人中心功能暂未开放');
      break;
    case 'settings':
      ElMessage.info('设置功能暂未开放');
      break;
    default:
      console.warn('Unknown dropdown command:', command);
  }
};

const goToLogin = () => {
  router.push({ name: 'login' });
};

</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f0f2f5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease; /* 动画时间可以调整 */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.login-layout, .common-layout {
  min-height: 100vh;
  width: 100%;
}
.common-layout .el-container {
  height: 100vh; /* 确保容器占满视口高度 */
}

.app-header {
  background-color: #ffffff;
  color: #333;
  line-height: 60px;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  display: flex; /* 使 header-content 可以垂直居中 */
  align-items: center; /* 垂直居中 header-content */
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%; /* 确保 header-content 撑满 header */
}

.logo-area {
  display: flex;
  align-items: center;
  cursor: pointer; /* Logo区域可点击返回首页 */
}
.logo-area img { /* 直接使用 .logo-area img 选择器 */
  height: 32px;
  width: auto;
  margin-right: 10px;
}
.platform-title {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.user-actions {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  outline: none; /* 移除点击时的轮廓 */
}
.el-dropdown-link:hover {
  color: var(--el-color-primary-light-3);
}
.el-dropdown-link .el-icon--right { /* 为下拉箭头图标添加一个类名选择器 */
  margin-left: 5px;
}


.app-main {
  background-color: var(--el-bg-color-page);
  padding: 0; /* 移除 el-main 的 padding，让页面组件自己控制 */
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
/* router-view 的直接包裹元素 (例如 transition) */
.app-main > div {
  flex-grow: 1;
  display: flex;
  flex-direction: column; /* 确保页面容器可以继承 flex 特性 */
  /* overflow: hidden; */ /* 避免双重滚动条，让页面自己处理滚动 */
}
/* 更具体地，如果你的页面组件根元素是 .page-container 或 .resume-page-container */
.app-main > div > div[class*="-page-container"] {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>