<template>
  <div v-loading="loading" class="pd-page">
    <div v-if="product" class="pd-wrap">
      <!-- ── Compact sticky header ──────────────────────── -->
      <header class="pd-header">
        <div class="pd-header__inner">
          <div class="pd-crumb">
            <span class="c-item" @click="router.push('/')">首页</span>
            <span class="c-sep">›</span>
            <span class="c-item" @click="router.push('/products')">商品列表</span>
            <span class="c-sep">›</span>
            <span class="c-item" @click="router.push(`/products?categoryId=${product.categoryId}`)">{{ product.categoryName }}</span>
            <span class="c-sep">›</span>
            <span class="c-item current">{{ product.productName }}</span>
          </div>
        </div>
      </header>

      <!-- ── Main: image + info ─────────────────────────── -->
      <section class="pd-main">
        <!-- 左侧图册 -->
        <div class="pd-gallery">
          <div class="pd-main-img">
            <img :src="currentImage" alt="商品图片" />
            <div v-if="product.originalPrice && product.originalPrice > product.price" class="pd-disc">
              {{ Math.round((1 - product.price / product.originalPrice) * 100) }}% OFF
            </div>
          </div>
          <div class="pd-thumbs">
            <div
              v-for="(img, index) in product.imageList || []"
              :key="index"
              class="pd-thumb"
              :class="{ active: currentImage === img }"
              @click="currentImage = img"
            >
              <img :src="img" alt="缩略图" />
            </div>
          </div>
        </div>

        <!-- 右侧信息 -->
        <div class="pd-info">
          <!-- 顶部标签 -->
          <div v-if="product.isHot || product.isNew || product.isRecommend" class="pd-pills">
            <span v-if="product.isHot" class="pill pill-hot">HOT · 热卖</span>
            <span v-if="product.isNew" class="pill pill-new">NEW · 新品</span>
            <span v-if="product.isRecommend" class="pill pill-rec">RECOMMEND · 推荐</span>
          </div>

          <div class="pd-kicker">— PRODUCT {{ String(product.id).padStart(4, '0') }}</div>
          <h1 class="pd-title">{{ product.productName }}</h1>
          <p class="pd-sub">{{ product.subTitle || '—' }}</p>

          <!-- 评分条 -->
          <div class="pd-rating">
            <el-rate
              :model-value="Math.round((product.avgRating || 0) * 2) / 2"
              disabled
              :colors="['#c7a572', '#c7a572', '#c7a572']"
              void-color="rgba(255,255,255,0.18)"
            />
            <span class="r-score">{{ (product.avgRating || 0).toFixed(1) }}</span>
            <span class="r-sep">·</span>
            <span class="r-item">{{ product.reviewCount }}条评价</span>
            <span class="r-sep">·</span>
            <span class="r-item">好评率 <b>{{ product.goodRate }}%</b></span>
          </div>

          <!-- 价格框（高亮） -->
          <div class="pd-price">
            <div class="pp-row">
              <span class="pp-label">到手价</span>
              <div class="pp-content">
                <span class="pp-sym">¥</span>
                <span class="pp-num">{{ product.price }}</span>
                <span v-if="product.originalPrice && product.originalPrice > product.price" class="pp-old">
                  原价 ¥{{ product.originalPrice }}
                </span>
              </div>
            </div>
            <div v-if="productTags.length > 0" class="pp-tags">
              <span class="pp-tags__label">标签</span>
              <div class="pp-tags__list">
                <span
                  v-for="(tag, index) in productTags"
                  :key="index"
                  class="pp-tag"
                >{{ tag }}</span>
              </div>
            </div>
          </div>

          <!-- 基础信息表 -->
          <div class="pd-meta">
            <div class="pm-row">
              <span class="pm-label">品牌</span>
              <span class="pm-value">{{ product.brand || '—' }}</span>
            </div>
            <div class="pm-row">
              <span class="pm-label">销量</span>
              <span class="pm-value">{{ product.sales }}件</span>
            </div>
            <div class="pm-row">
              <span class="pm-label">库存</span>
              <span class="pm-value" :class="{ 'out': product.stock === 0 }">
                {{ product.stock > 0 ? `${product.stock}件` : '缺货' }}
              </span>
            </div>
            <div class="pm-row">
              <span class="pm-label">数量</span>
              <div class="pm-qty">
                <button
                  class="qty-btn"
                  :disabled="quantity <= 1 || product.stock === 0"
                  @click="quantity > 1 && quantity--"
                >−</button>
                <input
                  v-model.number="quantity"
                  class="qty-input"
                  type="number"
                  :min="1"
                  :max="product.stock"
                  :disabled="product.stock === 0"
                />
                <button
                  class="qty-btn"
                  :disabled="quantity >= product.stock || product.stock === 0"
                  @click="quantity < product.stock && quantity++"
                >+</button>
              </div>
            </div>
          </div>

          <!-- 缺货提示 -->
          <div v-if="product.stock === 0" class="pd-out">
            <span class="out-dot">●</span>
            <span>该商品暂时缺货，请关注其他商品</span>
          </div>

          <!-- 主 CTA -->
          <div class="pd-cta">
            <button
              class="cta cta-cart"
              :disabled="product.stock === 0 || addingToCart"
              @click="addToCart"
            >
              <el-icon><ShoppingCart /></el-icon>
              <span>{{ addingToCart ? '加入中...' : '加入购物车' }}</span>
            </button>
            <button
              class="cta cta-buy"
              :disabled="product.stock === 0"
              @click="buyNow"
            >
              <span>立即购买</span>
            </button>
            <button
              class="cta-fav"
              :class="{ active: isFavorited }"
              :disabled="favoriteLoading"
              @click="handleToggleFavorite"
            >
              <el-icon><StarFilled v-if="isFavorited" /><Star v-else /></el-icon>
              <span>{{ isFavorited ? '已收藏' : '收藏' }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── Detail / Review Tabs ───────────────────────── -->
      <section class="pd-tabs">
        <div class="tabs-head">
          <span
            class="tab-item"
            :class="{ active: activeTab === 'detail' }"
            @click="activeTab = 'detail'; handleTabChange({ props: { name: 'detail' } })"
          >商品详情</span>
          <span
            class="tab-item"
            :class="{ active: activeTab === 'reviews' }"
            @click="activeTab = 'reviews'; handleTabChange({ props: { name: 'reviews' } })"
          >
            商品评价
            <span v-if="product.reviewCount" class="tab-count">{{ product.reviewCount }}</span>
          </span>
        </div>

        <div class="tabs-body">
          <!-- 详情 -->
          <div v-show="activeTab === 'detail'" class="tab-pane">
            <div class="specs">
              <div class="sec-head">
                <div class="sec-head__en">— SPECIFICATIONS</div>
                <h3 class="sec-head__cn">规格参数</h3>
              </div>
              <div class="spec-body" v-html="formatSpecifications(product.specifications)"></div>
            </div>
            <div class="desc">
              <div class="sec-head">
                <div class="sec-head__en">— DESCRIPTION</div>
                <h3 class="sec-head__cn">商品描述</h3>
              </div>
              <div class="desc-body" v-html="product.detail"></div>
            </div>
          </div>

          <!-- 评价 -->
          <div v-show="activeTab === 'reviews'" class="tab-pane">
            <!-- 统计 -->
            <div v-if="reviewStats" class="rv-stats">
              <div class="rvs-score">
                <div class="rvs-num">{{ (reviewStats.avgRating || 0).toFixed(1) }}</div>
                <el-rate
                  :model-value="Math.round((reviewStats.avgRating || 0) * 2) / 2"
                  disabled
                  :colors="['#c7a572', '#c7a572', '#c7a572']"
                  void-color="rgba(255,255,255,0.18)"
                />
                <div class="rvs-count">{{ reviewStats.reviewCount }}条评价</div>
              </div>
              <div class="rvs-bars">
                <div
                  v-for="row in [
                    { n: 5, count: reviewStats.fiveStar },
                    { n: 4, count: reviewStats.fourStar },
                    { n: 3, count: reviewStats.threeStar },
                    { n: 2, count: reviewStats.twoStar },
                    { n: 1, count: reviewStats.oneStar }
                  ]"
                  :key="row.n"
                  class="star-row"
                  :class="{ active: filterRating === row.n }"
                  @click="handleFilterRating(row.n)"
                >
                  <span class="sr-label">{{ row.n }} 星</span>
                  <div class="sr-bar">
                    <div
                      class="sr-bar__fill"
                      :style="{ width: (reviewStats.reviewCount ? (row.count / reviewStats.reviewCount * 100) : 0) + '%' }"
                    ></div>
                  </div>
                  <span class="sr-count">{{ row.count }}</span>
                </div>
                <div class="rvs-filters">
                  <button
                    class="rv-chip"
                    :class="{ active: filterRating === 0 && !filterHasImages }"
                    @click="handleFilterRating(0)"
                  >全部评价</button>
                  <button
                    class="rv-chip"
                    :class="{ active: filterHasImages }"
                    @click="handleFilterHasImages"
                  >有图评价 · {{ reviewStats.hasImagesCount || 0 }}</button>
                </div>
              </div>
            </div>

            <!-- 排序 -->
            <div class="rv-sort">
              <span class="rvs-label">排序</span>
              <div class="rvs-tabs">
                <span
                  v-for="opt in [
                    { v: 1, label: '最新评价' },
                    { v: 2, label: '点赞最多' },
                    { v: 3, label: '评分最高' },
                    { v: 4, label: '评分最低' }
                  ]"
                  :key="opt.v"
                  class="rvs-tab"
                  :class="{ active: sortType === opt.v }"
                  @click="sortType = opt.v; handleSortChange()"
                >{{ opt.label }}</span>
              </div>
            </div>

            <!-- 评价列表 -->
            <div class="rv-list" v-loading="reviewsLoading">
              <div v-for="review in reviews" :key="review.id" class="rv-item">
                <div class="rv-head">
                  <img :src="review.avatar" class="rv-avatar" alt="头像" />
                  <div class="rv-who">
                    <div class="rv-name">
                      {{ review.nickname }}
                      <span v-if="review.isTop === 1" class="rv-top">📌 置顶</span>
                    </div>
                    <el-rate
                      :model-value="review.rating || 0"
                      disabled
                      :colors="['#c7a572', '#c7a572', '#c7a572']"
                      void-color="rgba(255,255,255,0.18)"
                      size="small"
                    />
                  </div>
                  <div class="rv-date">{{ formatDate(review.createTime) }}</div>
                </div>
                <div class="rv-body">{{ review.content }}</div>
                <div v-if="review.imageList && review.imageList.length" class="rv-imgs">
                  <img
                    v-for="(img, index) in review.imageList"
                    :key="index"
                    :src="img"
                    alt="评价图片"
                    @click="previewImage(img)"
                  />
                </div>
                <div v-if="review.replyContent" class="rv-reply">
                  <span class="rv-reply__label">商家回复</span>
                  <span>{{ review.replyContent }}</span>
                </div>
                <div class="rv-acts">
                  <button
                    class="rv-btn"
                    :class="{ active: review.isLiked }"
                    @click="handleLikeReview(review)"
                  >
                    <el-icon><StarFilled v-if="review.isLiked" /><Star v-else /></el-icon>
                    {{ review.isLiked ? '已赞' : '点赞' }}
                    <span v-if="review.likeCount > 0">· {{ review.likeCount }}</span>
                  </button>
                  <button class="rv-btn rv-btn--ghost" @click="handleReport(review)">
                    <el-icon><WarnTriangleFilled /></el-icon>
                    举报
                  </button>
                </div>
              </div>

              <div v-if="!reviewsLoading && reviews.length === 0" class="rv-empty">
                <div class="rv-empty__icon">◎</div>
                <div class="rv-empty__text">暂无评价</div>
              </div>

              <div v-if="reviewTotal > 0" class="rv-pager">
                <el-pagination
                  v-model:current-page="reviewPage"
                  :page-size="reviewPageSize"
                  :total="reviewTotal"
                  :page-sizes="[10, 20, 50]"
                  layout="prev, pager, next, sizes, total"
                  @current-change="loadReviews"
                  @size-change="handleReviewSizeChange"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Similar products ──────────────────────────── -->
      <section v-if="similarProducts.length > 0" class="pd-similar">
        <div class="sec-head sec-head--row">
          <div>
            <div class="sec-head__en">— YOU MAY ALSO LIKE</div>
            <h3 class="sec-head__cn">相关商品</h3>
          </div>
          <span class="algo-tip">基于商品特征推荐</span>
        </div>
        <div class="sim-scroll">
          <div
            v-for="item in similarProducts"
            :key="'sim-' + item.id"
            class="sim-card"
            @click="handleSimilarClick(item)"
          >
            <div class="sim-img">
              <img :src="item.mainImage" :alt="item.productName" />
            </div>
            <div class="sim-body">
              <h4 class="sim-name">{{ item.productName }}</h4>
              <div class="sim-price">
                <span class="sp-sym">¥</span>
                <span class="sp-num">{{ item.price }}</span>
                <span v-if="item.originalPrice && item.originalPrice > item.price" class="sp-old">¥{{ item.originalPrice }}</span>
              </div>
              <div class="sim-sales">已售 {{ item.sales || 0 }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShoppingCart, StarFilled, Star, WarnTriangleFilled } from '@element-plus/icons-vue'
