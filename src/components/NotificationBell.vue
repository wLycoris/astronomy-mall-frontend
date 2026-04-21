<template>
  <div class="notification-bell">
    <!-- 通知图标(带未读数) -->
    <el-badge
        :value="totalUnread"
        :hidden="totalUnread === 0"
        :max="99"
        class="bell-badge"
    >
      <el-icon class="bell-icon" @click="showDrawer">
        <Bell />
      </el-icon>
    </el-badge>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 编辑级暗色 · 消息抽屉                                            -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <el-drawer
        v-model="visible"
        size="440px"
        direction="rtl"
        :append-to-body="true"
        :with-header="false"
        :modal="true"
        :modal-class="'notif-modal'"
        class="notif-drawer"
    >
      <!-- 抽屉顶部 · 标题 + 英文 kicker -->
      <div class="notif-head">
        <div class="notif-head__left">
          <div class="notif-kicker">— INBOX</div>
          <div class="notif-title">消息通知</div>
        </div>
        <el-icon class="notif-close" @click="visible = false"><Close /></el-icon>
      </div>

      <!-- 模块分类 Tab -->
      <div class="notif-tabs">
        <div
            v-for="m in moduleTabs"
            :key="m.key"
            class="notif-tab"
            :class="{ active: activeModule === m.key }"
            @click="activeModule = m.key; handleModuleChange()"
        >
          <span class="t-label">{{ m.label }}</span>
          <span
              v-if="(m.key === 'all' ? totalUnread : unreadCount[m.key]) > 0"
              class="t-count"
          >
            {{ m.key === 'all' ? totalUnread : unreadCount[m.key] }}
          </span>
        </div>
      </div>

      <!-- 操作栏 · 过滤 + 全部已读 -->
      <div class="notif-toolbar">
        <div class="filter-pills">
          <div
              v-for="f in filterOptions"
              :key="String(f.value)"
              class="f-pill"
              :class="{ active: readStatus === f.value }"
              @click="readStatus = f.value; fetchList()"
          >{{ f.label }}</div>
        </div>
        <div class="mark-all" @click="handleMarkAllRead">全部已读</div>
      </div>

      <!-- 通知列表 -->
      <el-scrollbar class="notif-scroll" v-loading="loading">
        <div class="notif-list">
          <div
              v-for="item in notifications"
              :key="item.id"
              class="notif-item"
              :class="{
                unread: item.isRead === 0,
                'p-1': item.priority === 1,
                'p-2': item.priority === 2
              }"
              @click="handleItemClick(item)"
          >
            <!-- 模块图标 -->
            <div class="n-icon" :class="`mod-${item.module}`">
              <el-icon v-if="item.module === 'mall'"><ShoppingCart /></el-icon>
              <el-icon v-else-if="item.module === 'forum'"><ChatDotRound /></el-icon>
              <el-icon v-else-if="item.module === 'course'"><Reading /></el-icon>
              <el-icon v-else-if="item.module === 'location'"><Location /></el-icon>
              <el-icon v-else-if="item.module === 'recommend'"><StarFilled /></el-icon>
              <el-icon v-else-if="item.module === 'ai'"><Cpu /></el-icon>
              <el-icon v-else><Bell /></el-icon>
            </div>

            <!-- 通知内容 -->
            <div class="n-body">
              <div class="n-title">{{ item.title }}</div>
              <div class="n-desc">{{ item.content }}</div>
              <div class="n-time">{{ formatTime(item.createTime) }}</div>
            </div>

            <!-- 未读指示点 -->
            <div v-if="item.isRead === 0" class="n-dot"></div>

            <!-- 删除按钮 -->
            <el-icon class="n-del" @click.stop="handleDelete(item.id)">
              <Delete />
            </el-icon>
          </div>

          <!-- 空状态 -->
          <div v-if="!loading && notifications.length === 0" class="notif-empty">
            <div class="empty-line">— 暂无消息 —</div>
            <div class="empty-sub">NOTHING NEW · 当有更新时，你会第一时间知晓</div>
          </div>
        </div>
      </el-scrollbar>

      <!-- 分页 -->
      <div class="notif-footer" v-if="total > 0">
        <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            small
            background
            @current-change="fetchList"
        />
      </div>
    </el-drawer>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 编辑级暗色 · 通知详情对话框                                      -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <el-dialog
        v-model="detailVisible"
        width="520px"
        :close-on-click-modal="true"
        :show-close="false"
        append-to-body
        class="notif-detail-dialog"
        :modal-class="'notif-modal'"
    >
      <div v-if="detailItem" class="dt-body">
        <div class="dt-head">
          <div class="dt-kicker">— NOTICE</div>
          <div class="dt-title">{{ detailItem.title || '通知详情' }}</div>
        </div>

        <!-- meta 行 -->
        <div class="dt-meta">
          <span class="dt-tag mod-tag" :class="`mod-${detailItem.module}`">
            {{ moduleLabel(detailItem.module) }}
          </span>
          <span v-if="detailItem.priority === 1" class="dt-tag pri-tag warn">重要</span>
          <span v-if="detailItem.priority === 2" class="dt-tag pri-tag crit">紧急</span>
          <span class="dt-time">{{ detailItem.createTime }}</span>
        </div>

        <!-- 正文 -->
        <div class="dt-content">{{ detailItem.content }}</div>

        <!-- 操作区 -->
        <div class="dt-actions">
          <button class="bracket-btn ghost" @click="detailVisible = false">
            <span class="b-inner">关闭</span>
          </button>
          <button
              v-if="canJump(detailItem)"
              class="bracket-btn primary"
              @click="jumpFromDetail"
          >
            <span class="b-inner">前往查看 →</span>
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  ShoppingCart,
  ChatDotRound,
  Reading,
  Location,
  StarFilled,
  Cpu,
  Delete,
  Close
} from '@element-plus/icons-vue'
import {
  getNotificationList,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '@/api/notification'

const router = useRouter()

// ── 数据 ──────────────────────────────────────────────
const visible = ref(false)
const loading = ref(false)
const activeModule = ref('all')
const readStatus = ref('')
const notifications = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailVisible = ref(false)
const detailItem = ref(null)

const unreadCount = reactive({
  mall: 0, forum: 0, course: 0, location: 0,
  recommend: 0, ai: 0, system: 0
})
const totalUnread = ref(0)

// ── Tab 与过滤 ─────────────────────────────────────────
const moduleTabs = [
  { key: 'all',       label: '全部' },
  { key: 'mall',      label: '商城' },
  { key: 'forum',     label: '论坛' },
  { key: 'course',    label: '课程' },
  { key: 'recommend', label: '推荐' },
  { key: 'system',    label: '系统' }
]
const filterOptions = [
  { value: '', label: '全部' },
  { value: 0,  label: '未读' },
  { value: 1,  label: '已读' }
]

// ── 交互 ──────────────────────────────────────────────
const showDrawer = () => {
  visible.value = true
  fetchList()
}

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    const data = res.data || {}
    totalUnread.value = Number(data.total || 0)
    unreadCount.mall      = Number(data.mall || 0)
    unreadCount.forum     = Number(data.forum || 0)
    unreadCount.course    = Number(data.course || 0)
    unreadCount.location  = Number(data.location || 0)
    unreadCount.recommend = Number(data.recommend || 0)
    unreadCount.ai        = Number(data.ai || 0)
    unreadCount.system    = Number(data.system || 0)
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      module: activeModule.value === 'all' ? null : activeModule.value,
      isRead: readStatus.value === '' ? null : readStatus.value
    }
    const res = await getNotificationList(params)
    notifications.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

