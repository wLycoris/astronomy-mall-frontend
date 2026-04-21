<template>
  <el-container class="admin-layout" :class="layoutClass">
    <div class="stars-bg">
      <div v-if="route.path === '/admin/statistics'" class="nebula-pulse"></div>
    </div>


    <el-aside width="260px" class="admin-aside">
      <div class="logo">
        <div class="logo-icon-box">
          <el-icon :size="24" class="logo-icon"><ShoppingCart /></el-icon>
        </div>
        <div class="logo-text">
          <span class="main-title">GALAXY MART</span>
          <span class="sub-title">天文商城管理中枢</span>
        </div>
      </div>

      <div class="aside-status">
        <span class="status-dot"></span>
        <div>
          <span>ADMIN CONSOLE</span>
          <strong>运营管理台</strong>
        </div>
      </div>

      <el-menu
          :default-active="activeMenu"
          router
          class="admin-menu"
          :unique-opened="true"
      >
        <el-menu-item-group
            v-for="group in menuGroups"
            :key="group.key"
            class="menu-section"
        >
          <template #title>
            <span class="menu-group-title">{{ group.title }}</span>
          </template>

          <el-menu-item
              v-for="item in group.children"
              :key="item.path"
              :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span class="menu-title-wrap">
              {{ item.title }}
              <!-- 7.7 论坛管理：待审核帖子数角标 -->
              <el-badge
                  v-if="item.path === '/admin/forum' && forumPendingCount > 0"
                  :value="forumPendingCount"
                  :max="99"
                  class="forum-badge"
              />
            </span>
            <div class="active-glow" v-if="activeMenu === item.path"></div>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="admin-header">
        <div class="header-left">
          <div class="page-heading">
            <span>{{ currentGroup?.title || '管理中心' }}</span>
            <strong>{{ currentPage || '后台首页' }}</strong>
          </div>
          <div class="header-divider"></div>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/statistics' }">
              <span class="breadcrumb-text">
                <el-icon class="mr-1"><DataBoard /></el-icon> 管理中心
              </span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentGroup">
              <span class="breadcrumb-text">{{ currentGroup.title }}</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPage">
              <span class="breadcrumb-active">{{ currentPage }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <div class="header-chip">
            <span class="signal-dot"></span>
            <span>后台在线</span>
          </div>

          <button class="icon-action" type="button" title="刷新当前页" @click="refreshCurrentPage">
            <el-icon><RefreshRight /></el-icon>
          </button>

          <button class="action-btn" type="button" @click="backToHome">
            <el-icon><HomeFilled /></el-icon>
            <span>返回前台</span>
          </button>

          <div class="user-profile">
            <el-dropdown @command="handleCommand" trigger="click">
              <div class="avatar-wrapper">
                <el-avatar :size="36" :src="adminAvatar" class="admin-avatar">
                  {{ adminInitial }}
                </el-avatar>
                <span class="admin-identity">
                  <span class="username">{{ adminDisplayName }}</span>
                  <span class="admin-role">{{ adminRoleText }}</span>
                </span>
                <el-icon class="el-icon--right"><CaretBottom /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="custom-dropdown">
                  <el-dropdown-item command="home">
                    <el-icon><HomeFilled /></el-icon> 返回前台
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
import { onMounted, onBeforeUnmount } from 'vue'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getPendingCount } from '@/api/admin/forum'   // 🆕 7.7 论坛待审核数
import {
  HomeFilled, User, SwitchButton, ShoppingCart,
  DataAnalysis, Goods, Document, Money,
  ChatDotRound, Menu, CaretBottom, DataBoard, List, Setting, Tools,
  RefreshRight,        // 2.5.3 二手回收图标
  Warning,             // 库存预警图标
  Bell,                // 3.4.1 系统公告图标
  Tickets,             // 3.4.3 通知模板图标
  Reading,             // 🆕 5.5 课程管理图标
  Star,                // 🆕 5.6 课程评价图标
  MapLocation,         // 🆕 6.5 观测点管理图标
  ChatLineSquare       // 🆕 7.7 论坛管理图标
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const DEFAULT_ADMIN_AVATAR = '/images/default_avatar.png'

const menuGroups = ref([
  {
    key: 'data',
    title: '数据中心',
    children: [
      { path: '/admin/statistics', title: '数据概览', icon: DataAnalysis }
    ]
  },
  {
    key: 'commerce',
    title: '交易运营',
    children: [
      { path: '/admin/product', title: '商品管理', icon: Goods },
      { path: '/admin/category', title: '分类管理', icon: Menu },
      { path: '/admin/stock-warning', title: '库存预警', icon: Warning },
      { path: '/admin/order', title: '订单管理', icon: Document },
      { path: '/admin/refund', title: '退款审核', icon: Money },
      { path: '/admin/review', title: '评价管理', icon: ChatDotRound }
    ]
  },
  {
    key: 'service',
    title: '服务管理',
    children: [
      { path: '/admin/installation', title: '安装预约管理', icon: Tools },
      { path: '/admin/recycling', title: '二手回收管理', icon: RefreshRight },
      { path: '/admin/location', title: '观测点管理', icon: MapLocation }
    ]
  },
  {
    key: 'content',
    title: '内容运营',
    children: [
      { path: '/admin/announcement', title: '系统公告', icon: Bell },
      { path: '/admin/notification-record', title: '通知记录', icon: ChatDotRound },
      { path: '/admin/notification-template', title: '通知模板', icon: Tickets },
      { path: '/admin/course', title: '课程管理', icon: Reading },
      { path: '/admin/course-review', title: '课程评价', icon: Star },
      { path: '/admin/forum', title: '论坛管理', icon: ChatLineSquare }
    ]
  },
  {
    key: 'system',
    title: '系统管理',
    children: [
      { path: '/admin/user', title: '用户管理', icon: User },
      { path: '/admin/log', title: '操作日志', icon: List },
      { path: '/admin/setting', title: '系统设置', icon: Setting }
    ]
  }
])

const menuItems = computed(() => menuGroups.value.flatMap(group => group.children))

// ============================================================
// 🆕 7.7 论坛待审核数（侧边栏角标）
// 进入后台后立即拉取一次，并每 60s 静默刷新一次
// ============================================================
const forumPendingCount = ref(0)
let forumPendingTimer = null

const refreshForumPendingCount = async () => {
  try {
    const res = await getPendingCount()
    forumPendingCount.value = res.data || 0
  } catch (e) {
    // 静默失败，不打扰管理员
  }
}

const activeMenu = computed(() => route.path)
const currentGroup = computed(() => {
  return menuGroups.value.find(group =>
    group.children.some(item => item.path === route.path)
  )
})
const currentPage = computed(() => {
  const item = menuItems.value.find(m => m.path === route.path)
  return item ? item.title : ''
})
const adminAvatar = computed(() => {
  const avatar = userStore.userInfo?.avatar
  return typeof avatar === 'string' && avatar.trim() ? avatar : DEFAULT_ADMIN_AVATAR
})
const adminDisplayName = computed(() =>
  userStore.userInfo?.nickname ||
  userStore.userInfo?.username ||
  '管理员'
)
const adminInitial = computed(() => adminDisplayName.value.slice(0, 1).toUpperCase())
const adminRoleText = computed(() => userStore.userInfo?.role === 1 ? '系统管理员' : '后台用户')
const themes = ['red', 'blue', 'purple']

onMounted(() => {
  theme.value = themes[Math.floor(Math.random() * themes.length)]
  // 7.7 拉取一次论坛待审核数 + 60s 定时刷新
  refreshForumPendingCount()
  forumPendingTimer = setInterval(refreshForumPendingCount, 60 * 1000)

  // 🔥 标记 body/html，使 AdminLayout 的 body 级全局样式只在后台激活
  //   （修复：admin 页面的 `html, body { overflow-y: auto }` 一旦加载便滞留在文档中，
  //    离开后回到首页时 body 仍是滚动容器，导致 window scroll 事件不再触发，
  //    Home.vue 的滚动图片切换失效）
  document.documentElement.classList.add('admin-active')
  document.body.classList.add('admin-active')
})

onBeforeUnmount(() => {
  if (forumPendingTimer) {
    clearInterval(forumPendingTimer)
    forumPendingTimer = null
  }
  // 🔥 离开后台：恢复默认滚动容器（window）
  document.documentElement.classList.remove('admin-active')
  document.body.classList.remove('admin-active')
})
const backToHome = () => router.push('/')
const refreshCurrentPage = () => router.go(0)

const handleCommand = async (command) => {
  if (command === 'home') backToHome()
  else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出后台管理吗?', '退出登录', {
        confirmButtonText: '退出登录',
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
const theme = ref('red')

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
$bg-deep: #0b1120;
$bg-sidebar: #0f172a;
$accent-cyan: #06b6d4;
$accent-blue: #3b82f6;
$text-light: #e2e8f0;
$text-dim: #94a3b8;
$glass-bg: rgba(15, 23, 42, 0.7);

/* ================== 主题变量 ================== */
.admin-layout {
  --nebula-main: rgba(160, 20, 20, 0.35);
  --nebula-sub: rgba(90, 10, 10, 0.22);
  --core-main: rgba(255, 120, 180, 0.25);
  --core-sub: rgba(120, 60, 160, 0.18);
  --galaxy-main: rgba(140, 90, 255, 0.28);
  min-height: 100vh;
}

.theme-red {
  --nebula-main: rgba(160, 20, 20, 0.38);
  --nebula-sub: rgba(90, 10, 10, 0.25);
  --core-main: rgba(255, 120, 180, 0.28);
  --core-sub: rgba(120, 60, 160, 0.18);
  --galaxy-main: rgba(160, 120, 255, 0.25);
}

.theme-blue {
  --nebula-main: rgba(40, 90, 180, 0.35);
  --nebula-sub: rgba(20, 40, 100, 0.22);
  --core-main: rgba(120, 180, 255, 0.3);
  --core-sub: rgba(80, 120, 200, 0.18);
  --galaxy-main: rgba(120, 180, 255, 0.35);
}

.theme-purple {
  --nebula-main: rgba(120, 60, 180, 0.35);
  --nebula-sub: rgba(60, 20, 120, 0.22);
  --core-main: rgba(200, 120, 255, 0.3);
  --core-sub: rgba(120, 60, 180, 0.18);
  --galaxy-main: rgba(180, 120, 255, 0.32);
}

.route-normal .stars-bg {
  filter: contrast(1.05) saturate(1.05);
  opacity: 0.9;
}

.route-dashboard .stars-bg {
  filter: contrast(1.15) saturate(1.25);
  opacity: 1;
}

.route-dashboard .stars-bg .nebula-pulse {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 65%);
  animation: nebula-pulse 8s ease-in-out infinite;
  mix-blend-mode: screen;
}

.theme-switch {
  width: 120px;
  :deep(.el-input__wrapper) {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
  }
  :deep(.el-input__inner) { color: #fff; }
}

/* ================== 星云背景 ================== */
.stars-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: #040000;
  background-image:
      radial-gradient(circle at 52% 48%, var(--core-main), var(--core-sub), transparent 45%),
      radial-gradient(circle at 20% 30%, var(--nebula-main), var(--nebula-sub), transparent 55%),
      radial-gradient(circle at 80% 70%, var(--nebula-main), var(--nebula-sub), transparent 60%),
      linear-gradient(100deg, transparent 0%, rgba(120, 160, 255, 0.08) 20%, var(--galaxy-main) 50%, rgba(120, 160, 255, 0.08) 80%, transparent 100%);
}

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

.admin-layout::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 40, 40, 0.04) 0%, transparent 45%, rgba(120, 20, 20, 0.03) 100%);
  mix-blend-mode: screen;
}

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
  background:
      radial-gradient(circle at 20% 0%, rgba($accent-cyan, 0.16), transparent 30%),
      radial-gradient(circle at 85% 18%, rgba($accent-blue, 0.14), transparent 34%),
      linear-gradient(180deg, $bg-sidebar 0%, #020617 100%);
  border-right: 1px solid rgba(148, 163, 184, 0.14);
  z-index: 10;
  display: flex;
  flex-direction: column;
  box-shadow: 10px 0 34px rgba(0, 0, 0, 0.34), inset -1px 0 0 rgba(255, 255, 255, 0.04);
  height: 100vh;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  overflow-y: auto;
  &::-webkit-scrollbar { width: 0; }
}

