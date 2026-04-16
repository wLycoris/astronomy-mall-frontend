<template>
  <!-- 帖子详情（小红书web风格：全屏覆盖层，左图+右内容） -->
  <div class="detail-overlay" @click.self="$emit('close')">
    <!-- 关闭按钮（左上角） -->
    <div class="overlay-close" @click="$emit('close')">
      <el-icon :size="22"><Close /></el-icon>
    </div>

    <div v-loading="loading" class="detail-card">
      <!-- 左侧：图片区 -->
      <div class="detail-left">
        <template v-if="post && post.images && post.images.length > 0">
          <div class="image-area">
            <img
              :src="post.images[currentImageIndex]"
              alt=""
              class="main-img"
              @click="openZoom"
            />
            <!-- 左右切换箭头 -->
            <div v-if="post.images.length > 1 && currentImageIndex > 0"
              class="nav-arrow left" @click="currentImageIndex--">
              <el-icon><ArrowLeft /></el-icon>
            </div>
            <div v-if="post.images.length > 1 && currentImageIndex < post.images.length - 1"
              class="nav-arrow right" @click="currentImageIndex++">
              <el-icon><ArrowRight /></el-icon>
            </div>
            <!-- 右上角图片计数角标 -->
            <div v-if="post.images.length > 1" class="image-counter">
              {{ currentImageIndex + 1 }}/{{ post.images.length }}
            </div>
            <!-- 底部圆点指示器 -->
            <div v-if="post.images.length > 1" class="dot-indicators">
              <span v-for="(_, idx) in post.images" :key="idx"
                class="dot" :class="{ active: idx === currentImageIndex }"
                @click.stop="currentImageIndex = idx"></span>
            </div>
          </div>
        </template>
        <!-- 纯文字帖子：标题生成图片封面 -->
        <div v-else-if="post" class="text-cover-card">
          <div class="text-cover-inner">
            <div class="quote-mark">"</div>
            <p class="text-cover-title">{{ post.title }}</p>
          </div>
        </div>
      </div>

      <!-- 右侧：内容+评论 -->
      <div v-if="post" class="detail-right">
        <!-- 作者栏 -->
        <div class="author-bar">
          <div class="author-info" style="cursor:pointer" @click="goToAuthorProfile">
            <img v-if="post.authorAvatar" :src="post.authorAvatar" class="avatar" />
            <span v-else class="avatar-text">{{ (post.authorNickname || '?').charAt(0) }}</span>
            <span class="nickname">{{ post.authorNickname || '匿名用户' }}</span>
          </div>
          <button v-if="!isSelf" class="follow-btn" :class="{ followed: post.isFollowed }" :disabled="followLoading" @click="handleFollow">
            {{ post.isFollowed ? '已关注' : '+ 关注' }}
          </button>
        </div>

        <!-- 可滚动内容区 -->
        <div class="scroll-area">
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-body">{{ post.content }}</div>
          <div v-if="post.tags && post.tags.length > 0" class="post-tags">
            <span v-for="tag in post.tags" :key="tag" class="tag-link" @click="searchTag(tag)">#{{ tag }}</span>
          </div>
          <div class="post-meta">{{ formatTime(post.createTime) }}</div>
          <div v-if="post.recognitionId" class="recognition-link">
            <el-icon><Connection /></el-icon>
            <span>关联AI识别结果 #{{ post.recognitionId }}</span>
          </div>

          <!-- ══════ 评论区 ══════ -->
          <div class="comment-divider"></div>
          <div class="comment-header">共 {{ post.commentCount || 0 }} 条评论</div>
          <div class="comment-list">
            <div v-if="commentLoading" class="comment-empty">
              <el-icon class="is-loading"><Loading /></el-icon> 加载评论中...
            </div>
            <div v-else-if="comments.length === 0" class="comment-empty">还没有评论，快来抢沙发吧~</div>
            <template v-else>
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <!-- 顶级评论 -->
                <div class="comment-main">
                  <img v-if="comment.avatar" :src="comment.avatar" class="comment-avatar" />
                  <span v-else class="comment-avatar-text">{{ (comment.nickname || '?').charAt(0) }}</span>
                  <div class="comment-content">
                    <div class="comment-nickname">
                      {{ comment.nickname || '匿名用户' }}
                      <span v-if="comment.isAuthor" class="author-badge">作者</span>
                    </div>
                    <div class="comment-text">{{ comment.content }}</div>
                    <div class="comment-meta">
                      <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                      <span class="comment-like-btn" :class="{ liked: comment.isLiked }" @click="handleLikeComment(comment)">
                        <el-icon :size="12"><svg viewBox="0 0 1024 1024"><path d="M512 896c-13.1 0-25.6-5.1-35-14.4L136.4 544.8C100.3 509.5 80 462.1 80 412.3 80 308.5 164.5 224 268.3 224c54.2 0 105.3 23.3 141 63.3L512 404l102.7-116.7C650.4 247.3 701.5 224 755.7 224 859.5 224 944 308.5 944 412.3c0 49.8-20.3 97.2-56.4 132.5L547 881.6c-9.4 9.3-21.9 14.4-35 14.4z" fill="currentColor"/></svg></el-icon>
                        {{ comment.likeCount || '' }}
                      </span>
                      <span class="comment-reply-btn" @click="startReply(comment, comment)">
                        <el-icon :size="12"><ChatDotRound /></el-icon> {{ comment.replyCount || '' }}
                      </span>
                      <span v-if="comment.userId === currentUserId" class="comment-delete-btn" @click="handleDeleteComment(comment)">删除</span>
                    </div>

                    <!-- 子回复区域（小红书风格：默认展示1条，展开剩余） -->
                    <div v-if="comment.children && comment.children.length > 0" class="comment-children">
                      <!-- 始终展示第1条子回复 -->
                      <div class="comment-main child" v-for="child in visibleChildren(comment)" :key="child.id">
                        <img v-if="child.avatar" :src="child.avatar" class="comment-avatar small" />
                        <span v-else class="comment-avatar-text small">{{ (child.nickname || '?').charAt(0) }}</span>
                        <div class="comment-content">
                          <div class="comment-nickname">
                            {{ child.nickname || '匿名用户' }}
                            <span v-if="child.isAuthor" class="author-badge">作者</span>
                            <span v-if="child.replyToUsername" class="reply-to">
                              回复 <em>@{{ child.replyToUsername }}</em>
                            </span>
                          </div>
                          <div class="comment-text">{{ child.content }}</div>
                          <div class="comment-meta">
                            <span class="comment-time">{{ formatTime(child.createTime) }}</span>
                            <span class="comment-like-btn" :class="{ liked: child.isLiked }" @click="handleLikeComment(child)">
                              <el-icon :size="12"><svg viewBox="0 0 1024 1024"><path d="M512 896c-13.1 0-25.6-5.1-35-14.4L136.4 544.8C100.3 509.5 80 462.1 80 412.3 80 308.5 164.5 224 268.3 224c54.2 0 105.3 23.3 141 63.3L512 404l102.7-116.7C650.4 247.3 701.5 224 755.7 224 859.5 224 944 308.5 944 412.3c0 49.8-20.3 97.2-56.4 132.5L547 881.6c-9.4 9.3-21.9 14.4-35 14.4z" fill="currentColor"/></svg></el-icon>
                              {{ child.likeCount || '' }}
                            </span>
                            <span class="comment-reply-btn" @click="startReply(comment, child)">
                              <el-icon :size="12"><ChatDotRound /></el-icon>
                            </span>
                            <span v-if="child.userId === currentUserId" class="comment-delete-btn" @click="handleDeleteComment(child)">删除</span>
                          </div>
                        </div>
                      </div>
                      <!-- 展开/收起回复（小红书风格） -->
                      <div v-if="comment.children.length > 1 && !expandedComments[comment.id]"
                        class="expand-replies" @click="expandedComments[comment.id] = true">
                        展开 {{ comment.children.length - 1 }} 条回复
                        <el-icon :size="12"><ArrowDown /></el-icon>
                      </div>
                      <div v-else-if="comment.children.length > 1 && expandedComments[comment.id]"
                        class="expand-replies" @click="expandedComments[comment.id] = false">
                        收起
                        <el-icon :size="12" style="transform:rotate(180deg)"><ArrowDown /></el-icon>
                      </div>
                    </div>

                    <!-- 内联回复框（小红书风格：点击回复后在评论下方展开） -->
                    <div v-if="replyTarget && replyTarget.topCommentId === comment.id" class="inline-reply-box">
                      <input
                        ref="inlineInputRef"
                        v-model="commentText"
                        :placeholder="`回复 @${replyTarget.replyToUsername}`"
                        @keyup.enter="submitComment"
                        class="inline-reply-input"
                      />
                      <div class="inline-reply-actions">
                        <span class="reply-send" @click="submitComment">发送</span>
                        <span class="reply-cancel" @click="cancelReply">取消</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 加载更多评论 -->
              <div v-if="hasMoreComments" class="load-more-comments" @click="loadMoreComments">
                查看更多评论
              </div>
            </template>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="bottom-bar">
          <div class="input-wrapper" @click="focusBottomInput">
            <img v-if="userAvatar" :src="userAvatar" class="my-avatar" />
            <span v-else class="my-avatar-text">{{ myAvatarLetter }}</span>
            <input
              ref="bottomInputRef"
              v-model="bottomCommentText"
              placeholder="说点什么..."
              @keyup.enter="submitBottomComment"
            />
            <span v-if="bottomCommentText.trim()" class="send-btn" @click="submitBottomComment">发送</span>
          </div>
          <div class="action-group">
            <div class="action-btn" :class="{ active: post.isLiked }" @click="handleLikePost">
              <el-icon :size="20">
                <svg viewBox="0 0 1024 1024"><path d="M512 896c-13.1 0-25.6-5.1-35-14.4L136.4 544.8C100.3 509.5 80 462.1 80 412.3 80 308.5 164.5 224 268.3 224c54.2 0 105.3 23.3 141 63.3L512 404l102.7-116.7C650.4 247.3 701.5 224 755.7 224 859.5 224 944 308.5 944 412.3c0 49.8-20.3 97.2-56.4 132.5L547 881.6c-9.4 9.3-21.9 14.4-35 14.4z" fill="currentColor"/></svg>
              </el-icon>
              <span>{{ post.likeCount || 0 }}</span>
            </div>
            <div class="action-btn" :class="{ active: post.isCollected }" @click="handleCollectPost">
              <el-icon :size="20"><Star /></el-icon>
              <span>{{ post.collectCount || 0 }}</span>
            </div>
            <div class="action-btn" @click="focusBottomInput">
              <el-icon :size="20"><ChatDotRound /></el-icon>
              <span>{{ post.commentCount || 0 }}</span>
            </div>
            <div class="action-btn">
              <el-icon :size="20"><Share /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片放大查看器（支持滚轮缩放） -->
    <div v-if="zoomVisible" class="zoom-overlay" @click="zoomVisible = false" @wheel.prevent="handleZoomWheel">
      <div class="zoom-close" @click.stop="zoomVisible = false">
        <el-icon :size="24"><Close /></el-icon>
      </div>
      <div v-if="post && post.images && post.images.length > 1" class="zoom-counter">
        {{ currentImageIndex + 1 }} / {{ post.images.length }}
      </div>
      <div v-if="zoomScale !== 1" class="zoom-percent">{{ Math.round(zoomScale * 100) }}%</div>
      <img :src="post.images[currentImageIndex]" class="zoom-img"
        :style="{ transform: `scale(${zoomScale})` }" @click.stop />
      <div v-if="post && post.images && post.images.length > 1 && currentImageIndex > 0"
        class="zoom-arrow left" @click.stop="currentImageIndex--; zoomScale = 1">
        <el-icon :size="24"><ArrowLeft /></el-icon>
      </div>
      <div v-if="post && post.images && post.images.length > 1 && currentImageIndex < post.images.length - 1"
        class="zoom-arrow right" @click.stop="currentImageIndex++; zoomScale = 1">
        <el-icon :size="24"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { Close, ArrowLeft, ArrowRight, ArrowDown, Star, ChatDotRound, Share, Connection, Loading } from '@element-plus/icons-vue'
