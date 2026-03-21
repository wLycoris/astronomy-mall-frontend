<template>
  <div class="course-list-page">

    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <!-- 返回首页（左上角，绝对定位不影响标题居中） -->
      <el-button class="back-home-btn" link @click="router.push('/home')">
        <el-icon><ArrowLeft /></el-icon> 返回首页
      </el-button>
      <h1 class="page-title">🔭 天文课程</h1>
      <p class="page-subtitle">全部免费 · 边学边探索宇宙的奥秘</p>
      <!-- 登录用户快捷入口（右上角） -->
      <div v-if="getToken()" class="header-quick-links">
        <el-button link size="small" @click="router.push('/user/course-history')">
          <el-icon><VideoPlay /></el-icon> 学习历史
        </el-button>
        <el-button link size="small" @click="router.push('/user/course-favorite')">
          <el-icon><Star /></el-icon> 我的收藏
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

        <!-- 关键词搜索 -->
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
          <!-- 清空标签按钮（选中时显示） -->
          <button
              v-if="selectedTags.length > 0"
              class="clear-tags-btn"
              @click="clearTags"
          >
            清空标签筛选 ✕
          </button>
        </div>
      </div>

      <!-- 当前筛选条件摘要 -->
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

      <!-- 空状态 -->
      <el-empty
          v-if="!loading && courseList.length === 0"
          description="暂无课程，换个条件试试？"
          :image-size="120"
      />

      <!-- 课程卡片网格 -->
      <div v-else class="course-grid">
        <div
            v-for="course in courseList"
            :key="course.id"
            class="course-card"
            @click="goToDetail(course.id)"
        >
          <!-- 封面图 -->
          <div class="card-cover">
            <el-image
                :src="course.cover"
                fit="cover"
                lazy
                class="cover-img"
            >
              <!-- ✅ 修复：src=null 时 el-image 直接走 #error 插槽
                   所以把 defaultCover 放在这里，而不是 :src 的 || 运算
                   无论是 cover 为 null 还是图片链接加载失败，都显示默认星空封面 -->
              <template #error>
                <img :src="defaultCover" style="width:100%;height:100%;object-fit:cover;" />
              </template>
            </el-image>

            <!-- 类型标签 -->
            <el-tag
                class="type-badge"
                :type="course.type === 0 ? 'danger' : 'success'"
                size="small"
                effect="dark"
            >
              {{ course.type === 0 ? '▶ 视频课' : '📖 书本课' }}
            </el-tag>

            <!-- NASA/火星特殊标识 -->
            <el-tag
                v-if="course.isApodCourse === 1"
                class="nasa-badge"
                type="warning"
                size="small"
                effect="dark"
            >
              🌌 NASA
            </el-tag>
            <el-tag
                v-if="course.isMarsCourse === 1"
                class="mars-badge"
                type="warning"
                size="small"
                effect="dark"
            >
              🔴 火星
            </el-tag>
          </div>

          <!-- 卡片信息 -->
          <div class="card-body">
            <h3 class="card-title" :title="course.title">{{ course.title }}</h3>
            <p v-if="course.subtitle" class="card-subtitle">{{ course.subtitle }}</p>

            <!-- 难度 + 章节数 -->
            <div class="card-meta">
              <el-tag size="small" :type="difficultyTagType(course.difficulty)">
                {{ course.difficultyText }}
              </el-tag>
              <span class="chapter-count">
                <el-icon><Document /></el-icon>
                {{ course.chapterCount }} 章节
              </span>
            </div>

            <!-- 标签 chips -->
            <div v-if="parseTags(course.tags).length > 0" class="card-tags">
              <el-tag
                  v-for="tag in parseTags(course.tags).slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                  class="card-tag"
              >{{ tag }}</el-tag>
              <span v-if="parseTags(course.tags).length > 3" class="more-tags">
                +{{ parseTags(course.tags).length - 3 }}
              </span>
            </div>

            <!-- 收藏按钮 + 学习进度 -->
            <div class="card-footer">
              <span v-if="course.lastChapterId" class="progress-hint">
                📍 继续学习
              </span>
              <span v-else class="view-count">
                {{ course.viewCount || 0 }} 人学习
              </span>

              <!-- 收藏按钮（始终显示，未登录点击时提示去登录） -->
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
    <div v-if="total > filters.pageSize" class="pagination-wrapper">
      <el-pagination
          v-model:current-page="filters.pageNum"
          :page-size="filters.pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="handlePageChange"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Document, Picture, Star, StarFilled, ArrowLeft, VideoPlay } from '@element-plus/icons-vue'
