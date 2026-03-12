<template>
  <!-- 我的收藏页面 -->
  <div class="user-favorite">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon class="title-icon"><StarFilled /></el-icon>
        我的收藏
      </h2>
      <span class="total-hint" v-if="total > 0">共 {{ total }} 件商品</span>
    </div>

    <!-- 加载骨架屏 -->
    <div v-if="loading" class="skeleton-list">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="image" style="width:100%;height:200px;border-radius:8px 8px 0 0" />
            <div style="padding:12px">
              <el-skeleton-item variant="text" style="width:80%;margin-bottom:8px" />
              <el-skeleton-item variant="text" style="width:50%" />
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <!-- 收藏列表（网格布局）-->
    <div v-else-if="favoriteList.length > 0" class="favorite-grid">
      <div
          v-for="item in favoriteList"
          :key="item.id"
          class="favorite-card"
          :class="{ 'off-shelf': item.isOffShelf }"
      >
        <!-- 商品图片 -->
        <div class="card-image-wrapper" @click="goToProduct(item)">
          <img
              :src="item.productImage || defaultImage"
              :alt="item.productName"
              class="card-image"
              @error="handleImageError"
          />
          <!-- 已下架遮罩 -->
          <div v-if="item.isOffShelf" class="off-shelf-mask">
            <span class="off-shelf-text">已下架</span>
          </div>
          <!-- 降价标签 -->
          <el-tag
              v-if="item.isPriceDown && !item.isOffShelf"
              class="price-down-tag"
              type="danger"
              size="small"
              effect="dark"
          >
            ↓ 降价了
          </el-tag>
          <!-- 涨价标签 -->
          <el-tag
              v-if="item.isPriceUp && !item.isOffShelf"
              class="price-up-tag"
              type="warning"
              size="small"
              effect="dark"
          >
            ↑ 涨价了
          </el-tag>
        </div>

        <!-- 商品信息 -->
        <div class="card-body">
          <!-- 商品名称 -->
          <div class="product-name" :title="item.productName">
            {{ item.productName }}
          </div>

          <!-- 价格区域 -->
          <div class="price-area">
            <!-- 当前价格 -->
            <span
                v-if="!item.isOffShelf && item.currentPrice != null"
                class="current-price"
                :class="{ 'price-down': item.isPriceDown, 'price-up': item.isPriceUp }"
            >
              ¥{{ item.currentPrice.toFixed(2) }}
            </span>
            <span v-else-if="item.isOffShelf" class="off-shelf-price">
              —
            </span>

            <!-- 收藏时价格（价格变化时显示划线原价）-->
            <span
                v-if="(item.isPriceDown || item.isPriceUp) && item.favoritePrice != null"
                class="favorite-price"
            >
              ¥{{ item.favoritePrice.toFixed(2) }}
            </span>
          </div>

          <!-- 收藏时间 -->
          <div class="collect-time">
            <el-icon><Clock /></el-icon>
            {{ formatTime(item.createTime) }}
          </div>
        </div>

        <!-- 操作按钮区 -->
        <div class="card-actions">
          <!-- 去购买（下架商品禁用）-->
          <el-button
              type="primary"
              size="small"
              :disabled="item.isOffShelf"
              @click="goToProduct(item)"
              class="buy-btn"
          >
            去购买
          </el-button>
          <!-- 取消收藏 -->
          <el-button
              type="default"
              size="small"
              @click="handleRemoveFavorite(item)"
              class="remove-btn"
          >
            <el-icon><Delete /></el-icon>
            取消
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty
        v-else
        description="还没有收藏任何商品"
        :image-size="120"
    >
      <el-button type="primary" @click="goShopping">去逛逛</el-button>
    </el-empty>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-wrapper">
      <el-pagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper, total"
          @current-change="handlePageChange"
          background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StarFilled, Clock, Delete } from '@element-plus/icons-vue'
import { getFavoriteList, removeFavorite } from '@/api/favorite'

const router = useRouter()

// ========================
// 响应式数据
// ========================
const loading = ref(false)
const favoriteList = ref([])
const pageNum = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 默认商品图片（加载失败时显示）
const defaultImage = 'https://via.placeholder.com/300x300?text=商品图片'

// ========================
// 初始化
// ========================
onMounted(() => {
  fetchFavoriteList()
})

