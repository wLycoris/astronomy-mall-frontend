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
    await ElMessageBox.confirm('确定要删除这条评价吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
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
      inputErrorMessage: '请输入取消原因'
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
      type: 'info'
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
      type: 'warning'
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
</style>