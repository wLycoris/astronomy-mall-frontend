<template>
  <div class="payment-page">
    <!-- 倒计时提示 -->
    <div class="countdown-notice">
      <el-icon><Clock /></el-icon>
      <span>订单将在 <strong>{{ formatTime(countdown) }}</strong> 后关闭，请尽快完成支付</span>
    </div>

    <div class="payment-container">
      <!-- 左侧：支付方式选择 -->
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
              <el-icon :size="24">
                <component :is="method.icon" />
              </el-icon>
            </div>

            <div class="method-info">
              <h3>{{ method.name }}</h3>
              <p>{{ method.desc }}</p>
            </div>

            <div class="method-radio">
              <div class="radio-dot" v-if="selectedPaymentType === method.id"></div>
            </div>
          </div>
        </div>

        <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handlePay"
            class="pay-button"
        >
          {{ loading ? '支付处理中...' : `确认支付 ¥${orderAmount.toFixed(2)}` }}
        </el-button>
      </div>

      <!-- 右侧：订单信息 -->
      <div class="order-info">
        <h3>订单信息</h3>

        <div class="info-list">
          <div class="info-item">
            <span>商品金额:</span>
            <span>¥{{ orderAmount.toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span>运费:</span>
            <span>¥0.00</span>
          </div>
          <div class="info-item">
            <span>优惠:</span>
            <span class="discount">-¥0.00</span>
          </div>

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

    <!-- 支付成功弹窗 -->
    <el-dialog
        v-model="showSuccessDialog"
        title="支付成功"
        width="500px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        center
    >
      <div class="success-content">
        <el-icon class="success-icon" :size="80" color="#67C23A">
          <CircleCheck />
        </el-icon>
        <h2>支付成功!</h2>
        <p>您的订单已支付完成</p>

        <div class="success-info">
          <div class="success-item">
            <span>订单编号:</span>
            <span>{{ orderNo }}</span>
          </div>
          <div class="success-item">
            <span>支付金额:</span>
            <span class="amount">¥{{ orderAmount.toFixed(2) }}</span>
          </div>
          <div class="success-item">
            <span>支付时间:</span>
            <span>{{ paymentTime }}</span>
          </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, CreditCard, Iphone, Wallet, InfoFilled, CircleCheck } from '@element-plus/icons-vue'
import { createPayment, simulatePayment, getPaymentByOrderId } from '@/api/payment'
import { getPaymentSetting } from '@/api/admin/setting'  // 🆕

const route = useRoute()
const router = useRouter()

// 订单信息
const orderId = ref(null)
const orderNo = ref('')
const orderAmount = ref(0)

// 支付信息
const selectedPaymentType = ref(1)
const loading = ref(false)
const countdown = ref(900) // 15分钟，🆕 onMounted 读取设置后覆盖
const paymentId = ref(null)
const paymentTime = ref('')

// 对话框
const showSuccessDialog = ref(false)

// 倒计时定时器
let timer = null

// 🆕 支付方式列表改为动态，onMounted 根据系统设置过滤
const paymentMethods = ref([])
const ALL_METHODS = [
  { id: 1, name: '支付宝', icon: CreditCard, desc: '推荐使用支付宝安全快捷支付', settingKey: 'alipayEnabled' },
  { id: 2, name: '微信支付', icon: Iphone, desc: '微信扫码支付，方便快捷', settingKey: 'wechatEnabled' },
  { id: 3, name: '余额支付', icon: Wallet, desc: '使用账户余额支付', settingKey: 'balanceEnabled' }
]

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 开始倒计时
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

// 创建支付订单
const createPaymentOrder = async () => {
  try {
    const res = await createPayment({
      orderId: orderId.value,
      paymentType: selectedPaymentType.value,
      paymentAmount: orderAmount.value
    })
    paymentId.value = res.data.id
    orderNo.value = res.data.orderNo
    console.log('创建支付订单成功:', res.data)
  } catch (error) {
    console.error('创建支付订单失败:', error)
  }
}

// 确认支付
const handlePay = async () => {
  loading.value = true

  try {
    // 如果还没有创建支付订单，先创建
    if (!paymentId.value) {
      await createPaymentOrder()
    }

    // 模拟支付成功
    await simulatePayment(paymentId.value)

    // 停止倒计时
    clearInterval(timer)

    // 设置支付时间
    paymentTime.value = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })

    // 显示成功弹窗
    ElMessage.success('支付成功')
    showSuccessDialog.value = true
  } catch (error) {
    ElMessage.error(error.message || '支付失败，请重试')
  } finally {
    loading.value = false
  }
}

