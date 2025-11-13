<template>
  <div v-loading="loading" class="product-detail-container">
    <div v-if="product" class="detail-content">
      <!-- 面包屑导航 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/products' }">商品列表</el-breadcrumb-item>
        <el-breadcrumb-item>{{ product.categoryName }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ product.productName }}</el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 商品主要信息 -->
      <div class="product-main">
        <!-- 左侧图片 -->
        <div class="image-section">
          <div class="main-image">
            <img :src="currentImage" alt="商品图片" />
          </div>
          <div class="image-thumbnails">
            <div
              v-for="(img, index) in product.imageList || []"
              :key="index"
              class="thumbnail"
              :class="{ active: currentImage === img }"
              @click="currentImage = img"
            >
              <img :src="img" alt="缩略图" />
            </div>
          </div>
        </div>

        <!-- 右侧信息 -->
        <div class="info-section">
          <div class="tags">
            <el-tag v-if="product.isHot" type="danger">热卖</el-tag>
            <el-tag v-if="product.isNew" type="success">新品</el-tag>
            <el-tag v-if="product.isRecommend" type="warning">推荐</el-tag>
          </div>

          <h1 class="product-title">{{ product.productName }}</h1>
          <p class="product-subtitle">{{ product.subTitle }}</p>

          <div class="rating-section">
            <el-rate
              :model-value="Math.round((product.avgRating || 0) * 2) / 2"
              disabled
              show-score
              :score-template="`${(product.avgRating || 0).toFixed(1)}`"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            />
            <span class="rating-text">{{ product.avgRating }}分</span>
            <span class="divider">|</span>
            <span class="review-count">{{ product.reviewCount }}条评价</span>
            <span class="divider">|</span>
            <span class="good-rate">好评率{{ product.goodRate }}%</span>
          </div>

          <div class="price-section">
            <div class="price-row">
              <span class="label">价格</span>
              <div class="price-content">
                <span class="current-price">¥{{ product.price }}</span>
                <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</span>
              </div>
            </div>
            <div class="info-row">
              <span class="label">品牌</span>
              <span class="value">{{ product.brand }}</span>
            </div>
            <div class="info-row">
              <span class="label">销量</span>
              <span class="value">{{ product.sales }}件</span>
            </div>
            <div class="info-row">
              <span class="label">库存</span>
              <span class="value" :class="{ 'out-of-stock': product.stock === 0 }">
                {{ product.stock > 0 ? `${product.stock}件` : '缺货' }}
              </span>
            </div>
          </div>

          <div class="quantity-section">
            <span class="label">数量</span>
            <el-input-number 
              v-model="quantity" 
              :min="1" 
              :max="product.stock"
              :disabled="product.stock === 0"
            />
            <span class="stock-tip">库存 {{ product.stock }} 件</span>
          </div>

          <div class="action-buttons">
            <el-button 
              type="primary" 
              size="large" 
              :disabled="product.stock === 0"
              :loading="addingToCart"
              @click="addToCart"
            >
              <el-icon><ShoppingCart /></el-icon>
              加入购物车
            </el-button>
            <el-button 
              size="large" 
              type="danger"
              :disabled="product.stock === 0"
              @click="buyNow"
            >
              立即购买
            </el-button>
          </div>

          <!-- 库存不足提示 -->
          <el-alert
            v-if="product.stock === 0"
            title="该商品暂时缺货,请关注其他商品"
            type="warning"
            :closable="false"
            style="margin-top: 15px"
          />
        </div>
      </div>

      <!-- 详情和评价Tab -->
      <div class="detail-tabs">
        <el-tabs v-model="activeTab" @tab-click="handleTabChange">
          <!-- 商品详情 -->
          <el-tab-pane label="商品详情" name="detail">
            <div class="specifications">
              <h3>规格参数</h3>
              <div class="spec-content" v-html="formatSpecifications(product.specifications)"></div>
            </div>
            <div class="product-description" v-html="product.detail"></div>
          </el-tab-pane>

          <!-- 商品评价 -->
          <el-tab-pane label="商品评价" name="reviews">
            <div class="reviews-section">
              <!-- 评价统计 -->
              <div v-if="reviewStats" class="review-stats">
                <div class="stats-left">
                  <div class="avg-score">{{ reviewStats.avgRating }}</div>
                  <el-rate
                    :model-value="Math.round((reviewStats.avgRating || 0) * 2) / 2"
                    disabled
                    :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                  />
                  <div class="stats-text">{{ reviewStats.reviewCount }}条评价</div>
                </div>
                <div class="stats-right">
                  <div class="star-row">
                    <span>5星</span>
                    <el-progress
                      :percentage="reviewStats.reviewCount ? (reviewStats.fiveStar / reviewStats.reviewCount * 100) : 0"
                      :stroke-width="10"
                    />
                    <span>{{ reviewStats.fiveStar }}</span>
                  </div>

                  <div class="star-row">
                    <span>4星</span>
                    <el-progress
                      :percentage="reviewStats.reviewCount ? (reviewStats.fourStar / reviewStats.reviewCount * 100) : 0"
                      :stroke-width="10"
                    />
                    <span>{{ reviewStats.fourStar }}</span>
                  </div>

                  <div class="star-row">
                    <span>3星</span>
                    <el-progress
                      :percentage="reviewStats.reviewCount ? (reviewStats.threeStar / reviewStats.reviewCount * 100) : 0"
                      :stroke-width="10"
                    />
                    <span>{{ reviewStats.threeStar }}</span>
                  </div>

                  <div class="star-row">
                    <span>2星</span>
                    <el-progress
                      :percentage="reviewStats.reviewCount ? (reviewStats.twoStar / reviewStats.reviewCount * 100) : 0"
                      :stroke-width="10"
                    />
                    <span>{{ reviewStats.twoStar }}</span>
                  </div>

                  <div class="star-row">
                    <span>1星</span>
                    <el-progress
                      :percentage="reviewStats.reviewCount ? (reviewStats.oneStar / reviewStats.reviewCount * 100) : 0"
                      :stroke-width="10"
                    />
                    <span>{{ reviewStats.oneStar }}</span>
                  </div>

                </div>
              </div>

              <!-- 评价列表 -->
              <div class="review-list">
                <div v-for="review in reviews" :key="review.id" class="review-item">
                  <div class="review-header">
                    <img :src="review.avatar" class="avatar" alt="头像" />
                    <div class="user-info">
                      <div class="username">{{ review.nickname }}</div>
                      <el-rate
                        :model-value="review.rating || 0"
                        disabled
                        :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                      />
                    </div>
                    <div class="review-date">{{ formatDate(review.createTime) }}</div>
                  </div>
                  <div class="review-content">{{ review.content }}</div>
                  <div v-if="review.imageList && review.imageList.length" class="review-images">
                    <img
                      v-for="(img, index) in review.imageList"
                      :key="index"
                      :src="img"
                      alt="评价图片"
                      @click="previewImage(img)"
                    />
                  </div>
                  <div v-if="review.reply" class="review-reply">
                    <span class="reply-label">商家回复:</span>
                    <span>{{ review.reply }}</span>
                  </div>
                </div>

                <!-- 评价分页 -->
                <div class="review-pagination">
                  <el-pagination
                    v-model:current-page="reviewPage"
                    :page-size="10"
                    :total="reviewTotal"
                    layout="prev, pager, next"
                    @current-change="loadReviews"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from '@element-plus/icons-vue'
