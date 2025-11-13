<template>
  <div class="product-list-container">
    <!-- 顶部分类导航 -->
    <div class="category-nav">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentCategory">
          {{ currentCategory.categoryName }}
        </el-breadcrumb-item>
        <el-breadcrumb-item v-else>全部商品</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="main-content">
      <!-- 左侧分类筛选 -->
      <div class="left-sidebar">
        <!-- 一级分类 -->
        <div class="filter-section">
          <h3>商品分类</h3>
          <div class="category-list">
            <div 
              class="category-item"
              :class="{ active: !queryParams.categoryId }"
              @click="selectCategory(null)"
            >
              全部商品
            </div>
            <div 
              v-for="category in firstLevelCategories" 
              :key="category.id"
              class="category-group"
            >
              <div 
                class="category-item category-parent"
                :class="{ 
                  active: queryParams.categoryId === category.id,
                  expanded: expandedCategory === category.id 
                }"
                @click="toggleCategory(category)"
              >
                <span>{{ category.categoryName }}</span>
                <el-icon class="arrow-icon">
                  <ArrowRight v-if="expandedCategory !== category.id" />
                  <ArrowDown v-else />
                </el-icon>
              </div>
              
              <!-- 二级分类 -->
              <transition name="slide">
                <div 
                  v-show="expandedCategory === category.id" 
                  class="sub-category-list"
                >
                  <div 
                    v-for="subCat in category.children" 
                    :key="subCat.id"
                    class="category-item sub-category"
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

        <!-- 价格筛选 -->
        <div class="filter-section">
          <h3>价格区间</h3>
          <el-radio-group v-model="priceRange" @change="handlePriceChange">
            <el-radio label="all">全部</el-radio>
            <el-radio label="0-500">0-500元</el-radio>
            <el-radio label="500-1000">500-1000元</el-radio>
            <el-radio label="1000-3000">1000-3000元</el-radio>
            <el-radio label="3000-5000">3000-5000元</el-radio>
            <el-radio label="5000+">5000元以上</el-radio>
          </el-radio-group>
        </div>

        <!-- 商品标签 -->
        <div class="filter-section">
          <h3>商品标签</h3>
          <el-checkbox-group v-model="selectedTags" @change="handleTagChange">
            <el-checkbox label="hot">热卖</el-checkbox>
            <el-checkbox label="new">新品</el-checkbox>
            <el-checkbox label="recommend">推荐</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 右侧商品列表 -->
      <div class="right-content">
        <!-- 搜索和排序栏 -->
        <div class="toolbar">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入商品名称或品牌"
            class="search-input"
            @keyup.enter="handleSearch"
            clearable
          >
            <template #append>
              <el-button icon="Search" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>

          <div class="sort-options">
            <el-button 
              :type="sortType === 'default' ? 'primary' : ''"
              @click="handleSort('default')"
            >
              综合排序
            </el-button>
            <el-button 
              :type="sortType === 'sales' ? 'primary' : ''"
              @click="handleSort('sales')"
            >
              销量
            </el-button>
            <el-button 
              :type="sortType === 'price' ? 'primary' : ''"
              @click="handleSort('price')"
            >
              价格
              <el-icon v-if="sortType === 'price'">
                <component :is="priceSort === 'asc' ? 'Top' : 'Bottom'" />
              </el-icon>
            </el-button>
            <el-button 
              :type="sortType === 'create_time' ? 'primary' : ''"
              @click="handleSort('create_time')"
            >
              上架时间
            </el-button>
          </div>
        </div>

        <!-- 当前筛选条件 -->
        <div v-if="hasFilters" class="filter-tags">
          <el-tag
            v-if="currentCategory"
            closable
            @close="selectCategory(null)"
          >
            {{ currentCategory.categoryName }}
          </el-tag>
          <el-tag
            v-if="priceRange !== 'all'"
            closable
            @close="clearPriceFilter"
          >
            {{ priceRange }}元
          </el-tag>
          <el-tag
            v-for="tag in selectedTags"
            :key="tag"
            closable
            @close="removeTag(tag)"
          >
            {{ tagNames[tag] }}
          </el-tag>
          <el-button text type="primary" size="small" @click="clearAllFilters">
            清空筛选
          </el-button>
        </div>

        <!-- 商品网格 -->
        <div v-loading="loading" class="product-grid">
          <div 
            v-for="product in productList" 
            :key="product.id"
            class="product-card"
            @click="goToDetail(product.id)"
          >
            <div class="product-image">
              <img :src="product.mainImage" :alt="product.productName">
              <div class="tags">
                <el-tag v-if="product.isHot" type="danger" size="small">热卖</el-tag>
                <el-tag v-if="product.isNew" type="success" size="small">新品</el-tag>
                <el-tag v-if="product.isRecommend" type="warning" size="small">推荐</el-tag>
              </div>
            </div>
            <div class="product-info">
              <h4 class="product-name">{{ product.productName }}</h4>
              <p class="product-subtitle">{{ product.subTitle }}</p>
              <div class="product-stats">
                <el-rate 
                  :model-value="Math.round((product.avgRating || 0) * 2) / 2"
                  disabled 
                  show-score
                  :score-template="`${(product.avgRating || 0).toFixed(1)}`"
                  :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                  text-color="#ff9900"
                />
                <span class="review-count">({{ product.reviewCount }}评价)</span>
              </div>
              <div class="product-bottom">
                <div class="price-section">
                  <span class="price">¥{{ product.price }}</span>
                  <span v-if="product.originalPrice" class="original-price">
                    ¥{{ product.originalPrice }}
                  </span>
                </div>
                <div class="sales">已售{{ product.sales }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty 
          v-if="!loading && productList.length === 0" 
          description="暂无商品"
        />

        <!-- 分页 -->
        <div v-if="total > 0" class="pagination">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            :page-sizes="[20, 40, 60, 80]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, ArrowDown, Search, Top, Bottom } from '@element-plus/icons-vue'
import { getCategoryTree } from '@/api/category'
import { getProductList } from '@/api/product'

const router = useRouter()
const route = useRoute()

// 数据
const loading = ref(false)
const firstLevelCategories = ref([])
const productList = ref([])
const total = ref(0)
const currentCategory = ref(null)
const expandedCategory = ref(null)
const priceRange = ref('all')
const selectedTags = ref([])
const sortType = ref('default')
const priceSort = ref('desc')

// 标签名称映射
const tagNames = {
  hot: '热卖',
  new: '新品',
  recommend: '推荐'
}

// 查询参数
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

// 是否有筛选条件
const hasFilters = computed(() => {
  return currentCategory.value || 
         priceRange.value !== 'all' || 
         selectedTags.value.length > 0
})

// 加载分类树
const loadCategories = async () => {
  try {
    const res = await getCategoryTree()
    firstLevelCategories.value = res.data
    
    // 如果URL中有分类ID,自动展开
    if (queryParams.categoryId) {
      const categoryId = queryParams.categoryId
      // 判断是一级还是二级分类
      const firstLevel = firstLevelCategories.value.find(c => c.id === categoryId)
      if (firstLevel) {
        expandedCategory.value = categoryId
        currentCategory.value = firstLevel
      } else {
        // 二级分类,找到父级
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

// 加载商品列表
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

// 切换分类展开/收起
const toggleCategory = (category) => {
  if (expandedCategory.value === category.id) {
    expandedCategory.value = null
  } else {
    expandedCategory.value = category.id
  }
  // 选中一级分类
  selectCategory(category)
}

// 选择分类
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

// 价格筛选
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

// 清除价格筛选
const clearPriceFilter = () => {
  priceRange.value = 'all'
  handlePriceChange()
}

// 标签筛选
const handleTagChange = () => {
  queryParams.isHot = selectedTags.value.includes('hot') ? 1 : null
  queryParams.isNew = selectedTags.value.includes('new') ? 1 : null
  queryParams.isRecommend = selectedTags.value.includes('recommend') ? 1 : null
  queryParams.pageNum = 1
  loadProducts()
}

// 移除标签
const removeTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
    handleTagChange()
  }
}

// 清空所有筛选
const clearAllFilters = () => {
  queryParams.categoryId = null
  currentCategory.value = null
  expandedCategory.value = null
  priceRange.value = 'all'
  selectedTags.value = []
  queryParams.minPrice = null
  queryParams.maxPrice = null
  queryParams.isHot = null
  queryParams.isNew = null
  queryParams.isRecommend = null
  queryParams.pageNum = 1
  loadProducts()
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  loadProducts()
}

// 排序
const handleSort = (type) => {
  sortType.value = type
  if (type === 'default') {
    queryParams.sortField = null
    queryParams.sortOrder = 'desc'
  } else if (type === 'price') {
    queryParams.sortField = 'price'
    priceSort.value = priceSort.value === 'asc' ? 'desc' : 'asc'
    queryParams.sortOrder = priceSort.value
  } else {
    queryParams.sortField = type
    queryParams.sortOrder = 'desc'
  }
  queryParams.pageNum = 1
  loadProducts()
}

// 分页
const handleSizeChange = () => {
  queryParams.pageNum = 1
  loadProducts()
}

const handleCurrentChange = () => {
  loadProducts()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 跳转详情页
const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

// 监听路由变化
watch(() => route.query.categoryId, (newVal) => {
  if (newVal) {
    queryParams.categoryId = Number(newVal)
    loadProducts()
  }
})

// 初始化
onMounted(() => {
  // 从路由获取分类ID
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
.product-list-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.category-nav {
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.main-content {
  display: flex;
  gap: 20px;
}

.left-sidebar {
  width: 240px;
  flex-shrink: 0;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 15px;

  h3 {
    font-size: 16px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #409EFF;
  }

  .category-list {
    .category-group {
      margin-bottom: 5px;
    }

    .category-item {
      padding: 10px 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &:hover {
        background: #f5f7fa;
      }

      &.active {
        background: #409EFF;
        color: #fff;
      }

      &.category-parent {
        font-weight: 500;

        .arrow-icon {
          transition: transform 0.3s;
        }

        &.expanded .arrow-icon {
          transform: rotate(90deg);
        }
      }

      &.sub-category {
        font-size: 14px;
        padding-left: 24px;
        color: #606266;

        &.active {
          background: #ecf5ff;
          color: #409EFF;
        }
      }
    }

    .sub-category-list {
      margin-top: 5px;
    }
  }

  .el-radio-group,
  .el-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.right-content {
  flex: 1;
}

.toolbar {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;

  .search-input {
    width: 400px;
  }

  .sort-options {
    display: flex;
    gap: 10px;
  }
}

.filter-tags {
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-5px);
  }

  .product-image {
    position: relative;
    width: 100%;
    height: 260px;
    overflow: hidden;
    background: #f5f7fa;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    &:hover img {
      transform: scale(1.1);
    }

    .tags {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      gap: 5px;
    }
  }

  .product-info {
    padding: 15px;

    .product-name {
      font-size: 16px;
      margin-bottom: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      min-height: 44px;
    }

    .product-subtitle {
      font-size: 12px;
      color: #909399;
      margin-bottom: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      .review-count {
        font-size: 12px;
        color: #909399;
      }
    }

    .product-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .price-section {
        .price {
          font-size: 22px;
          color: #f56c6c;
          font-weight: bold;
        }

        .original-price {
          font-size: 14px;
          color: #909399;
          text-decoration: line-through;
          margin-left: 8px;
        }
      }

      .sales {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: #fff;
  border-radius: 8px;
}

// 滑动动画
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.slide-enter-to, .slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    flex-direction: column;

    .search-input {
      width: 100%;
    }

    .sort-options {
      width: 100%;
      flex-wrap: wrap;
    }
  }
}
</style>