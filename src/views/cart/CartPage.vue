<template>
  <div class="cart-page">
    <div class="container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>购物车</el-breadcrumb-item>
      </el-breadcrumb>

      <section class="cart-hero">
        <div class="hero-copy">
          <span class="hero-kicker">EQUIPMENT CART</span>
          <h1>购物车</h1>
          <p>确认准备购买的天文器材，调整数量后进入结算。</p>
        </div>
        <div class="hero-panel">
          <div class="panel-item">
            <span>已选商品</span>
            <strong>{{ selectedCount }}</strong>
          </div>
          <div class="panel-line"></div>
          <div class="panel-item panel-item--total">
            <span>合计</span>
            <strong>¥{{ totalAmount.toFixed(2) }}</strong>
          </div>
        </div>
      </section>

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
            :class="{ 'cart-item--selected': item.selected === 1 }"
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
                <div class="product-meta">
                  <span>ASTRO GEAR</span>
                  <span>库存 {{ item.stock }}</span>
                </div>
              </div>
            </div>

            <div class="price metric-cell">
              <span class="metric-label">单价</span>
              <span class="metric-value">¥{{ item.productPrice.toFixed(2) }}</span>
            </div>

            <div class="quantity metric-cell">
              <span class="metric-label">数量</span>
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :max="item.stock"
                @change="handleQuantityChange(item)"
              />
            </div>

            <div class="subtotal metric-cell">
              <span class="metric-label">小计</span>
              <span class="metric-value">¥{{ item.subtotal.toFixed(2) }}</span>
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

/* Observatory cart redesign */
.cart-page {
  position: relative;
  min-height: 100vh;
  padding: 26px 0 84px;
  overflow: hidden;
  background:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    radial-gradient(circle, rgba(255, 255, 255, 0.34) 1px, transparent 1.4px),
    linear-gradient(180deg, #07101f 0%, #101827 44%, #edf1f6 44.1%, #edf1f6 100%);
  background-size: 72px 72px, 72px 72px, 132px 132px, auto;
  color: #172033;
}

.cart-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(118deg, transparent 0 24%, rgba(122, 160, 213, 0.14) 24.1% 24.35%, transparent 24.45%),
    linear-gradient(146deg, transparent 0 66%, rgba(240, 180, 95, 0.16) 66.1% 66.34%, transparent 66.45%);
}

.container {
  position: relative;
  z-index: 1;
  width: min(1220px, calc(100% - 56px));
}

.el-breadcrumb {
  margin-bottom: 22px;
  font-size: 13px;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: rgba(238, 243, 250, 0.72) !important;
  font-weight: 500 !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #ffffff !important;
}

.cart-hero {
  min-height: 212px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 410px;
  gap: 28px;
  align-items: end;
  margin-bottom: 28px;
  color: #ffffff;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  color: #f0b45f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.hero-kicker::before {
  content: "";
  width: 28px;
  height: 1px;
  background: #f0b45f;
}

.hero-copy h1 {
  margin: 0;
  color: #f8fbff;
  font-size: 42px;
  font-weight: 760;
  line-height: 1.16;
  letter-spacing: 0;
}

.hero-copy p {
  max-width: 560px;
  margin: 16px 0 0;
  color: rgba(226, 234, 245, 0.76);
  font-size: 15px;
  line-height: 1.8;
}

.hero-panel {
  display: grid;
  grid-template-columns: 1fr 1px 1.35fr;
  align-items: stretch;
  padding: 20px;
  border: 1px solid rgba(240, 180, 95, 0.32);
  border-radius: 8px;
  background: rgba(9, 17, 31, 0.72);
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
}

.panel-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-item span {
  color: rgba(226, 234, 245, 0.68);
  font-size: 13px;
}

.panel-item strong {
  color: #ffffff;
  font-size: 30px;
  font-weight: 760;
  line-height: 1;
}

.panel-item--total {
  padding-left: 20px;
}

.panel-item--total strong {
  color: #f0b45f;
  font-size: 28px;
}

.panel-line {
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(240, 180, 95, 0.42), transparent);
}

.cart-container {
  border: 1px solid rgba(11, 18, 32, 0.14);
  border-radius: 8px;
  background: #f8fafc;
  box-shadow: 0 26px 60px rgba(11, 18, 32, 0.18);
  overflow: hidden;
}

.cart-header {
  display: grid;
  grid-template-columns: 68px minmax(330px, 1fr) 130px 150px 150px 92px;
  align-items: center;
  height: 58px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(240, 180, 95, 0.18);
  background: #101827;
  color: rgba(238, 243, 250, 0.68);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.cart-header .item-info,
.cart-header .price,
.cart-header .quantity,
.cart-header .subtotal,
.cart-header .actions {
  width: auto;
  margin-left: 0;
}

.cart-header .price,
.cart-header .quantity,
.cart-header .subtotal,
.cart-header .actions {
  text-align: right;
}

.cart-header :deep(.el-checkbox__label) {
  color: rgba(238, 243, 250, 0.72);
}

.cart-list {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-top: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(243, 247, 251, 0.96)),
    #f8fafc;
}

