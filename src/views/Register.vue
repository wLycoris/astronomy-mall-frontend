<template>
  <div class="register-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>
    
    <!-- 注册卡片 -->
    <div class="register-card glass-effect">
      <div class="card-header">
        <router-link to="/login" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回登录
        </router-link>
        <h2 class="title">创建账户</h2>
        <p class="subtitle">加入天文探索者社区</p>
      </div>
      
      <el-form
        :model="registerForm"
        :rules="registerRules"
        ref="registerFormRef"
        class="register-form"
      >
        <!-- 用户名 -->
        <el-form-item prop="username">
          <label class="form-label">用户名</label>
          <el-input
            v-model="registerForm.username"
            placeholder="4-20位字母、数字或下划线"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 昵称 -->
        <el-form-item prop="nickname">
          <label class="form-label">昵称</label>
          <el-input
            v-model="registerForm.nickname"
            placeholder="请输入您的昵称"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Star /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 密码 -->
        <el-form-item prop="password">
          <label class="form-label">密码</label>
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="6-20位密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <label class="form-label">确认密码</label>
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 邮箱 -->
        <el-form-item prop="email">
          <label class="form-label">邮箱 (可选)</label>
          <el-input
            v-model="registerForm.email"
            placeholder="your@email.com"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 手机号 -->
        <el-form-item prop="phone">
          <label class="form-label">手机号 (可选)</label>
          <el-input
            v-model="registerForm.phone"
            placeholder="11位手机号"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 服务条款 -->
        <el-form-item prop="agreement">
          <el-checkbox v-model="registerForm.agreement">
            我已阅读并同意
            <a href="#" class="link">《用户协议》</a>
            和
            <a href="#" class="link">《隐私政策》</a>
          </el-checkbox>
        </el-form-item>
        
        <!-- 注册按钮 -->
        <el-button
          type="primary"
          size="large"
          class="register-button"
          :loading="loading"
          @click="handleRegister"
        >
          <span v-if="!loading">立即注册</span>
          <span v-else>注册中...</span>
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Star, Message, Phone, ArrowLeft } from '@element-plus/icons-vue'
import { register } from '@/api/user'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  agreement: false
})

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

// 验证服务条款
const validateAgreement = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请阅读并同意用户协议'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度在4-20位之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称长度不能超过50位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  agreement: [
    { validator: validateAgreement, trigger: 'change' }
  ]
}

const handleRegister = () => {
  registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const { username, nickname, password, email, phone } = registerForm
      await register({ username, nickname, password, email, phone })
      
      ElMessage.success('注册成功!即将跳转到登录页...')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      console.error('注册失败:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.register-container {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  padding: 40px 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

// 动态背景球
.animated-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  
  .gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.7;
    animation: float 20s infinite ease-in-out;
  }
  
  .orb-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #ff6b6b 0%, transparent 70%);
    top: -100px;
    left: -100px;
    animation-delay: 0s;
  }
  
  .orb-2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #4ecdc4 0%, transparent 70%);
    bottom: -150px;
    right: -150px;
    animation-delay: 7s;
  }
  
  .orb-3 {
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, #ffe66d 0%, transparent 70%);
    top: 50%;
    left: 50%;
    animation-delay: 14s;
  }
}

// 玻璃拟态卡片
.register-card {
  position: relative;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  animation: fadeInUp 0.6s ease;
  z-index: 1;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
}

.card-header {
  margin-bottom: 30px;
  
  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: white;
    text-decoration: none;
    font-size: 14px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateX(-5px);
      opacity: 0.8;
    }
  }
  
  .title {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.register-form {
  .el-form-item {
    margin-bottom: 20px;
  }
  
  .form-label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: white;
  }
  
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(255, 255, 255, 0.5);
    }
    
    &.is-focus {
      background: white;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }
  }
  
  :deep(.el-checkbox__label) {
    color: white;
    font-size: 13px;
  }
  
  .link {
    color: #ffe66d;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.register-button {
  width: 100%;
  height: 48px;
  margin-top: 10px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: white;
  color: #667eea;
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.3);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>