import { getProductDetail } from '@/api/product'
import { getProductReviews, getReviewStatistics, getReviewListAdvanced, toggleLike, reportReview } from '@/api/review'
import { addToCart as addToCartApi } from '@/api/cart'
import { getToken } from '@/utils/auth'
import { checkFavorite, toggleFavorite } from '@/api/favorite'
import { logProductBrowse, getSimilarProducts, recordRecommendClick } from '@/api/recommend'

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
const reviewPageSize = ref(10)
const reviewTotal = ref(0)
const addingToCart = ref(false)

const reviewsLoading = ref(false)
const filterRating = ref(0)
const filterHasImages = ref(false)
const sortType = ref(1)

const isFavorited = ref(false)
const favoriteLoading = ref(false)

const similarProducts = ref([])

const loadProductDetail = async () => {
  loading.value = true
  try {
    const productId = route.params.id
    const res = await getProductDetail(productId)
    product.value = res.data

    product.value.avgRating = Number(product.value.avgRating) || 0
    product.value.goodRate = Number(product.value.goodRate) || 0
    product.value.reviewCount = Number(product.value.reviewCount) || 0

    currentImage.value = product.value.imageList?.[0] || product.value.mainImage

    loadReviewStats()
  } catch (error) {
    ElMessage.error('加载商品详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const productTags = computed(() => {
  if (!product.value?.tags) return []
  try {
    const tags = JSON.parse(product.value.tags)
    return Array.isArray(tags) ? tags : []
  } catch (error) {
    return product.value.tags.split(',').map(t => t.trim()).filter(Boolean)
  }
})

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
      fiveStar: Number(data.fiveStar ?? 0),
      hasImagesCount: Number(data.hasImagesCount ?? 0)
    }
  } catch (error) {
    reviewStats.value = {
      reviewCount: 0, avgRating: 0, goodRate: 0,
      oneStar: 0, twoStar: 0, threeStar: 0, fourStar: 0, fiveStar: 0,
      hasImagesCount: 0
    }
  }
}

