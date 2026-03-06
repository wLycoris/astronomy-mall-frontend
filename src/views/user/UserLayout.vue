<template>
  <!--
    个人中心布局容器
    文件路径: src/views/user/UserLayout.vue

    📌 布局结构: 左侧导航 + 右侧 router-view（参考淘宝/京东风格）
    📌 路由挂载: /user（嵌套路由父容器）

    左侧导航菜单项:
      /user/overview    - 个人概览
      /user/orders      - 我的订单
      /user/address     - 收货地址
      /user/favorites   - 我的收藏（第8周预留入口）
      /user/reviews     - 我的评价
      /user/wallet      - 我的钱包
      /user/after-sale  - 我的售后（2.5节接入）
      /user/settings    - 账号设置
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
          <el-avatar :src="userInfo?.avatar" :size="56" class="sidebar-avatar" />
          <div class="sidebar-user-info">
            <div class="sidebar-username">{{ userInfo?.nickname || userInfo?.username || '天文爱好者' }}</div>
            <div class="sidebar-level">
              <span class="level-stars">{{ levelStars }}</span>
              {{ userInfo?.observationLevelText || '观测者' }}
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
  Setting
} from '@element-plus/icons-vue'
import { getUserOverview } from '@/api/user/overview'

// ── 路由 ─────────────────────────────────────────────────
const route = useRoute()

// ── 用户信息（轻量版，从概览接口获取） ──────────────────
const userInfo = ref(null)

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
      // 用户基本信息（供侧边栏显示）
      userInfo.value = {
        nickname: res.data.nickname,
        avatar: res.data.avatar,
        observationLevel: res.data.observationLevel,
        observationLevelText: res.data.observationLevelText
      }
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

// ── 等级星星展示 ─────────────────────────────────────
const levelStars = computed(() => {
  const level = userInfo.value?.observationLevel || 1
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
      {
        path: '/user/orders',
        label: '全部订单',
        icon: List,
        badge: 0
      }
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
      {
        path: '/user/favorites',
        label: '我的收藏',
        icon: Star,
        badge: 0,
        disabled: true  // 第8周开发，暂时禁用
      },
      {
        path: '/user/after-sale',
        label: '我的售后',
        icon: Tools,
        badge: orderCounts.value.refunding,
        disabled: true  // 2.5节开发，暂时禁用
      }
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

// ── 判断是否激活（处理带 query 的路径） ────────────
const isActive = (path) => {
  const basePath = path.split('?')[0]
  if (basePath !== path) {
    // 带 query 的菜单项：路径+query 都匹配才算激活
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

/* 激活状态 */
.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
  border-right: 3px solid #409eff;
}

/* 禁用状态 */
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
  min-width: 0; /* 防止内容溢出 */
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