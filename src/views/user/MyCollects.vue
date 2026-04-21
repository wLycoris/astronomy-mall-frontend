<template>
  <!--
    我的帖子收藏页面（个人中心侧边栏入口）
    文件路径: src/views/user/MyCollects.vue
    路由: /user/my-collects

    📌 7.5 新建
    📌 复用 PostWaterfall + PostCard 组件展示收藏的帖子
  -->
  <div class="my-collects-page">
    <div class="page-header">
      <div>
        <div class="section-kicker">SAVED POSTS</div>
        <h2 class="page-title">帖子收藏</h2>
        <p class="page-subtitle">保存你想反复查看的观测灵感、经验分享和器材讨论。</p>
      </div>
      <div class="header-side">
        <span class="count-pill">{{ total }} 条收藏</span>
        <router-link to="/forum" class="browse-btn">去社区看看</router-link>
      </div>
    </div>

    <!-- 瀑布流内容区 -->
    <div class="content-area" v-loading="loading && pageNum === 1">
      <PostWaterfall
        v-if="postList.length > 0"
        :posts="postList"
        @card-click="openDetail"
      />

      <el-empty
        v-if="!loading && postList.length === 0"
        description="你还没有收藏任何帖子"
        :image-size="100"
        class="empty-state"
      >
        <template #default>
          <router-link to="/forum" class="empty-action">去社区看看</router-link>
        </template>
      </el-empty>

      <div ref="loadMoreRef" class="load-more">
        <span v-if="loadingMore">正在加载更多</span>
        <span v-else-if="noMore && postList.length > 0">已加载全部内容</span>
      </div>
    </div>

    <!-- 帖子详情弹窗 -->
    <ForumDetail
      v-if="detailVisible"
      :post-id="currentPostId"
      @close="detailVisible = false"
      @updated="onDetailUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { getMyCollects } from '@/api/forum'
import PostWaterfall from '@/views/forum/PostWaterfall.vue'
import ForumDetail from '@/views/forum/ForumDetail.vue'

// ────────── 帖子列表状态 ──────────
const postList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = 20

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

// ────────── 加载帖子 ──────────
const fetchCollects = async (reset = false) => {
  if (reset) {
    pageNum.value = 1
    noMore.value = false
    postList.value = []
  }
  if (pageNum.value === 1) loading.value = true
  else loadingMore.value = true

  try {
    const res = await getMyCollects({ pageNum: pageNum.value, pageSize })
    const data = res.data
    if (data) {
      const list = data.list || []
      total.value = data.total || 0
      list.forEach(p => {
        if (p.images && Array.isArray(p.images)) p.imageCount = p.images.length
      })
      if (reset) postList.value = list
      else postList.value.push(...list)
      if (postList.value.length >= (data.total || 0) || list.length < pageSize) {
        noMore.value = true
      }
    }
  } catch (err) {
    console.error('加载收藏帖子失败', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// ────────── 触底加载 ──────────
const loadMoreRef = ref(null)
let observer = null

onMounted(async () => {
  await fetchCollects(true)
  await nextTick()
  if (loadMoreRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading.value && !loadingMore.value && !noMore.value) {
          pageNum.value++
          fetchCollects(false)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(loadMoreRef.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.my-collects-page {
  color: #172033;
  background:
    radial-gradient(600px 180px at 12% 0%, rgba(199, 165, 114, .12), transparent 62%),
    #fffdfa;
  border: 1px solid #e9e1d4;
  border-radius: 8px;
  box-shadow: 0 16px 38px rgba(35, 30, 22, .08);
  padding: 24px;
  min-height: 400px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid #ebe3d7;
}

.section-kicker {
  margin-bottom: 6px;
  color: #9a6b36;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.8px;
}

.page-title {
  margin: 0;
  color: #101827;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.25;
}

.page-subtitle {
  margin: 7px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.7;
}

.header-side {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.count-pill {
  padding: 7px 12px;
  border: 1px solid #e6d7c1;
  border-radius: 999px;
  background: #f8f4ec;
  color: #8a5f2e;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.browse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  height: 36px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 800;
  color: #fffdfa;
  background: #111827;
  text-decoration: none;
  transition: background .2s, border-color .2s;
}

.browse-btn:hover {
  background: #9a6b36;
}

.content-area {
  min-height: 320px;
}

.load-more {
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: #8b95a5;
}

.empty-state {
  padding: 70px 0;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: rgba(255, 253, 250, .72);
}

.empty-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 132px;
  height: 38px;
  padding: 0 16px;
  border-radius: 4px;
  background: #111827;
  color: #fffdfa;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
}

.empty-action:hover {
  background: #9a6b36;
}

:deep(.waterfall-container) {
  columns: 3;
  column-gap: 16px;
}

:deep(.post-card) {
  margin-bottom: 16px;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
  box-shadow: 0 10px 24px rgba(35, 30, 22, .07);
  transition: transform .2s, box-shadow .2s, border-color .2s;
}

:deep(.post-card:hover) {
  border-color: rgba(154, 107, 54, .42);
  box-shadow: 0 16px 32px rgba(35, 30, 22, .12);
  transform: translateY(-2px);
}

:deep(.card-cover img) {
  min-height: 128px;
  max-height: 320px;
}

:deep(.text-cover) {
  background:
    radial-gradient(180px 120px at 20% 10%, rgba(199, 165, 114, .18), transparent 60%),
    #f8f4ec !important;
}

:deep(.text-cover::before),
:deep(.text-cover-content) {
  color: #6b5132 !important;
}

:deep(.multi-badge) {
  border: 1px solid rgba(247, 236, 210, .26);
  background: rgba(17, 24, 39, .78);
}

:deep(.card-body) {
  padding: 11px 12px 12px;
}

:deep(.card-title) {
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.55;
}

:deep(.author-info .avatar-placeholder) {
  background: #f3e9cf;
  color: #8a5f2e;
  font-weight: 800;
}

:deep(.author-info .author-name) {
  color: #667085;
}

:deep(.like-info) {
  color: #8b95a5;
}

:deep(.like-info.liked) {
  color: #9a6b36;
}

@media (max-width: 1100px) {
  :deep(.waterfall-container) {
    columns: 2;
  }
}

@media (max-width: 720px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-side {
    width: 100%;
    justify-content: space-between;
  }

  :deep(.waterfall-container) {
    columns: 1;
  }
}
</style>