const loadReviews = async () => {
  reviewsLoading.value = true
  try {
    const res = await getReviewListAdvanced({
      productId: route.params.id,
      rating: filterRating.value,
      hasImages: filterHasImages.value ? 1 : 0,
      sortType: sortType.value,
      page: reviewPage.value,
      pageSize: reviewPageSize.value
    })
    reviews.value = res.data.list || []
    reviewTotal.value = res.data.total || 0
  } catch (error) {
    ElMessage.error('加载评价列表失败')
  } finally {
    reviewsLoading.value = false
  }
}

const handleFilterRating = (rating) => {
  // 同星级再次点击 → 取消选择回到「全部」(rating=0)
  // 不同星级 / 点「全部评价」按钮 → 设置 rating
  // 任一情况都必须清掉「有图评价」过滤，否则 UI 看起来切换了但实际仍在筛有图
  if (filterRating.value === rating && !filterHasImages.value) {
    filterRating.value = 0
  } else {
    filterRating.value = rating
  }
  filterHasImages.value = false
  reviewPage.value = 1
  loadReviews()
}

const handleFilterHasImages = () => {
  filterHasImages.value = !filterHasImages.value
  if (filterHasImages.value) {
    filterRating.value = 0
  }
  reviewPage.value = 1
  loadReviews()
}

