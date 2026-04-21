<template>
  <!-- 论坛整体布局（小红书web一体化风格） -->
  <div class="forum-layout">
    <!-- 顶部通栏：Logo + 搜索框 + 右侧链接 -->
    <header class="top-bar">
      <div class="top-left" @click="$router.push('/home')">
        <span class="logo-mark" aria-hidden="true"></span>
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
          <router-link to="/forum/notification" class="nav-item" :class="{ active: isActive('notification') }">
            <el-icon><Bell /></el-icon>
            <span>通知</span>
            <el-badge
                v-if="forumUnread > 0"
                :value="forumUnread"
                :max="99"
                type="danger"
                class="nav-badge"
            />
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
  if (name === 'notification') return route.path === '/forum/notification'
  return false
}

// 7.8: 侧边栏「通知」按钮的未读角标（仅 forum 模块）
const forumUnread = ref(0)
let unreadTimer = null
const refreshForumUnread = async () => {
  if (!isLoggedIn.value) {
    forumUnread.value = 0
    return
  }
  try {
    const { getUnreadCount } = await import('@/api/notification')
    const res = await getUnreadCount()
    forumUnread.value = Number(res.data?.forum || 0)
  } catch {
    // 未登录或请求失败静默处理
  }
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
  // 7.8: 侧栏通知角标 — 首次加载 + 30s 轮询
  refreshForumUnread()
  unreadTimer = setInterval(refreshForumUnread, 30000)
})

// 路由切换回论坛页时刷新一次(比如从详情关掉或者点击了未读)
watch(() => route.path, () => {
  refreshForumUnread()
})

onUnmounted(() => {
  if (unreadTimer) {
    clearInterval(unreadTimer)
    unreadTimer = null
  }
})
</script>

<style lang="scss" scoped>
.forum-layout {
  --forum-ink: #101722;
  --forum-ink-soft: #1b2637;
  --forum-paper: #f7f5ef;
  --forum-card: #fffdfa;
  --forum-line: #e7e1d7;
  --forum-muted: #697386;
  --forum-gold: #c89b53;
  --forum-blue: #2f6f9f;
  --forum-red: #d84b5f;
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(247, 245, 239, 0.96), rgba(242, 239, 230, 0.96)),
    radial-gradient(circle at 80% 10%, rgba(47, 111, 159, 0.08), transparent 34%);
  color: var(--forum-ink);
}

/* ══════ 顶部通栏 ══════ */
.top-bar {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 28px;
  border-bottom: 1px solid rgba(16, 23, 34, 0.08);
  position: sticky;
  top: 0;
  z-index: 200;
  background: rgba(255, 253, 250, 0.94);
  backdrop-filter: blur(16px);
}

.top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: 200px;
  flex-shrink: 0;

  .logo-mark {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--forum-ink);
    position: relative;
    background:
      radial-gradient(circle at 50% 50%, var(--forum-gold) 0 2px, transparent 3px),
      radial-gradient(circle at 70% 28%, rgba(47, 111, 159, 0.7) 0 2px, transparent 3px);

    &::before,
    &::after {
      content: '';
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      border: 1px solid rgba(16, 23, 34, 0.24);
    }

    &::after {
      inset: 12px -3px;
      border-color: rgba(200, 155, 83, 0.7);
      transform: rotate(-24deg);
    }
  }

  .logo-text {
    font-size: 19px;
    font-weight: 700;
    color: var(--forum-ink);
  }
}

.top-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.search-box {
  width: 420px;
  max-width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  background: #f1eee8;
  border: 1px solid transparent;
  border-radius: 20px;
  overflow: hidden;
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;

  &.focused, &:focus-within {
    background: #fff;
    border-color: rgba(16, 23, 34, 0.18);
    box-shadow: 0 12px 26px rgba(16, 23, 34, 0.08);
  }

  input {
    flex: 1;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 0 18px;
    font-size: 14px;
    color: var(--forum-ink);

    &::placeholder { color: #8c95a3; }
  }

  .search-btn {
    width: 46px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
    background: var(--forum-ink);
    border-radius: 0 20px 20px 0;
    transition: background 0.2s;

    &:hover { background: var(--forum-ink-soft); }
  }
}

/* ══════ 搜索下拉面板（fixed定位，脱离top-bar层叠上下文） ══════ */
.search-dropdown {
  position: fixed;
  top: 54px;
  left: 50%;
  transform: translateX(-50%);
  width: 440px;
  max-height: 480px;
  overflow-y: auto;
  background: var(--forum-card);
  border: 1px solid var(--forum-line);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 18px 40px rgba(16, 23, 34, 0.14);
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
  color: var(--forum-ink);
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
  background: #f3efe7;
  border-radius: 14px;
  font-size: 13px;
  color: var(--forum-ink);
  cursor: pointer;
  transition: background 0.15s;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { background: #ece5d9; }

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

  &:hover { background: #f4efe7; }
}

.hot-rank {
  width: 18px;
  font-size: 14px;
  font-weight: 700;
  color: #bbb;
  text-align: center;

  &.top { color: var(--forum-gold); }
}

.hot-text {
  font-size: 14px;
  color: var(--forum-ink);
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
  background: rgba(16, 23, 34, 0.08);
}

.top-right {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 20px;

  .top-link {
    font-size: 13px;
    color: var(--forum-muted);
    text-decoration: none;
    white-space: nowrap;

    &:hover { color: var(--forum-ink); }
  }
}

/* ══════ 下方主体 ══════ */
.body-wrapper {
  display: flex;
  min-height: calc(100vh - 60px);
}

/* ── 左侧边栏 ── */
.forum-sidebar {
  width: 208px;
  flex-shrink: 0;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  padding: 18px 0;
  background:
    linear-gradient(180deg, #101722 0%, #151f2e 56%, #111927 100%);
  border-right: 1px solid rgba(16, 23, 34, 0.18);
  box-shadow: inset -1px 0 rgba(255, 255, 255, 0.04);
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
  color: rgba(255, 255, 255, 0.72);
  font-size: 15px;
  text-decoration: none;
  transition: all 0.15s;
  border-radius: 8px;
  margin-bottom: 4px;
  border: 1px solid transparent;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    font-weight: 700;
    color: #fff;
    background: rgba(200, 155, 83, 0.14);
    border-color: rgba(200, 155, 83, 0.32);
  }

  .el-icon { font-size: 22px; }

  .nav-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
  }

  /* 7.8: 通知未读角标 */
  .nav-badge {
    margin-left: auto;
    :deep(.el-badge__content) {
      transform: translateY(0);
    }
  }

  &.sub {
    padding: 10px 16px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    .el-icon { font-size: 18px; }
    &:hover { color: #fff; }
  }
}

.sidebar-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 12px 0;
}

/* ── 右侧内容区 ── */
.forum-main {
  flex: 1;
  min-width: 0;
  background:
    linear-gradient(rgba(16, 23, 34, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 23, 34, 0.025) 1px, transparent 1px),
    var(--forum-paper);
  background-size: 36px 36px, 36px 36px, auto;
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
