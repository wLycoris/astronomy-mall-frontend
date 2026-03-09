<template>
  <!--
    个人中心 - 概览首页（优化版）
    文件路径: src/views/user/UserOverview.vue
  -->
  <div class="overview-page">

    <!-- 骨架屏 -->
    <template v-if="loading">
      <el-skeleton :rows="10" animated style="background:#fff;border-radius:8px;padding:24px;" />
    </template>

    <template v-else-if="overview">

      <!-- ── 第一行：用户信息 + 统计数字 ──────────────────────── -->
      <div class="card user-info-card">
        <div class="user-info-left">
          <!-- 头像优先用 store（账号设置保存后实时同步），其次用概览接口数据 -->
          <el-avatar :src="displayAvatar" :size="68" class="user-avatar" />
          <div class="user-meta">
            <div class="user-name-row">
              <span class="user-name">{{ displayNickname }}</span>
              <el-tag size="small" type="warning" effect="light" class="level-tag">
                {{ levelStars }} {{ overview.observationLevelText }}
              </el-tag>
            </div>
            <div class="user-sub">
              <span v-if="overview.city" class="sub-item">
                <el-icon><Location /></el-icon>{{ overview.city }}
              </span>
              <span class="sub-item">
                <el-icon><Calendar /></el-icon>{{ formatDate(overview.createTime) }} 加入
              </span>
            </div>
            <div class="user-tags">
              <template v-if="overview.interestTags && overview.interestTags.length">
                <el-tag
                    v-for="tag in overview.interestTags.slice(0, 4)"
                    :key="tag"
                    size="small" type="info" effect="plain" class="interest-tag"
                >🔭 {{ tag }}</el-tag>
                <span v-if="overview.interestTags.length > 4" class="tag-more">
                  +{{ overview.interestTags.length - 4 }}
                </span>
              </template>
              <router-link v-else to="/user/settings" class="tag-add-link">
                + 添加兴趣标签
              </router-link>
            </div>
          </div>
        </div>

        <!-- 右侧三个统计格 -->
        <div class="user-stats">
          <div class="stat-item" @click="$router.push('/user/orders')">
            <div class="stat-value">{{ overview.totalOrders || 0 }}</div>
            <div class="stat-label">累计订单</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">¥{{ formatShort(overview.totalSpent) }}</div>
            <div class="stat-label">累计消费</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item" @click="$router.push('/user/reviews')">
            <div class="stat-value">{{ overview.totalReviews || 0 }}</div>
            <div class="stat-label">发布评价</div>
          </div>
        </div>
      </div>

      <!-- ── 第二行：订单格子 + 钱包 ──────────────────────────── -->
      <div class="row-two">

        <!-- 订单 -->
        <div class="card order-card">
          <div class="card-header">
            <span class="card-title">我的订单</span>
            <router-link to="/user/orders" class="card-more">全部订单 →</router-link>
          </div>
          <div class="order-status-grid">
            <div
                v-for="item in orderStatusItems"
                :key="item.label"
                class="status-item"
                @click="goOrders(item)"
            >
              <div class="status-icon-wrap">
                <el-icon class="status-icon"><component :is="item.icon" /></el-icon>
                <el-badge
                    v-if="item.count > 0"
                    :value="item.count"
                    :max="99"
                    class="status-badge"
                />
              </div>
              <span class="status-label">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <!-- 钱包 -->
        <div class="card wallet-card">
          <div class="card-header">
            <span class="card-title">我的钱包</span>
            <router-link to="/user/wallet" class="card-more">流水明细 →</router-link>
          </div>
          <div class="wallet-body">
            <!-- 余额+按钮 -->
            <div class="wallet-balance-block">
              <div class="balance-label">账户余额</div>
              <div class="balance-amount">
                <span class="balance-unit">¥</span>
                <span class="balance-value">{{ formatBalance(overview.balance) }}</span>
              </div>
              <div class="wallet-actions">
                <el-button size="small" type="primary" @click="goWallet('recharge')">充值</el-button>
                <el-button size="small" plain @click="goWallet('withdraw')">提现</el-button>
              </div>
            </div>
            <!-- 最近流水 -->
            <div class="wallet-log-block">
              <template v-if="overview.lastLogAmount !== null && overview.lastLogAmount !== undefined">
                <div class="log-item">
                  <div class="log-icon" :class="overview.lastLogAmount >= 0 ? 'log-in' : 'log-out'">
                    {{ overview.lastLogAmount >= 0 ? '↑' : '↓' }}
                  </div>
                  <div class="log-info">
                    <div class="log-desc">{{ logTypeText(overview.lastLogType) }}</div>
                    <div class="log-time">{{ formatDate(overview.lastLogTime) }}</div>
                  </div>
                  <div class="log-amount" :class="overview.lastLogAmount >= 0 ? 'amount-in' : 'amount-out'">
                    {{ overview.lastLogAmount >= 0 ? '+' : '' }}¥{{ Math.abs(overview.lastLogAmount).toFixed(2) }}
                  </div>
                </div>
              </template>
              <div v-else class="log-empty">暂无流水记录</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 第三行：最近订单预览 ───────────────────────────────── -->
      <div v-if="recentOrders.length" class="card recent-orders-card">
        <div class="card-header">
          <span class="card-title">最近订单</span>
          <router-link to="/user/orders" class="card-more">查看全部 →</router-link>
        </div>
        <div class="recent-order-list">
          <div
              v-for="order in recentOrders"
              :key="order.id"
              class="recent-order-item"
              @click="$router.push(`/order/detail/${order.id}`)"
          >
            <div class="order-thumb">
              <img v-if="order.firstItemImage" :src="order.firstItemImage" />
              <span v-else>🔭</span>
            </div>
            <div class="order-info">
              <div class="order-no">{{ order.orderNo }}</div>
              <div class="order-name">{{ order.firstItemName }}</div>
            </div>
            <div class="order-right">
              <div class="order-amount">¥{{ order.paymentAmount }}</div>
              <el-tag :type="orderStatusType(order.status)" size="small" effect="plain">
                {{ orderStatusText(order.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

    </template>

    <template v-else>
      <el-empty description="数据加载失败，请刷新重试" />
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location, Calendar, CreditCard, Van, Box, ChatDotRound, RefreshLeft } from '@element-plus/icons-vue'
import { getUserOverview } from '@/api/user/overview'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(true)
const overview = ref(null)
const recentOrders = ref([])

// ── Store（账号设置保存后实时同步头像/昵称） ──────────────
const userStore = useUserStore()
const { userInfo: storeUserInfo } = storeToRefs(userStore)

const DEFAULT_AVATAR = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

// 优先用 store（fetchUserInfo 后立即生效），其次用概览接口快照
const displayAvatar = computed(() => {
  const a = storeUserInfo.value?.avatar || overview.value?.avatar
  return a && a.trim() ? a : DEFAULT_AVATAR
})

const displayNickname = computed(() =>
    storeUserInfo.value?.nickname || overview.value?.nickname || '天文爱好者'
)

const loadOverview = async () => {
  loading.value = true
  try {
    const res = await getUserOverview()
    overview.value = res.data
  } catch (e) {
    ElMessage.error('加载个人信息失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

const loadRecentOrders = async () => {
  try {
    const res = await request({ url: '/order/list', method: 'get', params: { pageNum: 1, pageSize: 2 } })
    const records = res.data?.records || []
    recentOrders.value = records.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      status: o.status,
      paymentAmount: o.paymentAmount,
      firstItemName: o.items?.[0]?.productName || o.orderItems?.[0]?.productName || '商品',
      firstItemImage: o.items?.[0]?.productImage || o.orderItems?.[0]?.productImage || null
    }))
  } catch (e) { /* 不影响主体 */ }
}

onMounted(async () => {
  await loadOverview()
  loadRecentOrders()
})

const levelStars = computed(() => {
  const l = overview.value?.observationLevel || 1
  return '★'.repeat(l) + '☆'.repeat(5 - l)
})

const orderStatusItems = computed(() => [
  { label: '待付款',   icon: CreditCard,   count: overview.value?.pendingPayCount || 0,     path: '/user/orders', query: { status: 0 } },
  { label: '待发货',   icon: Box,          count: overview.value?.pendingShipCount || 0,    path: '/user/orders', query: { status: 1 } },
  { label: '待收货',   icon: Van,          count: overview.value?.pendingReceiveCount || 0, path: '/user/orders', query: { status: 2 } },
  { label: '待评价',   icon: ChatDotRound, count: overview.value?.pendingReviewCount || 0,  path: '/user/orders', query: { status: 3 } },
  { label: '退款/售后', icon: RefreshLeft,  count: overview.value?.refundingCount || 0,     path: '/order/list',  query: {} }
])

const goOrders = (item) => router.push({ path: item.path, query: item.query })
const goWallet = (tab) => router.push({ path: '/user/wallet', query: { tab } })

const orderStatusText = (s) => (['待付款','待发货','待收货','已完成','已取消'])[s] || '未知'
const orderStatusType = (s) => (['warning','','primary','success','info'])[s] || ''

const formatDate = (dt) => {
  if (!dt) return ''
  try {
    const d = new Date(dt)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  } catch { return String(dt).slice(0,10) }
}

const formatBalance = (val) => {
  if (val === null || val === undefined) return '0.00'
  return Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatShort = (val) => {
  if (!val) return '0'
  const n = Number(val)
  if (n >= 10000) return (n/10000).toFixed(1) + 'w'
  if (n >= 1000)  return (n/1000).toFixed(1) + 'k'
  return n.toFixed(0)
}

const logTypeText = (t) => ({ 1:'充值', 2:'提现', 3:'回收入账', 4:'购物扣款' })[t] || '余额变动'
</script>

<style scoped>
/* ── 整体 ──────────────────────────────────────────────── */
.overview-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── 通用卡片 ────────────────────────────────────────────── */
.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-more {
  font-size: 13px;
  color: #409eff;
  text-decoration: none;
}

.card-more:hover {
  text-decoration: underline;
}

/* ── 用户信息卡 ──────────────────────────────────────────── */
.user-info-card {
  display: flex;
  align-items: center;
}

.user-info-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  flex-shrink: 0;
  border: 3px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.user-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.level-tag {
  font-size: 12px;
}

.user-sub {
  display: flex;
  gap: 14px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.sub-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #909399;
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.interest-tag {
  border-radius: 10px;
  font-size: 11px;
}

.tag-more {
  font-size: 12px;
  color: #999;
}

.tag-add-link {
  font-size: 12px;
  color: #409eff;
  text-decoration: none;
}

/* ── 统计数字区 ──────────────────────────────────────────── */
.user-stats {
  display: flex;
  align-items: center;
  padding-left: 24px;
  border-left: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.stat-item {
  text-align: center;
  padding: 0 22px;
  cursor: pointer;
}

.stat-item:hover .stat-value {
  color: #409eff;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #f0f0f0;
}

/* ── 第二行：订单 + 钱包 ─────────────────────────────────── */
.row-two {
  display: grid;
  grid-template-columns: 1fr 310px;
  gap: 14px;
}

/* ── 订单格子 ────────────────────────────────────────────── */
.order-status-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.status-item:hover {
  background: #f5f7fa;
}

.status-icon-wrap {
  position: relative;
  display: inline-flex;
}

.status-icon {
  font-size: 26px;
  color: #606266;
}

.status-badge {
  position: absolute;
  top: -6px;
  right: -10px;
}

.status-badge :deep(.el-badge__content) {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
  min-width: 16px;
}

.status-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

/* ── 钱包卡 ──────────────────────────────────────────────── */
.wallet-body {
  display: flex;
  gap: 16px;
  align-items: center;
}

.wallet-balance-block {
  flex: 1;
  padding-right: 16px;
  border-right: 1px solid #f0f0f0;
}

.balance-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 12px;
}

.balance-unit {
  font-size: 16px;
  color: #ff6b35;
  font-weight: 600;
}

.balance-value {
  font-size: 26px;
  font-weight: 700;
  color: #ff6b35;
}

.wallet-actions {
  display: flex;
  gap: 8px;
}

.wallet-log-block {
  flex: 1;
  display: flex;
  align-items: center;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.log-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  flex-shrink: 0;
}

.log-in  { background: #f0f9eb; color: #67c23a; }
.log-out { background: #fef0f0; color: #f56c6c; }

.log-info {
  flex: 1;
  min-width: 0;
}

.log-desc {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.log-amount {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.amount-in  { color: #67c23a; }
.amount-out { color: #f56c6c; }

.log-empty {
  font-size: 13px;
  color: #ccc;
}

/* ── 最近订单 ────────────────────────────────────────────── */
.recent-order-list {
  display: flex;
  flex-direction: column;
}

.recent-order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.recent-order-item:last-child { border-bottom: none; }

.recent-order-item:hover {
  background: #fafafa;
  padding-left: 4px;
}

.order-thumb {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  font-size: 20px;
}

.order-thumb img { width: 100%; height: 100%; object-fit: cover; }

.order-info { flex: 1; min-width: 0; }

.order-no {
  font-size: 11px;
  color: #999;
  margin-bottom: 3px;
}

.order-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.order-amount {
  font-size: 14px;
  font-weight: 600;
  color: #f56c6c;
}

/* ── 响应式 ─────────────────────────────────────────────── */
@media (max-width: 900px) {
  .user-info-card { flex-direction: column; align-items: flex-start; }

  .user-stats {
    border-left: none;
    border-top: 1px solid #f0f0f0;
    padding: 14px 0 0;
    width: 100%;
    justify-content: space-around;
  }

  .row-two { grid-template-columns: 1fr; }

  .wallet-body { flex-direction: column; align-items: flex-start; }

  .wallet-balance-block {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-right: 0;
    padding-bottom: 12px;
    width: 100%;
  }

  .wallet-log-block { width: 100%; padding-top: 8px; }
}
</style>