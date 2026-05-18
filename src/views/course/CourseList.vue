<template>
  <div class="cl">
    <div class="paper-grain"></div>

    <!-- topbar -->
    <header class="topbar">
      <div class="topbar__left">
        <span class="crumb" @click="router.push('/home')">← 返回首页</span>
        <span class="sep">·</span>
        <span class="crumb crumb--on">课程中心</span>
      </div>
      <nav v-if="getToken()" class="quick-links">
        <span class="q" @click="router.push('/user/course-history')"><em>learning</em><i>·</i>历史</span>
        <span class="q" @click="router.push('/user/course-favorite')"><em>saved</em><i>·</i>收藏</span>
        <span class="q" @click="router.push('/user/course-reviews')"><em>my</em><i>·</i>评价</span>
      </nav>
    </header>

    <!-- masthead -->
    <section class="mast">
      <div class="mast__kicker"><em>a small field guide to the night sky</em></div>
      <h1 class="mast__title">天文 · 课程</h1>
      <div class="mast__rule"><span>☾</span></div>
      <p class="mast__sub">全部免费 · 边学边探索宇宙的奥秘</p>
    </section>

    <!-- filters -->
    <section class="filters">
      <!-- type segmented -->
      <div class="filters__type">
        <button
            v-for="tab in typeTabs" :key="tab.label"
            class="type-pill" :class="{ 'type-pill--on': filters.type === tab.value }"
            @click="handleTypeChange(tab.value)">
          <span class="type-pill__ico">{{ tab.icon }}</span>
          <span class="type-pill__lb">{{ tab.label }}</span>
        </button>

        <div class="filters__search">
          <el-icon class="filters__search-ico"><Search /></el-icon>
          <input
              v-model="filters.keyword"
              class="filters__search-in"
              placeholder="搜索课程标题 …"
              @input="handleSearchInput"
          />
          <span v-if="filters.keyword" class="filters__search-x" @click="() => { filters.keyword = ''; handleSearch() }">✕</span>
        </div>
      </div>

      <!-- difficulty -->
      <div class="filters__row">
        <span class="filters__label"><em>difficulty</em> · 难度</span>
        <div class="diff-line">
          <button
              v-for="diff in difficultyOptions" :key="diff.label"
              class="diff-lk" :class="{ 'diff-lk--on': filters.difficulty === diff.value }"
              @click="handleDifficultyChange(diff.value)">
            {{ diff.label }}
          </button>
        </div>
      </div>

      <!-- tags -->
      <div class="filters__row">
        <span class="filters__label"><em>tags</em> · 标签</span>
        <div class="tag-line">
          <span
              v-for="tag in PRESET_TAGS" :key="tag"
              class="tg" :class="{ 'tg--on': selectedTags.includes(tag) }"
              @click="toggleTag(tag)">
            {{ tag }}
          </span>
          <span v-if="selectedTags.length > 0" class="tg-clear" @click="clearTags">清空 ✕</span>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="filters__summary">
        <em>found</em>
        <strong>{{ total }}</strong>
        <em>courses</em>
      </div>
    </section>

    <!-- course plates -->
    <section v-loading="loading" class="plates-wrap">
      <el-empty v-if="!loading && courseList.length === 0"
                description="暂无课程，换个条件试试？" :image-size="120" />

      <div v-else class="plates">
        <article
            v-for="course in courseList" :key="course.id"
            class="plate"
            @click="goToDetail(course.id)">
          <!-- frame -->
          <div class="plate__frame">
            <el-image :src="course.cover" fit="cover" class="plate__img" lazy>
              <template #error>
                <img :src="defaultCover" class="plate__img-fallback" alt="cover" />
              </template>
            </el-image>

          </div>

          <!-- caption -->
          <div class="plate__cap">
            <h3 class="plate__title" :title="course.title">{{ course.title }}</h3>
            <p v-if="course.subtitle" class="plate__sub">{{ course.subtitle }}</p>

            <div class="plate__meta">
              <span class="pt pt--inline" :class="course.type === 0 ? 'pt--video' : 'pt--book'">
                {{ course.type === 0 ? '视频课' : '书本课' }}
              </span>
              <span v-if="course.isApodCourse === 1" class="pt pt--inline pt--apod">NASA</span>
              <span v-if="course.isMarsCourse === 1" class="pt pt--inline pt--mars">MARS</span>
              <span class="pm-dot">·</span>
              <span class="pm pm--diff" :class="'pm--d' + course.difficulty">
                {{ course.difficultyText }}
              </span>
              <span class="pm-dot">·</span>
              <span class="pm"><em>ch.</em> {{ course.chapterCount }}</span>
              <template v-if="course.avgRating > 0">
                <span class="pm-dot">·</span>
                <span class="pm pm--rate">★ {{ course.avgRating }}<em>({{ course.reviewCount }})</em></span>
              </template>
            </div>

            <div v-if="parseTags(course.tags).length > 0" class="plate__tagline">
              <span v-for="t in parseTags(course.tags).slice(0, 3)" :key="t" class="pl-tag">#{{ t }}</span>
              <span v-if="parseTags(course.tags).length > 3" class="pl-more">+{{ parseTags(course.tags).length - 3 }}</span>
            </div>

            <div class="plate__foot">
              <span v-if="course.lastChapterId" class="plate__resume"><em>↪ continue reading</em></span>
              <span v-else class="plate__learners">{{ course.viewCount || 0 }} <em>learners</em></span>
              <button class="fav" :class="{ 'fav--on': course.isFavorite }" @click.stop="handleToggleFavorite(course)">
                <el-icon v-if="course.isFavorite"><StarFilled /></el-icon>
                <el-icon v-else><Star /></el-icon>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-if="totalPages > 1" class="pager">
        <el-pagination
            v-model:current-page="filters.pageNum"
            :page-size="filters.pageSize"
            :total="total"
            layout="prev, pager, next, jumper, total"
            background
            @current-change="handlePageChange"
        />
      </div>
    </section>

    <!-- recommend shelf -->
    <section v-if="getToken() && recommendList.length > 0" class="shelf">
      <div class="shelf__head">
        <span class="shelf__kicker"><em>selected · for · you</em></span>
        <h2 class="shelf__title">为你推荐</h2>
        <p class="shelf__sub">根据你近 3 个月购买的器材，精选相关课程。</p>
      </div>

      <div class="shelf__track" ref="scrollWrapperRef"
           @mousedown="onMouseDown" @mousemove="onMouseMove"
           @mouseup="onMouseUp" @mouseleave="onMouseUp">
        <div class="shelf__row">
          <article
              v-for="course in recommendList" :key="course.id"
              class="mini-plate"
              @click="goToDetail(course.id)">
            <div class="mini-plate__frame">
              <el-image :src="course.cover" fit="cover" class="mini-plate__img">
                <template #error>
                  <img :src="defaultCover" class="mini-plate__img-fallback" alt="cover" />
                </template>
              </el-image>
            </div>
            <div class="mini-plate__cap">
              <h4 class="mini-plate__title" :title="course.title">{{ course.title }}</h4>
              <div class="mini-plate__meta">
                <span class="pt pt--inline pt--mini" :class="course.type === 0 ? 'pt--video' : 'pt--book'">
                  {{ course.type === 0 ? '视频' : '书本' }}
                </span>
                <span v-if="course.isApodCourse === 1" class="pt pt--inline pt--mini pt--apod">NASA</span>
                <span v-if="course.isMarsCourse === 1" class="pt pt--inline pt--mini pt--mars">MARS</span>
                <span class="pm-dot">·</span>
                <span :class="'pm--d' + course.difficulty">{{ course.difficultyText }}</span>
                <span class="pm-dot">·</span>
                <span><em>ch.</em> {{ course.chapterCount }}</span>
                <template v-if="course.avgRating > 0">
                  <span class="pm-dot">·</span>
                  <span>★ {{ course.avgRating }}</span>
                </template>
              </div>
              <div v-if="parseTags(course.tags).length > 0" class="mini-plate__tags">
                <span v-for="t in parseTags(course.tags).slice(0, 2)" :key="t">#{{ t }}</span>
                <span v-if="parseTags(course.tags).length > 2" class="pl-more">+{{ parseTags(course.tags).length - 2 }}</span>
              </div>
              <div class="mini-plate__foot">
                <span v-if="course.lastChapterId" class="mini-plate__resume"><em>↪ continue</em></span>
                <span v-else class="mini-plate__learners">{{ course.viewCount || 0 }} <em>learners</em></span>
                <button class="fav fav--mini" :class="{ 'fav--on': course.isFavorite }" @click.stop="handleToggleFavorite(course)">
                  <el-icon v-if="course.isFavorite"><StarFilled /></el-icon>
                  <el-icon v-else><Star /></el-icon>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
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
  { value: null, label: '全部',   icon: '☾' },
  { value: 0,    label: '视频课', icon: '▷'  },
  { value: 1,    label: '书本课', icon: '§' }
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
      <stop offset="0%" style="stop-color:#f6ecd8"/>
      <stop offset="100%" style="stop-color:#e7dbc4"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#bg)"/>
  <rect x="24" y="22" width="352" height="181" fill="none" stroke="#b8a989" stroke-width="1.2" opacity=".75"/>
  <line x1="58" y1="48" x2="342" y2="48" stroke="#b8a989" stroke-width="1" opacity=".55"/>
  <line x1="58" y1="177" x2="342" y2="177" stroke="#b8a989" stroke-width="1" opacity=".55"/>
  <circle cx="200" cy="112" r="36" fill="none" stroke="#131a2e" stroke-width="1.4" opacity=".75"/>
  <ellipse cx="200" cy="112" rx="76" ry="24" fill="none" stroke="#b88d3e" stroke-width="1.2" opacity=".7"/>
  <circle cx="200" cy="112" r="3.5" fill="#b88d3e"/>
  <text x="200" y="84" font-size="12" font-family="Georgia,serif" font-style="italic"
        text-anchor="middle" fill="#7a5e3d">Astronomy Course</text>
  <text x="200" y="156" font-size="19" font-family="Georgia,serif" font-weight="500"
        text-anchor="middle" fill="#131a2e">天文课程</text>
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

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap');