import { getPostDetail, getCommentList, addComment, deleteComment, likeComment, likePost, collectPost, followUser } from '@/api/forum'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
// 🆕 8.3.4 跨模块联动：帖子浏览埋点 → 帖子个性化推荐
import { logPostBrowse } from '@/api/recommend'

const props = defineProps({
  postId: { type: Number, required: true }
})
const emit = defineEmits(['close', 'updated'])

const userStore = useUserStore()
const router = useRouter()
const post = ref(null)
const loading = ref(true)
const currentImageIndex = ref(0)
const followLoading = ref(false)
const currentUserId = computed(() => userStore.userInfo?.id)
const isSelf = computed(() => {
  if (!post.value || !userStore.userInfo?.id) return false
  return post.value.userId === userStore.userInfo.id
})

// ══════ 关注/取消关注（7.5 新增）══════
const handleFollow = async () => {
  if (!userStore.userInfo?.id) { ElMessage.warning('请先登录'); return }
  if (!post.value?.userId) return
  followLoading.value = true
  try {
    const res = await followUser(post.value.userId)
    post.value.isFollowed = res.data
    ElMessage.success(res.data ? '关注成功' : '已取消关注')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '操作失败')
  } finally {
    followLoading.value = false
  }
}

// 跳转到作者主页（7.5 新增）
const goToAuthorProfile = () => {
  if (post.value?.userId) {
    emit('close')
    router.push(`/forum/user/${post.value.userId}`)
  }
}

