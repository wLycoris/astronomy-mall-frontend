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
const favoriteMessageOptions = {
  customClass: 'favorite-message-box',
  confirmButtonClass: 'favorite-message-confirm',
  cancelButtonClass: 'favorite-message-cancel'
}

// 默认商品图片（加载失败时显示）
const defaultImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23f8f5ef"/><circle cx="300" cy="205" r="54" fill="%23ebe6dc"/><path d="M238 260h124" stroke="%239ca3af" stroke-width="8" stroke-linecap="round"/><text x="300" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="%236b7280">NO IMAGE</text></svg>'

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
          type: 'warning',
          appendToBody: true,
          ...favoriteMessageOptions
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

/* Final personal-center gallery pass */
:global(body .user-favorite.user-favorite) {
  color: #111827;
}

:global(body .user-favorite.user-favorite .page-header) {
  margin: 0 0 16px;
  padding: 18px 22px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 14px 38px rgba(17, 24, 39, 0.06);
}

:global(body .user-favorite.user-favorite .page-title) {
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
}

:global(body .user-favorite.user-favorite .title-icon) {
  color: #9c6b35;
  font-size: 19px;
}

:global(body .user-favorite.user-favorite .total-hint) {
  padding: 5px 10px;
  border: 1px solid rgba(156, 107, 53, 0.2);
  border-radius: 999px;
  background: #fff8ec;
  color: #8a5a22;
  font-size: 12px;
  font-weight: 760;
}

:global(body .user-favorite.user-favorite .skeleton-list),
:global(body .user-favorite.user-favorite .favorite-grid) {
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}

:global(body .user-favorite.user-favorite .skeleton-card),
:global(body .user-favorite.user-favorite .favorite-card) {
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.055);
  overflow: hidden;
}

:global(body .user-favorite.user-favorite .favorite-card) {
  position: relative;
}

:global(body .user-favorite.user-favorite .favorite-card::after) {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: rgba(156, 107, 53, 0.72);
  opacity: 0;
  transition: opacity 0.2s ease;
}

:global(body .user-favorite.user-favorite .favorite-card:hover) {
  transform: translateY(-2px);
  border-color: rgba(156, 107, 53, 0.28);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.09);
}

:global(body .user-favorite.user-favorite .favorite-card:hover::after) {
  opacity: 1;
}

:global(body .user-favorite.user-favorite .favorite-card.off-shelf) {
  opacity: 1;
  background: #f8f5ef;
}

:global(body .user-favorite.user-favorite .card-image-wrapper) {
  aspect-ratio: 4 / 3;
  background: #f8f5ef;
}

:global(body .user-favorite.user-favorite .card-image) {
  object-fit: cover;
}

:global(body .user-favorite.user-favorite .favorite-card:hover .card-image) {
  transform: scale(1.025);
}

:global(body .user-favorite.user-favorite .off-shelf-mask) {
  background: rgba(17, 24, 39, 0.56);
  backdrop-filter: blur(2px);
}

:global(body .user-favorite.user-favorite .off-shelf-text) {
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.72);
  color: #fff;
  font-size: 13px;
  font-weight: 760;
  letter-spacing: 0;
}

:global(body .user-favorite.user-favorite .price-down-tag.el-tag),
:global(body .user-favorite.user-favorite .price-up-tag.el-tag) {
  top: 10px;
  left: 10px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-weight: 760;
}

:global(body .user-favorite.user-favorite .price-down-tag.el-tag) {
  background: #9c4f1e;
}

:global(body .user-favorite.user-favorite .price-up-tag.el-tag) {
  background: #9c6b35;
}

:global(body .user-favorite.user-favorite .card-body) {
  padding: 13px 14px 10px;
}

:global(body .user-favorite.user-favorite .product-name) {
  min-height: 44px;
  margin-bottom: 10px;
  color: #111827;
  font-size: 14px;
  font-weight: 760;
  line-height: 1.55;
}

