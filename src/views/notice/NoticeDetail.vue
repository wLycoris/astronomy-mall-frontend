<template>
  <div class="notice-detail-page">
    <div class="back-bar">
      <button class="back-btn" @click="router.back()">
        <span class="back-arrow">←</span>
        <span>返回</span>
      </button>
      <span class="page-kicker">NOTICE BOARD</span>
    </div>

    <div v-if="loading" class="loading-box">
      <div class="skeleton-header"></div>
      <div class="skeleton-meta"></div>
      <div class="skeleton-divider"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line mid"></div>
    </div>

    <article v-else-if="detail" class="notice-card" :class="topBarClass">
      <header class="notice-header">
        <div class="priority-badge" :class="badgeClass">
          <span class="badge-dot"></span>
          <span>{{ detail.priorityText || '普通公告' }}</span>
        </div>
        <div class="notice-title-wrap">
          <h1 class="notice-title">{{ detail.title }}</h1>
        </div>
      </header>

      <div class="notice-meta">
        <div class="meta-item">
          <span class="meta-label">发布时间</span>
          <span class="meta-value">{{ formatTime(detail.createTime) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">来源</span>
          <span class="meta-value">天文器材商城</span>
        </div>
      </div>

      <div class="notice-content-wrap">
        <div class="content-label">公告内容</div>
        <div class="notice-content">{{ detail.content }}</div>
      </div>

      <footer class="notice-footer">
        <span>天文器材商城官方公告</span>
      </footer>
    </article>

    <div v-else class="empty-box">
      <div class="empty-mark">NOTICE</div>
      <p class="empty-text">公告不存在或已被删除</p>
      <button class="go-home-btn" @click="router.push('/home')">返回首页</button>
    </div>

  </div>
</template>

<script setup>
/**
 * 用户端公告详情页
 * 路由: /notice/detail?id={announcementGroupId}
 * 文件路径: src/views/notice/NoticeDetail.vue
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const route  = useRoute()
const router = useRouter()

const loading = ref(false)
const detail  = ref(null)

onMounted(() => {
  const id = route.query.id
  if (!id) { detail.value = null; return }
  fetchDetail(id)
})

const fetchDetail = async (id) => {
  loading.value = true
  try {
    const res = await request({ url: `/notification/announcement/${id}`, method: 'get' })
    const data = res.data || null
    if (data) {
      // 补充 priorityText（后端返回的是数字）
      const p = Number(data.priority)
      data.priorityText = p === 2 ? '紧急公告' : p === 1 ? '重要公告' : '普通公告'
    }
    detail.value = data
  } catch (error) {
    console.error('获取公告详情失败:', error)
    ElMessage.error('获取公告内容失败')
    detail.value = null
  } finally {
    loading.value = false
  }
}

// 根据优先级决定样式
const topBarClass = computed(() => {
  if (!detail.value) return ''
  const p = Number(detail.value.priority)
  return p === 2 ? 'bar-danger' : p === 1 ? 'bar-warning' : 'bar-normal'
})

const badgeClass = computed(() => {
  if (!detail.value) return ''
  const p = Number(detail.value.priority)
  return p === 2 ? 'badge-danger' : p === 1 ? 'badge-warning' : 'badge-normal'
})

const formatTime = (time) => {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 16)
}
</script>

<style scoped>
.notice-detail-page {
  min-height: 100vh;
  padding: 26px 18px 72px;
  position: relative;
  overflow-x: hidden;
  background:
    linear-gradient(rgba(17, 24, 39, .028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(17, 24, 39, .026) 1px, transparent 1px),
    #f7f4ec;
  background-size: 28px 28px;
  color: #172033;
}

.back-bar {
  max-width: 860px;
  margin: 0 auto 18px;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  background: #fffdfa;
  border: 1px solid #e6ddcf;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  color: #172033;
  transition: all 0.2s;
  box-shadow: 0 8px 20px rgba(35, 30, 22, .06);
}

.back-btn:hover {
  background: #111827;
  color: #fffdfa;
  border-color: #111827;
}

.back-arrow {
  font-size: 16px;
  line-height: 1;
}

.page-kicker {
  color: #9a6b36;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.notice-card {
  max-width: 860px;
  margin: 0 auto;
  background: #fffdfa;
  border: 1px solid #e6ddcf;
  border-radius: 8px;
  box-shadow: 0 20px 48px rgba(35, 30, 22, .10);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.notice-card::before {
  content: '';
  display: block;
  height: 5px;
}

.bar-normal::before { background: #8a5f2e; }
.bar-warning::before { background: #c28a2e; }
.bar-danger::before { background: #9f2f2f; }

.notice-header {
  padding: 38px 46px 20px;
}

.notice-title-wrap {
  margin-top: 14px;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .8px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.badge-normal  { background: #f7f0e5; color: #8a5f2e; border: 1px solid #e6d7c1; }
.badge-warning { background: #fff4d6; color: #9a6b10; border: 1px solid #ecd293; }
.badge-danger  { background: #fff0ee; color: #9f2f2f; border: 1px solid #e3b8b0; }

.notice-title {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #111827;
  line-height: 1.45;
  word-break: break-word;
}

.notice-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0 46px 26px;
  border-bottom: 1px solid #ebe3d7;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ebe3d7;
  border-radius: 4px;
  background: #faf6ef;
  font-size: 13px;
}

.meta-label { color: #8b95a5; }
.meta-value { color: #172033; font-weight: 800; }

.notice-content-wrap {
  padding: 30px 46px 34px;
}

.content-label {
  margin-bottom: 14px;
  color: #9a6b36;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.6px;
}

.notice-content {
  font-size: 15px;
  line-height: 2;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 22px 24px;
  background: #f8f4ec;
  border: 1px solid #ebe3d7;
  border-left: 4px solid #c7a572;
  border-radius: 6px;
  min-height: 80px;
}

.notice-footer {
  padding: 18px 46px 34px;
  text-align: right;
}

.notice-footer span {
  display: inline-block;
  font-size: 12px;
  color: #8b95a5;
  padding: 7px 12px;
  border: 1px dashed #d8caba;
  border-radius: 4px;
  background: #fffdfa;
}

.loading-box {
  max-width: 860px;
  margin: 0 auto;
  background: #fffdfa;
  border: 1px solid #e6ddcf;
  border-radius: 8px;
  padding: 36px 44px;
  box-shadow: 0 18px 42px rgba(35, 30, 22, .08);
  position: relative;
  z-index: 1;
}

@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.skeleton-header,
.skeleton-meta,
.skeleton-divider,
.skeleton-line {
  border-radius: 6px;
  background: linear-gradient(90deg, #f6efe4 25%, #eadfce 50%, #f6efe4 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite;
  margin-bottom: 14px;
}

.skeleton-header  { height: 28px; width: 60%; }
.skeleton-meta    { height: 16px; width: 40%; margin-bottom: 24px; }
.skeleton-divider { height: 1px;  width: 100%; margin-bottom: 20px; }
.skeleton-line    { height: 15px; width: 100%; }
.skeleton-line.short { width: 45%; }
.skeleton-line.mid   { width: 70%; }

.empty-box {
  max-width: 420px;
  margin: 80px auto 0;
  text-align: center;
  position: relative;
  z-index: 1;
  padding: 44px 28px;
  border: 1px solid #e6ddcf;
  border-radius: 8px;
  background: #fffdfa;
}

.empty-mark {
  width: 104px;
  height: 104px;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle at 42% 34%, #fff7e0, #f3e9cf 58%, #d7c192 100%);
  color: #111827;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.8px;
}

.empty-text {
  font-size: 15px;
  color: #667085;
  margin-bottom: 24px;
}

.go-home-btn {
  padding: 10px 28px;
  background: #111827;
  color: #fffdfa;
  border: 1px solid #111827;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.go-home-btn:hover {
  background: #9a6b36;
  border-color: #9a6b36;
}

@media (max-width: 600px) {
  .back-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .notice-header,
  .notice-meta,
  .notice-content-wrap,
  .notice-footer {
    padding-left: 22px;
    padding-right: 22px;
  }

  .notice-title { font-size: 22px; }
  .notice-meta { gap: 10px; }
}
</style>