import { getProductDetail } from '@/api/product'
import { getProductReviews, getReviewStatistics } from '@/api/review'
import { addToCart as addToCartApi } from '@/api/cart' // 新增导入

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const product = ref(null)
const currentImage = ref('')
const quantity = ref(1)
const activeTab = ref('detail')
const reviewStats = ref(null)
const reviews = ref([])
const reviewPage = ref(1)
const reviewTotal = ref(0)
const addingToCart = ref(false) // 新增:加入购物车loading状态

// 加载商品详情
const loadProductDetail = async () => {
  loading.value = true
  try {
    const productId = route.params.id
    const res = await getProductDetail(productId)
    product.value = res.data

    // 安全转换数值
    product.value.avgRating = Number(product.value.avgRating) || 0
    product.value.goodRate = Number(product.value.goodRate) || 0
    product.value.reviewCount = Number(product.value.reviewCount) || 0

    currentImage.value = product.value.imageList?.[0] || product.value.mainImage

    // 加载评价统计
    loadReviewStats()
  } catch (error) {
    ElMessage.error('加载商品详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载评价统计
const loadReviewStats = async () => {
  try {
    const res = await getReviewStatistics(route.params.id)
    const data = res.data || {}

    reviewStats.value = {
      reviewCount: Number(data.reviewCount ?? 0),
      avgRating: Number(data.avgRating ?? 0),
      goodRate: Number(data.goodRate ?? 0),
      oneStar: Number(data.oneStar ?? 0),
      twoStar: Number(data.twoStar ?? 0),
      threeStar: Number(data.threeStar ?? 0),
      fourStar: Number(data.fourStar ?? 0),
      fiveStar: Number(data.fiveStar ?? 0)
    }
  } catch (error) {
    console.error('加载评价统计失败', error)
    reviewStats.value = {
      reviewCount: 0,
      avgRating: 0,
      goodRate: 0,
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0
    }
  }
}

// 加载评价列表
const loadReviews = async () => {
  try {
    const res = await getProductReviews(route.params.id, reviewPage.value, 10)
    reviews.value = res.data.records
    reviewTotal.value = res.data.total
  } catch (error) {
    ElMessage.error('加载评价列表失败')
  }
}

// 格式化规格参数
const formatSpecifications = (specifications) => {
  if (!specifications) return ''
  try {
    const specs = JSON.parse(specifications)
    let html = '<table class="spec-table">'
    for (const [key, value] of Object.entries(specs)) {
      html += `<tr><td class="spec-key">${key}</td><td class="spec-value">${value}</td></tr>`
    }
    html += '</table>'
    return html
  } catch {
    return specifications
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 加入购物车 - 新增真实功能
const addToCart = async () => {
  // 检查登录状态
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }

  // 检查库存
  if (product.value.stock === 0) {
    ElMessage.warning('商品缺货')
    return
  }

  if (quantity.value > product.value.stock) {
    ElMessage.warning('购买数量超过库存')
    return
  }

  try {
    addingToCart.value = true
    
    await addToCartApi({
      productId: product.value.id,
      quantity: quantity.value
    })
    
    ElMessage.success('已加入购物车')
    
    // 触发购物车更新事件
    window.dispatchEvent(new CustomEvent('cart-updated'))
    
    // 重置数量
    quantity.value = 1
    
  } catch (error) {
    ElMessage.error(error.message || '加入购物车失败')
  } finally {
    addingToCart.value = false
  }
}

// 立即购买 - 新增真实功能
const buyNow = async () => {
  // 检查登录状态
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }

  // 检查库存
  if (product.value.stock === 0) {
    ElMessage.warning('商品缺货')
    return
  }

  try {
    // 先加入购物车
    await addToCartApi({
      productId: product.value.id,
      quantity: quantity.value
    })
    
    // 触发购物车更新事件
    window.dispatchEvent(new CustomEvent('cart-updated'))
    
    // 跳转到购物车页面
    router.push('/cart')
    
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 预览图片
const previewImage = (img) => {
  console.log('预览图片', img)
}

// Tab 切换事件
const handleTabChange = (tab) => {
  if (tab.props?.name === 'reviews') {
    console.log('切换到评价Tab')
    loadReviews()
  }
}

onMounted(() => {
  loadProductDetail()
})
</script>

<style scoped lang="scss">
.product-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb {
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.product-main {
  display: flex;
  gap: 40px;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.image-section {
  flex-shrink: 0;
  width: 500px;

  .main-image {
    width: 100%;
    height: 500px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 15px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .image-thumbnails {
    display: flex;
    gap: 10px;

    .thumbnail {
      width: 80px;
      height: 80px;
      border: 2px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      overflow: hidden;

      &.active,
      &:hover {
        border-color: #409EFF;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
}

.info-section {
  flex: 1;

  .tags {
    margin-bottom: 15px;

    .el-tag {
      margin-right: 10px;
    }
  }

  .product-title {
    font-size: 24px;
    margin-bottom: 10px;
  }

  .product-subtitle {
    font-size: 14px;
    color: #909399;
    margin-bottom: 20px;
  }

  .rating-section {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px 0;
    border-bottom: 1px solid #e4e7ed;

    .rating-text {
      font-weight: bold;
      color: #f56c6c;
    }

    .divider {
      color: #dcdfe6;
    }

    .review-count,
    .good-rate {
      color: #909399;
    }
  }

  .price-section {
    padding: 20px 0;
    border-bottom: 1px solid #e4e7ed;

    .price-row,
    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 15px;

      .label {
        width: 80px;
        color: #606266;
      }

      .price-content {
        display: flex;
        align-items: baseline;
        gap: 15px;

        .current-price {
          font-size: 32px;
          color: #f56c6c;
          font-weight: bold;
        }

        .original-price {
          font-size: 18px;
          color: #909399;
          text-decoration: line-through;
        }
      }

      .value {
        color: #303133;
        
        &.out-of-stock {
          color: #f56c6c;
          font-weight: bold;
        }
      }
    }
  }

  .quantity-section {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 0;
    border-bottom: 1px solid #e4e7ed;

    .label {
      width: 80px;
      color: #606266;
    }
    
    .stock-tip {
      font-size: 14px;
      color: #909399;
    }
  }

  .action-buttons {
    padding-top: 30px;
    display: flex;
    gap: 20px;

    .el-button {
      padding: 15px 50px;
      font-size: 16px;
      
      .el-icon {
        margin-right: 6px;
      }
    }
  }
}

.detail-tabs {
  background: #fff;
  padding: 30px;
  border-radius: 8px;

  .specifications {
    margin-bottom: 30px;

    h3 {
      font-size: 18px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #409EFF;
    }

    :deep(.spec-table) {
      width: 100%;
      border-collapse: collapse;

      td {
        padding: 12px;
        border: 1px solid #e4e7ed;
      }

      .spec-key {
        background: #f5f7fa;
        width: 200px;
        font-weight: bold;
      }
    }
  }

  .product-description {
    line-height: 1.8;
    color: #606266;
  }
}

.reviews-section {
  .review-stats {
    display: flex;
    gap: 60px;
    padding: 30px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 30px;

    .stats-left {
      text-align: center;

      .avg-score {
        font-size: 48px;
        color: #f56c6c;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .stats-text {
        margin-top: 10px;
        color: #909399;
      }
    }

    .stats-right {
      flex: 1;

      .star-row {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;

        > span:first-child {
          width: 40px;
        }

        .el-progress {
          flex: 1;
        }

        > span:last-child {
          width: 40px;
          text-align: right;
        }
      }
    }
  }

  .review-list {
    .review-item {
      padding: 20px 0;
      border-bottom: 1px solid #e4e7ed;

      .review-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;

        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          margin-right: 15px;
        }

        .user-info {
          flex: 1;

          .username {
            margin-bottom: 5px;
            font-weight: bold;
          }
        }

        .review-date {
          color: #909399;
        }
      }

      .review-content {
        line-height: 1.6;
        margin-bottom: 15px;
      }

      .review-images {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;

        img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.3s;

          &:hover {
            transform: scale(1.1);
          }
        }
      }

      .review-reply {
        background: #f5f7fa;
        padding: 15px;
        border-radius: 4px;

        .reply-label {
          color: #409EFF;
          font-weight: bold;
          margin-right: 10px;
        }
      }
    }

    .review-pagination {
      display: flex;
      justify-content: center;
      padding: 30px 0;
    }
  }
}
</style>