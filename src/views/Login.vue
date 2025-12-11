<template>
  <div class="login-container">
    <!-- 星空背景 -->
    <div class="stars-background">
      <div class="stars"></div>
      <div class="stars2"></div>
      <div class="stars3"></div>
    </div>
    
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 左侧:品牌展示 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="logo-wrapper">
            <div class="planet"></div>
            <div class="ring"></div>
          </div>
          <h1 class="brand-title">
            <span class="gradient-text">天文商城</span>
          </h1>
          <p class="brand-subtitle">探索宇宙 · 从这里开始</p>
          <div class="feature-list">
            <div class="feature-item" v-for="(item, index) in features" :key="index">
              <el-icon><Check /></el-icon>
              <span>{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧:登录表单 -->
      <div class="form-section">
        <div class="form-wrapper">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">登录您的账户继续探索</p>
          
          <el-form
            :model="loginForm"
            :rules="loginRules"
            ref="loginFormRef"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                clearable
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <a href="#" class="forgot-password">忘记密码?</a>
            </div>
            
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form>
          
          <div class="register-link">
            还没有账户?
            <router-link to="/register">立即注册</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { setToken } from '@/utils/auth'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Check } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度在4-20位之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20位之间', trigger: 'blur' }
  ]
}

const features = [
  'AI星图智能识别',
  '专业天文器材',
  '海量学习资源',
  '活跃社区交流'
]

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await userStore.login(loginForm)
      ElMessage.success('登录成功!')
      router.push('/home')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #000428 0%, #004e92 100%);
}

// 星空背景动画
.stars-background {
  position: absolute;
  width: 100%;
  height: 100%;
  
  .stars, .stars2, .stars3 {
    position: absolute;
    width: 100%;
    height: 100%;
    background: transparent;
  }
  
  .stars {
    background-image: 
      radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: twinkle 3s infinite;
  }
  
  .stars2 {
    background-image: 
      radial-gradient(1px 1px at 50px 50px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 100px 100px, #fff, rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 250px 250px;
    animation: twinkle 4s infinite;
  }
  
  .stars3 {
    background-image: 
      radial-gradient(1px 1px at 80px 10px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 160px 70px, #fff, rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 300px 300px;
    animation: twinkle 5s infinite;
  }
}

// 登录卡片
.login-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  height: 550px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
  animation: fadeInUp 0.6s ease;
}

// 左侧品牌展示
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 50px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-content {
  text-align: center;
}

.logo-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
  
  .planet {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
    border-radius: 50%;
    position: absolute;
    top: 20px;
    left: 20px;
    animation: float 6s ease-in-out infinite;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  .ring {
    width: 120px;
    height: 30px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    position: absolute;
    top: 45px;
    transform: rotateX(75deg);
    animation: float 6s ease-in-out infinite reverse;
  }
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  
  .gradient-text {
    background: linear-gradient(90deg, #fff 0%, #e0e7ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.feature-list {
  text-align: left;
  display: inline-block;
  
  .feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 15px;
    
    .el-icon {
      margin-right: 10px;
      font-size: 18px;
    }
  }
}

// 右侧表单
.form-section {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  max-width: 350px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 40px;
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }
  
  :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
  
  .forgot-password {
    color: #667eea;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #6b7280;
  
  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotateX(75deg); }
  50% { transform: translateY(-20px) rotateX(75deg); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, -40%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

// 响应式
@media (max-width: 768px) {
  .login-card {
    width: 90vw;
    height: auto;
    flex-direction: column;
  }
  
  .brand-section {
    padding: 40px 30px;
  }
  
  .form-section {
    padding: 40px 30px;
  }
}
</style>