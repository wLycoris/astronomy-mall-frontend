<!--
  📌 管理员登录页
  路径: src/views/admin/AdminLogin.vue

  使用说明:
  1. 管理员登录需要用户 role=1
  2. 登录成功后跳转到后台首页 /admin/dashboard
  3. 普通用户(role=0)无法登录后台
-->

<template>
  <div class="admin-login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#409EFF"><ShoppingCart /></el-icon>
        <h2>天文器材商城 - 后台管理</h2>
        <p>管理员登录</p>
      </div>

      <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          label-width="0"
      >
        <el-form-item prop="username">
          <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              size="large"
              clearable
              @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>提示: 只有管理员账号可以登录后台</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref()

// 表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

// 登录按钮加载状态
const loading = ref(false)

/**
 * 登录处理
 */
const handleLogin = async () => {
  // 1. 表单验证
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  // 2. 调用登录接口
  loading.value = true
  try {
    const res = await userStore.login(loginForm)

    // 3. 检查是否为管理员
    const userInfo = res.data.userInfo
    if (!userInfo || userInfo.role !== 1) {
      ElMessage.error('您不是管理员,无法登录后台')
      userStore.logout()
      return
    }

    // 4. 登录成功
    ElMessage.success('登录成功')
    router.push('/admin/dashboard')

  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.admin-login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 420px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    margin: 15px 0 5px;
    font-size: 24px;
    color: #303133;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }
}

.login-form {
  margin-top: 30px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
  font-size: 16px;
  height: 45px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;

  p {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}
</style>