.cart-item {
  display: grid;
  grid-template-columns: 44px minmax(330px, 1fr) 130px 150px 150px 92px;
  align-items: center;
  gap: 0;
  min-height: 152px;
  padding: 16px 18px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(23, 32, 51, 0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.cart-item:hover {
  transform: translateY(-2px);
  border-color: rgba(240, 180, 95, 0.44);
  background: #ffffff;
  box-shadow: 0 18px 38px rgba(23, 32, 51, 0.12);
}

.cart-item--selected {
  border-color: rgba(240, 180, 95, 0.6);
  box-shadow: 0 18px 42px rgba(23, 32, 51, 0.12);
}

.cart-item--selected::before {
  content: "";
  align-self: stretch;
  grid-column: 1;
  grid-row: 1;
  width: 3px;
  margin-left: -18px;
  border-radius: 8px 0 0 8px;
  background: #f0b45f;
}

.cart-item > :deep(.el-checkbox) {
  grid-column: 1;
  grid-row: 1;
  justify-self: center;
}

.cart-item .product-info {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  margin-left: 0;
  min-width: 0;
}

.cart-item .product-image {
  width: 128px;
  height: 128px;
  border: 1px solid rgba(16, 24, 39, 0.12);
  border-radius: 8px;
  background: #dfe6ef;
  box-shadow: 0 16px 26px rgba(16, 24, 39, 0.12);
  overflow: hidden;
}

.cart-item :deep(.product-image .el-image__inner) {
  transition: transform 0.28s ease, filter 0.28s ease;
}

.cart-item:hover :deep(.product-image .el-image__inner) {
  transform: scale(1.045);
  filter: saturate(1.08) contrast(1.04);
}

.cart-item .product-details {
  min-width: 0;
  margin-left: 0;
}

.cart-item .product-name {
  max-width: 500px;
  margin-bottom: 10px;
  color: #111827;
  font-size: 17px;
  font-weight: 760;
  line-height: 1.45;
}

.cart-item .product-brand {
  color: #697386;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.product-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border: 1px solid rgba(16, 24, 39, 0.08);
  border-radius: 999px;
  background: #f4f6f9;
  color: #697386;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.metric-cell {
  width: auto;
  min-width: 0;
  text-align: right;
}

.metric-label {
  display: none;
}

.cart-item .price .metric-value {
  color: #364152;
  font-size: 15px;
  font-weight: 700;
}

.cart-item .subtotal .metric-value {
  color: #d96b2b;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
}

.cart-item .quantity {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-input-number) {
  width: 132px;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
  background: #f8fafc;
  box-shadow: 0 0 0 1px rgba(16, 24, 39, 0.12) inset;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: #eef2f7;
  color: #384255;
}

.cart-item .actions {
  width: auto;
  text-align: right;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  border-color: #f0b45f;
  background-color: #f0b45f;
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #f8fbff;
}

.cart-footer {
  position: sticky;
  bottom: 16px;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  height: auto;
  margin: 0 16px 16px;
  padding: 18px 20px;
  border: 1px solid rgba(240, 180, 95, 0.22);
  border-radius: 8px;
  background: rgba(16, 24, 39, 0.96);
  color: #eef3fa;
  box-shadow: 0 24px 44px rgba(11, 18, 32, 0.22);
  backdrop-filter: blur(12px);
}

.cart-footer .left-actions {
  gap: 14px;
  color: rgba(238, 243, 250, 0.72);
}

.cart-footer .left-actions :deep(.el-button.is-text),
.cart-footer .left-actions :deep(.el-checkbox__label) {
  color: rgba(238, 243, 250, 0.72);
}

.cart-footer .left-actions :deep(.el-button.is-text:hover) {
  color: #f0b45f;
  background: rgba(240, 180, 95, 0.1);
}

.cart-footer .right-summary {
  gap: 22px;
}

.cart-footer .summary-item {
  color: rgba(238, 243, 250, 0.72);
  font-size: 13px;
}

.cart-footer .summary-item .highlight {
  color: #f0b45f;
  font-size: 18px;
  font-weight: 800;
}

.cart-footer .total-price {
  color: #f0b45f;
  font-size: 30px;
  font-weight: 820;
  letter-spacing: 0;
}

.cart-footer :deep(.el-button--primary) {
  --el-button-bg-color: #f0b45f;
  --el-button-border-color: #f0b45f;
  --el-button-hover-bg-color: #ffd08a;
  --el-button-hover-border-color: #ffd08a;
  --el-button-active-bg-color: #d99c44;
  --el-button-active-border-color: #d99c44;
  min-width: 124px;
  height: 44px;
  color: #101827;
  font-weight: 800;
}

.empty-cart {
  border: 1px solid rgba(11, 18, 32, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(244, 247, 251, 0.96)),
    #ffffff;
  box-shadow: 0 26px 60px rgba(11, 18, 32, 0.16);
}

.empty-cart :deep(.el-button--primary) {
  --el-button-bg-color: #101827;
  --el-button-border-color: #101827;
  --el-button-hover-bg-color: #263449;
  --el-button-hover-border-color: #263449;
}

.cart-recommend-section {
  margin-top: 26px;
  padding: 26px;
  border: 1px solid rgba(11, 18, 32, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 44px rgba(11, 18, 32, 0.1);
}

.cart-recommend-section .section-header {
  justify-content: space-between;
  margin-bottom: 22px;
}

.cart-recommend-section .section-header h3 {
  color: #111827;
  font-size: 24px;
  font-weight: 800;
}

.cart-recommend-section .section-header .algo-tip {
  border: 1px solid rgba(240, 180, 95, 0.24);
  border-radius: 999px;
  background: #fff7e8;
  color: #9a6824;
}

.cart-recommend-section .recommend-grid {
  grid-template-columns: repeat(auto-fit, minmax(188px, 1fr));
  gap: 18px;
}

.cart-recommend-section .recommend-card {
  border: 1px solid rgba(16, 24, 39, 0.1);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
  overflow: hidden;
}

.cart-recommend-section .recommend-card:hover {
  transform: translateY(-4px);
  border-color: rgba(240, 180, 95, 0.54);
  box-shadow: 0 18px 34px rgba(16, 24, 39, 0.13);
}

.cart-recommend-section .recommend-card .card-image {
  height: 188px;
  background: #dfe6ef;
}

.cart-recommend-section .recommend-card .card-info {
  padding: 13px 14px 15px;
}

.cart-recommend-section .recommend-card .card-info h4 {
  color: #111827;
  font-size: 14px;
  font-weight: 760;
}

.cart-recommend-section .recommend-card .reason-tag {
  border: 1px solid rgba(240, 180, 95, 0.22);
  border-radius: 999px;
  background: #fff7e8;
  color: #9a6824;
}

.cart-recommend-section .recommend-card .card-price .price {
  color: #d96b2b;
  font-size: 18px;
}

.cart-recommend-section .recommend-card .card-sales {
  color: #697386;
}

@media (max-width: 1040px) {
  .cart-hero {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .hero-panel {
    width: min(100%, 520px);
  }

  .cart-header,
  .cart-item {
    grid-template-columns: 48px minmax(260px, 1fr) 108px 136px 128px 70px;
  }

  .cart-item .product-info {
    grid-template-columns: 104px minmax(0, 1fr);
  }

  .cart-item .product-image {
    width: 104px;
    height: 104px;
  }
}

@media (max-width: 820px) {
  .cart-page {
    padding-top: 18px;
  }

  .container {
    width: calc(100% - 28px);
  }

  .cart-hero {
    min-height: 0;
    margin-bottom: 20px;
  }

  .hero-copy h1 {
    font-size: 30px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .panel-line {
    width: 100%;
    height: 1px;
  }

  .panel-item--total {
    padding-left: 0;
  }

  .cart-header {
    display: none;
  }

  .cart-list {
    padding: 12px;
  }

  .cart-item {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 14px;
    min-height: 0;
    padding: 14px;
  }

  .cart-item--selected::before {
    margin-left: -14px;
  }

  .cart-item .product-info,
  .metric-cell,
  .cart-item .actions {
    grid-column: 2;
  }

  .cart-item .product-info {
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 14px;
  }

  .cart-item .product-image {
    width: 92px;
    height: 92px;
  }

  .cart-item .product-name {
    font-size: 15px;
  }

  .metric-cell {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }

  .metric-label {
    display: inline-flex;
    color: #697386;
    font-size: 12px;
    font-weight: 700;
  }

  .cart-item .quantity {
    justify-content: space-between;
  }

  .cart-item .actions {
    text-align: left;
  }

  .cart-footer {
    position: static;
    grid-template-columns: 1fr;
    margin: 0 12px 12px;
    padding: 16px;
  }

  .cart-footer .left-actions,
  .cart-footer .right-summary {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .cart-footer .total-price {
    font-size: 25px;
  }

  .cart-recommend-section {
    padding: 18px;
  }
}

/* Celestial atelier cart art direction */
.cart-page {
  position: relative;
  min-height: 100vh;
  padding: 28px 0 88px;
  overflow: hidden;
  background:
    linear-gradient(115deg, rgba(232, 197, 127, 0.14) 0 1px, transparent 1px 55%),
    linear-gradient(150deg, rgba(119, 162, 209, 0.12) 0 1px, transparent 1px 62%),
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #080d1b 0%, #101525 42%, #e9e1d3 42.1%, #f5f1ea 100%);
  background-size: 100% 100%, 100% 100%, 100% 540px, auto;
  color: #1b2130;
}

.cart-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(255, 255, 255, 0.032) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.032) 1px, transparent 1px),
    radial-gradient(circle, rgba(255, 255, 255, 0.42) 1px, transparent 1.3px);
  background-size: 86px 86px, 86px 86px, 142px 142px;
  mask-image: linear-gradient(180deg, #000 0%, #000 42%, transparent 62%);
}

.cart-page::after {
  content: "";
  position: absolute;
  left: -8%;
  right: -8%;
  top: 36%;
  height: 170px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(8, 13, 27, 0.44), rgba(245, 241, 234, 0));
  transform: skewY(-3deg);
}

.container {
  position: relative;
  z-index: 1;
  width: min(1280px, calc(100% - 56px));
}

.el-breadcrumb {
  margin-bottom: 22px;
  font-size: 13px;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: rgba(244, 238, 228, 0.72) !important;
  font-weight: 500 !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #f7ead4 !important;
}

.cart-hero {
  min-height: 282px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px 360px;
  gap: 34px;
  align-items: center;
  margin-bottom: 34px;
  color: #f8efe0;
}

.hero-copy {
  align-self: center;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  color: #e7be72;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.hero-kicker::before,
.hero-kicker::after {
  content: "";
  width: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e7be72);
}

.hero-kicker::after {
  background: linear-gradient(90deg, #e7be72, transparent);
}

.hero-copy h1 {
  margin: 0;
  color: #fff8ec;
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
  font-size: 58px;
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: 0;
}

.hero-copy p {
  max-width: 550px;
  margin: 18px 0 0;
  color: rgba(248, 239, 224, 0.76);
  font-size: 16px;
  line-height: 1.9;
}

.hero-orbit {
  position: relative;
  width: 300px;
  height: 300px;
  justify-self: center;
  opacity: 0.94;
}

.hero-orbit::before,
.hero-orbit::after,
.orbit-ring,
.orbit-cross,
.orbit-star,
.orbit-code {
  position: absolute;
  pointer-events: none;
}

.hero-orbit::before {
  content: "";
  inset: 47%;
  border-radius: 50%;
  box-shadow:
    0 0 0 3px rgba(255, 248, 236, 0.92),
    0 0 22px rgba(231, 190, 114, 0.48);
}

.hero-orbit::after {
  content: "";
  left: 50%;
  top: 50%;
  width: 78%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(231, 190, 114, 0.52), transparent);
  transform: translate(-50%, -50%) rotate(-28deg);
}

.orbit-ring {
  border: 1px solid rgba(248, 239, 224, 0.26);
  border-radius: 50%;
  transform: rotate(-18deg);
}

.orbit-ring--outer {
  inset: 8px;
  border-top-color: rgba(231, 190, 114, 0.72);
  border-left-color: rgba(231, 190, 114, 0.4);
}

.orbit-ring--middle {
  inset: 45px;
  border-right-color: rgba(133, 183, 232, 0.58);
  transform: rotate(22deg);
}

.orbit-ring--inner {
  inset: 88px;
  border-bottom-color: rgba(231, 190, 114, 0.72);
  transform: rotate(48deg);
}

.orbit-cross {
  left: 50%;
  top: 50%;
  background: rgba(248, 239, 224, 0.18);
  transform-origin: center;
}

.orbit-cross--horizontal {
  width: 86%;
  height: 1px;
  transform: translate(-50%, -50%);
}

.orbit-cross--vertical {
  width: 1px;
  height: 86%;
  transform: translate(-50%, -50%);
}

.orbit-star {
  width: 7px;
  height: 7px;
  background: #e7be72;
  box-shadow: 0 0 18px rgba(231, 190, 114, 0.78);
  transform: rotate(45deg);
}

.orbit-star--one {
  left: 67px;
  top: 54px;
}

.orbit-star--two {
  right: 46px;
  top: 124px;
  background: #dcecff;
  box-shadow: 0 0 18px rgba(133, 183, 232, 0.72);
}

.orbit-star--three {
  left: 88px;
  bottom: 56px;
}

.orbit-code {
  right: 42px;
  bottom: 46px;
  color: rgba(248, 239, 224, 0.68);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  letter-spacing: 0.14em;
}

.hero-panel {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 26px;
  border: 1px solid rgba(231, 190, 114, 0.36);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 248, 236, 0.08), transparent 44%),
    rgba(8, 13, 27, 0.72);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px);
  overflow: hidden;
}

