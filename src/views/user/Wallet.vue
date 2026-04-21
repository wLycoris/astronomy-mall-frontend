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

/** 流水类型标记 */
const typeIcon = (type) => {
  return [1, 3].includes(type) ? '+' : '-'
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

/* Final direction: restrained premium wallet */
.wallet-page {
  min-height: 100%;
  padding: 26px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(246, 244, 239, 0.94)),
    #f6f4ef;
}

.balance-card {
  position: relative;
  overflow: hidden;
  max-width: none;
  margin-bottom: 18px;
  padding: 34px 34px 30px;
  border: 1px solid rgba(234, 220, 190, 0.2);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(184, 141, 62, 0.18), rgba(184, 141, 62, 0) 42%),
    #172033;
  color: #ffffff;
  text-align: left;
  box-shadow: 0 22px 46px rgba(23, 32, 51, 0.18);
}

.balance-card::after {
  content: "";
  position: absolute;
  right: 32px;
  bottom: 30px;
  width: 180px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(234, 220, 190, 0.72));
}

.balance-label {
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 13px;
  font-weight: 650;
}

.balance-amount {
  justify-content: flex-start;
  margin-bottom: 26px;
}

.balance-amount .symbol {
  color: #e8c273;
  font-size: 24px;
  font-weight: 700;
}

.balance-amount .number {
  color: #ffffff;
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 0;
}

.card-actions {
  justify-content: flex-start;
}

.card-actions :deep(.el-button) {
  min-width: 112px;
  height: 40px;
  border-radius: 6px;
  font-weight: 700;
}

.card-actions :deep(.el-button--primary) {
  border-color: #e8c273;
  background: #e8c273;
  color: #172033;
}

.card-actions :deep(.el-button--primary:hover),
.card-actions :deep(.el-button--primary:focus) {
  border-color: #f0cf8a;
  background: #f0cf8a;
  color: #172033;
}

.card-actions :deep(.el-button:not(.el-button--primary)) {
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.card-actions :deep(.el-button:not(.el-button--primary):hover),
.card-actions :deep(.el-button:not(.el-button--primary):focus) {
  border-color: rgba(232, 194, 115, 0.74);
  color: #f0cf8a;
}

.log-section {
  padding: 22px 24px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14px 34px rgba(23, 32, 51, 0.06);
}

.section-header {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
}

.section-title {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #172033;
  font-size: 17px;
  font-weight: 760;
}

.section-title::before {
  content: "";
  width: 4px;
  height: 18px;
  border-radius: 999px;
  background: #b88d3e;
}

.section-header :deep(.el-button.is-link) {
  color: #7a5e3d;
  font-weight: 700;
}

.empty-tip {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fbfcfd;
  color: #8b94a3;
}

.log-item {
  min-height: 70px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(23, 32, 51, 0.07);
}

.log-left {
  min-width: 0;
}

.log-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  background: #f6f7f9;
  color: #172033;
}

.log-icon.income-icon {
  border-color: rgba(60, 126, 88, 0.18);
  background: #edf8f1;
  color: #2f7a4f;
}

.log-icon.expense-icon {
  border-color: rgba(179, 93, 37, 0.18);
  background: #fff4ec;
  color: #b35d25;
}

.log-info .log-remark {
  max-width: min(520px, 48vw);
  color: #172033;
  font-weight: 700;
}

.log-info .log-time {
  color: #8b94a3;
}

.log-amount {
  color: #172033;
  font-size: 17px;
  font-weight: 800;
}

.log-amount.income {
  color: #2f7a4f;
}

.log-amount.expense {
  color: #b35d25;
}

.pagination-wrap {
  margin-top: 20px;
}

.wallet-page :deep(.el-pagination.is-background .el-pager li.is-active),
.wallet-page :deep(.el-pagination .el-pager li.is-active) {
  background: #172033;
  color: #ffffff;
}

.wallet-page :deep(.el-dialog) {
  overflow: hidden;
  border-radius: 8px;
}

.wallet-page :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: #fbfcfd;
}

.wallet-page :deep(.el-dialog__title) {
  color: #172033;
  font-weight: 760;
}

.wallet-page :deep(.el-dialog__body) {
  padding: 24px;
}

.wallet-page :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

.dialog-tip {
  color: #697386;
}

.dialog-tip strong {
  color: #b35d25;
}

.wallet-page :deep(.el-input-number),
.wallet-page :deep(.el-input-number .el-input__wrapper) {
  width: 100%;
}

