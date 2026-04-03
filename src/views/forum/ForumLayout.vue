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
        <div class="search-box">
          <input
            v-model="searchKeyword"
            placeholder="搜索笔记"
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Search, Compass, EditPen, Bell, User, PictureFilled, Reading, MapLocation } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const searchKeyword = ref('')

const isLoggedIn = computed(() => !!userStore.userInfo?.id)

// 判断当前激活的导航项
const isActive = (name) => {
  if (name === 'list') return route.path === '/forum' || route.path === '/forum/list'
  if (name === 'publish') return route.path === '/forum/publish'
  if (name === 'profile') return route.path.startsWith('/forum/user/')
  return false
}

// 搜索跳转
const goSearch = () => {
  if (!searchKeyword.value.trim()) return
  router.push({ path: '/forum/search', query: { keyword: searchKeyword.value.trim() } })
}
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

  &:focus-within {
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
}
</style>
