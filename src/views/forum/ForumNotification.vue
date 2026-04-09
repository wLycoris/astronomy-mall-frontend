<template>
  <!-- ═══════════════════════════════════════
       论坛通知中心 (7.8 补充)
       仅展示 module=forum 的通知
       - 全部 / 未读 / 已读 切换
       - 点击单条 → 详情弹窗 + 可跳转
       - 全部已读 / 单条删除
       ═══════════════════════════════════════ -->
  <div class="forum-notification-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon class="title-icon"><Bell /></el-icon>
          论坛通知
          <el-badge
              v-if="totalUnread > 0"
              :value="totalUnread"
              :max="99"
              type="danger"
              class="title-badge"
          />
        </h2>
        <p class="page-desc">点赞 · 评论 · 回复 · 收藏 · 关注 · 热门 全都在这里</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="readStatus" size="default" @change="handleStatusChange">
          <el-radio-button :label="''">全部</el-radio-button>
          <el-radio-button :label="0">未读</el-radio-button>
          <el-radio-button :label="1">已读</el-radio-button>
        </el-radio-group>
        <el-button
            type="primary"
            plain
            :disabled="totalUnread === 0"
            @click="handleMarkAllRead"
        >
          <el-icon><Check /></el-icon>
          全部已读
        </el-button>
      </div>
    </div>

    <!-- 通知列表 -->
    <div v-loading="loading" class="notification-list">
      <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ 'unread': item.isRead === 0, 'priority-high': item.priority === 1 }"
          @click="handleItemClick(item)"
      >
        <!-- 左侧类型图标 -->
        <div class="item-icon" :class="`icon-${item.type}`">
          <el-icon v-if="item.type === 'post_liked'"><StarFilled /></el-icon>
          <el-icon v-else-if="item.type === 'post_commented'"><ChatDotRound /></el-icon>
          <el-icon v-else-if="item.type === 'comment_replied'"><ChatLineRound /></el-icon>
          <el-icon v-else-if="item.type === 'post_collected'"><Collection /></el-icon>
          <el-icon v-else-if="item.type === 'user_followed'"><UserFilled /></el-icon>
          <el-icon v-else-if="item.type === 'post_trending'"><TrendCharts /></el-icon>
          <el-icon v-else-if="item.type === 'post_approved'"><CircleCheck /></el-icon>
          <el-icon v-else-if="item.type === 'post_rejected'"><CircleClose /></el-icon>
          <el-icon v-else-if="item.type === 'mentioned'"><ChatDotSquare /></el-icon>
          <el-icon v-else><Bell /></el-icon>
        </div>

        <!-- 中间内容 -->
        <div class="item-body">
          <div class="item-title">
            {{ item.title }}
            <el-tag v-if="item.priority === 1" type="warning" size="small" class="priority-tag">重要</el-tag>
          </div>
          <div class="item-content">{{ item.content }}</div>
          <div class="item-meta">
            <span class="item-time">{{ formatTime(item.createTime) }}</span>
            <span class="item-type-tag">{{ typeLabel(item.type) }}</span>
          </div>
        </div>

        <!-- 右侧未读点 + 删除按钮 -->
        <div class="item-right">
          <div v-if="item.isRead === 0" class="unread-dot"></div>
          <el-icon class="delete-icon" @click.stop="handleDelete(item)">
            <Delete />
          </el-icon>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
          v-if="!loading && notifications.length === 0"
          :description="emptyText"
          :image-size="120"
      >
        <template #image>
          <div class="empty-icon">🔔</div>
        </template>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-wrap">
      <el-pagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          background
          @current-change="fetchList"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
        v-model="detailVisible"
        :title="detailItem?.title || '通知详情'"
        width="560px"
        :close-on-click-modal="true"
        class="detail-dialog"
    >
      <div v-if="detailItem" class="detail-body">
        <div class="detail-meta">
          <el-tag type="success" size="small">论坛</el-tag>
          <el-tag size="small" effect="plain">{{ typeLabel(detailItem.type) }}</el-tag>
          <el-tag v-if="detailItem.priority === 1" type="warning" size="small">重要</el-tag>
          <span class="detail-time">{{ detailItem.createTime }}</span>
        </div>
        <div class="detail-content">{{ detailItem.content }}</div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
            v-if="detailItem && canJump(detailItem)"
            type="primary"
            @click="jumpFromDetail"
        >
          前往查看
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell, Check, Delete, StarFilled, ChatDotRound, ChatLineRound,
  Collection, UserFilled, TrendCharts, CircleCheck, CircleClose, ChatDotSquare
} from '@element-plus/icons-vue'
import {
  getNotificationList,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '@/api/notification'

const router = useRouter()

// ────────── 状态 ──────────
const loading = ref(false)
const notifications = ref([])
const readStatus = ref('')           // '' 全部 / 0 未读 / 1 已读
const pageNum = ref(1)
const pageSize = ref(15)
const total = ref(0)
const totalUnread = ref(0)

// 详情弹窗
const detailVisible = ref(false)
const detailItem = ref(null)

// ────────── 计算属性 ──────────
const emptyText = computed(() => {
  if (readStatus.value === 0) return '没有未读的论坛通知'
  if (readStatus.value === 1) return '没有已读的论坛通知'
  return '暂无论坛通知'
})

// ────────── 数据加载 ──────────
const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    // 只关心 forum 未读数
    totalUnread.value = Number(res.data?.forum || 0)
  } catch (e) {
    console.warn('[ForumNotification] 获取未读数失败:', e)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      module: 'forum',  // ★ 关键:固定只查论坛通知
      isRead: readStatus.value === '' ? null : readStatus.value
    }
    const res = await getNotificationList(params)
    notifications.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) {
    ElMessage.error('加载通知列表失败')
    console.error('[ForumNotification] 加载失败:', e)
  } finally {
    loading.value = false
  }
}

