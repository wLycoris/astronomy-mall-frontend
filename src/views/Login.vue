<template>
  <div class="auth-page">
    <!-- ── 左半屏 · 编辑级视觉 ───────────────────────────── -->
    <aside class="auth-visual">
      <!-- 底图 + 叠加 -->
      <div class="v-image" :style="{ backgroundImage: `url(${visualUrl})` }"></div>
      <div class="v-starfield"></div>
      <div class="v-overlay"></div>

      <!-- 顶部 meta -->
      <div class="v-top">
        <div class="v-logo" @click="router.push('/home')">
          <span class="lg-dot">◎</span>
          <span class="lg-text">GALAXY · 天文器材商城</span>
        </div>
        <div class="v-cat">◎ 01 / 02</div>
      </div>

      <!-- 中间 editorial 引语 -->
      <div class="v-quote">
        <div class="q-kicker">— THE NIGHT CONTINUES</div>
        <h1 class="q-title">
          <span class="line">星子如旧</span>
          <span class="line italic">只等归人</span>
        </h1>
        <p class="q-sub">The Night Resumes · 你上次标记过的那颗星，仍在原地</p>
      </div>

      <!-- 底部 ghost watermark -->
      <div class="v-ghost">RETURN</div>
      <div class="v-bottom">
        <span class="b-line"></span>
        <span class="b-text">RETURN · TELESCOPIUM</span>
      </div>
    </aside>

    <!-- ── 右半屏 · 表单 ─────────────────────────────────── -->
    <main class="auth-form">
      <!-- 左上返回（仅右侧独立显示，用于窄屏） -->
      <div class="f-top">
        <div class="back-link" @click="router.push('/home')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </div>
        <div class="f-step">— STEP 01 · IDENTIFY</div>
      </div>

      <div class="f-inner">
        <div class="f-head">
          <div class="f-kicker">— SIGN IN</div>
          <h2 class="f-title">登&nbsp;&nbsp;入</h2>
          <p class="f-sub">Continue Your Journey · 输入凭证继续探索</p>
        </div>

        <el-form
            :model="loginForm"
            :rules="loginRules"
            ref="loginFormRef"
            class="f-form"
            hide-required-asterisk
        >
          <el-form-item prop="username">
            <div class="field">
              <label class="field-label">USERNAME · 用户名</label>
              <el-input
                  v-model="loginForm.username"
                  placeholder="请输入你的用户名"
                  size="large"
                  class="line-input"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="field">
              <label class="field-label">PASSWORD · 密码</label>
              <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password
                  class="line-input"
                  @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>

          <div class="f-row">
            <el-checkbox v-model="rememberMe" class="remember-check">记住我</el-checkbox>
            <a class="forgot" @click.prevent="onForgot">忘记密码 →</a>
          </div>

          <button
              class="bracket-btn primary"
              :disabled="loading"
              @click.prevent="handleLogin"
          >
            <span class="b-inner">{{ loading ? '正在登入…' : '登  入  →' }}</span>
          </button>
        </el-form>

        <div class="f-foot">
          <div class="divider">
            <span class="d-line"></span>
            <span class="d-text">NEW HERE</span>
            <span class="d-line"></span>
          </div>
          <router-link to="/register" class="to-register">
            <span>还没有账户？</span>
            <span class="accent">立即注册 →</span>
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { setToken } from '@/utils/auth'
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 🔥 编辑级暗色 · 左侧视觉底图
//   月面近摄 · 冷静、熟悉、"老朋友还在原地"的气质，与"归来"主题呼应
//   （刻意避开首页 4 张 stage 用图）
const visualUrl = 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=80'

onMounted(() => {
  if (route.query.message === 'password_changed') {
    ElMessage.success('密码已修改，请重新登录')
  }
})

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

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(loginForm)
      ElMessage.success('登录成功')
      router.push('/home')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      loading.value = false
    }
  })
}

const onForgot = () => {
  ElMessage.info('请联系管理员重置密码')
}
</script>

