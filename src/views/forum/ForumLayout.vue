<template>
  <!-- 论坛整体布局（小红书web一体化风格） -->
  <div class="forum-layout">
    <!-- 顶部通栏：Logo + 搜索框 + 右侧链接 -->
    <header class="top-bar">
      <div class="top-left" @click="$router.push('/home')">
        <span class="logo-icon">🔭</span>
        <span class="logo-text">天文社区</span>
      </div>
      <div class="top-center">
        <div class="search-box" :class="{ focused: searchFocused }">
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            placeholder="搜索笔记"
            @focus="onSearchFocus"
            @keydown.enter="goSearch"
          />
          <div class="search-btn" @click="goSearch">
            <el-icon :size="18"><Search /></el-icon>
          </div>
        </div>
      </div>
      <div class="top-right">
        <router-link to="/home" class="top-link">返回商城</router-link>
      </div>
    </header>

    <!-- ══════ 搜索遮罩层（在下拉面板之下） ══════ -->
    <div v-if="showDropdown" class="search-overlay" @click="closeDropdown"></div>

    <!-- ══════ 搜索下拉面板（fixed定位，独立于top-bar） ══════ -->
    <div v-if="showDropdown" class="search-dropdown">
      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0" class="dropdown-section">
        <div class="dropdown-header">
          <span class="dropdown-title">历史记录</span>
          <div class="history-actions">
            <!-- 普通模式：只显示删除图标 -->
            <template v-if="!historyEditing">
              <el-icon class="action-icon" @click="historyEditing = true"><Delete /></el-icon>
            </template>
            <!-- 编辑模式：清空 + 完成 -->
            <template v-else>
              <span class="action-btn" @click="clearHistory"><el-icon><Delete /></el-icon> 清空</span>
              <span class="action-btn done" @click="historyEditing = false"><el-icon><Check /></el-icon> 完成</span>
            </template>
          </div>
        </div>
        <div class="history-tags">
          <span
            v-for="(item, idx) in searchHistory"
            :key="idx"
            class="history-tag"
            @click="historyEditing ? removeHistory(idx) : searchFromTag(item)"
          >
            {{ item }}
            <span v-if="historyEditing" class="tag-close">&times;</span>
          </span>
        </div>
      </div>

      <!-- 猜你想搜 / 热门搜索 -->
      <div class="dropdown-section">
        <div class="dropdown-header">
          <span class="dropdown-title">猜你想搜</span>
        </div>
        <div v-if="hotLoading" class="dropdown-loading">加载中...</div>
        <div v-else-if="hotList.length > 0" class="hot-list">
          <div
            v-for="(item, idx) in hotList"
            :key="idx"
            class="hot-item"
            @click="searchFromTag(item)"
          >
            <span class="hot-rank" :class="{ top: idx < 3 }">{{ idx + 1 }}</span>
            <span class="hot-text">{{ item }}</span>
          </div>
        </div>
        <div v-else class="dropdown-empty">暂无热门搜索</div>
      </div>
    </div>

    <!-- 下方区域：左侧边栏 + 右侧内容 -->
    <div class="body-wrapper">
      <!-- 左侧边栏 -->
      <aside class="forum-sidebar">
        <nav class="sidebar-nav">
          <router-link to="/forum" class="nav-item" :class="{ active: isActive('list') }">
            <el-icon><Compass /></el-icon>
            <span>发现</span>
          </router-link>
          <router-link to="/forum/publish" class="nav-item" :class="{ active: isActive('publish') }">
            <el-icon><EditPen /></el-icon>
            <span>发布</span>
          </router-link>
          <router-link to="/notification/settings" class="nav-item">
            <el-icon><Bell /></el-icon>
            <span>通知</span>
          </router-link>
          <router-link v-if="isLoggedIn" :to="`/forum/user/${userStore.userInfo?.id}`" class="nav-item" :class="{ active: isActive('profile') }">
            <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" class="nav-avatar" />
            <el-icon v-else><User /></el-icon>
            <span>我</span>
          </router-link>
          <router-link v-else to="/login" class="nav-item">
            <el-icon><User /></el-icon>
            <span>登录</span>
          </router-link>
        </nav>

        <!-- 底部快捷入口 -->
        <div class="sidebar-bottom">
          <router-link to="/recognition" class="nav-item sub">
            <el-icon><PictureFilled /></el-icon>
            <span>AI识别</span>
          </router-link>
          <router-link to="/course" class="nav-item sub">
            <el-icon><Reading /></el-icon>
            <span>课程</span>
          </router-link>
          <router-link to="/location" class="nav-item sub">
            <el-icon><MapLocation /></el-icon>
            <span>观测点</span>
          </router-link>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="forum-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getHotSearch } from '@/api/forum'
