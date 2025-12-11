<template>
  <div class="order-list-page">
    <div class="container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>我的订单</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="order-container">
        <!-- 订单状态筛选 - ✅ 修复: 使用 -1 代替 null -->
        <el-tabs v-model="activeStatus" @tab-change="handleStatusChange">
          <el-tab-pane label="全部订单" :name="-1" />
          <el-tab-pane label="待支付" :name="0" />
          <el-tab-pane label="待发货" :name="1" />
          <el-tab-pane label="待收货" :name="2" />
          <el-tab-pane label="已完成" :name="3" />
          <el-tab-pane label="已取消" :name="4" />
        </el-tabs>

        <!-- 订单列表 -->
        <div v-if="orderList.length > 0" class="order-list">
          <div
              v-for="order in orderList"
              :key="order.id"
              class="order-item"
          >
            <!-- 订单头部 -->
            <div class="order-header">
              <div class="order-info">
                <span>订单号: {{ order.orderNo }}</span>
                <span class="order-time">{{ order.createTime }}</span>
              </div>
              <div class="order-status">
                <el-tag :type="getStatusType(order.status)">
                  {{ order.statusText }}
                </el-tag>
              </div>
            </div>

            <!-- 订单商品列表 -->
            <div class="order-products">
              <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="product-item"
              >
                <el-image
                    :src="item.productImage"
                    fit="cover"
                    class="product-image"
                />
                <div class="product-details">
                  <div class="product-name">{{ item.productName }}</div>
                  <div class="product-brand">{{ item.productBrand }}</div>
                </div>
                <div class="product-price">
                  ¥{{ item.productPrice.toFixed(2) }}
                </div>
                <div class="product-quantity">
                  x{{ item.quantity }}
                </div>
              </div>
            </div>

            <!-- 订单底部 -->
            <div class="order-footer">
              <div class="order-amount">
                实付款: <span class="amount">¥{{ order.paymentAmount.toFixed(2) }}</span>
              </div>
              <div class="order-actions">
                <!-- 取消订单按钮 (待支付状态) -->
                <el-button
                    v-if="order.status === 0"
                    type="primary"
                    size="small"
                    @click="handleCancelOrder(order)"
                >
                  取消订单
                </el-button>

                <!-- 确认收货按钮 (待收货状态) -->
                <el-button
                    v-if="order.status === 2"
                    type="primary"
                    size="small"
                    @click="handleConfirmReceipt(order)"
                >
                  确认收货
                </el-button>

                <!-- ✅ 评价商品按钮 (已完成状态 status=3) -->
                <el-button
                    v-if="order.status === 3"
                    type="warning"
                    size="small"
                    @click="goToReview(order)"
                >
                  评价商品
                </el-button>

                <!-- ✅ 新增: 查看评价按钮 (已评价的订单) -->
                <el-button
                    v-if="order.hasReviewed"
                    size="small"
                    @click="goToMyReviews"
                >
                  查看评价
                </el-button>

                <!-- 删除订单按钮 (已完成或已取消状态) -->
                <el-button
                    v-if="order.status === 3 || order.status === 4"
                    size="small"
                    @click="handleDeleteOrder(order)"
                >
                  删除订单
                </el-button>

                <!-- 查看详情按钮 (所有状态都显示) -->
                <el-button
                    size="small"
                    @click="handleViewDetail(order.id)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-else description="暂无订单" />

        <!-- 分页 -->
        <el-pagination
            v-if="total > 0"
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="loadOrderList"
            class="pagination"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOrderList,
  cancelOrder,
  confirmReceipt,
  deleteOrder
} from '@/api/order'

const router = useRouter()

// ✅ 修复: 使用 -1 代替 null
const activeStatus = ref(-1)
const orderList = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ============================================
// 订单操作方法
// ============================================

/**
 * ✅ 修复: 去评价页面 - 添加调试日志
 */
