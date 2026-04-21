<template>
  <div class="pl-page">
    <!-- ── Compact sticky header ─────────────────────────── -->
    <header class="pl-header">
      <div class="pl-header__inner">
        <div class="pl-crumb">
          <span class="c-item" @click="router.push('/')">首页</span>
          <span class="c-sep">›</span>
          <span class="c-item" :class="{ current: !currentCategory }" @click="selectCategory(null)">全部商品</span>
          <template v-if="currentCategory">
            <span class="c-sep">›</span>
            <span class="c-item current">{{ currentCategory.categoryName }}</span>
          </template>
        </div>
        <div class="pl-header__main">
          <div class="h-left">
            <div class="h-kicker">— CATALOG</div>
            <h1 class="h-title">{{ currentCategory ? currentCategory.categoryName : '全部商品' }}</h1>
          </div>
          <div class="h-right">
            <span class="h-count">
              <span class="c-num">{{ total }}</span>
              <span class="c-label">件商品</span>
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- ── Main ─────────────────────────────────────────── -->
    <div class="pl-main">
      <!-- Sticky sidebar -->
      <aside class="pl-side">
        <div class="pl-side__inner">
          <!-- 搜索（常用所以置顶） -->
          <div class="s-block">
            <div class="s-search">
              <el-icon class="s-search__icon"><Search /></el-icon>
              <input
                v-model="queryParams.keyword"
                class="s-search__input"
                placeholder="搜索商品名称或品牌"
                @keyup.enter="handleSearch"
              />
              <span v-if="queryParams.keyword" class="s-search__clear" @click="queryParams.keyword = ''; handleSearch()">×</span>
            </div>
          </div>

          <!-- 分类 -->
          <div class="s-block">
            <div class="s-head">
              <span class="s-head__title">商品分类</span>
              <span v-if="queryParams.categoryId" class="s-head__reset" @click="selectCategory(null)">重置</span>
            </div>
            <div class="s-cats">
              <div
                class="s-cat s-cat--all"
                :class="{ active: !queryParams.categoryId }"
                @click="selectCategory(null)"
              >全部</div>
              <div
                v-for="category in firstLevelCategories"
                :key="category.id"
                class="s-cat-group"
              >
                <div
                  class="s-cat"
                  :class="{
                    active: queryParams.categoryId === category.id,
                    expanded: expandedCategory === category.id
                  }"
                  @click="toggleCategory(category)"
                >
                  <span class="s-cat__label">{{ category.categoryName }}</span>
                  <el-icon class="s-cat__arrow">
                    <ArrowRight v-if="expandedCategory !== category.id" />
                    <ArrowDown v-else />
                  </el-icon>
                </div>
                <transition name="slide">
                  <div v-show="expandedCategory === category.id" class="s-sub">
                    <div
                      v-for="subCat in category.children"
                      :key="subCat.id"
                      class="s-sub__item"
                      :class="{ active: queryParams.categoryId === subCat.id }"
                      @click.stop="selectCategory(subCat)"
                    >
                      {{ subCat.categoryName }}
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>

          <!-- 价格 -->
          <div class="s-block">
            <div class="s-head">
              <span class="s-head__title">价格区间</span>
              <span v-if="priceRange !== 'all' || customPrice.min || customPrice.max" class="s-head__reset" @click="clearPriceFilter">重置</span>
            </div>
            <div class="s-prices">
              <div
                v-for="opt in priceOptions"
                :key="opt.value"
                class="s-price"
                :class="{ active: priceRange === opt.value }"
                @click="priceRange = opt.value; customPrice.min = ''; customPrice.max = ''; handlePriceChange()"
              >{{ opt.label }}</div>
            </div>
            <div class="s-price-range">
              <input
                v-model.number="customPrice.min"
                class="s-price-input"
                type="number"
                placeholder="最低"
                min="0"
                @keyup.enter="applyCustomPrice"
              />
              <span class="s-price-dash">—</span>
              <input
                v-model.number="customPrice.max"
                class="s-price-input"
                type="number"
                placeholder="最高"
                min="0"
                @keyup.enter="applyCustomPrice"
              />
              <button class="s-price-go" @click="applyCustomPrice">确定</button>
            </div>
          </div>

          <!-- 标签 -->
          <div class="s-block">
            <div class="s-head">
              <span class="s-head__title">商品标签</span>
              <span v-if="selectedTags.length" class="s-head__reset" @click="selectedTags = []; handleTagChange()">重置</span>
            </div>
            <div class="s-tags">
              <label
                v-for="tag in tagOptions"
                :key="tag.value"
                class="s-tag"
                :class="{ active: selectedTags.includes(tag.value) }"
              >
                <input
                  type="checkbox"
                  :checked="selectedTags.includes(tag.value)"
                  @change="toggleTag(tag.value)"
                />
                <span class="s-tag__box">
                  <span v-if="selectedTags.includes(tag.value)" class="s-tag__tick">✓</span>
                </span>
                <span class="s-tag__label">{{ tag.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right content -->
      <section class="pl-right">
        <!-- Toolbar: sort + view + chips -->
        <div class="pl-bar">
          <div class="pl-bar__row">
            <div class="sort-tabs">
              <span
                class="s-tab"
                :class="{ active: sortType === 'default' }"
                @click="handleSort('default')"
              >综合</span>
              <span
                class="s-tab"
                :class="{ active: sortType === 'sales' }"
                @click="handleSort('sales')"
              >销量</span>
              <span
                class="s-tab"
                :class="{ active: sortType === 'create_time' }"
                @click="handleSort('create_time')"
              >新品</span>
              <span
                class="s-tab s-tab--price"
                :class="{ active: sortType === 'price' }"
                @click="handleSort('price')"
              >
                价格
                <span class="s-tab__dir">
                  <span class="dir-up" :class="{ on: sortType === 'price' && priceSort === 'asc' }">▲</span>
                  <span class="dir-dn" :class="{ on: sortType === 'price' && priceSort === 'desc' }">▼</span>
                </span>
              </span>
            </div>

            <div class="view-wrap">
              <span class="view-label">每页</span>
              <select v-model="queryParams.pageSize" class="view-select" @change="handleSizeChange">
                <option :value="20">20</option>
                <option :value="40">40</option>
                <option :value="60">60</option>
                <option :value="80">80</option>
              </select>
              <div class="view-toggle">
                <span
                  class="vt-btn"
                  :class="{ active: viewMode === 'grid' }"
                  title="网格视图"
                  @click="viewMode = 'grid'"
                >
                  <el-icon><Grid /></el-icon>
                </span>
                <span
                  class="vt-btn"
                  :class="{ active: viewMode === 'list' }"
                  title="列表视图"
                  @click="viewMode = 'list'"
                >
                  <el-icon><Menu /></el-icon>
                </span>
              </div>
            </div>
          </div>

          <!-- Active filter chips -->
          <div v-if="hasFilters" class="pl-chips">
            <span class="chips-label">已筛选</span>
            <span
              v-if="currentCategory"
              class="chip"
              @click="selectCategory(null)"
            >
              <span class="chip-k">分类</span>
              <span class="chip-v">{{ currentCategory.categoryName }}</span>
              <span class="chip-x">×</span>
            </span>
            <span
              v-if="priceRange !== 'all'"
              class="chip"
              @click="clearPriceFilter"
            >
              <span class="chip-k">价格</span>
              <span class="chip-v">{{ priceRange }}元</span>
              <span class="chip-x">×</span>
            </span>
            <span
              v-if="customPrice.min || customPrice.max"
              class="chip"
              @click="clearPriceFilter"
            >
              <span class="chip-k">价格</span>
              <span class="chip-v">¥{{ customPrice.min || 0 }} — ¥{{ customPrice.max || '∞' }}</span>
              <span class="chip-x">×</span>
            </span>
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="chip"
              @click="removeTag(tag)"
            >
              <span class="chip-k">标签</span>
              <span class="chip-v">{{ tagNames[tag] }}</span>
              <span class="chip-x">×</span>
            </span>
            <span class="chips-clear" @click="clearAllFilters">清空全部</span>
          </div>
        </div>

        <!-- ── GRID MODE ────────────────────────────────── -->
        <div
          v-loading="loading"
          v-if="viewMode === 'grid'"
          class="pl-grid"
        >
          <div
            v-for="product in productList"
            :key="product.id"
            class="p-card"
            @click="goToDetail(product.id)"
          >
            <div class="p-card__image">
              <img :src="product.mainImage" :alt="product.productName" />
              <div class="p-card__overlay"></div>
              <div class="p-card__pills">
                <span v-if="product.isHot" class="pill pill-hot">HOT</span>
                <span v-if="product.isNew" class="pill pill-new">NEW</span>
                <span v-if="product.isRecommend" class="pill pill-rec">推荐</span>
              </div>
              <div v-if="product.originalPrice && product.originalPrice > product.price" class="p-card__disc">
                {{ Math.round((1 - product.price / product.originalPrice) * 100) }}% OFF
              </div>
              <div class="p-card__actions" @click.stop>
                <button
                  class="pa-btn"
                  title="加入购物车"
                  :class="{ busy: cartBusy === product.id }"
                  @click.stop="handleAddToCart(product)"
                >
                  <el-icon><ShoppingCart /></el-icon>
                </button>
                <button
                  class="pa-btn"
                  title="收藏"
                  :class="{ busy: favBusy === product.id }"
                  @click.stop="handleToggleFavorite(product)"
                >
                  <el-icon><Star /></el-icon>
                </button>
              </div>
            </div>
            <div class="p-card__body">
              <h4 class="p-card__name">{{ product.productName }}</h4>
              <p class="p-card__sub">{{ product.subTitle || '—' }}</p>
              <div class="p-card__rate">
                <el-rate
                  :model-value="Math.round((product.avgRating || 0) * 2) / 2"
                  disabled
                  :colors="['#c7a572', '#c7a572', '#c7a572']"
                  void-color="rgba(255,255,255,0.18)"
                  size="small"
                />
                <span class="rate-score">{{ (product.avgRating || 0).toFixed(1) }}</span>
                <span class="rate-sep">·</span>
                <span class="rate-count">{{ product.reviewCount || 0 }}评价</span>
              </div>
              <div class="p-card__foot">
                <div class="price-box">
                  <span class="price-sym">¥</span>
                  <span class="price-num">{{ product.price }}</span>
                  <span v-if="product.originalPrice && product.originalPrice > product.price" class="price-old">¥{{ product.originalPrice }}</span>
                </div>
                <div class="sales-box">已售 {{ product.sales || 0 }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── LIST MODE ────────────────────────────────── -->
        <div
          v-loading="loading"
          v-else
          class="pl-list"
        >
          <div
            v-for="product in productList"
            :key="product.id"
            class="p-row"
            @click="goToDetail(product.id)"
          >
            <div class="p-row__image">
              <img :src="product.mainImage" :alt="product.productName" />
              <div class="p-row__pills">
                <span v-if="product.isHot" class="pill pill-hot">HOT</span>
                <span v-if="product.isNew" class="pill pill-new">NEW</span>
                <span v-if="product.isRecommend" class="pill pill-rec">推荐</span>
              </div>
            </div>
            <div class="p-row__body">
              <h4 class="p-row__name">{{ product.productName }}</h4>
              <p class="p-row__sub">{{ product.subTitle || '—' }}</p>
              <div class="p-row__rate">
                <el-rate
                  :model-value="Math.round((product.avgRating || 0) * 2) / 2"
                  disabled
                  :colors="['#c7a572', '#c7a572', '#c7a572']"
                  void-color="rgba(255,255,255,0.18)"
                  size="small"
                />
                <span class="rate-score">{{ (product.avgRating || 0).toFixed(1) }}</span>
                <span class="rate-sep">·</span>
                <span class="rate-count">{{ product.reviewCount || 0 }}评价</span>
                <span class="rate-sep">·</span>
                <span class="rate-sales">已售 {{ product.sales || 0 }}</span>
              </div>
            </div>
            <div class="p-row__side" @click.stop>
              <div class="p-row__price">
                <span class="price-sym">¥</span>
                <span class="price-num">{{ product.price }}</span>
              </div>
              <div v-if="product.originalPrice && product.originalPrice > product.price" class="price-old">¥{{ product.originalPrice }}</div>
              <div class="p-row__btns">
                <button class="ghost-btn" @click.stop="handleToggleFavorite(product)">
                  <el-icon><Star /></el-icon>收藏
                </button>
                <button class="solid-btn" @click.stop="handleAddToCart(product)">
                  <el-icon><ShoppingCart /></el-icon>加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="!loading && productList.length === 0" class="pl-empty">
          <div class="empty-icon">◎</div>
          <div class="empty-line">暂无匹配的商品</div>
          <div class="empty-sub">尝试调整筛选条件或搜索关键词</div>
          <button v-if="hasFilters" class="empty-btn" @click="clearAllFilters">清空筛选条件</button>
        </div>

        <!-- Pagination -->
        <div v-if="total > 0" class="pl-pager">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            :page-sizes="[20, 40, 60, 80]"
            :total="total"
            :pager-count="7"
            layout="prev, pager, next, jumper, total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowRight, ArrowDown, Search, Top, Bottom,
  ShoppingCart, Star, Grid, Menu
} from '@element-plus/icons-vue'
import { getCategoryTree } from '@/api/category'
import { getProductList } from '@/api/product'
import { addToCart as addToCartApi } from '@/api/cart'
import { toggleFavorite } from '@/api/favorite'
import { getToken } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const firstLevelCategories = ref([])
const productList = ref([])
const total = ref(0)
const currentCategory = ref(null)
const expandedCategory = ref(null)
const priceRange = ref('all')
const customPrice = reactive({ min: '', max: '' })
const selectedTags = ref([])
const sortType = ref('default')
const priceSort = ref('desc')
const viewMode = ref('grid')
const cartBusy = ref(null)
const favBusy = ref(null)

const tagNames = {
  hot: '热卖',
  new: '新品',
  recommend: '推荐'
}

const priceOptions = [
  { label: '全部', value: 'all' },
  { label: '500以下', value: '0-500' },
  { label: '500 - 1000', value: '500-1000' },
  { label: '1000 - 3000', value: '1000-3000' },
  { label: '3000 - 5000', value: '3000-5000' },
  { label: '5000以上', value: '5000+' }
]

const tagOptions = [
  { label: '热卖', value: 'hot' },
  { label: '新品', value: 'new' },
  { label: '推荐', value: 'recommend' }
]

const queryParams = reactive({
  categoryId: null,
  keyword: '',
  brand: null,
  minPrice: null,
  maxPrice: null,
  isHot: null,
  isNew: null,
  isRecommend: null,
  sortField: null,
  sortOrder: 'desc',
  pageNum: 1,
  pageSize: 20
})

const hasFilters = computed(() => {
  return currentCategory.value ||
         priceRange.value !== 'all' ||
         selectedTags.value.length > 0 ||
         customPrice.min !== '' ||
         customPrice.max !== ''
})

const loadCategories = async () => {
  try {
    const res = await getCategoryTree()
    firstLevelCategories.value = res.data

    if (queryParams.categoryId) {
      const categoryId = queryParams.categoryId
      const firstLevel = firstLevelCategories.value.find(c => c.id === categoryId)
      if (firstLevel) {
        expandedCategory.value = categoryId
        currentCategory.value = firstLevel
      } else {
        for (const cat of firstLevelCategories.value) {
          const subCat = cat.children?.find(c => c.id === categoryId)
          if (subCat) {
            expandedCategory.value = cat.id
            currentCategory.value = subCat
            break
          }
        }
      }
    }
  } catch (error) {
    ElMessage.error('加载分类失败')
  }
}

const loadProducts = async () => {
  loading.value = true
  try {
    const res = await getProductList(queryParams)
    productList.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

const toggleCategory = (category) => {
  if (expandedCategory.value === category.id) {
    expandedCategory.value = null
  } else {
    expandedCategory.value = category.id
  }
  selectCategory(category)
}

const selectCategory = (category) => {
  if (category) {
    queryParams.categoryId = category.id
    currentCategory.value = category
  } else {
    queryParams.categoryId = null
    currentCategory.value = null
    expandedCategory.value = null
  }
  queryParams.pageNum = 1
  loadProducts()
}

const handlePriceChange = () => {
  if (priceRange.value === 'all') {
    queryParams.minPrice = null
    queryParams.maxPrice = null
  } else if (priceRange.value === '5000+') {
    queryParams.minPrice = 5000
    queryParams.maxPrice = null
  } else {
    const [min, max] = priceRange.value.split('-').map(Number)
    queryParams.minPrice = min
    queryParams.maxPrice = max
  }
  queryParams.pageNum = 1
  loadProducts()
}

const applyCustomPrice = () => {
  const min = customPrice.min === '' ? null : Number(customPrice.min)
  const max = customPrice.max === '' ? null : Number(customPrice.max)
  if (min !== null && max !== null && min > max) {
    ElMessage.warning('最低价不能高于最高价')
    return
  }
  priceRange.value = 'all'
  queryParams.minPrice = min
  queryParams.maxPrice = max
  queryParams.pageNum = 1
  loadProducts()
}

const clearPriceFilter = () => {
  priceRange.value = 'all'
  customPrice.min = ''
  customPrice.max = ''
  queryParams.minPrice = null
  queryParams.maxPrice = null
  queryParams.pageNum = 1
  loadProducts()
}

const toggleTag = (tag) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tag)
  handleTagChange()
}

const handleTagChange = () => {
  queryParams.isHot = selectedTags.value.includes('hot') ? 1 : null
  queryParams.isNew = selectedTags.value.includes('new') ? 1 : null
  queryParams.isRecommend = selectedTags.value.includes('recommend') ? 1 : null
  queryParams.pageNum = 1
  loadProducts()
}

const removeTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
    handleTagChange()
  }
}

