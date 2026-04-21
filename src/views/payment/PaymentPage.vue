<template>
  <div class="payment-page">
    <div class="countdown-notice">
      <el-icon><Clock /></el-icon>
      <span>订单将在 <strong>{{ formatTime(countdown) }}</strong> 后关闭，请尽快完成支付</span>
    </div>

    <div class="payment-container">
      <div class="payment-methods">
        <h2>选择支付方式</h2>
        <div class="method-list">
          <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="method-item"
              :class="{ active: selectedPaymentType === method.id }"
              @click="selectedPaymentType = method.id"
          >
            <div class="method-icon">
              <el-icon :size="24"><component :is="method.icon" /></el-icon>
            </div>
            <div class="method-info">
              <h3>{{ method.name }}</h3>
              <template v-if="method.id === 3">
                <p>
                  可用余额：
                  <span :class="balanceEnough ? 'balance-ok' : 'balance-low'">
                    ¥{{ walletBalance.toFixed(2) }}
                  </span>
                  <template v-if="!balanceEnough">
                    &nbsp;—&nbsp;余额不足，
                    <el-button link type="primary" size="small" @click.stop="goRecharge">去充值</el-button>
                  </template>
                </p>
              </template>
              <template v-else>
                <p>{{ method.desc }}</p>
              </template>
            </div>
            <div class="method-radio">
              <div class="radio-dot" v-if="selectedPaymentType === method.id"></div>
            </div>
          </div>
        </div>

        <div v-if="selectedPaymentType === 3 && !balanceEnough" class="balance-warn">
          <el-icon><WarningFilled /></el-icon>
          当前余额 ¥{{ walletBalance.toFixed(2) }}，需支付 ¥{{ orderAmount.toFixed(2) }}，
          还差 ¥{{ shortfallAmount }}，请先充值后再使用余额支付。
          <el-button size="small" type="warning" plain style="margin-left:8px" @click="goRecharge">立即充值</el-button>
        </div>

        <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="selectedPaymentType === 3 && !balanceEnough"
            @click="handlePay"
            class="pay-button"
        >
          {{ loading ? '支付处理中...' : `确认支付 ¥${orderAmount.toFixed(2)}` }}
        </el-button>
      </div>

      <div class="order-info">
        <h3>订单信息</h3>
        <div class="info-list">
          <div class="info-item"><span>商品金额:</span><span>¥{{ orderAmount.toFixed(2) }}</span></div>
          <div class="info-item"><span>运费:</span><span>¥0.00</span></div>
          <div class="info-item"><span>优惠:</span><span class="discount">-¥0.00</span></div>
          <div class="info-divider"></div>
          <div class="info-item total">
            <span>实付款:</span>
            <span class="amount">¥{{ orderAmount.toFixed(2) }}</span>
          </div>
        </div>
        <div class="security-tips">
          <el-icon><InfoFilled /></el-icon>
          <div>
            <p class="tips-title">支付安全提示:</p>
            <ul>
              <li>请在新页面完成支付</li>
              <li>付款完成前请勿关闭窗口</li>
              <li>支持7天无理由退换货</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showSuccessDialog" title="支付成功" width="500px"
               :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" center>
      <div class="success-content">
        <el-icon class="success-icon" :size="80" color="#67C23A"><CircleCheck /></el-icon>
        <h2>支付成功!</h2>
        <p>您的订单已支付完成</p>
        <div class="success-info">
          <div class="success-item"><span>订单编号:</span><span>{{ orderNo }}</span></div>
          <div class="success-item"><span>支付金额:</span><span class="amount">¥{{ orderAmount.toFixed(2) }}</span></div>
          <div class="success-item"><span>支付方式:</span><span>{{ paymentTypeName }}</span></div>
          <div class="success-item"><span>支付时间:</span><span>{{ paymentTime }}</span></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="goToOrderList">查看订单</el-button>
        <el-button type="primary" @click="goToHome">返回首页</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, CreditCard, Iphone, Wallet, InfoFilled, CircleCheck, WarningFilled } from '@element-plus/icons-vue'
import { createPayment, simulatePayment, getPaymentByOrderId } from '@/api/payment'
import { getPaymentSetting } from '@/api/admin/setting'
import { getWallet } from '@/api/wallet'
import { getOrderDetail } from '@/api/order'

