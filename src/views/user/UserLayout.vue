<template>
  <!--
    个人中心布局容器
    文件路径: src/views/user/UserLayout.vue

    📌 布局结构: 左侧导航 + 右侧 router-view（参考淘宝/京东风格）
    📌 路由挂载: /user（嵌套路由父容器）

    左侧导航菜单项:
      /user/overview          - 个人概览
      /user/orders            - 我的订单
      /user/address           - 收货地址
      /user/favorites         - 我的收藏（2.6 已上线）
      /user/reviews           - 我的评价
      /user/wallet            - 我的钱包
      /user/installation      - 安装预约 (2.5.1)
      /user/service-reminder  - 器材保养提醒 (2.5.2)
      /user/recycling         - 二手回收 (2.5.3) 🆕
      /user/settings          - 账号设置
  -->
  <div class="user-center-wrapper">
    <!-- 顶部面包屑区 -->
    <div class="user-breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>个人中心</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentMenuTitle }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="user-layout-body">
      <!-- ── 左侧导航 ───────────────────────────────────── -->
      <aside class="user-sidebar">
        <!-- 用户头像信息卡（紧凑版） -->
        <div class="sidebar-user-card">
          <el-avatar :src="sidebarAvatar" :size="56" class="sidebar-avatar" />
          <div class="sidebar-user-info">
            <div class="sidebar-username">{{ sidebarNickname }}</div>
            <div class="sidebar-level">
              <span class="level-stars">{{ levelStars }}</span>
              {{ sidebarLevelText }}
            </div>
          </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="sidebar-nav">
          <div
              v-for="group in menuGroups"
              :key="group.label"
              class="nav-group"
          >
            <div class="nav-group-label">{{ group.label }}</div>
            <router-link
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="nav-item"
                :class="{ active: isActive(item.path), disabled: item.disabled }"
                @click="item.disabled ? $event.preventDefault() : null"
            >
              <!-- Element Plus 图标 -->
              <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
              <!-- 徽标（待处理数量） -->
              <el-badge
                  v-if="item.badge && item.badge > 0"
                  :value="item.badge"
                  :max="99"
                  class="nav-badge"
              />
              <!-- 即将上线标签 -->
              <span v-if="item.disabled" class="nav-tag-soon">即将上线</span>
            </router-link>
          </div>
        </nav>
      </aside>

      <!-- ── 右侧内容区 ─────────────────────────────────── -->
      <main class="user-main">
        <router-view v-slot="{ Component }">
          <keep-alive :include="['UserOverview']">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  UserFilled,
  List,
  Location,
  Star,
  ChatDotRound,
  Wallet,
  Tools,
  Bell,
  RefreshRight,   // 🆕 2.5.3 二手回收图标
  Setting,
  Search       // ← 新增
} from '@element-plus/icons-vue'
import { getUserOverview } from '@/api/user/overview'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

// ── 路由 ─────────────────────────────────────────────────
const route = useRoute()

// ── Pinia Store（账号设置保存后会更新 store，侧边栏从这里同步） ──
const userStore = useUserStore()
// ⬇ storeToRefs 确保解构后仍保持响应式，fetchUserInfo 后侧边栏自动更新
const { userInfo: storeUserInfo } = storeToRefs(userStore)

// ── 概览接口返回的原始数据（订单数量等） ────────────────
const overviewData = ref(null)

// ── 订单各状态数量（用于侧边栏徽标） ──────────────────
const orderCounts = ref({
  pendingPay: 0,
  pendingShip: 0,
  pendingReceive: 0,
  pendingReview: 0,
  refunding: 0
})

/**
 * 加载概览数据
 * 📌 UserLayout 挂载时调用一次，将订单数量同步到左侧徽标
 */
const loadOverview = async () => {
  try {
    const res = await getUserOverview()
    if (res.data) {
      overviewData.value = res.data
      // 各状态订单数
      orderCounts.value = {
        pendingPay: res.data.pendingPayCount || 0,
        pendingShip: res.data.pendingShipCount || 0,
        pendingReceive: res.data.pendingReceiveCount || 0,
        pendingReview: res.data.pendingReviewCount || 0,
        refunding: res.data.refundingCount || 0
      }
    }
  } catch (e) {
    // 获取失败不影响布局展示
    console.warn('[UserLayout] 加载概览数据失败', e)
  }
}

onMounted(() => {
  loadOverview()
})

// ── 侧边栏显示数据：优先用 userStore（保存后实时同步），其次用概览接口数据 ──
const DEFAULT_AVATAR = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

const sidebarAvatar = computed(() => {
  const storeAvatar = storeUserInfo.value?.avatar
  const overviewAvatar = overviewData.value?.avatar
  const avatar = storeAvatar || overviewAvatar
  return avatar && avatar.trim() ? avatar : DEFAULT_AVATAR
})

const sidebarNickname = computed(() =>
    storeUserInfo.value?.nickname ||
    overviewData.value?.nickname ||
    storeUserInfo.value?.username ||
    '天文爱好者'
)