const clearAllFilters = () => {
  queryParams.categoryId = null
  currentCategory.value = null
  expandedCategory.value = null
  priceRange.value = 'all'
  customPrice.min = ''
  customPrice.max = ''
  selectedTags.value = []
  queryParams.minPrice = null
  queryParams.maxPrice = null
  queryParams.isHot = null
  queryParams.isNew = null
  queryParams.isRecommend = null
  queryParams.pageNum = 1
  loadProducts()
}

const handleSearch = () => {
  queryParams.pageNum = 1
  loadProducts()
}

const handleSort = (type) => {
  if (type === 'price') {
    if (sortType.value === 'price') {
      priceSort.value = priceSort.value === 'asc' ? 'desc' : 'asc'
    } else {
      priceSort.value = 'asc'
    }
    sortType.value = 'price'
    queryParams.sortField = 'price'
    queryParams.sortOrder = priceSort.value
  } else if (type === 'default') {
    sortType.value = type
    queryParams.sortField = null
    queryParams.sortOrder = 'desc'
  } else {
    sortType.value = type
    queryParams.sortField = type
    queryParams.sortOrder = 'desc'
  }
  queryParams.pageNum = 1
  loadProducts()
}

const handleSizeChange = () => {
  queryParams.pageNum = 1
  loadProducts()
}

