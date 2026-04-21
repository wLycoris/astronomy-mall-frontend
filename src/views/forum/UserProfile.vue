<template>
  <!--
    用户主页（小红书web风格）
    文件路径: src/views/forum/UserProfile.vue
    路由: /forum/user/:id

    📌 7.5 新建
    📌 布局: 星空Banner + 头像/昵称/统计 + 笔记/收藏/点赞 三Tab瀑布流
    📌 复用: PostWaterfall + PostCard + ForumDetail 组件
  -->
  <div class="user-profile-page">
    <!-- ══════ 顶部Banner + 用户信息 ══════ -->
    <div class="profile-header">
      <!-- 星空渐变背景Banner -->
      <div class="banner-bg"></div>

      <!-- 用户信息区域（头像+右侧信息+关注按钮一行） -->
      <div class="profile-info-section">
        <!-- 头像 -->
        <div class="avatar-wrapper">
          <img v-if="profile.avatar" :src="profile.avatar" class="user-avatar" alt="" />
          <div v-else class="user-avatar placeholder">
            {{ avatarLetter }}
          </div>
        </div>

        <!-- 右侧信息（昵称+统计+操作 竖排） -->
        <div class="info-right">
          <!-- 第一行：昵称 + 关注按钮 -->
          <div class="name-row">
            <h1 class="user-nickname">{{ profile.nickname || '天文爱好者' }}</h1>
            <button
              v-if="!isSelf"
              class="follow-btn"
              :class="{ followed: profile.isFollowed }"
              @click="toggleFollow"
              :disabled="followLoading"
            >
              {{ profile.isFollowed ? '已关注' : '+ 关注' }}
            </button>
          </div>

          <!-- 第二行：等级 + 城市 -->
          <div class="user-extra">
            <span v-if="profile.observationLevel" class="level-badge">
              {{ '★'.repeat(profile.observationLevel) }}{{ '☆'.repeat(5 - profile.observationLevel) }}
              Lv.{{ profile.observationLevel }}
            </span>
            <span v-if="profile.city" class="city-tag">{{ profile.city }}</span>
          </div>

          <!-- 第三行：统计数据（关注/粉丝仅自己主页可点击查看列表） -->
          <div class="stats-row">
            <div class="stat-item" :class="{ clickable: isSelf }" @click="isSelf && showFollowList()">
              <span class="stat-num">{{ profile.followCount || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item" :class="{ clickable: isSelf }" @click="isSelf && showFansList()">
              <span class="stat-num">{{ profile.fansCount || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ profile.likeAndCollectCount || 0 }}</span>
              <span class="stat-label">获赞与收藏</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════ Tab栏：笔记 / 收藏 / 点赞 ══════ -->
    <div class="profile-tabs">
      <template v-for="tab in tabs" :key="tab.value">
        <span
          v-if="isTabVisible(tab.value)"
          class="tab-item"
          :class="{ active: currentTab === tab.value }"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
          <!-- 自己主页显示锁图标，可点击切换 -->
          <el-icon
            v-if="isSelf && tab.value !== 'posts'"
            class="lock-icon"
            :title="isTabPublic(tab.value) ? '点击设为私密' : '点击设为公开'"
            @click.stop="toggleTabVisibility(tab.value)"
          >
            <Unlock v-if="isTabPublic(tab.value)" />
            <Lock v-else />
          </el-icon>
        </span>
      </template>
    </div>

    <!-- ══════ 瀑布流内容区 ══════ -->
    <div class="waterfall-wrapper" v-loading="loading && pageNum === 1">
      <PostWaterfall
        v-if="postList.length > 0"
        :posts="postList"
        @card-click="openDetail"
      />

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && postList.length === 0"
        :description="emptyText"
        :image-size="100"
      />

      <!-- 加载更多触发器 -->
      <div ref="loadMoreRef" class="load-more">
        <span v-if="loadingMore">加载中...</span>
        <span v-else-if="noMore && postList.length > 0">已经到底啦~</span>
      </div>
    </div>

    <!-- ══════ 帖子详情弹窗 ══════ -->
    <ForumDetail
      v-if="detailVisible"
      :post-id="currentPostId"
      @close="detailVisible = false"
      @updated="onDetailUpdated"
    />

    <!-- ══════ 关注/粉丝列表弹窗 ══════ -->
    <el-dialog
      v-model="listDialogVisible"
      :title="listDialogTitle"
      width="480px"
      :close-on-click-modal="true"
      class="follow-list-dialog"
    >
      <div class="follow-list" v-loading="listLoading">
        <div
          v-for="item in userList"
          :key="item.userId"
          class="follow-item"
          @click="goToProfile(item.userId)"
        >
          <img v-if="item.avatar" :src="item.avatar" class="item-avatar" alt="" />
          <div v-else class="item-avatar placeholder">{{ (item.nickname || '?').charAt(0) }}</div>
          <div class="item-info">
            <span class="item-nickname">{{ item.nickname || '天文爱好者' }}</span>
            <span v-if="item.city" class="item-city">{{ item.city }}</span>
          </div>
          <!-- 关注/互关按钮 -->
          <button
            class="item-follow-btn"
            :class="{ followed: listType === 'follow' || item.isFollowed }"
            @click.stop="toggleFollowItem(item)"
          >
            <!-- 关注列表：我已关注他们，按钮显示互关状态或已关注 -->
            <template v-if="listType === 'follow'">
              {{ item.isFollowed ? '互相关注' : '已关注' }}
            </template>
            <!-- 粉丝列表：他们关注了我，按钮显示回关或互关 -->
            <template v-else>
              {{ item.isFollowed ? '互相关注' : '+ 关注' }}
            </template>
          </button>
        </div>
        <el-empty v-if="!listLoading && userList.length === 0" description="暂无数据" :image-size="60" />
      </div>
      <!-- 加载更多 -->
      <div v-if="userList.length > 0 && !listNoMore" class="list-load-more" @click="loadMoreUsers">
        <span v-if="listLoadingMore">加载中...</span>
        <span v-else>加载更多</span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  getUserProfile,
  getMyPosts,
  getMyCollects,
  getPostList,
  followUser,
  getFollowList,
  getFansList,
  getMyLikes,
  toggleVisibility
} from '@/api/forum'
import PostWaterfall from './PostWaterfall.vue'
import ForumDetail from './ForumDetail.vue'
import { ElMessage } from 'element-plus'
import { Lock, Unlock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ────────── 用户信息 ──────────
const profile = ref({})
const profileLoading = ref(false)

// 是否是自己的主页
const isSelf = computed(() => {
  const targetId = Number(route.params.id)
  return userStore.userInfo?.id && targetId === userStore.userInfo.id
})

// 头像首字母
const avatarLetter = computed(() => (profile.value.nickname || '?').charAt(0))

// ────────── Tab状态 ──────────
const currentTab = ref('posts')
const tabs = [
  { label: '笔记', value: 'posts' },
  { label: '收藏', value: 'collects' },
  { label: '点赞', value: 'likes' }
]

// 判断tab是否公开（自己始终可见，他人根据设置）
const isTabPublic = (tabValue) => {
  if (tabValue === 'posts') return true
  if (tabValue === 'collects') return profile.value.collectVisible === 1
  if (tabValue === 'likes') return profile.value.likeVisible === 1
  return true
}

// 判断tab是否应该显示
const isTabVisible = (tabValue) => {
  if (tabValue === 'posts') return true
  if (isSelf.value) return true // 自己主页始终显示所有tab
  return isTabPublic(tabValue) // 他人主页根据可见性设置
}

// 切换可见性（仅自己主页可操作）
const toggleTabVisibility = async (tabValue) => {
  const type = tabValue === 'collects' ? 'collect' : 'like'
  try {
    const res = await toggleVisibility(type)
    // res.data: true=公开, false=私密
    if (type === 'collect') {
      profile.value.collectVisible = res.data ? 1 : 0
    } else {
      profile.value.likeVisible = res.data ? 1 : 0
    }
    ElMessage.success(res.data ? '已设为公开' : '已设为私密')
  } catch (err) {
    console.error('切换可见性失败', err)
  }
}

// ────────── 帖子列表 ──────────
const postList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)

// ────────── 帖子详情弹窗 ──────────
const detailVisible = ref(false)
const currentPostId = ref(null)

const openDetail = (post) => {
  currentPostId.value = post.id
  detailVisible.value = true
}

const onDetailUpdated = (updatedPost) => {
  if (!updatedPost) return
  const idx = postList.value.findIndex(p => p.id === updatedPost.id)
  if (idx !== -1) {
    const card = postList.value[idx]
    card.likeCount = updatedPost.likeCount
    card.collectCount = updatedPost.collectCount
    card.commentCount = updatedPost.commentCount
  }
}

// ────────── 关注操作 ──────────
const followLoading = ref(false)

const toggleFollow = async () => {
  if (!userStore.userInfo?.id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  followLoading.value = true
  try {
    const res = await followUser(route.params.id)
    profile.value.isFollowed = res.data
    // 更新粉丝数
    if (res.data) {
      profile.value.fansCount = (profile.value.fansCount || 0) + 1
    } else {
      profile.value.fansCount = Math.max(0, (profile.value.fansCount || 1) - 1)
    }
  } catch (err) {
    console.error('关注操作失败', err)
  } finally {
    followLoading.value = false
  }
}

// ────────── 空状态文案 ──────────
const emptyText = computed(() => {
  const name = isSelf.value ? '你' : 'TA'
  if (currentTab.value === 'posts') return `${name}还没有发布任何内容哦`
  if (currentTab.value === 'collects') return `${name}还没有收藏任何内容哦`
  return `${name}还没有点赞任何内容哦`
})

// ────────── 加载用户资料 ──────────
const fetchProfile = async () => {
  profileLoading.value = true
  try {
    const res = await getUserProfile(route.params.id)
    if (res.data && res.data.profile) {
      profile.value = res.data.profile
    }
  } catch (err) {
    console.error('加载用户资料失败', err)
    ElMessage.error('用户不存在')
  } finally {
    profileLoading.value = false
  }
}

// ────────── 加载帖子列表 ──────────
const fetchPosts = async (reset = false) => {
  if (reset) {
    pageNum.value = 1
    noMore.value = false
    postList.value = []
  }

  if (pageNum.value === 1) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    let res
    const targetId = route.params.id
    if (currentTab.value === 'posts') {
      // 查该用户发布的帖子
      res = await getPostList({ tab: 'user', pageNum: pageNum.value, pageSize, userId: targetId })
    } else if (currentTab.value === 'collects') {
      // 查该用户收藏的帖子（自己或他人公开）
      res = await getMyCollects({ pageNum: pageNum.value, pageSize, targetUserId: targetId })
    } else {
      // 查该用户点赞的帖子（自己或他人公开）
      res = await getMyLikes({ pageNum: pageNum.value, pageSize, targetUserId: targetId })
    }

    const data = res.data
    if (data) {
      const list = data.list || []
      // 补充 imageCount 字段（PostCard组件需要）
      list.forEach(p => {
        if (p.images && Array.isArray(p.images)) {
          p.imageCount = p.images.length
        }
      })
      if (reset) {
        postList.value = list
      } else {
        postList.value.push(...list)
      }
      total.value = data.total || 0
      if (postList.value.length >= total.value || list.length < pageSize) {
        noMore.value = true
      }
    }
  } catch (err) {
    console.error('加载帖子失败', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// ────────── Tab切换 ──────────
const switchTab = (tab) => {
  currentTab.value = tab
  fetchPosts(true)
}

// ────────── 关注/粉丝列表弹窗 ──────────
const listDialogVisible = ref(false)
const listDialogTitle = ref('关注列表')
const listType = ref('follow') // 'follow' | 'fans'
const userList = ref([])
const listLoading = ref(false)
const listLoadingMore = ref(false)
const listNoMore = ref(false)
const listPageNum = ref(1)

const showFollowList = () => {
  listType.value = 'follow'
  listDialogTitle.value = '关注列表'
  listDialogVisible.value = true
  fetchUserList(true)
}

const showFansList = () => {
  listType.value = 'fans'
  listDialogTitle.value = '粉丝列表'
  listDialogVisible.value = true
  fetchUserList(true)
}

const fetchUserList = async (reset = false) => {
  if (reset) {
    listPageNum.value = 1
    userList.value = []
    listNoMore.value = false
  }
  listLoading.value = reset
  listLoadingMore.value = !reset

  try {
    const params = { pageNum: listPageNum.value, pageSize: 20 }
    const res = listType.value === 'follow'
      ? await getFollowList(params)
      : await getFansList(params)
    const data = res.data
    if (data) {
      const list = data.list || []
      if (reset) {
        userList.value = list
      } else {
        userList.value.push(...list)
      }
      if (userList.value.length >= (data.total || 0) || list.length < 20) {
        listNoMore.value = true
      }
    }
  } catch (err) {
    console.error('加载用户列表失败', err)
  } finally {
    listLoading.value = false
    listLoadingMore.value = false
  }
}

const loadMoreUsers = () => {
  if (listNoMore.value || listLoadingMore.value) return
  listPageNum.value++
  fetchUserList(false)
}

const toggleFollowItem = async (item) => {
  try {
    const res = await followUser(item.userId)
    item.isFollowed = res.data
  } catch (err) {
    console.error('关注操作失败', err)
  }
}

const goToProfile = (userId) => {
  listDialogVisible.value = false
  router.push(`/forum/user/${userId}`)
}

// ────────── IntersectionObserver 触底加载 ──────────
const loadMoreRef = ref(null)
let observer = null

const setupObserver = () => {
  if (!loadMoreRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading.value && !loadingMore.value && !noMore.value) {
        pageNum.value++
        fetchPosts(false)
      }
    },
    { rootMargin: '200px' }
  )
  observer.observe(loadMoreRef.value)
}

// ────────── 路由变化时重新加载 ──────────
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchProfile()
    currentTab.value = 'posts'
    fetchPosts(true)
  }
})