.wallet-page :deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.12) inset;
}

.wallet-page :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #172033 inset;
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.quick-amounts :deep(.el-tag) {
  height: 30px;
  margin: 0 !important;
  border-color: rgba(23, 32, 51, 0.1);
  border-radius: 999px;
  background: #fbfcfd;
  color: #4e5969;
}

.quick-amounts :deep(.el-tag.el-tag--primary) {
  border-color: #172033;
  background: #172033;
  color: #ffffff;
}

.wallet-page :deep(.el-dialog .el-button--primary) {
  border-color: #172033;
  background: #172033;
}

.wallet-page :deep(.el-dialog .el-button--primary:hover),
.wallet-page :deep(.el-dialog .el-button--primary:focus) {
  border-color: #24314c;
  background: #24314c;
}

@media (max-width: 760px) {
  .wallet-page {
    padding: 16px;
  }

  .balance-card,
  .log-section {
    padding: 22px 18px;
  }

  .balance-amount .number {
    font-size: 38px;
  }

  .card-actions {
    flex-wrap: wrap;
  }

  .log-item {
    align-items: flex-start;
    gap: 12px;
  }

  .log-info .log-remark {
    max-width: 46vw;
  }
}

/* Wallet final pass: page-local account ledger. */
:global(body .wallet-page.wallet-page.wallet-page) {
  width: min(1160px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
  padding: 28px 0 72px !important;
  color: #1f2933 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card) {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  gap: 18px 24px !important;
  align-items: end !important;
  min-height: 180px !important;
  margin-bottom: 18px !important;
  padding: 28px !important;
  border: 1px solid #111827 !important;
  border-radius: 7px !important;
  background: #111827 !important;
  box-shadow: none !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card::after) {
  display: none !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-label),
:global(body .wallet-page.wallet-page.wallet-page .balance-amount .symbol) {
  color: rgba(255, 253, 250, 0.74) !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-amount),
:global(body .wallet-page.wallet-page.wallet-page .balance-amount .number) {
  color: #f0c878 !important;
  font-size: 42px !important;
  line-height: 1.05 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .card-actions) {
  display: flex !important;
  gap: 10px !important;
  grid-column: 2 !important;
  grid-row: 1 / span 2 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card .el-button--primary) {
  border-color: #f0c878 !important;
  background: #f0c878 !important;
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card .el-button--primary span) {
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card .el-button:not(.el-button--primary)) {
  border-color: rgba(255, 253, 250, 0.3) !important;
  background: transparent !important;
  color: #fffdfa !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-section) {
  padding: 22px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .wallet-page.wallet-page.wallet-page .section-header) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  margin-bottom: 14px !important;
  padding-bottom: 14px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
}

:global(body .wallet-page.wallet-page.wallet-page .section-title) {
  color: #111827 !important;
  font-size: 18px !important;
  font-weight: 800 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-item) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  min-height: 68px !important;
  padding: 12px 0 !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-item:last-child) {
  border-bottom: 0 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-left) {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  min-width: 0 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-icon) {
  display: inline-grid !important;
  width: 40px !important;
  height: 40px !important;
  place-items: center !important;
  border-radius: 50% !important;
  background: #f8f5ef !important;
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-remark) {
  color: #111827 !important;
  font-weight: 720 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-time) {
  color: #667085 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-amount) {
  font-size: 17px !important;
  font-weight: 850 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-amount.income) {
  color: #2f7a4f !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-amount.expense) {
  color: #a6531f !important;
}

:global(body .wallet-page.wallet-page.wallet-page .el-dialog) {
  overflow: hidden !important;
  border-radius: 7px !important;
}

:global(body .wallet-page.wallet-page.wallet-page .el-dialog__header) {
  padding: 20px 24px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .wallet-page.wallet-page.wallet-page .el-input__wrapper) {
  border-radius: 5px !important;
  box-shadow: 0 0 0 1px rgba(21, 26, 34, 0.14) inset !important;
}

@media (max-width: 760px) {
  :global(body .wallet-page.wallet-page.wallet-page) {
    width: calc(100vw - 28px) !important;
    padding: 18px 0 44px !important;
  }

  :global(body .wallet-page.wallet-page.wallet-page .balance-card) {
    grid-template-columns: 1fr !important;
  }

  :global(body .wallet-page.wallet-page.wallet-page .card-actions) {
    grid-column: 1 !important;
    grid-row: auto !important;
    flex-wrap: wrap !important;
  }

  :global(body .wallet-page.wallet-page.wallet-page .log-item) {
    align-items: flex-start !important;
    flex-direction: column !important;
  }
}