// 点击标签 → 跳转搜索
const searchTag = (tag) => {
  emit('close')
  router.push({ path: '/forum/search', query: { keyword: tag } })
}

// ══════ 图片缩放 ══════
const zoomVisible = ref(false)
const zoomScale = ref(1)
const openZoom = () => { zoomScale.value = 1; zoomVisible.value = true }
const handleZoomWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.15 : 0.15
  zoomScale.value = Math.min(5, Math.max(0.5, zoomScale.value + delta))
}

const userAvatar = computed(() => userStore.userInfo?.avatar)
const myAvatarLetter = computed(() => (userStore.userInfo?.nickname || '?').charAt(0))

// ══════ 评论相关 ══════
const comments = ref([])
const commentLoading = ref(false)
const commentPage = ref(1)
const commentTotal = ref(0)
const commentText = ref('')           // 内联回复输入
const bottomCommentText = ref('')     // 底部输入框（顶级评论）
const inlineInputRef = ref(null)
const bottomInputRef = ref(null)
const replyTarget = ref(null)         // { topCommentId, parentId, replyToUserId, replyToUsername }
const expandedComments = reactive({}) // 已展开回复的评论ID集合

const hasMoreComments = computed(() => comments.value.length < commentTotal.value)

/** 获取某顶级评论显示的子回复（折叠/展开控制） */
const visibleChildren = (comment) => {
  if (!comment.children || comment.children.length === 0) return []
  if (expandedComments[comment.id]) return comment.children
  return comment.children.slice(0, 1) // 默认只展示1条
}

