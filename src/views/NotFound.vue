<template>
  <div class="notfound-page">
    <div class="stars"></div>

    <main class="notfound-card">
      <div class="chart-mark" aria-hidden="true">
        <span class="orbit orbit-a"></span>
        <span class="orbit orbit-b"></span>
        <span class="chart-dot dot-a"></span>
        <span class="chart-dot dot-b"></span>
        <span class="chart-dot dot-c"></span>
      </div>

      <div class="kicker">LOST COORDINATE</div>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-message">抱歉，你访问的页面不存在、已被移除，或坐标已经失效。</p>

      <div class="actions">
        <button class="primary-btn" @click="goHome">返回首页</button>
        <button class="secondary-btn" @click="goBack">返回上一页</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/home')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.notfound-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 36px 18px;
  background:
    linear-gradient(rgba(247, 236, 210, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(247, 236, 210, .03) 1px, transparent 1px),
    radial-gradient(900px 420px at 50% 0%, rgba(199, 165, 114, .12), transparent 68%),
    #080d1c;
  background-size: 34px 34px, 34px 34px, auto, auto;
}

.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .72;
  background-image:
    radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,.76), transparent 55%),
    radial-gradient(1px 1px at 76% 18%, rgba(247,236,210,.72), transparent 55%),
    radial-gradient(1px 1px at 34% 74%, rgba(255,255,255,.50), transparent 55%),
    radial-gradient(1px 1px at 88% 62%, rgba(185,200,232,.56), transparent 55%),
    radial-gradient(1px 1px at 58% 88%, rgba(199,165,114,.62), transparent 55%);
  background-size: 560px 560px, 740px 740px, 620px 620px, 900px 900px, 820px 820px;
  animation: twinkle 4.8s ease-in-out infinite alternate;
}

.notfound-card {
  position: relative;
  text-align: center;
  color: #f3e9cf;
  z-index: 1;
  width: min(560px, 100%);
  padding: 48px 42px 44px;
  border: 1px solid rgba(243, 233, 207, .22);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, .96), rgba(8, 13, 28, .98));
  box-shadow: 0 28px 70px rgba(0, 0, 0, .34);
}

.chart-mark {
  position: relative;
  width: 128px;
  height: 128px;
  margin: 0 auto 24px;
  border: 1px solid rgba(243, 233, 207, .18);
  border-radius: 50%;
}

.chart-mark::before,
.chart-mark::after {
  content: '';
  position: absolute;
  background: rgba(243, 233, 207, .18);
}

.chart-mark::before {
  left: 12px;
  right: 12px;
  top: 50%;
  height: 1px;
}

.chart-mark::after {
  top: 12px;
  bottom: 12px;
  left: 50%;
  width: 1px;
}

.orbit {
  position: absolute;
  inset: 22px;
  border: 1px solid rgba(243, 233, 207, .18);
  border-radius: 50%;
}

.orbit-b {
  inset: 42px;
}

.chart-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f4d08a;
  box-shadow: 0 0 16px rgba(244, 208, 138, .42);
}

.dot-a {
  left: 30px;
  top: 36px;
}

.dot-b {
  right: 24px;
  top: 52px;
  background: #f3e9cf;
}

.dot-c {
  left: 58px;
  bottom: 24px;
}

.kicker {
  margin-bottom: 12px;
  color: #f4d08a;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.error-code {
  margin: 0;
  color: #fffdfa;
  font-size: 112px;
  font-weight: 900;
  line-height: .95;
  letter-spacing: 2px;
}

.error-title {
  margin: 18px 0 12px;
  color: #f3e9cf;
  font-size: 28px;
  font-weight: 900;
}

.error-message {
  max-width: 420px;
  margin: 0 auto 32px;
  color: rgba(243, 233, 207, .72);
  font-size: 14px;
  line-height: 1.8;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn {
  min-width: 132px;
  height: 40px;
  padding: 0 18px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  transition: background .2s, border-color .2s, color .2s, transform .2s;
}

.primary-btn {
  border: 1px solid #f4d08a;
  background: #f4d08a;
  color: #111827;
}

.primary-btn:hover {
  border-color: #fffdfa;
  background: #fffdfa;
  transform: translateY(-1px);
}

.secondary-btn {
  border: 1px solid rgba(243, 233, 207, .28);
  background: transparent;
  color: #f3e9cf;
}

.secondary-btn:hover {
  border-color: #f3e9cf;
  background: rgba(243, 233, 207, .08);
  color: #fffdfa;
  transform: translateY(-1px);
}

@keyframes twinkle {
  from { opacity: .46; }
  to { opacity: .86; }
}

@media (max-width: 560px) {
  .notfound-card {
    padding: 38px 24px 34px;
  }

  .error-code {
    font-size: 82px;
  }
}
</style>