.hero-panel::before {
  content: "02 / CHECKOUT";
  position: absolute;
  right: 22px;
  top: 18px;
  color: rgba(248, 239, 224, 0.22);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.panel-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-item span {
  color: rgba(248, 239, 224, 0.62);
  font-size: 13px;
}

.panel-item strong {
  color: #fff8ec;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 42px;
  font-weight: 600;
  line-height: 1;
}

.panel-item--total {
  padding-left: 0;
}

.panel-item--total strong {
  color: #e7be72;
  font-size: 36px;
}

.panel-line {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(231, 190, 114, 0.48), transparent);
}

.cart-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: auto auto;
  gap: 0 24px;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.cart-header {
  grid-column: 1;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  height: 62px;
  padding: 0 22px;
  border: 1px solid rgba(56, 44, 31, 0.12);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background:
    linear-gradient(90deg, #18121d, #111827 66%, #201a24);
  color: rgba(248, 239, 224, 0.7);
  box-shadow: 0 18px 50px rgba(30, 24, 18, 0.12);
}

.cart-header .item-info {
  width: auto;
  margin-left: 16px;
  color: #f8efe0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.cart-header .item-info::after {
  content: " / EQUIPMENT GALLERY";
  color: rgba(231, 190, 114, 0.72);
}

.cart-header .price,
.cart-header .quantity,
.cart-header .subtotal,
.cart-header .actions {
  display: none;
}

.cart-header :deep(.el-checkbox__label) {
  color: rgba(248, 239, 224, 0.76);
}

.cart-list {
  grid-column: 1;
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(56, 44, 31, 0.12);
  border-radius: 0 0 8px 8px;
  background:
    linear-gradient(90deg, rgba(231, 190, 114, 0.1) 0 1px, transparent 1px),
    linear-gradient(180deg, rgba(31, 26, 20, 0.035) 0 1px, transparent 1px),
    rgba(255, 252, 246, 0.92);
  background-size: 44px 44px, 44px 44px, auto;
  box-shadow: 0 22px 52px rgba(30, 24, 18, 0.12);
}

.cart-item {
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 188px;
  grid-template-areas:
    "check product subtotal"
    "check product quantity"
    "check product price"
    "check product actions";
  gap: 8px 18px;
  align-items: center;
  min-height: 174px;
  padding: 18px;
  border: 1px solid rgba(41, 35, 27, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(250, 244, 234, 0.9)),
    #fffaf1;
  box-shadow: 0 12px 30px rgba(30, 24, 18, 0.08);
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
}

.cart-item::after {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(231, 190, 114, 0.32), transparent);
  opacity: 0;
  transition: opacity 0.24s ease;
}

