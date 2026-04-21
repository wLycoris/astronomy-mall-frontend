<template>
  <div class="auth-page">
    <!-- ── 左半屏 · 表单 ─────────────────────────────────── -->
    <main class="auth-form">
      <div class="f-top">
        <div class="back-link" @click="router.push('/login')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回登录</span>
        </div>
        <div class="f-step">— STEP 02 · ENROLL</div>
      </div>

      <!-- 注册关闭提示 -->
      <div v-if="!registerEnabled" class="closed-panel">
        <div class="c-kicker">— REGISTRATION CLOSED</div>
        <h2 class="c-title">暂未开放注册</h2>
        <p class="c-sub">At the moment · 管理员已关闭用户注册，如需账号请联系管理员</p>
        <router-link to="/login" class="bracket-btn primary">
          <span class="b-inner">← 返回登录</span>
        </router-link>
      </div>

      <!-- 注册表单 -->
      <div v-else class="f-inner">
        <div class="f-head">
          <div class="f-kicker">— NEW OBSERVER</div>
          <h2 class="f-title">创&nbsp;&nbsp;建&nbsp;&nbsp;账&nbsp;&nbsp;户</h2>
          <p class="f-sub">Join the Constellation · 让我们认识你</p>
        </div>

        <el-form
            :model="registerForm"
            :rules="registerRules"
            ref="registerFormRef"
            class="f-form"
            hide-required-asterisk
        >
          <!-- 用户名 + 昵称 两列 -->
          <div class="f-grid">
            <el-form-item prop="username">
              <div class="field">
                <label class="field-label">USERNAME · 用户名</label>
                <el-input
                    v-model="registerForm.username"
                    placeholder="4-20位字母/数字/下划线"
                    size="large"
                    class="line-input"
                />
              </div>
            </el-form-item>

            <el-form-item prop="nickname">
              <div class="field">
                <label class="field-label">NICKNAME · 昵称</label>
                <el-input
                    v-model="registerForm.nickname"
                    placeholder="可显示的称呼"
                    size="large"
                    class="line-input"
                />
              </div>
            </el-form-item>
          </div>

          <!-- 密码 + 确认密码 两列 -->
          <div class="f-grid">
            <el-form-item prop="password">
              <div class="field">
                <label class="field-label">PASSWORD · 密码</label>
                <el-input
                    v-model="registerForm.password"
                    type="password"
                    placeholder="6-20位"
                    size="large"
                    show-password
                    class="line-input"
                />
              </div>
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <div class="field">
                <label class="field-label">CONFIRM · 确认密码</label>
                <el-input
                    v-model="registerForm.confirmPassword"
                    type="password"
                    placeholder="再次输入"
                    size="large"
                    show-password
                    class="line-input"
                />
              </div>
            </el-form-item>
          </div>

          <!-- 邮箱 -->
          <el-form-item prop="email">
            <div class="field">
              <label class="field-label">EMAIL · 邮箱（可选）</label>
              <el-input
                  v-model="registerForm.email"
                  placeholder="your@email.com"
                  size="large"
                  class="line-input"
              />
            </div>
          </el-form-item>

          <!-- 手机号 -->
          <el-form-item prop="phone">
            <div class="field">
              <label class="field-label">PHONE · 手机号（可选）</label>
              <el-input
                  v-model="registerForm.phone"
                  placeholder="11 位手机号"
                  size="large"
                  class="line-input"
              />
            </div>
          </el-form-item>

          <!-- 协议 -->
          <el-form-item prop="agreement" class="agreement-row">
            <el-checkbox v-model="registerForm.agreement" class="remember-check">
              我已阅读并同意
              <a class="link">《用户协议》</a>
              与
              <a class="link">《隐私政策》</a>
            </el-checkbox>
          </el-form-item>

          <button
              class="bracket-btn primary"
              :disabled="loading"
              @click.prevent="handleRegister"
          >
            <span class="b-inner">{{ loading ? '正在注册…' : '立 即 注 册  →' }}</span>
          </button>
        </el-form>

        <div class="f-foot">
          <div class="divider">
            <span class="d-line"></span>
            <span class="d-text">ALREADY A MEMBER</span>
            <span class="d-line"></span>
          </div>
          <router-link to="/login" class="to-register">
            <span>已经拥有账户？</span>
            <span class="accent">前往登录 →</span>
          </router-link>
        </div>
      </div>
    </main>

    <!-- ── 右半屏 · 编辑级视觉 ───────────────────────────── -->
    <aside class="auth-visual">
      <div class="v-image" :style="{ backgroundImage: `url(${visualUrl})` }"></div>
      <div class="v-starfield"></div>
      <div class="v-overlay"></div>

      <div class="v-top">
        <div class="v-cat">◎ 02 / 02</div>
        <div class="v-logo" @click="router.push('/home')">
          <span class="lg-text">GALAXY · 天文器材商城</span>
          <span class="lg-dot">◎</span>
        </div>
      </div>

      <div class="v-quote">
        <div class="q-kicker">— FIRST LIGHT</div>
        <h1 class="q-title">
          <span class="line">你的星图</span>
          <span class="line italic">从这一夜开始</span>
        </h1>
        <p class="q-sub">First Light · 按下第一次快门，从此你也是观测者</p>
      </div>

      <div class="v-ghost">BEGIN</div>
      <div class="v-bottom">
        <span class="b-line"></span>
        <span class="b-text">BEGIN · TELESCOPIUM</span>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { register } from '@/api/user'