<style scoped lang="scss">
// ─── tokens（与 Home.vue 对齐）────────────────────────
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
// 左侧 · 编辑级视觉
// ══════════════════════════════════════════════════════
.auth-visual {
  position: relative;
  flex: 1.15;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid $line;

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
      radial-gradient(ellipse at 30% 40%, rgba(199,165,114,0.08), transparent 60%);
  }
  // 星点装饰层（防御性 · 图片挂了仍有内容）
  .v-starfield {
    position: absolute; inset: 0;
    background-image:
      radial-gradient(1.2px 1.2px at 14% 18%, rgba(255,255,255,0.85), transparent 50%),
      radial-gradient(1px 1px at 72% 32%, rgba(255,255,255,0.7), transparent 50%),
      radial-gradient(1.5px 1.5px at 48% 68%, rgba(255,255,255,0.9), transparent 50%),
      radial-gradient(1px 1px at 26% 82%, rgba(255,255,255,0.6), transparent 50%),
      radial-gradient(1.2px 1.2px at 88% 76%, rgba(255,255,255,0.75), transparent 50%);
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
      font-size: clamp(48px, 6vw, 88px);
      font-weight: 500;
      line-height: 1.02;
      letter-spacing: 6px;
      margin: 0 0 28px;
      color: $tx-1;
      .line { display: block; }
      .italic {
        font-style: italic;
        font-weight: 400;
        color: rgba(255,255,255,0.9);
        letter-spacing: 10px;
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
    right: -20px; bottom: 80px;
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
    bottom: 40px; left: 48px;
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
// 右侧 · 表单
// ══════════════════════════════════════════════════════
.auth-form {
  flex: 0.85;
  min-width: 460px;
  background: $bg-1;
  padding: 40px 56px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.f-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 56px;
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
  justify-content: center;
  max-width: 420px;
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
    font-size: 54px;
    letter-spacing: 6px;
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

// ── 输入框 · 线性暗色 ────────────────────────────────
.f-form {
  :deep(.el-form-item) {
    margin-bottom: 28px;
  }
  :deep(.el-form-item__error) {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 0.8px;
    color: $danger;
    padding-top: 4px;
  }
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

// Element Plus 输入框重绘为 underline-only
.line-input {
  :deep(.el-input__wrapper) {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    border-bottom: 1px solid $line-2 !important;
    border-radius: 0 !important;
    padding: 0 0 10px !important;
    transition: border-color 0.25s ease !important;

    &:hover {
      border-bottom-color: $tx-3 !important;
    }
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
  :deep(.el-input__suffix) {
    color: $tx-3;
    .el-input__password { color: $tx-3; cursor: pointer; &:hover { color: $accent; } }
  }
}

// ── 记住我 / 忘记密码 ───────────────────────────────
.f-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 14px 0 36px;
}
.remember-check {
  :deep(.el-checkbox__label) {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 1.5px;
    color: $tx-2;
    text-transform: uppercase;
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
}
.forgot {
  font-family: $mono;
  font-size: 11px;
  letter-spacing: 1.5px;
  color: $tx-3;
  cursor: pointer;
  text-transform: uppercase;
  transition: color 0.25s ease;
  &:hover { color: $accent; }
}

// ── 主 CTA · bracket-btn ─────────────────────────────
.bracket-btn {
  position: relative;
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

// ── 底部分隔 / 跳转注册 ──────────────────────────────
.f-foot {
  margin-top: 48px;

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
// 响应式
// ══════════════════════════════════════════════════════
@media (max-width: 980px) {
  .auth-page { flex-direction: column; }
  .auth-visual {
    flex: none;
    height: 42vh;
    min-height: 320px;
    border-right: none;
    border-bottom: 1px solid $line;
    .v-top { top: 24px; left: 24px; right: 24px; }
    .v-quote {
      left: 24px; right: 24px;
      .q-title { font-size: 44px; letter-spacing: 4px; .italic { letter-spacing: 6px; } }
      .q-sub { font-size: 14px; }
    }
    .v-bottom { left: 24px; bottom: 20px; }
    .v-ghost { font-size: 80px; bottom: 20px; }
  }
  .auth-form {
    min-width: 0;
    padding: 32px 24px;
  }
  .f-top { margin-bottom: 32px; }
  .f-head { margin-bottom: 32px; .f-title { font-size: 42px; letter-spacing: 4px; } }
}
</style>