.cart-item:hover {
  transform: translateY(-3px);
  border-color: rgba(157, 108, 48, 0.34);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(252, 241, 220, 0.94)),
    #fffaf1;
  box-shadow: 0 22px 44px rgba(30, 24, 18, 0.14);
}

.cart-item:hover::after,
.cart-item--selected::after {
  opacity: 1;
}

.cart-item--selected {
  border-color: rgba(157, 108, 48, 0.54);
  box-shadow: 0 24px 52px rgba(30, 24, 18, 0.16);
}

.cart-item--selected::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 18px;
  bottom: 18px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(180deg, #e7be72, #9d6c30);
}

.cart-item > :deep(.el-checkbox) {
  grid-area: check;
  justify-self: center;
}

.cart-item .product-info {
  grid-area: product;
  display: grid;
  grid-template-columns: 144px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  margin-left: 0;
  min-width: 0;
}

.cart-item .product-image {
  width: 144px;
  height: 144px;
  border: 1px solid rgba(41, 35, 27, 0.14);
  border-radius: 8px;
  background: #e7ded0;
  box-shadow:
    0 18px 28px rgba(30, 24, 18, 0.13),
    inset 0 0 0 1px rgba(255, 255, 255, 0.36);
  overflow: hidden;
}

.cart-item :deep(.product-image .el-image__inner) {
  transition: transform 0.34s ease, filter 0.34s ease;
}

.cart-item:hover :deep(.product-image .el-image__inner) {
  transform: scale(1.055);
  filter: saturate(1.08) contrast(1.05);
}

.cart-item .product-details {
  min-width: 0;
  margin-left: 0;
}

.cart-item .product-name {
  max-width: 560px;
  margin-bottom: 10px;
  color: #151923;
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.48;
}

.cart-item .product-brand {
  color: #756450;
  font-size: 13px;
  letter-spacing: 0.06em;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}

.product-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 23px;
  padding: 0 8px;
  border: 1px solid rgba(157, 108, 48, 0.18);
  border-radius: 4px;
  background: rgba(255, 248, 236, 0.74);
  color: #7a5c38;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.metric-cell {
  width: auto;
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  text-align: right;
}

.metric-label {
  display: inline-flex;
  color: #8d7a62;
  font-size: 12px;
  font-weight: 700;
}

.metric-value {
  color: #25202a;
  font-family: Georgia, "Times New Roman", serif;
}

.cart-item .subtotal {
  grid-area: subtotal;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(41, 35, 27, 0.1);
}

.cart-item .subtotal .metric-value {
  color: #b66525;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0;
}

.cart-item .price {
  grid-area: price;
}

.cart-item .price .metric-value {
  color: #463a2d;
  font-size: 16px;
  font-weight: 700;
}

.cart-item .quantity {
  grid-area: quantity;
  display: flex;
  justify-content: space-between;
}

:deep(.el-input-number) {
  width: 132px;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 4px;
  background: #fffaf1;
  box-shadow: 0 0 0 1px rgba(41, 35, 27, 0.14) inset;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: #f1e6d4;
  color: #4b3a29;
}

.cart-item .actions {
  grid-area: actions;
  width: auto;
  padding-top: 6px;
  text-align: right;
}

:deep(.el-checkbox__inner) {
  border-color: rgba(157, 108, 48, 0.38);
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  border-color: #b9843c;
  background-color: #b9843c;
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #f8efe0;
}

:deep(.el-button.is-text) {
  color: #7a5c38;
}

:deep(.el-button.is-text:hover) {
  color: #b66525;
  background: rgba(182, 101, 37, 0.08);
}

.cart-footer {
  grid-column: 2;
  grid-row: 1 / span 2;
  position: sticky;
  top: 24px;
  z-index: 3;
  align-self: start;
  min-height: 438px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0;
  padding: 28px;
  border: 1px solid rgba(231, 190, 114, 0.32);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(231, 190, 114, 0.12), transparent 42%),
    linear-gradient(180deg, #17111d, #0f1725);
  color: #f8efe0;
  box-shadow: 0 24px 62px rgba(30, 24, 18, 0.26);
  overflow: hidden;
}

.cart-footer::before {
  content: "";
  position: absolute;
  inset: 26px;
  border: 1px solid rgba(248, 239, 224, 0.12);
  border-radius: 50%;
  transform: translateY(-32%) rotate(-18deg);
  pointer-events: none;
}