import { getRegisterSetting } from '@/api/admin/setting'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)
const registerEnabled = ref(true)

// 🔥 编辑级暗色 · 右侧视觉底图
//   深空星云 · 未知 / 初遇 / 仪式感，与"新观测者"主题呼应
//   （刻意避开首页 4 张 stage 用图，也避开登录页的月面）
const visualUrl = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80'

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  agreement: false
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') callback(new Error('请再次输入密码'))
  else if (value !== registerForm.password) callback(new Error('两次输入密码不一致'))
  else callback()
}
const validateAgreement = (rule, value, callback) => {
  if (!value) callback(new Error('请阅读并同意用户协议'))
  else callback()
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度 4-20 位', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称长度不能超过 50 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
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
      ElMessage.success('注册成功，即将跳转登录…')
      setTimeout(() => router.push('/login'), 1400)
    } catch (error) {
      console.error('注册失败:', error)
    } finally {
      loading.value = false
    }
  })
}

onMounted(async () => {
  try {
    const res = await getRegisterSetting()
    registerEnabled.value = res.data.registerEnabled === true || res.data.registerEnabled === 'true'
  } catch (e) {
    // 读取失败默认允许注册
  }
})
</script>

<style scoped lang="scss">
// ─── tokens ───
$bg-0:#000;
$bg-1:#070709;
$bg-2:#0e0e12;
$bg-3:#14141a;
$line:rgba(255,255,255,0.10);
$line-2:rgba(255,255,255,0.18);
$tx-1:#f4f4f4;
$tx-2:rgba(255,255,255,0.72);
$tx-3:rgba(255,255,255,0.45);
$tx-4:rgba(255,255,255,0.25);
$accent:#c7a572;
$danger:#ff8585;
$serif:'Cormorant Garamond','Playfair Display','Noto Serif SC','Songti SC','宋体',serif;
$sans:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;
$mono:'SF Mono','JetBrains Mono',Menlo,Consolas,monospace;

.auth-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  background: $bg-0;
  color: $tx-1;
  font-family: $sans;
  overflow: hidden;
}

// ══════════════════════════════════════════════════════
// 左侧 · 表单（注册页放左）
// ══════════════════════════════════════════════════════
.auth-form {
  flex: 1;
  min-width: 500px;
  background: $bg-1;
  padding: 40px 64px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
}

.f-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 44px;
  .back-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 1.5px;
    color: $tx-3;
    cursor: pointer;
    transition: all 0.25s ease;
    text-transform: uppercase;
    &:hover { color: $accent; transform: translateX(-4px); }
    .el-icon { font-size: 14px; }
  }
  .f-step {
    font-family: $mono;
    font-size: 10px;
    letter-spacing: 2px;
    color: $tx-4;
    text-transform: uppercase;
  }
}

.f-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
}

.f-head {
  margin-bottom: 44px;
  .f-kicker {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 3px;
    color: $accent;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .f-title {
    font-family: $serif;
    font-weight: 500;
    font-size: 52px;
    letter-spacing: 4px;
    color: $tx-1;
    margin: 0 0 18px;
    line-height: 1;
  }
  .f-sub {
    font-family: $serif;
    font-style: italic;
    font-size: 14px;
    color: $tx-3;
    margin: 0;
    letter-spacing: 0.8px;
  }
}

// 两列网格
.f-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  :deep(.el-form-item) { margin-bottom: 0 !important; }
}