// ── palette ─────────────────────────────────────────────────────
$paper       : #f4ebd9;
$paper-deep  : #ebe1cc;
$paper-xdeep : #dcd0b7;
$paper-edge  : #cdbe9f;
$rule        : #b8a989;
$rule-soft   : rgba(184,169,137,0.35);

$ink         : #131a2e;
$ink-med     : #2a3354;
$ink-soft    : #5c5b4f;
$ink-dim     : #8a8470;

$gold        : #b88d3e;
$gold-soft   : #cfa657;
$rose        : #a0556d;
$moss        : #6b7c4a;
$sepia       : #7a5e3d;

$serif : 'Cormorant Garamond', Georgia, serif;
$sans  : 'Inter', system-ui, -apple-system, sans-serif;

// ── root ────────────────────────────────────────────────────────
.cl {
  min-height: 100vh;
  background: $paper;
  background-image:
    radial-gradient(ellipse at top, rgba(255,248,229,0.5), transparent 60%),
    linear-gradient(180deg, #f6ecd8 0%, #f0e5cd 100%);
  color: $ink;
  font-family: $sans;
  position: relative;
  padding-bottom: 80px;
}

.paper-grain {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  mix-blend-mode: multiply;
  opacity: .22;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.35  0 0 0 0.45 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

// ── topbar ──────────────────────────────────────────────────────
.topbar {
  position: relative; z-index: 2;
  padding: 22px 48px 14px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid $rule-soft;
}
.topbar__left {
  display: flex; align-items: center; gap: 12px;
  font-family: $serif;
  font-style: italic;
  font-size: 14px;
  letter-spacing: .6px;
  color: $ink-soft;
}
.crumb {
  cursor: pointer;
  transition: color .2s;
  &:hover { color: $ink; }
  &--on { font-style: normal; font-weight: 500; color: $ink; letter-spacing: 2.4px; }
}
.sep { color: $rule; }

.quick-links { display: flex; gap: 24px; }
.q {
  cursor: pointer;
  display: inline-flex; align-items: baseline; gap: 6px;
  font-family: $serif;
  font-size: 13.5px;
  color: $ink-soft;
  transition: color .2s;
  em { font-style: italic; letter-spacing: .5px; color: $ink-dim; }
  i  { font-style: normal; color: $rule; }
  &:hover {
    color: $ink;
    em { color: $sepia; }
  }
}

// ── masthead ────────────────────────────────────────────────────
.mast {
  position: relative; z-index: 2;
  text-align: center;
  padding: 36px 40px 22px;

  &__kicker {
    font-family: $serif;
    font-style: italic;
    font-size: 14px;
    letter-spacing: 2px;
    color: $sepia;
    margin-bottom: 8px;
  }
  &__title {
    font-family: $serif;
    font-weight: 500;
    font-size: 44px;
    letter-spacing: 12px;
    color: $ink;
    margin: 0 0 14px;
    line-height: 1;
  }
  &__rule {
    display: flex; align-items: center; justify-content: center; gap: 14px;
    margin: 0 auto 14px;
    max-width: 340px;
    color: $rule;
    &::before, &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: $rule-soft;
    }
    span {
      font-family: $serif;
      color: $gold;
      font-size: 14px;
    }
  }
  &__sub {
    font-family: $serif;
    font-style: italic;
    font-size: 14px;
    color: $ink-soft;
    letter-spacing: 1px;
    margin: 0;
  }
}

// ── filters ─────────────────────────────────────────────────────
.filters {
  position: relative; z-index: 2;
  max-width: 1180px;
  margin: 0 auto 28px;
  padding: 24px 32px;
  background: rgba(246,236,216,0.6);
  border: 1px solid $rule-soft;
  border-radius: 3px;
  box-shadow: 0 1px 0 $paper-xdeep inset, 0 8px 22px rgba(60,45,20,0.05);

  &__type {
    display: flex; align-items: center; gap: 10px;
    padding-bottom: 16px;
    margin-bottom: 14px;
    border-bottom: 1px dashed $rule-soft;
  }
  &__row {
    display: flex; align-items: flex-start; gap: 18px;
    padding: 9px 0;
    &:not(:last-of-type) { border-bottom: 1px solid rgba(184,169,137,0.18); }
  }
  &__label {
    flex-shrink: 0;
    width: 120px;
    padding-top: 4px;
    font-family: $serif;
    font-size: 13px;
    color: $ink-soft;
    letter-spacing: 1px;
    em { font-style: italic; color: $sepia; margin-right: 4px; }
  }
  &__search {
    margin-left: auto;
    display: flex; align-items: center; gap: 8px;
    padding: 7px 14px;
    background: $paper;
    border: 1px solid $rule-soft;
    border-radius: 999px;
    transition: border-color .2s;
    width: 260px;

    &-ico { color: $ink-dim; font-size: 14px; }
    &-in {
      flex: 1;
      background: transparent;
      border: none; outline: none;
      font-family: $serif;
      font-size: 14px;
      color: $ink;
      &::placeholder { color: $ink-dim; font-style: italic; }
    }
    &-x {
      cursor: pointer;
      color: $ink-dim;
      font-size: 12px;
      &:hover { color: $rose; }
    }
    &:focus-within { border-color: $gold; }
  }
  &__summary {
    margin-top: 14px;
    padding: 8px 14px;
    background: rgba(255,248,229,0.6);
    border-left: 2px solid $gold;
    font-family: $serif;
    font-size: 14px;
    color: $ink-soft;
    letter-spacing: .5px;
    em { font-style: italic; color: $sepia; margin: 0 6px; }
    strong { color: $ink; font-weight: 600; margin: 0 2px; }
  }
}

.type-pill {
  border: 1px solid $rule-soft;
  background: $paper;
  padding: 9px 22px;
  border-radius: 999px;
  font-family: $serif;
  font-size: 15px;
  letter-spacing: 2px;
  color: $ink-soft;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
  transition: all .2s;

  &__ico { font-size: 13px; color: $gold; }

  &:hover {
    border-color: $gold;
    color: $ink;
  }
  &--on {
    background: $ink;
    border-color: $ink;
    color: $paper;
    box-shadow: 0 2px 10px rgba(19,26,46,0.15);
    .type-pill__ico { color: $gold-soft; }
  }
}

.diff-line { display: flex; gap: 18px; flex-wrap: wrap; padding-top: 4px; }
.diff-lk {
  background: none; border: none; cursor: pointer;
  font-family: $serif;
  font-size: 15px;
  color: $ink-soft;
  letter-spacing: 1.5px;
  padding: 2px 2px 6px;
  border-bottom: 1px solid transparent;
  transition: all .2s;

  &:hover { color: $ink; }
  &--on {
    color: $ink;
    font-weight: 500;
    border-bottom-color: $gold;
  }
}

.tag-line { display: flex; gap: 8px 10px; flex-wrap: wrap; }
.tg {
  padding: 4px 12px;
  font-family: $serif;
  font-size: 13px;
  color: $ink-soft;
  letter-spacing: .5px;
  border: 1px solid $rule-soft;
  border-radius: 999px;
  background: $paper;
  cursor: pointer;
  transition: all .15s;
  user-select: none;

  &:hover {
    border-color: $gold;
    color: $ink;
  }
  &--on {
    background: $ink;
    border-color: $ink;
    color: $paper;
  }
}
.tg-clear {
  padding: 4px 12px;
  font-family: $serif;
  font-style: italic;
  font-size: 12.5px;
  color: $rose;
  cursor: pointer;
  border-bottom: 1px solid rgba(160,85,109,0.3);
  &:hover { border-bottom-color: $rose; }
}

// ── plates grid ─────────────────────────────────────────────────
.plates-wrap {
  position: relative; z-index: 2;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 32px;
  min-height: 400px;
}

.plates {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px 36px;
}

.plate {
  cursor: pointer;
  transition: transform .3s ease;

  &__frame {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border: 1px solid $paper-edge;
    background: $paper-deep;
    border-radius: 2px;
    box-shadow:
      0 0 0 1px rgba(255,248,229,0.6) inset,
      0 6px 14px rgba(60,45,20,0.08);
    transition: box-shadow .3s ease;
  }
  &__img {
    width: 100%; height: 100%;
    display: block;
  }
  :deep(.plate__img .el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(.92) contrast(.98);
  }
  &__img-fallback { width: 100%; height: 100%; object-fit: cover; display: block; }

  &__cap {
    padding: 18px 4px 0;
  }
  &__title {
    font-family: $serif;
    font-weight: 500;
    font-size: 19px;
    letter-spacing: 1px;
    color: $ink;
    margin: 0 0 4px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &__sub {
    font-family: $serif;
    font-style: italic;
    font-size: 13.5px;
    color: $ink-soft;
    margin: 0 0 10px;
    line-height: 1.5;
    letter-spacing: .3px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    font-family: $sans;
    font-size: 12px;
    color: $ink-soft;
    margin-bottom: 8px;
    em { font-style: italic; color: $ink-dim; margin-right: 3px; }
  }

  &__tagline {
    display: flex; gap: 8px; flex-wrap: wrap;
    margin-bottom: 10px;
  }

  &__foot {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 10px;
    border-top: 1px dashed $rule-soft;
  }
  &__resume, &__learners {
    font-family: $serif;
    font-size: 13px;
    color: $ink-soft;
    letter-spacing: .5px;
    em { font-style: italic; color: $sepia; }
  }
  &__resume em { color: $gold; }

  &:hover {
    transform: translateY(-4px);

    .plate__frame {
      box-shadow:
        0 0 0 1px rgba(255,248,229,0.8) inset,
        0 14px 28px rgba(60,45,20,0.15);
    }
    .plate__title { color: $sepia; }
  }
}

// small course marks kept outside image covers
.pt {
  padding: 3px 10px;
  font-family: $serif;
  font-size: 11.5px;
  letter-spacing: 1.5px;
  color: $paper;
  border-radius: 2px;
  background: rgba(19,26,46,0.82);
  backdrop-filter: blur(4px);

  &--video { background: rgba(160,85,109,0.9); }
  &--book  { background: rgba(107,124,74,0.9); }
  &--apod  { background: rgba(184,141,62,0.92); color: $paper; }
  &--mars  { background: rgba(160,85,109,0.92); }
  &--inline {
    padding: 2px 8px;
    color: $sepia;
    background: transparent;
    border: 1px solid rgba(184,141,62,0.42);
    backdrop-filter: none;
  }
  &--inline.pt--video { color: $rose; border-color: rgba(160,85,109,0.38); }
  &--inline.pt--book { color: $moss; border-color: rgba(107,124,74,0.38); }
  &--inline.pt--apod { color: $gold; border-color: rgba(184,141,62,0.45); }
  &--inline.pt--mars { color: $rose; border-color: rgba(160,85,109,0.42); }
  &--mini {
    padding: 1px 6px;
    font-size: 10.5px;
    letter-spacing: .8px;
  }
}

// meta difficulty dots
.pm {
  &--diff { font-weight: 500; }
  &--rate { color: $gold; em { color: $ink-dim; margin-left: 3px; } }
}
.pm-dot { color: $rule; }
.pm--d1 { color: $moss; }
.pm--d2 { color: $gold-soft; }
.pm--d3 { color: $rose; }

.pl-tag {
  font-family: $serif;
  font-style: italic;
  font-size: 12.5px;
  color: $sepia;
  letter-spacing: .5px;
}
.pl-more {
  font-family: $sans;
  font-size: 11.5px;
  color: $ink-dim;
}

// favorite btn
.fav {
  width: 30px; height: 30px;
  border: 1px solid $rule-soft;
  background: $paper;
  border-radius: 50%;
  cursor: pointer;
  color: $ink-dim;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .2s;

  &:hover { color: $gold; border-color: $gold; }
  &--on {
    color: $gold;
    border-color: $gold;
    background: rgba(184,141,62,0.08);
  }
  &--mini { width: 26px; height: 26px; font-size: 12px; }
}

// ── pager ───────────────────────────────────────────────────────
.pager {
  margin-top: 48px;
  display: flex; justify-content: center;
}
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next),
:deep(.el-pagination.is-background .el-pager li) {
  background: $paper !important;
  color: $ink-soft !important;
  border: 1px solid $rule-soft !important;
  font-family: $serif;
  &:hover { color: $ink !important; border-color: $gold !important; }
}
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: $ink !important;
  color: $paper !important;
  border-color: $ink !important;
}
:deep(.el-pagination .el-pagination__total),
:deep(.el-pagination .el-pagination__jump) {
  color: $ink-soft !important;
  font-family: $serif;
}
:deep(.el-pagination__editor.el-input .el-input__wrapper) {
  background: $paper !important;
  box-shadow: 0 0 0 1px $rule-soft inset !important;
}

