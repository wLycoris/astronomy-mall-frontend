<template>
  <div class="course-list-page">

    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <el-button class="back-home-btn" link @click="router.push('/home')">
        <el-icon><ArrowLeft /></el-icon> 返回首页
      </el-button>
      <h1 class="page-title">🔭 天文课程</h1>
      <p class="page-subtitle">全部免费 · 边学边探索宇宙的奥秘</p>
      <div v-if="getToken()" class="header-quick-links">
        <el-button link size="small" @click="router.push('/user/course-history')">
          <el-icon><VideoPlay /></el-icon> 学习历史
        </el-button>
        <el-button link size="small" @click="router.push('/user/course-favorite')">
          <el-icon><Star /></el-icon> 我的收藏
        </el-button>
        <!-- ✅ 5.6 新增：我的评价入口 -->
        <el-button link size="small" @click="router.push('/user/course-reviews')">
          <el-icon><ChatDotRound /></el-icon> 我的评价
        </el-button>
      </div>
    </div>

    <!-- ===== 筛选区域 ===== -->
    <div class="filter-section">

      <!-- 课程类型 Tab -->
      <div class="filter-row">
        <div class="type-tabs">
          <button
              v-for="tab in typeTabs"
              :key="tab.value"
              :class="['type-tab', { active: filters.type === tab.value }]"
              @click="handleTypeChange(tab.value)"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>
        <div class="search-box">
          <el-input
              v-model="filters.keyword"
              placeholder="搜索课程标题..."
              clearable
              @input="handleSearchInput"
              @clear="handleSearch"
              style="width: 240px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 难度筛选 -->
      <div class="filter-row">
        <span class="filter-label">难度：</span>
        <div class="difficulty-tabs">
          <button
              v-for="diff in difficultyOptions"
              :key="diff.value"
              :class="['diff-btn', { active: filters.difficulty === diff.value }]"
              @click="handleDifficultyChange(diff.value)"
          >
            {{ diff.label }}
          </button>
        </div>
      </div>

      <!-- 标签多选 chips（AND筛选） -->
      <div class="filter-row tags-row">
        <span class="filter-label">标签：</span>
        <div class="tag-chips-container">
          <div
              v-for="tag in PRESET_TAGS"
              :key="tag"
              :class="['tag-chip', { selected: selectedTags.includes(tag) }]"
              @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
          <button
              v-if="selectedTags.length > 0"
              class="clear-tags-btn"
              @click="clearTags"
          >
            清空标签筛选 ✕
          </button>
        </div>
      </div>

      <!-- 筛选条件摘要 -->
      <div v-if="hasActiveFilters" class="filter-summary">
        <span class="summary-text">
          共找到 <strong>{{ total }}</strong> 门课程
          <template v-if="selectedTags.length > 0">
            · 已选标签：
            <el-tag
                v-for="tag in selectedTags"
                :key="tag"
                size="small"
                closable
                @close="toggleTag(tag)"
                style="margin-right: 4px"
            >{{ tag }}</el-tag>
          </template>
        </span>
      </div>
    </div>

    <!-- ===== 课程卡片列表 ===== -->
    <div v-loading="loading" class="course-grid-wrapper">
      <el-empty
          v-if="!loading && courseList.length === 0"
          description="暂无课程，换个条件试试？"
          :image-size="120"
      />
      <div v-else class="course-grid">
        <div
            v-for="course in courseList"
            :key="course.id"
            class="course-card"
            @click="goToDetail(course.id)"
        >
          <!-- 封面图 -->
          <div class="card-cover">
            <el-image :src="course.cover" fit="cover" lazy class="cover-img">
              <template #error>
                <img :src="defaultCover" style="width:100%;height:100%;object-fit:cover;" />
              </template>
            </el-image>
            <el-tag class="type-badge" :type="course.type === 0 ? 'danger' : 'success'" size="small" effect="dark">
              {{ course.type === 0 ? '▶ 视频课' : '📖 书本课' }}
            </el-tag>
            <el-tag v-if="course.isApodCourse === 1" class="nasa-badge" type="warning" size="small" effect="dark">🌌 NASA</el-tag>
            <el-tag v-if="course.isMarsCourse === 1" class="mars-badge" type="warning" size="small" effect="dark">🔴 火星</el-tag>
          </div>

          <!-- 卡片信息 -->
          <div class="card-body">
            <h3 class="card-title" :title="course.title">{{ course.title }}</h3>
            <p v-if="course.subtitle" class="card-subtitle">{{ course.subtitle }}</p>
            <div class="card-meta">
              <el-tag size="small" :type="difficultyTagType(course.difficulty)">{{ course.difficultyText }}</el-tag>
              <span class="chapter-count">
                <el-icon><Document /></el-icon>
                {{ course.chapterCount }} 章节
              </span>
              <!-- ✅ 5.6 新增：评分展示 -->
              <span v-if="course.avgRating > 0" class="card-rating">
                <span class="rating-star">★</span>{{ course.avgRating }}
                <span class="rating-count">( {{ course.reviewCount }} )</span>
              </span>
            </div>
            <div v-if="parseTags(course.tags).length > 0" class="card-tags">
              <el-tag
                  v-for="tag in parseTags(course.tags).slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                  class="card-tag"
              >{{ tag }}</el-tag>
              <span v-if="parseTags(course.tags).length > 3" class="more-tags">+{{ parseTags(course.tags).length - 3 }}</span>
            </div>
            <div class="card-footer">
              <span v-if="course.lastChapterId" class="progress-hint">📍 继续学习</span>
              <span v-else class="view-count">{{ course.viewCount || 0 }} 人学习</span>
              <button
                  :class="['favorite-btn', { active: course.isFavorite }]"
                  @click.stop="handleToggleFavorite(course)"
              >
                <el-icon>
                  <StarFilled v-if="course.isFavorite" />
                  <Star v-else />
                </el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 分页 ===== -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
      <el-pagination
          v-model:current-page="filters.pageNum"
          :page-size="filters.pageSize"
          :total="total"
          layout="prev, pager, next, jumper, total"
          background
          @current-change="handlePageChange"
      />
    </div>

    <!-- ===== 5.4 「为你推荐」横向滑动区块（放在页面最底部）===== -->
    <div
        v-if="getToken() && recommendList.length > 0"
        class="recommend-section"
    >
      <div class="recommend-header">
        <h2 class="recommend-title">
          <span class="recommend-icon">✨</span>
          为你推荐
        </h2>
        <p class="recommend-subtitle">根据你近3个月购买的器材，为你精选相关课程</p>
      </div>

      <!-- 横向滑动容器 -->
      <div
          class="recommend-scroll-wrapper"
          ref="scrollWrapperRef"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
      >
        <div class="recommend-scroll">
          <div
              v-for="course in recommendList"
              :key="course.id"
              class="recommend-card"
              @click="goToDetail(course.id)"
          >
            <!-- 封面图 -->
            <div class="rec-card-cover">
              <el-image :src="course.cover" fit="cover" lazy class="rec-cover-img">
                <template #error>
                  <img :src="defaultCover" style="width:100%;height:100%;object-fit:cover;" />
                </template>
              </el-image>
              <el-tag class="rec-type-badge" :type="course.type === 0 ? 'danger' : 'success'" size="small" effect="dark">
                {{ course.type === 0 ? '▶ 视频课' : '📖 书本课' }}
              </el-tag>
              <el-tag v-if="course.isApodCourse === 1" class="rec-nasa-badge" type="warning" size="small" effect="dark">🌌 NASA</el-tag>
              <el-tag v-if="course.isMarsCourse === 1" class="rec-mars-badge" type="warning" size="small" effect="dark">🔴 火星</el-tag>
            </div>

            <!-- 卡片内容 -->
            <div class="rec-card-body">
              <h3 class="rec-card-title" :title="course.title">{{ course.title }}</h3>
              <div class="rec-card-meta">
                <el-tag size="small" :type="difficultyTagType(course.difficulty)">{{ course.difficultyText }}</el-tag>
                <span class="rec-chapter-count">
                  <el-icon><Document /></el-icon>
                  {{ course.chapterCount }} 章节
                </span>
                <!-- ✅ 5.6 新增：推荐卡片评分 -->
                <span v-if="course.avgRating > 0" class="rec-rating">
                  <span class="rating-star">★</span>{{ course.avgRating }}
                </span>
              </div>
              <div v-if="parseTags(course.tags).length > 0" class="rec-card-tags">
                <el-tag
                    v-for="tag in parseTags(course.tags).slice(0, 2)"
                    :key="tag"
                    size="small"
                    type="info"
                    class="rec-card-tag"
                >{{ tag }}</el-tag>
                <span v-if="parseTags(course.tags).length > 2" class="rec-more-tags">+{{ parseTags(course.tags).length - 2 }}</span>
              </div>
              <div class="rec-card-footer">
                <span v-if="course.lastChapterId" class="rec-progress-hint">📍 继续学习</span>
                <span v-else class="rec-view-count">{{ course.viewCount || 0 }} 人学习</span>
                <button
                    :class="['rec-favorite-btn', { active: course.isFavorite }]"
                    @click.stop="handleToggleFavorite(course)"
                >
                  <el-icon>
                    <StarFilled v-if="course.isFavorite" />
                    <Star v-else />
                  </el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Document, Star, StarFilled, ArrowLeft, VideoPlay, ChatDotRound } from '@element-plus/icons-vue'
