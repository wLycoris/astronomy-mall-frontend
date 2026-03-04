<template>
  <el-container class="admin-layout" :class="layoutClass">
    <div class="stars-bg">
      <div v-if="route.path === '/admin/statistics'" class="nebula-pulse"></div>
    </div>


    <el-aside width="240px" class="admin-aside">
      <div class="logo">
        <div class="logo-icon-box">
          <el-icon :size="24" class="logo-icon"><ShoppingCart /></el-icon>
        </div>
        <div class="logo-text">
          <span class="main-title">GALAXY MART</span>
          <span class="sub-title">天文商城管理中枢</span>
        </div>
      </div>

      <el-menu
          :default-active="activeMenu"
          router
          class="admin-menu"
          :unique-opened="true"
      >
        <el-menu-item
            v-for="item in menuItems"
            :key="item.path"
            :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
          <div class="active-glow" v-if="activeMenu === item.path"></div>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/statistics' }">
              <span class="breadcrumb-text">
                <el-icon class="mr-1"><DataBoard /></el-icon> 管理中心
              </span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPage">
              <span class="breadcrumb-active">{{ currentPage }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <div class="action-btn" @click="backToHome">
            <el-icon><HomeFilled /></el-icon>
            <span>返回用户端</span>
          </div>

          <div class="user-profile">
            <el-dropdown @command="handleCommand" trigger="click">
              <div class="avatar-wrapper">
                <el-avatar :size="36" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <span class="username">{{ userStore.userInfo?.username || '管理员' }}</span>
                <el-icon class="el-icon--right"><CaretBottom /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="custom-dropdown">
                  <el-dropdown-item command="home">
                    <el-icon><HomeFilled /></el-icon> 返回用户端
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled, User, SwitchButton, ShoppingCart,
  DataAnalysis, Goods, Document, Money,
  ChatDotRound, Menu, CaretBottom, DataBoard
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuItems = ref([
  { path: '/admin/statistics', title: '数据概览', icon: 'DataAnalysis' },
  { path: '/admin/product', title: '商品管理', icon: 'Goods' },
  { path: '/admin/order', title: '订单管理', icon: 'Document' },
  { path: '/admin/refund', title: '退款审核', icon: 'Money' },
  { path: '/admin/review', title: '评价管理', icon: 'ChatDotRound' },
  { path: '/admin/user', title: '用户管理', icon: 'User' },
  { path: '/admin/category', title: '分类管理', icon: 'Menu' }
])

const activeMenu = computed(() => route.path)
const currentPage = computed(() => {
  const item = menuItems.value.find(m => m.path === route.path)
  return item ? item.title : ''
})
const themes = ['red', 'blue', 'purple']

onMounted(() => {
  theme.value = themes[Math.floor(Math.random() * themes.length)]
})
const backToHome = () => router.push('/')

const handleCommand = async (command) => {
  if (command === 'home') backToHome()
  else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定断开与指挥中心的连接吗?', '系统警告', {
        confirmButtonText: '断开连接',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      })
      await userStore.logout()
      ElMessage.success('已安全退出系统')
      router.push('/admin/login')
    } catch (e) {}
  }
}
const theme = ref('red') // red | blue | purple

const layoutClass = computed(() => {
  const isDashboard = route.path === '/admin/statistics'
  return [
    `theme-${theme.value}`,
    isDashboard ? 'route-dashboard' : 'route-normal'
  ]
})

</script>

<style scoped lang="scss">
/* --- 变量定义 --- */
$bg-deep: #0b1120;       // 深空底色
$bg-sidebar: #0f172a;    // 侧边栏色
$accent-cyan: #06b6d4;   // 科技青
$accent-blue: #3b82f6;   // 科技蓝
$text-light: #e2e8f0;    // 亮色文字
$text-dim: #94a3b8;      // 暗淡文字
$glass-bg: rgba(15, 23, 42, 0.7); // 毛玻璃背景

/* ================== 主题变量 ================== */
.admin-layout {
  --nebula-main: rgba(160, 20, 20, 0.35);
  --nebula-sub: rgba(90, 10, 10, 0.22);
  --core-main: rgba(255, 120, 180, 0.25);
  --core-sub: rgba(120, 60, 160, 0.18);
  --galaxy-main: rgba(140, 90, 255, 0.28);
  /* ✅ 修复：改为 min-height，让内容超出时由 body 负责滚动 */
  min-height: 100vh;
}

/* 🔴 红色星云 */
.theme-red {
  --nebula-main: rgba(160, 20, 20, 0.38);
  --nebula-sub: rgba(90, 10, 10, 0.25);
  --core-main: rgba(255, 120, 180, 0.28);
  --core-sub: rgba(120, 60, 160, 0.18);
  --galaxy-main: rgba(160, 120, 255, 0.25);
}

