<template>
  <div class="page">
    <div class="sky"></div>
    <div class="stars stars--a"></div>
    <div class="stars stars--b"></div>
    <div class="grain"></div>

    <!-- Topbar -->
    <header class="topbar">
      <div class="topbar__inner">
        <span class="tb-link" @click="router.push('/home')">首页</span>
        <span class="tb-dot">·</span>
        <span class="tb-link" @click="router.push('/recognition')">AI 星图识别</span>
        <span class="tb-dot">·</span>
        <span class="tb-current">解算</span>
        <span class="tb-spacer"></span>
        <span class="tb-link" @click="router.push('/recognition/history')">识别历史</span>
      </div>
    </header>

    <main class="wrap">
      <!-- ═══════════ 识别中 ═══════════ -->
      <section v-if="status === 0" class="panel">
        <div class="kicker">No. 02 &nbsp;—&nbsp; 夜空解算中</div>
        <h1 class="title">正在识别<br /><em>星图</em></h1>

        <div class="orb orb--busy">
          <div class="orb__halo orb__halo--outer"></div>
          <div class="orb__halo orb__halo--inner"></div>
          <div class="orb__iris"></div>
          <div class="orb__disc"></div>
          <svg class="orb__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="47" fill="none" stroke="#f7ecd2" stroke-width="0.5" stroke-dasharray="60 230" stroke-linecap="round"/>
          </svg>
          <div class="orb__label">#{{ String(recognitionId || 0).padStart(4, '0') }}</div>
        </div>

        <p class="desc">
          Astrometry.net 正在解算您的星图，通常需要 <em>30 秒 ~ 3 分钟</em>
        </p>

        <!-- Roman numeral flow -->
        <div class="flow">
          <div class="flow__step" :class="{ active: progressStep >= 1, done: progressStep > 1 }">
            <div class="flow__num">I</div>
            <div class="flow__name">图片上传</div>
            <div class="flow__hint">已完成</div>
          </div>
          <div class="flow__line" :class="{ done: progressStep > 1 }"></div>
          <div class="flow__step" :class="{ active: progressStep === 2, done: progressStep > 2 }">
            <div class="flow__num">II</div>
            <div class="flow__name">AI 解算</div>
            <div class="flow__hint">{{ progressStep === 2 ? '进行中' : progressStep > 2 ? '已完成' : '等待中' }}</div>
          </div>
          <div class="flow__line" :class="{ done: progressStep > 2 }"></div>
          <div class="flow__step" :class="{ active: progressStep >= 3 }">
            <div class="flow__num">III</div>
            <div class="flow__name">生成档案</div>
            <div class="flow__hint">{{ progressStep >= 3 ? '即将完成' : '等待中' }}</div>
          </div>
        </div>

        <div class="meta">
          <span class="meta__k">编号</span>
          <span class="meta__v">#{{ String(recognitionId || 0).padStart(4, '0') }}</span>
          <span class="meta__sep">·</span>
          <span class="meta__k">下次查询</span>
          <span class="meta__v">
            {{ nextPollCountdown > 0 ? `${nextPollCountdown} 秒` : '即将查询' }}
          </span>
          <span class="meta__sep">·</span>
          <span class="meta__k">状态</span>
          <span class="meta__v meta__v--live">处理中</span>
        </div>

        <aside class="note">
          <em>后台任务</em>
          识别在后台继续运行，您可以
          <span class="note__link" @click="router.push('/home')">离开此页</span>，
          稍后在
          <span class="note__link" @click="router.push('/recognition/history')">识别历史</span>
          中查看结果。
        </aside>
      </section>

      <!-- ═══════════ 成功 ═══════════ -->
      <section v-else-if="status === 1" class="panel">
        <div class="kicker">No. 02 &nbsp;—&nbsp; 识别成功</div>
        <h1 class="title"><em>星图</em><br />已被阅读</h1>

        <div class="orb orb--ok">
          <div class="orb__halo orb__halo--outer"></div>
          <div class="orb__halo orb__halo--inner"></div>
          <div class="orb__iris"></div>
          <div class="orb__disc"></div>
          <svg class="orb__icon" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M 30 52 L 46 68 L 72 36" fill="none" stroke="#0e1731" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <p class="desc">已为您解析星图坐标与天体信息，即将跳转到观测档案</p>

        <button class="submit" @click="goToResult">
          <span>查看识别结果</span>
          <span class="submit__arrow">→</span>
        </button>
      </section>

      <!-- ═══════════ 失败 ═══════════ -->
      <section v-else-if="status === 2" class="panel">
        <div class="kicker kicker--err">No. 02 &nbsp;—&nbsp; 识别未能成功</div>
        <h1 class="title"><em>未能</em><br />解算此星图</h1>

        <div class="orb orb--err">
          <div class="orb__halo orb__halo--outer"></div>
          <div class="orb__disc orb__disc--dim"></div>
          <svg class="orb__icon" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M 36 36 L 64 64 M 64 36 L 36 64" fill="none" stroke="#2a1b1b" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>

        <p class="desc">{{ failReason || '图片中未能检测到足够的星点信息' }}</p>

        <div class="tips">
          <em>改进建议</em>
          <ul>
            <li>使用曝光时间更长（≥ 5 秒）的照片</li>
            <li>确保图片清晰，避免运动模糊</li>
            <li>使用包含更多星点的大视野照片</li>
          </ul>
        </div>

        <button class="submit submit--err" @click="goToUpload">
          <span>重新上传</span>
          <span class="submit__arrow">→</span>
        </button>
      </section>

      <!-- ═══════════ 加载中 ═══════════ -->
      <section v-else class="panel panel--loading">
        <div class="orb orb--busy orb--small">
          <div class="orb__halo orb__halo--outer"></div>
          <div class="orb__disc"></div>
          <svg class="orb__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="47" fill="none" stroke="#f7ecd2" stroke-width="0.5" stroke-dasharray="60 230" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="loading-text">加载中</div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { getRecognitionStatus } from '@/api/recognition'