import { getCourseList, toggleCourseFavorite, getRecommendCourses } from '@/api/course'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'

// ======================== 常量配置 ========================

const PRESET_TAGS = [
  '深空摄影', '行星观测', '月球', '太阳系', '星座入门', '天体物理',
  '望远镜使用', '赤道仪', '目镜选择', '滤镜应用',
  'NASA科普', '哈勃望远镜', '韦伯望远镜', '星云', '星系',
  '天文摄影后期', '天气与选址', '星图使用'
]

const typeTabs = [
  { value: null, label: '全部',   icon: '📚' },
  { value: 0,    label: '视频课', icon: '▶'  },
  { value: 1,    label: '书本课', icon: '📖' }
]

const difficultyOptions = [
  { value: null, label: '全部' },
  { value: 1,    label: '入门' },
  { value: 2,    label: '进阶' },
  { value: 3,    label: '高级' }
]

const defaultCover = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#bg)"/>
  <circle cx="40"  cy="30"  r="1.5" fill="#ffffff" opacity="0.6"/>
  <circle cx="120" cy="15"  r="1"   fill="#ffffff" opacity="0.4"/>
  <circle cx="200" cy="40"  r="2"   fill="#ffffff" opacity="0.7"/>
  <circle cx="300" cy="20"  r="1.5" fill="#ffffff" opacity="0.5"/>
  <circle cx="360" cy="50"  r="1"   fill="#ffffff" opacity="0.6"/>
  <circle cx="80"  cy="70"  r="1"   fill="#ffffff" opacity="0.3"/>
  <circle cx="340" cy="80"  r="1.5" fill="#ffffff" opacity="0.5"/>
  <circle cx="60"  cy="180" r="1"   fill="#ffffff" opacity="0.4"/>
  <circle cx="380" cy="160" r="1.5" fill="#ffffff" opacity="0.5"/>
  <circle cx="160" cy="190" r="1"   fill="#ffffff" opacity="0.3"/>
  <circle cx="260" cy="200" r="2"   fill="#ffffff" opacity="0.4"/>
  <text x="200" y="115" font-size="48" text-anchor="middle" dominant-baseline="middle">🔭</text>
  <text x="200" y="158" font-size="16" font-family="sans-serif" font-weight="600"
        text-anchor="middle" fill="#c4b5fd">天文课程</text>
  <text x="200" y="178" font-size="11" font-family="sans-serif"
        text-anchor="middle" fill="#7c6aad">Astronomy Course</text>
