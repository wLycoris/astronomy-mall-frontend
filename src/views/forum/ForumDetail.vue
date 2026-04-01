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
            <!-- 右上角图片计数（小红书风格 1/2） -->
            <div v-if="post.images.length > 1" class="image-counter">
              {{ currentImageIndex + 1 }}/{{ post.images.length }}
            </div>
            <!-- 底部圆点指示器 -->
            <div v-if="post.images.length > 1" class="dot-indicators">
              <span
                v-for="(_, idx) in post.images"
                :key="idx"
                class="dot"
                :class="{ active: idx === currentImageIndex }"
                @click.stop="currentImageIndex = idx"
              ></span>
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
          <div class="author-info">
            <img v-if="post.authorAvatar" :src="post.authorAvatar" class="avatar" />
            <span v-else class="avatar-text">{{ (post.authorNickname || '?').charAt(0) }}</span>
            <span class="nickname">{{ post.authorNickname || '匿名用户' }}</span>
          </div>
          <button v-if="!isSelf" class="follow-btn" :class="{ followed: post.isFollowed }">
            {{ post.isFollowed ? '已关注' : '关注' }}
          </button>
        </div>

        <!-- 可滚动内容区 -->
        <div class="scroll-area">
          <!-- 标题 -->
          <h1 class="post-title">{{ post.title }}</h1>
          <!-- 正文 -->
          <div class="post-body">{{ post.content }}</div>
          <!-- 标签 -->
          <div v-if="post.tags && post.tags.length > 0" class="post-tags">
            <span v-for="tag in post.tags" :key="tag" class="tag-link">#{{ tag }}</span>
          </div>
          <!-- 时间 -->
          <div class="post-meta">{{ formatTime(post.createTime) }}</div>

          <!-- AI识别关联 -->
          <div v-if="post.recognitionId" class="recognition-link">
            <el-icon><Connection /></el-icon>
            <span>关联AI识别结果 #{{ post.recognitionId }}</span>
          </div>

          <!-- 评论区 -->
          <div class="comment-divider"></div>
          <div class="comment-header">共 {{ post.commentCount || 0 }} 条评论</div>
          <div class="comment-list">
            <!-- 评论占位（7.4实现） -->
            <div class="comment-empty">评论功能将在7.4实现</div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="bottom-bar">
          <div class="input-wrapper">
            <img v-if="userAvatar" :src="userAvatar" class="my-avatar" />
            <span v-else class="my-avatar-text">{{ myAvatarLetter }}</span>
            <input placeholder="说点什么..." readonly />
          </div>
          <div class="action-group">
            <div class="action-btn" :class="{ active: post.isLiked }">
              <el-icon :size="20">
                <svg viewBox="0 0 1024 1024"><path d="M512 896c-13.1 0-25.6-5.1-35-14.4L136.4 544.8C100.3 509.5 80 462.1 80 412.3 80 308.5 164.5 224 268.3 224c54.2 0 105.3 23.3 141 63.3L512 404l102.7-116.7C650.4 247.3 701.5 224 755.7 224 859.5 224 944 308.5 944 412.3c0 49.8-20.3 97.2-56.4 132.5L547 881.6c-9.4 9.3-21.9 14.4-35 14.4z" fill="currentColor"/></svg>
              </el-icon>
              <span>{{ post.likeCount || 0 }}</span>
            </div>
            <div class="action-btn" :class="{ active: post.isCollected }">
              <el-icon :size="20"><Star /></el-icon>
              <span>{{ post.collectCount || 0 }}</span>
            </div>
            <div class="action-btn">
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
      <!-- 关闭提示 -->
      <div class="zoom-close" @click.stop="zoomVisible = false">
        <el-icon :size="24"><Close /></el-icon>
      </div>
      <!-- 图片计数 -->
      <div v-if="post && post.images && post.images.length > 1" class="zoom-counter">
        {{ currentImageIndex + 1 }} / {{ post.images.length }}
      </div>
      <!-- 缩放比例提示 -->
      <div v-if="zoomScale !== 1" class="zoom-percent">{{ Math.round(zoomScale * 100) }}%</div>
      <!-- 大图 -->
      <img
        :src="post.images[currentImageIndex]"
        class="zoom-img"
        :style="{ transform: `scale(${zoomScale})` }"
        @click.stop
      />
      <!-- 左右箭头 -->
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Close, ArrowLeft, ArrowRight, Star, ChatDotRound, Share, Connection } from '@element-plus/icons-vue'
import { getPostDetail } from '@/api/forum'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  postId: { type: Number, required: true }
})
defineEmits(['close'])

const userStore = useUserStore()
const post = ref(null)
const loading = ref(true)
const currentImageIndex = ref(0)

const isSelf = computed(() => {
  if (!post.value || !userStore.userInfo?.id) return false
  return post.value.userId === userStore.userInfo.id
})