/** 加载评论列表 */
const loadComments = async (page = 1) => {
  commentLoading.value = true
  try {
    const res = await getCommentList({ postId: props.postId, pageNum: page, pageSize: 20 })
    const data = res.data
    if (page === 1) {
      comments.value = data.list || []
    } else {
      comments.value = [...comments.value, ...(data.list || [])]
    }
    commentTotal.value = data.total || 0
    commentPage.value = page
  } catch (err) {
    console.error('加载评论失败', err)
  } finally {
    commentLoading.value = false
  }
}

const loadMoreComments = () => { loadComments(commentPage.value + 1) }

/** 底部输入框聚焦 */
const focusBottomInput = () => {
  // 清除内联回复状态
  replyTarget.value = null
  commentText.value = ''
  nextTick(() => bottomInputRef.value?.focus())
}

/** 开始回复（内联回复框在评论下方展开，小红书风格） */
const startReply = (topComment, targetComment) => {
  replyTarget.value = {
    topCommentId: topComment.id,
    parentId: topComment.id,
    replyToUserId: targetComment.userId,
    replyToUsername: targetComment.nickname || '匿名用户'
  }
  commentText.value = ''
  nextTick(() => {
    // 聚焦内联输入框
    const inputs = document.querySelectorAll('.inline-reply-input')
    if (inputs.length > 0) inputs[inputs.length - 1].focus()
  })
}