.cart-footer::after {
  content: "CART TOTAL";
  position: absolute;
  right: 24px;
  bottom: 22px;
  color: rgba(248, 239, 224, 0.12);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.12em;
  pointer-events: none;
}

.cart-footer .left-actions {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  align-items: start;
  color: rgba(248, 239, 224, 0.72);
}

.cart-footer .left-actions :deep(.el-button) {
  justify-content: flex-start;
  width: fit-content;
  padding-left: 0;
}

.cart-footer .left-actions :deep(.el-button.is-text),
.cart-footer .left-actions :deep(.el-checkbox__label) {
  color: rgba(248, 239, 224, 0.72);
}

.cart-footer .left-actions :deep(.el-button.is-text:hover) {
  color: #e7be72;
  background: transparent;
}

.cart-footer .right-summary {
  position: relative;
  z-index: 1;
  width: 100%;
  display: grid;
  gap: 18px;
}

.cart-footer .summary-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: rgba(248, 239, 224, 0.7);
  font-size: 14px;
}

.cart-footer .summary-item .highlight {
  color: #e7be72;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 24px;
  font-weight: 700;
}

.cart-footer .total-price {
  display: block;
  margin-top: 8px;
  color: #e7be72;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 0;
}

.cart-footer :deep(.el-button--primary) {
  --el-button-bg-color: #e7be72;
  --el-button-border-color: #e7be72;
  --el-button-hover-bg-color: #f3d08f;
  --el-button-hover-border-color: #f3d08f;
  --el-button-active-bg-color: #c69247;
  --el-button-active-border-color: #c69247;
  width: 100%;
  height: 48px;
  border-radius: 4px;
  color: #111827;
  font-weight: 900;
}

.empty-cart {
  padding: 120px 0;
  border: 1px solid rgba(56, 44, 31, 0.12);
  border-radius: 8px;
  background: rgba(255, 252, 246, 0.94);
  box-shadow: 0 24px 52px rgba(30, 24, 18, 0.14);
}

.empty-cart :deep(.el-button--primary) {
  --el-button-bg-color: #17111d;
  --el-button-border-color: #17111d;
  --el-button-hover-bg-color: #2a2030;
  --el-button-hover-border-color: #2a2030;
}

.cart-recommend-section {
  margin-top: 30px;
  padding: 26px;
  border: 1px solid rgba(56, 44, 31, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 252, 246, 0.96), rgba(245, 238, 226, 0.92)),
    #fffaf1;
  box-shadow: 0 20px 44px rgba(30, 24, 18, 0.12);
}

.cart-recommend-section .section-header {
  justify-content: space-between;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(56, 44, 31, 0.12);
  padding-bottom: 16px;
}

.cart-recommend-section .section-header h3 {
  color: #151923;
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
  font-size: 26px;
  font-weight: 700;
}

.cart-recommend-section .section-header .algo-tip {
  border: 1px solid rgba(157, 108, 48, 0.2);
  border-radius: 4px;
  background: rgba(255, 248, 236, 0.8);
  color: #7a5c38;
}

.cart-recommend-section .recommend-grid {
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 18px;
}

.cart-recommend-section .recommend-card {
  position: relative;
  border: 1px solid rgba(41, 35, 27, 0.12);
  border-radius: 8px;
  background: #fffaf1;
  box-shadow: none;
  overflow: hidden;
}

.cart-recommend-section .recommend-card::before {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  top: 12px;
  height: 1px;
  background: rgba(231, 190, 114, 0.46);
  z-index: 1;
}

.cart-recommend-section .recommend-card:hover {
  transform: translateY(-5px);
  border-color: rgba(157, 108, 48, 0.4);
  box-shadow: 0 18px 34px rgba(30, 24, 18, 0.16);
}

.cart-recommend-section .recommend-card .card-image {
  height: 196px;
  background: #e7ded0;
}

.cart-recommend-section .recommend-card .card-info {
  padding: 14px;
}

.cart-recommend-section .recommend-card .card-info h4 {
  color: #151923;
  font-size: 14px;
  font-weight: 760;
}

.cart-recommend-section .recommend-card .reason-tag {
  border: 1px solid rgba(157, 108, 48, 0.18);
  border-radius: 4px;
  background: rgba(255, 248, 236, 0.82);
  color: #7a5c38;
}

.cart-recommend-section .recommend-card .card-price .price {
  color: #b66525;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 19px;
}

.cart-recommend-section .recommend-card .card-sales {
  color: #7b6a54;
}

@media (max-width: 1120px) {
  .cart-hero {
    grid-template-columns: minmax(0, 1fr) 280px;
  }

  .hero-orbit {
    display: none;
  }

  .cart-container {
    grid-template-columns: 1fr;
  }

  .cart-footer {
    grid-column: 1;
    grid-row: auto;
    position: static;
    min-height: 0;
    margin-top: 18px;
  }

  .cart-footer .left-actions {
    display: flex;
    flex-wrap: wrap;
  }
}

@media (max-width: 820px) {
  .cart-page {
    padding-top: 18px;
  }

  .container {
    width: calc(100% - 28px);
  }

  .cart-hero {
    grid-template-columns: 1fr;
    min-height: 0;
    margin-bottom: 22px;
  }

  .hero-copy h1 {
    font-size: 36px;
  }

  .hero-panel {
    padding: 20px;
  }

  .cart-header {
    display: none;
  }

  .cart-list {
    padding: 12px;
    border-radius: 8px;
  }

  .cart-item {
    grid-template-columns: 34px minmax(0, 1fr);
    grid-template-areas:
      "check product"
      "check subtotal"
      "check quantity"
      "check price"
      "check actions";
    gap: 12px;
    min-height: 0;
    padding: 14px;
  }

  .cart-item .product-info {
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 14px;
  }

  .cart-item .product-image {
    width: 96px;
    height: 96px;
  }

  .cart-item .product-name {
    font-size: 16px;
  }

  .cart-item .actions {
    text-align: left;
  }

  .cart-footer {
    padding: 20px;
  }

  .cart-footer .right-summary {
    gap: 14px;
  }

  .cart-footer .summary-item {
    flex-wrap: wrap;
  }

  .cart-footer .total-price {
    font-size: 30px;
  }

  .cart-recommend-section {
    padding: 18px;
  }
}