const handleSortChange = () => {
  reviewPage.value = 1
  loadReviews()
}

const handleReviewSizeChange = (size) => {
  reviewPageSize.value = size
  reviewPage.value = 1
  loadReviews()
}

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

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const addToCart = async () => {
  const token = getToken()
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
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
    await addToCartApi({ productId: product.value.id, quantity: quantity.value })
    ElMessage.success('已加入购物车')
    window.dispatchEvent(new CustomEvent('cart-updated'))
    quantity.value = 1
  } catch (error) {
    ElMessage.error(error.message || '加入购物车失败')
  } finally {
    addingToCart.value = false
  }
}

const buyNow = async () => {
  const token = getToken()
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (product.value.stock === 0) {
    ElMessage.warning('商品缺货')
    return
  }
  try {
    await addToCartApi({ productId: product.value.id, quantity: quantity.value })
    window.dispatchEvent(new CustomEvent('cart-updated'))
    router.push('/cart')
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const previewImage = (img) => {
  console.log('预览图片', img)
}

const handleLikeReview = async (review) => {
  const token = getToken()
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await toggleLike(review.id)
    ElMessage.success(review.isLiked ? '取消点赞成功' : '点赞成功')
    loadReviews()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleReport = async (review) => {
  const token = getToken()
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定举报该评价吗？举报次数达到3次后，该评价将被暂时隐藏等待管理员审核。',
      '举报评价',
      {
        confirmButtonText: '确认举报',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await reportReview(review.id)
    ElMessage.success('举报成功，感谢您的反馈')
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '操作失败')
  }
}

const handleTabChange = (tab) => {
  if (tab.props?.name === 'reviews') {
    loadReviews()
  }
}

const checkFavoriteStatus = async () => {
  try {
    const res = await checkFavorite(route.params.id)
    isFavorited.value = res.data.isFavorite
  } catch (e) {}
}

const handleToggleFavorite = async () => {
  if (!getToken()) {
    ElMessage.warning('请先登录后再收藏')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  favoriteLoading.value = true
  try {
    const res = await toggleFavorite(route.params.id)
    isFavorited.value = res.data.isFavorite
    ElMessage.success(res.data.message)
  } catch (e) {
    ElMessage.error('操作失败，请重试')
  } finally {
    favoriteLoading.value = false
  }
}

const loadSimilarProducts = async () => {
  try {
    const res = await getSimilarProducts(route.params.id, { limit: 10 })
    similarProducts.value = res.data || []
  } catch (error) {
    similarProducts.value = []
  }
}

const handleSimilarClick = (item) => {
  try {
    recordRecommendClick({ recommendType: 'product', targetId: item.id })
  } catch (e) {}
  router.push(`/product/${item.id}`)
}

const initProductPage = () => {
  loadProductDetail()
  if (getToken()) {
    checkFavoriteStatus()
  }
  loadSimilarProducts()
  try {
    if (getToken()) {
      logProductBrowse({ productId: route.params.id, source: 'detail' })
    }
  } catch (e) {}
}

onMounted(() => {
  initProductPage()
})

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      initProductPage()
    }
  }
)
</script>