import { Search, Compass, EditPen, Bell, User, PictureFilled, Reading, MapLocation, Delete, Check } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ────────── 搜索状态 ──────────
const searchKeyword = ref('')
const searchFocused = ref(false)
const showDropdown = ref(false)
const searchInputRef = ref(null)
const historyEditing = ref(false)

const isLoggedIn = computed(() => !!userStore.userInfo?.id)

// ────────── 搜索历史（localStorage，按用户ID隔离） ──────────
const MAX_HISTORY = 10
const searchHistory = ref([])

// 根据当前登录用户生成独立的存储key
const getHistoryKey = () => {
  const uid = userStore.userInfo?.id
  return uid ? `forum_search_history_${uid}` : 'forum_search_history_guest'
}

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(getHistoryKey())
    searchHistory.value = raw ? JSON.parse(raw) : []
  } catch { searchHistory.value = [] }
}

const saveHistory = (kw) => {
  if (!kw) return
  const list = searchHistory.value.filter(item => item !== kw)
  list.unshift(kw)
  if (list.length > MAX_HISTORY) list.length = MAX_HISTORY
  searchHistory.value = list
  localStorage.setItem(getHistoryKey(), JSON.stringify(list))
}

const removeHistory = (idx) => {
  searchHistory.value.splice(idx, 1)
  localStorage.setItem(getHistoryKey(), JSON.stringify(searchHistory.value))
  if (searchHistory.value.length === 0) historyEditing.value = false
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem(getHistoryKey())
  historyEditing.value = false
}

// ────────── 热门搜索 ──────────
const hotList = ref([])
const hotLoading = ref(false)

const fetchHotSearch = async () => {
  hotLoading.value = true
  try {
    const res = await getHotSearch()
    hotList.value = res.data || []
  } catch (err) {
    console.error('加载热搜失败', err)
  } finally {
    hotLoading.value = false
  }
}

// ────────── 搜索交互 ──────────
const onSearchFocus = () => {
  searchFocused.value = true
  showDropdown.value = true
  loadHistory() // 每次聚焦时刷新历史
}

const closeDropdown = () => {
  searchFocused.value = false
  showDropdown.value = false
  historyEditing.value = false
}

const goSearch = () => {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  saveHistory(kw)
  closeDropdown()
  router.push({ path: '/forum/search', query: { keyword: kw } })
}

const searchFromTag = (tag) => {
  searchKeyword.value = tag
  goSearch()
}

// 判断当前激活的导航项
const isActive = (name) => {
  if (name === 'list') return route.path === '/forum' || route.path === '/forum/list'
  if (name === 'publish') return route.path === '/forum/publish'
  if (name === 'profile') return route.path.startsWith('/forum/user/')
  return false
}

// 监听路由变化 — 搜索页时同步顶部搜索框
watch(() => route.query.keyword, (newKw) => {
  if (route.path === '/forum/search' && newKw) {
    searchKeyword.value = newKw
  }
}, { immediate: true })

// 离开搜索页时清空搜索框
watch(() => route.path, (newPath) => {
  if (!newPath.startsWith('/forum/search')) {
    searchKeyword.value = ''
  }
})

// 切换账号时重新加载搜索历史
watch(() => userStore.userInfo?.id, () => {
  loadHistory()
})

onMounted(() => {
  loadHistory()
  fetchHotSearch()
})
</script>

<style lang="scss" scoped>
.forum-layout {
  min-height: 100vh;
  background: #fff;
}

