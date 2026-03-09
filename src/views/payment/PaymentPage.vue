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

const route  = useRoute()
const router = useRouter()

const orderId     = ref(null)
const orderNo     = ref('')
const orderAmount = ref(0)

const selectedPaymentType = ref(1)
const loading             = ref(false)
const countdown           = ref(900)
const paymentId           = ref(null)
const paymentTime         = ref('')
const showSuccessDialog   = ref(false)

let timer = null

const paymentMethods = ref([])
const ALL_METHODS = [
  { id: 1, name: '支付宝',  icon: CreditCard, desc: '推荐使用支付宝安全快捷支付', settingKey: 'alipayEnabled'   },
  { id: 2, name: '微信支付', icon: Iphone,     desc: '微信扫码支付，方便快捷',     settingKey: 'wechatEnabled'  },
  { id: 3, name: '余额支付', icon: Wallet,     desc: '使用账户余额支付',            settingKey: 'balanceEnabled' }
]

// ── 钱包余额 ─────────────────────────────────────────────
const walletBalance = ref(0)
const balanceEnough = computed(() => walletBalance.value >= orderAmount.value)
const shortfallAmount = computed(() => Math.max(0, orderAmount.value - walletBalance.value).toFixed(2))
const paymentTypeName = computed(() => ALL_METHODS.find(m => m.id === selectedPaymentType.value)?.name || '在线支付')

const loadWallet = async () => {
  try {
    const res = await getWallet()
    if (res.code === 200) walletBalance.value = Number(res.data.balance || 0)
  } catch (e) { walletBalance.value = 0 }
}

const goRecharge = () => router.push({ path: '/user/wallet', query: { tab: 'recharge' } })

const formatTime = (seconds) => {
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
  // 余额支付：点确认时再刷新余额，防止停留期间余额已被消耗
  if (selectedPaymentType.value === 3) {
    await loadWallet()
    if (!balanceEnough.value) {
      ElMessage.error(`余额不足，当前 ¥${walletBalance.value.toFixed(2)}，请先充值`)
      return
    }
  }

  loading.value = true
  try {
    if (!paymentId.value) await createPaymentOrder()

    // 后端 simulatePaymentSuccess：
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
    ElMessage.error(error.message || '支付失败，请重试')
  } finally {
    loading.value = false
  }
}

const goToOrderList = () => router.push('/order/list')
const goToHome      = () => router.push('/home')

onMounted(async () => {
  orderId.value     = Number(route.query.orderId)
  orderAmount.value = Number(route.query.amount)

  if (!orderId.value || !orderAmount.value) {
    ElMessage.error('订单信息不完整')
    router.push('/order/list')
    return
  }

  try {
    const res = await getPaymentSetting()
    const s = res.data
    paymentMethods.value = ALL_METHODS.filter(m => s[m.settingKey] === true || s[m.settingKey] === 'true')
    if (paymentMethods.value.length > 0) selectedPaymentType.value = paymentMethods.value[0].id
    if (s.payTimeoutMinutes) countdown.value = Number(s.payTimeoutMinutes) * 60
  } catch (e) {
    paymentMethods.value = ALL_METHODS
  }

  await loadWallet()

  getPaymentByOrderId(orderId.value).then(res => {
    if (res.data?.status === 1) {
      ElMessage.info('该订单已支付')
      router.push(`/order/detail/${orderId.value}`)
    } else if (res.data?.status === 0) {
      paymentId.value           = res.data.id
      orderNo.value             = res.data.orderNo
      selectedPaymentType.value = res.data.paymentType
    }
  }).catch(() => {})

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
</style>