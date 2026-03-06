<template>
  <div class="maintenance-page">
    <div class="animated-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
    </div>

    <div class="maintenance-card glass-effect">
      <div class="icon-wrap">
        <span class="icon-emoji">🔧</span>
      </div>
      <h1>系统维护中</h1>
      <p class="message">{{ maintenanceMessage }}</p>
      <p v-if="maintenanceEndTime" class="end-time">
        预计恢复时间：<strong>{{ maintenanceEndTime }}</strong>
      </p>
      <div class="tips">
        <p>感谢您的耐心等待，维护完成后即可正常访问</p>
      </div>
      <router-link to="/login" class="login-link">管理员登录</router-link>
    </div>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.animated-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
    animation: float 20s infinite ease-in-out;
  }

  .orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, #ff6b6b 0%, transparent 70%);
    top: -150px; left: -150px;
  }

  .orb-2 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, #4ecdc4 0%, transparent 70%);
    bottom: -200px; right: -200px;
    animation-delay: 10s;
  }
}

.maintenance-card {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 60px 50px;
  max-width: 520px;
  width: 90%;
  animation: fadeInUp 0.6s ease;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
}

.icon-wrap {
  margin-bottom: 24px;

  .icon-emoji {
    font-size: 72px;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  }
}

h1 {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
}

.message {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  line-height: 1.6;
}

.end-time {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;

  strong {
    color: #ffe66d;
    font-size: 16px;
  }
}

.tips {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
}

.login-link {
  display: inline-block;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -50px) scale(1.1); }
  66%  { transform: translate(-20px, 20px) scale(0.9); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>