</svg>
`)}`

// ======================== 状态 ========================
const router = useRouter()
const route  = useRoute()

const loading      = ref(false)
const courseList   = ref([])
const total        = ref(0)

const recommendList    = ref([])
const scrollWrapperRef = ref(null)

const selectedTags = ref([])

const filters = reactive({
  pageNum:  1,
  pageSize: 12,
  type:       null,
  difficulty: null,
  keyword:    '',
  tags:       ''
})

const totalPages = computed(() => Math.ceil(total.value / filters.pageSize))

const hasActiveFilters = computed(() =>
    filters.type !== null
    || filters.difficulty !== null
    || filters.keyword !== ''
    || selectedTags.value.length > 0
)

// ======================== 鼠标拖拽横向滚动 ========================
let isDragging  = false
let dragStartX  = 0
let scrollLeft0 = 0

function onMouseDown(e) {
  isDragging  = true
  dragStartX  = e.pageX - scrollWrapperRef.value.offsetLeft
  scrollLeft0 = scrollWrapperRef.value.scrollLeft
  scrollWrapperRef.value.style.cursor = 'grabbing'
}
function onMouseMove(e) {
  if (!isDragging) return
  e.preventDefault()
  const x    = e.pageX - scrollWrapperRef.value.offsetLeft
  const walk = x - dragStartX
  scrollWrapperRef.value.scrollLeft = scrollLeft0 - walk
}
function onMouseUp() {
  isDragging = false
  if (scrollWrapperRef.value) {
    scrollWrapperRef.value.style.cursor = 'grab'
  }
}

// ======================== 数据加载 ========================