<style scoped lang="scss">
$bg-0:#000;
$bg-1:#0b0b0f;
$bg-2:#12121a;
$bg-3:#1a1a22;
$line:rgba(255,255,255,0.09);
$line-2:rgba(255,255,255,0.16);
$line-3:rgba(255,255,255,0.26);
$tx-1:#f4f4f4;
$tx-2:rgba(255,255,255,0.75);
$tx-3:rgba(255,255,255,0.5);
$tx-4:rgba(255,255,255,0.3);
$accent:#c7a572;
$accent-hot:#ff8585;
$accent-new:#a4e2b8;
$serif:'Cormorant Garamond','Playfair Display','Noto Serif SC','Songti SC','宋体',serif;
$sans:'Inter','PingFang SC','Microsoft YaHei','Helvetica Neue',Arial,sans-serif;
$mono:'SF Mono','JetBrains Mono','Menlo',monospace;

.pd-page {
  min-height: 100vh;
  background: $bg-0;
  color: $tx-1;
  padding-bottom: 100px;
  font-family: $sans;
}

.pd-wrap {
  max-width: 1440px;
  margin: 0 auto;
}

// ── Header ───────────────────────────────────────
.pd-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(0,0,0,0.88);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid $line;

  &__inner {
    padding: 18px 40px;
  }
}

.pd-crumb {
  font-size: 12px;
  color: $tx-3;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  .c-item {
    cursor: pointer;
    transition: color 0.2s ease;
    &:hover { color: $tx-1; }
    &.current { color: $accent; cursor: default; }
  }
  .c-sep {
    margin: 0 8px;
    color: $tx-4;
  }
}

// ── Main ─────────────────────────────────────────
.pd-main {
  display: grid;
  grid-template-columns: minmax(0, 520px) minmax(0, 1fr);
  gap: 56px;
  padding: 40px;
}

// Gallery
.pd-gallery {
  position: sticky;
  top: 80px;
  align-self: start;
}

.pd-main-img {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: $bg-1;
  border: 1px solid $line;
  overflow: hidden;
  margin-bottom: 16px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  &:hover img { transform: scale(1.04); }
}

.pd-disc {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 6px 10px;
  background: $accent;
  color: #111;
  font-family: $mono;
  font-size: 12px;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.pd-thumbs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pd-thumb {
  width: 72px;
  height: 72px;
  border: 1px solid $line;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
  opacity: 0.6;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    opacity: 1;
    border-color: $line-2;
  }
  &.active {
    opacity: 1;
    border-color: $accent;
    box-shadow: 0 0 0 1px $accent;
  }
}

// Info panel
.pd-info { min-width: 0; }

.pd-pills {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
  flex-wrap: wrap;

  .pill {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 1.5px;
    padding: 4px 8px;
    border: 1px solid currentColor;
    line-height: 1;
    background: rgba(0,0,0,0.5);
  }
  .pill-hot { color: $accent-hot; }
  .pill-new { color: $accent-new; }
  .pill-rec { color: $accent; }
}

.pd-kicker {
  font-family: $mono;
  font-size: 10.5px;
  letter-spacing: 2.5px;
  color: $accent;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.pd-title {
  font-family: $serif;
  font-weight: 500;
  font-size: 38px;
  letter-spacing: 2px;
  color: $tx-1;
  margin: 0 0 10px;
  line-height: 1.2;
}

.pd-sub {
  font-family: $sans;
  font-size: 14px;
  color: $tx-3;
  margin: 0 0 20px;
  line-height: 1.5;
}

.pd-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 0;
  border-top: 1px solid $line;
  border-bottom: 1px solid $line;
  flex-wrap: wrap;

  :deep(.el-rate) { height: 16px; }
  :deep(.el-rate__icon) { font-size: 14px; margin-right: 2px; }

  .r-score {
    font-family: $mono;
    font-size: 14px;
    font-weight: 600;
    color: $accent;
  }
  .r-sep { color: $tx-4; font-size: 12px; }
  .r-item {
    font-size: 13px;
    color: $tx-3;
    b { color: $accent; font-weight: 600; }
  }
}

