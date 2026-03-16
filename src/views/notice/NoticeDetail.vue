<template>
  <div class="notice-detail-page">

    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <!-- 顶部返回栏 -->
    <div class="back-bar">
      <button class="back-btn" @click="router.back()">
        <span class="back-arrow">←</span>
        <span>返回</span>
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <div class="skeleton-header"></div>
      <div class="skeleton-meta"></div>
      <div class="skeleton-divider"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line mid"></div>
    </div>

    <!-- 公告内容 -->
    <div v-else-if="detail" class="notice-card">

      <!-- 顶部色条（根据优先级变色） -->
      <div class="notice-top-bar" :class="topBarClass"></div>

      <div class="notice-body">

        <!-- 优先级徽章 + 标题 -->
        <div class="notice-header">
          <div class="priority-badge" :class="badgeClass">
            <span class="badge-icon">{{ badgeIcon }}</span>
            <span class="badge-text">{{ detail.priorityText || '普通公告' }}</span>
          </div>
          <h1 class="notice-title">{{ detail.title }}</h1>
        </div>

        <!-- 元信息栏 -->
        <div class="notice-meta">
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span class="meta-label">发布时间</span>
            <span class="meta-value">{{ formatTime(detail.createTime) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📢</span>
            <span class="meta-label">来源</span>
            <span class="meta-value">天文器材商城</span>
          </div>
        </div>

        <!-- 分割线 -->
        <div class="notice-divider">
          <span class="divider-dot"></span>
          <span class="divider-line"></span>
          <span class="divider-text">公告内容</span>
          <span class="divider-line"></span>
          <span class="divider-dot"></span>
        </div>

        <!-- 正文 -->
        <div class="notice-content">{{ detail.content }}</div>

        <!-- 底部签名 -->
        <div class="notice-footer">
          <span class="footer-seal">🌌 天文器材商城官方公告</span>
        </div>

      </div>
    </div>

    <!-- 不存在 -->
    <div v-else class="empty-box">
      <div class="empty-icon">🔭</div>
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

const badgeIcon = computed(() => {
  if (!detail.value) return '📢'
  const p = Number(detail.value.priority)
  return p === 2 ? '🔴' : p === 1 ? '🟡' : '🔵'
})

const formatTime = (time) => {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 16)
}
</script>

<style scoped>
/* ── 整体容器 ── */
.notice-detail-page {
  min-height: 100vh;
  background: #f0f4f8;
  padding: 24px 16px 60px;
  position: relative;
  overflow: hidden;
}

/* ── 背景装饰圆 ── */
.bg-decoration { position: fixed; inset: 0; pointer-events: none; z-index: 0; }

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
}

.bg-circle-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #3b82f6, transparent);
  top: -200px; right: -100px;
}

.bg-circle-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #8b5cf6, transparent);
  bottom: -100px; left: -100px;
}

.bg-circle-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #06b6d4, transparent);
  top: 40%; left: 40%;
}

/* ── 返回栏 ── */
.back-bar {
  max-width: 800px;
  margin: 0 auto 20px;
  position: relative;
  z-index: 1;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.back-btn:hover {
  background: #f8fafc;
  color: #1e40af;
  border-color: #bfdbfe;
  transform: translateX(-2px);
}

.back-arrow {
  font-size: 16px;
  line-height: 1;
}

/* ── 公告卡片 ── */
.notice-card {
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 顶部色条 */
.notice-top-bar {
  height: 5px;
}
.bar-normal  { background: linear-gradient(90deg, #3b82f6, #06b6d4); }
.bar-warning { background: linear-gradient(90deg, #f59e0b, #f97316); }
.bar-danger  { background: linear-gradient(90deg, #ef4444, #ec4899); }

/* 卡片内容区 */
.notice-body {
  padding: 36px 44px 40px;
}

/* ── 标题区 ── */
.notice-header {
  margin-bottom: 20px;
}

/* 优先级徽章 */
.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
}

.badge-normal  { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.badge-warning { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.badge-danger  { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }

.badge-icon { font-size: 13px; }

.notice-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.45;
  word-break: break-word;
  letter-spacing: -0.3px;
}

/* ── 元信息栏 ── */
.notice-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.meta-icon  { font-size: 14px; }
.meta-label { color: #94a3b8; }
.meta-value { color: #475569; font-weight: 500; }

/* ── 分割线 ── */
.notice-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.divider-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.divider-text {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  padding: 0 4px;
}

/* ── 正文 ── */
.notice-content {
  font-size: 15px;
  line-height: 1.9;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 20px 24px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 4px solid #e2e8f0;
  min-height: 80px;
}

/* ── 底部签名 ── */
.notice-footer {
  margin-top: 28px;
  text-align: right;
}

.footer-seal {
  display: inline-block;
  font-size: 12px;
  color: #94a3b8;
  padding: 6px 14px;
  border: 1px dashed #e2e8f0;
  border-radius: 20px;
  background: #fafafa;
}

/* ── 加载骨架 ── */
.loading-box {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  padding: 36px 44px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
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
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
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

/* ── 空状态 ── */
.empty-box {
  max-width: 400px;
  margin: 80px auto 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 15px;
  color: #94a3b8;
  margin-bottom: 24px;
}

.go-home-btn {
  padding: 10px 28px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.go-home-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.45);
}

/* ── 响应式 ── */
@media (max-width: 600px) {
  .notice-body   { padding: 24px 20px 28px; }
  .notice-title  { font-size: 20px; }
  .notice-meta   { gap: 12px; }
}
</style>