const route  = useRoute()
const router = useRouter()

const orderId     = ref(null)
const orderNo     = ref('')
const orderAmount = ref(0)
const orderCreateTime = ref(null)  // 🆕 订单创建时间，用于计算剩余超时时间

const selectedPaymentType = ref(1)
const loading             = ref(false)
// 🆕 默认 30 分钟（原来 15 分钟对下单-支付的用户体验偏短）
const countdown           = ref(30 * 60)
const paymentId           = ref(null)
const paymentTime         = ref('')
const showSuccessDialog   = ref(false)
const walletLoaded        = ref(false)   // 🆕 钱包是否已加载完，未加载完时不做余额判断
const pageReady           = ref(false)   // 🆕 页面所有初始化完成才允许点击支付

let timer = null

const paymentMethods = ref([])
const ALL_METHODS = [
  { id: 1, name: '支付宝',  icon: CreditCard, desc: '推荐使用支付宝安全快捷支付', settingKey: 'alipayEnabled'   },
  { id: 2, name: '微信支付', icon: Iphone,     desc: '微信扫码支付，方便快捷',     settingKey: 'wechatEnabled'  },
  { id: 3, name: '余额支付', icon: Wallet,     desc: '使用账户余额支付',            settingKey: 'balanceEnabled' }
]

// ── 钱包余额 ─────────────────────────────────────────────
const walletBalance = ref(0)
// 🔧 修复：钱包未加载完时不判断余额（避免初始化阶段的误报）
const balanceEnough = computed(() => {
  if (!walletLoaded.value) return true  // 还没加载完 → 乐观地假设够
  return Number(walletBalance.value) >= Number(orderAmount.value)
})
const shortfallAmount = computed(() => Math.max(0, Number(orderAmount.value) - Number(walletBalance.value)).toFixed(2))
const paymentTypeName = computed(() => ALL_METHODS.find(m => m.id === selectedPaymentType.value)?.name || '在线支付')

const loadWallet = async () => {
  try {
    const res = await getWallet()
    if (res && res.code === 200 && res.data) {
      // 后端 balance 是 BigDecimal，JSON 可能序列化为字符串或数字
      const raw = res.data.balance
      walletBalance.value = raw == null ? 0 : Number(raw)
      if (isNaN(walletBalance.value)) walletBalance.value = 0
    }
  } catch (e) {
    console.warn('[PaymentPage] 钱包加载失败:', e)
    walletBalance.value = 0
  } finally {
    walletLoaded.value = true
  }
}

const goRecharge = () => router.push({ path: '/user/wallet', query: { tab: 'recharge' } })

const formatTime = (seconds) => {
  if (seconds < 0) seconds = 0
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startCountdown = () => {
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(timer)
      ElMessage.warning('订单已超时，请重新下单')
      router.push('/order/list')
    }
  }, 1000)
}

/**
 * 🆕 基于订单真实创建时间计算剩余超时秒数
 *    countdown = max(0, timeoutTotalSec - (now - createTime))
 *    这样关闭再进来不会每次都给满 30 分钟，符合真实电商超时规则
 */
const computeCountdownFromOrder = (timeoutMinutes) => {
  if (!orderCreateTime.value) return timeoutMinutes * 60
  const createdMs = new Date(orderCreateTime.value).getTime()
  if (isNaN(createdMs)) return timeoutMinutes * 60
  const elapsedSec = Math.floor((Date.now() - createdMs) / 1000)
  const remain = timeoutMinutes * 60 - elapsedSec
  return Math.max(0, remain)
}

const createPaymentOrder = async () => {
  const res = await createPayment({
    orderId:       orderId.value,
    paymentType:   selectedPaymentType.value,
    paymentAmount: orderAmount.value
  })
  paymentId.value = res.data.id
  orderNo.value   = res.data.orderNo
}