// Price block
.pd-price {
  margin: 24px 0;
  padding: 22px 22px 20px;
  background: $bg-1;
  border: 1px solid $line-2;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: $accent;
  }

  .pp-row {
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
  }
  .pp-label {
    font-family: $sans;
    font-size: 12px;
    color: $tx-3;
    letter-spacing: 1px;
  }
  .pp-content {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .pp-sym {
    font-family: $serif;
    font-size: 22px;
    color: $accent;
  }
  .pp-num {
    font-family: $serif;
    font-size: 44px;
    font-weight: 500;
    color: $accent;
    letter-spacing: 1px;
    line-height: 1;
  }
  .pp-old {
    font-size: 13px;
    color: $tx-4;
    text-decoration: line-through;
  }

  .pp-tags {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed $line;

    &__label {
      font-size: 12px;
      color: $tx-3;
      letter-spacing: 1px;
      flex-shrink: 0;
      padding-top: 4px;
    }
    &__list {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }
  .pp-tag {
    font-family: $sans;
    font-size: 11.5px;
    padding: 3px 9px;
    color: $accent;
    border: 1px solid rgba(199,165,114,0.4);
    background: rgba(199,165,114,0.06);
  }
}

// Meta rows
.pd-meta {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;

  .pm-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid $line;

    &:last-child { border-bottom: none; }
  }
  .pm-label {
    width: 80px;
    font-size: 13px;
    color: $tx-3;
    flex-shrink: 0;
  }
  .pm-value {
    font-size: 14px;
    color: $tx-1;
    &.out { color: $accent-hot; font-weight: 500; }
  }
}

// 数量选择器
.pm-qty {
  display: inline-flex;
  border: 1px solid $line-2;
  align-items: stretch;

  .qty-btn {
    width: 34px;
    height: 34px;
    background: $bg-1;
    border: none;
    color: $tx-1;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:not(:disabled):hover {
      background: $bg-2;
      color: $accent;
    }
    &:disabled {
      color: $tx-4;
      cursor: not-allowed;
    }
  }
  .qty-input {
    width: 60px;
    height: 34px;
    background: transparent;
    border: none;
    border-left: 1px solid $line-2;
    border-right: 1px solid $line-2;
    color: $tx-1;
    text-align: center;
    font-family: $sans;
    font-size: 14px;
    outline: none;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
  }
}

// 缺货提示
.pd-out {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(255,133,133,0.06);
  border: 1px solid rgba(255,133,133,0.3);
  color: $accent-hot;
  font-size: 13px;
  margin-bottom: 20px;

  .out-dot { font-size: 10px; }
}

// CTA
.pd-cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  .cta {
    flex: 1;
    min-width: 140px;
    height: 52px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: $sans;
    font-size: 14.5px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
    background: transparent;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .el-icon { font-size: 16px; }
  }
  .cta-cart {
    border-color: $accent;
    color: $accent;
    &:not(:disabled):hover {
      background: rgba(199,165,114,0.1);
    }
  }
  .cta-buy {
    border-color: $accent;
    background: $accent;
    color: #111;
    font-weight: 600;
    &:not(:disabled):hover {
      background: lighten(#c7a572, 5%);
      border-color: lighten(#c7a572, 5%);
    }
  }
  .cta-fav {
    flex: 0 0 auto;
    height: 52px;
    padding: 0 20px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: transparent;
    border: 1px solid $line-2;
    color: $tx-2;
    font-family: $sans;
    font-size: 13.5px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:not(:disabled):hover {
      border-color: $accent;
      color: $accent;
    }
    &.active {
      border-color: $accent;
      color: $accent;
      background: rgba(199,165,114,0.08);
    }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
    .el-icon { font-size: 15px; }
  }
}

// ── Tabs ─────────────────────────────────────────
.pd-tabs {
  padding: 20px 40px 0;
}

.tabs-head {
  display: flex;
  gap: 36px;
  border-bottom: 1px solid $line-2;
  margin-bottom: 32px;
}

.tab-item {
  position: relative;
  padding: 16px 2px;
  cursor: pointer;
  font-family: $serif;
  font-size: 18px;
  letter-spacing: 1.5px;
  color: $tx-3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    left: 0; right: 0;
    bottom: -1px;
    height: 2px;
    background: transparent;
    transition: background 0.2s ease;
  }
  &:hover { color: $tx-1; }
  &.active {
    color: $accent;
    &::after { background: $accent; }
  }

  .tab-count {
    font-family: $mono;
    font-size: 11px;
    padding: 1px 6px;
    color: $tx-2;
    background: $bg-2;
    border: 1px solid $line;
    letter-spacing: 0.5px;
  }
}

.tabs-body {
  padding-bottom: 20px;
}

.sec-head {
  margin-bottom: 18px;

  &__en {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 2.5px;
    color: $accent;
    margin-bottom: 6px;
  }
  &__cn {
    font-family: $serif;
    font-size: 22px;
    letter-spacing: 1.5px;
    color: $tx-1;
    margin: 0;
    font-weight: 500;
  }
  &--row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 12px;
  }
}

// 规格参数 & 详情
.specs { margin-bottom: 48px; }