// ────────── 生命周期 ──────────
onMounted(async () => {
  await fetchProfile()
  await fetchPosts(true)
  await nextTick()
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style lang="scss" scoped>
.user-profile-page {
  min-height: 100%;
  background: transparent;
}

/* ══════ 顶部Banner + 用户信息 ══════ */
.profile-header {
  width: min(1320px, calc(100% - 48px));
  margin: 18px auto 0;
  background: var(--forum-card, #fffdfa);
  padding-bottom: 0;
  position: relative;
  border: 1px solid var(--forum-line, #e7e1d7);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(16, 23, 34, 0.06);
}

/* 星空渐变背景 */
.banner-bg {
  height: 180px;
  background:
    radial-gradient(circle at 18% 35%, rgba(200, 155, 83, 0.18), transparent 28%),
    radial-gradient(circle at 82% 20%, rgba(47, 111, 159, 0.26), transparent 30%),
    linear-gradient(135deg, #101722 0%, #172437 54%, #24364b 100%);
  position: relative;
  overflow: hidden;

  /* 星星点点装饰 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.8) 50%, transparent 50%),
      radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.6) 50%, transparent 50%),
      radial-gradient(1.5px 1.5px at 50% 30%, rgba(255,255,255,0.9) 50%, transparent 50%),
      radial-gradient(1px 1px at 70% 70%, rgba(255,255,255,0.5) 50%, transparent 50%),
      radial-gradient(1px 1px at 85% 15%, rgba(255,255,255,0.7) 50%, transparent 50%),
      radial-gradient(1.5px 1.5px at 20% 80%, rgba(255,255,255,0.8) 50%, transparent 50%),
      radial-gradient(1px 1px at 60% 50%, rgba(255,255,255,0.6) 50%, transparent 50%),
      radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.5) 50%, transparent 50%),
      radial-gradient(2px 2px at 45% 10%, rgba(255,215,0,0.7) 50%, transparent 50%),
      radial-gradient(1.5px 1.5px at 75% 85%, rgba(200,200,255,0.8) 50%, transparent 50%);
    opacity: 0.86;
  }
}

/* 用户信息整行（头像 + 右侧信息），小红书风格 */
.profile-info-section {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 0 40px 22px;
  margin-top: -44px;
  position: relative;
  z-index: 1;
}

.avatar-wrapper {
  flex-shrink: 0;
}

.user-avatar {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: 4px solid #fffdfa;
  object-fit: cover;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

  &.placeholder {
    background: linear-gradient(135deg, #101722 0%, #2f6f9f 100%);
    color: #fff;
    font-size: 36px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.info-right {
  flex: 1;
  min-width: 0;
  padding-top: 50px; /* 让右侧信息从banner下方开始 */
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 6px;
}

.user-nickname {
  font-size: 24px;
  font-weight: 700;
  color: var(--forum-ink, #101722);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-extra {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.level-badge {
  font-size: 12px;
  color: #8a5d1f;
  background: #f6ead4;
  padding: 2px 8px;
  border-radius: 10px;
}

.city-tag {
  font-size: 12px;
  color: var(--forum-muted, #697386);
}

/* ── 统计数据 ── */
.stats-row {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  transition: opacity 0.2s;

  &.clickable {
    cursor: pointer;
    &:hover { opacity: 0.7; }
  }
}

.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--forum-ink, #101722);
}

.stat-label {
  font-size: 13px;
  color: var(--forum-muted, #697386);
}

/* ── 关注按钮 ── */
.follow-btn {
  padding: 6px 28px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  color: #fff;
  background: var(--forum-ink, #101722);
  white-space: nowrap;
  flex-shrink: 0;

  &:hover { background: #1b2637; }

  &.followed {
    color: #666;
    background: #f0f0f0;
    &:hover { background: #e5e5e5; }
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

/* ══════ Tab栏 ══════ */
.profile-tabs {
  width: min(1320px, calc(100% - 48px));
  margin: 12px auto 0;
  background: rgba(255, 253, 250, 0.92);
  display: flex;
  justify-content: center;
  gap: 0;
  border: 1px solid var(--forum-line, #e7e1d7);
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(16, 23, 34, 0.05);
}

.tab-item {
  font-size: 15px;
  color: var(--forum-muted, #697386);
  cursor: pointer;
  padding: 13px 32px;
  border-bottom: 3px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover { color: #333; }

  &.active {
    color: var(--forum-ink, #101722);
    font-weight: 700;
    border-bottom-color: var(--forum-gold, #c89b53);
  }
}

.lock-icon {
  font-size: 14px;
  color: #bbb;
  cursor: pointer;
  transition: color 0.2s;
  vertical-align: middle;

  &:hover { color: #666; }
}

/* ══════ 瀑布流内容区 ══════ */
.waterfall-wrapper {
  width: min(1320px, calc(100% - 48px));
  margin: 0 auto;
  padding: 18px 0 34px;
  min-height: 300px;
}

.load-more {
  text-align: center;
  padding: 24px 0 40px;
  font-size: 13px;
  color: #bbb;
}

/* ══════ 关注/粉丝列表弹窗 ══════ */
.follow-list {
  max-height: 400px;
  overflow-y: auto;
}

.follow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ede7dc;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #f7f3ec; }
  &:last-child { border-bottom: none; }
}

.item-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;

  &.placeholder {
    background: #ddd;
    color: #999;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-nickname {
  font-size: 14px;
  font-weight: 600;
  color: #101722;
  display: block;
}

.item-city {
  font-size: 12px;
  color: #697386;
  display: block;
  margin-top: 2px;
}

.item-follow-btn {
  padding: 4px 16px;
  border-radius: 14px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid rgba(16, 23, 34, 0.22);
  color: #101722;
  background: #fffdfa;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover { background: #f4eadb; }

  &.followed {
    border-color: #ddd;
    color: #999;
    &:hover { background: #f5f5f5; }
  }
}

.list-load-more {
  text-align: center;
  padding: 12px 0 4px;
  font-size: 13px;
  color: #2f6f9f;
  cursor: pointer;

  &:hover { color: #1e587f; }
}

/* ══════ 响应式 ══════ */
@media (max-width: 768px) {
  .profile-header,
  .profile-tabs,
  .waterfall-wrapper {
    width: calc(100% - 24px);
  }
  .profile-info-section { padding: 0 16px 16px; gap: 16px; }
  .info-right { padding-top: 40px; }
  .stats-row { gap: 16px; }
  .user-avatar { width: 68px; height: 68px; }
  .user-nickname { font-size: 18px; }
  .waterfall-wrapper { padding: 12px 0; }
  .banner-bg { height: 140px; }
}
</style>