// ── shelf (recommend) ───────────────────────────────────────────
.shelf {
  position: relative; z-index: 2;
  max-width: 1180px;
  margin: 64px auto 0;
  padding: 40px 32px;
  background: $paper-deep;
  border-top: 1px solid $rule-soft;
  border-bottom: 1px solid $rule-soft;

  &__head {
    text-align: center;
    margin-bottom: 28px;
  }
  &__kicker {
    display: block;
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    color: $sepia;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }
  &__title {
    font-family: $serif;
    font-weight: 500;
    font-size: 30px;
    letter-spacing: 8px;
    color: $ink;
    margin: 0 0 8px;
  }
  &__sub {
    font-family: $serif;
    font-style: italic;
    font-size: 13.5px;
    color: $ink-soft;
    margin: 0;
  }

  &__track {
    overflow-x: auto;
    cursor: grab;
    user-select: none;
    scrollbar-width: thin;
    scrollbar-color: $rule transparent;
    padding-bottom: 8px;
    &::-webkit-scrollbar { height: 6px; }
    &::-webkit-scrollbar-thumb { background: $rule; border-radius: 3px; }
  }
  &__row {
    display: flex; gap: 20px;
    padding-right: 32px;
  }
}

.mini-plate {
  flex: 0 0 230px;
  cursor: pointer;
  transition: transform .25s ease;

  &__frame {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border: 1px solid $paper-edge;
    background: $paper;
    box-shadow: 0 0 0 1px rgba(255,248,229,0.6) inset, 0 4px 10px rgba(60,45,20,0.08);
  }
  &__img { width: 100%; height: 100%; display: block; }
  :deep(.mini-plate__img .el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(.92) contrast(.98);
  }
  &__img-fallback { width: 100%; height: 100%; object-fit: cover; display: block; }

  &__cap { padding: 12px 4px 0; }
  &__title {
    font-family: $serif;
    font-size: 15px;
    font-weight: 500;
    color: $ink;
    margin: 0 0 6px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &__meta {
    display: flex; gap: 6px; flex-wrap: wrap;
    font-family: $sans;
    font-size: 11.5px;
    color: $ink-soft;
    margin-bottom: 6px;
    em { font-style: italic; color: $ink-dim; }
  }
  &__tags {
    display: flex; gap: 6px; flex-wrap: wrap;
    margin-bottom: 6px;
    span {
      font-family: $serif;
      font-style: italic;
      font-size: 11.5px;
      color: $sepia;
    }
  }
  &__foot {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 6px;
    border-top: 1px dashed $rule-soft;
  }
  &__resume, &__learners {
    font-family: $serif;
    font-size: 12px;
    color: $ink-soft;
    em { font-style: italic; color: $sepia; }
  }
  &__resume em { color: $gold; }

  &:hover .mini-plate__title { color: $sepia; }
}

// ── el-loading override ─────────────────────────────────────────
:deep(.el-loading-mask) {
  background: rgba(244,235,217,0.75) !important;
  .el-loading-spinner .path { stroke: $gold; }
}
:deep(.el-loading-spinner .el-loading-text) {
  color: $sepia !important;
  font-family: $serif;
  font-style: italic;
}

// ── el-empty override ───────────────────────────────────────────
:deep(.el-empty__description p) {
  color: $ink-soft;
  font-family: $serif;
  font-style: italic;
  letter-spacing: .5px;
}

// ── responsive ──────────────────────────────────────────────────
@media (max-width: 960px) {
  .plates { grid-template-columns: repeat(2, 1fr); gap: 32px 24px; }
  .mast__title { font-size: 34px; letter-spacing: 8px; }
  .topbar { padding: 18px 20px 10px; flex-direction: column; gap: 12px; align-items: flex-start; }
  .filters { margin: 0 20px 24px; padding: 18px 18px; }
  .filters__type { flex-wrap: wrap; }
  .filters__search { width: 100%; margin-left: 0; }
  .filters__label { width: 100px; font-size: 12.5px; }
  .shelf { margin: 48px 20px 0; }
}
@media (max-width: 640px) {
  .plates { grid-template-columns: 1fr; }
  .plates-wrap { padding: 0 20px; }
  .mast { padding: 24px 20px 18px; }
  .mast__title { font-size: 28px; letter-spacing: 6px; }
  .quick-links { gap: 14px; flex-wrap: wrap; }
}
</style>