.spec-body {
  :deep(.spec-table) {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid $line;

    tr { border-bottom: 1px solid $line; }
    tr:last-child { border-bottom: none; }

    td {
      padding: 14px 18px;
      font-size: 14px;
      border: none;
    }
    .spec-key {
      background: $bg-1;
      width: 200px;
      color: $tx-3;
      font-family: $sans;
      font-weight: 400;
      border-right: 1px solid $line;
    }
    .spec-value {
      color: $tx-1;
      background: transparent;
    }
  }
}

.desc-body {
  line-height: 1.8;
  color: $tx-2;
  font-size: 14.5px;

  :deep(img) {
    max-width: 100%;
    height: auto;
    margin: 14px 0;
  }
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    color: $tx-1;
    font-family: $serif;
    margin: 20px 0 10px;
  }
  :deep(p) { margin: 10px 0; }
  :deep(a) { color: $accent; }
}

// ── Review stats ─────────────────────────────────
.rv-stats {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 40px;
  padding: 30px;
  background: $bg-1;
  border: 1px solid $line;
  margin-bottom: 28px;
}

.rvs-score {
  text-align: center;
  padding: 12px 0;
  border-right: 1px solid $line;

  .rvs-num {
    font-family: $serif;
    font-size: 54px;
    color: $accent;
    font-weight: 500;
    line-height: 1;
    margin-bottom: 10px;
  }
  :deep(.el-rate) { height: 18px; justify-content: center; }
  .rvs-count {
    margin-top: 10px;
    font-size: 12px;
    color: $tx-3;
  }
}

.rvs-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.star-row {
  display: grid;
  grid-template-columns: 48px 1fr 36px;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.2s ease;

  .sr-label {
    font-family: $sans;
    font-size: 12.5px;
    color: $tx-2;
  }
  .sr-bar {
    height: 6px;
    background: $bg-2;
    border: 1px solid $line;
    position: relative;
    overflow: hidden;
  }
  .sr-bar__fill {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    background: $accent;
    transition: width 0.5s ease;
  }
  .sr-count {
    font-family: $mono;
    font-size: 12px;
    color: $tx-3;
    text-align: right;
  }

  &:hover { background: $bg-2; }
  &.active {
    background: rgba(199,165,114,0.1);
    .sr-label { color: $accent; }
    .sr-count { color: $accent; }
  }
}

.rvs-filters {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed $line;

  .rv-chip {
    padding: 6px 12px;
    background: transparent;
    border: 1px solid $line-2;
    color: $tx-2;
    font-family: $sans;
    font-size: 12.5px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover { border-color: $line-3; color: $tx-1; }
    &.active {
      border-color: $accent;
      color: $accent;
      background: rgba(199,165,114,0.08);
    }
  }
}

// 排序
.rv-sort {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;

  .rvs-label {
    font-size: 12px;
    color: $tx-3;
  }
  .rvs-tabs {
    display: flex;
    gap: 2px;
    background: $bg-1;
    border: 1px solid $line;
    padding: 3px;
  }
  .rvs-tab {
    padding: 6px 14px;
    font-family: $sans;
    font-size: 12.5px;
    color: $tx-2;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover { color: $tx-1; }
    &.active {
      background: rgba(199,165,114,0.12);
      color: $accent;
    }
  }
}

// 评价列表
.rv-list {
  min-height: 200px;
}

.rv-item {
  padding: 22px 0;
  border-bottom: 1px solid $line;

  &:last-child { border-bottom: none; }
}

.rv-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.rv-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid $line;
}

.rv-who {
  flex: 1;
  min-width: 0;

  .rv-name {
    font-family: $sans;
    font-size: 14px;
    color: $tx-1;
    font-weight: 500;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .rv-top {
    font-family: $mono;
    font-size: 10.5px;
    color: $accent-hot;
    border: 1px solid $accent-hot;
    padding: 1px 6px;
    background: rgba(255,133,133,0.08);
  }
  :deep(.el-rate) { height: 14px; }
  :deep(.el-rate__icon) { font-size: 12px; margin-right: 1px; }
}

.rv-date {
  font-family: $mono;
  font-size: 11.5px;
  color: $tx-4;
  letter-spacing: 1px;
}

.rv-body {
  font-size: 14px;
  line-height: 1.7;
  color: $tx-2;
  margin-bottom: 14px;
  padding-left: 54px;
}

.rv-imgs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding-left: 54px;

  img {
    width: 90px;
    height: 90px;
    object-fit: cover;
    cursor: pointer;
    border: 1px solid $line;
    transition: all 0.2s ease;

    &:hover {
      border-color: $accent;
      transform: translateY(-2px);
    }
  }
}

.rv-reply {
  margin: 0 0 14px 54px;
  padding: 12px 14px;
  background: $bg-1;
  border-left: 2px solid $accent;
  font-size: 13px;
  color: $tx-2;
  line-height: 1.6;

  &__label {
    color: $accent;
    font-weight: 500;
    margin-right: 8px;
  }
}

