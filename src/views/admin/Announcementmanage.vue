<template>
  <div class="announcement-manage">

    <!-- 搜索筛选区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>

        <el-form-item label="关键词">
          <el-input
              v-model="queryForm.title"
              placeholder="搜索公告标题"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="发布时间">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              :default-time="[new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)]"
              style="width: 340px"
          />
        </el-form-item>

        <el-form-item label="优先级">
          <el-select v-model="queryForm.priority" placeholder="全部" clearable style="width: 100px">
            <el-option label="普通" :value="0" />
            <el-option label="重要" :value="1" />
            <el-option label="紧急" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>

      </el-form>
    </el-card>

    <!-- 公告列表表格 -->
    <el-card shadow="never" class="table-card">

      <!-- 表格头：标题 + 发布按钮 -->
      <div class="table-toolbar">
        <span class="toolbar-title">公告列表</span>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          发布新公告
        </el-button>
      </div>

      <el-table
          :data="tableData"
          v-loading="loading"
          stripe
          border
          row-key="announcementId"
          style="width: 100%"
      >

        <el-table-column label="公告标题" prop="title" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="title-cell">
              <el-tag
                  v-if="row.priority === 2"
                  type="danger"
                  size="small"
                  effect="dark"
                  style="margin-right: 6px"
              >
                紧急
              </el-tag>
              <el-tag
                  v-else-if="row.priority === 1"
                  type="warning"
                  size="small"
                  effect="plain"
                  style="margin-right: 6px"
              >
                重要
              </el-tag>
              <span class="title-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="发送人数" prop="sendCount" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.sendCount }} 人</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="已读人数" prop="readCount" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.readCount }} 人</span>
          </template>
        </el-table-column>

        <el-table-column label="已读率" prop="readRate" width="160" align="center">
          <template #default="{ row }">
            <div class="read-rate-cell">
              <el-progress
                  :percentage="row.readRate || 0"
                  :color="getProgressColor(row.readRate)"
                  :stroke-width="8"
                  style="width: 100px"
              />
              <span class="rate-text">{{ row.readRate || 0 }}%</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="发布时间" prop="createTime" width="180" align="center" />

        <!-- ✅ 无 fixed="right"，避免残留监听器干扰 transition out-in -->
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button
                type="primary"
                size="small"
                link
                @click="openDetailDialog(row.announcementId)"
            >
              <el-icon><View /></el-icon> 详情
            </el-button>
            <el-button
                type="danger"
                size="small"
                link
                @click="handleDelete(row)"
            >
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>

      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="queryForm.pageNum"
            v-model:page-size="queryForm.pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建公告弹窗 -->
    <el-dialog
        v-model="createDialogVisible"
        title="📢 发布新公告"
        width="660px"
        align-center
        append-to-body
        destroy-on-close
    >
      <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createRules"
          label-width="80px"
      >

        <el-form-item label="公告标题" prop="title">
          <el-input
              v-model="createForm.title"
              placeholder="请输入公告标题（最多100字）"
              maxlength="100"
              show-word-limit
              clearable
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="createForm.priority">
            <el-radio :label="0">
              <el-tag type="info" effect="plain" size="small">普通</el-tag>
            </el-radio>
            <el-radio :label="1">
              <el-tag type="warning" effect="plain" size="small">重要</el-tag>
            </el-radio>
            <el-radio :label="2">
              <el-tag type="danger" effect="dark" size="small">紧急</el-tag>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="公告内容" prop="content">
          <el-input
              v-model="createForm.content"
              type="textarea"
              :autosize="{ minRows: 6, maxRows: 16 }"
              placeholder="请输入公告内容（支持换行，最多5000字）"
              maxlength="5000"
              show-word-limit
          />
        </el-form-item>

        <el-alert type="info" :closable="false" show-icon style="margin-top: 8px">
          <template #default>
            发布后将立即通知 <b>全体活跃用户</b>，请确认内容无误后再提交。
          </template>
        </el-alert>

      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            :loading="createLoading"
            @click="handleCreate"
        >
          {{ createLoading ? '发送中...' : '确认发布' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 公告详情弹窗 -->
    <el-dialog
        v-model="detailDialogVisible"
        title="📋 公告详情"
        width="600px"
        align-center
        append-to-body
        destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-wrapper">
        <template v-if="detailData">

          <div class="detail-title-row">
            <el-tag
                v-if="detailData.priority === 2"
                type="danger"
                effect="dark"
                style="margin-right: 8px"
            >
              紧急
            </el-tag>
            <el-tag
                v-else-if="detailData.priority === 1"
                type="warning"
                effect="plain"
                style="margin-right: 8px"
            >
              重要
            </el-tag>
            <span class="detail-title">{{ detailData.title }}</span>
          </div>

          <div class="detail-stats">
            <div class="stat-item">
              <div class="stat-value">{{ detailData.sendCount }}</div>
              <div class="stat-label">发送人数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detailData.readCount }}</div>
              <div class="stat-label">已读人数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" :class="getReadRateClass(detailData.readRate)">
                {{ detailData.readRate || 0 }}%
              </div>
              <div class="stat-label">已读率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value time-value">{{ formatTime(detailData.createTime) }}</div>
              <div class="stat-label">发布时间</div>
            </div>
          </div>

          <div style="margin: 16px 0 8px">
            <span style="font-size: 13px; color: #666; margin-right: 8px">已读进度</span>
            <el-progress
                :percentage="detailData.readRate || 0"
                :color="getProgressColor(detailData.readRate)"
                :stroke-width="10"
            />
          </div>

          <el-divider>公告内容</el-divider>

          <div class="detail-content">{{ detailData.content }}</div>

        </template>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, View, Delete } from '@element-plus/icons-vue'