const handleCurrentChange = () => {
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

// 购物车
const handleAddToCart = async (product) => {
  if (!getToken()) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  if (product.stock === 0) {
    ElMessage.warning('该商品已售罄')
    return
  }
  cartBusy.value = product.id
  try {
    await addToCartApi({ productId: product.id, quantity: 1 })
    ElMessage.success('已加入购物车')
  } catch (e) {
    ElMessage.error('加入购物车失败')
  } finally {
    cartBusy.value = null
  }
}

// 收藏
const handleToggleFavorite = async (product) => {
  if (!getToken()) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  favBusy.value = product.id
  try {
    const res = await toggleFavorite(product.id)
    ElMessage.success(res.data.message || (res.data.isFavorite ? '已收藏' : '已取消收藏'))
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    favBusy.value = null
  }
}

watch(() => route.query.categoryId, (newVal) => {
  if (newVal) {
    queryParams.categoryId = Number(newVal)
    loadProducts()
  }
})

onMounted(() => {
  if (route.query.categoryId) {
    queryParams.categoryId = Number(route.query.categoryId)
  } else if (route.params.categoryId) {
    queryParams.categoryId = Number(route.params.categoryId)
  }

  loadCategories()
  loadProducts()
})
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

.pl-page {
  min-height: 100vh;
  background: $bg-0;
  color: $tx-1;
  padding: 0 0 100px;
  font-family: $sans;
}

// ── Compact header ────────────────────────────────
.pl-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(0,0,0,0.88);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid $line;

  &__inner {
    max-width: 1440px;
    margin: 0 auto;
    padding: 22px 40px 20px;
  }
  &__main {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    margin-top: 6px;
  }

  .h-left {
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
  }
  .h-kicker {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 2.5px;
    color: $accent;
    text-transform: uppercase;
  }
  .h-title {
    font-family: $serif;
    font-weight: 500;
    font-size: 30px;
    letter-spacing: 3px;
    color: $tx-1;
    margin: 0;
    line-height: 1;
  }
  .h-count {
    font-family: $sans;
    font-size: 13px;
    color: $tx-3;
    .c-num {
      color: $accent;
      font-family: $mono;
      font-weight: 600;
      font-size: 16px;
      margin-right: 4px;
    }
    .c-label { color: $tx-3; }
  }
}