/* 🔵 蓝色银河 */
.theme-blue {
  --nebula-main: rgba(40, 90, 180, 0.35);
  --nebula-sub: rgba(20, 40, 100, 0.22);
  --core-main: rgba(120, 180, 255, 0.3);
  --core-sub: rgba(80, 120, 200, 0.18);
  --galaxy-main: rgba(120, 180, 255, 0.35);
}

/* 🟣 紫色深空 */
.theme-purple {
  --nebula-main: rgba(120, 60, 180, 0.35);
  --nebula-sub: rgba(60, 20, 120, 0.22);
  --core-main: rgba(200, 120, 255, 0.3);
  --core-sub: rgba(120, 60, 180, 0.18);
  --galaxy-main: rgba(180, 120, 255, 0.32);
}

/* 普通页面 */
.route-normal .stars-bg {
  filter: contrast(1.05) saturate(1.05);
  opacity: 0.9;
}

/* Dashboard 特殊高能态 */
.route-dashboard .stars-bg {
  filter: contrast(1.15) saturate(1.25);
  opacity: 1;
}

/* ================== Dashboard 星云脉冲 ================== */
.route-dashboard .stars-bg .nebula-pulse {
  position: absolute;
  inset: 0;
  pointer-events: none;

  background:
      radial-gradient(
              circle at 50% 50%,
              rgba(255,255,255,0.18),
              transparent 65%
      );

  animation: nebula-pulse 8s ease-in-out infinite;
  mix-blend-mode: screen;
}


.theme-switch {
  width: 120px;

  :deep(.el-input__wrapper) {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
  }

  :deep(.el-input__inner) {
    color: #fff;
  }
}


/* ================== 纯 CSS 星云 + 银河背景 ================== */
.stars-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: #040000;

  background-image:
      radial-gradient(circle at 52% 48%,
          var(--core-main),
          var(--core-sub),
          transparent 45%
      ),
      radial-gradient(circle at 20% 30%,
          var(--nebula-main),
          var(--nebula-sub),
          transparent 55%
      ),
      radial-gradient(circle at 80% 70%,
          var(--nebula-main),
          var(--nebula-sub),
          transparent 60%
      ),
      linear-gradient(
              100deg,
              transparent 0%,
              rgba(120, 160, 255, 0.08) 20%,
              var(--galaxy-main) 50%,
              rgba(120, 160, 255, 0.08) 80%,
              transparent 100%
      );
}


/* ================== 星点层（极密） ================== */
.stars-bg::before {
  content: "";
  position: absolute;
  inset: -50%;
  z-index: 1;
  pointer-events: none;

  background-image:
      radial-gradient(1px 1px at 10px 10px, rgba(255,255,255,0.95), transparent),
      radial-gradient(1px 1px at 80px 120px, rgba(255,255,255,0.85), transparent),
      radial-gradient(1.5px 1.5px at 200px 40px, rgba(255,230,230,0.9), transparent),
      radial-gradient(1px 1px at 300px 200px, rgba(220,230,255,0.8), transparent);

  background-size: 160px 160px;
  opacity: 0.55;
  mix-blend-mode: screen;
  animation: star-drift 180s linear infinite;
}

/* ================== 前景亮星 & 闪烁 ================== */
.stars-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;

  background-image:
      radial-gradient(3px 3px at 15% 25%, rgba(255,180,180,0.9), transparent),
      radial-gradient(4px 4px at 75% 35%, rgba(220,235,255,0.95), transparent),
      radial-gradient(2.5px 2.5px at 48% 82%, rgba(255,200,220,0.85), transparent);

  background-size: 500px 500px;
  mix-blend-mode: screen;
  filter: blur(0.6px);
  animation: star-twinkle 5s ease-in-out infinite alternate;
}

/* ================== 整体红色薄雾 ================== */
.admin-layout::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
      linear-gradient(
              135deg,
              rgba(255, 40, 40, 0.04) 0%,
              transparent 45%,
              rgba(120, 20, 20, 0.03) 100%
      );
  mix-blend-mode: screen;
}

/* ================== 动画 ================== */
@keyframes star-drift {
  from { transform: rotate(0deg) scale(1.15); }
  to   { transform: rotate(360deg) scale(1.18); }
}

@keyframes star-twinkle {
  0%   { opacity: 0.4; transform: scale(0.98); }
  100% { opacity: 0.9; transform: scale(1.03); }
}
@keyframes nebula-pulse {
  0%   { opacity: 0.15; transform: scale(0.98); }
  50%  { opacity: 0.45; transform: scale(1.05); }
  100% { opacity: 0.15; transform: scale(0.98); }
}