const zoomVisible = ref(false)
const zoomScale = ref(1)
const openZoom = () => { zoomScale.value = 1; zoomVisible.value = true }
// 滚轮缩放（0.5x ~ 5x）
const handleZoomWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.15 : 0.15
  zoomScale.value = Math.min(5, Math.max(0.5, zoomScale.value + delta))
}

const userAvatar = computed(() => userStore.userInfo?.avatar)
const myAvatarLetter = computed(() => (userStore.userInfo?.nickname || '?').charAt(0))

// 打开时锁定背景滚动
onMounted(async () => {
  document.body.style.overflow = 'hidden'
  try {
    const res = await getPostDetail(props.postId)
    post.value = res.data
  } catch (err) {
    console.error('加载帖子详情失败', err)
  } finally {
    loading.value = false
  }
})

// 关闭时恢复背景滚动
onUnmounted(() => {
  document.body.style.overflow = ''
})

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  let date
  if (Array.isArray(time)) {
    date = new Date(time[0], time[1] - 1, time[2], time[3] || 0, time[4] || 0)
  } else {
    date = new Date(time)
  }
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
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 2001;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba(255, 255, 255, 0.3); }
}

/* ══════ 详情卡片 ══════ */
.detail-card {
  display: flex;
  width: 80vw;
  max-width: 1100px;
  height: 80vh;
  max-height: 720px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

/* ── 左侧图片区 ── */
.detail-left {
  width: 55%;
  flex-shrink: 0;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.image-area {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  position: relative;

  .main-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    cursor: zoom-in;
  }
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
  z-index: 5;

  &:hover { background: rgba(0, 0, 0, 0.5); }
  &.left { left: 12px; }
  &.right { right: 12px; }
}

/* 右上角图片计数角标（小红书风格） */
.image-counter {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 13px;
  z-index: 5;
  backdrop-filter: blur(4px);
}

/* 底部圆点指示器 */
.dot-indicators {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background: #fff;
      width: 16px;
      border-radius: 3px;
    }
  }
}

/* ── 纯文字帖子封面 ── */
.text-cover-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
}

.text-cover-inner {
  text-align: center;
  max-width: 80%;

  .quote-mark {
    font-size: 72px;
    color: rgba(255, 255, 255, 0.25);
    line-height: 0.6;
    font-family: Georgia, serif;
    margin-bottom: 16px;
  }

  .text-cover-title {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    line-height: 1.5;
    margin: 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* ── 右侧内容区 ── */
.detail-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 作者栏 */
.author-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  flex-shrink: 0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-text {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f0f0f0;
    color: #999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
  }

  .nickname {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
}

.follow-btn {
  padding: 6px 20px;
  border-radius: 20px;
  border: none;
  background: #ff2442;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: #e6203c; }

  &.followed {
    background: #f5f5f5;
    color: #999;
  }
}

/* 可滚动内容区 */
.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }
}

.post-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  line-height: 1.5;
  margin: 0 0 10px;
}

.post-body {
  font-size: 14px;
  color: #333;
  line-height: 2;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tag-link {
    font-size: 14px;
    color: #4a90d9;
    cursor: pointer;
    &:hover { color: #2b6cb0; }
  }
}

.post-meta {
  margin-top: 12px;
  font-size: 12px;
  color: #bbb;
}

.recognition-link {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #e6a23c;
}

.comment-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 20px 0 16px;
}

.comment-header {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.comment-list {
  min-height: 80px;
}

.comment-empty {
  text-align: center;
  padding: 32px 0;
  color: #ccc;
  font-size: 13px;
}

/* ── 底部操作栏 ── */
.bottom-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 0 12px;
  height: 36px;

  .my-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .my-avatar-text {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ddd;
    color: #999;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: #333;
    &::placeholder { color: #bbb; }
  }
}

.action-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
  font-size: 13px;
  transition: color 0.15s;

  &:hover { color: #ff2442; }
  &.active { color: #ff2442; }
}

/* ══════ 图片放大查看器 ══════ */
.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.zoom-close {
  position: absolute;
  top: 20px;
  right: 20px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #fff; }
}

.zoom-counter {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.zoom-percent {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 13px;
  z-index: 5;
}

.zoom-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  cursor: default;
  border-radius: 4px;
  transition: transform 0.1s ease-out;
}

.zoom-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba(255, 255, 255, 0.25); }
  &.left { left: 24px; }
  &.right { right: 24px; }
}

/* ══════ 响应式 ══════ */
@media (max-width: 900px) {
  .detail-card {
    flex-direction: column;
    width: 92vw;
    height: 90vh;
    max-height: none;
  }
  .detail-left {
    width: 100%;
    height: 45%;
    flex-shrink: 0;
  }
}
</style>
