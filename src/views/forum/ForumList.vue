<template>
  <div class="forum-list-page">
    <!-- Tab栏：推荐/关注/热门 + 标签（小红书风格，紧贴顶栏） -->
    <div class="tab-section">
      <div class="main-tabs">
        <span
          v-for="t in mainTabs"
          :key="t.value"
          class="tab-item"
          :class="{ active: currentTab === t.value }"
          @click="switchTab(t.value)"
        >
          {{ t.label }}
        </span>
        <!-- 分隔线 -->
        <span class="tab-divider"></span>
        <!-- 标签作为tab延伸（和小红书一致，标签与主tab同行） -->
        <span
          v-for="tag in displayTags"
          :key="tag"
          class="tab-item tag"
          :class="{ active: currentTag === tag }"
          @click="switchTag(tag)"
        >
          {{ tag }}
        </span>
        <span v-if="allTags.length > showTagCount" class="tab-item more" @click="expandTags = !expandTags">
          {{ expandTags ? '收起' : '更多' }}
        </span>
      </div>
    </div>

    <!-- 瀑布流内容区 -->
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
        :image-size="120"
      />

      <!-- 加载更多触发器 -->
      <div ref="loadMoreRef" class="load-more">
        <span v-if="loadingMore">加载中...</span>
        <template v-else-if="noMore && postList.length > 0">
          <!-- 推荐 Tab 触底：显示「刷新一批」按钮（重新打乱推荐序列） -->
          <div v-if="isRecommendTab" class="bottom-recommend-cta">
            <span class="hint">已经到底啦，给你换一批新鲜推荐 ~</span>
            <el-button type="primary" round size="small" @click="refreshRecommend">
              <el-icon class="refresh-icon"><Refresh /></el-icon>
              刷新一批
            </el-button>
          </div>
          <span v-else>已经到底啦~</span>
        </template>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getPostList } from '@/api/forum'
// 🆕 8.3.4 跨模块联动：帖子个性化推荐（直接植入"推荐"Tab，无需新增 Tab）
import { getPostRecommend } from '@/api/recommend'
import PostWaterfall from './PostWaterfall.vue'
import ForumDetail from './ForumDetail.vue'

// ────────── 数据状态 ──────────
const postList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)
const pageNum = ref(1)
// 🆕 8.3.4 推荐 Tab 用大页（瀑布流体验更好），其他 Tab 沿用 20
const RECOMMEND_PAGE_SIZE = 50
const NORMAL_PAGE_SIZE = 20
const total = ref(0)
// 触底「刷新一批」时使用的轮次种子，让推荐序列每次都打乱（依赖后端浏览埋点更新画像即可，
// 这里只是把页码归 1 重新拉取最新排序结果）
const recommendRound = ref(0)

// ────────── Tab状态 ──────────
const currentTab = ref('all')
const currentTag = ref('')
const expandTags = ref(false)
const showTagCount = 8

const mainTabs = [
  { label: '推荐', value: 'all' },
  { label: '关注', value: 'follow' },
  { label: '热门', value: 'hot' }
]

// 天文相关分类标签
const allTags = [
  '深空摄影', '行星摄影', '星野摄影', '望远镜', '目镜',
  '赤道仪', '经纬仪', '天文相机', '滤镜', '观测报告',
  '器材评测', '新手入门', '星空分享', '月球', '太阳',
  '流星雨', '彗星', '星云', '星团', '银河'
]
const displayTags = computed(() => expandTags.value ? allTags : allTags.slice(0, showTagCount))

// ────────── 帖子详情弹窗 ──────────
const detailVisible = ref(false)
const currentPostId = ref(null)

const openDetail = (post) => {
  currentPostId.value = post.id
  detailVisible.value = true
}

/** 详情页点赞/收藏/评论后同步更新列表中对应卡片的计数 */
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

// ────────── 空状态文案 ──────────
const emptyText = computed(() => {
  if (currentTab.value === 'follow') return '还没有关注任何人，去发现页看看吧'
  if (currentTag.value) return `暂无「${currentTag.value}」相关帖子`
  return '暂无帖子，成为第一个发帖的人吧！'
})