/* --- 侧边栏 --- */
.admin-aside {
  background: linear-gradient(180deg, $bg-sidebar 0%, #020617 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  /* ✅ 修复：侧边栏固定在左侧，不随页面滚动 */
  height: 100vh;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  &::-webkit-scrollbar { width: 0; }
}

/* Logo 区域 */
.logo {
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0,0,0,0.2);

  .logo-icon-box {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, $accent-blue, $accent-cyan);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    box-shadow: 0 0 15px rgba($accent-cyan, 0.4);

    .logo-icon { color: white; animation: float 3s ease-in-out infinite; }
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    .main-title { font-weight: 800; font-size: 16px; letter-spacing: 1px; color: white; }
    .sub-title { font-size: 10px; color: $text-dim; letter-spacing: 2px; margin-top: 2px; }
  }
}

/* 菜单样式重写 */
.admin-menu {
  border-right: none;
  background: transparent;
  margin-top: 10px;

  :deep(.el-menu-item) {
    height: 56px;
    margin: 4px 10px;
    border-radius: 8px;
    color: $text-dim;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    &.is-active {
      background: linear-gradient(90deg, rgba($accent-blue, 0.2) 0%, rgba($accent-cyan, 0.1) 100%);
      color: $accent-cyan;
      font-weight: 600;
      position: relative;
      overflow: hidden;

      // 选中左侧光条
      &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: $accent-cyan;
        box-shadow: 0 0 10px $accent-cyan;
      }

      // 选中右侧光晕
      .active-glow {
        position: absolute;
        right: 0; top: 0; bottom: 0; width: 40px;
        background: linear-gradient(90deg, transparent, rgba($accent-cyan, 0.1));
      }
    }

    .el-icon {
      margin-right: 12px;
      transition: transform 0.3s;
    }
    &:hover .el-icon { transform: scale(1.1); }
  }
}

/* --- 顶部栏 --- */
.admin-header {
  background: $glass-bg;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  /* ✅ 修复：顶部栏吸顶，不随内容滚动 */
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 面包屑重写 */
:deep(.el-breadcrumb__inner) {
  color: $text-dim !important;
  font-weight: normal;
  &.is-link:hover { color: $accent-cyan !important; }
}
.breadcrumb-active { color: white; text-shadow: 0 0 10px rgba(255,255,255,0.3); }

/* 顶部右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: 25px;

  /* 返回按钮 - 胶囊样式 */
  .action-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 20px;
    background: rgba($accent-blue, 0.1);
    border: 1px solid rgba($accent-blue, 0.3);
    color: $accent-blue;
    font-size: 13px;
    transition: all 0.3s;

    &:hover {
      background: rgba($accent-blue, 0.2);
      box-shadow: 0 0 15px rgba($accent-blue, 0.3);
      transform: translateY(-1px);
    }
  }

  /* 用户头像区域 */
  .avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 8px;
    transition: background 0.3s;

    &:hover { background: rgba(255,255,255,0.05); }

    .username { color: white; font-size: 14px; }
    .el-icon--right { color: $text-dim; }
  }
}

/* --- 主内容区 --- */
.main-container {
  flex-direction: column;
  position: relative;
  /* ✅ 修复：去掉固定高度，让内容自然撑开 */
  min-height: 100vh;
  z-index: 1;
}

.admin-main {
  padding: 24px;
  /* ✅ 修复：去掉 overflow-y: auto，让 body 负责滚动
     这样 el-dialog 的 align-center 才能相对浏览器视口正确居中 */
  overflow-y: visible;
  background: rgba(11, 17, 32, 0.3);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin: 15px;
  border-radius: 12px;
}

/* 页面切换动画 */
.fade-transform-leave-active, .fade-transform-enter-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}
.fade-transform-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(20px); }

/* Logo 漂浮动画 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
  100% { transform: translateY(0px); }
}

.mr-1 { margin-right: 4px; }
</style>

<style lang="scss">
.custom-dropdown {
  background: #1e293b !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;

  .el-dropdown-menu__item {
    color: #e2e8f0 !important;
    &:hover {
      background-color: rgba(6, 182, 212, 0.1) !important;
      color: #06b6d4 !important;
    }
  }

  .el-popper__arrow::before {
    background: #1e293b !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
}

/* ================== UI 层强制固定 ================== */
.admin-aside,
.admin-header,
.admin-main {
  position: relative;
  z-index: 10;
  transform: none !important;
  filter: none !important;
}

/* ✅ 修复：让 el-container 不裁剪内容，body 负责滚动 */
.el-container,
.el-main {
  overflow: visible !important;
}

html, body {
  overflow-y: auto;
}
/* ✅ 弹窗永远固定在屏幕视口正中间 */
.el-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.el-overlay-dialog {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow-y: auto !important;
}

.el-overlay-dialog .el-dialog {
  margin: 0 !important;
  position: relative !important;
  top: auto !important;
}
</style>