.pl-crumb {
  font-family: $sans;
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

// ── Main layout ────────────────────────────────────
.pl-main {
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px 40px 0;
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

// ── Sticky sidebar ────────────────────────────────
.pl-side {
  width: 248px;
  flex-shrink: 0;
  position: sticky;
  top: 120px;

  &__inner {
    max-height: calc(100vh - 150px);
    overflow-y: auto;
    padding-right: 6px;
    scrollbar-width: thin;
    scrollbar-color: $line-2 transparent;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: $line-2; border-radius: 2px; }
  }
}

.s-block {
  padding: 18px 0;
  border-bottom: 1px solid $line;
  &:first-child { padding-top: 4px; }
  &:last-child { border-bottom: none; }
}

.s-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;

  &__title {
    font-family: $serif;
    font-size: 16px;
    letter-spacing: 1.5px;
    color: $tx-1;
    font-weight: 500;
  }
  &__reset {
    font-size: 11px;
    color: $tx-3;
    cursor: pointer;
    transition: color 0.2s ease;
    &:hover { color: $accent; }
  }
}

// 搜索框
.s-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: $bg-2;
  border: 1px solid $line;
  transition: border-color 0.2s ease;

  &:focus-within { border-color: $accent; }

  &__icon {
    color: $tx-3;
    font-size: 14px;
    flex-shrink: 0;
  }
  &__input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: $tx-1;
    font-family: $sans;
    font-size: 13px;

    &::placeholder {
      color: $tx-4;
      font-size: 12.5px;
    }
  }
  &__clear {
    cursor: pointer;
    color: $tx-3;
    font-size: 18px;
    line-height: 1;
    padding: 0 4px;
    &:hover { color: $tx-1; }
  }
}