:global(body .user-favorite.user-favorite .price-area) {
  min-height: 26px;
  margin-bottom: 8px;
}

:global(body .user-favorite.user-favorite .current-price) {
  color: #9c6b35;
  font-size: 18px;
  font-weight: 850;
  letter-spacing: 0;
}

:global(body .user-favorite.user-favorite .current-price.price-down) {
  color: #9c4f1e;
}

:global(body .user-favorite.user-favorite .current-price.price-up) {
  color: #9c6b35;
}

:global(body .user-favorite.user-favorite .favorite-price),
:global(body .user-favorite.user-favorite .off-shelf-price) {
  color: #8a9099;
}

:global(body .user-favorite.user-favorite .collect-time) {
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

:global(body .user-favorite.user-favorite .card-actions) {
  gap: 8px;
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
}

:global(body .user-favorite.user-favorite .el-button) {
  min-height: 32px;
  border-radius: 4px;
  font-weight: 760;
  letter-spacing: 0;
}

:global(body .user-favorite.user-favorite .el-button span) {
  color: inherit;
}

:global(body .user-favorite.user-favorite .buy-btn.el-button--primary) {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

:global(body .user-favorite.user-favorite .buy-btn.el-button--primary:hover) {
  border-color: #273142;
  background: #273142;
}

:global(body .user-favorite.user-favorite .buy-btn.is-disabled) {
  border-color: rgba(17, 24, 39, 0.12);
  background: #ece8df;
  color: #8a9099;
}

:global(body .user-favorite.user-favorite .remove-btn.el-button) {
  border-color: rgba(17, 24, 39, 0.14);
  background: #fff;
  color: #374151;
}

:global(body .user-favorite.user-favorite .remove-btn.el-button:hover) {
  border-color: rgba(156, 79, 30, 0.35);
  background: #fff8ec;
  color: #9c4f1e;
}

:global(body .user-favorite.user-favorite .el-empty) {
  min-height: 360px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 14px 38px rgba(17, 24, 39, 0.06);
}

:global(body .user-favorite.user-favorite .el-empty__description p) {
  color: #4b5563;
  font-weight: 650;
}

:global(body .user-favorite.user-favorite .pagination-wrapper) {
  margin-top: 24px;
}

:global(body .user-favorite.user-favorite .el-pagination.is-background .el-pager li),
:global(body .user-favorite.user-favorite .el-pagination.is-background button) {
  border-radius: 4px;
  background: #fffdfa;
  color: #374151;
}

:global(body .user-favorite.user-favorite .el-pagination.is-background .el-pager li.is-active) {
  background: #111827;
  color: #fff;
}

:global(body .favorite-message-box.el-message-box) {
  width: 420px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 7px;
  box-shadow: 0 28px 70px rgba(17, 24, 39, 0.24);
}

:global(body .favorite-message-box .el-message-box__header) {
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  background: #f8f5ef;
}

:global(body .favorite-message-box .el-message-box__title) {
  color: #111827;
  font-size: 17px;
  font-weight: 800;
}

:global(body .favorite-message-box .el-message-box__content) {
  padding: 18px 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
}

:global(body .favorite-message-box .el-message-box__btns) {
  padding: 0 20px 18px;
}

:global(body .favorite-message-confirm.el-button--primary) {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

:global(body .favorite-message-cancel.el-button) {
  border-color: rgba(17, 24, 39, 0.16);
  background: #fff;
  color: #111827;
}

@media (max-width: 720px) {
  :global(body .user-favorite.user-favorite .page-header) {
    align-items: flex-start;
    gap: 10px;
    flex-direction: column;
  }

  :global(body .user-favorite.user-favorite .skeleton-list),
  :global(body .user-favorite.user-favorite .favorite-grid) {
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }

  :global(body .user-favorite.user-favorite .card-actions) {
    flex-direction: column;
  }
}
</style>
