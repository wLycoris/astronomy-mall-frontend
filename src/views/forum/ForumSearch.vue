<template>
  <!--
    论坛搜索结果页（小红书web风格）
    文件路径: src/views/forum/ForumSearch.vue
    路由: /forum/search?keyword=xxx

    📌 7.6 新建
    📌 功能: 搜索结果展示（帖子瀑布流 + 用户卡片列表 + 关键词高亮）
    📌 搜索历史/热搜下拉已移至 ForumLayout.vue 顶部搜索框
    📌 复用: PostWaterfall + PostCard + ForumDetail 组件
  -->
  <div class="search-page">
    <!-- ══════ 未搜索状态：空白引导 ══════ -->
    <div v-if="!hasSearched" class="search-empty-state">
      <el-icon class="empty-icon"><Search /></el-icon>
      <p class="empty-text">搜索你感兴趣的笔记或用户</p>
    </div>

    <!-- ══════ 搜索结果 ══════ -->
    <div v-if="hasSearched" class="search-results">
      <!-- 结果Tab: 笔记 / 用户 / 话题 -->
      <div class="result-tabs">
        <div
          class="result-tab"
          :class="{ active: searchType === 'post' }"
          @click="switchType('post')"
        >
          <span>笔记</span>
          <div class="tab-line"></div>
        </div>
        <div
          class="result-tab"
          :class="{ active: searchType === 'user' }"
          @click="switchType('user')"
        >
          <span>用户</span>
          <div class="tab-line"></div>
        </div>
        <div
          class="result-tab"
          :class="{ active: searchType === 'topic' }"
          @click="switchType('topic')"
        >
          <span>话题</span>
          <div class="tab-line"></div>
        </div>
      </div>

      <!-- ── 笔记结果（瀑布流） ── -->
      <div v-if="searchType === 'post'" class="post-results">
        <div v-if="loading && pageNum === 1" class="results-loading" v-loading="true" style="min-height: 200px;"></div>
        <template v-else>
          <PostWaterfall
            v-if="postList.length > 0"
            :posts="postList"
            @card-click="openDetail"
          />
          <div v-if="!loading && postList.length === 0" class="no-result">
            <el-icon class="no-result-icon"><Search /></el-icon>
            <p>没有找到相关笔记</p>
            <p class="no-result-tip">换个关键词试试吧</p>
          </div>
        </template>
        <!-- 加载更多 -->
        <div ref="loadMoreRef" class="load-more">
          <span v-if="loadingMore" class="loading-text">加载中...</span>
          <span v-else-if="noMore && postList.length > 0" class="end-text">已经到底啦~</span>
        </div>
      </div>

      <!-- ── 用户结果 ── -->
      <div v-if="searchType === 'user'" class="user-results">
        <div v-if="loading && pageNum === 1" class="results-loading" v-loading="true" style="min-height: 200px;"></div>
        <template v-else>
          <div v-if="userList.length > 0" class="user-list">
            <div
              v-for="user in userList"
              :key="user.userId"
              class="user-card"
              @click="goToProfile(user.userId)"
            >
              <img v-if="user.avatar" :src="user.avatar" class="user-avatar" alt="" />
              <div v-else class="user-avatar placeholder">{{ (user.nickname || '?').charAt(0) }}</div>
              <div class="user-info">
                <span class="user-nickname" v-html="highlightKeyword(user.nickname || '天文爱好者')"></span>
                <div class="user-meta">
                  <span v-if="user.observationLevel" class="user-level">Lv.{{ user.observationLevel }}</span>
                  <span v-if="user.city" class="user-city">{{ user.city }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!loading && userList.length === 0" class="no-result">
            <el-icon class="no-result-icon"><User /></el-icon>
            <p>没有找到相关用户</p>
            <p class="no-result-tip">换个关键词试试吧</p>
          </div>
        </template>
        <!-- 加载更多 -->
        <div ref="userLoadMoreRef" class="load-more">
          <span v-if="loadingMore" class="loading-text">加载中...</span>
          <span v-else-if="noMore && userList.length > 0" class="end-text">已经到底啦~</span>
        </div>
      </div>

      <!-- ── 话题结果 ── -->
      <div v-if="searchType === 'topic'" class="topic-results">
        <div v-if="loading" class="results-loading" v-loading="true" style="min-height: 200px;"></div>
        <template v-else>
          <div v-if="topicList.length > 0" class="topic-list">
            <div
              v-for="topic in topicList"
              :key="topic.tag"
              class="topic-card"
              @click="goToTopic(topic.tag)"
            >
              <div class="topic-icon">#</div>
              <div class="topic-info">
                <span class="topic-name" v-html="highlightKeyword(topic.tag)"></span>
                <span class="topic-count">{{ topic.postCount }} 篇笔记</span>
              </div>
              <el-icon class="topic-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
          <div v-if="!loading && topicList.length === 0" class="no-result">
            <el-icon class="no-result-icon"><CollectionTag /></el-icon>
            <p>没有找到相关话题</p>
            <p class="no-result-tip">换个关键词试试吧</p>
          </div>
        </template>
      </div>
    </div>

    <!-- ══════ 帖子详情弹窗 ══════ -->
    <ForumDetail
      v-if="detailVisible"
      :post-id="currentPostId"
      @close="detailVisible = false"
      @updated="onDetailUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchPost } from '@/api/forum'
import PostWaterfall from './PostWaterfall.vue'
import ForumDetail from './ForumDetail.vue'
import { Search, User, ArrowRight, CollectionTag } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// ────────── 搜索状态 ──────────
const keyword = ref('')
const searchType = ref('post')
const hasSearched = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)
const pageNum = ref(1)
const pageSize = 20

