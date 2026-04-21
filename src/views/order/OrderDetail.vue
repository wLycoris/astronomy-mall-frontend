<template>
  <div class="order-detail-page">
    <div class="container">
      <!-- 面包屑导航 -->
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/order/list' }">我的订单</el-breadcrumb-item>
        <el-breadcrumb-item>订单详情</el-breadcrumb-item>
      </el-breadcrumb>

      <el-card v-loading="loading" class="detail-card">
        <template #header>
          <div class="card-header">
            <span>订单详情</span>
            <el-tag :type="getStatusType(order.status)">
              {{ order.statusText }}
            </el-tag>
          </div>
        </template>

        <!-- 订单基本信息 -->
        <div v-if="order.id" class="order-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">
              {{ order.orderNo }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ order.createTime }}
            </el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusType(order.status)">
                {{ order.statusText }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付时间">
              {{ order.paymentTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="发货时间">
              {{ order.deliveryTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="完成时间">
              {{ order.finishTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="取消时间" v-if="order.status === 4">
              {{ order.cancelTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="取消原因" v-if="order.cancelReason">
              {{ order.cancelReason }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 收货信息 -->
          <div class="section-title">收货信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="收货人">
              {{ order.receiverName }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ order.receiverPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">
              {{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }} {{ order.receiverAddress }}
            </el-descriptions-item>
            <el-descriptions-item label="订单备注" :span="2" v-if="order.remark">
              {{ order.remark }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 商品列表 -->
          <div class="section-title">商品列表</div>
          <el-table :data="order.items" border>
            <el-table-column label="商品信息" min-width="300">
              <template #default="{ row }">
                <div class="product-cell">
                  <el-image
                      :src="row.productImage"
                      fit="cover"
                      class="product-image"
                      @click="goToProduct(row.productId)"
                  />
                  <div class="product-info">
                    <div class="product-name" @click="goToProduct(row.productId)">
                      {{ row.productName }}
                    </div>
                    <div class="product-brand">{{ row.productBrand }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120" align="center">
              <template #default="{ row }">
                ¥{{ row.productPrice.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="数量" width="100" align="center" prop="quantity" />
            <el-table-column label="小计" width="120" align="center">
              <template #default="{ row }">
                <span class="total-price">¥{{ row.totalPrice.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <!-- ✅ 新增: 操作列 -->
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <!-- 已完成订单显示评价按钮 -->
                <el-button
                    v-if="order.status === 3 && !row.hasReviewed"
                    type="primary"
                    size="small"
                    @click="goToReview(row)"
                >
                  评价商品
                </el-button>
                <!-- 已评价显示查看评价按钮 -->
                <el-button
                    v-if="row.hasReviewed"
                    type="success"
                    size="small"
                    plain
                    @click="viewReview(row)"
                >
                  查看评价
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 费用明细 -->
          <div class="amount-section">
            <div class="amount-title">费用明细</div>
            <div class="amount-row">
              <span>商品总额:</span>
              <span>¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
            <div class="amount-row">
              <span>运费:</span>
              <span>¥{{ order.freight.toFixed(2) }}</span>
            </div>
            <div class="amount-row" v-if="order.discountAmount > 0">
              <span>优惠金额:</span>
              <span class="discount">-¥{{ order.discountAmount.toFixed(2) }}</span>
            </div>
            <div class="amount-row total">
              <span>实付金额:</span>
              <span class="total-amount">¥{{ order.paymentAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="detail-footer">
            <!-- 操作按钮 -->
            <div class="action-buttons">
              <el-button @click="goBack">返回订单列表</el-button>

              <el-button
                  v-if="order.status === 0"
                  type="primary"
                  @click="handleCancelOrder"
              >
                取消订单
              </el-button>

              <el-button
                  v-if="order.status === 2"
                  type="primary"
                  @click="handleConfirmReceipt"
              >
                确认收货
              </el-button>

              <!-- ✅ 新增: 评价全部商品按钮 -->
              <el-button
                  v-if="order.status === 3 && hasUnreviewedItems"
                  type="warning"
                  @click="goToReview(order.items[0])"
              >
                评价商品
              </el-button>

              <el-button
                  v-if="order.status === 3 || order.status === 4"
                  type="danger"
                  @click="handleDeleteOrder"
              >
                删除订单
              </el-button>
            </div>

            <!-- 新增：订单操作按钮区域（按你要求添加，未改动其它任何代码） -->
            <div class="order-actions">
              <!-- 待支付状态 -->
              <template v-if="order.status === 0">
                <el-button type="primary" @click="goToPay">
                  立即支付
                </el-button>
                <el-button @click="handleCancelOrder">
                  取消订单
                </el-button>
              </template>

              <!-- 待发货状态 -->
              <template v-else-if="order.status === 1">
                <el-button type="danger" @click="goToRefund">
                  申请退款
                </el-button>
              </template>

              <!-- 待收货状态 -->
              <template v-else-if="order.status === 2">
                <el-button type="primary" @click="handleConfirmReceipt">
                  确认收货
                </el-button>
                <el-button type="danger" @click="goToRefund">
                  申请退款
                </el-button>
              </template>

              <!-- 已完成状态 -->
              <template v-else-if="order.status === 3">
                <el-button type="primary" @click="goToReview(order.items[0])" v-if="hasUnreviewedItems">
                  评价订单
                </el-button>
                <el-button type="danger" @click="goToRefund">
                  申请退款
                </el-button>
              </template>
            </div>
          </div>

        </div>

        <el-empty v-else description="订单不存在" />
      </el-card>
    </div>

    <!-- ✅ 新增: 评价详情对话框 -->
    <el-dialog
        v-model="reviewDialogVisible"
        title="评价详情"
        width="600px"
    >
      <div v-if="currentReview" class="review-detail">
        <div class="review-header">
          <el-rate
              :model-value="currentReview.rating"
              disabled
              show-score
              text-color="#ff9900"
          />
          <span class="review-time">{{ currentReview.createTime }}</span>
        </div>
        <div class="review-content">{{ currentReview.content }}</div>
        <div v-if="currentReview.images && currentReview.images.length" class="review-images">
          <el-image
              v-for="(img, index) in currentReview.images"
              :key="index"
              :src="img"
              :preview-src-list="currentReview.images"
              :initial-index="index"
              fit="cover"
              class="review-image"
          />
        </div>
        <div v-if="currentReview.reply" class="merchant-reply">
          <div class="reply-label">商家回复:</div>
          <div class="reply-content">{{ currentReview.reply }}</div>
          <div class="reply-time">{{ currentReview.replyTime }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleDeleteReview">删除评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail, cancelOrder, confirmReceipt, deleteOrder } from '@/api/order'
import { getMyReviews, deleteReview } from '@/api/review'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const order = ref({})
const reviewDialogVisible = ref(false)
const currentReview = ref(null)

const orderMessageOptions = (type = 'warning') => ({
  type,
  customClass: 'order-message-box',
  confirmButtonClass: 'order-message-confirm',
  cancelButtonClass: 'order-message-cancel'
})

const orderPromptOptions = {
  ...orderMessageOptions('warning'),
  customClass: 'order-message-box order-message-prompt'
}

// 跳转到支付页面
const goToPay = () => {
  router.push({
    path: '/payment',
    query: {
      orderId: order.value.id,
      amount: order.value.paymentAmount
    }
  })
}

// 跳转到退款页面
const goToRefund = () => {
  router.push({
    path: '/payment/refund',
    query: {
      orderId: order.value.id
    }
  })
}

// ✅ 计算是否有未评价商品
const hasUnreviewedItems = computed(() => {
  return order.value.items?.some(item => !item.hasReviewed)
})

// 加载订单详情
const loadOrderDetail = async () => {
  loading.value = true
  try {
    const orderId = route.params.id || route.query.id
    const res = await getOrderDetail(orderId)
    order.value = res.data

    // ✅ 检查每个商品的评价状态
    await checkReviewStatus()
  } catch (error) {
    ElMessage.error(error.message || '加载订单详情失败')
  } finally {
    loading.value = false
  }
}

// ✅ 新增: 检查评价状态
const checkReviewStatus = async () => {
  if (order.value.status !== 3) return // 只检查已完成订单

  try {
    const res = await getMyReviews({ pageNum: 1, pageSize: 100 })
    const myReviews = res.data.records

    // 标记已评价的商品
    order.value.items?.forEach(item => {
      const reviewed = myReviews.find(r =>
          r.orderId === order.value.id && r.productId === item.productId
      )
      item.hasReviewed = !!reviewed
      if (reviewed) {
        item.reviewId = reviewed.id
      }
    })
  } catch (error) {
    console.error('检查评价状态失败:', error)
  }
}

// ✅ 新增: 查看评价
const viewReview = async (item) => {
  try {
    const res = await getMyReviews({ pageNum: 1, pageSize: 100 })
    const review = res.data.records.find(r =>
        r.orderId === order.value.id && r.productId === item.productId
    )

    if (review) {
      // 处理图片格式
      if (review.images && typeof review.images === 'string') {
        if (review.images.startsWith('[')) {
          review.images = JSON.parse(review.images)
        } else {
          review.images = review.images.split(',')
        }
      }

      currentReview.value = review
      reviewDialogVisible.value = true
    } else {
      ElMessage.warning('未找到评价记录')
    }
  } catch (error) {
    ElMessage.error(error.message || '加载评价失败')
  }
}

// ✅ 新增: 删除评价
const handleDeleteReview = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗?', '删除评价', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      ...orderMessageOptions('warning')
    })

    await deleteReview(currentReview.value.id)
    ElMessage.success('删除成功')
    reviewDialogVisible.value = false
    loadOrderDetail() // 刷新订单详情
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 去评价
const goToReview = (item) => {
  // ✅ 只传订单ID,不传商品ID
  router.push({
    path: '/review/publish',
    query: {
      orderId: order.value.id
      // 让用户在评价页面选择要评价的商品
    }
  })
}

// 跳转到商品详情
const goToProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 取消订单
const handleCancelOrder = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      inputPattern: /.+/,
      inputErrorMessage: '请输入取消原因',
      ...orderPromptOptions
    })

    await cancelOrder(order.value.id, value)
    ElMessage.success('订单已取消')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '取消订单失败')
    }
  }
}

// 确认收货
const handleConfirmReceipt = async () => {
  try {
    await ElMessageBox.confirm('确认已收到商品吗?', '确认收货', {
      confirmButtonText: '确认收货',
      cancelButtonText: '返回',
      ...orderMessageOptions('info')
    })

    await confirmReceipt(order.value.id)
    ElMessage.success('确认收货成功')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '确认收货失败')
    }
  }
}

// 删除订单
const handleDeleteOrder = async () => {
  try {
    await ElMessageBox.confirm('确认删除该订单吗?', '删除订单', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      ...orderMessageOptions('warning')
    })

    await deleteOrder(order.value.id)
    ElMessage.success('订单已删除')
    router.push('/order/list')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除订单失败')
    }
  }
}

// 返回
const goBack = () => {
  router.push('/order/list')
}

// 获取订单状态类型
const getStatusType = (status) => {
  const types = {
    0: 'warning',
    1: 'primary',
    2: 'primary',
    3: 'success',
    4: 'info'
  }
  return types[status] || 'info'
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped lang="scss">
.order-detail-page {
  min-height: calc(100vh - 200px);
  padding: 20px 0;
  background: #f5f5f5;
}

.container {
  width: 1200px;
  margin: 0 auto;
}

.el-breadcrumb {
  margin-bottom: 20px;
}

.detail-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
  }
}

.order-info {
  .section-title {
    margin: 30px 0 15px;
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    padding-bottom: 10px;
    border-bottom: 2px solid #409eff;
  }

  .product-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .product-image {
      width: 80px;
      height: 80px;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.1);
      }
    }

    .product-info {
      flex: 1;

      .product-name {
        font-size: 14px;
        margin-bottom: 6px;
        cursor: pointer;
        color: #409eff;

        &:hover {
          text-decoration: underline;
        }
      }

      .product-brand {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .total-price {
    color: #ff6b00;
    font-weight: bold;
  }

  .amount-section {
    margin-top: 30px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;

    .amount-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
      font-size: 14px;

      span:first-child {
        margin-right: 20px;
        color: #606266;
      }

      span:last-child {
        width: 120px;
        text-align: right;
      }

      &.total {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #dcdfe6;
        font-size: 16px;
        font-weight: bold;
      }
    }

    .discount {
      color: #67c23a;
    }

    .total-amount {
      color: #ff6b00;
      font-size: 20px;
    }
  }

  .action-buttons {
    margin-top: 30px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// ✅ 新增: 评价详情样式
.review-detail {
  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;

    .review-time {
      font-size: 14px;
      color: #999;
    }
  }

  .review-content {
    font-size: 15px;
    line-height: 1.6;
    color: #666;
    margin-bottom: 16px;
  }

  .review-images {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;

    .review-image {
      width: 100px;
      height: 100px;
      border-radius: 4px;
      cursor: pointer;
    }
  }
  .order-actions {
    margin-top: 20px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;

    .el-button {
      min-width: 100px;
    }
  }
  .merchant-reply {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;

    .reply-label {
      font-size: 14px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;
    }

    .reply-content {
      font-size: 14px;
      line-height: 1.6;
      color: #666;
      margin-bottom: 8px;
    }

    .reply-time {
      font-size: 12px;
      color: #999;
      text-align: right;
    }
  }
}

/* Trade flow polish */
.order-detail-page {
  min-height: 100vh;
  padding: 28px 0 78px;
  background:
    radial-gradient(circle at 12% 0%, rgba(199,165,114,.10), transparent 28%),
    linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
  color: #172033;
}

.container {
  width: min(1200px, calc(100% - 48px));
}

.el-breadcrumb {
  margin-bottom: 22px;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: #6f7787 !important;
  font-weight: 500 !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #172033 !important;
}

.detail-card {
  border: 1px solid rgba(23,32,51,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.95);
  box-shadow: 0 18px 45px rgba(23,32,51,.08);
  overflow: hidden;

  :deep(.el-card__header) {
    padding: 18px 22px;
    background: linear-gradient(180deg, #ffffff, #f7f9fc);
    border-bottom: 1px solid rgba(23,32,51,.08);
  }

  :deep(.el-card__body) {
    padding: 22px;
  }

  .card-header {
    color: #172033;
    font-size: 22px;
    font-weight: 760;
    letter-spacing: .4px;
  }
}

.order-info {
  .section-title {
    margin: 34px 0 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(23,32,51,.10);
    color: #172033;
    font-size: 20px;
    font-weight: 750;
    letter-spacing: .4px;
  }

  :deep(.el-descriptions__table) {
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.el-descriptions__label) {
    background: #f5f8fc !important;
    color: #657084;
    font-weight: 650;
  }

  :deep(.el-descriptions__content) {
    color: #172033;
    background: #fff !important;
  }

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    --el-table-header-bg-color: #f5f8fc;
    --el-table-header-text-color: #657084;
    --el-table-border-color: rgba(23,32,51,.08);
  }

  :deep(.el-table th.el-table__cell) {
    background: #f5f8fc;
    color: #657084;
    font-weight: 700;
  }

  .product-cell {
    .product-image {
      width: 86px;
      height: 86px;
      border-radius: 8px;
      border: 1px solid rgba(23,32,51,.08);
      background: #eef2f7;
    }

    .product-info {
      .product-name {
        color: #172033;
        font-weight: 650;

        &:hover {
          color: #7a5e3d;
          text-decoration: none;
        }
      }

      .product-brand {
        color: #8a92a3;
      }
    }
  }

  .total-price {
    color: #d85c25;
  }

  .amount-section {
    max-width: 430px;
    margin: 28px 0 0 auto;
    padding: 20px 22px;
    border: 1px solid rgba(23,32,51,.08);
    border-radius: 10px;
    background: #fbfcff;

    .amount-row {
      color: #5a6272;
    }

    .amount-row.total {
      border-top-color: rgba(23,32,51,.10);
      color: #172033;

      .total-amount {
        color: #d85c25;
        font-size: 28px;
        letter-spacing: .5px;
      }
    }
  }

  .action-buttons {
    justify-content: flex-end;
  }
}

.action-buttons,
.order-actions {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid rgba(23,32,51,.08);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.review-detail {
  color: #172033;

  .review-header {
    border-bottom-color: rgba(23,32,51,.08);

    .review-time {
      color: #8a92a3;
    }
  }

  .review-content,
  .merchant-reply {
    border: 1px solid rgba(23,32,51,.08);
    border-radius: 10px;
    background: #f7f9fc;
  }

  .review-content {
    padding: 14px 16px;
    color: #172033;
  }

  .merchant-reply {
    .reply-label {
      color: #7a5e3d;
    }

    .reply-content {
      color: #5a6272;
    }
  }
}

:deep(.el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #27334b;
  --el-button-hover-border-color: #27334b;
  --el-button-active-bg-color: #101827;
  --el-button-active-border-color: #101827;
}

:deep(.el-button--warning) {
  --el-button-bg-color: #b88d3e;
  --el-button-border-color: #b88d3e;
  --el-button-hover-bg-color: #c99b4b;
  --el-button-hover-border-color: #c99b4b;
}

:deep(.el-dialog) {
  border-radius: 12px;
}

@media (max-width: 760px) {
  .container {
    width: calc(100% - 28px);
  }

  .order-info .amount-section {
    max-width: none;
  }
}
/* Final direction: restrained premium order detail */
.order-detail-page {
  min-height: 100vh;
  padding: 28px 0 64px;
  background:
    linear-gradient(180deg, rgba(18, 27, 43, 0.035), transparent 220px),
    #f6f4ef;
  color: #172033;
}

.container {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto;
}

.el-breadcrumb {
  margin-bottom: 18px;
  font-size: 13px;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: #7a8494 !important;
  font-weight: 500 !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #172033 !important;
}

:deep(.detail-card.el-card) {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
  overflow: hidden;
}

:deep(.detail-card .el-card__header) {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: #fbfcfd;
}

.card-header span {
  color: #172033;
  font-size: 20px;
  font-weight: 760;
}

:deep(.el-tag) {
  border-radius: 999px;
  font-weight: 700;
}

.order-info {
  color: #172033;
}

:deep(.el-descriptions) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-descriptions__label.el-descriptions__cell.is-bordered-label) {
  background: #f6f7f9;
  color: #6b7280;
  font-weight: 650;
}

:deep(.el-descriptions__content.el-descriptions__cell.is-bordered-content) {
  color: #172033;
}

.section-title {
  margin: 28px 0 14px;
  padding-left: 12px;
  border-left: 3px solid #9f7a44;
  color: #172033;
  font-size: 18px;
  font-weight: 760;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background: #fbfcfd;
  color: #6b7280;
  font-weight: 700;
}

:deep(.el-table td.el-table__cell) {
  color: #172033;
}

.product-cell {
  gap: 14px;
}

.product-image {
  width: 76px;
  height: 76px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 6px;
  background: #eef0f3;
  overflow: hidden;
}

.product-name {
  color: #172033;
  font-size: 15px;
  font-weight: 680;
  line-height: 1.5;
}

.product-brand {
  color: #8a93a3;
}

.total-price {
  color: #b35d25;
  font-weight: 800;
}

.amount-section {
  margin-top: 22px;
  margin-left: auto;
  padding: 22px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #172033;
  color: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.16);
}

.amount-row {
  color: rgba(255, 255, 255, 0.74);
}

.amount-row span:last-child {
  color: #ffffff;
  font-weight: 700;
}

.amount-row .discount {
  color: #9bd49d;
}

.amount-row.total {
  margin-top: 14px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.total-amount {
  color: #e7c078 !important;
  font-size: 30px;
  font-weight: 800;
}

.action-buttons,
.order-actions {
  gap: 10px;
  margin-top: 22px;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #28344d;
  --el-button-hover-border-color: #28344d;
}

:deep(.el-button--warning) {
  --el-button-bg-color: #e7c078;
  --el-button-border-color: #e7c078;
  --el-button-hover-bg-color: #edca8e;
  --el-button-hover-border-color: #edca8e;
  color: #172033;
}

:deep(.el-button--danger) {
  --el-button-bg-color: #b35d25;
  --el-button-border-color: #b35d25;
  --el-button-hover-bg-color: #c76d32;
  --el-button-hover-border-color: #c76d32;
}

.review-detail {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #fbfcfd;
}

.review-header {
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
}

.review-content {
  color: #4b5563;
}

.merchant-reply {
  border: 1px solid rgba(159, 122, 68, 0.16);
  border-radius: 8px;
  background: #fbf4e8;
}

.reply-label {
  color: #8a6a3f;
  font-weight: 760;
}

@media (max-width: 760px) {
  .order-detail-page {
    padding: 18px 0 44px;
  }

  .container {
    width: calc(100% - 28px);
  }

  .amount-section {
    width: 100%;
  }

  .action-buttons,
  .order-actions {
    flex-wrap: wrap;
  }
}

/* Order detail final pass: page-local receipt layout. */
:global(body .order-detail-page.order-detail-page.order-detail-page) {
  min-height: 100vh !important;
  padding: 28px 0 72px !important;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88) 0%, rgba(246, 243, 236, 0.96) 260px),
    #f6f3ec !important;
  color: #1f2933 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .container) {
  width: min(1160px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .detail-card.el-card) {
  overflow: hidden !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .detail-card .el-card__header) {
  padding: 20px 24px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .detail-card .el-card__body) {
  padding: 24px !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .card-header) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .card-header span) {
  color: #111827 !important;
  font-size: 20px !important;
  font-weight: 800 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .section-title) {
  margin: 28px 0 14px !important;
  padding-left: 12px !important;
  border-left: 3px solid #9c6b35 !important;
  color: #111827 !important;
  font-size: 18px !important;
  font-weight: 800 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .el-descriptions) {
  overflow: hidden !important;
  border-radius: 7px !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .el-descriptions__label.el-descriptions__cell.is-bordered-label),
:global(body .order-detail-page.order-detail-page.order-detail-page .el-table th.el-table__cell) {
  background: #f8f5ef !important;
  color: #667085 !important;
  font-weight: 720 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .el-descriptions__content.el-descriptions__cell.is-bordered-content),
:global(body .order-detail-page.order-detail-page.order-detail-page .el-table td.el-table__cell) {
  color: #1f2933 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .el-table) {
  overflow: hidden !important;
  border-radius: 7px !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .product-cell) {
  display: flex !important;
  align-items: center !important;
  gap: 14px !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .product-image) {
  width: 76px !important;
  height: 76px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 5px !important;
  background: #eef0f3 !important;
  overflow: hidden !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .product-name) {
  color: #111827 !important;
  font-size: 15px !important;
  font-weight: 720 !important;
  line-height: 1.5 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .product-brand) {
  color: #667085 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .total-price) {
  color: #a6531f !important;
  font-weight: 850 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-section) {
  width: min(430px, 100%) !important;
  margin: 24px 0 0 auto !important;
  padding: 22px !important;
  border: 1px solid #111827 !important;
  border-radius: 7px !important;
  background: #111827 !important;
  color: #f9fafb !important;
  box-shadow: none !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row) {
  display: flex !important;
  justify-content: space-between !important;
  gap: 14px !important;
  color: #f9fafb !important;
  line-height: 1.6 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row span) {
  color: #f9fafb !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row.total) {
  margin-top: 14px !important;
  padding-top: 18px !important;
  border-top: 1px solid rgba(255, 253, 250, 0.18) !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .total-amount) {
  color: #f0c878 !important;
  font-size: 28px !important;
  font-weight: 850 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .action-buttons),
:global(body .order-detail-page.order-detail-page.order-detail-page .order-actions) {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 10px !important;
  margin-top: 22px !important;
  padding-top: 18px !important;
  border-top: 1px solid rgba(21, 26, 34, 0.1) !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .action-buttons) {
  justify-content: flex-start !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .order-actions) {
  justify-content: flex-end !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .action-buttons .el-button--primary),
:global(body .order-detail-page.order-detail-page.order-detail-page .action-buttons .el-button--warning),
:global(body .order-detail-page.order-detail-page.order-detail-page .action-buttons .el-button--danger) {
  display: none !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .el-button--primary) {
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .el-button--warning) {
  border-color: #f0c878 !important;
  background: #f0c878 !important;
  color: #111827 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .el-button--danger) {
  border-color: #a6531f !important;
  background: #a6531f !important;
  color: #fffdfa !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .review-detail) {
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .merchant-reply) {
  border-left: 3px solid #9c6b35 !important;
  border-radius: 5px !important;
  background: #f8f5ef !important;
}

/* Order detail final pass: make the closing area read like one receipt footer. */
:global(body .order-detail-page.order-detail-page.order-detail-page .amount-section) {
  display: grid !important;
  grid-template-columns: 1fr repeat(3, max-content) !important;
  column-gap: 28px !important;
  row-gap: 10px !important;
  align-items: center !important;
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 18px 20px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-top: 0 !important;
  border-radius: 0 0 7px 7px !important;
  background: #fffaf2 !important;
  color: #1f2933 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-title) {
  grid-row: 1 / span 2 !important;
  align-self: stretch !important;
  display: flex !important;
  align-items: center !important;
  padding-right: 18px !important;
  border-right: 1px solid rgba(156, 107, 53, 0.18) !important;
  color: #111827 !important;
  font-size: 15px !important;
  font-weight: 780 !important;
  line-height: 1.35 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row) {
  display: grid !important;
  grid-template-columns: max-content max-content !important;
  gap: 10px !important;
  align-items: baseline !important;
  justify-content: end !important;
  margin: 0 !important;
  color: #4b5563 !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
  white-space: nowrap !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row span) {
  width: auto !important;
  min-width: 0 !important;
  margin: 0 !important;
  color: inherit !important;
  text-align: right !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row span:last-child) {
  color: #111827 !important;
  font-weight: 720 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row.total) {
  grid-column: auto !important;
  grid-row: 1 / span 2 !important;
  min-width: 210px !important;
  padding: 0 0 0 24px !important;
  border-top: 0 !important;
  border-left: 1px solid rgba(21, 26, 34, 0.14) !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .amount-row.total span:first-child) {
  color: #111827 !important;
  font-size: 14px !important;
  font-weight: 780 !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .total-amount) {
  color: #9c4f1e !important;
  font-size: 26px !important;
  font-weight: 860 !important;
  letter-spacing: 0 !important;
  line-height: 1.1 !important;
  white-space: nowrap !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .detail-footer) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  margin-top: 24px !important;
  padding-top: 18px !important;
  border-top: 1px solid rgba(21, 26, 34, 0.1) !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .detail-footer .action-buttons),
:global(body .order-detail-page.order-detail-page.order-detail-page .detail-footer .order-actions) {
  margin: 0 !important;
  padding: 0 !important;
  border-top: 0 !important;
  background: transparent !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .detail-footer .action-buttons) {
  justify-content: flex-start !important;
}

:global(body .order-detail-page.order-detail-page.order-detail-page .detail-footer .order-actions) {
  justify-content: flex-end !important;
}

@media (max-width: 760px) {
  :global(body .order-detail-page.order-detail-page.order-detail-page .container) {
    width: calc(100vw - 28px) !important;
  }

  :global(body .order-detail-page.order-detail-page.order-detail-page .detail-card .el-card__body) {
    padding: 18px !important;
  }

  :global(body .order-detail-page.order-detail-page.order-detail-page .amount-section) {
    width: 100% !important;
    grid-template-columns: 1fr !important;
  }

  :global(body .order-detail-page.order-detail-page.order-detail-page .amount-title),
  :global(body .order-detail-page.order-detail-page.order-detail-page .amount-row.total) {
    grid-row: auto !important;
    padding: 0 !important;
    border: 0 !important;
  }

  :global(body .order-detail-page.order-detail-page.order-detail-page .amount-row) {
    justify-content: space-between !important;
  }

  :global(body .order-detail-page.order-detail-page.order-detail-page .detail-footer) {
    align-items: stretch !important;
    flex-direction: column !important;
  }

  :global(body .order-detail-page.order-detail-page.order-detail-page .order-actions),
  :global(body .order-detail-page.order-detail-page.order-detail-page .action-buttons) {
    justify-content: flex-start !important;
  }
}

/* Order page message boxes: page-scoped class for confirm/prompt dialogs. */
:global(.order-message-box.el-message-box) {
  width: min(430px, calc(100vw - 32px)) !important;
  padding: 0 !important;
  overflow: hidden !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 6px !important;
  background: #fffdfa !important;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.18) !important;
}

:global(.order-message-box .el-message-box__header) {
  padding: 18px 22px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(.order-message-box .el-message-box__title) {
  color: #111827 !important;
  font-size: 18px !important;
  font-weight: 800 !important;
  line-height: 1.35 !important;
}

:global(.order-message-box .el-message-box__headerbtn) {
  top: 16px !important;
  right: 16px !important;
}

:global(.order-message-box .el-message-box__content) {
  padding: 18px 22px !important;
  color: #374151 !important;
}

:global(.order-message-box .el-message-box__status) {
  color: #9c6b35 !important;
}

:global(.order-message-box .el-message-box__message p) {
  color: #374151 !important;
  font-size: 14px !important;
  line-height: 1.7 !important;
}

:global(.order-message-box .el-message-box__btns) {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 10px !important;
  padding: 0 22px 22px !important;
}

:global(.order-message-box .el-message-box__btns .el-button) {
  min-width: 76px !important;
  height: 34px !important;
  margin: 0 !important;
  border-radius: 4px !important;
  font-weight: 750 !important;
}

:global(.order-message-box .order-message-confirm) {
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

:global(.order-message-box .order-message-confirm span) {
  color: #fffdfa !important;
}

:global(.order-message-box .order-message-cancel) {
  border-color: rgba(21, 26, 34, 0.16) !important;
  background: #fffdfa !important;
  color: #111827 !important;
}

:global(.order-message-box .order-message-cancel span) {
  color: #111827 !important;
}

:global(.order-message-prompt .el-message-box__input) {
  padding-top: 10px !important;
}

:global(.order-message-prompt .el-input__wrapper) {
  min-height: 36px !important;
  border-radius: 5px !important;
  box-shadow: 0 0 0 1px rgba(21, 26, 34, 0.14) inset !important;
}

:global(.order-message-prompt .el-input__inner) {
  color: #111827 !important;
}

:global(.order-message-prompt .el-message-box__errormsg) {
  color: #9c4f1e !important;
}
</style>