// 分类
.s-cats {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.s-cat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  cursor: pointer;
  font-family: $sans;
  font-size: 13.5px;
  color: $tx-2;
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease, padding-left 0.2s ease;
  border-left: 2px solid transparent;

  &:hover {
    background: $bg-2;
    color: $tx-1;
  }
  &.active {
    background: rgba(199,165,114,0.1);
    color: $accent;
    border-left-color: $accent;

    .s-cat__arrow { color: $accent; }
  }
  &.expanded .s-cat__arrow { transform: rotate(0deg); }

  &--all {
    font-family: $serif;
    font-size: 14.5px;
    letter-spacing: 1px;
  }

  &__label { flex: 1; }
  &__arrow {
    font-size: 11px;
    color: $tx-4;
    transition: transform 0.3s ease, color 0.2s ease;
  }
}

.s-sub {
  padding: 4px 0 6px 12px;
  display: flex;
  flex-direction: column;
  gap: 1px;

  &__item {
    padding: 7px 14px;
    font-family: $sans;
    font-size: 12.5px;
    color: $tx-3;
    cursor: pointer;
    transition: color 0.2s ease, padding-left 0.2s ease, background 0.2s ease;
    border-left: 1px solid $line;

    &:hover {
      color: $tx-1;
      padding-left: 18px;
      border-left-color: $line-2;
    }
    &.active {
      color: $accent;
      border-left-color: $accent;
      background: rgba(199,165,114,0.06);
    }
  }
}