const route = useRoute()
const router = useRouter()

const recognitionId = ref(null)
const status = ref(null)
const failReason = ref('')
const progressStep = ref(1)
const nextPollCountdown = ref(0)

let pollTimer = null
let countdownTimer = null
const POLL_INTERVAL = 5000
const MAX_POLL_COUNT = 72
let pollCount = 0

onMounted(async () => {
  const id = route.query.id
  if (!id) {
    ElMessage.error('缺少识别 ID，请重新提交')
    router.replace('/recognition')
    return
  }
  recognitionId.value = Number(id)
  await fetchStatus()
  if (status.value === 0) startPolling()
})

onUnmounted(() => stopPolling())

async function fetchStatus() {
  try {
    const res = await getRecognitionStatus(recognitionId.value)
    const data = res.data
    status.value = data.status
    failReason.value = data.failReason || ''
    if (data.submissionId) progressStep.value = 2
    if (data.status === 1 || data.status === 2) progressStep.value = 3
    if (data.status === 1) {
      stopPolling()
      progressStep.value = 3
      setTimeout(() => goToResult(), 1500)
    }
    if (data.status === 2) stopPolling()
  } catch (err) {
    console.error('[RecognitionWaiting] 查询状态失败:', err)
  }
}

function startPolling() {
  startCountdown()
  pollTimer = setInterval(async () => {
    pollCount++
    if (pollCount >= MAX_POLL_COUNT) {
      stopPolling()
      status.value = 2
      failReason.value = '识别超时（超过 6 分钟），请重新提交'
      return
    }
    await fetchStatus()
    if (status.value === 0) startCountdown()
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer)
  nextPollCountdown.value = POLL_INTERVAL / 1000
  countdownTimer = setInterval(() => {
    if (nextPollCountdown.value > 0) nextPollCountdown.value--
    else clearInterval(countdownTimer)
  }, 1000)
}

function goToResult() {
  router.push(`/recognition/result?id=${recognitionId.value}`)
}
function goToUpload() {
  router.push('/recognition')
}
</script>

<style lang="scss" scoped>
/* ──────────────────────────
   Painterly moon-goddess palette
   ────────────────────────── */
$moon:      #f7ecd2;
$moon-soft: #f1e2b8;
$sky-top:   #1a2547;
$sky-mid:   #0e1731;
$sky-bot:   #070b1d;

$fg:        #f3ede1;
$fg-mute:   rgba(243,237,225,0.62);
$fg-faint:  rgba(243,237,225,0.35);
$hair:      rgba(243,237,225,0.14);
$hair-soft: rgba(243,237,225,0.08);

$ok:  #a4e2b8;
$err: #efb6b0;

$sans:  'Inter','PingFang SC','Microsoft YaHei','Hiragino Sans GB','Helvetica Neue',Arial,sans-serif;
$serif: 'Cormorant Garamond','Playfair Display',Georgia,serif;

.page {
  min-height: 100vh;
  background: $sky-bot;
  color: $fg;
  font-family: $sans;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 120px;
  isolation: isolate;
}

.sky {
  position: fixed; inset: 0; z-index: 0;
  background:
      radial-gradient(ellipse 70% 55% at 50% 22%, rgba(247,236,210,0.12), transparent 70%),
      radial-gradient(ellipse 65% 55% at 82% 24%, rgba(176,134,214,0.12), transparent 70%),
      radial-gradient(ellipse 70% 60% at 16% 70%, rgba(214,134,182,0.08), transparent 70%),
      linear-gradient(180deg, $sky-top 0%, $sky-mid 55%, $sky-bot 100%);
}
.stars {
  position: fixed; inset: 0; z-index: 1;
  pointer-events: none;
  background-image:
      radial-gradient(1px 1px at 12% 22%, rgba(247,236,210,0.78), transparent 60%),
      radial-gradient(1px 1px at 78% 16%, rgba(247,236,210,0.6), transparent 60%),
      radial-gradient(1.3px 1.3px at 34% 34%, rgba(255,255,255,0.65), transparent 60%),
      radial-gradient(1px 1px at 88% 42%, rgba(247,236,210,0.5), transparent 60%),
      radial-gradient(1px 1px at 6% 58%, rgba(255,255,255,0.55), transparent 60%),
      radial-gradient(1.5px 1.5px at 62% 10%, rgba(247,236,210,0.8), transparent 60%),
      radial-gradient(1px 1px at 20% 68%, rgba(247,236,210,0.55), transparent 60%),
      radial-gradient(1.3px 1.3px at 72% 56%, rgba(247,236,210,0.65), transparent 60%);
  background-size: 1200px 1200px, 900px 900px, 1100px 1100px, 1000px 1000px, 1400px 1400px, 800px 800px, 1150px 1150px, 1050px 1050px;
}
.stars--a { animation: twinkle-a 3s ease-in-out infinite; }
.stars--b {
  background-size: 820px 820px, 720px 720px, 940px 940px, 880px 880px, 1060px 1060px, 670px 670px, 970px 970px, 890px 890px;
  background-position: 40% 20%, 10% 60%, 70% 30%, 25% 80%, 90% 50%, 55% 75%, 15% 15%, 80% 85%;
  animation: twinkle-b 4.2s ease-in-out infinite .6s;
}
@keyframes twinkle-a { 0%,100% { opacity: .88; } 50% { opacity: .28; } }
@keyframes twinkle-b { 0%,100% { opacity: .3; }  50% { opacity: .78; } }

.grain {
  position: fixed; inset: 0; z-index: 2;
  pointer-events: none;
  opacity: .3;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.98, 0 0 0 0 0.92, 0 0 0 0 0.78, 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  background-size: 220px 220px;
}

/* topbar */
.topbar {
  position: relative; z-index: 10;
}
.topbar__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 18px 48px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  letter-spacing: .3px;
  color: rgba(247,236,210,0.78);
}
.tb-link {
  color: rgba(247,236,210,0.72);
  cursor: pointer;
  transition: color .2s;
  &:hover { color: $moon; }
}
.tb-current { color: $moon; }
.tb-dot { color: rgba(247,236,210,0.35); }
.tb-spacer { flex: 1; }

