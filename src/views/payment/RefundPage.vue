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
</style>