import { getCourseList, toggleCourseFavorite } from '@/api/course'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'

// ======================== 常量配置 ========================

/** 预设18个标签池（与后端 tb_course.tags 字段对应） */
const PRESET_TAGS = [
  '深空摄影', '行星观测', '月球', '太阳系', '星座入门', '天体物理',
  '望远镜使用', '赤道仪', '目镜选择', '滤镜应用',
  'NASA科普', '哈勃望远镜', '韦伯望远镜', '星云', '星系',
  '天文摄影后期', '天气与选址', '星图使用'
]

/** 课程类型 Tab 配置 */
const typeTabs = [
  { value: null,  label: '全部',   icon: '📚' },
  { value: 0,     label: '视频课', icon: '▶' },
  { value: 1,     label: '书本课', icon: '📖' }
]

/** 难度筛选选项 */
const difficultyOptions = [
  { value: null, label: '全部' },
  { value: 1,    label: '入门' },
  { value: 2,    label: '进阶' },
  { value: 3,    label: '高级' }
]

/**
 * 默认封面图（内联 SVG data URI）
 *
 * ✅ 修复说明：
 * 原来用 via.placeholder.com 外部服务，容易因网络/CORS/中文编码问题显示不出来。
 * 改为内联 SVG data URI，完全不依赖外部服务，任何情况下都能显示。
 * 效果：深色星空背景 + 望远镜 emoji + "天文课程"文字
 */
const defaultCover = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#bg)"/>
  <!-- 装饰星点 -->
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
  <!-- 望远镜图标（简化） -->
  <text x="200" y="115" font-size="48" text-anchor="middle" dominant-baseline="middle">🔭</text>
  <!-- 文字 -->
  <text x="200" y="158" font-size="16" font-family="sans-serif" font-weight="600"
        text-anchor="middle" fill="#c4b5fd">天文课程</text>
  <text x="200" y="178" font-size="11" font-family="sans-serif"
        text-anchor="middle" fill="#7c6aad">Astronomy Course</text>
</svg>
`)}`

// ======================== 状态 ========================
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isLogin = computed(() => userStore.isLogin)

const loading = ref(false)
const courseList = ref([])
const total = ref(0)

/** 当前选中的标签列表（多选，AND关系） */
const selectedTags = ref([])

/** 查询参数 */
const filters = reactive({
  pageNum: 1,
  pageSize: 12,
  type: null,
  difficulty: null,
  keyword: '',
  tags: ''
})

/** 是否有激活的筛选条件 */
const hasActiveFilters = computed(() => {
  return filters.type !== null
      || filters.difficulty !== null
      || filters.keyword !== ''
      || selectedTags.value.length > 0
})

// ======================== 方法 ========================

/**
 * 加载课程列表
 *
 * ✅ 修复说明：
 * 原来用 res.code === 200 做二次判断，不符合项目规范。
 * request.js 响应拦截器已统一处理非200情况并 reject，
 * 这里直接取 res.data 即可（参考 ReviewManage.vue 规范）。
 */
async function loadCourseList() {
  loading.value = true
  try {
    filters.tags = selectedTags.value.join(',')
    const res = await getCourseList({ ...filters })
    courseList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (e) {
    console.error('[CourseList] 加载失败', e)
  } finally {
    loading.value = false
  }
}

/** 切换课程类型 Tab */
function handleTypeChange(type) {
  filters.type = type
  filters.pageNum = 1
  loadCourseList()
}

/** 切换难度 */
function handleDifficultyChange(difficulty) {
  filters.difficulty = difficulty
  filters.pageNum = 1
  loadCourseList()
}

/** 搜索框输入（防抖300ms） */
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

/** 切换标签选中状态（AND多选） */
function toggleTag(tag) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
  filters.pageNum = 1
  loadCourseList()
}

