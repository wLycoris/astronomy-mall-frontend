<template>
  <div class="recognition-waiting-page">

    <!-- ============================================================ -->
    <!-- 主内容区                                                       -->
    <!-- ============================================================ -->
    <div class="waiting-container">

      <!-- 状态：识别中 (status=0) -->
      <div v-if="status === 0" class="status-block status-processing">
        <!-- 星空动画 -->
        <div class="cosmos-animation">
          <div class="orbit-ring ring-1">
            <div class="planet planet-1">🔭</div>
          </div>
          <div class="orbit-ring ring-2">
            <div class="planet planet-2">⭐</div>
          </div>
          <div class="center-star">🌟</div>
        </div>

        <h2 class="status-title">正在识别星图中...</h2>
        <p class="status-desc">
          AI 正在分析您的星图，通常需要 <strong>30 秒 ~ 3 分钟</strong>，请耐心等待
        </p>

        <!-- 步骤进度 -->
        <div class="progress-steps">
          <div class="step" :class="{ active: progressStep >= 1, done: progressStep > 1 }">
            <div class="step-icon">{{ progressStep > 1 ? '✅' : '📤' }}</div>
            <span>图片上传完成</span>
          </div>
          <div class="step-connector"></div>
          <div class="step" :class="{ active: progressStep >= 2, done: progressStep > 2 }">
            <div class="step-icon step-loading" v-if="progressStep === 2">
              <el-icon class="rotating"><Loading /></el-icon>
            </div>
            <div class="step-icon" v-else>{{ progressStep > 2 ? '✅' : '🔍' }}</div>
            <span>AI 分析中</span>
          </div>
          <div class="step-connector"></div>
          <div class="step" :class="{ active: progressStep >= 3 }">
            <div class="step-icon">🎯</div>
            <span>生成识别结果</span>
          </div>
        </div>

        <!-- 识别ID信息 -->
        <div class="recognition-id-info" v-if="recognitionId">
          识别编号: <code>#{{ recognitionId }}</code>
        </div>

        <!-- 轮询倒计时提示 -->
        <p class="poll-hint">
          <el-icon><Clock /></el-icon>
          {{ nextPollCountdown > 0 ? `${nextPollCountdown} 秒后自动刷新` : '正在刷新...' }}
        </p>
      </div>

      <!-- 状态：识别成功 (status=1) -->
      <div v-else-if="status === 1" class="status-block status-success">
        <div class="success-icon">🎉</div>
        <h2 class="status-title">识别成功！</h2>
        <p class="status-desc">已为您解析出星图坐标和天体信息</p>
        <el-button type="primary" size="large" class="action-btn" @click="goToResult">
          查看识别结果 →
        </el-button>
      </div>

      <!-- 状态：识别失败 (status=2) -->
      <div v-else-if="status === 2" class="status-block status-failed">
        <div class="failed-icon">😞</div>
        <h2 class="status-title">识别未能成功</h2>
        <p class="status-desc">{{ failReason || '图片中未能检测到足够的星点信息' }}</p>

        <div class="failed-tips">
          <p>💡 建议您：</p>
          <ul>
            <li>使用曝光时间更长（≥ 5 秒）的照片</li>
            <li>确保图片清晰，避免运动模糊</li>
            <li>使用包含更多星点的大视野照片</li>
          </ul>
        </div>

        <el-button type="primary" size="large" class="action-btn" @click="goToUpload">
          重新上传 ↗
        </el-button>
      </div>

      <!-- 状态：加载中（初始化页面时） -->
      <div v-else class="status-block status-loading">
        <el-icon class="rotating" size="40" color="#4a9eff"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Clock } from '@element-plus/icons-vue'
import { getRecognitionStatus } from '@/api/recognition'

const route = useRoute()
const router = useRouter()

// ============================================================
// 状态变量
// ============================================================

/** 识别记录 ID（从路由 query 参数获取） */
const recognitionId = ref(null)

/**
 * 当前识别状态
 * null  - 初始化中
 * 0     - 识别中
 * 1     - 成功
 * 2     - 失败
 */
const status = ref(null)

/** 失败原因（status=2 时展示） */
const failReason = ref('')

/**
 * 进度步骤显示
 * 1 - 刚提交，等待 submission_id 写入
 * 2 - 已有 submission_id，等待 job 完成
 * 3 - 完成（跳转前短暂显示）
 */
const progressStep = ref(1)

/** 下次轮询倒计时（秒） */
const nextPollCountdown = ref(0)

/** 轮询定时器句柄 */
let pollTimer = null

/** 倒计时定时器句柄 */
let countdownTimer = null

/** 轮询间隔（毫秒）：5 秒 */
const POLL_INTERVAL = 5000

/** 最大轮询次数（5s * 72 = 6分钟，超时后停止轮询）*/
const MAX_POLL_COUNT = 72

/** 当前已轮询次数 */
let pollCount = 0

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  // 获取 recognitionId
  const id = route.query.id
  if (!id) {
    ElMessage.error('缺少识别 ID，请重新提交')
    router.replace('/recognition')
    return
  }

  recognitionId.value = Number(id)

  // 立即查询一次状态
  await fetchStatus()

  // 若仍在识别中，启动轮询
  if (status.value === 0) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})

// ============================================================
// 核心方法：状态查询与轮询
// ============================================================

/**
 * 查询识别状态
 */
