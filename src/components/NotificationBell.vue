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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
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

const unreadCount = reactive({
  mall: 0,
  forum: 0,
  course: 0,
  location: 0,
  recommend: 0,
  ai: 0,
  system: 0
})

const totalUnread = computed(() => {
  return Object.values(unreadCount).reduce((a, b) => a + b, 0)
})

// 显示抽屉
const showDrawer = () => {
  visible.value = true
  fetchList()
}

// 获取未读数量
const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    Object.assign(unreadCount, res.data)
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

// 🔥 修改：点击通知项
const handleItemClick = async (item) => {
  // 标记为已读
  if (item.isRead === 0) {
    try {
      await markAsRead({ ids: [item.id] })
      item.isRead = 1
      fetchUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 🔥 修复：智能跳转
  if (item.relatedType && item.relatedId) {
    visible.value = false

    // 🔍 调试日志
    console.log('🔔 点击通知:', {
      type: item.relatedType,
      id: item.relatedId,
      jumpUrl: item.jumpUrl
    })

    // 🔥 根据业务类型构建正确的路由
    let targetRoute = ''

    switch (item.relatedType) {
      case 'order':
        // 订单相关 → /order/detail/:id
        targetRoute = `/order/detail/${item.relatedId}`
        break

      case 'product':
        // 商品相关 → /product/:id
        targetRoute = `/product/${item.relatedId}`
        break

      case 'notice':
        // 系统公告 → /notice/detail/:id（如果你有这个页面）
        targetRoute = `/notice/detail/${item.relatedId}`
        break

      case 'post':
        // 论坛帖子 → /forum/post/:id（未来开发）
        targetRoute = `/forum/post/${item.relatedId}`
        break

      case 'course':
        // 课程 → /course/detail/:id（未来开发）
        targetRoute = `/course/detail/${item.relatedId}`
        break

      default:
        // 默认使用jumpUrl或跳转首页
        targetRoute = item.jumpUrl || '/home'
    }

    console.log('➡️ 跳转到:', targetRoute)
    router.push(targetRoute)
  } else if (item.jumpUrl) {
    // 兜底：如果没有relatedType，尝试使用jumpUrl
    visible.value = false
    console.log('⚠️ 使用jumpUrl跳转:', item.jumpUrl)
    router.push(item.jumpUrl)
  }
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
</style>