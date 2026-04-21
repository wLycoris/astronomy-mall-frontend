<template>
  <!-- 瀑布流帖子卡片（小红书web风格）-->
  <div class="post-card" @click="$emit('click', post)">
    <!-- 封面区域 -->
    <div class="card-cover">
      <!-- 有图片：显示封面图 -->
      <img v-if="post.coverImage" :src="post.coverImage" alt="" loading="lazy" />
      <!-- 无图片：标题生成文字封面（小红书风格） -->
      <div v-else class="text-cover" :class="coverTheme">
        <p class="text-cover-content">{{ post.title }}</p>
      </div>
      <!-- 多图角标 -->
      <span v-if="post.imageCount > 1" class="multi-badge">
        <el-icon :size="12"><PictureFilled /></el-icon>
        {{ post.imageCount }}
      </span>
    </div>

    <!-- 卡片内容 -->
    <div class="card-body">
      <h3 class="card-title">{{ post.title }}</h3>
      <div class="card-footer">
        <div class="author-info" @click.stop="goToProfile">
          <img v-if="post.authorAvatar" :src="post.authorAvatar" class="author-avatar" alt="" />
          <span v-else class="avatar-placeholder">{{ avatarLetter }}</span>
          <span class="author-name">{{ post.authorNickname || '匿名用户' }}</span>
        </div>
        <div class="like-info" :class="{ liked: post.isLiked }">
          <el-icon :size="14">
            <svg viewBox="0 0 1024 1024"><path d="M512 896c-13.1 0-25.6-5.1-35-14.4L136.4 544.8C100.3 509.5 80 462.1 80 412.3 80 308.5 164.5 224 268.3 224c54.2 0 105.3 23.3 141 63.3L512 404l102.7-116.7C650.4 247.3 701.5 224 755.7 224 859.5 224 944 308.5 944 412.3c0 49.8-20.3 97.2-56.4 132.5L547 881.6c-9.4 9.3-21.9 14.4-35 14.4z" fill="currentColor"/></svg>
          </el-icon>
          <span>{{ formatCount(post.likeCount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { PictureFilled } from '@element-plus/icons-vue'

const props = defineProps({
  post: { type: Object, required: true }
})

defineEmits(['click'])

const router = useRouter()

// 点击作者头像/昵称 → 跳转用户主页
const goToProfile = () => {
  if (props.post.userId) {
    router.push(`/forum/user/${props.post.userId}`)
  }
}

const avatarLetter = computed(() => (props.post.authorNickname || '?').charAt(0))

// 根据帖子id决定文字封面配色主题（伪随机）
const coverTheme = computed(() => {
  const themes = ['theme-purple', 'theme-blue', 'theme-teal', 'theme-orange', 'theme-pink', 'theme-dark']
  const idx = (props.post.id || 0) % themes.length
  return themes[idx]
})

const formatCount = (count) => {
  if (!count || count === 0) return ''
  if (count >= 10000) return (count / 10000).toFixed(1) + 'w'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k'
  return String(count)
}
</script>

<style lang="scss" scoped>
.post-card {
  break-inside: avoid;
  margin-bottom: 18px;
  background: var(--forum-card, #fffdfa);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(16, 23, 34, 0.09);
  box-shadow: 0 8px 22px rgba(16, 23, 34, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(200, 155, 83, 0.38);
    box-shadow: 0 16px 32px rgba(16, 23, 34, 0.12);
  }
}

/* ── 封面 ── */
.card-cover {
  position: relative;
  width: 100%;
  overflow: hidden;

  img {
    width: 100%;
    display: block;
    /* 限制图片高度范围，超出裁剪，和小红书一致 */
    min-height: 120px;
    max-height: 360px;
    object-fit: cover;
    background: #e8e2d8;
  }
}

/* 文字封面（无图帖子，小红书风格：浅底深字） */
.text-cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
  position: relative;

  /* 左上角引号装饰 */
  &::before {
    content: '\201C';
    position: absolute;
    top: 16px;
    left: 20px;
    font-size: 48px;
    font-family: Georgia, serif;
    line-height: 1;
    opacity: 0.12;
  }

  .text-cover-content {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.7;
    text-align: left;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }

  /* 无图帖子做成观测手札封面，保持文字清楚 */
  &.theme-purple {
    background: linear-gradient(135deg, #efe8d8, #f8f4ea);
    &::before, .text-cover-content { color: #5d4526; }
  }
  &.theme-blue {
    background: linear-gradient(135deg, #dfeaf0, #f5f8f8);
    &::before, .text-cover-content { color: #1d4d6b; }
  }
  &.theme-teal {
    background: linear-gradient(135deg, #e3efe9, #faf7ef);
    &::before, .text-cover-content { color: #205548; }
  }
  &.theme-orange {
    background: linear-gradient(135deg, #f4e3cc, #fbf5ec);
    &::before, .text-cover-content { color: #7a4c1f; }
  }
  &.theme-pink {
    background: linear-gradient(135deg, #eee2e3, #fbf4f1);
    &::before, .text-cover-content { color: #7d3443; }
  }
  &.theme-dark {
    background: linear-gradient(135deg, #151f2e, #26364a);
    &::before, .text-cover-content { color: #f6ead4; }
  }
}

/* 多图角标 */
.multi-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #fff;
  background: rgba(16, 23, 34, 0.68);
  backdrop-filter: blur(4px);
}

/* ── 卡片内容 ── */
.card-body {
  padding: 10px 12px 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--forum-ink, #101722);
  line-height: 1.5;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;

  .author-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .avatar-placeholder {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f1eadf;
    color: #796b5b;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .author-name {
    font-size: 12px;
    color: #7a8494;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.like-info {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #7a8494;
  font-size: 12px;
  flex-shrink: 0;

  &.liked { color: var(--forum-red, #d84b5f); }
}
</style>