// ✅ 新版本 (只传订单ID,让用户在评价页面选择)
const goToReview = (order) => {
  console.log('=== 去评价页面 ===')
  console.log('订单ID:', order.id)
  console.log('订单号:', order.orderNo)
  console.log('订单状态:', order.status)

  if (!order.items || order.items.length === 0) {
    ElMessage.error('订单商品信息异常')
    return
  }

  const item = order.items[0]
  console.log('选择的商品ID:', item.productId)
  console.log('商品名称:', item.productName)

  router.push({
    path: '/review/publish',
    query: {
      orderId: order.id
      // ✅ 不传 productId,让用户自己选择
    }
  })
}

/**
 * ✅ 新增: 跳转到我的评价页面
 */
const goToMyReviews = () => {
  router.push('/review/my')
}

/**
 * ✅ 修复: 加载订单列表 - 处理全部订单的情况
 */
const loadOrderList = async () => {
  try {
    // ✅ 如果是全部订单(-1),不传status参数
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }

    // 只有非全部订单才传status
    if (activeStatus.value !== -1) {
      params.status = activeStatus.value
    }

    console.log('=== 加载订单列表 ===')
    console.log('查询参数:', params)

    const res = await getOrderList(params)
    orderList.value = res.data.records
    total.value = res.data.total

    console.log('订单列表:', orderList.value)
    console.log('订单总数:', total.value)

  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error(error.message || '加载订单失败')
  }
}

/**
 * 切换订单状态筛选
 */
const handleStatusChange = () => {
  console.log('=== 切换状态 ===')
  console.log('当前状态:', activeStatus.value)
  pageNum.value = 1
  loadOrderList()
}

/**
 * 取消订单
 */
const handleCancelOrder = async (order) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      inputPattern: /.+/,
      inputErrorMessage: '请输入取消原因'
    })

    await cancelOrder(order.id, value)
    ElMessage.success('订单已取消')
    loadOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '取消订单失败')
    }
  }
}

/**
 * 确认收货
 */
const handleConfirmReceipt = async (order) => {
  try {
    await ElMessageBox.confirm('确认已收到商品吗?', '确认收货', {
      type: 'info'
    })

    await confirmReceipt(order.id)
    ElMessage.success('确认收货成功')
    loadOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '确认收货失败')
    }
  }
}

/**
 * 删除订单
 */
const handleDeleteOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确认删除该订单吗?', '删除订单', {
      type: 'warning'
    })

    await deleteOrder(order.id)
    ElMessage.success('订单已删除')
    loadOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除订单失败')
    }
  }
}

/**
 * 查看订单详情
 */
const handleViewDetail = (orderId) => {
  router.push(`/order/detail/${orderId}`)
}

/**
 * 获取订单状态对应的标签类型
 */
const getStatusType = (status) => {
  const types = {
    0: 'warning',  // 待支付 - 黄色
    1: 'primary',  // 待发货 - 蓝色
    2: 'primary',  // 待收货 - 蓝色
    3: 'success',  // 已完成 - 绿色
    4: 'info'      // 已取消 - 灰色
  }
  return types[status] || 'info'
}

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  loadOrderList()
})
</script>

<style scoped lang="scss">
.order-list-page {
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

.order-container {
  background: white;
  border-radius: 4px;
  padding: 20px;
}

.order-list {
  margin-top: 20px;
}

.order-item {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f5f5f5;
}

.order-info {
  display: flex;
  gap: 20px;
  font-size: 14px;

  .order-time {
    color: #999;
  }
}

.order-products {
  border-top: 1px solid #e8e8e8;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.product-details {
  flex: 1;
  margin-left: 16px;
}

.product-name {
  font-size: 16px;
  margin-bottom: 6px;
}

.product-brand {
  font-size: 14px;
  color: #999;
}

.product-price,
.product-quantity {
  width: 120px;
  text-align: center;
}

.product-price {
  color: #ff6b00;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;
}

.order-amount {
  font-size: 16px;

  .amount {
    font-size: 20px;
    font-weight: 600;
    color: #ff6b00;
    margin-left: 8px;
  }
}

.order-actions {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>