/** 取消回复 */
const cancelReply = () => {
  replyTarget.value = null
  commentText.value = ''
}

/** 提交内联回复 */
const submitComment = async () => {
  const content = commentText.value.trim()
  if (!content) return
  if (!userStore.userInfo?.id) { ElMessage.warning('请先登录后再评论'); return }

  try {
    await addComment({
      postId: props.postId,
      content,
      parentId: replyTarget.value.parentId,
      replyToUserId: replyTarget.value.replyToUserId
    })
    ElMessage.success('回复成功')
    commentText.value = ''
    replyTarget.value = null
    await loadComments(1)
    if (post.value) post.value.commentCount = (post.value.commentCount || 0) + 1
    emit('updated', post.value)
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '回复失败')
  }
}

/** 提交底部顶级评论 */
const submitBottomComment = async () => {
  const content = bottomCommentText.value.trim()
  if (!content) return
  if (!userStore.userInfo?.id) { ElMessage.warning('请先登录后再评论'); return }

  try {
    await addComment({ postId: props.postId, content, parentId: 0 })
    ElMessage.success('评论成功')
    bottomCommentText.value = ''
    await loadComments(1)
    if (post.value) post.value.commentCount = (post.value.commentCount || 0) + 1
    emit('updated', post.value)
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '评论失败')
  }
}

/** 删除评论 */
const handleDeleteComment = async (comment) => {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '提示', { type: 'warning' })
    await deleteComment(comment.id)
    ElMessage.success('评论已删除')
    await loadComments(1)
    const res = await getPostDetail(props.postId)
    post.value = res.data
    emit('updated', post.value)
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.response?.data?.message || '删除失败')
  }
}

/** 评论点赞（幂等切换） */
const handleLikeComment = async (comment) => {
  if (!userStore.userInfo?.id) { ElMessage.warning('请先登录'); return }
  try {
    const res = await likeComment(comment.id)
    const liked = res.data
    comment.isLiked = liked
    comment.likeCount = liked
      ? (comment.likeCount || 0) + 1
      : Math.max(0, (comment.likeCount || 0) - 1)
  } catch (err) {
    ElMessage.error('点赞失败')
  }
}

// ══════ 帖子点赞/收藏 ══════
const handleLikePost = async () => {
  if (!userStore.userInfo?.id) { ElMessage.warning('请先登录'); return }
  try {
    const res = await likePost(props.postId)
    const liked = res.data
    post.value.isLiked = liked
    post.value.likeCount = liked
      ? (post.value.likeCount || 0) + 1
      : Math.max(0, (post.value.likeCount || 0) - 1)
    emit('updated', post.value)
  } catch (err) { ElMessage.error('操作失败') }
}

const handleCollectPost = async () => {
  if (!userStore.userInfo?.id) { ElMessage.warning('请先登录'); return }
  try {
    const res = await collectPost(props.postId)
    const collected = res.data
    post.value.isCollected = collected
    post.value.collectCount = collected
      ? (post.value.collectCount || 0) + 1
      : Math.max(0, (post.value.collectCount || 0) - 1)
    emit('updated', post.value)
  } catch (err) { ElMessage.error('操作失败') }
}

// ══════ 生命周期 ══════
onMounted(async () => {
  document.body.style.overflow = 'hidden'

  // 🆕 8.3.4 帖子浏览埋点（异步、不阻塞、失败静默）
  // Redis 30 分钟去重，同一用户同一帖子 30 分钟内只埋一次
  // 埋点数据用于 ForumList "推荐" Tab 的个性化推荐算法
  if (props.postId) {
    logPostBrowse({ postId: props.postId }).catch(err => {
      console.warn('[ForumDetail] 帖子浏览埋点失败:', err)
    })
  }

  try {
    const res = await getPostDetail(props.postId)
    post.value = res.data
  } catch (err) { console.error('加载帖子详情失败', err) }
  finally { loading.value = false }
  loadComments(1)
})
onUnmounted(() => { document.body.style.overflow = '' })

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  let date
  if (Array.isArray(time)) {
    date = new Date(time[0], time[1] - 1, time[2], time[3] || 0, time[4] || 0)
  } else { date = new Date(time) }
  if (isNaN(date.getTime())) return String(time)
  const now = new Date()
  const diff = (now - date) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + '天前'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