// 价格
.s-prices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 12px;
}

.s-price {
  padding: 8px 4px;
  text-align: center;
  font-size: 12px;
  color: $tx-2;
  background: $bg-2;
  border: 1px solid $line;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $line-2;
    color: $tx-1;
  }
  &.active {
    border-color: $accent;
    color: $accent;
    background: rgba(199,165,114,0.08);
  }
}

.s-price-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.s-price-input {
  width: 0;
  flex: 1;
  min-width: 0;
  padding: 7px 8px;
  background: $bg-2;
  border: 1px solid $line;
  color: $tx-1;
  font-family: $sans;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s ease;

  &::placeholder { color: $tx-4; }
  &:focus { border-color: $accent; }

  // 去掉 number input 的上下按钮
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
}

.s-price-dash {
  color: $tx-4;
  font-size: 12px;
}

.s-price-go {
  padding: 7px 10px;
  background: transparent;
  border: 1px solid $accent;
  color: $accent;
  font-family: $sans;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &:hover { background: rgba(199,165,114,0.12); }
}

// 标签
.s-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.s-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  cursor: pointer;
  font-family: $sans;
  font-size: 13px;
  color: $tx-2;
  transition: color 0.2s ease, background 0.2s ease;

  input { display: none; }

  &__box {
    width: 14px;
    height: 14px;
    border: 1px solid $line-2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  &__tick {
    font-size: 10px;
    color: $accent;
    line-height: 1;
  }
  &:hover {
    color: $tx-1;
    background: $bg-2;
    .s-tag__box { border-color: $line-3; }
  }
  &.active {
    color: $accent;
    .s-tag__box {
      border-color: $accent;
      background: rgba(199,165,114,0.1);
    }
  }
}

// ── Right: toolbar ───────────────────────────────
.pl-right {
  flex: 1;
  min-width: 0;
}

.pl-bar {
  margin-bottom: 20px;
  border-bottom: 1px solid $line;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    flex-wrap: wrap;
    gap: 14px;
  }
}

.sort-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background: $bg-1;
  border: 1px solid $line;
  padding: 3px;
}

.s-tab {
  position: relative;
  padding: 7px 16px;
  cursor: pointer;
  font-family: $sans;
  font-size: 13px;
  color: $tx-2;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;

  &:hover { color: $tx-1; }

  &.active {
    background: rgba(199,165,114,0.12);
    color: $accent;
  }

  &--price .s-tab__dir {
    display: inline-flex;
    flex-direction: column;
    font-size: 8px;
    line-height: 1;
    gap: 2px;
    color: $tx-4;

    .on { color: $accent; }
  }
}

.view-wrap {
  display: flex;
  align-items: center;
  gap: 14px;

  .view-label {
    font-size: 12px;
    color: $tx-3;
  }
}

.view-select {
  padding: 6px 10px;
  background: $bg-1;
  border: 1px solid $line;
  color: $tx-1;
  font-family: $sans;
  font-size: 12.5px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover { border-color: $line-2; }
  &:focus { border-color: $accent; }

  option {
    background: $bg-1;
    color: $tx-1;
  }
}

.view-toggle {
  display: flex;
  border: 1px solid $line;
  background: $bg-1;

  .vt-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $tx-3;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover { color: $tx-1; background: $bg-2; }
    &.active { color: $accent; background: rgba(199,165,114,0.12); }
    & + .vt-btn { border-left: 1px solid $line; }
  }
}

// Active filter chips
.pl-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 14px;
  flex-wrap: wrap;
  border-top: 1px dashed $line;

  .chips-label {
    font-size: 12px;
    color: $tx-3;
    margin-right: 4px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px 4px 10px;
    font-size: 12px;
    color: $tx-1;
    background: $bg-2;
    border: 1px solid $line;
    cursor: pointer;
    transition: all 0.2s ease;

    .chip-k {
      color: $tx-4;
      font-size: 11px;
      padding-right: 6px;
      border-right: 1px solid $line-2;
    }
    .chip-v { color: $tx-2; }
    .chip-x {
      color: $tx-3;
      font-size: 14px;
      line-height: 1;
      padding: 0 2px;
    }
    &:hover {
      border-color: $accent;
      .chip-v, .chip-x { color: $accent; }
    }
  }
  .chips-clear {
    margin-left: 6px;
    font-size: 12px;
    color: $tx-3;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: $line-2;
    transition: color 0.2s ease;
    &:hover {
      color: $accent;
      text-decoration-color: $accent;
    }
  }
}

// ── GRID ──────────────────────────────────────────
.pl-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 36px;
  min-height: 280px;
}

@media (max-width: 1280px) { .pl-grid { grid-template-columns: repeat(3, 1fr); } }