/* Procurement ledger refinement: less poster, more usable cart */
.cart-page {
  min-height: 100vh;
  padding: 24px 0 72px;
  overflow: visible;
  background:
    linear-gradient(90deg, rgba(36, 48, 67, 0.035) 1px, transparent 1px),
    linear-gradient(180deg, rgba(36, 48, 67, 0.035) 1px, transparent 1px),
    linear-gradient(180deg, #f3efe7 0%, #ebe4d8 100%);
  background-size: 36px 36px, 36px 36px, auto;
  color: #202635;
}

.cart-page::before,
.cart-page::after {
  display: none;
}

.container {
  width: min(1180px, calc(100% - 48px));
}

.el-breadcrumb {
  margin-bottom: 18px;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: #667085 !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #202635 !important;
}

.cart-hero {
  min-height: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 18px;
  padding: 24px 26px;
  border: 1px solid rgba(53, 42, 29, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(247, 240, 227, 0.7)),
    #fbf7ef;
  box-shadow: 0 18px 40px rgba(53, 42, 29, 0.08);
  color: #202635;
}

.hero-kicker {
  margin-bottom: 10px;
  color: #8b6334;
  font-size: 11px;
  letter-spacing: 0.18em;
}

.hero-kicker::before,
.hero-kicker::after {
  width: 22px;
  background: #8b6334;
}

.hero-copy h1 {
  margin: 0;
  color: #171b28;
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
  font-size: 32px;
  line-height: 1.2;
}

.hero-copy p {
  max-width: none;
  margin: 10px 0 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.7;
}

.hero-panel {
  align-self: stretch;
  display: grid;
  grid-template-columns: 1fr 1px 1.35fr;
  gap: 0;
  padding: 18px;
  border: 1px solid rgba(32, 38, 53, 0.1);
  border-radius: 8px;
  background: #202635;
  box-shadow: none;
  backdrop-filter: none;
}

.hero-panel::before {
  display: none;
}

.panel-line {
  width: 1px;
  height: auto;
  background: linear-gradient(180deg, transparent, rgba(220, 183, 122, 0.46), transparent);
}

.panel-item {
  gap: 8px;
}

.panel-item--total {
  padding-left: 18px;
}

.panel-item span {
  color: rgba(246, 239, 227, 0.72);
  font-size: 12px;
}

.panel-item strong,
.panel-item--total strong {
  color: #e0b979;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 27px;
  font-weight: 700;
}

.cart-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 318px;
  gap: 18px;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.cart-header {
  grid-column: 1;
  height: 54px;
  padding: 0 20px;
  border: 1px solid rgba(53, 42, 29, 0.12);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #202635;
  color: rgba(246, 239, 227, 0.78);
  box-shadow: none;
}

.cart-header .item-info {
  color: #f6efe3;
  letter-spacing: 0.08em;
}

.cart-header .item-info::after {
  content: "";
}

.cart-list {
  grid-column: 1;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(53, 42, 29, 0.12);
  border-radius: 0 0 8px 8px;
  background: rgba(255, 252, 246, 0.9);
  background-image:
    linear-gradient(rgba(53, 42, 29, 0.035) 1px, transparent 1px);
  background-size: 100% 34px;
  box-shadow: 0 18px 38px rgba(53, 42, 29, 0.08);
}

.cart-item {
  min-height: 150px;
  padding: 15px;
  border: 1px solid rgba(53, 42, 29, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 24px rgba(53, 42, 29, 0.06);
}

.cart-item:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 99, 52, 0.28);
  box-shadow: 0 16px 30px rgba(53, 42, 29, 0.1);
}

.cart-item--selected {
  border-color: rgba(139, 99, 52, 0.42);
}

.cart-item .product-info {
  grid-template-columns: 118px minmax(0, 1fr);
  gap: 16px;
}

.cart-item .product-image {
  width: 118px;
  height: 118px;
  border-radius: 6px;
  background: #eee6d8;
  box-shadow: 0 12px 20px rgba(53, 42, 29, 0.1);
}

.cart-item .product-name {
  color: #171b28;
  font-size: 17px;
}

.cart-item .product-brand {
  color: #667085;
}

.product-meta span {
  border-color: rgba(139, 99, 52, 0.16);
  background: #f8f0e2;
  color: #78562e;
}

.cart-item .subtotal .metric-value {
  color: #b25d24;
  font-size: 24px;
}

.cart-footer {
  grid-column: 2;
  grid-row: 1 / span 2;
  position: sticky;
  top: 20px;
  min-height: 360px;
  padding: 24px;
  border: 1px solid rgba(53, 42, 29, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(180deg, #202635, #171b28);
  color: #f6efe3;
  box-shadow: 0 20px 40px rgba(53, 42, 29, 0.16);
}

.cart-footer::before,
.cart-footer::after {
  display: none;
}

.cart-footer .left-actions {
  display: grid;
  gap: 8px;
}

.cart-footer .right-summary {
  display: grid;
  gap: 16px;
}

.cart-footer .summary-item {
  color: rgba(246, 239, 227, 0.76);
}

.cart-footer .total-price,
.cart-footer .summary-item .highlight {
  color: #e0b979;
}

.cart-footer .total-price {
  font-size: 34px;
}

.cart-footer :deep(.el-button--primary) {
  --el-button-bg-color: #e0b979;
  --el-button-border-color: #e0b979;
  --el-button-hover-bg-color: #edca8e;
  --el-button-hover-border-color: #edca8e;
  width: 100%;
  border-radius: 6px;
  color: #171b28;
}

.empty-cart {
  position: relative;
  min-height: 330px;
  padding: 58px 24px;
  border: 1px solid rgba(53, 42, 29, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent 0 48%, rgba(139, 99, 52, 0.08) 48% 48.2%, transparent 48.2%),
    linear-gradient(180deg, rgba(255, 252, 246, 0.96), rgba(246, 239, 227, 0.94));
  box-shadow: 0 18px 38px rgba(53, 42, 29, 0.08);
  overflow: hidden;
}

.empty-cart::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 54px;
  width: 154px;
  height: 98px;
  border: 1px solid rgba(53, 42, 29, 0.2);
  border-radius: 8px;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 50% 44%, transparent 0 22px, rgba(53, 42, 29, 0.18) 23px 24px, transparent 25px),
    linear-gradient(90deg, transparent 0 49%, rgba(53, 42, 29, 0.16) 49% 50%, transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(232, 222, 205, 0.42));
}

.empty-cart :deep(.el-empty) {
  position: relative;
  z-index: 1;
  padding-top: 126px;
}

.empty-cart :deep(.el-empty__image) {
  display: none;
}

.empty-cart :deep(.el-empty__description p) {
  color: #667085;
  font-size: 15px;
}

.empty-cart :deep(.el-button--primary) {
  --el-button-bg-color: #202635;
  --el-button-border-color: #202635;
  --el-button-hover-bg-color: #31394b;
  --el-button-hover-border-color: #31394b;
  border-radius: 6px;
}

