// src/views/LoginView.vue
<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>AI 面试平台登录</h2>
        </div>
      </template>
      <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-position="top"
          @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              clearable
              prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
              prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-item-flex-container">
            <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
            <el-link
                type="primary"
                :underline="false"
                @click="handleForgotPassword"
            >
              忘记密码?
            </el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
              type="primary"
              native-type="submit"
              style="width: 100%;"
              :loading="loading"
          >
            登 录
          </el-button>
        </el-form-item>
        <div class="form-footer">
          <el-text size="small">还没有账户?</el-text>
          <el-link type="primary" :underline="false" @click="handleRegister" style="margin-left: 5px;">
            立即注册
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
// 如果Element Plus的图标没有自动按需引入，可能需要手动导入
// import { User, Lock } from '@element-plus/icons-vue'; // 如果prefix-icon不显示，则取消注释

const router = useRouter();
const store = useStore(); // 如果需要用到vuex

const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false,
});

const loginRules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
});

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // --- 模拟登录请求 ---
        // 在实际应用中，这里会调用后端API进行认证
        // 例如: const response = await store.dispatch('user/login', loginForm);
        console.log('登录信息:', loginForm.username, loginForm.password);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟

        // 假设登录成功
        ElMessage.success('登录成功！');
        store.commit('setLoginStatus', true); // 假设Vuex中有一个mutation来设置登录状态
        store.commit('setUserInfo', { username: loginForm.username }); // 保存用户信息

        // 登录成功后跳转到首页或简历提交页
        router.push('/');

      } catch (error) {
        console.error('登录失败:', error);
        ElMessage.error(error.message || '登录失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    } else {
      ElMessage.error('请检查表单输入');
      return false;
    }
  });
};

const handleForgotPassword = () => {
  ElMessage.info('忘记密码功能暂未开放');
  // router.push('/forgot-password'); // 如果有忘记密码页面
};

const handleRegister = () => {
  ElMessage.info('跳转到注册页面');
  // router.push('/register'); // 如果有注册页面
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5; /* 与您App.vue中的body背景色一致 */
}

.login-card {
  width: 400px;
  padding: 20px;
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.form-footer {
  text-align: center;
  margin-top: 10px;
}
.form-item-flex-container {
  display: flex;
  justify-content: space-between; /* 两端对齐，项目之间的间隔相等 */
  align-items: center;          /* 垂直居中对齐 */
  width: 100%;                  /* 让容器宽度撑满 el-form-item */
}
</style>