.p-card {
  background: $bg-1;
  border: 1px solid $line;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: $line-2;
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0,0,0,0.5);

    .p-card__image img { transform: scale(1.06); }
    .p-card__overlay { opacity: 0.3; }
    .p-card__actions { opacity: 1; transform: translateX(0); }
    .p-card__name { color: $accent; }
  }

  &__image {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    background: #000;
    border-bottom: 1px solid $line;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%);
    opacity: 0.2;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &__pills {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 5px;

    .pill {
      font-family: $mono;
      font-size: 9.5px;
      letter-spacing: 1px;
      padding: 3px 6px;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      color: $accent;
      border: 1px solid currentColor;
      line-height: 1.1;
    }
    .pill-hot { color: $accent-hot; }
    .pill-new { color: $accent-new; }
    .pill-rec {
      color: $accent;
      font-family: $serif;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 2px 7px;
    }
  }

  &__disc {
    position: absolute;
    top: 10px;
    right: 10px;
    font-family: $mono;
    font-size: 10px;
    letter-spacing: 0.5px;
    padding: 4px 7px;
    background: $accent;
    color: #111;
    font-weight: 600;
  }

  &__actions {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    opacity: 0;
    transform: translateX(8px);
    transition: all 0.25s ease;

    .pa-btn {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.18);
      color: $tx-1;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 15px;

      &:hover {
        background: $accent;
        color: #111;
        border-color: $accent;
      }
      &.busy { opacity: 0.5; pointer-events: none; }
    }
  }

  &__body {
    padding: 14px 14px 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__name {
    font-family: $sans;
    font-size: 14px;
    font-weight: 500;
    color: $tx-1;
    margin: 0 0 4px;
    line-height: 1.4;
    min-height: 38px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color 0.25s ease;
  }

  &__sub {
    font-family: $sans;
    font-size: 11.5px;
    color: $tx-4;
    margin: 0 0 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-height: 14px;
  }

  &__rate {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 10px;
    flex-wrap: wrap;

    :deep(.el-rate) { height: 14px; }
    :deep(.el-rate__icon) { font-size: 12px; margin-right: 1px; }

    .rate-score {
      font-family: $mono;
      font-size: 11px;
      color: $accent;
      font-weight: 600;
    }
    .rate-sep { color: $tx-4; font-size: 10px; }
    .rate-count {
      font-family: $sans;
      font-size: 11px;
      color: $tx-4;
    }
  }

  &__foot {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 10px;
    margin-top: auto;
    border-top: 1px solid $line;
  }

  .price-box {
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-wrap: wrap;
    .price-sym {
      font-family: $serif;
      font-size: 13px;
      color: $accent;
    }
    .price-num {
      font-family: $serif;
      font-size: 22px;
      font-weight: 500;
      color: $accent;
      letter-spacing: 0.3px;
    }
    .price-old {
      margin-left: 4px;
      font-family: $sans;
      font-size: 11px;
      color: $tx-4;
      text-decoration: line-through;
    }
  }

  .sales-box {
    font-family: $sans;
    font-size: 11px;
    color: $tx-3;
  }
}

// ── LIST ──────────────────────────────────────────
.pl-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 36px;
  min-height: 200px;
}