.wrap {
  position: relative; z-index: 3;
  max-width: 780px;
  margin: 40px auto 0;
  padding: 0 32px;
}
.panel { text-align: center; }

.kicker {
  font-family: $serif;
  font-style: italic;
  font-size: 15px;
  letter-spacing: 1.2px;
  color: rgba(247,236,210,0.75);
  margin-bottom: 20px;
  &--err { color: $err; }
}
.title {
  font-family: $serif;
  font-weight: 400;
  font-size: clamp(44px, 6.5vw, 84px);
  line-height: .95;
  letter-spacing: -1px;
  color: $moon;
  margin: 0 0 48px;
  em {
    font-style: italic;
    opacity: .96;
  }
}

/* ── moon orb (progress / status) ── */
.orb {
  position: relative;
  width: 220px; height: 220px;
  margin: 0 auto 36px;

  &--small { width: 140px; height: 140px; }
}
.orb__halo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--outer {
    inset: -24%;
    background: radial-gradient(circle, rgba(247,236,210,0.3), transparent 65%);
    filter: blur(36px);
    animation: halo-breath 4s ease-in-out infinite;
  }
  &--inner {
    inset: -8%;
    background: radial-gradient(circle, rgba(247,236,210,0.26), transparent 72%);
    filter: blur(10px);
    animation: halo-breath-i 3s ease-in-out infinite;
  }
}
@keyframes halo-breath   { 0%,100% { opacity: .7; transform: scale(1);} 50% { opacity: 1.25; transform: scale(1.16);} }
@keyframes halo-breath-i { 0%,100% { opacity: .65; transform: scale(1);} 50% { opacity: 1.1; transform: scale(1.08);} }