async function loadCourseList() {
  loading.value = true
  try {
    filters.tags = selectedTags.value.join(',')
    const res = await getCourseList({ ...filters })
    courseList.value = res.data.records || []
    total.value      = res.data.total   || 0
  } catch (e) {
    console.error('[CourseList] 加载失败', e)
  } finally {
    loading.value = false
  }
}

async function loadRecommendCourses() {
  if (!getToken()) return
  try {
    const res = await getRecommendCourses()
    if (res.data && res.data.length > 0) {
      recommendList.value = res.data
    }
  } catch (e) {
    console.warn('[CourseList] 推荐课程加载失败（静默保留旧数据）', e)
  }
}

// ======================== 筛选/搜索/分页 ========================

function handleTypeChange(type) {
  filters.type    = type
  filters.pageNum = 1
  loadCourseList()
}

function handleDifficultyChange(difficulty) {
  filters.difficulty = difficulty
  filters.pageNum    = 1
  loadCourseList()
}

let searchTimer = null
function handleSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.pageNum = 1
    loadCourseList()
  }, 300)
}
function handleSearch() {
  filters.pageNum = 1
  loadCourseList()
}

function toggleTag(tag) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) selectedTags.value.splice(idx, 1)
  else          selectedTags.value.push(tag)
  filters.pageNum = 1
  loadCourseList()
}

function clearTags() {
  selectedTags.value = []
  filters.pageNum    = 1
  loadCourseList()
}