.logo {
  min-height: 86px;
  display: flex;
  align-items: center;
  padding: 0 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0,0,0,0.18);

  .logo-icon-box {
    width: 42px; height: 42px;
    background:
        radial-gradient(circle at 35% 30%, rgba(255,255,255,0.46), transparent 28%),
        linear-gradient(135deg, $accent-blue, $accent-cyan);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    box-shadow: 0 0 20px rgba($accent-cyan, 0.42), 0 12px 24px rgba(0, 0, 0, 0.22);
    .logo-icon { color: white; animation: float 3s ease-in-out infinite; }
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    .main-title { font-weight: 800; font-size: 16px; letter-spacing: 1px; color: white; }
    .sub-title { font-size: 12px; color: #b6c4d7; letter-spacing: 0; margin-top: 4px; }
  }
}

.aside-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 16px 6px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);

  .status-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: $accent-cyan;
    box-shadow: 0 0 12px rgba($accent-cyan, 0.86);
    flex-shrink: 0;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  span {
    color: #7dd3fc;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.4px;
  }

  strong {
    color: #f8fafc;
    font-size: 13px;
    letter-spacing: 0;
  }
}

.admin-menu {
  border-right: none;
  background: transparent;
  margin-top: 4px;
  padding: 0 0 18px;

  :deep(.el-menu-item-group__title) {
    padding: 16px 22px 7px !important;
    line-height: 1;
  }

  .menu-group-title {
    color: rgba(203, 213, 225, 0.64);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.6px;
  }

  :deep(.el-menu-item) {
    height: 44px;
    margin: 3px 14px;
    border-radius: 10px;
    color: #b6c4d7;
    border: 1px solid transparent;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(125, 211, 252, 0.12);
      color: white;
    }

    &.is-active {
      background:
          linear-gradient(90deg, rgba($accent-blue, 0.24) 0%, rgba($accent-cyan, 0.12) 100%);
      color: #e0f7ff;
      font-weight: 600;
      position: relative;
      overflow: hidden;
      border-color: rgba($accent-cyan, 0.3);
      box-shadow: 0 0 20px rgba($accent-cyan, 0.11);

      &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: $accent-cyan;
        box-shadow: 0 0 14px $accent-cyan;
      }

      .active-glow {
        position: absolute;
        right: 0; top: 0; bottom: 0; width: 58px;
        background: linear-gradient(90deg, transparent, rgba($accent-cyan, 0.16));
      }
    }

    .el-icon {
      margin-right: 12px;
      transition: transform 0.3s;
    }
    &:hover .el-icon { transform: scale(1.1); }

    /* 🆕 7.7 论坛待审核数角标：包在 menu-title-wrap 里和文字同行 */
    .menu-title-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      width: 100%;

      :deep(.forum-badge) {
        line-height: 1;
        .el-badge__content {
          background: linear-gradient(135deg, #ff4d6d, #c9184a);
          box-shadow: 0 0 8px rgba(255, 77, 109, 0.6);
          border: none;
          font-weight: 600;
        }
      }
    }
  }
}

