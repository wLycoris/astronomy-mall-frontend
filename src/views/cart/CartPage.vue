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

      <!-- 🆕 8.2 为你推荐区块：基于购物车内容进行个性化推荐 -->
      <div v-if="cartRecommendProducts.length > 0" class="cart-recommend-section">
        <div class="section-header">
          <h3>为你推荐</h3>
          <span class="algo-tip">根据购物车商品推荐</span>
        </div>
        <div class="recommend-grid">
          <div
            v-for="item in cartRecommendProducts"
            :key="'rec-' + item.id"
            class="recommend-card"
            @click="handleRecommendClick(item)"
          >
            <div class="card-image">
              <img :src="item.mainImage" :alt="item.productName" />
            </div>
            <div class="card-info">
              <h4>{{ item.productName }}</h4>
              <!-- 推荐理由标签 -->
              <span v-if="item.recommendReason" class="reason-tag">{{ item.recommendReason }}</span>
              <div class="card-price">
                <span class="price">¥{{ item.price }}</span>
                <span
                  v-if="item.originalPrice && item.originalPrice > item.price"
                  class="original"
                >¥{{ item.originalPrice }}</span>
              </div>
              <span class="card-sales">已售{{ item.sales || 0 }}</span>
            </div>
          </div>
        </div>
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
// 🆕 8.2 推荐 API：购物车推荐、点击上报
import { getCartRecommend, recordRecommendClick } from '@/api/recommend'

const router = useRouter()

const cartList = ref([])
// 🆕 8.2 购物车推荐商品列表
const cartRecommendProducts = ref([])

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

// 🆕 8.2 加载购物车推荐商品（基于购物车内容，TTL=10min 短缓存）
const loadCartRecommend = async () => {
  try {
    const res = await getCartRecommend({ limit: 10 })
    cartRecommendProducts.value = res.data || []
  } catch (error) {
    // 推荐加载失败不影响购物车主流程，静默降级
    console.warn('加载购物车推荐失败:', error)
    cartRecommendProducts.value = []
  }
}

// 🆕 8.2 点击推荐商品卡片：先上报点击再跳转
const handleRecommendClick = (item) => {
  // fire-and-forget 上报推荐点击（不阻塞跳转）
  // 注意：字段必须与后端 RecommendClickDTO 一致：recommendType + targetId
  try {
    recordRecommendClick({
      recommendType: 'product',
      targetId: item.id
    })
  } catch (e) {
    // 上报失败不影响跳转
  }
  router.push(`/product/${item.id}`)
}

onMounted(() => {
  loadCartList()
  // 🆕 8.2 加载购物车推荐
  loadCartRecommend()
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

/* ==================== 🆕 8.2 购物车推荐区 ==================== */
.cart-recommend-section {
  background: white;
  border-radius: 4px;
  padding: 24px;
  margin-top: 20px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      margin: 0;
      font-weight: 600;
    }

    .algo-tip {
      font-size: 12px;
      color: #909399;
      background: #f0f2f5;
      padding: 2px 10px;
      border-radius: 10px;
    }
  }

  /* 5列网格布局 */
  .recommend-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  .recommend-card {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #409EFF;
    }

    .card-image {
      width: 100%;
      height: 180px;
      overflow: hidden;
      background: #f5f7fa;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }

      &:hover img {
        transform: scale(1.05);
      }
    }

    .card-info {
      padding: 10px 12px;

      h4 {
        font-size: 13px;
        margin: 0 0 6px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #303133;
      }

      .reason-tag {
        display: inline-block;
        font-size: 11px;
        color: #e6a23c;
        background: #fdf6ec;
        padding: 1px 8px;
        border-radius: 3px;
        margin-bottom: 6px;
      }

      .card-price {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-bottom: 4px;

        .price {
          font-size: 16px;
          color: #f56c6c;
          font-weight: bold;
        }

        .original {
          font-size: 12px;
          color: #c0c4cc;
          text-decoration: line-through;
        }
      }

      .card-sales {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

/* 响应式：小屏幕网格列数调整 */
@media (max-width: 1200px) {
  .cart-recommend-section .recommend-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .cart-recommend-section .recommend-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .cart-recommend-section .recommend-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>