function handlePageChange(page) {
  filters.pageNum = page
  loadCourseList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ======================== 工具方法 ========================

function goToDetail(courseId) {
  router.push({ name: 'CourseDetail', params: { id: courseId } })
}

function parseTags(tagsStr) {
  if (!tagsStr) return []
  try   { return JSON.parse(tagsStr) }
  catch { return [] }
}

function difficultyTagType(difficulty) {
  return { 1: 'success', 2: 'warning', 3: 'danger' }[difficulty] || 'info'
}

async function handleToggleFavorite(course) {
  if (!getToken()) {
    ElMessage.warning('请先登录后再收藏')
    return
  }
  try {
    const res = await toggleCourseFavorite(course.id)
    course.isFavorite = res.data.isFavorite
    ElMessage.success(res.data.message)
  } catch (e) {
    ElMessage.error('操作失败，请重试')
  }
}

// ======================== 初始化 ========================
onMounted(() => {
  if (route.query.type !== undefined) {
    filters.type = Number(route.query.type)
  }
  loadCourseList()
  loadRecommendCourses()
})
</script>

<style scoped>
.course-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* ===== 页面头部 ===== */
.page-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
}
.back-home-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #888;
  padding: 0;
}
.back-home-btn:hover { color: #7c3aed; }
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}
.page-subtitle {
  color: #888;
  font-size: 14px;
  margin: 0;
}
.header-quick-links {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
}
.header-quick-links .el-button { font-size: 13px; color: #888; }
.header-quick-links .el-button:hover { color: #7c3aed; }

/* ===== 筛选区域 ===== */
.filter-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.filter-row:last-child { margin-bottom: 0; }
.filter-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  min-width: 42px;
  flex-shrink: 0;
}
.type-tabs { display: flex; gap: 6px; flex: 1; }
.type-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 20px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: all 0.2s;
}
.type-tab:hover  { border-color: #7c3aed; color: #7c3aed; }
.type-tab.active { background: #7c3aed; border-color: #7c3aed; color: #fff; font-weight: 600; }
.tab-icon { font-size: 16px; }
.difficulty-tabs { display: flex; gap: 6px; }
.diff-btn {
  padding: 5px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  transition: all 0.2s;
}
.diff-btn:hover  { border-color: #7c3aed; color: #7c3aed; }
.diff-btn.active { background: #7c3aed; border-color: #7c3aed; color: #fff; }
.tags-row { align-items: flex-start; }
.tag-chips-container { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; }
.tag-chip {
  padding: 4px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 16px;
  background: #f9f9f9;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  transition: all 0.18s;
  user-select: none;
}
.tag-chip:hover    { border-color: #7c3aed; color: #7c3aed; background: #f3eeff; }
.tag-chip.selected { background: #7c3aed; border-color: #7c3aed; color: #fff; font-weight: 500; }
.clear-tags-btn {
  padding: 4px 10px;
  border: 1.5px dashed #e0e0e0;
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #999;
  transition: all 0.18s;
}
.clear-tags-btn:hover { border-color: #f56c6c; color: #f56c6c; }
.filter-summary { border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: 12px; }
.summary-text { font-size: 13px; color: #888; }
.summary-text strong { color: #7c3aed; }

/* ===== 课程网格 ===== */
.course-grid-wrapper { min-height: 300px; }
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.course-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(124,58,237,0.12);
}
.card-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
  background: #1a1a2e;
}
.cover-img  { width: 100%; height: 100%; }
.type-badge { position: absolute; top: 8px; left: 8px; }
.nasa-badge, .mars-badge { position: absolute; top: 8px; right: 8px; }
.card-body  { padding: 14px 16px; }
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-subtitle {
  font-size: 12px;
  color: #999;
  margin: 0 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.chapter-count { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #888; }

/* ✅ 5.6 新增：评分样式 */
.card-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #888;
}
.rating-star { color: #f59e0b; font-size: 13px; }
.rating-count { color: #bbb; }

.card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.card-tag { font-size: 11px !important; }
.more-tags { font-size: 11px; color: #aaa; align-self: center; }
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.progress-hint { font-size: 12px; color: #7c3aed; font-weight: 500; }
.view-count    { font-size: 12px; color: #aaa; }
.favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #ccc;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.favorite-btn:hover  { color: #f59e0b; }
.favorite-btn.active { color: #f59e0b; }

/* ===== 分页 ===== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  margin-bottom: 32px;
}

/* ===== 5.4 「为你推荐」区块（底部常驻）===== */
.recommend-section {
  background: linear-gradient(135deg, #f5f0ff 0%, #ede9fe 50%, #f0f4ff 100%);
  border-radius: 16px;
  padding: 20px 24px;
  margin-top: 8px;
  border: 1px solid #e5d9fd;
  box-shadow: 0 2px 16px rgba(124, 58, 237, 0.06);
}
.recommend-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;
}
.recommend-title {
  font-size: 17px;
  font-weight: 700;
  color: #4c1d95;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.recommend-icon   { font-size: 18px; }
.recommend-subtitle { font-size: 12px; color: #7c6aad; margin: 0; }
.recommend-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  cursor: grab;
  user-select: none;
  width: 100%;
  padding-bottom: 4px;
}
.recommend-scroll-wrapper::-webkit-scrollbar { height: 4px; }
.recommend-scroll-wrapper::-webkit-scrollbar-track { background: #ede9fe; border-radius: 2px; }
.recommend-scroll-wrapper::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 2px; }
.recommend-scroll-wrapper::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
.recommend-scroll {
  display: flex;
  gap: 16px;
  padding-bottom: 8px;
  padding-right: 24px;
  min-width: max-content;
}

/* 推荐卡片 */
.recommend-card {
  flex-shrink: 0;
  width: 200px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid rgba(124,58,237,0.08);
}
.recommend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(124,58,237,0.15);
  border-color: rgba(124,58,237,0.2);
}
.rec-card-cover {
  position: relative;
  height: 110px;
  overflow: hidden;
  background: #1a1a2e;
}
.rec-cover-img   { width: 100%; height: 100%; }
.rec-type-badge  { position: absolute; top: 6px; left: 6px; }
.rec-nasa-badge, .rec-mars-badge { position: absolute; top: 6px; right: 6px; }
.rec-card-body   { padding: 10px 12px 12px; }
.rec-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #222;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rec-card-meta   { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.rec-chapter-count { display: flex; align-items: center; gap: 2px; font-size: 11px; color: #aaa; }

/* ✅ 5.6 新增：推荐卡评分 */
.rec-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #888;
}

.rec-card-tags   { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 8px; }
.rec-card-tag    { font-size: 11px !important; }
.rec-more-tags   { font-size: 11px; color: #bbb; align-self: center; }
.rec-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}
.rec-progress-hint { font-size: 11px; color: #7c3aed; font-weight: 500; }
.rec-view-count    { font-size: 11px; color: #bbb; }
.rec-favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: #ccc;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  font-size: 14px;
}
.rec-favorite-btn:hover  { color: #f59e0b; }
.rec-favorite-btn.active { color: #f59e0b; }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .course-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }
  .type-tabs   { flex-wrap: wrap; }
  .search-box  { width: 100%; }
  .search-box .el-input { width: 100% !important; }
  .back-home-btn {
    position: static;
    transform: none;
    display: block;
    margin-bottom: 8px;
  }
  .header-quick-links {
    position: static;
    transform: none;
    justify-content: center;
    margin-top: 8px;
  }
  .recommend-section  { padding: 16px; }
  .recommend-card     { width: 170px; }
  .rec-card-cover     { height: 95px; }
}
</style>