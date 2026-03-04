<template>
  <div class="log-manage">

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryForm" inline>

        <el-form-item label="操作类型">
          <el-input
              v-model="queryForm.operation"
              placeholder="如：商品、订单、退款"
              clearable
              style="width:180px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="管理员">
          <el-input
              v-model="queryForm.adminName"
              placeholder="管理员姓名"
              clearable
              style="width:140px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width:110px">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width:240px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" :loading="exportLoading" @click="handleExport">
            导出Excel
          </el-button>
        </el-form-item>

      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <el-tag type="info">共 {{ total }} 条日志</el-tag>
      </div>

      <el-table
          v-loading="loading"
          :data="logList"
          border
          stripe
          style="width:100%"
      >
        <el-table-column prop="id"         label="ID"     width="80"  align="center" />
        <el-table-column prop="adminName"  label="管理员"  width="120" align="center" />

        <el-table-column prop="operation" label="操作类型" min-width="150">
          <template #default="{ row }">
            <el-tag :type="getOperationTagType(row.operation)" size="small">
              {{ row.operation }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="ipAddress" label="IP地址" width="145" align="center" />

        <el-table-column prop="executionTime" label="耗时" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.executionTime != null" :class="getTimeCssClass(row.executionTime)">
              {{ row.executionTime }}ms
            </span>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="操作时间" width="175" align="center" />

        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
            v-model:current-page="queryForm.pageNum"
            v-model:page-size="queryForm.pageSize"
            :total="total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadList"
            @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
        v-model="detailVisible"
        title="操作日志详情"
        width="680px"
        align-center
        append-to-body
        destroy-on-close
    >
      <div v-if="currentLog" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="管理员">{{ currentLog.adminName }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationTagType(currentLog.operation)" size="small">
              {{ currentLog.operation }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'" size="small">
              {{ currentLog.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ipAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            <span v-if="currentLog.executionTime != null" :class="getTimeCssClass(currentLog.executionTime)">
              {{ currentLog.executionTime }}ms
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ currentLog.createTime }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="section-title">请求方法</div>
          <div class="code-box">{{ currentLog.method || '-' }}</div>
        </div>

        <div class="detail-section">
          <div class="section-title">请求参数</div>
          <div class="code-box">
            <pre v-if="currentLog.params">{{ formatJson(currentLog.params) }}</pre>
            <span v-else style="color:#c0c4cc">无参数</span>
          </div>
        </div>

        <div v-if="currentLog.status === 0 && currentLog.errorMsg" class="detail-section">
          <div class="section-title" style="border-left-color:#f56c6c;color:#f56c6c">错误信息</div>
          <div class="code-box" style="background:#fef0f0;border-color:#fbc4c4;color:#f56c6c">
            {{ currentLog.errorMsg }}
          </div>
        </div>

        <div v-if="currentLog.userAgent" class="detail-section">
          <div class="section-title">User-Agent</div>
          <div class="code-box" style="font-size:11px;color:#909399">{{ currentLog.userAgent }}</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getLogList, getLogDetail, exportLog } from '@/api/admin/log'

// ============================================================
// 列表查询
// ============================================================
const loading     = ref(false)
const logList     = ref([])
const total       = ref(0)
const dateRange   = ref(null)
const exportLoading = ref(false)

const queryForm = reactive({
  pageNum:   1,
  pageSize:  20,
  operation: '',
  adminName: '',
  status:    null,
  startTime: '',
  endTime:   ''
})

const loadList = async () => {
  loading.value = true
  try {
    if (dateRange.value && dateRange.value.length === 2) {
      queryForm.startTime = dateRange.value[0]
      queryForm.endTime   = dateRange.value[1]
    } else {
      queryForm.startTime = ''
      queryForm.endTime   = ''
    }
    const res = await getLogList({ ...queryForm })
    logList.value = res.data.list  || []
    total.value   = res.data.total || 0
  } catch (e) {
    ElMessage.error('获取日志列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.pageNum = 1
  loadList()
}

const handleReset = () => {
  queryForm.operation = ''
  queryForm.adminName = ''
  queryForm.status    = null
  queryForm.startTime = ''
  queryForm.endTime   = ''
  dateRange.value     = null
  handleSearch()
}

onMounted(() => loadList())

// ============================================================
// 详情弹窗
// ============================================================
const detailVisible = ref(false)
const currentLog    = ref(null)

const handleDetail = async (row) => {
  try {
    const res = await getLogDetail(row.id)
    currentLog.value    = res.data
    detailVisible.value = true
  } catch (e) {
    ElMessage.error('获取详情失败')
  }
}

// ============================================================
// 导出
// ============================================================
const handleExport = async () => {
  exportLoading.value = true
  try {
    const params = {}
    if (queryForm.operation)  params.operation  = queryForm.operation
    if (queryForm.adminName)  params.adminName  = queryForm.adminName
    if (queryForm.status != null) params.status = queryForm.status
    if (queryForm.startTime)  params.startTime  = queryForm.startTime
    if (queryForm.endTime)    params.endTime    = queryForm.endTime

    const data = await exportLog(params)
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url  = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href  = url
    const now  = new Date()
    const ts   = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    link.setAttribute('download', `操作日志_${ts}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}

// ============================================================
// 工具方法
// ============================================================
const getOperationTagType = (op) => {
  if (!op) return 'info'
  if (['删除','禁用','拒绝','取消','下架'].some(k => op.includes(k))) return 'danger'
  if (['通过','发货','完成','启用','上架','到账'].some(k => op.includes(k))) return 'success'
  if (['修改','编辑','调整','设置','更新'].some(k => op.includes(k))) return 'warning'
  return ''
}

const getTimeCssClass = (ms) => {
  if (ms == null) return ''
  if (ms < 200)  return 'time-fast'
  if (ms < 1000) return 'time-normal'
  return 'time-slow'
}

const formatJson = (str) => {
  try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str }
}
</script>

<style scoped>
.log-manage { padding: 16px; }
.filter-card { margin-bottom: 16px; }
.table-header { margin-bottom: 12px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }

.time-fast   { color: #67c23a; font-weight: bold; }
.time-normal { color: #e6a23c; }
.time-slow   { color: #f56c6c; font-weight: bold; }

.detail-content { padding: 4px 0; }
.detail-section { margin-top: 16px; }
.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
.code-box {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px 14px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #303133;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 220px;
  overflow-y: auto;
}
.code-box pre { margin: 0; font-family: inherit; font-size: inherit; }
</style>