.f-form {
  :deep(.el-form-item) {
    margin-bottom: 26px;
  }
  :deep(.el-form-item__error) {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 0.8px;
    color: $danger;
    padding-top: 4px;
  }
  :deep(.el-form-item__content) { line-height: 1.3; }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.field-label {
  font-family: $mono;
  font-size: 10.5px;
  letter-spacing: 2px;
  color: $tx-3;
  text-transform: uppercase;
}

.line-input {
  :deep(.el-input__wrapper) {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    border-bottom: 1px solid $line-2 !important;
    border-radius: 0 !important;
    padding: 0 0 10px !important;
    transition: border-color 0.25s ease !important;
    &:hover { border-bottom-color: $tx-3 !important; }
    &.is-focus {
      border-bottom-color: $accent !important;
      box-shadow: 0 1px 0 0 $accent !important;
    }
  }
  :deep(.el-input__inner) {
    color: $tx-1 !important;
    font-family: $serif;
    font-size: 16px;
    letter-spacing: 1px;
    height: 32px;
    caret-color: $accent;
    &::placeholder {
      color: $tx-4;
      font-family: $serif;
      font-style: italic;
      letter-spacing: 0.5px;
    }
  }
  :deep(.el-input__suffix) { color: $tx-3; }
  :deep(.el-input__password) { color: $tx-3; cursor: pointer; &:hover { color: $accent; } }
}

.agreement-row {
  margin-top: 4px !important;
  margin-bottom: 28px !important;
}
.remember-check {
  :deep(.el-checkbox__label) {
    font-family: $serif;
    font-size: 13.5px;
    letter-spacing: 0.6px;
    color: $tx-2;
    line-height: 1.6;
  }
  :deep(.el-checkbox__inner) {
    background: transparent;
    border: 1px solid $line-2;
    border-radius: 0;
    width: 14px; height: 14px;
    &::after { border-color: $bg-0; }
  }
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background: $accent;
    border-color: $accent;
  }
  :deep(.el-checkbox__input.is-checked + .el-checkbox__label) { color: $tx-1; }
  .link {
    color: $accent;
    text-decoration: none;
    letter-spacing: 1px;
    &:hover { text-decoration: underline; }
  }
}

