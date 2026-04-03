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
      <h2 class="page-title">帖子收藏</h2>
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
      >
        <template #default>
          <router-link to="/forum" class="empty-action">去社区看看</router-link>
        </template>
      </el-empty>

      <div ref="loadMoreRef" class="load-more">
        <span v-if="loadingMore">加载中...</span>
        <span v-else-if="noMore && postList.length > 0">已经到底啦~</span>
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
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
  min-height: 400px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.content-area {
  min-height: 300px;
}

.load-more {
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: #bbb;
}

.empty-action {
  color: #ff2442;
  text-decoration: none;
  font-size: 14px;
}
.empty-action:hover { text-decoration: underline; }
</style>