.cart-recommend-section {
  margin-top: 22px;
  padding: 22px;
  border: 1px solid rgba(53, 42, 29, 0.12);
  border-radius: 8px;
  background: rgba(255, 252, 246, 0.9);
  box-shadow: 0 16px 32px rgba(53, 42, 29, 0.07);
}

.cart-recommend-section .section-header {
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(53, 42, 29, 0.1);
}

.cart-recommend-section .section-header h3 {
  color: #171b28;
  font-size: 22px;
}

.cart-recommend-section .recommend-card {
  border-color: rgba(53, 42, 29, 0.12);
  background: #fffaf1;
}

.cart-recommend-section .recommend-card::before {
  display: none;
}

.cart-recommend-section .recommend-card .card-image {
  height: 178px;
}

@media (max-width: 1020px) {
  .cart-hero,
  .cart-container {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .cart-footer {
    position: static;
    grid-column: 1;
    grid-row: auto;
    min-height: 0;
  }
}

@media (max-width: 720px) {
  .container {
    width: calc(100% - 28px);
  }

  .cart-hero {
    padding: 20px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .panel-line {
    width: 100%;
    height: 1px;
  }
}

/* Final direction: restrained premium commerce cart */
.cart-page {
  min-height: 100vh;
  padding: 28px 0 64px;
  overflow: visible;
  background:
    linear-gradient(180deg, rgba(18, 27, 43, 0.035), transparent 220px),
    #f6f4ef;
  color: #172033;
}

.cart-page::before,
.cart-page::after {
  display: none;
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

.cart-hero {
  min-height: auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin: 0 0 18px;
  padding: 0 0 18px;
  border: 0;
  border-bottom: 1px solid rgba(23, 32, 51, 0.12);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #172033;
}

.hero-copy {
  min-width: 0;
}

.hero-kicker {
  display: block;
  margin: 0 0 8px;
  color: #8a6a3f;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.hero-kicker::before,
.hero-kicker::after {
  display: none;
}

.hero-copy h1 {
  margin: 0;
  color: #172033;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 34px;
  font-weight: 760;
  line-height: 1.15;
  letter-spacing: 0;
}

.hero-copy p {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.7;
}

.hero-panel {
  width: 312px;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1px 1.35fr;
  align-items: center;
  gap: 0;
  padding: 14px 16px;
  border: 1px solid rgba(23, 32, 51, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: none;
  backdrop-filter: none;
}

.hero-panel::before {
  display: none;
}

.panel-item {
  gap: 5px;
}

.panel-item span {
  color: #7a8494;
  font-size: 12px;
}

.panel-item strong,
.panel-item--total strong {
  color: #172033;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 22px;
  font-weight: 760;
}

.panel-item--total {
  padding-left: 16px;
}

.panel-line {
  width: 1px;
  height: 42px;
  background: rgba(23, 32, 51, 0.1);
}

.cart-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.cart-header {
  grid-column: 1;
  display: grid;
  grid-template-columns: 72px minmax(280px, 1fr) 118px 132px 132px 76px;
  align-items: center;
  height: 50px;
  padding: 0 18px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px 8px 0 0;
  background: #ffffff;
  color: #7a8494;
  box-shadow: none;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.cart-header .item-info,
.cart-header .price,
.cart-header .quantity,
.cart-header .subtotal,
.cart-header .actions {
  display: inline;
  width: auto;
  margin-left: 0;
}

.cart-header .item-info::after {
  content: "";
}

.cart-header .price,
.cart-header .quantity,
.cart-header .subtotal,
.cart-header .actions {
  text-align: right;
}

.cart-header :deep(.el-checkbox__label) {
  color: #7a8494;
}

.cart-list {
  grid-column: 1;
  display: grid;
  gap: 0;
  padding: 0;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-top: 0;
  border-radius: 0 0 8px 8px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
  background-image: none;
}

.cart-item {
  position: relative;
  display: grid;
  grid-template-columns: 54px minmax(280px, 1fr) 118px 132px 132px 76px;
  grid-template-areas: none;
  gap: 0;
  align-items: center;
  min-height: 132px;
  padding: 18px;
  border: 0;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 0;
  background: #ffffff;
  box-shadow: none;
  transition: background-color 0.18s ease;
}

.cart-item:last-child {
  border-bottom: 0;
}

.cart-item:hover {
  transform: none;
  border-color: transparent;
  background: #faf7f0;
  box-shadow: none;
}

.cart-item::after {
  display: none;
}

.cart-item--selected {
  border-color: transparent;
  background: #fffaf1;
  box-shadow: none;
}

.cart-item--selected::before {
  content: "";
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #9f7a44;
}

.cart-item > :deep(.el-checkbox) {
  grid-column: 1;
  grid-row: auto;
  grid-area: auto;
  justify-self: center;
}

.cart-item .product-info {
  grid-column: 2;
  grid-area: auto;
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  min-width: 0;
  margin-left: 0;
}

.cart-item .product-image {
  width: 92px;
  height: 92px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 6px;
  background: #eef0f3;
  box-shadow: none;
  overflow: hidden;
}

.cart-item :deep(.product-image .el-image__inner) {
  transition: transform 0.22s ease;
}

.cart-item:hover :deep(.product-image .el-image__inner) {
  transform: scale(1.035);
  filter: none;
}

.cart-item .product-details {
  min-width: 0;
  margin-left: 0;
}

.cart-item .product-name {
  max-width: 460px;
  margin: 0 0 7px;
  color: #172033;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  font-weight: 680;
  line-height: 1.5;
}

.cart-item .product-brand {
  color: #8a93a3;
  font-size: 13px;
  letter-spacing: 0;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}

.product-meta span {
  min-height: 22px;
  padding: 0 8px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 999px;
  background: #f6f7f9;
  color: #6b7280;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
}

.metric-cell {
  width: auto;
  min-width: 0;
  display: block;
  text-align: right;
}

.metric-label {
  display: none;
}

.cart-item .price {
  grid-column: 3;
  grid-area: auto;
}

.cart-item .quantity {
  grid-column: 4;
  grid-area: auto;
  display: flex;
  justify-content: flex-end;
}

.cart-item .subtotal {
  grid-column: 5;
  grid-area: auto;
  padding-bottom: 0;
  border-bottom: 0;
}

.cart-item .actions {
  grid-column: 6;
  grid-area: auto;
  width: auto;
  padding-top: 0;
  text-align: right;
}

.cart-item .price .metric-value {
  color: #4b5563;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 650;
}

.cart-item .subtotal .metric-value {
  color: #b35d25;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 17px;
  font-weight: 760;
}

:deep(.el-input-number) {
  width: 118px;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.12) inset;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: #f6f7f9;
  color: #4b5563;
}

:deep(.el-checkbox__inner) {
  border-color: rgba(23, 32, 51, 0.24);
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  border-color: #172033;
  background-color: #172033;
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #172033;
}

:deep(.el-button.is-text) {
  color: #6b7280;
}

:deep(.el-button.is-text:hover) {
  color: #b35d25;
  background: rgba(179, 93, 37, 0.08);
}

.cart-footer {
  grid-column: 2;
  grid-row: 1 / span 2;
  position: sticky;
  top: 20px;
  align-self: start;
  min-height: auto;
  display: grid;
  gap: 24px;
  margin: 0;
  padding: 22px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #172033;
  color: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.16);
  overflow: hidden;
}

.cart-footer::before,
.cart-footer::after {
  display: none;
}

.cart-footer .left-actions {
  display: grid;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
}

.cart-footer .left-actions :deep(.el-button) {
  width: fit-content;
  padding-left: 0;
}

.cart-footer .left-actions :deep(.el-button.is-text),
.cart-footer .left-actions :deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.72);
}

.cart-footer .left-actions :deep(.el-button.is-text:hover) {
  color: #e7c078;
  background: transparent;
}

.cart-footer .right-summary {
  display: grid;
  gap: 16px;
  width: 100%;
}

.cart-footer .summary-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
}

.cart-footer .summary-item .highlight {
  color: #e7c078;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 18px;
  font-weight: 760;
}

.cart-footer .total-price {
  color: #e7c078;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0;
}

.cart-footer :deep(.el-button--primary) {
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #ffffff;
  --el-button-hover-bg-color: #e7c078;
  --el-button-hover-border-color: #e7c078;
  --el-button-active-bg-color: #d8ad5d;
  --el-button-active-border-color: #d8ad5d;
  width: 100%;
  height: 44px;
  border-radius: 6px;
  color: #172033;
  font-weight: 800;
}

.empty-cart {
  min-height: 260px;
  max-width: 760px;
  margin: 32px auto 0;
  padding: 48px 24px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
  overflow: hidden;
}

.empty-cart::before {
  width: 118px;
  height: 72px;
  top: 44px;
  border: 1px solid rgba(23, 32, 51, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent 0 49%, rgba(23, 32, 51, 0.12) 49% 50%, transparent 50%),
    linear-gradient(180deg, #ffffff, #f4f5f7);
}

.empty-cart :deep(.el-empty) {
  padding-top: 96px;
}

.empty-cart :deep(.el-empty__image) {
  display: none;
}

.empty-cart :deep(.el-empty__description p) {
  color: #7a8494;
  font-size: 14px;
}

.empty-cart :deep(.el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #28344d;
  --el-button-hover-border-color: #28344d;
  border-radius: 6px;
}

.cart-recommend-section {
  margin-top: 22px;
  padding: 22px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
}

.cart-recommend-section .section-header {
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
}

.cart-recommend-section .section-header h3 {
  color: #172033;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  font-weight: 760;
}

.cart-recommend-section .section-header .algo-tip {
  border: 1px solid rgba(159, 122, 68, 0.16);
  border-radius: 999px;
  background: #fbf4e8;
  color: #8a6a3f;
}

.cart-recommend-section .recommend-grid {
  grid-template-columns: repeat(auto-fit, minmax(178px, 1fr));
  gap: 14px;
}

.cart-recommend-section .recommend-card {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
  overflow: hidden;
}

.cart-recommend-section .recommend-card::before {
  display: none;
}

.cart-recommend-section .recommend-card:hover {
  transform: translateY(-3px);
  border-color: rgba(159, 122, 68, 0.26);
  box-shadow: 0 12px 24px rgba(23, 32, 51, 0.1);
}

.cart-recommend-section .recommend-card .card-image {
  height: 168px;
  background: #eef0f3;
}

.cart-recommend-section .recommend-card .card-info {
  padding: 12px;
}

.cart-recommend-section .recommend-card .card-info h4 {
  color: #172033;
  font-size: 13px;
  font-weight: 700;
}

.cart-recommend-section .recommend-card .reason-tag {
  border: 1px solid rgba(159, 122, 68, 0.16);
  border-radius: 999px;
  background: #fbf4e8;
  color: #8a6a3f;
}

.cart-recommend-section .recommend-card .card-price .price {
  color: #b35d25;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 17px;
}

.cart-recommend-section .recommend-card .card-sales {
  color: #7a8494;
}

@media (max-width: 1040px) {
  .cart-hero {
    display: grid;
    grid-template-columns: 1fr;
    align-items: start;
  }

  .hero-panel {
    width: 100%;
  }

  .cart-container {
    grid-template-columns: 1fr;
  }

  .cart-footer {
    position: static;
    grid-column: 1;
    grid-row: auto;
  }
}

@media (max-width: 760px) {
  .cart-page {
    padding: 18px 0 44px;
  }

  .container {
    width: calc(100% - 28px);
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .panel-line {
    width: 100%;
    height: 1px;
  }

  .panel-item--total {
    padding-left: 0;
  }

  .cart-header {
    display: none;
  }

  .cart-list {
    border-radius: 8px;
  }

  .cart-item {
    grid-template-columns: 34px minmax(0, 1fr);
    grid-template-areas:
      "check product"
      "check subtotal"
      "check quantity"
      "check price"
      "check actions";
    gap: 12px;
    min-height: 0;
    padding: 14px;
  }

  .cart-item > :deep(.el-checkbox) {
    grid-area: check;
  }

  .cart-item .product-info {
    grid-area: product;
    grid-template-columns: 86px minmax(0, 1fr);
    gap: 12px;
  }

  .cart-item .product-image {
    width: 86px;
    height: 86px;
  }

  .cart-item .product-name {
    font-size: 14px;
  }

  .metric-cell {
    display: flex;
    justify-content: space-between;
    text-align: left;
  }

  .metric-label {
    display: inline-flex;
    color: #7a8494;
    font-size: 12px;
  }

  .cart-item .subtotal {
    grid-area: subtotal;
  }

  .cart-item .quantity {
    grid-area: quantity;
  }

  .cart-item .price {
    grid-area: price;
  }

  .cart-item .actions {
    grid-area: actions;
    text-align: left;
  }
}
</style>
