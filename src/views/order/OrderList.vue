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
      inputErrorMessage: '请输入取消原因',
      ...orderPromptOptions
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
      confirmButtonText: '确认收货',
      cancelButtonText: '返回',
      ...orderMessageOptions('info')
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
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      ...orderMessageOptions('warning')
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

/* Trade flow polish */
.order-list-page {
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

.order-container {
  padding: 24px 20px 28px;
  border: 1px solid rgba(23,32,51,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.94);
  box-shadow: 0 18px 45px rgba(23,32,51,.08);
}

:deep(.el-tabs__nav-wrap::after) {
  background: rgba(23,32,51,.08);
}

:deep(.el-tabs__item) {
  color: #657084;
  font-weight: 600;
}

:deep(.el-tabs__item.is-active) {
  color: #172033;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: #172033;
}

.order-list {
  margin-top: 24px;
}

.order-item {
  border-color: rgba(23,32,51,.08);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(23,32,51,.06);
  transition: transform .2s ease, box-shadow .2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(23,32,51,.10);
  }
}

.order-header {
  padding: 14px 20px;
  background: linear-gradient(180deg, #ffffff, #f7f9fc);
  border-bottom: 1px solid rgba(23,32,51,.08);
}

.order-info {
  color: #172033;
  font-weight: 650;

  .order-time {
    color: #8a92a3;
    font-weight: 500;
  }
}

.order-products {
  border-top: none;
}

.product-item {
  padding: 18px 20px;
  border-bottom-color: rgba(23,32,51,.06);
}

.product-image {
  width: 86px;
  height: 86px;
  border-radius: 8px;
  border: 1px solid rgba(23,32,51,.08);
  background: #eef2f7;
  overflow: hidden;
}

.product-name {
  color: #172033;
  font-weight: 650;
}

.product-brand {
  color: #8a92a3;
}

.product-price {
  color: #d85c25;
  font-weight: 650;
}

.product-quantity {
  color: #5a6272;
}

.order-footer {
  padding: 17px 20px;
  border-top-color: rgba(23,32,51,.08);
  background: #fbfcff;
}

.order-amount {
  color: #5a6272;

  .amount {
    color: #d85c25;
    font-size: 24px;
    letter-spacing: .5px;
  }
}

.order-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
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

.pagination {
  margin-top: 26px;
}

@media (max-width: 760px) {
  .container {
    width: calc(100% - 28px);
  }

  .order-info,
  .order-footer,
  .product-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-price,
  .product-quantity {
    width: auto;
    text-align: left;
  }
}
/* Final direction: restrained premium order list */
.order-list-page {
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

.order-container {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
}

:deep(.el-tabs__header) {
  margin: 0 0 18px;
}

:deep(.el-tabs__nav-wrap::after) {
  background: rgba(23, 32, 51, 0.08);
}

:deep(.el-tabs__item) {
  color: #6b7280;
  font-weight: 650;
}

:deep(.el-tabs__item.is-active) {
  color: #172033;
}

:deep(.el-tabs__active-bar) {
  background: #172033;
}

.order-list {
  display: grid;
  gap: 14px;
}

.order-item {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
  overflow: hidden;
}

.order-header {
  padding: 14px 18px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: #fbfcfd;
}

.order-info {
  gap: 18px;
  color: #172033;
  font-weight: 680;
}

.order-time {
  color: #7a8494;
  font-weight: 500;
}

:deep(.el-tag) {
  border-radius: 999px;
  font-weight: 700;
}

.order-products {
  background: #ffffff;
}

.product-item {
  min-height: 112px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
}

.product-item:last-child {
  border-bottom: 0;
}

.product-image {
  width: 82px;
  height: 82px;
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

.product-price,
.product-quantity {
  color: #4b5563;
  font-weight: 650;
}

.order-footer {
  padding: 14px 18px;
  border-top: 1px solid rgba(23, 32, 51, 0.08);
  background: #fbfcfd;
}

.order-amount {
  color: #6b7280;
}

.order-amount .amount {
  color: #b35d25;
  font-size: 22px;
  font-weight: 800;
}

.order-actions {
  gap: 8px;
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

.pagination {
  justify-content: center;
  margin-top: 24px;
}

:deep(.el-pagination .el-pager li.is-active) {
  color: #172033;
}

:deep(.el-empty) {
  padding: 84px 0;
}

@media (max-width: 760px) {
  .order-list-page {
    padding: 18px 0 44px;
  }

  .container {
    width: calc(100% - 28px);
  }

  .order-info,
  .order-footer,
  .product-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

/* Order list final pass: page-local order archive. */
:global(body .order-list-page.order-list-page.order-list-page) {
  min-height: 100vh !important;
  padding: 28px 0 72px !important;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88) 0%, rgba(246, 243, 236, 0.96) 260px),
    #f6f3ec !important;
  color: #1f2933 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .container) {
  width: min(1160px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-container) {
  padding: 22px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: rgba(255, 253, 250, 0.98) !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .order-list-page.order-list-page.order-list-page .el-tabs__header) {
  margin: 0 0 20px !important;
}

:global(body .order-list-page.order-list-page.order-list-page .el-tabs__item) {
  color: #667085 !important;
  font-weight: 650 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .el-tabs__item.is-active) {
  color: #111827 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .el-tabs__active-bar) {
  background: #9c6b35 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-list) {
  display: grid !important;
  gap: 16px !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-item) {
  overflow: hidden !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
  box-shadow: none !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-header) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  min-height: 52px !important;
  padding: 0 18px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-info) {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 14px !important;
  color: #111827 !important;
  font-weight: 720 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-time) {
  color: #667085 !important;
  font-weight: 500 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-products) {
  display: grid !important;
  gap: 0 !important;
  padding: 4px 18px !important;
  background: #fffdfa !important;
}

:global(body .order-list-page.order-list-page.order-list-page .product-item) {
  display: grid !important;
  grid-template-columns: 82px minmax(0, 1fr) 120px 56px !important;
  gap: 16px !important;
  align-items: center !important;
  min-height: 108px !important;
  padding: 14px 0 !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

:global(body .order-list-page.order-list-page.order-list-page .product-item:last-child) {
  border-bottom: 0 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .product-image) {
  width: 82px !important;
  height: 82px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 5px !important;
  background: #eef0f3 !important;
  overflow: hidden !important;
}

:global(body .order-list-page.order-list-page.order-list-page .product-name) {
  color: #111827 !important;
  font-size: 15px !important;
  font-weight: 720 !important;
  line-height: 1.5 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .product-brand) {
  color: #667085 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .product-price),
:global(body .order-list-page.order-list-page.order-list-page .product-quantity) {
  color: #374151 !important;
  font-weight: 650 !important;
  text-align: right !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-footer) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  min-height: 62px !important;
  padding: 0 18px !important;
  border-top: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-amount) {
  color: #374151 !important;
  font-weight: 650 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-amount .amount) {
  color: #a6531f !important;
  font-size: 22px !important;
  font-weight: 850 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-actions) {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: flex-end !important;
  gap: 8px !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-actions .el-button) {
  min-height: 34px !important;
  border-radius: 4px !important;
  font-weight: 650 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-actions .el-button--primary) {
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

:global(body .order-list-page.order-list-page.order-list-page .order-actions .el-button--warning) {
  border-color: #f0c878 !important;
  background: #f0c878 !important;
  color: #111827 !important;
}

:global(body .order-list-page.order-list-page.order-list-page .pagination) {
  margin-top: 24px !important;
  justify-content: center !important;
}

@media (max-width: 760px) {
  :global(body .order-list-page.order-list-page.order-list-page .container) {
    width: calc(100vw - 28px) !important;
  }

  :global(body .order-list-page.order-list-page.order-list-page .order-header),
  :global(body .order-list-page.order-list-page.order-list-page .order-footer) {
    align-items: flex-start !important;
    flex-direction: column !important;
    padding: 14px 18px !important;
  }

  :global(body .order-list-page.order-list-page.order-list-page .product-item) {
    grid-template-columns: 76px minmax(0, 1fr) !important;
  }

  :global(body .order-list-page.order-list-page.order-list-page .product-price),
  :global(body .order-list-page.order-list-page.order-list-page .product-quantity) {
    grid-column: 2 !important;
    text-align: left !important;
  }

  :global(body .order-list-page.order-list-page.order-list-page .order-actions) {
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