const handleModuleChange = () => {
  pageNum.value = 1
  fetchList()
}

const handleItemClick = async (item) => {
  if (item.isRead === 0) {
    try {
      await markAsRead({ ids: [item.id] })
      item.isRead = 1
      fetchUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
  detailItem.value = item
  detailVisible.value = true
}

const buildTargetRoute = (item) => {
  if (!item) return ''
  if (item.relatedType && item.relatedId) {
    switch (item.relatedType) {
      case 'order':   return `/order/detail/${item.relatedId}`
      case 'product': return `/product/${item.relatedId}`
      case 'notice':  return `/notice/detail/${item.relatedId}`
      case 'post':    return item.jumpUrl || `/forum/list?postId=${item.relatedId}`
      case 'course':  return `/course/${item.relatedId}`
      default:        return item.jumpUrl || ''
    }
  }
  return item.jumpUrl || ''
}
const canJump = (item) => !!buildTargetRoute(item)
const jumpFromDetail = () => {
  const target = buildTargetRoute(detailItem.value)
  if (!target) return
  detailVisible.value = false
  visible.value = false
  router.push(target)
}

const moduleLabel = (m) => {
  const map = {
    mall: '商城', forum: '论坛', course: '课程',
    location: '观测点', recommend: '推荐', ai: 'AI识别', system: '系统'
  }
  return map[m] || '通知'
}

const handleMarkAllRead = async () => {
  try {
    const module = activeModule.value === 'all' ? null : activeModule.value
    await markAllAsRead(module)
    ElMessage.success('已全部标记为已读')
    fetchList()
    fetchUnreadCount()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('此操作不可撤销。确定要删除这条通知吗？', '— CONFIRM', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'notif-confirm-box',
      customStyle: {},
      showClose: false,
      roundButton: false,
      draggable: false,
      buttonSize: 'default',
      center: false,
      modalClass: 'notif-modal',
      appendTo: 'body'
    })
    await deleteNotification(id)
    ElMessage.success('删除成功')
    fetchList()
    fetchUnreadCount()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const formatTime = (time) => {
  const now = new Date()
  const date = new Date(time)
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return time.substring(0, 16)
}

let timer = null
onMounted(() => {
  fetchUnreadCount()
  timer = setInterval(fetchUnreadCount, 30000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
// ── 编辑级暗色 design tokens（与 Home.vue 对齐）─────────
$bg-0:#000;
$bg-1:#070709;
$bg-2:#0e0e12;
$bg-3:#14141a;
$line:rgba(255,255,255,0.10);
$line-2:rgba(255,255,255,0.18);
$tx-1:#f4f4f4;
$tx-2:rgba(255,255,255,0.72);
$tx-3:rgba(255,255,255,0.45);
$tx-4:rgba(255,255,255,0.25);
$accent:#c7a572;
$serif:'Cormorant Garamond','Playfair Display','Noto Serif SC','Songti SC','宋体',serif;
$mono:'SF Mono','JetBrains Mono','Menlo',monospace;

// ── Bell 触发按钮 ────────────────────────────────────
.notification-bell {
  display: inline-block;
  margin-right: 20px;
  line-height: 1;
}
.bell-icon {
  font-size: 20px;
  cursor: pointer;
  color: $tx-2;
  transition: color 0.25s ease, transform 0.25s ease;
  &:hover {
    color: $accent;
    transform: rotate(-8deg);
  }
}
:deep(.bell-badge) {
  .el-badge__content {
    background: $accent;
    border: 1px solid $bg-0;
    color: $bg-0;
    font-family: $mono;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.5px;
  }
}
</style>

<!-- ══════════════════════════════════════════════════════════════
     全局样式：el-drawer / el-dialog 通过 teleport 渲染到 body,
     scoped 无法命中，因此使用非 scoped 全局块
═══════════════════════════════════════════════════════════════ -->
<style lang="scss">
$bg-0:#000;
$bg-1:#070709;
$bg-2:#0e0e12;
$bg-3:#14141a;
$line:rgba(255,255,255,0.10);
$line-2:rgba(255,255,255,0.18);
$tx-1:#f4f4f4;
$tx-2:rgba(255,255,255,0.72);
$tx-3:rgba(255,255,255,0.45);
$tx-4:rgba(255,255,255,0.25);
$accent:#c7a572;
$serif:'Cormorant Garamond','Playfair Display','Noto Serif SC','Songti SC','宋体',serif;
$mono:'SF Mono','JetBrains Mono','Menlo',monospace;

// ── Modal 层 ────────────────────────────────────────
.notif-modal {
  background: rgba(0,0,0,0.72) !important;
  backdrop-filter: blur(8px);
}

// ── 抽屉主体 ────────────────────────────────────────
.notif-drawer {
  background: $bg-1 !important;
  color: $tx-1;
  border-left: 1px solid $line;
  box-shadow: -30px 0 80px rgba(0,0,0,0.6) !important;

  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: $bg-1;
  }
}

// ── 顶部标题 ────────────────────────────────────────
.notif-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 32px 28px 20px;
  border-bottom: 1px solid $line;
  &__left { display: flex; flex-direction: column; gap: 6px; }
}
.notif-kicker {
  font-family: $mono;
  font-size: 11px;
  letter-spacing: 2.5px;
  color: $accent;
  text-transform: uppercase;
}
.notif-title {
  font-family: $serif;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: 4px;
  color: $tx-1;
}
.notif-close {
  font-size: 20px;
  color: $tx-3;
  cursor: pointer;
  transition: color 0.2s, transform 0.3s;
  &:hover { color: $accent; transform: rotate(90deg); }
}

// ── Tab 区 ──────────────────────────────────────────
.notif-tabs {
  display: flex;
  gap: 4px;
  padding: 14px 20px 0;
  border-bottom: 1px solid $line;
  flex-wrap: wrap;
  .notif-tab {
    position: relative;
    padding: 10px 12px 14px;
    font-size: 13px;
    letter-spacing: 1px;
    color: $tx-3;
    cursor: pointer;
    transition: color 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    &:hover { color: $tx-1; }
    &.active {
      color: $tx-1;
      &::after {
        content: '';
        position: absolute;
        left: 12px; right: 12px; bottom: -1px;
        height: 1px;
        background: $accent;
      }
    }
    .t-count {
      font-family: $mono;
      font-size: 10px;
      letter-spacing: 0.5px;
      padding: 1px 6px;
      border: 1px solid $accent;
      color: $accent;
      border-radius: 2px;
      min-width: 18px;
      text-align: center;
      line-height: 1.4;
    }
  }
}

// ── 操作栏 ───────────────────────────────────────────
.notif-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  border-bottom: 1px solid $line;
  .filter-pills {
    display: flex;
    gap: 6px;
    .f-pill {
      font-family: $mono;
      font-size: 11px;
      letter-spacing: 1px;
      padding: 4px 10px;
      border: 1px solid $line-2;
      color: $tx-3;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      &:hover { color: $tx-1; border-color: $tx-2; }
      &.active {
        color: $bg-0;
        background: $accent;
        border-color: $accent;
      }
    }
  }
  .mark-all {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 1.2px;
    color: $tx-3;
    cursor: pointer;
    text-transform: uppercase;
    transition: color 0.2s;
    &:hover { color: $accent; }
  }
}

// ── 列表区 ──────────────────────────────────────────
.notif-scroll {
  flex: 1;
  overflow-y: auto;
  .el-scrollbar__wrap { background: $bg-1; }
  .el-scrollbar__thumb { background: rgba(255,255,255,0.18); }
}
.notif-list {
  padding: 8px 0;
  min-height: 200px;
}

.notif-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 28px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: background 0.25s ease, padding 0.25s ease;
  &:hover {
    background: $bg-2;
    .n-del { opacity: 1; }
  }
  &.unread { background: rgba(199,165,114,0.04); }
  &.p-1 { border-left: 2px solid #d4a656; padding-left: 26px; }
  &.p-2 { border-left: 2px solid #d45656; padding-left: 26px; }
}

.n-icon {
  width: 36px; height: 36px;
  border: 1px solid $line-2;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: $tx-2;
  font-size: 16px;
  flex-shrink: 0;
  background: $bg-2;
  &.mod-mall      { color: #9cc4ff; border-color: rgba(156,196,255,0.3); }
  &.mod-forum     { color: #a4e2b8; border-color: rgba(164,226,184,0.3); }
  &.mod-course    { color: #ffb3b3; border-color: rgba(255,179,179,0.3); }
  &.mod-location  { color: $tx-2;   border-color: $line-2; }
  &.mod-recommend { color: $accent; border-color: rgba(199,165,114,0.35); }
  &.mod-ai        { color: #c6a8ff; border-color: rgba(198,168,255,0.3); }
  &.mod-system    { color: $accent; border-color: rgba(199,165,114,0.35); }
}

.n-body {
  flex: 1;
  min-width: 0;
  .n-title {
    font-family: $serif;
    font-size: 15px;
    color: $tx-1;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .n-desc {
    font-size: 12.5px;
    line-height: 1.55;
    color: $tx-3;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
  }
  .n-time {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 0.5px;
    color: $tx-4;
    text-transform: uppercase;
  }
}

.n-dot {
  position: absolute;
  top: 22px;
  right: 40px;
  width: 6px; height: 6px;
  background: $accent;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(199,165,114,0.6);
}
.n-del {
  position: absolute;
  top: 22px;
  right: 14px;
  font-size: 14px;
  color: $tx-4;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  cursor: pointer;
  &:hover { color: #ff8585; }
}

// ── 空状态 ───────────────────────────────────────────
.notif-empty {
  padding: 60px 40px;
  text-align: center;
  .empty-line {
    font-family: $serif;
    font-style: italic;
    font-size: 20px;
    color: $tx-3;
    letter-spacing: 3px;
    margin-bottom: 12px;
  }
  .empty-sub {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 1.5px;
    color: $tx-4;
    text-transform: uppercase;
  }
}

// ── 底部分页 ─────────────────────────────────────────
.notif-footer {
  padding: 14px 20px;
  border-top: 1px solid $line;
  display: flex;
  justify-content: center;

  .el-pagination {
    --el-pagination-bg-color: transparent;
    --el-pagination-button-bg-color: transparent;
    --el-pagination-hover-color: #{$accent};
    --el-pagination-button-color: #{$tx-2};

    button, .el-pager li {
      background: transparent !important;
      color: $tx-2 !important;
      border: 1px solid $line !important;
      font-family: $mono;
      &:hover { color: $accent !important; border-color: $accent !important; }
      &.is-active { background: $accent !important; color: $bg-0 !important; border-color: $accent !important; }
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 详情 Dialog
// ══════════════════════════════════════════════════════════════
.notif-detail-dialog.el-dialog {
  background: $bg-1 !important;
  border: 1px solid $line !important;
  box-shadow: 0 30px 80px rgba(0,0,0,0.8) !important;
  border-radius: 0 !important;

  .el-dialog__header {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
  }
  .el-dialog__body {
    padding: 0 !important;
    color: $tx-1;
  }
}

.dt-body { padding: 36px 40px 32px; }

.dt-head {
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid $line;
}
.dt-kicker {
  font-family: $mono;
  font-size: 11px;
  letter-spacing: 2.5px;
  color: $accent;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.dt-title {
  font-family: $serif;
  font-size: 22px;
  font-weight: 500;
  color: $tx-1;
  letter-spacing: 1.5px;
  line-height: 1.4;
  word-break: break-word;
}

.dt-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}
.dt-tag {
  display: inline-block;
  font-family: $mono;
  font-size: 10.5px;
  letter-spacing: 1.2px;
  padding: 3px 10px;
  border: 1px solid currentColor;
  text-transform: uppercase;
  line-height: 1.5;
  &.mod-tag.mod-mall      { color: #9cc4ff; }
  &.mod-tag.mod-forum     { color: #a4e2b8; }
  &.mod-tag.mod-course    { color: #ffb3b3; }
  &.mod-tag.mod-location  { color: $tx-2; }
  &.mod-tag.mod-recommend { color: $accent; }
  &.mod-tag.mod-ai        { color: #c6a8ff; }
  &.mod-tag.mod-system    { color: $accent; }
  &.pri-tag.warn { color: #d4a656; }
  &.pri-tag.crit { color: #ff7a7a; }
}
.dt-time {
  font-family: $mono;
  font-size: 11px;
  letter-spacing: 0.8px;
  color: $tx-4;
  margin-left: auto;
}

.dt-content {
  font-family: $serif;
  font-size: 15px;
  line-height: 1.85;
  color: $tx-2;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 18px 20px;
  background: $bg-2;
  border: 1px solid $line;
  max-height: 320px;
  overflow-y: auto;
  letter-spacing: 0.3px;
}

.dt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 24px;
}

// bracket 按钮（与 Home.vue 风格一致的简化版）
.bracket-btn {
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: $mono;
  font-size: 12px;
  letter-spacing: 2px;
  color: $tx-1;
  padding: 10px 22px;
  text-transform: uppercase;
  transition: all 0.25s ease;
  .b-inner { position: relative; z-index: 2; }
  &::before, &::after {
    content: '';
    position: absolute;
    width: 10px; height: 10px;
    border: 1px solid $tx-2;
    transition: all 0.25s ease;
  }
  &::before { top: 0; left: 0; border-right: none; border-bottom: none; }
  &::after  { bottom: 0; right: 0; border-left: none; border-top: none; }
  &:hover {
    color: $accent;
    &::before, &::after { border-color: $accent; width: 14px; height: 14px; }
  }
  &.primary {
    color: $accent;
    &::before, &::after { border-color: $accent; }
    &:hover { color: $tx-1; background: rgba(199,165,114,0.08); &::before,&::after { border-color: $tx-1; } }
  }
  &.ghost { color: $tx-3; &::before, &::after { border-color: $tx-4; } }
}

// ══════════════════════════════════════════════════════════════
// ElMessageBox.confirm 自定义样式（删除通知确认框）
// ══════════════════════════════════════════════════════════════
.notif-confirm-box.el-message-box {
  background: $bg-1 !important;
  border: 1px solid $line !important;
  border-radius: 0 !important;
  box-shadow: 0 30px 80px rgba(0,0,0,0.8) !important;
  padding: 32px 36px 28px !important;
  width: 440px !important;

  .el-message-box__header {
    padding: 0 0 18px !important;
    margin: 0 0 20px !important;
    border-bottom: 1px solid $line;
  }
  .el-message-box__title {
    font-family: $mono;
    font-size: 12px !important;
    letter-spacing: 2.5px;
    color: $accent !important;
    text-transform: uppercase;
    line-height: 1;
    & > span { color: $accent !important; }
  }
  .el-message-box__headerbtn { display: none !important; }

  .el-message-box__content {
    padding: 0 !important;
  }
  .el-message-box__status {
    display: none !important;
  }
  .el-message-box__container { padding-left: 0 !important; }
  .el-message-box__message {
    padding: 0 !important;
    p {
      font-family: $serif;
      font-size: 17px;
      letter-spacing: 0.8px;
      color: $tx-1;
      line-height: 1.65;
      margin: 0;
    }
  }

  .el-message-box__btns {
    padding: 28px 0 0 !important;
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    // 重置 Element Plus 按钮默认外观
    .el-button {
      position: relative;
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      padding: 10px 22px !important;
      font-family: $mono !important;
      font-size: 12px !important;
      letter-spacing: 2px !important;
      text-transform: uppercase;
      color: $tx-3 !important;
      transition: color 0.25s ease !important;
      box-shadow: none !important;

      &::before, &::after {
        content: '';
        position: absolute;
        width: 10px; height: 10px;
        border: 1px solid $tx-4;
        transition: all 0.25s ease;
      }
      &::before { top: 0; left: 0; border-right: none; border-bottom: none; }
      &::after  { bottom: 0; right: 0; border-left: none; border-top: none; }

      &:hover {
        color: $tx-1 !important;
        background: transparent !important;
        &::before, &::after { border-color: $tx-2; width: 14px; height: 14px; }
      }

      // 主按钮 = 删除 = 危险色
      &.el-button--primary {
        color: #ff8585 !important;
        &::before, &::after { border-color: #ff8585; }
        &:hover {
          color: #fff !important;
          background: rgba(255,133,133,0.08) !important;
          &::before, &::after { border-color: #fff; }
        }
      }
    }
  }
}
</style>