/* ══════ 顶部通栏 ══════ */
.top-bar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 200;
  background: #fff;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: 200px;
  flex-shrink: 0;

  .logo-icon { font-size: 28px; }
  .logo-text {
    font-size: 20px;
    font-weight: 700;
    color: #ff2442;
  }
}

.top-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.search-box {
  width: 400px;
  max-width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 17px;
  overflow: hidden;
  transition: background 0.2s, box-shadow 0.2s;

  &.focused, &:focus-within {
    background: #fff;
    box-shadow: 0 0 0 1px #ddd;
  }

  input {
    flex: 1;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 0 16px;
    font-size: 14px;
    color: #333;

    &::placeholder { color: #bbb; }
  }

  .search-btn {
    width: 42px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
    background: #ff2442;
    border-radius: 0 17px 17px 0;
    transition: background 0.2s;

    &:hover { background: #e6203c; }
  }
}

/* ══════ 搜索下拉面板（fixed定位，脱离top-bar层叠上下文） ══════ */
.search-dropdown {
  position: fixed;
  top: 46px;
  left: 50%;
  transform: translateX(-50%);
  width: 440px;
  max-height: 480px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  z-index: 301;
  padding: 16px 20px;
}

.dropdown-section {
  margin-bottom: 20px;

  &:last-child { margin-bottom: 0; }
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dropdown-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-icon {
  font-size: 16px;
  color: #bbb;
  cursor: pointer;
  &:hover { color: #999; }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  color: #999;
  cursor: pointer;
  &:hover { color: #666; }
  .el-icon { font-size: 14px; }

  &.done { color: #333; }
}

/* ── 搜索历史标签（小红书胶囊样式） ── */
.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  display: inline-block;
  padding: 5px 14px;
  background: #f5f5f5;
  border-radius: 14px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { background: #ebebeb; }

  .tag-close {
    margin-left: 4px;
    font-size: 14px;
    color: #999;
  }
}

/* ── 热门搜索列表 ── */
.hot-list {
  display: flex;
  flex-direction: column;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover { background: #f8f8f8; }
}

.hot-rank {
  width: 18px;
  font-size: 14px;
  font-weight: 700;
  color: #bbb;
  text-align: center;

  &.top { color: #ff2442; }
}

.hot-text {
  font-size: 14px;
  color: #333;
}

.dropdown-loading, .dropdown-empty {
  font-size: 13px;
  color: #bbb;
  padding: 4px 0;
}

/* ── 搜索遮罩层 ── */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.05);
}

.top-right {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 20px;

  .top-link {
    font-size: 13px;
    color: #666;
    text-decoration: none;
    white-space: nowrap;

    &:hover { color: #333; }
  }
}

/* ══════ 下方主体 ══════ */
.body-wrapper {
  display: flex;
  min-height: calc(100vh - 56px);
}

/* ── 左侧边栏 ── */
.forum-sidebar {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  border-right: 1px solid #f5f5f5;
}

.sidebar-nav {
  flex: 1;
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: #333;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.15s;
  border-radius: 10px;
  margin-bottom: 2px;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    font-weight: 700;
    color: #333;
  }

  .el-icon { font-size: 22px; }

  .nav-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
  }

  &.sub {
    padding: 10px 16px;
    font-size: 13px;
    color: #999;
    .el-icon { font-size: 18px; }
    &:hover { color: #333; }
  }
}

.sidebar-bottom {
  border-top: 1px solid #f0f0f0;
  padding: 12px 12px 0;
}

/* ── 右侧内容区 ── */
.forum-main {
  flex: 1;
  min-width: 0;
  background: #f5f5f5;
}

/* ══════ 响应式 ══════ */
@media (max-width: 992px) {
  .forum-sidebar {
    width: 72px;
    .nav-item span { display: none; }
    .nav-item { justify-content: center; padding: 14px 0; }
  }

  .top-left {
    width: auto;
    .logo-text { display: none; }
  }

  .top-right {
    width: auto;
  }

  .search-box { width: 280px; }
  .search-dropdown { width: 320px; }
}
</style>
