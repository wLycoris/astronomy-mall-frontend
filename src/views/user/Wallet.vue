<template>
  <!--
    钱包页面 Wallet.vue
    路由: /user/wallet
    功能: 余额卡片 + 充值/提现弹窗 + 近20条流水（可展开全部分页列表）

    文件路径: src/views/user/Wallet.vue
    (替换原占位 UserWallet.vue，路由配置已是 AccountSettings 之前的 wallet)
  -->
  <div class="wallet-page">

    <!-- ─────────────────────────────────────────────
         余额卡片
    ───────────────────────────────────────────── -->
    <div class="balance-card" v-loading="loading">
      <div class="balance-label">账户余额</div>
      <div class="balance-amount">
        <span class="symbol">¥</span>
        <span class="number">{{ balance.toFixed(2) }}</span>
      </div>
      <div class="card-actions">
        <el-button type="primary" round @click="openRecharge">充值</el-button>
        <el-button round @click="openWithdraw">提现</el-button>
      </div>
    </div>

    <!-- ─────────────────────────────────────────────
         流水列表（近20条）
    ───────────────────────────────────────────── -->
    <div class="log-section">
      <div class="section-header">
        <span class="section-title">收支记录</span>
        <el-button v-if="!showAll" link type="primary" @click="openAllLogs">查看全部</el-button>
      </div>

      <!-- 近20条流水 -->
      <template v-if="!showAll">
        <div v-if="recentLogs.length === 0" class="empty-tip">暂无流水记录</div>
        <div
            v-for="item in recentLogs"
            :key="item.id"
            class="log-item"
        >
          <div class="log-left">
            <!-- 类型图标 -->
            <span class="log-icon" :class="typeClass(item.type)">
              {{ typeIcon(item.type) }}
            </span>
            <div class="log-info">
              <div class="log-remark">{{ item.remark || typeLabel(item.type) }}</div>
              <div class="log-time">{{ formatTime(item.createTime) }}</div>
            </div>
          </div>
          <div class="log-amount" :class="item.amount > 0 ? 'income' : 'expense'">
            {{ item.amount > 0 ? '+' : '' }}{{ Number(item.amount).toFixed(2) }}
          </div>
        </div>
      </template>

      <!-- 全部流水（分页） -->
      <template v-else>
        <div v-if="allLogs.length === 0 && !allLoading" class="empty-tip">暂无流水记录</div>
        <div
            v-for="item in allLogs"
            :key="item.id"
            class="log-item"
            v-loading="allLoading"
        >
          <div class="log-left">
            <span class="log-icon" :class="typeClass(item.type)">
              {{ typeIcon(item.type) }}
            </span>
            <div class="log-info">
              <div class="log-remark">{{ item.remark || typeLabel(item.type) }}</div>
              <div class="log-time">{{ formatTime(item.createTime) }}</div>
            </div>
          </div>
          <div class="log-amount" :class="item.amount > 0 ? 'income' : 'expense'">
            {{ item.amount > 0 ? '+' : '' }}{{ Number(item.amount).toFixed(2) }}
          </div>
        </div>

        <!-- 分页器 -->
        <div class="pagination-wrap">
          <el-pagination
              v-model:current-page="allPage.pageNum"
              :page-size="allPage.pageSize"
              :total="allPage.total"
              layout="prev, pager, next"
              @current-change="loadAllLogs"
          />
        </div>

        <el-button link @click="showAll = false" style="margin-top:8px">收起</el-button>
      </template>
    </div>

    <!-- ─────────────────────────────────────────────
         充值弹窗
    ───────────────────────────────────────────── -->
    <el-dialog v-model="rechargeVisible" title="模拟充值" width="360px" align-center>
      <div class="dialog-body">
        <div class="dialog-tip">充值金额将立即到账</div>
        <el-input-number
            v-model="rechargeAmount"
            :min="0.01"
            :max="99999.99"
            :precision="2"
            :step="100"
            controls-position="right"
            style="width:100%"
            placeholder="请输入充值金额"
        />
        <!-- 快捷金额 -->
        <div class="quick-amounts">
          <el-tag
              v-for="q in [50, 100, 200, 500, 1000]"
              :key="q"
              :type="rechargeAmount === q ? 'primary' : 'info'"
              effect="plain"
              style="cursor:pointer;margin:4px"
              @click="rechargeAmount = q"
          >¥{{ q }}</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <!-- ─────────────────────────────────────────────
         提现弹窗
    ───────────────────────────────────────────── -->
    <el-dialog v-model="withdrawVisible" title="模拟提现" width="360px" align-center>
      <div class="dialog-body">
        <div class="dialog-tip">
          当前可提现余额：<strong>¥{{ balance.toFixed(2) }}</strong>
        </div>
        <el-input-number
            v-model="withdrawAmount"
            :min="0.01"
            :max="balance"
            :precision="2"
            :step="50"
            controls-position="right"
            style="width:100%"
            placeholder="请输入提现金额"
        />
        <!-- 全部提现快捷按钮 -->
        <div class="quick-amounts">
          <el-tag
              type="info"
              effect="plain"
              style="cursor:pointer;margin:4px"
              @click="withdrawAmount = balance"
          >全部提现</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="withdrawVisible = false">取消</el-button>
        <el-button type="warning" :loading="submitting" @click="submitWithdraw">确认提现</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
