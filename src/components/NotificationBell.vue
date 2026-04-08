<template>
  <div class="notification-bell">
    <!-- 通知图标(带未读数) -->
    <el-badge :value="totalUnread" :hidden="totalUnread === 0" :max="99">
      <el-icon
          @click="showDrawer"
          style="font-size: 20px; cursor: pointer; color: #606266"
      >
        <Bell />
      </el-icon>
    </el-badge>

    <!-- 通知抽屉 -->
    <el-drawer
        v-model="visible"
        title="消息通知"
        size="450px"
        direction="rtl"
    >
      <!-- 模块分类Tab -->
      <el-tabs v-model="activeModule" @tab-change="handleModuleChange" class="notification-tabs">
        <el-tab-pane name="all">
          <template #label>
            <span>全部</span>
            <el-badge v-if="totalUnread > 0" :value="totalUnread" type="danger" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane name="mall">
          <template #label>
            <span>商城</span>
            <el-badge v-if="unreadCount.mall > 0" :value="unreadCount.mall" type="danger" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane name="forum">
          <template #label>
            <span>论坛</span>
            <el-badge v-if="unreadCount.forum > 0" :value="unreadCount.forum" type="danger" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane name="course">
          <template #label>
            <span>课程</span>
            <el-badge v-if="unreadCount.course > 0" :value="unreadCount.course" type="danger" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane name="system">
          <template #label>
            <span>系统</span>
            <el-badge v-if="unreadCount.system > 0" :value="unreadCount.system" type="danger" class="tab-badge" />
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 操作栏 -->
      <div class="toolbar">
        <el-radio-group v-model="readStatus" size="small" @change="fetchList">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button :label="0">未读</el-radio-button>
          <el-radio-button :label="1">已读</el-radio-button>
        </el-radio-group>
        <el-button size="small" text type="primary" @click="handleMarkAllRead">全部已读</el-button>
      </div>

      <!-- 通知列表 -->
      <el-scrollbar height="calc(100vh - 200px)" v-loading="loading">
        <div class="notification-list">
          <div
              v-for="item in notifications"
              :key="item.id"
              class="notification-item"
              :class="{
              'unread': item.isRead === 0,
              'priority-1': item.priority === 1,
              'priority-2': item.priority === 2
            }"
              @click="handleItemClick(item)"
          >
            <!-- 模块图标 -->
            <div class="module-icon" :class="`module-${item.module}`">
              <el-icon v-if="item.module === 'mall'"><ShoppingCart /></el-icon>
              <el-icon v-else-if="item.module === 'forum'"><ChatDotRound /></el-icon>
              <el-icon v-else-if="item.module === 'course'"><Reading /></el-icon>
              <el-icon v-else-if="item.module === 'location'"><Location /></el-icon>
              <el-icon v-else-if="item.module === 'recommend'"><StarFilled /></el-icon>
              <el-icon v-else-if="item.module === 'ai'"><Cpu /></el-icon>
              <el-icon v-else><Bell /></el-icon>
            </div>

            <!-- 通知内容 -->
            <div class="content">
              <div class="title">{{ item.title }}</div>
              <div class="desc">{{ item.content }}</div>
              <div class="time">{{ formatTime(item.createTime) }}</div>
            </div>

            <!-- 未读标记 -->
            <div v-if="item.isRead === 0" class="unread-dot"></div>

            <!-- 删除按钮 -->
            <el-icon
                class="delete-icon"
                @click.stop="handleDelete(item.id)"
            >
              <Delete />
            </el-icon>
          </div>

          <!-- 空状态 -->
          <el-empty v-if="notifications.length === 0" description="暂无通知" />
        </div>
      </el-scrollbar>

      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            small
            @current-change="fetchList"
        />
      </div>
    </el-drawer>

    <!-- ====================================================== -->
    <!-- 🆕 通知详情对话框（点击单条通知时弹出，完整展示内容）       -->
    <!-- ====================================================== -->
    <el-dialog
        v-model="detailVisible"
        :title="detailItem?.title || '通知详情'"
        width="520px"
        :close-on-click-modal="true"
        append-to-body
        class="notification-detail-dialog"
    >
      <div v-if="detailItem" class="detail-body">
        <!-- 顶部 meta 行：模块标签 + 时间 + 优先级 -->
        <div class="detail-meta">
          <el-tag :type="moduleTagType(detailItem.module)" size="small">
            {{ moduleLabel(detailItem.module) }}
          </el-tag>
          <el-tag v-if="detailItem.priority === 1" type="warning" size="small">重要</el-tag>
          <el-tag v-if="detailItem.priority === 2" type="danger" size="small">紧急</el-tag>
          <span class="detail-time">{{ detailItem.createTime }}</span>
        </div>

        <!-- 完整内容（保留换行，无截断） -->
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
import { ref, reactive, onMounted } from 'vue'
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
  Delete
} from '@element-plus/icons-vue'
import {
  getNotificationList,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '@/api/notification'

const router = useRouter()

// 数据
const visible = ref(false)
const loading = ref(false)
const activeModule = ref('all')
const readStatus = ref('')
const notifications = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 🆕 通知详情弹窗
const detailVisible = ref(false)
const detailItem = ref(null)

const unreadCount = reactive({
  mall: 0,
  forum: 0,
  course: 0,
  location: 0,
  recommend: 0,
  ai: 0,
  system: 0
})

// 🔥 修复：totalUnread 直接用后端返回的 total 字段，不再用 Object.values 求和
//   （之前的 bug：后端返回 {total: 18, mall:0, ..., course:14, system:4}
//    Object.assign 把 total 也写进 reactive，reduce 求和时把 total 算成模块和的一部分，
//    导致显示的总数 = 真实未读 × 2）
const totalUnread = ref(0)

// 显示抽屉
const showDrawer = () => {
  visible.value = true
  fetchList()
}

// 获取未读数量
const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    const data = res.data || {}
    // 🔥 总未读数直接取后端的 total 字段（避免与各模块求和重复）
    totalUnread.value = Number(data.total || 0)
    // 各模块未读数：仅同步已知模块字段，避免污染 reactive 对象
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

// 获取通知列表
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

// 切换模块
const handleModuleChange = () => {
  pageNum.value = 1
  fetchList()
}

// 🔥 改：点击通知项 → 弹出详情对话框（不再直接跳转）
//   原因：通知列表里 title/content 都被 ellipsis 截断，看不到完整原因。
//   现在统一弹详情，用户在详情里再决定要不要"前往查看"。
const handleItemClick = async (item) => {
  // 1. 标记为已读
  if (item.isRead === 0) {
    try {
      await markAsRead({ ids: [item.id] })
      item.isRead = 1
      fetchUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 2. 弹出详情
  detailItem.value = item
  detailVisible.value = true
}

// 🆕 根据业务类型 + 数据库 jumpUrl 计算最终跳转地址（供详情对话框"前往查看"使用）
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

// 🆕 是否可跳转（用于决定"前往查看"按钮是否显示）
const canJump = (item) => !!buildTargetRoute(item)

// 🆕 详情对话框中点击"前往查看"
const jumpFromDetail = () => {
  const target = buildTargetRoute(detailItem.value)
  if (!target) return
  detailVisible.value = false
  visible.value = false
  console.log('➡️ 从通知详情跳转到:', target)
  router.push(target)
}

// 🆕 模块标签的颜色类型
const moduleTagType = (m) => {
  switch (m) {
    case 'mall':     return 'primary'
    case 'forum':    return 'success'
    case 'course':   return 'danger'
    case 'location': return 'info'
    case 'system':   return 'warning'
    default:         return 'info'
  }
}

// 🆕 模块标签的中文名
const moduleLabel = (m) => {
  const map = {
    mall: '商城', forum: '论坛', course: '课程',
    location: '观测点', recommend: '推荐', ai: 'AI识别', system: '系统'
  }
  return map[m] || '通知'
}

// 全部标记为已读
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

// 删除通知
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除这条通知吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteNotification(id)
    ElMessage.success('删除成功')
    fetchList()
    fetchUnreadCount()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 格式化时间
const formatTime = (time) => {
  const now = new Date()
  const date = new Date(time)
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  } else if (diff < 604800000) {
    return Math.floor(diff / 86400000) + '天前'
  } else {
    return time.substring(0, 16)
  }
}

// 定时刷新未读数量
let timer = null
onMounted(() => {
  fetchUnreadCount()
  timer = setInterval(fetchUnreadCount, 30000) // 30秒刷新一次
})

// 清理定时器
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.notification-bell {
  display: inline-block;
  margin-right: 20px;
}

.notification-tabs {
  margin-bottom: 15px;
}

.tab-badge {
  margin-left: 5px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

.notification-list {
  min-height: 200px;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item:hover .delete-icon {
  opacity: 1;
}

.notification-item.unread {
  background: #f0f9ff;
}

.notification-item.priority-1 {
  border-left: 3px solid #e6a23c;
}

.notification-item.priority-2 {
  border-left: 3px solid #f56c6c;
}

.module-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
  flex-shrink: 0;
}

.module-mall { background: #e7f3ff; color: #409eff; }
.module-forum { background: #f0f9ff; color: #67c23a; }
.module-course { background: #fef0f0; color: #f56c6c; }
.module-location { background: #f4f4f5; color: #909399; }
.module-recommend { background: #fdf6ec; color: #e6a23c; }
.module-ai { background: #f0f2f5; color: #909399; }
.module-system { background: #fdf6ec; color: #e6a23c; }

.content {
  flex: 1;
  overflow: hidden;
}

.content .title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content .desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content .time {
  font-size: 12px;
  color: #909399;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  margin-left: 10px;
  flex-shrink: 0;
  align-self: center;
}

.delete-icon {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 16px;
  color: #909399;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.delete-icon:hover {
  color: #f56c6c;
}

.pagination {
  padding: 15px 0;
  text-align: center;
  border-top: 1px solid #eee;
}

/* ────────── 通知详情对话框 ────────── */
:deep(.notification-detail-dialog) {
  .el-dialog__header {
    padding: 18px 20px 12px;
    border-bottom: 1px solid #f0f0f0;
    margin-right: 0;
  }
  .el-dialog__title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    line-height: 1.5;
    word-break: break-all;
  }
  .el-dialog__body {
    padding: 18px 20px;
  }
}

.detail-body {
  .detail-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .detail-time {
    font-size: 12px;
    color: #909399;
    margin-left: 4px;
  }

  .detail-content {
    font-size: 14px;
    color: #303133;
    line-height: 1.75;
    white-space: pre-wrap;       /* 保留换行 */
    word-break: break-all;
    background: #fafbfc;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 14px 16px;
    max-height: 360px;
    overflow-y: auto;
  }
}
</style>