<template>
  <div class="refund-page">
    <div class="refund-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <h2>申请退款</h2>
          </div>
        </template>

        <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-width="100px"
        >
          <!-- 订单信息 -->
          <div class="section">
            <h3>订单信息</h3>
            <div class="order-summary">
              <div class="summary-item">
                <span class="label">订单编号:</span>
                <span class="value">{{ orderInfo.orderNo }}</span>
              </div>
              <div class="summary-item">
                <span class="label">订单金额:</span>
                <span class="value amount">¥{{ orderInfo.paymentAmount }}</span>
              </div>
              <div class="summary-item">
                <span class="label">订单状态:</span>
                <el-tag :type="getOrderStatusType(orderInfo.status)">
                  {{ getOrderStatusText(orderInfo.status) }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 退款类型 -->
          <el-form-item label="退款类型" prop="refundType">
            <el-radio-group v-model="formData.refundType">
              <el-radio :value="1">仅退款</el-radio>
              <el-radio :value="2">退货退款</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 退款金额 -->
          <el-form-item v-if="maxRefundAmount !== null" label="退款金额" prop="refundAmount">
            <el-input-number
                v-model="formData.refundAmount"
                :min="0.01"
                :max="maxRefundAmount"
                :precision="2"
                :step="0.01"
                style="width: 200px"
            />
            <span class="tip">最多可退 ¥{{ maxRefundAmount }}</span>
          </el-form-item>

          <!-- 退款原因 -->
          <el-form-item label="退款原因" prop="refundReason">
            <el-select
                v-model="formData.refundReason"
                placeholder="请选择退款原因"
                style="width: 100%"
                @change="handleReasonChange"
            >
              <el-option
                  v-for="item in refundReasons"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-form-item>

          <!-- 详细说明 -->
          <el-form-item label="详细说明">
            <el-input
                v-model="formData.refundDetail"
                type="textarea"
                :rows="4"
                placeholder="请详细说明退款原因（选填）"
                maxlength="200"
                show-word-limit
            />
          </el-form-item>

          <!-- 温馨提示 -->
          <el-alert
              title="退款说明"
              type="info"
              :closable="false"
              show-icon
          >
            <ul class="tips-list">
              <li>退款申请提交后，我们将在1-3个工作日内审核</li>
              <li>审核通过后，退款将原路返回至您的支付账户</li>
              <li>退款到账时间取决于支付渠道，一般3-7个工作日</li>
              <li>如选择退货退款，请在审核通过后寄回商品</li>
            </ul>
          </el-alert>

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button type="primary" @click="submitRefund" :loading="loading">
              提交退款申请
            </el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail } from '@/api/order'
import { applyRefund } from '@/api/payment'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const loading = ref(false)

// 订单信息
const orderInfo = ref({
  orderNo: '',
  paymentAmount: 0,
  status: 0
})

// 最大退款金额
const maxRefundAmount = ref(null)

// 表单数据
const formData = reactive({
  orderId: null,
  refundType: 1,
  refundAmount: null,
  refundReason: '',
  refundDetail: ''
})

// 退款原因列表
const refundReasons = ref([
  { label: '不想要了', value: '不想要了' },
  { label: '商品质量问题', value: '商品质量问题' },
  { label: '商品与描述不符', value: '商品与描述不符' },
  { label: '发错货了', value: '发错货了' },
  { label: '商品损坏', value: '商品损坏' },
  { label: '收货超时', value: '收货超时' },
  { label: '其他原因', value: '其他原因' }
])

// 表单验证规则
const rules = {
  refundType: [
    { required: true, message: '请选择退款类型', trigger: 'change' }
  ],
  refundAmount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '退款金额必须大于0', trigger: 'blur' }
  ],
  refundReason: [
    { required: true, message: '请选择退款原因', trigger: 'change' }
  ]
}

// 获取订单状态类型
const getOrderStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'primary',
    2: 'info',
    3: 'success',
    4: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const textMap = {
    0: '待支付',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消'
  }
  return textMap[status] || '未知'
}

// 退款原因改变
const handleReasonChange = (value) => {
  if (value === '其他原因') {
    formData.refundDetail = ''
  }
}