/* Wallet polish pass: lighter money desk, cleaner ledger rhythm. */
:global(body .wallet-page.wallet-page.wallet-page .balance-card) {
  grid-template-columns: minmax(0, 1fr) auto !important;
  align-items: center !important;
  min-height: 146px !important;
  padding: 26px 30px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  background: #fffdfa !important;
  color: #111827 !important;
  box-shadow: 0 12px 28px rgba(21, 26, 34, 0.06) !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card::before) {
  content: "" !important;
  position: absolute !important;
  inset: 0 auto 0 0 !important;
  width: 4px !important;
  border-radius: 7px 0 0 7px !important;
  background: #9c6b35 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-label) {
  color: #4b5563 !important;
  font-size: 14px !important;
  font-weight: 700 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-amount) {
  justify-content: flex-start !important;
  margin: 16px 0 0 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-amount .symbol) {
  color: #9c6b35 !important;
  font-size: 22px !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-amount .number) {
  color: #111827 !important;
  font-size: 40px !important;
  font-weight: 850 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .card-actions) {
  grid-row: 1 / span 2 !important;
  align-self: center !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card .el-button) {
  min-width: 92px !important;
  height: 34px !important;
  border-radius: 4px !important;
  font-weight: 750 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card .el-button:not(.el-button--primary)) {
  border-color: rgba(21, 26, 34, 0.22) !important;
  background: #fffdfa !important;
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-section) {
  padding: 18px 22px 12px !important;
  background: #fffdfa !important;
}

:global(body .wallet-page.wallet-page.wallet-page .section-header .el-button.is-link) {
  height: 28px !important;
  padding: 0 10px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 4px !important;
  background: #ffffff !important;
  color: #111827 !important;
  font-weight: 700 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-item) {
  min-height: 56px !important;
  padding: 10px 0 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-icon) {
  width: 26px !important;
  height: 26px !important;
  border: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #fbf8f1 !important;
  font-size: 0 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-icon::before) {
  content: "" !important;
  display: block !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: currentColor !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-icon.income-icon) {
  color: #2f7a4f !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-icon.expense-icon) {
  color: #a6531f !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-remark) {
  font-size: 14px !important;
  font-weight: 750 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-time) {
  margin-top: 2px !important;
  font-size: 12px !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-amount) {
  min-width: 128px !important;
  text-align: right !important;
  font-size: 15px !important;
}

@media (max-width: 760px) {
  :global(body .wallet-page.wallet-page.wallet-page .balance-card) {
    grid-template-columns: 1fr !important;
    padding: 24px 22px !important;
  }

  :global(body .wallet-page.wallet-page.wallet-page .card-actions) {
    grid-column: 1 !important;
    grid-row: auto !important;
    justify-content: flex-start !important;
  }

  :global(body .wallet-page.wallet-page.wallet-page .log-amount) {
    min-width: 0 !important;
    text-align: left !important;
  }
}

/* Wallet readability pass: keep every label readable before styling wins. */
:global(body .wallet-page.wallet-page.wallet-page),
:global(body .wallet-page.wallet-page.wallet-page .log-section),
:global(body .wallet-page.wallet-page.wallet-page .balance-card) {
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-label),
:global(body .wallet-page.wallet-page.wallet-page .section-title),
:global(body .wallet-page.wallet-page.wallet-page .log-remark),
:global(body .wallet-page.wallet-page.wallet-page .dialog-tip) {
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-amount .number) {
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-amount .symbol) {
  color: #8a5a22 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .log-time) {
  color: #4b5563 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .balance-card .el-button span),
:global(body .wallet-page.wallet-page.wallet-page .section-header .el-button.is-link span),
:global(body .wallet-page.wallet-page.wallet-page .pagination-wrap .el-button span) {
  color: #111827 !important;
}

:global(body .wallet-page.wallet-page.wallet-page .el-dialog .el-button--primary),
:global(body .wallet-page.wallet-page.wallet-page .el-dialog .el-button--primary span) {
  color: #fffdfa !important;
}

:global(body .wallet-page.wallet-page.wallet-page .el-dialog .el-button:not(.el-button--primary) span),
:global(body .wallet-page.wallet-page.wallet-page .el-form-item__label),
:global(body .wallet-page.wallet-page.wallet-page .el-input__inner) {
  color: #111827 !important;
}
</style>