// 是否处于「推荐」模式：推荐 Tab + 没选标签
const isRecommendTab = computed(() =>
  currentTab.value === 'all' && !currentTag.value
)
// 当前应使用的 pageSize
const currentPageSize = computed(() =>
  isRecommendTab.value ? RECOMMEND_PAGE_SIZE : NORMAL_PAGE_SIZE
)

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
    // 🆕 8.3.4 智能分流（重构 v8.58）:
    //   - 「推荐」Tab + 无 tag 筛选 → 调用 getPostRecommend（综合分排序，分页 50/页）
    //     用户滑到底显示「刷新一批」按钮，点击重新拉取（依靠后端浏览埋点更新画像）
    //   - 其余情况（关注/热门/有 tag 筛选）→ 沿用 getPostList（普通分页 20/页）
    if (isRecommendTab.value) {
      try {
        const res = await getPostRecommend({
          pageNum: pageNum.value,
          pageSize: RECOMMEND_PAGE_SIZE
        })
        const data = res.data || {}
        const list = data.list || []
        if (reset) {
          postList.value = list
        } else {
          postList.value.push(...list)
        }
        total.value = data.total || 0
        if (postList.value.length >= total.value || list.length < RECOMMEND_PAGE_SIZE) {
          noMore.value = true
        }
      } catch (err) {
        console.warn('[ForumList] 推荐接口失败，降级到普通列表:', err)
        // 降级：走原有 getPostList 保证可用性
        const res = await getPostList({
          tab: 'all',
          pageNum: pageNum.value,
          pageSize: NORMAL_PAGE_SIZE
        })
        const data = res.data
        if (data) {
          const list = data.list || []
          if (reset) {
            postList.value = list
          } else {
            postList.value.push(...list)
          }
          total.value = data.total || 0
          if (postList.value.length >= total.value || list.length < NORMAL_PAGE_SIZE) {
            noMore.value = true
          }
        }
      }
    } else {
      const res = await getPostList({
        tab: currentTab.value,
        tag: currentTag.value || undefined,
        pageNum: pageNum.value,
        pageSize: NORMAL_PAGE_SIZE
      })
      const data = res.data
      if (data) {
        const list = data.list || []
        if (reset) {
          postList.value = list
        } else {
          postList.value.push(...list)
        }
        total.value = data.total || 0
        if (postList.value.length >= total.value || list.length < NORMAL_PAGE_SIZE) {
          noMore.value = true
        }
      }
    }
  } catch (err) {
    console.error('加载帖子失败', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 🆕 8.3.4 「刷新一批」：把推荐 Tab 置回第一页重新排序
//   后端会基于最新浏览画像 + hot_score 重新排，并随机化部分序号
const refreshRecommend = async () => {
  recommendRound.value++
  await fetchPosts(true)
  // 滚回顶部，让用户看到新一批
  window.scrollTo({ top: 0, behavior: 'smooth' })
  ElMessage.success('已为你换一批新鲜推荐')
}

// ────────── Tab/Tag切换 ──────────
const switchTab = (tab) => {
  currentTab.value = tab
  currentTag.value = ''
  fetchPosts(true)
}

const switchTag = (tag) => {
  currentTag.value = currentTag.value === tag ? '' : tag
  fetchPosts(true)
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

// ────────── 生命周期 ──────────
const route = useRoute()

onMounted(async () => {
  // 从话题搜索跳转过来，自动选中对应标签
  if (route.query.tag) {
    currentTag.value = route.query.tag
  }
  await fetchPosts(true)
  await nextTick()
  setupObserver()

  // 🆕 7.7 通知跳转：?postId=xx 时自动打开帖子详情弹窗
  // （由站内信"帖子审核通过/拒绝"的 jumpUrl 触发）
  if (route.query.postId) {
    const pid = Number(route.query.postId)
    if (!isNaN(pid) && pid > 0) {
      currentPostId.value = pid
      detailVisible.value = true
    }
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style lang="scss" scoped>
.forum-list-page {
  min-height: 100%;
  background: transparent;
}

/* ── Tab栏（与小红书一致：主tab+标签同行） ── */
.tab-section {
  width: min(1320px, calc(100% - 48px));
  margin: 18px auto 0;
  background: rgba(255, 253, 250, 0.92);
  padding: 0 16px;
  border: 1px solid var(--forum-line, #e7e1d7);
  border-radius: 8px;
  position: sticky;
  top: 72px;
  z-index: 50;
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 28px rgba(16, 23, 34, 0.06);
}

.main-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  min-height: 50px;
}

.tab-item {
  font-size: 15px;
  color: var(--forum-muted, #697386);
  cursor: pointer;
  padding: 8px 13px;
  border-radius: 16px;
  transition: color 0.15s, background 0.15s, box-shadow 0.15s;
  white-space: nowrap;
  font-weight: 500;

  &:hover {
    color: var(--forum-ink, #101722);
    background: #f3efe7;
  }

  &.active {
    color: #fff;
    font-weight: 700;
    background: var(--forum-ink, #101722);
    box-shadow: 0 8px 18px rgba(16, 23, 34, 0.14);
  }

  /* 标签tab样式稍小 */
  &.tag {
    font-size: 14px;
    padding: 7px 12px;
    color: #536071;

    &.active {
      color: var(--forum-ink, #101722);
      font-weight: 600;
      background: #f3eadc;
      box-shadow: none;
    }
  }

  &.more {
    font-size: 13px;
    color: var(--forum-gold, #c89b53);
    &:hover { color: var(--forum-ink, #101722); }
  }
}

/* 主tab和标签之间的竖分隔线 */
.tab-divider {
  width: 1px;
  height: 18px;
  background: var(--forum-line, #e7e1d7);
  margin: 0 8px;
  flex-shrink: 0;
}

/* ── 瀑布流内容区 ── */
.waterfall-wrapper {
  width: min(1320px, calc(100% - 48px));
  margin: 0 auto;
  padding: 18px 0 34px;
  min-height: 400px;
}

.load-more {
  text-align: center;
  padding: 24px 0 40px;
  font-size: 13px;
  color: #8c95a3;
}

/* 🆕 8.3.4 推荐 Tab 触底「刷新一批」按钮 */
.bottom-recommend-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 16px 0;

  .hint {
    font-size: 13px;
    color: var(--forum-muted, #697386);
  }

  :deep(.el-button) {
    padding: 10px 26px;
    font-size: 14px;
    background: var(--forum-ink, #101722);
    border-color: var(--forum-ink, #101722);
    transition: all 0.2s;

    &:hover {
      background: #1b2637;
      border-color: #1b2637;
      transform: translateY(-1px);
      box-shadow: 0 10px 24px rgba(16, 23, 34, 0.2);
    }
  }

  .refresh-icon {
    margin-right: 4px;
    vertical-align: -2px;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .tab-section {
    width: calc(100% - 24px);
    padding: 0 10px;
    top: 68px;
  }
  .waterfall-wrapper {
    width: calc(100% - 24px);
    padding: 12px 0;
  }
  .tab-item { padding: 10px 10px; font-size: 14px; }
  .tab-item.tag { padding: 10px 8px; font-size: 13px; }
}
</style>