/* ══════ 全屏覆盖层 ══════ */
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay-close {
  position: fixed; top: 20px; left: 20px; z-index: 2001;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.15); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.3); }
}

/* ══════ 详情卡片（放大到小红书尺寸） ══════ */
.detail-card {
  display: flex;
  width: 90vw;
  max-width: 1280px;
  height: 90vh;
  max-height: 860px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

/* ── 左侧图片区 ── */
.detail-left {
  width: 55%; flex-shrink: 0;
  background: #e8e8e8;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.image-area {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: #f5f5f5; position: relative;
  .main-img { width: 100%; height: 100%; object-fit: contain; cursor: zoom-in; }
}
.nav-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.25); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 16px; transition: background 0.2s; z-index: 5;
  &:hover { background: rgba(0,0,0,0.5); }
  &.left { left: 12px; }
  &.right { right: 12px; }
}
.image-counter {
  position: absolute; top: 12px; right: 12px;
  padding: 2px 10px; border-radius: 10px;
  background: rgba(0,0,0,0.35); color: #fff; font-size: 13px;
  z-index: 5; backdrop-filter: blur(4px);
}
.dot-indicators {
  position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px;
  .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s;
    &.active { background: #fff; width: 16px; border-radius: 3px; }
  }
}

/* ── 纯文字帖子封面 ── */
.text-cover-card {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
}
.text-cover-inner {
  text-align: center; max-width: 80%;
  .quote-mark { font-size: 72px; color: rgba(255,255,255,0.25); line-height: 0.6; font-family: Georgia, serif; margin-bottom: 16px; }
  .text-cover-title { font-size: 28px; font-weight: 700; color: #fff; line-height: 1.5; margin: 0; text-shadow: 0 2px 8px rgba(0,0,0,0.15); display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }
}

/* ── 右侧内容区 ── */
.detail-right { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.author-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #f5f5f5; flex-shrink: 0;
}
.author-info {
  display: flex; align-items: center; gap: 10px;
  .avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
  .avatar-text { width: 36px; height: 36px; border-radius: 50%; background: #f0f0f0; color: #999; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; }
  .nickname { font-size: 14px; font-weight: 600; color: #333; }
}
.follow-btn {
  padding: 6px 20px; border-radius: 20px; border: none;
  background: #ff2442; color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: #e6203c; }
  &.followed { background: #f5f5f5; color: #999; }
}

/* 可滚动内容区 */
.scroll-area {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }
}
.post-title { font-size: 18px; font-weight: 700; color: #333; line-height: 1.5; margin: 0 0 10px; }
.post-body { font-size: 14px; color: #333; line-height: 2; white-space: pre-wrap; word-break: break-word; }
.post-tags { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;
  .tag-link { font-size: 14px; color: #4a90d9; cursor: pointer; &:hover { color: #2b6cb0; } }
}
.post-meta { margin-top: 12px; font-size: 12px; color: #bbb; }
.recognition-link { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 12px; color: #e6a23c; }

/* ══════ 评论区样式 ══════ */
.comment-divider { height: 1px; background: #f0f0f0; margin: 20px 0 16px; }
.comment-header { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 16px; }
.comment-list { min-height: 80px; }
.comment-empty { text-align: center; padding: 32px 0; color: #ccc; font-size: 13px; }
.comment-item { margin-bottom: 20px; &:last-child { margin-bottom: 0; } }
.comment-main {
  display: flex; gap: 10px; align-items: flex-start;
  &.child { margin-top: 10px; }
}
.comment-avatar {
  width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
  &.small { width: 24px; height: 24px; }
}
.comment-avatar-text {
  width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; color: #999;
  font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  &.small { width: 24px; height: 24px; font-size: 11px; }
}
.comment-content { flex: 1; min-width: 0; }
.comment-nickname {
  font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px;
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
  .reply-to { font-weight: 400; color: #999; font-size: 12px;
    em { color: #4a90d9; font-style: normal; }
  }
}

/* 作者标识（小红书风格） */
.author-badge {
  display: inline-block;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 3px;
  background: #fff0f0;
  color: #ff2442;
  font-size: 11px;
  font-weight: 600;
}

.comment-text { font-size: 14px; color: #333; line-height: 1.6; word-break: break-word; }
.comment-meta {
  display: flex; align-items: center; gap: 16px; margin-top: 6px;
  font-size: 12px; color: #bbb;
}
.comment-time { color: #bbb; }
.comment-like-btn {
  display: flex; align-items: center; gap: 3px;
  cursor: pointer; color: #bbb; transition: color 0.15s;
  &:hover { color: #ff2442; }
  &.liked { color: #ff2442; }
}
.comment-reply-btn {
  display: flex; align-items: center; gap: 3px;
  cursor: pointer; color: #bbb; transition: color 0.15s;
  &:hover { color: #333; }
}
.comment-delete-btn { cursor: pointer; color: #bbb; transition: color 0.15s; &:hover { color: #ff2442; } }

/* 子评论区域 */
.comment-children {
  margin-top: 10px;
  padding-left: 0;
}

/* 展开更多回复（小红书风格） */
.expand-replies {
  display: flex; align-items: center; gap: 4px;
  margin-top: 8px;
  font-size: 13px; color: #4a90d9; cursor: pointer;
  padding-left: 34px; /* 对齐头像后的内容 */
  &:hover { color: #2b6cb0; }
}

/* 内联回复框（小红书风格） */
.inline-reply-box {
  margin-top: 10px;
  background: #f7f7f7;
  border-radius: 8px;
  padding: 10px 12px;
}
.inline-reply-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #333;
  line-height: 1.6;
  &::placeholder { color: #bbb; }
}
.inline-reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
.reply-send {
  padding: 4px 16px;
  border-radius: 16px;
  background: #ff2442;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #e6203c; }
}
.reply-cancel {
  padding: 4px 16px;
  border-radius: 16px;
  background: #f0f0f0;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #e5e5e5; }
}

/* 加载更多评论 */
.load-more-comments {
  text-align: center; padding: 12px 0; font-size: 13px;
  color: #4a90d9; cursor: pointer; &:hover { color: #2b6cb0; }
}

/* ── 底部操作栏 ── */
.bottom-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px; border-top: 1px solid #f0f0f0; flex-shrink: 0;
}
.input-wrapper {
  flex: 1; display: flex; align-items: center; gap: 8px;
  background: #f5f5f5; border-radius: 20px; padding: 0 12px; height: 36px;
  .my-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .my-avatar-text { width: 24px; height: 24px; border-radius: 50%; background: #ddd; color: #999; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: #333; &::placeholder { color: #bbb; } }
  .send-btn { color: #ff2442; font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0; transition: opacity 0.15s; &:hover { opacity: 0.8; } }
}
.action-group { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.action-btn {
  display: flex; align-items: center; gap: 4px;
  cursor: pointer; color: #333; font-size: 13px; transition: color 0.15s;
  &:hover { color: #ff2442; }
  &.active { color: #ff2442; }
}

/* ══════ 图片放大查看器 ══════ */
.zoom-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center; cursor: zoom-out;
}
.zoom-close { position: absolute; top: 20px; right: 20px; color: rgba(255,255,255,0.7); cursor: pointer; transition: color 0.2s; &:hover { color: #fff; } }
.zoom-counter { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.8); font-size: 14px; }
.zoom-percent { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 4px 16px; border-radius: 16px; background: rgba(0,0,0,0.6); color: #fff; font-size: 13px; z-index: 5; }
.zoom-img { max-width: 90vw; max-height: 90vh; object-fit: contain; cursor: default; border-radius: 4px; transition: transform 0.1s ease-out; }
.zoom-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.1); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.25); }
  &.left { left: 24px; }
  &.right { right: 24px; }
}

/* ══════ 响应式 ══════ */
@media (max-width: 900px) {
  .detail-card { flex-direction: column; width: 95vw; height: 95vh; max-height: none; max-width: none; }
  .detail-left { width: 100%; height: 45%; flex-shrink: 0; }
}
</style>