// 提交退款申请
const submitRefund = async () => {
  try {
    await formRef.value.validate()

    loading.value = true

    const params = {
      orderId: formData.orderId,
      refundType: formData.refundType,
      refundAmount: formData.refundAmount,
      refundReason: formData.refundReason + (formData.refundDetail ? `：${formData.refundDetail}` : '')
    }

    await applyRefund(params)

    ElMessage.success('退款申请提交成功，请等待审核')
    router.push('/order/list')
  } catch (error) {
    if (error !== false) { // 验证失败返回false
      ElMessage.error(error.message || '提交失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 加载订单信息
const loadOrderInfo = async () => {
  try {
    const orderId = Number(route.query.orderId)
    if (!orderId) {
      ElMessage.error('订单信息不完整')
      router.push('/order/list')
      return
    }

    const res = await getOrderDetail(orderId)
    orderInfo.value = res.data

    // 设置表单数据
    formData.orderId = orderId
    formData.refundAmount = res.data.paymentAmount
    maxRefundAmount.value = res.data.paymentAmount

    // 检查订单状态
    if (res.data.status === 0) {
      ElMessage.warning('订单未支付，无法申请退款')
      router.push('/order/list')
    } else if (res.data.status === 4) {
      ElMessage.warning('订单已取消，无法申请退款')
      router.push('/order/list')
    }
  } catch (error) {
    ElMessage.error('加载订单信息失败')
    router.push('/order/list')
  }
}

onMounted(() => {
  loadOrderInfo()
})
</script>

<style scoped lang="scss">
.refund-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.refund-container {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  h2 {
    margin: 0;
    font-size: 20px;
    color: #333;
  }
}

.section {
  margin-bottom: 30px;

  h3 {
    font-size: 16px;
    margin-bottom: 15px;
    color: #333;
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
  }
}

.order-summary {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    color: #666;
  }

  .value {
    color: #333;
    font-weight: 500;

    &.amount {
      color: #e74c3c;
      font-size: 18px;
      font-weight: bold;
    }
  }
}

.tip {
  margin-left: 10px;
  color: #999;
  font-size: 14px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 14px;
  line-height: 1.8;

  li {
    margin-bottom: 5px;
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

/* Final direction: restrained premium refund */
.refund-page {
  min-height: calc(100vh - 64px);
  padding: 34px 20px 56px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(246, 244, 239, 0.96)),
    #f6f4ef;
}

.refund-container {
  max-width: 1040px;
}

:deep(.refund-container > .el-card) {
  overflow: hidden;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 50px rgba(23, 32, 51, 0.08);
}

:deep(.refund-container > .el-card > .el-card__header) {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: #fbfcfd;
}

:deep(.refund-container > .el-card > .el-card__body) {
  padding: 28px;
}

.card-header h2 {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #172033;
  font-size: 22px;
  font-weight: 750;
  letter-spacing: 0;
}

.card-header h2::before {
  content: "";
  width: 34px;
  height: 1px;
  background: #b88d3e;
}

.section {
  margin-bottom: 28px;
}

.section h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 0;
  border: 0;
  color: #172033;
  font-size: 16px;
  font-weight: 750;
}

.section h3::before {
  content: "";
  width: 4px;
  height: 18px;
  border-radius: 999px;
  background: #b88d3e;
}

.order-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 0;
  background: transparent;
}

.summary-item {
  min-height: 84px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  margin-bottom: 0;
  padding: 16px 18px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #fbfcfd;
}

.summary-item .label {
  color: #747d8c;
  font-size: 13px;
}

.summary-item .value {
  color: #172033;
  font-size: 15px;
  font-weight: 700;
  word-break: break-all;
}

.summary-item .value.amount {
  color: #b35d25;
  font-size: 22px;
  font-weight: 800;
}

.refund-page :deep(.el-form) {
  max-width: none;
}

.refund-page :deep(.el-form-item) {
  margin-bottom: 24px;
}

.refund-page :deep(.el-form-item__label) {
  color: #4e5969;
  font-weight: 650;
}

.refund-page :deep(.el-radio-group) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 180px));
  gap: 12px;
}

.refund-page :deep(.el-radio) {
  height: 48px;
  margin-right: 0;
  padding: 0 16px;
  border: 1px solid rgba(23, 32, 51, 0.1);
  border-radius: 8px;
  background: #ffffff;
}

.refund-page :deep(.el-radio.is-checked) {
  border-color: #172033;
  background: #fffaf0;
}

.refund-page :deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: #172033;
  background: #172033;
}

.refund-page :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #172033;
  font-weight: 700;
}

.refund-page :deep(.el-input__wrapper),
.refund-page :deep(.el-textarea__inner),
.refund-page :deep(.el-input-number .el-input__wrapper),
.refund-page :deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.12) inset;
}

.refund-page :deep(.el-input__wrapper.is-focus),
.refund-page :deep(.el-textarea__inner:focus),
.refund-page :deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #172033 inset;
}

.tip {
  color: #8b94a3;
}

.refund-page :deep(.el-alert) {
  margin: 4px 0 26px;
  border: 1px solid rgba(184, 141, 62, 0.2);
  border-radius: 8px;
  background: #fffaf0;
}

.tips-list {
  color: #6a7280;
}

.refund-page :deep(.el-button--primary) {
  min-width: 136px;
  border-color: #172033;
  background: #172033;
  box-shadow: 0 10px 22px rgba(23, 32, 51, 0.14);
}

.refund-page :deep(.el-button--primary:hover),
.refund-page :deep(.el-button--primary:focus) {
  border-color: #24314c;
  background: #24314c;
}