.rv-acts {
  margin-left: 54px;
  display: flex;
  gap: 8px;

  .rv-btn {
    padding: 6px 12px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: 1px solid $line-2;
    color: $tx-2;
    font-family: $sans;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $accent;
      color: $accent;
    }
    &.active {
      border-color: $accent;
      color: $accent;
      background: rgba(199,165,114,0.08);
    }
    &--ghost:hover {
      border-color: $accent-hot;
      color: $accent-hot;
    }
    .el-icon { font-size: 13px; }
  }
}

// 评价空状态
.rv-empty {
  padding: 80px 20px;
  text-align: center;

  &__icon {
    font-family: $serif;
    font-size: 48px;
    color: $tx-4;
    margin-bottom: 12px;
  }
  &__text {
    font-family: $serif;
    font-size: 18px;
    letter-spacing: 2px;
    color: $tx-3;
  }
}

// 评价分页
.rv-pager {
  display: flex;
  justify-content: center;
  padding: 28px 0 0;
  border-top: 1px solid $line;
  margin-top: 20px;

  :deep(.el-pagination) {
    background: transparent;
    --el-pagination-bg-color: transparent;

    .btn-prev, .btn-next,
    .el-pager li {
      background: $bg-1 !important;
      color: $tx-2 !important;
      border: 1px solid $line;
      border-radius: 0;
      min-width: 32px;
      &:hover { color: $accent !important; border-color: $accent; }
    }
    .el-pager li.is-active {
      color: #111 !important;
      background: $accent !important;
      border-color: $accent;
      font-weight: 600;
    }
    .el-pagination__total,
    .el-pagination__jump { color: $tx-3; font-size: 12.5px; }
    .el-input__wrapper {
      background: $bg-1 !important;
      box-shadow: 0 0 0 1px $line inset !important;
      border-radius: 0 !important;
      .el-input__inner { color: $tx-1 !important; }
    }
  }
}

// ── Similar products ─────────────────────────────
.pd-similar {
  padding: 40px 40px 0;
  border-top: 1px solid $line;
  margin-top: 20px;

  .algo-tip {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 2px;
    padding: 4px 10px;
    color: $tx-3;
    border: 1px solid $line;
    background: $bg-1;
  }
}

.sim-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: thin;
  scrollbar-color: $line-2 transparent;

  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: $line-2; border-radius: 3px; }
}

.sim-card {
  flex-shrink: 0;
  width: 200px;
  background: $bg-1;
  border: 1px solid $line;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: $line-2;
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.5);

    .sim-img img { transform: scale(1.06); }
    .sim-name { color: $accent; }
  }
}

.sim-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: $bg-0;
  border-bottom: 1px solid $line;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
}

.sim-body { padding: 12px 14px 14px; }

.sim-name {
  font-family: $sans;
  font-size: 13px;
  font-weight: 500;
  color: $tx-1;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 34px;
  line-height: 1.35;
  transition: color 0.25s ease;
}

.sim-price {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-bottom: 5px;
  flex-wrap: wrap;

  .sp-sym {
    font-family: $serif;
    font-size: 12px;
    color: $accent;
  }
  .sp-num {
    font-family: $serif;
    font-size: 20px;
    font-weight: 500;
    color: $accent;
    line-height: 1;
  }
  .sp-old {
    margin-left: 3px;
    font-size: 11px;
    color: $tx-4;
    text-decoration: line-through;
  }
}

.sim-sales {
  font-size: 11.5px;
  color: $tx-3;
}

// ── Loading ──────────────────────────────────────
:deep(.el-loading-mask) {
  background: rgba(0,0,0,0.65) !important;
}
:deep(.el-loading-spinner .path) {
  stroke: $accent !important;
}

// ── Responsive ───────────────────────────────────
@media (max-width: 1100px) {
  .pd-main {
    grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
    gap: 36px;
    padding: 32px 28px;
  }
  .pd-tabs { padding: 16px 28px 0; }
  .pd-similar { padding: 32px 28px 0; }
  .pd-title { font-size: 30px; }
}

@media (max-width: 900px) {
  .pd-main {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 24px 20px;
  }
  .pd-gallery { position: static; }
  .pd-tabs { padding: 14px 20px 0; }
  .pd-similar { padding: 28px 20px 0; }
  .pd-title { font-size: 26px; }

  .rv-stats {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 22px;
  }
  .rvs-score {
    border-right: none;
    border-bottom: 1px solid $line;
    padding-bottom: 20px;
  }
  .rv-body, .rv-imgs, .rv-reply, .rv-acts {
    padding-left: 0;
    margin-left: 0;
  }
}

@media (max-width: 560px) {
  .pd-cta {
    .cta { min-width: 100%; }
    .cta-fav { width: 100%; justify-content: center; }
  }
  .tabs-head { gap: 24px; }
  .tab-item { font-size: 16px; }
  .pd-pills { gap: 4px; .pill { font-size: 9.5px; padding: 3px 6px; } }
  .pp-num { font-size: 36px !important; }
}
</style>