// ────────── 帖子结果 ──────────
const postList = ref([])
const total = ref(0)

// ────────── 用户结果 ──────────
const userList = ref([])
const userTotal = ref(0)

// ────────── 话题结果 ──────────
const topicList = ref([])

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

// ────────── 执行搜索 ──────────
const switchType = (type) => {
  searchType.value = type
  fetchResults(true)
}

const goToProfile = (userId) => {
  router.push(`/forum/user/${userId}`)
}

const goToTopic = (tag) => {
  // 点击话题标签 → 用该标签作为关键词搜索笔记
  keyword.value = tag
  searchType.value = 'post'
  router.replace({ path: '/forum/search', query: { keyword: tag } })
  fetchResults(true)
}

// ────────── 加载搜索结果 ──────────
const fetchResults = async (reset = false) => {
  const kw = keyword.value.trim()
  if (!kw) return

  if (reset) {
    pageNum.value = 1
    noMore.value = false
    if (searchType.value === 'post') {
      postList.value = []
    } else if (searchType.value === 'user') {
      userList.value = []
    } else {
      topicList.value = []
    }
  }

  if (pageNum.value === 1) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const res = await searchPost({
      keyword: kw,
      type: searchType.value,
      pageNum: pageNum.value,
      pageSize
    })
    const data = res.data
    if (data) {
      const list = data.list || []
      if (searchType.value === 'post') {
        // 确保 PostCard 需要的字段
        list.forEach(p => {
          if (p.images && Array.isArray(p.images)) {
            p.imageCount = p.images.length
            if (!p.coverImage && p.images.length > 0) {
              p.coverImage = p.images[0]
            }
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
      } else if (searchType.value === 'user') {
        if (reset) {
          userList.value = list
        } else {
          userList.value.push(...list)
        }
        userTotal.value = data.total || 0
        if (userList.value.length >= userTotal.value || list.length < pageSize) {
          noMore.value = true
        }
      } else if (searchType.value === 'topic') {
        // 话题一次性返回全部，无需分页
        topicList.value = list
        noMore.value = true
      }
    }
  } catch (err) {
    console.error('搜索失败', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// ────────── 关键词高亮 ──────────
const highlightKeyword = (text) => {
  if (!text || !keyword.value.trim()) return text
  const kw = keyword.value.trim()
  const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// ────────── IntersectionObserver 触底加载 ──────────
const loadMoreRef = ref(null)
const userLoadMoreRef = ref(null)
let observer = null

const setupObserver = () => {
  if (observer) observer.disconnect()

  const target = searchType.value === 'post' ? loadMoreRef.value : userLoadMoreRef.value
  if (!target) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading.value && !loadingMore.value && !noMore.value && hasSearched.value) {
        pageNum.value++
        fetchResults(false)
      }
    },
    { rootMargin: '200px' }
  )
  observer.observe(target)
}

// ────────── 监听路由query变化（从Layout搜索框触发） ──────────
watch(() => route.query.keyword, (newKw) => {
  if (newKw) {
    keyword.value = newKw
    hasSearched.value = true
    searchType.value = 'post' // 每次新搜索重置为笔记Tab
    fetchResults(true)
  } else {
    hasSearched.value = false
    keyword.value = ''
    postList.value = []
    userList.value = []
    topicList.value = []
  }
}, { immediate: true })

// ────────── 监听搜索类型变化重建Observer ──────────
watch(searchType, async () => {
  await nextTick()
  setupObserver()
})

// ────────── 监听搜索结果重建Observer ──────────
watch([postList, userList], async () => {
  await nextTick()
  setupObserver()
})

// ────────── 生命周期 ──────────
onMounted(async () => {
  await nextTick()
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100%;
  background: #fff;
}

/* ══════ 空白引导状态 ══════ */
.search-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 140px;
  color: #ccc;

  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-text { font-size: 14px; color: #bbb; }
}

/* ══════ 搜索结果 ══════ */
.search-results {
  background: #fff;
}

/* ── Tab栏（小红书风格：居中 + 红色下划线） ── */
.result-tabs {
  display: flex;
  justify-content: center;
  gap: 40px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  position: sticky;
  top: 56px; /* 紧贴顶部导航 */
  z-index: 50;
}

.result-tab {
  position: relative;
  padding: 16px 0;
  font-size: 15px;
  color: #999;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.15s;

  &:hover { color: #666; }

  .tab-line {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    border-radius: 2px;
    background: #ff2442;
    transition: width 0.2s;
  }

  &.active {
    color: #333;
    font-weight: 700;

    .tab-line { width: 28px; }
  }
}

/* ── 笔记瀑布流结果 ── */
.post-results {
  padding: 20px 24px;
  min-height: 400px;
}

/* ── 用户结果列表 ── */
.user-results {
  padding: 12px 24px;
  min-height: 400px;
}

.user-list {
  max-width: 600px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #f8f8f8; }
}

.user-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;

  &.placeholder {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-nickname {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-level {
  font-size: 11px;
  color: #f59e0b;
  background: #fef3c7;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.user-city {
  font-size: 12px;
  color: #999;
}

/* ── 无结果 ── */
.no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
  color: #ccc;

  .no-result-icon { font-size: 40px; margin-bottom: 12px; }
  p { font-size: 14px; color: #999; margin: 0; }
  .no-result-tip { font-size: 12px; color: #ccc; margin-top: 4px; }
}

/* ── 加载更多 ── */
.load-more {
  text-align: center;
  padding: 24px 0 40px;

  .loading-text, .end-text {
    font-size: 13px;
    color: #bbb;
  }
}

/* ── 话题结果 ── */
.topic-results {
  padding: 12px 24px;
  min-height: 400px;
}

.topic-list {
  max-width: 600px;
}

.topic-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #f8f8f8; }
}

.topic-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff2442 0%, #ff6b81 100%);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.topic-info {
  flex: 1;
  min-width: 0;
}

.topic-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.topic-count {
  font-size: 12px;
  color: #999;
}

.topic-arrow {
  font-size: 16px;
  color: #ccc;
  flex-shrink: 0;
}

/* ── 关键词高亮 ── */
:deep(.highlight) {
  color: #ff2442;
  font-weight: 700;
}

/* ══════ 响应式 ══════ */
@media (max-width: 768px) {
  .post-results { padding: 12px; }
  .user-results { padding: 8px 12px; }
  .topic-results { padding: 8px 12px; }
}
</style>