import {
  createAnnouncement,
  getAnnouncementList,
  getAnnouncementDetail,
  deleteAnnouncement
} from '@/api/admin/announcement'

// ✅ 组件销毁标志，防止异步回调更新已销毁组件的状态，干扰 transition out-in
let destroyed = false
onBeforeUnmount(() => {
  destroyed = true
})

// ── 列表状态 ──────────────────────────────────────────────────────────
const loading   = ref(false)
const tableData = ref([])
const total     = ref(0)
const dateRange = ref([])

const queryForm = reactive({
  pageNum:   1,
  pageSize:  10,
  title:     '',
  priority:  null,
  startTime: '',
  endTime:   ''
})

// ── 创建公告弹窗 ──────────────────────────────────────────────────────
const createDialogVisible = ref(false)
const createLoading       = ref(false)
const createFormRef       = ref(null)

const createForm = reactive({
  title:    '',
  content:  '',
  priority: 0
})

const createRules = {
  title: [
    { required: true, message: '公告标题不能为空', trigger: 'blur' },
    { max: 100, message: '标题不能超过100个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '公告内容不能为空', trigger: 'blur' },
    { max: 5000, message: '内容不能超过5000个字符', trigger: 'blur' }
  ]
}

// ── 详情弹窗 ──────────────────────────────────────────────────────────
const detailDialogVisible = ref(false)
const detailLoading       = ref(false)
const detailData          = ref(null)

// ── 生命周期 ──────────────────────────────────────────────────────────
onMounted(() => {
  fetchList()
})

// ── 列表查询 ──────────────────────────────────────────────────────────
const fetchList = async () => {
  loading.value = true
  try {
    if (dateRange.value && dateRange.value.length === 2) {
      queryForm.startTime = dateRange.value[0]
      queryForm.endTime   = dateRange.value[1]
    } else {
      queryForm.startTime = ''
      queryForm.endTime   = ''
    }

    const res = await getAnnouncementList({
      pageNum:   queryForm.pageNum,
      pageSize:  queryForm.pageSize,
      keyword:   queryForm.title    || undefined,
      priority:  queryForm.priority !== null && queryForm.priority !== undefined ? queryForm.priority : undefined,
      startTime: queryForm.startTime || undefined,
      endTime:   queryForm.endTime   || undefined
    })

    if (destroyed) return

    tableData.value = res.data.records || []
    total.value     = res.data.total   || 0
  } catch (error) {
    if (destroyed) return
    console.error('获取公告列表失败:', error)
    ElMessage.error('获取公告列表失败，请稍后重试')
  } finally {
    if (!destroyed) loading.value = false
  }
}

const handleSearch = () => {
  queryForm.pageNum = 1
  fetchList()
}

const handleReset = () => {
  queryForm.title     = ''
  queryForm.priority  = null
  queryForm.startTime = ''
  queryForm.endTime   = ''
  queryForm.pageNum   = 1
  dateRange.value     = []
  fetchList()
}

const handleSizeChange = (size) => {
  queryForm.pageSize = size
  queryForm.pageNum  = 1
  fetchList()
}

const handleCurrentChange = (page) => {
  queryForm.pageNum = page
  fetchList()
}

// ── 创建公告 ──────────────────────────────────────────────────────────
const openCreateDialog = () => {
  createForm.title    = ''
  createForm.content  = ''
  createForm.priority = 0
  createDialogVisible.value = true
}

const handleCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm(
        `确认将公告《${createForm.title}》发送给全体活跃用户吗？`,
        '发布确认',
        {
          confirmButtonText: '确认发布',
          cancelButtonText:  '再想想',
          type:              'warning',
          appendTo:          'body'
        }
    )
  } catch {
    return
  }

  createLoading.value = true
  try {
    const res       = await createAnnouncement({
      title:    createForm.title,
      content:  createForm.content,
      priority: createForm.priority
    })
    const sendCount = res.data?.sendCount || 0
    ElMessage.success(`公告发布成功！已发送给 ${sendCount} 位用户`)
    createDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('创建公告失败:', error)
    ElMessage.error('公告发布失败，请稍后重试')
  } finally {
    createLoading.value = false
  }
}