.orb__iris {
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
      rgba(247,200,230,0.35),
      rgba(200,180,240,0.30),
      rgba(178,210,255,0.35),
      rgba(220,240,255,0.25),
      rgba(255,214,196,0.30),
      rgba(232,192,220,0.28),
      rgba(247,200,230,0.35));
  filter: blur(14px);
  mix-blend-mode: screen;
  opacity: .72;
  mask: radial-gradient(circle, transparent 56%, #000 62%, #000 74%, transparent 80%);
  -webkit-mask: radial-gradient(circle, transparent 56%, #000 62%, #000 74%, transparent 80%);
  animation: iris-spin 18s linear infinite;
}
@keyframes iris-spin { to { transform: rotate(360deg); } }

.orb__disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 54% 46%, $moon 0%, $moon 60%, $moon-soft 76%, rgba(247,236,210,0.5) 90%, rgba(247,236,210,0) 100%);
  box-shadow: 0 0 60px 20px rgba(247,236,210,0.18), 0 0 140px 60px rgba(247,236,210,0.08);
  animation: disc-glow 4.2s ease-in-out infinite;

  &--dim {
    background: radial-gradient(circle at 54% 46%, rgba(247,236,210,0.5) 0%, rgba(247,236,210,0.44) 60%, rgba(247,236,210,0.2) 82%, transparent 100%);
    box-shadow: none;
    animation: none;
    filter: saturate(.55) hue-rotate(-10deg);
  }
}
@keyframes disc-glow {
  0%,100% { box-shadow: 0 0 60px 20px rgba(247,236,210,0.18), 0 0 140px 60px rgba(247,236,210,0.08); }
  50%     { box-shadow: 0 0 90px 28px rgba(247,236,210,0.3),  0 0 200px 88px rgba(247,236,210,0.14); }
}

.orb__ring {
  position: absolute;
  inset: -5%;
  width: 110%; height: 110%;
  animation: ring-spin 1.4s linear infinite;
}
@keyframes ring-spin { to { transform: rotate(360deg); } }

.orb__icon {
  position: absolute;
  inset: 15%;
  width: 70%; height: 70%;
  opacity: .85;
}
.orb__label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $serif;
  font-style: italic;
  font-size: 26px;
  letter-spacing: 1.5px;
  color: #3a4268;
  pointer-events: none;
}

.desc {
  font-size: 14.5px;
  line-height: 1.85;
  color: $fg-mute;
  margin: 0 auto 40px;
  max-width: 520px;
  em {
    font-style: italic;
    color: $moon;
    font-family: $serif;
    font-size: 17px;
  }
}