.refund-page :deep(.el-button:not(.el-button--primary):hover),
.refund-page :deep(.el-button:not(.el-button--primary):focus) {
  border-color: rgba(184, 141, 62, 0.42);
  color: #7a5e3d;
}

@media (max-width: 760px) {
  .refund-page {
    padding: 20px 12px 40px;
  }

  :deep(.refund-container > .el-card > .el-card__body) {
    padding: 20px 14px;
  }

  .order-summary,
  .refund-page :deep(.el-radio-group) {
    grid-template-columns: 1fr;
  }

  .refund-page :deep(.el-form-item__label) {
    width: 84px !important;
  }
}

/* Refund final pass: page-local after-sales form. */
:global(body .refund-page.refund-page.refund-page) {
  min-height: 100vh !important;
  padding: 28px 0 72px !important;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88) 0%, rgba(246, 243, 236, 0.96) 260px),
    #f6f3ec !important;
  color: #1f2933 !important;
}

:global(body .refund-page.refund-page.refund-page .refund-container) {
  width: min(920px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
}

:global(body .refund-page.refund-page.refund-page .refund-container > .el-card) {
  overflow: hidden !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .refund-page.refund-page.refund-page .el-card__header) {
  padding: 20px 24px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .refund-page.refund-page.refund-page .card-header h2) {
  margin: 0 !important;
  color: #111827 !important;
  font-size: 22px !important;
  font-weight: 800 !important;
}

:global(body .refund-page.refund-page.refund-page .el-card__body) {
  padding: 24px !important;
}

:global(body .refund-page.refund-page.refund-page .section) {
  margin-bottom: 24px !important;
  padding: 18px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #ffffff !important;
}

:global(body .refund-page.refund-page.refund-page .section h3) {
  margin: 0 0 16px !important;
  padding-left: 12px !important;
  border-left: 3px solid #9c6b35 !important;
  color: #111827 !important;
  font-size: 17px !important;
  font-weight: 800 !important;
}

:global(body .refund-page.refund-page.refund-page .section h3::before) {
  display: none !important;
}

:global(body .refund-page.refund-page.refund-page .order-summary) {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 12px !important;
}

:global(body .refund-page.refund-page.refund-page .summary-item) {
  display: grid !important;
  gap: 6px !important;
  min-height: 86px !important;
  padding: 14px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 6px !important;
  background: #f8f5ef !important;
}

:global(body .refund-page.refund-page.refund-page .summary-item .label) {
  color: #667085 !important;
}

:global(body .refund-page.refund-page.refund-page .summary-item .value) {
  color: #111827 !important;
  font-weight: 720 !important;
}

:global(body .refund-page.refund-page.refund-page .summary-item .value.amount) {
  color: #a6531f !important;
  font-size: 22px !important;
  font-weight: 850 !important;
}

:global(body .refund-page.refund-page.refund-page .el-form-item) {
  margin-bottom: 22px !important;
}

:global(body .refund-page.refund-page.refund-page .el-form-item__label) {
  color: #374151 !important;
  font-weight: 700 !important;
}

:global(body .refund-page.refund-page.refund-page .el-radio-group) {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 180px)) !important;
  gap: 12px !important;
}

:global(body .refund-page.refund-page.refund-page .el-radio) {
  height: 44px !important;
  margin: 0 !important;
  padding: 0 14px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 6px !important;
  background: #ffffff !important;
}

:global(body .refund-page.refund-page.refund-page .el-radio.is-checked) {
  border-color: #9c6b35 !important;
  background: #fff8ec !important;
}

:global(body .refund-page.refund-page.refund-page .el-input__wrapper),
:global(body .refund-page.refund-page.refund-page .el-textarea__inner),
:global(body .refund-page.refund-page.refund-page .el-select .el-input__wrapper) {
  border-radius: 5px !important;
  box-shadow: 0 0 0 1px rgba(21, 26, 34, 0.14) inset !important;
}

:global(body .refund-page.refund-page.refund-page .el-alert) {
  margin: 4px 0 24px !important;
  border: 1px solid rgba(156, 107, 53, 0.18) !important;
  border-radius: 6px !important;
  background: #fff8ec !important;
}

:global(body .refund-page.refund-page.refund-page .tips-list) {
  margin: 8px 0 0 !important;
  padding-left: 18px !important;
  color: #4b5563 !important;
  line-height: 1.75 !important;
}

:global(body .refund-page.refund-page.refund-page .el-button--primary) {
  min-width: 140px !important;
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

@media (max-width: 760px) {
  :global(body .refund-page.refund-page.refund-page .refund-container) {
    width: calc(100vw - 28px) !important;
  }

  :global(body .refund-page.refund-page.refund-page .order-summary),
  :global(body .refund-page.refund-page.refund-page .el-radio-group) {
    grid-template-columns: 1fr !important;
  }
}
</style>