async function fetchStatus() {
  try {
    const res = await getRecognitionStatus(recognitionId.value)
    const data = res.data

    status.value = data.status
    failReason.value = data.failReason || ''

    // 更新进度步骤
    if (data.submissionId) {
      progressStep.value = 2 // 已有 submission_id
    }
    if (data.status === 1 || data.status === 2) {
      progressStep.value = 3
    }

    // 识别成功：停止轮询，短暂展示后跳转
    if (data.status === 1) {
      stopPolling()
      progressStep.value = 3
      setTimeout(() => goToResult(), 1500)
    }

    // 识别失败：停止轮询
    if (data.status === 2) {
      stopPolling()
    }

  } catch (err) {
    console.error('[RecognitionWaiting] 查询状态失败:', err)
    // 查询失败不停止轮询，继续重试（可能是网络抖动）
  }
}

/**
 * 启动轮询（每 5 秒查询一次）
 */
function startPolling() {
  startCountdown()

  pollTimer = setInterval(async () => {
    pollCount++

    // 超过最大轮询次数，停止
    if (pollCount >= MAX_POLL_COUNT) {
      stopPolling()
      // 超时后显示为失败（可能 Astrometry.net 服务器异常）
      status.value = 2
      failReason.value = '识别超时（超过 6 分钟），请重新提交'
      return
    }

    await fetchStatus()

    // 识别中则重置倒计时
    if (status.value === 0) {
      startCountdown()
    }
  }, POLL_INTERVAL)
}

/**
 * 停止轮询
 */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

/**
 * 启动倒计时（显示"N 秒后自动刷新"）
 */
function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer)
  nextPollCountdown.value = POLL_INTERVAL / 1000

  countdownTimer = setInterval(() => {
    if (nextPollCountdown.value > 0) {
      nextPollCountdown.value--
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

// ============================================================
// 页面跳转
// ============================================================

function goToResult() {
  // 4.2 节完成后跳转到结果页
  // 暂时跳转到识别详情（路由在 4.2 节添加）
  router.push(`/recognition/result?id=${recognitionId.value}`)
}

function goToUpload() {
  router.push('/recognition')
}
</script>

<style scoped>
/* ============================================================ */
/* 页面布局                                                       */
/* ============================================================ */
.recognition-waiting-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #050c1a 0%, #0a1525 50%, #070f1e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.waiting-container {
  max-width: 560px;
  width: 100%;
}

/* ============================================================ */
/* 状态卡片通用样式                                               */
/* ============================================================ */
.status-block {
  background: rgba(10, 22, 48, 0.85);
  border: 1px solid rgba(80, 130, 200, 0.2);
  border-radius: 20px;
  padding: 50px 40px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.status-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #c0deff;
  margin: 20px 0 10px;
}

.status-desc {
  color: #6a8aaa;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 30px;
}

.status-desc strong {
  color: #8ecdf7;
}

/* ============================================================ */
/* 识别中动画                                                     */
/* ============================================================ */
.cosmos-animation {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 10px;
}

.center-star {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.2rem;
  z-index: 2;
}

.orbit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(80, 140, 255, 0.25);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 90px;
  height: 90px;
  animation: orbit 4s linear infinite;
}

.ring-2 {
  width: 130px;
  height: 130px;
  animation: orbit 7s linear infinite reverse;
}

.planet {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.2rem;
}

@keyframes orbit {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* ============================================================ -->
/* 步骤进度                                                       -->
/* ============================================================ */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.4;
  transition: opacity 0.4s;
}

.step.active,
.step.done {
  opacity: 1;
}

.step-icon {
  font-size: 1.4rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-loading {
  color: #4a9eff;
}

.step span {
  font-size: 0.78rem;
  color: #6a8aaa;
  white-space: nowrap;
}

.step.active span,
.step.done span {
  color: #8ab4d8;
}

.step-connector {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, rgba(80, 130, 200, 0.2), rgba(80, 130, 200, 0.5));
  margin: 0 4px;
  margin-bottom: 18px;
}

/* 识别 ID */
.recognition-id-info {
  font-size: 0.82rem;
  color: #4a6a8a;
  margin-bottom: 14px;
}

.recognition-id-info code {
  color: #5a8ac8;
  font-family: monospace;
}

/* 轮询提示 */
.poll-hint {
  font-size: 0.82rem;
  color: #3a5a7a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0;
}

/* ============================================================ */
/* 成功状态                                                       */
/* ============================================================ */
.status-success .success-icon {
  font-size: 4rem;
  animation: bounceIn 0.6s ease;
}

@keyframes bounceIn {
  0%   { transform: scale(0); }
  60%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* ============================================================ */
/* 失败状态                                                       */
/* ============================================================ */
.status-failed .failed-icon {
  font-size: 3.5rem;
}

.failed-tips {
  text-align: left;
  background: rgba(255, 100, 50, 0.05);
  border: 1px solid rgba(255, 100, 50, 0.15);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.failed-tips p {
  color: #c87060;
  font-size: 0.88rem;
  margin: 0 0 8px;
}

.failed-tips ul {
  color: #8a6050;
  font-size: 0.85rem;
  padding-left: 20px;
  margin: 0;
  line-height: 1.8;
}

/* ============================================================ */
/* 操作按钮                                                       */
/* ============================================================ */
.action-btn {
  width: 180px;
  height: 44px;
  border-radius: 22px;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #1a6abf, #0e4a9a) !important;
  border-color: #1a6abf !important;
}

/* ============================================================ */
/* 通用工具                                                       */
/* ============================================================ */
@keyframes rotate {
  to { transform: rotate(360deg); }
}

.rotating {
  animation: rotate 1s linear infinite;
}

/* 初始加载状态 */
.status-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #4a6a8a;
  font-size: 0.9rem;
}
</style>