const handlePay = async () => {
  if (!pageReady.value) {
    ElMessage.info('页面正在加载，请稍候')
    return
  }

  // 余额支付：先确保最新余额，再做判断
  if (selectedPaymentType.value === 3) {
    await loadWallet()
    if (!balanceEnough.value) {
      ElMessage.error(
        `余额不足，当前 ¥${Number(walletBalance.value).toFixed(2)}，需 ¥${Number(orderAmount.value).toFixed(2)}，请先充值`
      )
      return
    }
  }

  loading.value = true
  try {
    if (!paymentId.value) await createPaymentOrder()

    // 后端 simulatePaymentSuccess:
    //   type=3 → PaymentServiceImpl 调 BalanceService.changeBalance() 真实扣款
    //   type=1/2 → 模拟支付宝/微信
    await simulatePayment(paymentId.value)

    clearInterval(timer)
    paymentTime.value = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })
    ElMessage.success('支付成功')
    showSuccessDialog.value = true
  } catch (error) {
    // error.message 已在 request 拦截器 toast 过，这里不重复 toast
    console.warn('[PaymentPage] 支付失败:', error)
  } finally {
    loading.value = false
  }
}

const goToOrderList = () => router.push('/order/list')
const goToHome      = () => router.push('/home')

onMounted(async () => {
  orderId.value     = Number(route.query.orderId)
  orderAmount.value = Number(route.query.amount)

  if (!orderId.value || !orderAmount.value || isNaN(orderAmount.value)) {
    ElMessage.error('订单信息不完整')
    router.push('/order/list')
    return
  }

  // ────────── 1. 拉取支付配置（支付方式 + 超时） ──────────
  let timeoutMinutes = 30
  try {
    const res = await getPaymentSetting()
    const s = res.data || {}
    paymentMethods.value = ALL_METHODS.filter(m => s[m.settingKey] === true || s[m.settingKey] === 'true')
    if (paymentMethods.value.length === 0) paymentMethods.value = ALL_METHODS
    if (paymentMethods.value.length > 0) selectedPaymentType.value = paymentMethods.value[0].id
    if (s.payTimeoutMinutes && Number(s.payTimeoutMinutes) > 0) {
      timeoutMinutes = Number(s.payTimeoutMinutes)
    }
  } catch (e) {
    console.warn('[PaymentPage] 支付配置加载失败，使用默认值')
    paymentMethods.value = ALL_METHODS
  }

  // ────────── 2. 拉取订单真实创建时间（用于倒计时基准） ──────────
  try {
    const orderRes = await getOrderDetail(orderId.value)
    if (orderRes && orderRes.code === 200 && orderRes.data) {
      orderCreateTime.value = orderRes.data.createTime
      // 兜底：如果后端返回的 paymentAmount 与 query 不一致，以后端为准防篡改
      if (orderRes.data.paymentAmount != null) {
        const backendAmount = Number(orderRes.data.paymentAmount)
        if (!isNaN(backendAmount) && backendAmount > 0) {
          orderAmount.value = backendAmount
        }
      }
    }
  } catch (e) {
    console.warn('[PaymentPage] 订单详情加载失败:', e)
  }
  countdown.value = computeCountdownFromOrder(timeoutMinutes)
  if (countdown.value <= 0) {
    ElMessage.warning('订单已超时，请重新下单')
    router.push('/order/list')
    return
  }

  // ────────── 3. 拉取钱包余额 ──────────
  await loadWallet()

  // ────────── 4. 查询已有支付记录（首次进入可能为 null，不再 toast） ──────────
  try {
    const res = await getPaymentByOrderId(orderId.value)
    const pay = res?.data
    if (pay && pay.status === 1) {
      ElMessage.info('该订单已支付')
      router.push(`/order/detail/${orderId.value}`)
      return
    } else if (pay && pay.status === 0) {
      // 复用未完成的支付记录，避免重复 createPayment
      paymentId.value           = pay.id
      orderNo.value             = pay.orderNo
      selectedPaymentType.value = pay.paymentType
    }
    // res.data === null → 首次进入，正常，不提示
  } catch (e) {
    // 已被全局拦截器 toast，这里只记录
    console.warn('[PaymentPage] 查询已有支付记录失败:', e)
  }

  pageReady.value = true
  startCountdown()
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped lang="scss">
.payment-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.countdown-notice {
  max-width: 1200px;
  margin: 0 auto 20px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #856404;
  font-size: 14px;
  strong { font-size: 18px; color: #e74c3c; }
}

.payment-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.payment-methods {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  h2 { font-size: 24px; margin-bottom: 20px; color: #333; }
}

.method-list { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }

.method-item {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s;
  &:hover { border-color: #409eff; background: #f0f9ff; }
  &.active {
    border-color: #409eff; background: #f0f9ff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
    .method-icon { background: #409eff; color: white; }
  }
}

.method-icon {
  width: 50px; height: 50px; border-radius: 50%;
  background: #f5f5f5; display: flex; align-items: center;
  justify-content: center; transition: all 0.3s;
}

.method-info {
  flex: 1;
  h3 { font-size: 16px; margin-bottom: 5px; color: #333; }
  p  { font-size: 14px; color: #999; margin: 0; }
}

.balance-ok  { color: #67c23a; font-weight: 600; font-size: 15px; }
.balance-low { color: #f56c6c; font-weight: 600; font-size: 15px; }

.method-radio {
  width: 24px; height: 24px; border: 2px solid #ddd; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; transition: all 0.3s;
  .method-item.active & { border-color: #409eff; }
  .radio-dot { width: 12px; height: 12px; background: #409eff; border-radius: 50%; }
}

.balance-warn {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 10px 14px; margin-bottom: 14px;
  background: #fef0f0; border: 1px solid #fde2e2;
  border-radius: 8px; font-size: 13px; color: #f56c6c;
}

.pay-button { width: 100%; height: 50px; font-size: 18px; font-weight: bold; }

.order-info {
  background: white; border-radius: 16px; padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  h3 { font-size: 20px; margin-bottom: 20px; color: #333; }
}

.info-list { margin-bottom: 20px; }

.info-item {
  display: flex; justify-content: space-between;
  margin-bottom: 15px; color: #666; font-size: 14px;
  .discount { color: #e74c3c; }
  &.total { font-size: 16px; font-weight: bold; color: #333; .amount { color: #e74c3c; font-size: 24px; } }
}

.info-divider { height: 1px; background: #e0e0e0; margin: 15px 0; }

.security-tips {
  background: #f0f9ff; border-radius: 8px; padding: 15px; display: flex; gap: 10px; color: #409eff;
  .tips-title { font-weight: bold; margin-bottom: 8px; }
  ul { margin: 0; padding-left: 15px; color: #666; font-size: 13px; li { margin-bottom: 5px; } }
}

.success-content {
  text-align: center; padding: 20px;
  .success-icon { margin-bottom: 20px; }
  h2 { font-size: 28px; margin-bottom: 10px; color: #333; }
  p  { color: #666; margin-bottom: 30px; }
}

.success-info { background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: left; }

.success-item {
  display: flex; justify-content: space-between;
  margin-bottom: 15px; font-size: 14px; color: #666;
  &:last-child { margin-bottom: 0; }
  .amount { color: #e74c3c; font-size: 20px; font-weight: bold; }
}

/* Trade flow polish */
.payment-page {
  min-height: 100vh;
  padding: 28px 20px 80px;
  background:
    radial-gradient(circle at 12% 0%, rgba(199,165,114,.10), transparent 28%),
    linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
  color: #172033;
}

.countdown-notice {
  max-width: 1200px;
  margin-bottom: 20px;
  border: 1px solid rgba(199,165,114,.38);
  border-radius: 10px;
  background: #fffaf1;
  color: #7a5e3d;
  box-shadow: 0 10px 26px rgba(23,32,51,.06);

  strong {
    color: #d85c25;
    font-size: 20px;
    letter-spacing: .6px;
  }
}

.payment-container {
  gap: 22px;
}

.payment-methods,
.order-info {
  border: 1px solid rgba(23,32,51,.08);
  border-radius: 14px;
  background: rgba(255,255,255,.94);
  box-shadow: 0 18px 45px rgba(23,32,51,.08);
}

.payment-methods {
  padding: 34px 30px;

  h2 {
    margin: 0 0 24px;
    color: #172033;
    font-size: 26px;
    font-weight: 760;
    letter-spacing: .4px;
  }
}

.method-list {
  gap: 16px;
}

.method-item {
  border: 1px solid rgba(23,32,51,.10);
  border-radius: 12px;
  background: #fff;

  &:hover {
    border-color: rgba(199,165,114,.52);
    background: #fffaf1;
  }

  &.active {
    border-color: #172033;
    background: linear-gradient(180deg, #f8fbff, #f3f6fb);
    box-shadow: 0 12px 28px rgba(23,32,51,.10);

    .method-icon {
      background: #172033;
      color: #fff;
    }
  }
}

.method-icon {
  background: #eef2f7;
  color: #172033;
}

.method-info {
  h3 {
    color: #172033;
    font-weight: 700;
  }

  p {
    color: #7b8496;
  }
}

.method-radio {
  border-color: rgba(23,32,51,.22);

  .method-item.active & {
    border-color: #172033;
  }

  .radio-dot {
    background: #172033;
  }
}

.balance-ok {
  color: #4d9b4a;
}

.balance-low {
  color: #c84d44;
}

.balance-warn {
  border-color: rgba(200,77,68,.20);
  border-radius: 10px;
  background: #fff5f4;
  color: #a43c35;
}

.pay-button {
  height: 52px;
  border-radius: 8px;
  font-size: 18px;
  letter-spacing: .5px;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #27334b;
  --el-button-hover-border-color: #27334b;
  --el-button-active-bg-color: #101827;
  --el-button-active-border-color: #101827;
  font-weight: 650;
}

.order-info {
  padding: 34px 30px;

  h3 {
    margin: 0 0 24px;
    color: #172033;
    font-size: 22px;
    font-weight: 740;
  }
}

.info-item {
  color: #5a6272;

  &.total {
    color: #172033;

    .amount {
      color: #d85c25;
      font-size: 28px;
      letter-spacing: .6px;
    }
  }

  .discount {
    color: #4d9b4a;
  }
}

.info-divider {
  background: rgba(23,32,51,.10);
}

.security-tips {
  border: 1px solid rgba(23,32,51,.08);
  border-radius: 10px;
  background: #f5f8fc;
  color: #172033;

  .tips-title {
    color: #172033;
  }

  ul {
    color: #657084;
  }
}

:deep(.el-dialog) {
  border-radius: 14px;
}

.success-content {
  .success-icon {
    color: #4d9b4a !important;
  }

  h2 {
    color: #172033;
  }

  p {
    color: #657084;
  }
}

.success-info {
  border: 1px solid rgba(23,32,51,.08);
  border-radius: 10px;
  background: #f7f9fc;
}

.success-item {
  color: #5a6272;

  .amount {
    color: #d85c25;
  }
}

@media (max-width: 768px) {
  .payment-page {
    padding: 18px 14px 52px;
  }

  .payment-methods,
  .order-info {
    padding: 24px 20px;
  }
}
/* Final direction: restrained premium payment */
.payment-page {
  min-height: 100vh;
  padding: 28px 0 64px;
  background:
    linear-gradient(180deg, rgba(18, 27, 43, 0.035), transparent 220px),
    #f6f4ef;
  color: #172033;
}

.countdown-notice {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto 18px;
  border: 1px solid rgba(179, 93, 37, 0.16);
  border-radius: 8px;
  background: #fff8ee;
  color: #8a5a26;
  box-shadow: none;
}

.countdown-notice strong {
  color: #b35d25;
  font-size: 18px;
}

.payment-container {
  width: min(1160px, calc(100% - 48px));
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  margin: 0 auto;
}

.payment-methods,
.order-info {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
}

.payment-methods {
  background: #ffffff;
}

.payment-methods h2,
.order-info h3 {
  color: #172033;
  font-size: 20px;
  font-weight: 760;
}

.method-list {
  gap: 12px;
}

.method-item {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #fbfcfd;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.method-item:hover {
  border-color: rgba(159, 122, 68, 0.24);
  background: #fffaf1;
}

.method-item.active {
  border-color: #172033;
  background: #fffaf1;
  box-shadow: none;
}

.method-icon {
  background: #f2f4f7;
  color: #172033;
}

.method-item.active .method-icon {
  background: #172033;
  color: #ffffff;
}

.method-info h3 {
  color: #172033;
  font-weight: 760;
}

.method-info p {
  color: #6b7280;
}

.method-radio {
  border-color: rgba(23, 32, 51, 0.22);
}

.radio-dot {
  background: #172033;
}

.balance-ok {
  color: #368a50;
}

.balance-low {
  color: #b35d25;
}

.balance-warn {
  border: 1px solid rgba(179, 93, 37, 0.16);
  border-radius: 8px;
  background: #fff8ee;
  color: #8a5a26;
}

.pay-button {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #28344d;
  --el-button-hover-border-color: #28344d;
  width: 100%;
  height: 48px;
  border-radius: 6px;
  font-weight: 800;
}

.order-info {
  position: sticky;
  top: 20px;
  align-self: start;
  background: #172033;
  color: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.16);
}

.order-info h3 {
  color: #ffffff;
}

.info-list {
  color: rgba(255, 255, 255, 0.74);
}

.info-item {
  color: rgba(255, 255, 255, 0.74);
}

.info-item span:last-child {
  color: #ffffff;
  font-weight: 700;
}

.info-item .discount {
  color: #9bd49d;
}

.info-divider {
  background: rgba(255, 255, 255, 0.12);
}

.info-item.total {
  color: #ffffff;
}

.info-item.total .amount {
  color: #e7c078;
  font-size: 30px;
  font-weight: 800;
}

.security-tips {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.72);
}

.security-tips .el-icon,
.tips-title {
  color: #e7c078;
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

.success-content {
  color: #172033;
}

.success-icon {
  color: #368a50 !important;
}

.success-info {
  border-radius: 8px;
  background: #f6f4ef;
}

.success-item {
  color: #6b7280;
}

.success-item span:last-child {
  color: #172033;
  font-weight: 700;
}

.success-item .amount {
  color: #b35d25;
}

:deep(.el-dialog__footer .el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #28344d;
  --el-button-hover-border-color: #28344d;
}

@media (max-width: 980px) {
  .payment-container {
    grid-template-columns: 1fr;
  }

  .order-info {
    position: static;
  }
}

@media (max-width: 720px) {
  .payment-page {
    padding: 18px 0 44px;
  }

  .countdown-notice,
  .payment-container {
    width: calc(100% - 28px);
  }
}

/* Payment final pass: page-local payment desk. */
:global(body .payment-page.payment-page.payment-page) {
  min-height: 100vh !important;
  padding: 32px 0 76px !important;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88) 0%, rgba(246, 243, 236, 0.96) 260px),
    #f6f3ec !important;
  color: #1f2933 !important;
}

:global(body .payment-page.payment-page.payment-page .countdown-notice),
:global(body .payment-page.payment-page.payment-page .payment-container) {
  width: min(1120px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin-right: auto !important;
  margin-left: auto !important;
}

:global(body .payment-page.payment-page.payment-page .countdown-notice) {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  min-height: 54px !important;
  margin-bottom: 18px !important;
  padding: 0 18px !important;
  border: 1px solid rgba(156, 107, 53, 0.28) !important;
  border-radius: 7px !important;
  background: #fff8e6 !important;
  color: #5c3d19 !important;
  box-shadow: none !important;
}

:global(body .payment-page.payment-page.payment-page .countdown-notice span),
:global(body .payment-page.payment-page.payment-page .countdown-notice strong) {
  color: #5c3d19 !important;
}

:global(body .payment-page.payment-page.payment-page .countdown-notice strong) {
  color: #b4531f !important;
  font-size: 20px !important;
  font-weight: 850 !important;
}

:global(body .payment-page.payment-page.payment-page .payment-container) {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 350px !important;
  gap: 22px !important;
  align-items: start !important;
}

:global(body .payment-page.payment-page.payment-page .payment-container::before) {
  display: none !important;
  content: none !important;
}

:global(body .payment-page.payment-page.payment-page .payment-methods),
:global(body .payment-page.payment-page.payment-page .order-info) {
  padding: 24px !important;
  border-radius: 7px !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .payment-page.payment-page.payment-page .payment-methods) {
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  background: rgba(255, 253, 250, 0.98) !important;
}

:global(body .payment-page.payment-page.payment-page .payment-methods h2) {
  margin: 0 0 18px !important;
  color: #111827 !important;
  font-size: 22px !important;
  font-weight: 780 !important;
}

:global(body .payment-page.payment-page.payment-page .method-list) {
  display: grid !important;
  gap: 12px !important;
}

:global(body .payment-page.payment-page.payment-page .method-item) {
  display: grid !important;
  grid-template-columns: 50px minmax(0, 1fr) 24px !important;
  gap: 14px !important;
  align-items: center !important;
  min-height: 88px !important;
  padding: 16px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  box-shadow: none !important;
  cursor: pointer !important;
}

:global(body .payment-page.payment-page.payment-page .method-item.active) {
  border-color: #9c6b35 !important;
  background: #fff8ec !important;
}

:global(body .payment-page.payment-page.payment-page .method-icon) {
  display: grid !important;
  width: 50px !important;
  height: 50px !important;
  place-items: center !important;
  border-radius: 50% !important;
  background: #f3f1eb !important;
  color: #111827 !important;
}

:global(body .payment-page.payment-page.payment-page .method-item.active .method-icon) {
  background: #111827 !important;
  color: #fffdfa !important;
}

:global(body .payment-page.payment-page.payment-page .method-info h3) {
  margin: 0 0 4px !important;
  color: #111827 !important;
  font-size: 16px !important;
  font-weight: 760 !important;
}

:global(body .payment-page.payment-page.payment-page .method-info p) {
  margin: 0 !important;
  color: #667085 !important;
  line-height: 1.55 !important;
}

:global(body .payment-page.payment-page.payment-page .balance-warn) {
  margin-top: 14px !important;
  padding: 12px 14px !important;
  border: 1px solid rgba(180, 83, 31, 0.2) !important;
  border-radius: 6px !important;
  background: #fff4ed !important;
  color: #9a3412 !important;
  line-height: 1.6 !important;
}

:global(body .payment-page.payment-page.payment-page .pay-button) {
  width: 100% !important;
  height: 46px !important;
  margin-top: 18px !important;
  border-color: #111827 !important;
  border-radius: 4px !important;
  background: #111827 !important;
  color: #fffdfa !important;
  font-weight: 800 !important;
}

:global(body .payment-page.payment-page.payment-page .pay-button span) {
  color: #fffdfa !important;
}

:global(body .payment-page.payment-page.payment-page .order-info) {
  position: sticky !important;
  top: 24px !important;
  border: 1px solid #111827 !important;
  background: #111827 !important;
  color: #f9fafb !important;
  box-shadow: none !important;
}

:global(body .payment-page.payment-page.payment-page .order-info h3) {
  margin: 0 0 16px !important;
  color: #f9fafb !important;
  font-size: 20px !important;
  font-weight: 780 !important;
}

:global(body .payment-page.payment-page.payment-page .info-item) {
  display: flex !important;
  justify-content: space-between !important;
  gap: 14px !important;
  color: #f9fafb !important;
  line-height: 1.6 !important;
}

:global(body .payment-page.payment-page.payment-page .info-item span) {
  color: #f9fafb !important;
}

:global(body .payment-page.payment-page.payment-page .info-divider) {
  margin: 14px 0 !important;
  background: rgba(255, 253, 250, 0.18) !important;
}

:global(body .payment-page.payment-page.payment-page .info-item.total .amount) {
  color: #f0c878 !important;
  font-size: 28px !important;
  font-weight: 850 !important;
}

:global(body .payment-page.payment-page.payment-page .security-tips) {
  margin-top: 20px !important;
  padding: 14px !important;
  border: 1px solid rgba(255, 253, 250, 0.1) !important;
  border-radius: 6px !important;
  background: rgba(255, 253, 250, 0.08) !important;
}

:global(body .payment-page.payment-page.payment-page .security-tips li),
:global(body .payment-page.payment-page.payment-page .security-tips p) {
  color: rgba(249, 250, 251, 0.84) !important;
}

/* Payment pass 2: align the payment desk with the lighter receipt pages. */
:global(body .payment-page.payment-page.payment-page) {
  padding-top: 28px !important;
}

:global(body .payment-page.payment-page.payment-page .countdown-notice) {
  min-height: 48px !important;
  margin-bottom: 16px !important;
  background: #fffaf0 !important;
  border-color: rgba(156, 107, 53, 0.22) !important;
}

:global(body .payment-page.payment-page.payment-page .payment-container) {
  grid-template-columns: minmax(0, 1fr) 340px !important;
  gap: 18px !important;
}

:global(body .payment-page.payment-page.payment-page .payment-methods),
:global(body .payment-page.payment-page.payment-page .order-info) {
  padding: 22px !important;
  box-shadow: 0 10px 24px rgba(21, 26, 34, 0.045) !important;
}

:global(body .payment-page.payment-page.payment-page .payment-methods h2) {
  margin-bottom: 16px !important;
  font-size: 21px !important;
}

:global(body .payment-page.payment-page.payment-page .method-list) {
  gap: 10px !important;
}

:global(body .payment-page.payment-page.payment-page .method-item) {
  grid-template-columns: 44px minmax(0, 1fr) 22px !important;
  min-height: 78px !important;
  padding: 14px !important;
}

:global(body .payment-page.payment-page.payment-page .method-icon) {
  width: 42px !important;
  height: 42px !important;
}

:global(body .payment-page.payment-page.payment-page .method-icon .el-icon) {
  font-size: 20px !important;
}

:global(body .payment-page.payment-page.payment-page .method-radio) {
  width: 20px !important;
  height: 20px !important;
  border-color: rgba(21, 26, 34, 0.22) !important;
}

:global(body .payment-page.payment-page.payment-page .method-radio .radio-dot) {
  width: 10px !important;
  height: 10px !important;
  background: #111827 !important;
}

:global(body .payment-page.payment-page.payment-page .pay-button) {
  margin-top: 16px !important;
  height: 46px !important;
  box-shadow: none !important;
}

:global(body .payment-page.payment-page.payment-page .order-info) {
  border-color: rgba(21, 26, 34, 0.14) !important;
  background: #fffdfa !important;
  color: #1f2933 !important;
}

:global(body .payment-page.payment-page.payment-page .order-info h3) {
  margin-bottom: 14px !important;
  padding-bottom: 14px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  color: #111827 !important;
}

:global(body .payment-page.payment-page.payment-page .info-list) {
  margin-bottom: 0 !important;
}

:global(body .payment-page.payment-page.payment-page .info-item) {
  margin-bottom: 12px !important;
  color: #4b5563 !important;
}

:global(body .payment-page.payment-page.payment-page .info-item span) {
  color: inherit !important;
}

:global(body .payment-page.payment-page.payment-page .info-item span:last-child) {
  color: #111827 !important;
}

:global(body .payment-page.payment-page.payment-page .info-divider) {
  background: rgba(21, 26, 34, 0.12) !important;
}

:global(body .payment-page.payment-page.payment-page .info-item.total) {
  color: #111827 !important;
}

:global(body .payment-page.payment-page.payment-page .info-item.total .amount) {
  color: #9c4f1e !important;
  font-size: 27px !important;
  letter-spacing: 0 !important;
}

:global(body .payment-page.payment-page.payment-page .security-tips) {
  margin-top: 18px !important;
  border-color: rgba(156, 107, 53, 0.14) !important;
  background: #f8f5ef !important;
  color: #4b5563 !important;
}

:global(body .payment-page.payment-page.payment-page .security-tips .el-icon),
:global(body .payment-page.payment-page.payment-page .security-tips .tips-title) {
  color: #9c6b35 !important;
}

:global(body .payment-page.payment-page.payment-page .security-tips li),
:global(body .payment-page.payment-page.payment-page .security-tips p) {
  color: #4b5563 !important;
}

@media (max-width: 980px) {
  :global(body .payment-page.payment-page.payment-page .countdown-notice),
  :global(body .payment-page.payment-page.payment-page .payment-container) {
    width: calc(100vw - 28px) !important;
  }

  :global(body .payment-page.payment-page.payment-page .payment-container) {
    grid-template-columns: 1fr !important;
  }

  :global(body .payment-page.payment-page.payment-page .order-info) {
    position: static !important;
  }
}

@media (max-width: 640px) {
  :global(body .payment-page.payment-page.payment-page .method-item) {
    grid-template-columns: 44px minmax(0, 1fr) !important;
  }

  :global(body .payment-page.payment-page.payment-page .method-radio) {
    grid-column: 2 !important;
  }
}
</style>