/* --- 顶部栏 --- */
.admin-header {
  background:
      linear-gradient(90deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 10px 28px rgba(2, 6, 23, 0.22);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.page-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 108px;

  span {
    color: #7dd3fc;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
  }

  strong {
    color: #f8fafc;
    font-size: 18px;
    letter-spacing: 0;
    line-height: 1.2;
  }
}

.header-divider {
  width: 1px;
  height: 30px;
  background: rgba(148, 163, 184, 0.2);
}

:deep(.el-breadcrumb__inner) {
  color: $text-dim !important;
  font-weight: normal;
  &.is-link:hover { color: $accent-cyan !important; }
}
.breadcrumb-text {
  display: inline-flex;
  align-items: center;
}
.breadcrumb-active { color: white; text-shadow: 0 0 10px rgba(255,255,255,0.3); }

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;

  button {
    font-family: inherit;
  }

  .header-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(125, 211, 252, 0.18);
    background: rgba(15, 23, 42, 0.54);
    color: #cbd5e1;
    font-size: 12px;
  }

  .signal-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.72);
  }

  .icon-action {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(15, 23, 42, 0.56);
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      color: #e0f7ff;
      border-color: rgba($accent-cyan, 0.36);
      box-shadow: 0 0 16px rgba($accent-cyan, 0.16);
      transform: translateY(-1px);
    }
  }

  .action-btn {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: 10px;
    background: rgba($accent-blue, 0.1);
    border: 1px solid rgba($accent-blue, 0.3);
    color: #bfdbfe;
    font-size: 13px;
    transition: all 0.3s;

    &:hover {
      background: rgba($accent-blue, 0.2);
      box-shadow: 0 0 15px rgba($accent-blue, 0.3);
      transform: translateY(-1px);
    }
  }

  .avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    height: 42px;
    padding: 0 10px;
    border-radius: 12px;
    transition: background 0.3s;
    border: 1px solid transparent;

    &:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(148, 163, 184, 0.14);
    }

    .admin-avatar {
      flex-shrink: 0;
      border: 1px solid rgba(125, 211, 252, 0.42);
      background: rgba(15, 23, 42, 0.72);
      color: #e0f7ff;
      font-weight: 800;
      box-shadow: 0 0 14px rgba($accent-cyan, 0.2);
    }

    .admin-identity {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .username {
      color: white;
      font-size: 14px;
      line-height: 1.15;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .admin-role {
      color: #94a3b8;
      font-size: 11px;
      line-height: 1.1;
    }

    .el-icon--right { color: $text-dim; }
  }
}