// CTA
.bracket-btn {
  position: relative;
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 18px 28px;
  font-family: $mono;
  font-size: 13px;
  letter-spacing: 4px;
  color: $accent;
  text-transform: uppercase;
  transition: all 0.3s ease;
  text-align: center;
  text-decoration: none;
  .b-inner { position: relative; z-index: 2; }
  &::before, &::after {
    content: '';
    position: absolute;
    width: 14px; height: 14px;
    border: 1px solid $accent;
    transition: all 0.3s ease;
  }
  &::before { top: 0; left: 0; border-right: none; border-bottom: none; }
  &::after  { bottom: 0; right: 0; border-left: none; border-top: none; }
  &:hover:not(:disabled) {
    color: $tx-1;
    background: rgba(199,165,114,0.06);
    &::before, &::after { width: 22px; height: 22px; border-color: $tx-1; }
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// Closed 面板
.closed-panel {
  flex: 1;
  display: flex; flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 520px;
  margin: 0 auto;
  padding: 40px 0;
  text-align: center;
  .c-kicker {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 3px;
    color: $accent;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .c-title {
    font-family: $serif;
    font-size: 48px;
    font-weight: 500;
    color: $tx-1;
    letter-spacing: 6px;
    margin: 0 0 18px;
  }
  .c-sub {
    font-family: $serif;
    font-style: italic;
    font-size: 15px;
    color: $tx-3;
    letter-spacing: 1px;
    margin: 0 0 44px;
  }
  .bracket-btn { max-width: 280px; }
}

// 底部分隔
.f-foot {
  margin-top: 40px;
  .divider {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 22px;
    .d-line { flex: 1; height: 1px; background: $line; }
    .d-text {
      font-family: $mono;
      font-size: 10px;
      letter-spacing: 2.5px;
      color: $tx-4;
      text-transform: uppercase;
    }
  }
  .to-register {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    border: 1px solid $line;
    font-family: $serif;
    font-size: 14px;
    color: $tx-2;
    text-decoration: none;
    letter-spacing: 1px;
    transition: all 0.25s ease;
    &:hover {
      background: $bg-2;
      border-color: $line-2;
      .accent { letter-spacing: 2px; }
    }
    .accent {
      font-family: $mono;
      font-size: 11px;
      color: $accent;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      transition: letter-spacing 0.25s ease;
    }
  }
}

// ══════════════════════════════════════════════════════
// 右侧 · 编辑级视觉（注册页视觉放右）
// ══════════════════════════════════════════════════════
.auth-visual {
  position: relative;
  flex: 1.05;
  min-width: 0;
  overflow: hidden;
  border-left: 1px solid $line;

  .v-image {
    position: absolute; inset: 0;
    background-size: cover;
    background-position: center;
    transform: scale(1.02);
    filter: saturate(0.85) brightness(0.78);
    animation: slow-zoom 28s ease-in-out infinite alternate;
  }
  .v-overlay {
    position: absolute; inset: 0;
    background:
      linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.75) 100%),
      radial-gradient(ellipse at 70% 50%, rgba(199,165,114,0.08), transparent 60%);
  }
  .v-starfield {
    position: absolute; inset: 0;
    background-image:
      radial-gradient(1.2px 1.2px at 22% 28%, rgba(255,255,255,0.85), transparent 50%),
      radial-gradient(1px 1px at 68% 16%, rgba(255,255,255,0.7), transparent 50%),
      radial-gradient(1.5px 1.5px at 42% 72%, rgba(255,255,255,0.9), transparent 50%),
      radial-gradient(1px 1px at 82% 62%, rgba(255,255,255,0.6), transparent 50%),
      radial-gradient(1.2px 1.2px at 12% 82%, rgba(255,255,255,0.75), transparent 50%);
    opacity: 0.5;
  }

  .v-top {
    position: absolute;
    top: 40px; left: 48px; right: 48px;
    display: flex; justify-content: space-between; align-items: center;
    z-index: 3;
    .v-logo {
      display: inline-flex; align-items: center; gap: 10px;
      cursor: pointer;
      .lg-dot { color: $accent; font-size: 16px; }
      .lg-text {
        font-family: $serif;
        font-size: 14px;
        letter-spacing: 3px;
        color: $tx-1;
      }
    }
    .v-cat {
      font-family: $mono;
      font-size: 11px;
      letter-spacing: 2px;
      color: $tx-3;
      text-transform: uppercase;
    }
  }

  .v-quote {
    position: absolute;
    left: 48px; right: 48px;
    top: 50%;
    transform: translateY(-48%);
    z-index: 3;
    max-width: 540px;

    .q-kicker {
      font-family: $mono;
      font-size: 11px;
      letter-spacing: 3px;
      color: $accent;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .q-title {
      font-family: $serif;
      font-size: clamp(44px, 5.5vw, 78px);
      font-weight: 500;
      line-height: 1.05;
      letter-spacing: 5px;
      margin: 0 0 28px;
      color: $tx-1;
      .line { display: block; }
      .italic {
        font-style: italic;
        font-weight: 400;
        color: rgba(255,255,255,0.9);
        letter-spacing: 8px;
        margin-top: 4px;
      }
    }
    .q-sub {
      font-family: $serif;
      font-style: italic;
      font-size: 16px;
      color: $tx-3;
      line-height: 1.7;
      letter-spacing: 0.8px;
      margin: 0;
    }
  }

  .v-ghost {
    position: absolute;
    left: -20px; bottom: 80px;
    font-family: $serif;
    font-size: clamp(100px, 14vw, 220px);
    font-weight: 400;
    letter-spacing: 12px;
    color: rgba(255,255,255,0.04);
    line-height: 1;
    pointer-events: none;
    z-index: 2;
  }

  .v-bottom {
    position: absolute;
    bottom: 40px; right: 48px;
    display: inline-flex; align-items: center; gap: 14px;
    z-index: 3;
    .b-line { display: inline-block; width: 36px; height: 1px; background: $accent; }
    .b-text {
      font-family: $mono;
      font-size: 10px;
      letter-spacing: 3px;
      color: $tx-3;
      text-transform: uppercase;
    }
  }
}

@keyframes slow-zoom {
  from { transform: scale(1.02); }
  to   { transform: scale(1.08); }
}

// ══════════════════════════════════════════════════════
// 响应式
// ══════════════════════════════════════════════════════
@media (max-width: 1080px) {
  .auth-page { flex-direction: column; }
  .auth-visual {
    flex: none;
    height: 36vh;
    min-height: 280px;
    order: -1;                      // 窄屏视觉区上移
    border-left: none;
    border-bottom: 1px solid $line;
    .v-top { top: 24px; left: 24px; right: 24px; }
    .v-quote {
      left: 24px; right: 24px;
      .q-title { font-size: 36px; letter-spacing: 3px; .italic { letter-spacing: 5px; } }
      .q-sub { font-size: 13px; }
    }
    .v-bottom { right: 24px; bottom: 20px; }
    .v-ghost { font-size: 70px; bottom: 16px; letter-spacing: 6px; }
  }
  .auth-form {
    min-width: 0;
    padding: 32px 24px;
  }
  .f-grid { grid-template-columns: 1fr; gap: 0; :deep(.el-form-item) { margin-bottom: 26px !important; } }
  .f-head { .f-title { font-size: 36px; letter-spacing: 3px; } }
}
</style>