// ── 公告详情 ──────────────────────────────────────────────────────────
const openDetailDialog = async (announcementId) => {
  detailData.value          = null
  detailDialogVisible.value = true
  detailLoading.value       = true

  try {
    const res = await getAnnouncementDetail(announcementId)
    if (destroyed) return
    detailData.value = res.data
  } catch (error) {
    if (destroyed) return
    ElMessage.error('获取公告详情失败')
    detailDialogVisible.value = false
  } finally {
    if (!destroyed) detailLoading.value = false
  }
}

// ── 删除公告 ──────────────────────────────────────────────────────────
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确认删除公告《${row.title}》？删除后用户将无法在通知列表中看到此公告。`,
        '删除确认',
        {
          confirmButtonText: '确认删除',
          cancelButtonText:  '取消',
          type:              'warning',
          appendTo:          'body'
        }
    )
  } catch {
    return
  }

  try {
    await deleteAnnouncement(row.announcementId)
    ElMessage.success('公告已删除')
    fetchList()
  } catch (error) {
    console.error('删除公告失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  }
}

// ── 工具函数 ──────────────────────────────────────────────────────────
const getProgressColor = (rate) => {
  if (!rate || rate < 30) return '#f56c6c'
  if (rate < 60) return '#e6a23c'
  return '#67c23a'
}

const getReadRateClass = (rate) => {
  if (!rate || rate < 30) return 'rate-low'
  if (rate < 60) return 'rate-mid'
  return 'rate-high'
}

const formatTime = (time) => {
  if (!time) return '-'
  return String(time).slice(0, 16)
}
</script>

<style scoped>
/* ── 页面容器 ── */
.announcement-manage {
  padding: 0 0 24px;
}

/* ── 搜索卡片：白底 ── */
.search-card {
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
}

/* ── 表格卡片：白底 ── */
.table-card {
  background: #fff;
  border: 1px solid #ebeef5;
}

/* ── 表格工具栏（标题 + 发布按钮） ── */
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* ── 标题列 ── */
.title-cell {
  display: flex;
  align-items: center;
}

.title-text {
  font-weight: 500;
  color: #303133;
}

/* ── 已读率列 ── */
.read-rate-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rate-text {
  font-size: 12px;
  color: #606266;
  min-width: 36px;
}

/* ── 分页 ── */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ── 详情弹窗 ── */
.detail-wrapper {
  min-height: 200px;
}

.detail-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

/* 统计数字格子 */
.detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
  line-height: 1.3;
}

.time-value {
  font-size: 13px;
  font-weight: 500;
  color: #909399;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 已读率着色 */
.rate-low  { color: #f56c6c !important; }
.rate-mid  { color: #e6a23c !important; }
.rate-high { color: #67c23a !important; }

/* 公告正文 */
.detail-content {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  max-height: 300px;
  overflow-y: auto;
}
</style>