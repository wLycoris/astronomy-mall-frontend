<template>
  <div class="cart-page">
    <div class="container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>购物车</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="cart-container" v-if="cartList.length > 0">
        <!-- 购物车表头 -->
        <div class="cart-header">
          <el-checkbox
            v-model="isAllSelected"
            @change="handleSelectAll"
            :indeterminate="isIndeterminate"
          >
            全选
          </el-checkbox>
          <span class="item-info">商品信息</span>
          <span class="price">单价</span>
          <span class="quantity">数量</span>
          <span class="subtotal">小计</span>
          <span class="actions">操作</span>
        </div>

        <!-- 购物车列表 -->
        <div class="cart-list">
          <div
            v-for="item in cartList"
            :key="item.id"
            class="cart-item"
          >
            <el-checkbox
              :model-value="item.selected === 1"
              @change="handleItemSelect(item)"
            />
            
            <div class="product-info">
              <el-image
                :src="item.productImage"
                fit="cover"
                class="product-image"
              />
              <div class="product-details">
                <div class="product-name">{{ item.productName }}</div>
                <div class="product-brand">{{ item.productBrand }}</div>
              </div>
            </div>

            <div class="price">
              ¥{{ item.productPrice.toFixed(2) }}
            </div>

            <div class="quantity">
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :max="item.stock"
                @change="handleQuantityChange(item)"
              />
            </div>

            <div class="subtotal">
              ¥{{ item.subtotal.toFixed(2) }}
            </div>

            <div class="actions">
              <el-button
                type="danger"
                text
                @click="handleRemove(item.id)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 购物车底部 -->
        <div class="cart-footer">
          <div class="left-actions">
            <el-checkbox
              v-model="isAllSelected"
              @change="handleSelectAll"
            >
              全选
            </el-checkbox>
            <el-button
              text
              @click="handleBatchRemove"
              :disabled="selectedCount === 0"
            >
              删除选中商品
            </el-button>
            <el-button
              text
              @click="handleClearCart"
            >
              清空购物车
            </el-button>
          </div>

          <div class="right-summary">
            <div class="summary-item">
              已选商品 <span class="highlight">{{ selectedCount }}</span> 件
            </div>
            <div class="summary-item">
              总价: <span class="total-price">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <el-button
              type="primary"
              size="large"
              @click="handleCheckout"
              :disabled="selectedCount === 0"
            >
              去结算
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空购物车 -->
      <div class="empty-cart" v-else>
        <el-empty description="购物车空空如也">
          <el-button type="primary" @click="$router.push('/products')">
            去购物
          </el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCartList,
  updateQuantity,
  toggleSelected,
  selectAll,
  removeCartItem,
  batchRemove,
  clearCart
} from '@/api/cart'

const router = useRouter()

const cartList = ref([])

// 是否全选
const isAllSelected = computed(() => {
  if (cartList.value.length === 0) return false
  return cartList.value.every(item => item.selected === 1)
})

// 是否半选
const isIndeterminate = computed(() => {
  const selectedItems = cartList.value.filter(item => item.selected === 1)
  return selectedItems.length > 0 && selectedItems.length < cartList.value.length
})

// 选中商品数量
const selectedCount = computed(() => {
  return cartList.value.filter(item => item.selected === 1).length
})

// 总金额
const totalAmount = computed(() => {
  return cartList.value
    .filter(item => item.selected === 1)
    .reduce((sum, item) => sum + item.subtotal, 0)
})

// 加载购物车列表
const loadCartList = async () => {
  try {
    const res = await getCartList()
    cartList.value = res.data
  } catch (error) {
    ElMessage.error(error.message || '加载购物车失败')
  }
}

// 全选/取消全选
const handleSelectAll = async (value) => {
  try {
    await selectAll(value ? 1 : 0)
    cartList.value.forEach(item => {
      item.selected = value ? 1 : 0
    })
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 切换单个商品选中状态
const handleItemSelect = async (item) => {
  try {
    const newSelected = item.selected === 1 ? 0 : 1
    await toggleSelected(item.id, newSelected)
    item.selected = newSelected
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 修改数量
const handleQuantityChange = async (item) => {
  try {
    await updateQuantity(item.id, item.quantity)
    item.subtotal = item.productPrice * item.quantity
    ElMessage.success('数量已更新')
  } catch (error) {
    ElMessage.error(error.message || '更新失败')
    loadCartList()
  }
}

// 删除单个商品
const handleRemove = async (cartId) => {
  try {
    await ElMessageBox.confirm('确认删除该商品吗?', '提示', {
      type: 'warning'
    })
    await removeCartItem(cartId)
    ElMessage.success('删除成功')
    loadCartList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 批量删除
const handleBatchRemove = async () => {
  try {
    await ElMessageBox.confirm('确认删除选中的商品吗?', '提示', {
      type: 'warning'
    })
    const selectedIds = cartList.value
      .filter(item => item.selected === 1)
      .map(item => item.id)
    await batchRemove(selectedIds)
    ElMessage.success('删除成功')
    loadCartList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 清空购物车
const handleClearCart = async () => {
  try {
    await ElMessageBox.confirm('确认清空购物车吗?', '提示', {
      type: 'warning'
    })
    await clearCart()
    ElMessage.success('购物车已清空')
    loadCartList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

// 去结算
const handleCheckout = () => {
  router.push('/order/checkout')
}

onMounted(() => {
  loadCartList()
})
</script>

<style scoped lang="scss">
.cart-page {
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

.cart-container {
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.cart-header {
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 20px;
  background: #f5f5f5;
  font-weight: 500;

  .item-info {
    flex: 1;
    margin-left: 20px;
  }

  .price,
  .quantity,
  .subtotal {
    width: 120px;
    text-align: center;
  }

  .actions {
    width: 100px;
    text-align: center;
  }
}

.cart-list {
  border-top: 1px solid #e8e8e8;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.3s;

  &:hover {
    background: #fafafa;
  }

  .product-info {
    display: flex;
    flex: 1;
    margin-left: 20px;
  }

  .product-image {
    width: 100px;
    height: 100px;
    border-radius: 4px;
  }

  .product-details {
    margin-left: 16px;
  }

  .product-name {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .product-brand {
    font-size: 14px;
    color: #999;
  }

  .price,
  .quantity,
  .subtotal {
    width: 120px;
    text-align: center;
  }

  .price {
    font-size: 16px;
    color: #ff6b00;
  }

  .subtotal {
    font-size: 18px;
    font-weight: 600;
    color: #ff6b00;
  }

  .actions {
    width: 100px;
    text-align: center;
  }
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;

  .left-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .right-summary {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .summary-item {
    font-size: 14px;

    .highlight {
      color: #ff6b00;
      font-weight: 600;
    }
  }

  .total-price {
    font-size: 24px;
    font-weight: 600;
    color: #ff6b00;
  }
}

.empty-cart {
  background: white;
  padding: 100px 0;
  border-radius: 4px;
  text-align: center;
}
</style>