<template>
  <div class="maintenance-page">
    <div class="star-field"></div>

    <section class="maintenance-card">
      <div class="status-kicker">
        <span class="status-dot"></span>
        <span>SYSTEM STATUS</span>
      </div>

      <h1>系统维护中</h1>
      <p class="message">{{ maintenanceMessage }}</p>

      <div class="status-panel">
        <div class="status-row">
          <span class="row-label">当前状态</span>
          <span class="row-value">维护中</span>
        </div>
        <div v-if="maintenanceEndTime" class="status-row">
          <span class="row-label">预计恢复</span>
          <strong class="row-value highlight">{{ maintenanceEndTime }}</strong>
        </div>
        <div class="status-row">
          <span class="row-label">访问建议</span>
          <span class="row-value">稍后刷新页面</span>
        </div>
      </div>

      <p class="tips">感谢你的耐心等待，维护完成后即可正常访问。</p>

      <router-link to="/login" class="login-link">管理员登录</router-link>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMaintenanceSetting } from '@/api/admin/setting'

const maintenanceMessage = ref('系统维护中，请稍后再访问...')
const maintenanceEndTime = ref('')

onMounted(async () => {
  try {
    const res = await getMaintenanceSetting()
    maintenanceMessage.value = res.data.maintenanceMessage || '系统维护中，请稍后再访问...'
    maintenanceEndTime.value = res.data.maintenanceEndTime || ''
  } catch (e) {
    // 读取失败显示默认文案
  }
})
</script>

<style scoped lang="scss">
.maintenance-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 18px;
  background:
    linear-gradient(rgba(247, 236, 210, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(247, 236, 210, .03) 1px, transparent 1px),
    radial-gradient(900px 420px at 50% 0%, rgba(199, 165, 114, .12), transparent 68%),
    #080d1c;
  background-size: 34px 34px, 34px 34px, auto, auto;
  color: #f3e9cf;
}

.star-field {
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
}

.maintenance-card {
  position: relative;
  z-index: 1;
  padding: 46px 48px 42px;
  max-width: 560px;
  width: 90%;
  border: 1px solid rgba(243, 233, 207, .22);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, .96), rgba(8, 13, 28, .98));
  box-shadow: 0 28px 70px rgba(0, 0, 0, .34);
  animation: fadeInUp .5s ease;
}

.status-kicker {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 18px;
  color: #f4d08a;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f4d08a;
  box-shadow: 0 0 0 6px rgba(244, 208, 138, .10);
  animation: pulse 1.8s ease-in-out infinite;
}

h1 {
  margin: 0 0 14px;
  color: #fffdfa;
  font-size: 38px;
  font-weight: 900;
  line-height: 1.2;
}

.message {
  margin: 0 0 26px;
  color: rgba(243, 233, 207, .82);
  font-size: 16px;
  line-height: 1.8;
}

.status-panel {
  display: grid;
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(243, 233, 207, .16);
  border-radius: 7px;
  background: rgba(255, 253, 250, .045);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(243, 233, 207, .12);

  &:last-child {
    border-bottom: 0;
  }
}

.row-label {
  color: rgba(243, 233, 207, .62);
  font-size: 13px;
}

.row-value {
  color: #fffdfa;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
}

.highlight {
  color: #f4d08a;
}

.tips {
  margin: 22px 0 0;
  padding-top: 20px;
  border-top: 1px solid rgba(243, 233, 207, .14);
  color: rgba(243, 233, 207, .64);
  font-size: 13px;
  line-height: 1.7;
}

.login-link {
  display: inline-block;
  margin-top: 20px;
  font-size: 13px;
  color: #f4d08a;
  text-decoration: none;
  font-weight: 800;
  border-bottom: 1px solid rgba(244, 208, 138, .36);

  &:hover {
    color: #fffdfa;
    border-bottom-color: #fffdfa;
  }
}

@keyframes pulse {
  0%, 100% { opacity: .58; transform: scale(.86); }
  50% { opacity: 1; transform: scale(1.08); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 620px) {
  .maintenance-card {
    padding: 34px 24px 30px;
    width: 100%;
  }

  h1 {
    font-size: 30px;
  }

  .status-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .row-value {
    text-align: left;
  }
}
</style>