.p-row {
  display: flex;
  gap: 22px;
  padding: 18px;
  background: $bg-1;
  border: 1px solid $line;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: $line-2;
    background: $bg-2;
    .p-row__image img { transform: scale(1.04); }
    .p-row__name { color: $accent; }
  }

  &__image {
    position: relative;
    width: 180px;
    height: 180px;
    overflow: hidden;
    background: $bg-0;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
  }

  &__pills {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    gap: 4px;
    .pill {
      font-family: $mono;
      font-size: 9.5px;
      letter-spacing: 1px;
      padding: 2px 5px;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      color: $accent;
      border: 1px solid currentColor;
    }
    .pill-hot { color: $accent-hot; }
    .pill-new { color: $accent-new; }
    .pill-rec {
      font-family: $serif;
      font-size: 10.5px;
      letter-spacing: 0.5px;
      padding: 2px 6px;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-family: $sans;
    font-size: 17px;
    font-weight: 500;
    color: $tx-1;
    margin: 0 0 6px;
    transition: color 0.2s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  &__sub {
    font-family: $sans;
    font-size: 13px;
    color: $tx-3;
    margin: 0 0 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  &__rate {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    flex-wrap: wrap;

    :deep(.el-rate) { height: 16px; }
    .rate-score {
      font-family: $mono;
      font-size: 12px;
      color: $accent;
      font-weight: 600;
    }
    .rate-sep { color: $tx-4; font-size: 11px; }
    .rate-count, .rate-sales {
      font-size: 12px;
      color: $tx-3;
    }
  }

  &__side {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
  }
  &__price {
    display: flex;
    align-items: baseline;
    gap: 3px;
    .price-sym {
      font-family: $serif;
      font-size: 16px;
      color: $accent;
    }
    .price-num {
      font-family: $serif;
      font-size: 30px;
      font-weight: 500;
      color: $accent;
      letter-spacing: 0.3px;
      line-height: 1;
    }
  }
  .price-old {
    font-family: $sans;
    font-size: 12px;
    color: $tx-4;
    text-decoration: line-through;
  }

  &__btns {
    display: flex;
    gap: 8px;
    margin-top: auto;

    button {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 9px 14px;
      font-family: $sans;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid;
      background: transparent;
      line-height: 1;

      .el-icon { font-size: 14px; }
    }
    .ghost-btn {
      border-color: $line-2;
      color: $tx-2;
      &:hover { border-color: $accent; color: $accent; }
    }
    .solid-btn {
      border-color: $accent;
      background: $accent;
      color: #111;
      font-weight: 500;
      &:hover {
        background: lighten(#c7a572, 5%);
        border-color: lighten(#c7a572, 5%);
      }
    }
  }
}

// ── Empty ─────────────────────────────────────────
.pl-empty {
  padding: 100px 40px;
  text-align: center;

  .empty-icon {
    font-family: $serif;
    font-size: 56px;
    color: $tx-4;
    margin-bottom: 18px;
    line-height: 1;
  }
  .empty-line {
    font-family: $serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: $tx-2;
    margin-bottom: 8px;
  }
  .empty-sub {
    font-family: $sans;
    font-size: 13px;
    color: $tx-4;
    margin-bottom: 28px;
  }
  .empty-btn {
    padding: 10px 24px;
    background: transparent;
    border: 1px solid $accent;
    color: $accent;
    font-family: $sans;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s ease;
    &:hover { background: rgba(199,165,114,0.12); }
  }
}

// ── Pagination ───────────────────────────────────
.pl-pager {
  display: flex;
  justify-content: center;
  padding: 28px 0 0;
  border-top: 1px solid $line;

  :deep(.el-pagination) {
    --el-pagination-bg-color: transparent;
    --el-pagination-text-color: #{$tx-2};
    --el-pagination-border-radius: 0;
    --el-pagination-button-color: #{$tx-2};
    --el-pagination-button-bg-color: transparent;
    --el-pagination-hover-color: #{$accent};
    background: transparent;
    font-family: $sans;

    .el-pagination__total,
    .el-pagination__jump {
      color: $tx-3;
      font-size: 13px;
    }

    .btn-prev, .btn-next {
      background: $bg-1 !important;
      color: $tx-2 !important;
      border: 1px solid $line;
      border-radius: 0;
      min-width: 34px;
      &:hover { color: $accent !important; border-color: $accent; }
      &:disabled {
        color: $tx-4 !important;
        background: transparent !important;
      }
    }

    .el-pager li {
      background: $bg-1 !important;
      color: $tx-2 !important;
      font-family: $sans;
      border: 1px solid $line;
      border-radius: 0;
      min-width: 34px;
      margin: 0 2px;
      &:hover { color: $accent !important; border-color: $accent; }
      &.is-active {
        color: #111 !important;
        background: $accent !important;
        border-color: $accent;
        font-weight: 600;
      }
    }

    .el-input__wrapper {
      background: $bg-1 !important;
      box-shadow: 0 0 0 1px $line inset !important;
      border-radius: 0 !important;
      .el-input__inner {
        color: $tx-1 !important;
        font-family: $sans;
      }
      &:hover { box-shadow: 0 0 0 1px $line-2 inset !important; }
      &.is-focus { box-shadow: 0 0 0 1px $accent inset !important; }
    }
  }
}

// ── Loading mask ─────────────────────────────────
:deep(.el-loading-mask) {
  background: rgba(0,0,0,0.55) !important;
}
:deep(.el-loading-spinner .path) {
  stroke: $accent !important;
}

// ── Slide transition ─────────────────────────────
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.slide-enter-to, .slide-leave-from {
  max-height: 600px;
  opacity: 1;
}

// ── Responsive ───────────────────────────────────
@media (max-width: 1100px) {
  .pl-main { gap: 24px; padding: 24px 28px 0; }
  .pl-side { width: 220px; }
  .pl-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
}

@media (max-width: 900px) {
  .pl-header__inner { padding: 18px 24px 14px; }
  .pl-header .h-title { font-size: 24px; letter-spacing: 2px; }
  .pl-main {
    flex-direction: column;
    padding: 20px 24px 0;
  }
  .pl-side {
    width: 100%;
    position: static;
    &__inner { max-height: none; padding-right: 0; }
  }
  .s-block { padding: 14px 0; }
  .pl-grid { grid-template-columns: repeat(2, 1fr); }
  .pl-bar__row { flex-direction: column; align-items: stretch; }
  .sort-tabs { overflow-x: auto; }
  .p-row {
    flex-direction: column;
    gap: 14px;
    &__image { width: 100%; height: 220px; }
    &__side { width: 100%; align-items: stretch; }
    &__btns button { flex: 1; justify-content: center; }
  }
}

@media (max-width: 560px) {
  .pl-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .p-card__body { padding: 12px 10px 14px; }
  .p-card__name { font-size: 13px; min-height: 36px; }
  .p-card .price-box .price-num { font-size: 18px; }
  .p-card__actions { display: none; }
}
</style>
