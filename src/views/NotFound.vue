<template>
  <div class="notfound-container">
    <div class="content">
      <div class="astronaut">
        <div class="astronaut-body">🧑‍🚀</div>
        <div class="float-text">迷失在太空中...</div>
      </div>
      
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-message">
        抱歉,您访问的页面不存在或已被移除
      </p>
      
      <div class="actions">
        <el-button type="primary" size="large" @click="goHome">
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          返回上一页
        </el-button>
      </div>
    </div>
    
    <!-- 星星背景 -->
    <div class="stars"></div>
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
.notfound-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
    radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)),
    radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 160px 120px, #fff, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 200px 200px;
  animation: twinkle 4s infinite;
}

.content {
  position: relative;
  text-align: center;
  color: white;
  z-index: 1;
}

.astronaut {
  margin-bottom: 40px;
  
  .astronaut-body {
    font-size: 100px;
    animation: float 3s ease-in-out infinite;
  }
  
  .float-text {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 10px;
  }
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(96, 165, 250, 0.5);
}

.error-title {
  font-size: 32px;
  margin-bottom: 15px;
}

.error-message {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 40px;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  
  .el-button {
    min-width: 140px;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(-5deg);
  }
  50% {
    transform: translateY(-30px) rotate(5deg);
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>