/* ── flow (3 steps) ── */
.flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  column-gap: 14px;
  margin: 40px auto 36px;
  max-width: 640px;
}
.flow__step {
  display: flex; flex-direction: column;
  align-items: center;
  opacity: .32;
  transition: opacity .4s ease;
  &.active, &.done { opacity: 1; }
}
.flow__num {
  font-family: $serif;
  font-style: italic;
  font-size: 38px;
  color: $moon;
  line-height: 1;
  margin-bottom: 6px;
}
.flow__name {
  font-size: 13.5px;
  color: $fg;
  letter-spacing: .4px;
  margin-bottom: 2px;
}
.flow__hint {
  font-family: $serif;
  font-style: italic;
  font-size: 12.5px;
  color: $fg-faint;
}
.flow__line {
  height: 1px;
  width: 36px;
  background: $hair;
  transition: background .4s ease;
  &.done { background: rgba(247,236,210,0.5); }
}

.meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: $fg-mute;
  letter-spacing: .2px;
  padding: 8px 18px;
  border: 1px solid $hair-soft;
  margin-bottom: 30px;
  font-family: $sans;

  .meta__k    { color: $fg-faint; }
  .meta__v    { color: $fg; font-family: $serif; font-style: italic; font-size: 13.5px; }
  .meta__v--live { color: $moon; }
  .meta__sep  { color: $fg-faint; margin: 0 2px; }
}

.note {
  max-width: 560px;
  margin: 0 auto;
  padding: 16px 22px;
  text-align: left;
  border-left: 2px solid rgba(247,236,210,0.3);
  background: rgba(247,236,210,0.04);
  font-size: 13px;
  line-height: 1.85;
  color: $fg-mute;
  em {
    display: block;
    font-family: $serif;
    font-style: italic;
    color: $moon;
    margin-bottom: 4px;
    font-size: 14px;
  }
  &__link {
    color: $moon;
    cursor: pointer;
    border-bottom: 1px solid rgba(247,236,210,0.3);
    padding-bottom: 1px;
    transition: border-color .2s;
    &:hover { border-bottom-color: $moon; }
  }
}

.tips {
  max-width: 540px;
  margin: 0 auto 36px;
  text-align: left;
  padding: 18px 22px;
  border-left: 2px solid $err;
  background: rgba(239,182,176,0.06);
  em {
    display: block;
    font-family: $serif;
    font-style: italic;
    color: $err;
    margin-bottom: 10px;
    font-size: 14.5px;
  }
  ul {
    margin: 0; padding-left: 20px;
    font-size: 13px;
    line-height: 1.9;
    color: $fg-mute;
    list-style: '— ';
    li::marker { color: $fg-faint; }
  }
}

.submit {
  display: inline-flex;
  align-items: baseline;
  gap: 14px;
  padding: 10px 0;
  font-family: $serif;
  font-style: italic;
  font-size: 22px;
  letter-spacing: .4px;
  color: $moon;
  background: transparent;
  border: none;
  border-bottom: 1px solid $moon;
  cursor: pointer;
  transition: color .3s, border-color .3s, gap .25s;
  text-shadow: 0 0 24px rgba(247,236,210,0.3);

  &__arrow { font-size: 24px; transition: transform .25s; }
  &:hover {
    gap: 22px;
    .submit__arrow { transform: translateX(4px); }
  }
  &--err { color: $err; border-bottom-color: $err; text-shadow: 0 0 20px rgba(239,182,176,0.3); }
}

.panel--loading {
  padding: 80px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.loading-text {
  font-family: $serif;
  font-style: italic;
  font-size: 16px;
  color: $fg-mute;
  letter-spacing: .8px;
}

/* reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stars--a, .stars--b,
  .orb__halo--outer, .orb__halo--inner, .orb__iris, .orb__disc, .orb__ring {
    animation: none !important;
  }
}

/* responsive */
@media (max-width: 768px) {
  .topbar__inner { padding: 14px 24px; }
  .wrap { padding: 0 20px; }
  .title { font-size: clamp(36px, 11vw, 60px); }
  .orb { width: 180px; height: 180px; }
  .flow {
    column-gap: 8px;
    grid-template-columns: 1fr 16px 1fr 16px 1fr;
  }
  .flow__line { width: 16px; }
  .flow__num { font-size: 28px; }
  .meta { flex-wrap: wrap; justify-content: center; }
}
</style>