// 跳转到订单列表
const goToOrderList = () => {
  router.push('/order/list')
}

// 返回首页
const goToHome = () => {
  router.push('/home')
}

// 初始化
onMounted(async () => {
  // 从路由参数获取订单信息
  orderId.value = Number(route.query.orderId)
  orderAmount.value = Number(route.query.amount)

  if (!orderId.value || !orderAmount.value) {
    ElMessage.error('订单信息不完整')
    router.push('/order/list')
    return
  }

  // 🆕 加载支付设置：过滤可用支付方式 + 超时时间
  try {
    const res = await getPaymentSetting()
    const s = res.data
    paymentMethods.value = ALL_METHODS.filter(m => s[m.settingKey] === true || s[m.settingKey] === 'true')
    if (paymentMethods.value.length > 0) selectedPaymentType.value = paymentMethods.value[0].id
    if (s.payTimeoutMinutes) countdown.value = Number(s.payTimeoutMinutes) * 60
  } catch (e) {
    // 读取失败降级：全部展示，保持默认15分钟
    paymentMethods.value = ALL_METHODS
  }

  // 检查是否已有支付记录
  getPaymentByOrderId(orderId.value).then(res => {
    if (res.data && res.data.status === 1) {
      // 已支付，跳转到订单详情
      ElMessage.info('该订单已支付')
      router.push(`/order/detail/${orderId.value}`)
    } else if (res.data && res.data.status === 0) {
      // 有待支付记录，使用已有的
      paymentId.value = res.data.id
      orderNo.value = res.data.orderNo
      selectedPaymentType.value = res.data.paymentType
    }
  }).catch(() => {
    // 没有支付记录，正常流程
  })

  // 开始倒计时
  startCountdown()
})

// 清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
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

  strong {
    font-size: 18px;
    color: #e74c3c;
  }
}

.payment-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.payment-methods {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 24px;
    margin-bottom: 20px;
    color: #333;
  }
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.method-item {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    background: #f0f9ff;
  }

  &.active {
    border-color: #409eff;
    background: #f0f9ff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);

    .method-icon {
      background: #409eff;
      color: white;
    }
  }
}

.method-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.method-info {
  flex: 1;

  h3 {
    font-size: 16px;
    margin-bottom: 5px;
    color: #333;
  }

  p {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.method-radio {
  width: 24px;
  height: 24px;
  border: 2px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  .method-item.active & {
    border-color: #409eff;
  }

  .radio-dot {
    width: 12px;
    height: 12px;
    background: #409eff;
    border-radius: 50%;
  }
}

.pay-button {
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
}

.order-info {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 20px;
    margin-bottom: 20px;
    color: #333;
  }
}

.info-list {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  color: #666;
  font-size: 14px;

  .discount {
    color: #e74c3c;
  }

  &.total {
    font-size: 16px;
    font-weight: bold;
    color: #333;

    .amount {
      color: #e74c3c;
      font-size: 24px;
    }
  }
}

.info-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 15px 0;
}

.security-tips {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  gap: 10px;
  color: #409eff;

  .tips-title {
    font-weight: bold;
    margin-bottom: 8px;
  }

  ul {
    margin: 0;
    padding-left: 15px;
    color: #666;
    font-size: 13px;

    li {
      margin-bottom: 5px;
    }
  }
}

.success-content {
  text-align: center;
  padding: 20px;

  .success-icon {
    margin-bottom: 20px;
  }

  h2 {
    font-size: 28px;
    margin-bottom: 10px;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 30px;
  }
}

.success-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-align: left;
}

.success-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;

  &:last-child {
    margin-bottom: 0;
  }

  .amount {
    color: #e74c3c;
    font-size: 20px;
    font-weight: bold;
  }
}
</style>