/** 清空所有已选标签 */
function clearTags() {
  selectedTags.value = []
  filters.pageNum = 1
  loadCourseList()
}

/** 分页切换 */
function handlePageChange(page) {
  filters.pageNum = page
  loadCourseList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 跳转课程详情页 */
function goToDetail(courseId) {
  router.push({ name: 'CourseDetail', params: { id: courseId } })
}

/** 解析课程标签 JSON 字符串为数组 */
function parseTags(tagsStr) {
  if (!tagsStr) return []
  try {
    return JSON.parse(tagsStr)
  } catch {
    return []
  }
}

/** 根据难度返回 el-tag 类型 */
function difficultyTagType(difficulty) {
  const map = { 1: 'success', 2: 'warning', 3: 'danger' }
  return map[difficulty] || 'info'
}

/** 收藏/取消收藏（始终显示，未登录时提示去登录） */
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
/* 返回首页按钮：左上角绝对定位，不影响标题居中 */
.back-home-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #888;
  padding: 0;
}
.back-home-btn:hover {
  color: #7c3aed;
}
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
/* 登录用户快捷入口：右上角绝对定位，与返回按钮对称 */
.header-quick-links {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
}
.header-quick-links .el-button {
  font-size: 13px;
  color: #888;
}
.header-quick-links .el-button:hover {
  color: #7c3aed;
}

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
.filter-row:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  min-width: 42px;
  flex-shrink: 0;
}

/* 类型 Tab */
.type-tabs {
  display: flex;
  gap: 6px;
  flex: 1;
}
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
.type-tab:hover {
  border-color: #7c3aed;
  color: #7c3aed;
}
.type-tab.active {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
  font-weight: 600;
}
.tab-icon {
  font-size: 16px;
}

/* 难度按钮 */
.difficulty-tabs {
  display: flex;
  gap: 6px;
}
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
.diff-btn:hover {
  border-color: #7c3aed;
  color: #7c3aed;
}
.diff-btn.active {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
}

/* 标签行 */
.tags-row {
  align-items: flex-start;
}
.tag-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}
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
.tag-chip:hover {
  border-color: #7c3aed;
  color: #7c3aed;
  background: #f3eeff;
}
.tag-chip.selected {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
  font-weight: 500;
}
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
.clear-tags-btn:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

/* 筛选摘要 */
.filter-summary {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  margin-top: 12px;
}
.summary-text {
  font-size: 13px;
  color: #888;
}
.summary-text strong {
  color: #7c3aed;
}

/* ===== 课程网格 ===== */
.course-grid-wrapper {
  min-height: 300px;
}
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* 课程卡片 */
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

/* 封面 */
.card-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
  background: #1a1a2e;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}
.type-badge {
  position: absolute;
  top: 8px;
  left: 8px;
}
.nasa-badge, .mars-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 卡片内容 */
.card-body {
  padding: 14px 16px;
}
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
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.chapter-count {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #888;
}
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}
.card-tag {
  font-size: 11px !important;
}
.more-tags {
  font-size: 11px;
  color: #aaa;
  align-self: center;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.progress-hint {
  font-size: 12px;
  color: #7c3aed;
  font-weight: 500;
}
.view-count {
  font-size: 12px;
  color: #aaa;
}
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
.favorite-btn:hover {
  color: #f59e0b;
}
.favorite-btn.active {
  color: #f59e0b;
}

/* ===== 分页 ===== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .course-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }
  .type-tabs {
    flex-wrap: wrap;
  }
  .search-box {
    width: 100%;
  }
  .search-box .el-input {
    width: 100% !important;
  }
  /* 小屏返回按钮改为相对定位，不遮挡标题 */
  .back-home-btn {
    position: static;
    transform: none;
    display: block;
    margin-bottom: 8px;
  }
  /* 小屏快捷入口跟着降级 */
  .header-quick-links {
    position: static;
    transform: none;
    justify-content: center;
    margin-top: 8px;
  }
}
</style>