// ────────── 交互 ──────────
const handleStatusChange = () => {
  pageNum.value = 1
  fetchList()
}

const handleItemClick = async (item) => {
  // 1. 未读 → 标记已读
  if (item.isRead === 0) {
    try {
      await markAsRead({ ids: [item.id] })
      item.isRead = 1
      fetchUnreadCount()
    } catch (e) {
      console.warn('标记已读失败:', e)
    }
  }
  // 2. 弹出详情
  detailItem.value = item
  detailVisible.value = true
}

const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确认将所有论坛通知标记为已读?', '提示', {
      confirmButtonText: '全部已读',
      cancelButtonText: '取消',
      type: 'info'
    })
    await markAllAsRead('forum')
    ElMessage.success('已全部标记为已读')
    fetchList()
    fetchUnreadCount()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm('确认删除这条通知?', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteNotification(item.id)
    ElMessage.success('删除成功')
    fetchList()
    fetchUnreadCount()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// ────────── 跳转逻辑（复用 NotificationBell 的 buildTargetRoute） ──────────
const buildTargetRoute = (item) => {
  if (!item) return ''
  // 关注类 → 跳关注者主页
  if (item.type === 'user_followed' && item.relatedId) {
    return `/forum/user/${item.relatedId}`
  }
  // 帖子相关 → 统一跳 /forum/list?postId=xxx(ForumList 会自动打开详情对话框)
  if (item.relatedType === 'post' && item.relatedId) {
    return item.jumpUrl || `/forum/list?postId=${item.relatedId}`
  }
  return item.jumpUrl || ''
}

const canJump = (item) => !!buildTargetRoute(item)

const jumpFromDetail = () => {
  const target = buildTargetRoute(detailItem.value)
  if (!target) return
  detailVisible.value = false
  router.push(target)
}

// ────────── 工具函数 ──────────
const typeLabel = (type) => {
  const map = {
    post_liked:      '点赞',
    post_commented:  '评论',
    comment_replied: '回复',
    post_collected:  '收藏',
    user_followed:   '关注',
    post_trending:   '热门',
    post_approved:   '审核通过',
    post_rejected:   '审核拒绝',
    mentioned:       '@提及'
  }
  return map[type] || '通知'
}

const formatTime = (time) => {
  if (!time) return ''
  const now = new Date()
  const date = new Date(time)
  const diff = now - date
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}天前`
  return String(time).substring(0, 16)
}

// ────────── 初始化 ──────────
onMounted(() => {
  fetchUnreadCount()
  fetchList()
})
</script>

<style scoped>
.forum-notification-page {
  padding: 24px 32px;
  max-width: 900px;
  margin: 0 auto;
}

/* ───── 顶部 header ───── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}
.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 6px 0;
  font-size: 22px;
  color: #333;
  font-weight: 600;
}
.title-icon {
  font-size: 24px;
  color: #ff2442;
}
.title-badge {
  margin-left: 4px;
}
.page-desc {
  margin: 0;
  font-size: 13px;
  color: #999;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ───── 列表 ───── */
.notification-list {
  min-height: 300px;
}
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.notification-item:hover {
  background: #fafafa;
  border-color: #ddd;
  transform: translateX(2px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}
.notification-item.unread {
  background: #fff8f8;
  border-color: #ffe0e4;
}
.notification-item.unread:hover {
  background: #fff1f3;
}
.notification-item.priority-high {
  border-left: 3px solid #ff9900;
}

.item-icon {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #fff1f3;
  color: #ff2442;
}
.icon-post_liked     { background: #fff1f3; color: #ff2442; }
.icon-post_commented { background: #e8f4ff; color: #409eff; }
.icon-comment_replied{ background: #eef7ff; color: #409eff; }
.icon-post_collected { background: #fff8e6; color: #e6a23c; }
.icon-user_followed  { background: #f0f9eb; color: #67c23a; }
.icon-post_trending  { background: #fff1f3; color: #ff9900; }
.icon-post_approved  { background: #f0f9eb; color: #67c23a; }
.icon-post_rejected  { background: #fef0f0; color: #f56c6c; }
.icon-mentioned      { background: #f5f0ff; color: #9254de; }

.item-body {
  flex: 1;
  min-width: 0;
}
.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 6px;
}
.priority-tag {
  font-size: 11px;
}
.item-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #999;
}
.item-type-tag {
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 10px;
  color: #666;
}

.item-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff2442;
}
.delete-icon {
  color: #ccc;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}
.delete-icon:hover {
  color: #f56c6c;
  background: #fef0f0;
}

/* ───── 空状态 ───── */
.empty-icon {
  font-size: 64px;
  text-align: center;
  line-height: 120px;
}

/* ───── 分页 ───── */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* ───── 详情弹窗 ───── */
.detail-body {
  padding: 4px 0;
}
.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.detail-time {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}
.detail-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