// ========================
// 获取收藏列表
// ========================
const fetchFavoriteList = async () => {
  loading.value = true
  try {
    const res = await getFavoriteList({
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    favoriteList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (e) {
    ElMessage.error('加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

// ========================
// 分页变化
// ========================
const handlePageChange = (page) => {
  pageNum.value = page
  fetchFavoriteList()
  // 滚回顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ========================
// 取消收藏
// ========================
const handleRemoveFavorite = async (item) => {
  try {
    await ElMessageBox.confirm(
        `确认取消收藏「${item.productName}」？`,
        '提示',
        {
          confirmButtonText: '确认取消',
          cancelButtonText: '再想想',
          type: 'warning'
        }
    )
    await removeFavorite(item.productId)
    ElMessage.success('已取消收藏')
    // 从列表中移除（无需重新请求）
    favoriteList.value = favoriteList.value.filter(f => f.id !== item.id)
    total.value = Math.max(0, total.value - 1)
    // 如果当前页已空且不是第一页，回到上一页
    if (favoriteList.value.length === 0 && pageNum.value > 1) {
      pageNum.value--
      fetchFavoriteList()
    }
  } catch (e) {
    // 用户点击"再想想"不做处理
    if (e !== 'cancel') {
      ElMessage.error('操作失败，请重试')
    }
  }
}

// ========================
// 跳转商品详情
// ========================
const goToProduct = (item) => {
  if (item.isOffShelf) {
    ElMessage.warning('该商品已下架，暂时无法购买')
    return
  }
  router.push(`/product/${item.productId}`)
}

// ========================
// 去逛逛（跳转商品列表）
// ========================
const goShopping = () => {
  router.push('/products')
}

// ========================
// 工具函数
// ========================
/**
 * 格式化收藏时间
 * 今天的显示 "今天 HH:mm"，否则显示 "MM-DD"
 */
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `今天 ${h}:${m}`
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** 图片加载失败时的回调 */
const handleImageError = (e) => {
  e.target.src = defaultImage
}
</script>

<style scoped>
/* ======================== 页面整体 ======================== */
.user-favorite {
  padding: 0;
  min-height: 400px;
}

/* ======================== 页面标题 ======================== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.title-icon {
  color: #e74c3c;
  font-size: 22px;
}

.total-hint {
  color: #999;
  font-size: 14px;
}

/* ======================== 骨架屏 ======================== */
.skeleton-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.skeleton-card {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ======================== 收藏网格 ======================== */
.favorite-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

/* ======================== 收藏卡片 ======================== */
.favorite-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
}

.favorite-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.favorite-card.off-shelf {
  opacity: 0.7;
}

/* ======================== 商品图片 ======================== */
.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  cursor: pointer;
  background: #f7f7f7;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.favorite-card:hover .card-image {
  transform: scale(1.04);
}

/* 已下架遮罩 */
.off-shelf-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.off-shelf-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 14px;
  border-radius: 20px;
  letter-spacing: 2px;
}

/* 降价标签 */
.price-down-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-weight: 600;
}

/* 涨价标签 */
.price-up-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-weight: 600;
}

/* ======================== 商品信息 ======================== */
.card-body {
  padding: 12px 14px 8px;
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
  min-height: 42px;
}

/* ======================== 价格区域 ======================== */
.price-area {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #e74c3c;
}

.current-price.price-down {
  color: #e74c3c;
}

.current-price.price-up {
  color: #e6a23c;
}

.off-shelf-price {
  font-size: 16px;
  color: #bbb;
}

/* 收藏时的价格（划线原价）*/
.favorite-price {
  font-size: 12px;
  color: #bbb;
  text-decoration: line-through;
}

/* ======================== 收藏时间 ======================== */
.collect-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #bbb;
}

/* ======================== 操作按钮 ======================== */
.card-actions {
  display: flex;
  gap: 8px;
  padding: 10px 14px 14px;
  border-top: 1px solid #f5f5f5;
}

.buy-btn {
  flex: 1;
  border-radius: 8px;
}

.remove-btn {
  border-radius: 8px;
  color: #999;
  border-color: #ddd;
}

.remove-btn:hover {
  color: #e74c3c;
  border-color: #e74c3c;
}

/* ======================== 分页 ======================== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-bottom: 16px;
}
</style>