<template>
  <div class="page-container">
    <app-sidebar position="left" />
    
    <div class="main-content">
      <progress-bar />
      
      <div class="main-container">
        <div class="content-card resume-form">
          <h2>提交您的简历</h2>
          
          <el-form :model="formData" :rules="rules" ref="resumeForm" label-position="top">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入您的姓名" />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入您的邮箱" />
            </el-form-item>
            
            <el-form-item label="电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入您的电话号码" />
            </el-form-item>
            
            <el-form-item label="工作经历" prop="experience">
              <el-input
                v-model="formData.experience"
                type="textarea"
                :rows="4"
                placeholder="请输入您的工作经历"
              />
            </el-form-item>
            
            <el-form-item label="教育背景" prop="education">
              <el-input
                v-model="formData.education"
                type="textarea"
                :rows="4"
                placeholder="请输入您的教育背景"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <div class="controls">
        <el-button type="primary" @click="submitResume">提交并开始面试</el-button>
      </div>
    </div>
    
    <app-sidebar position="right" />
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import ProgressBar from '../components/ProgressBar.vue'

export default {
  name: 'ResumeView',
  components: {
    AppSidebar,
    ProgressBar
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const resumeForm = ref(null)
    
    const formData = reactive({
      name: '',
      email: '',
      phone: '',
      experience: '',
      education: ''
    })
    
    const rules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入电话号码', trigger: 'blur' }
      ]
    }
    
    const submitResume = () => {
      resumeForm.value.validate(valid => {
        if (valid) {
          store.dispatch('submitResume', formData)
          router.push('/interview')
        }
      })
    }
    
    return {
      formData,
      rules,
      resumeForm,
      submitResume
    }
  }
}
</script>

<style scoped>
.resume-form {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.resume-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--text-color);
}
</style> 