/**
 * 钱包页面逻辑
 * 文件路径: src/views/user/Wallet.vue
 */
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getWallet, getBalanceLogList, recharge, withdraw } from '@/api/wallet'
import dayjs from 'dayjs'

// ── 状态 ─────────────────────────────────────────
const loading    = ref(false)
const submitting = ref(false)
const balance    = ref(0)
const recentLogs = ref([])

// 弹窗
const rechargeVisible = ref(false)
const withdrawVisible = ref(false)
const rechargeAmount  = ref(100)
const withdrawAmount  = ref(0)

// 全部流水（分页）
const showAll   = ref(false)
const allLoading = ref(false)
const allLogs   = ref([])
const allPage   = ref({ pageNum: 1, pageSize: 10, total: 0 })

// ── 初始化 ──────────────────────────────────────
onMounted(() => {
  loadWallet()
})

/** 加载余额 + 近20条流水 */
async function loadWallet() {
  loading.value = true
  try {
    const res = await getWallet()
    if (res.code === 200) {
      balance.value    = res.data.balance ?? 0
      recentLogs.value = res.data.logs    ?? []
    }
  } finally {
    loading.value = false
  }
}

// ── 流水操作 ────────────────────────────────────

/** 展开全部流水列表 */
function openAllLogs() {
  showAll.value = true
  allPage.value.pageNum = 1
  loadAllLogs()
}

async function loadAllLogs() {
  allLoading.value = true
  try {
    const res = await getBalanceLogList(allPage.value.pageNum, allPage.value.pageSize)
    if (res.code === 200) {
      allLogs.value         = res.data.records ?? []
      allPage.value.total   = res.data.total   ?? 0
    }
  } finally {
    allLoading.value = false
  }
}

// ── 充值 ─────────────────────────────────────────

function openRecharge() {
  rechargeAmount.value = 100
  rechargeVisible.value = true
}

async function submitRecharge() {
  if (!rechargeAmount.value || rechargeAmount.value <= 0) {
    ElMessage.warning('请输入充值金额')
    return
  }
  submitting.value = true
  try {
    const res = await recharge(rechargeAmount.value)
    if (res.code === 200) {
      ElMessage.success('充值成功！')
      rechargeVisible.value = false
      await loadWallet()                     // 刷新余额和流水
      if (showAll.value) loadAllLogs()       // 同步刷新全量列表
    } else {
      ElMessage.error(res.message || '充值失败')
    }
  } finally {
    submitting.value = false
  }
}

// ── 提现 ─────────────────────────────────────────

function openWithdraw() {
  withdrawAmount.value = 0
  withdrawVisible.value = true
}

async function submitWithdraw() {
  if (!withdrawAmount.value || withdrawAmount.value <= 0) {
    ElMessage.warning('请输入提现金额')
    return
  }
  if (withdrawAmount.value > balance.value) {
    ElMessage.warning('提现金额不能超过可用余额')
    return
  }
  submitting.value = true
  try {
    const res = await withdraw(withdrawAmount.value)
    if (res.code === 200) {
      ElMessage.success('提现成功！')
      withdrawVisible.value = false
      await loadWallet()
      if (showAll.value) loadAllLogs()
    } else {
      ElMessage.error(res.message || '提现失败')
    }
  } finally {
    submitting.value = false
  }
}

// ── 工具函数 ─────────────────────────────────────

/** 流水类型文字 */
const typeLabel = (type) => {
  const map = { 1: '充值', 2: '提现', 3: '回收入账', 4: '购物扣款' }
  return map[type] ?? '其他'
}

/** 流水类型图标（用 emoji 简洁表示） */
const typeIcon = (type) => {
  const map = { 1: '🟢', 2: '🔴', 3: '🟢', 4: '🔴' }
  return map[type] ?? '⚪'
}

/** 图标颜色辅助 class */
const typeClass = (type) => {
  return [1, 3].includes(type) ? 'income-icon' : 'expense-icon'
}

/** 格式化时间 */
const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('MM-DD HH:mm')
}
</script>

<style scoped>
/* ── 余额卡片 ─────────────────────────────────── */
.balance-card {
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  border-radius: 16px;
  padding: 32px 28px;
  color: #fff;
  margin-bottom: 24px;
  text-align: center;
}

.balance-label {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 24px;
}

.balance-amount .symbol {
  font-size: 22px;
  font-weight: 400;
}

.balance-amount .number {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -1px;
}

.card-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.card-actions .el-button {
  min-width: 100px;
  height: 38px;
}

/* ── 流水区域 ─────────────────────────────────── */
.log-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.empty-tip {
  text-align: center;
  color: #aaa;
  padding: 32px 0;
  font-size: 14px;
}

/* ── 单条流水 ─────────────────────────────────── */
.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: #f5f7fa;
}

.log-info .log-remark {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-info .log-time {
  font-size: 12px;
  color: #aaa;
  margin-top: 2px;
}

/* ── 金额颜色 ─────────────────────────────────── */
.log-amount {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.log-amount.income  { color: #67c23a; }
.log-amount.expense { color: #f56c6c; }

/* ── 分页 ─────────────────────────────────────── */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* ── 弹窗内容 ─────────────────────────────────── */
.dialog-body {
  padding: 8px 0;
}

.dialog-tip {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.quick-amounts {
  margin-top: 12px;
}
</style>