/* --- 主内容区 --- */
.main-container {
  flex-direction: column;
  position: relative;
  min-height: 100vh;
  z-index: 1;
}

.admin-main {
  padding: 24px;
  overflow-y: visible;
  background: rgba(11, 17, 32, 0.3);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin: 15px;
  border-radius: 12px;
}

.fade-transform-leave-active, .fade-transform-enter-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}
.fade-transform-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(20px); }

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

.admin-aside,
.admin-header,
.admin-main {
  position: relative;
  z-index: 10;
  transform: none !important;
  filter: none !important;
}

// 🔥 修复：下列全局规则仅在后台激活时生效（body.admin-active）,
//   否则离开后台回到首页，body 仍是滚动容器会导致 window scroll 事件失效
body.admin-active {
  .el-container,
  .el-main {
    overflow: visible !important;
  }
}

html.admin-active,
body.admin-active {
  overflow-y: auto;
}

body.admin-active {
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

  .admin-page-hero {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 18px;
    margin-bottom: 18px;
    padding: 22px 24px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 14px;
    background:
      radial-gradient(circle at 92% 18%, rgba(6, 182, 212, 0.22), transparent 34%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.9));
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
    color: #f8fafc;
  }

  .admin-page-hero.tone-amber {
    background:
      radial-gradient(circle at 90% 18%, rgba(245, 158, 11, 0.22), transparent 34%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(41, 37, 36, 0.9));
  }

  .admin-page-hero.tone-green {
    background:
      radial-gradient(circle at 90% 18%, rgba(16, 185, 129, 0.2), transparent 34%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(20, 83, 45, 0.84));
  }

  .admin-page-hero.tone-violet {
    background:
      radial-gradient(circle at 90% 18%, rgba(139, 92, 246, 0.2), transparent 34%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(49, 46, 129, 0.86));
  }

  .admin-page-copy {
    min-width: 0;
  }

  .admin-page-kicker {
    display: inline-flex;
    align-items: center;
    margin-bottom: 10px;
    color: #facc15;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.8px;
    text-transform: uppercase;
  }

  .admin-page-copy h2 {
    margin: 0;
    color: #fff;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 0;
  }

  .admin-page-copy p {
    max-width: 560px;
    margin: 9px 0 0;
    color: #cbd5e1;
    font-size: 13px;
    line-height: 1.7;
  }

  .admin-page-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(96px, 1fr));
    gap: 10px;
    min-width: 360px;
  }

  .admin-metric-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 78px;
    padding: 14px;
    border: 1px solid rgba(226, 232, 240, 0.12);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.48);
  }

  .admin-metric-card span {
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.2;
  }

  .admin-metric-card strong {
    margin-top: 8px;
    color: #f8fafc;
    font-size: 22px;
    line-height: 1;
    letter-spacing: 0;
  }

  .admin-metric-card.warning strong { color: #facc15; }
  .admin-metric-card.success strong { color: #86efac; }
  .admin-metric-card.danger strong { color: #fb7185; }

  .admin-panel-card {
    border: 1px solid rgba(226, 232, 240, 0.92) !important;
    border-radius: 12px !important;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06) !important;
  }

  .admin-card-title {
    display: block;
    color: #111827;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.2;
  }

  .admin-card-subtitle {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
  }

  .admin-toolbar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 14px;
  }
}

@media (max-width: 1100px) {
  body.admin-active {
    .admin-page-hero {
      flex-direction: column;
    }

    .admin-page-metrics {
      min-width: 0;
    }
  }
}
</style>