const sidebarLevelText = computed(() =>
    overviewData.value?.observationLevelText ||
    storeUserInfo.value?.observationLevelText ||
    '观测者'
)

const sidebarLevel = computed(() =>
    overviewData.value?.observationLevel ||
    storeUserInfo.value?.observationLevel ||
    1
)

const levelStars = computed(() => {
  const level = sidebarLevel.value
  return '★'.repeat(level) + '☆'.repeat(5 - level)
})

// ── 菜单分组配置 ────────────────────────────────────
const menuGroups = computed(() => [
  {
    label: '我的账户',
    items: [
      {
        path: '/user/overview',
        label: '个人概览',
        icon: UserFilled,
        badge: 0
      },
      {
        path: '/user/wallet',
        label: '我的钱包',
        icon: Wallet,
        badge: 0
      },
      {
        path: '/user/settings',
        label: '账号设置',
        icon: Setting,
        badge: 0
      }
    ]
  },
  {
    label: '我的订单',
    items: [
      { path: '/user/orders', label: '全部订单', icon: List, badge: 0 }
    ]
  },
  {
    label: '我的服务',
    items: [
      {
        path: '/user/address',
        label: '收货地址',
        icon: Location,
        badge: 0
      },
      {
        path: '/user/reviews',
        label: '我的评价',
        icon: ChatDotRound,
        badge: 0
      },
      // 🆕 移除 disabled: true，收藏功能 2.6 已上线
      {
        path: '/user/favorites',
        label: '我的收藏',
        icon: Star,
        badge: 0
      },
      { path: '/user/installation',    label: '安装预约',     icon: Tools,        badge: 0 },
      { path: '/user/service-reminder',label: '器材保养提醒', icon: Bell,         badge: 0 },
      // ── 2.5.3 新增：二手回收 ─────────────────────────
      { path: '/user/recycling',        label: '二手回收',    icon: RefreshRight, badge: 0 },
// ── 4.5 新增：识别历史 ──────────────────────────
      { path: '/user/recognition', label: '识别历史',  icon: Search,       badge: 0 }
    ]
  }
])

// ── 当前激活菜单标题（面包屑用） ─────────────────────
const currentMenuTitle = computed(() => {
  const allItems = menuGroups.value.flatMap(g => g.items)
  const matched = allItems.find(item => {
    const itemPath = item.path.split('?')[0]
    return route.path === itemPath
  })
  return matched?.label || '概览'
})

// ── 判断是否激活 ──────────────────────────────────
const isActive = (path) => {
  const basePath = path.split('?')[0]
  if (basePath !== path) {
    const queryStr = path.split('?')[1] || ''
    const params = new URLSearchParams(queryStr)
    const statusParam = params.get('status')
    if (route.path === basePath && statusParam !== null) {
      return route.query.status === statusParam
    }
    return false
  }
  return route.path === basePath
}
</script>

<style scoped>
/* ── 整体容器 ──────────────────────────────────────── */
.user-center-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px 40px;
  min-height: calc(100vh - 64px);
}

/* ── 面包屑 ────────────────────────────────────────── */
.user-breadcrumb {
  margin-bottom: 16px;
}

/* ── 内容主体（左侧 + 右侧） ────────────────────────── */
.user-layout-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* ── 左侧导航 ──────────────────────────────────────── */
.user-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 侧边栏用户信息卡 */
.sidebar-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 14px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.sidebar-avatar {
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.sidebar-user-info {
  overflow: hidden;
}

.sidebar-username {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-level {
  color: rgba(255, 215, 0, 0.9);
  font-size: 11px;
  margin-top: 3px;
}

.level-stars {
  font-size: 10px;
  letter-spacing: 1px;
}

/* 导航分组 */
.sidebar-nav {
  padding: 8px 0;
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group-label {
  font-size: 11px;
  color: #aaa;
  padding: 8px 16px 4px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 导航项 */
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  color: #555;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
  border-right: 3px solid #409eff;
}

.nav-item.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: none;
}

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.nav-badge {
  margin-left: auto;
}

.nav-badge :deep(.el-badge__content) {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
}

.nav-tag-soon {
  margin-left: auto;
  font-size: 10px;
  color: #999;
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 10px;
}

/* ── 右侧内容区 ─────────────────────────────────────── */
.user-main {
  flex: 1;
  min-width: 0;
}

/* ── 响应式适配 ──────────────────────────────────────── */
@media (max-width: 768px) {
  .user-layout-body {
    flex-direction: column;
  }

  .user-sidebar {
    width: 100%;
  }

  .sidebar-nav {
    display: flex;
    flex-wrap: wrap;
    padding: 8px;
  }

  .nav-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
  }

  .nav-group-label {
    width: 100%;
    padding: 6px 8px 2px;
  }

  .nav-item {
    padding: 7px 12px;
    border-right: none !important;
  }

  .nav-item.active {
    border-right: none;
    border-bottom: 3px solid #409eff;
  }
}
</style>