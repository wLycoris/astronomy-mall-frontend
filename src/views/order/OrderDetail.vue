<template>
  <div class="order-detail-page">
    <div class="container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/order/list' }">我的订单</el-breadcrumb-item>
        <el-breadcrumb-item>订单详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-if="orderDetail" class="detail-container">
        <!-- 订单状态 -->
        <div class="status-section">
          <el-tag :type="getStatusType(orderDetail.status)" size="large">
            {{ orderDetail.statusText }}
          </el-tag>
          <div v-if="orderDetail.status === 0" class="status-tip">
            请尽快完成支付
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="section">
          <h3 class="section-title">订单信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderDetail.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ orderDetail.createTime }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">
              {{ orderDetail.paymentTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="发货时间">
              {{ orderDetail.deliveryTime || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 收货信息 -->
        <div class="section">
          <h3 class="section-title">收货信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="收货人">{{ orderDetail.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ orderDetail.receiverPhone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">
              {{ orderDetail.fullAddress }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 商品清单 -->
        <div class="section">
          <h3 class="section-title">商品清单</h3>
          <el-table :data="orderDetail.items" border>
            <el-table-column label="商品信息">
              <template #default="{ row }">
                <div class="product-info">
                  <el-image
                    :src="row.productImage"
                    fit="cover"
                    class="product-image"
                  />
                  <div class="product-details">
                    <div class="product-name">{{ row.productName }}</div>
                    <div class="product-brand">{{ row.productBrand }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单价" align="center" width="150">
              <template #default="{ row }">
                ¥{{ row.productPrice.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="数量" prop="quantity" align="center" width="100" />
            <el-table-column label="小计" align="center" width="150">
              <template #default="{ row }">
                <span class="subtotal">¥{{ row.totalPrice.toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 费用明细 -->
        <div class="section">
          <h3 class="section-title">费用明细</h3>
          <div class="summary-item">
            <span>商品总金额:</span>
            <span class="amount">¥{{ orderDetail.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>运费:</span>
            <span class="amount">¥{{ orderDetail.freight.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>优惠金额:</span>
            <span class="amount discount">-¥{{ orderDetail.discountAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-item total">
            <span>实付金额:</span>
            <span class="amount">¥{{ orderDetail.paymentAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail } from '@/api/order'

const route = useRoute()

const orderDetail = ref(null)

// 加载订单详情
const loadOrderDetail = async () => {
  try {
    const orderId = route.params.id
    const res = await getOrderDetail(orderId)
    orderDetail.value = res.data
  } catch (error) {
    ElMessage.error(error.message || '加载订单详情失败')
  }
}

// 获取状态类型
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

.detail-container {
  background: white;
  border-radius: 4px;
  padding: 20px;
}

.status-section {
  text-align: center;
  padding: 40px 0;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 30px;

  .el-tag {
    font-size: 24px;
    padding: 16px 32px;
  }

  .status-tip {
    margin-top: 16px;
    color: #999;
    font-size: 14px;
  }
}

.section {
  margin-bottom: 30px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e8e8;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.product-details {
  margin-left: 16px;
  text-align: left;
}

.product-name {
  font-size: 16px;
  margin-bottom: 6px;
}

.product-brand {
  font-size: 14px;
  color: #999;
}

.subtotal {
  color: #ff6b00;
  font-weight: 600;
}

.summary-item {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  font-size: 16px;

  &.total {
    font-size: 20px;
    font-weight: 600;
    border-top: 1px solid #e8e8e8;
    margin-top: 12px;
    padding-top: 16px;
  }

  .amount {
    margin-left: 20px;
    color: #ff6b00;
    min-width: 120px;
    text-align: right;

    &.discount {
      color: #67c23a;
    }
  }
}
</style>