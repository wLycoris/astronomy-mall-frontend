<template>
  <div class="page-container">
    <section class="admin-page-hero tone-violet">
      <div class="admin-page-copy">
        <span class="admin-page-kicker">MESSAGE TRACE</span>
        <h2>通知记录</h2>
        <p>查看系统推送给用户的通知明细，支持按模块、类型、已读状态和优先级追踪。</p>
      </div>
      <div class="admin-page-metrics">
        <div class="admin-metric-card">
          <span>记录总数</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="admin-metric-card warning">
          <span>当页未读</span>
          <strong>{{ unreadRecordCount }}</strong>
        </div>
        <div class="admin-metric-card danger">
          <span>当页紧急</span>
          <strong>{{ urgentRecordCount }}</strong>
        </div>
      </div>
    </section>

    <!-- ===== 筛选区 ===== -->
    <el-card class="filter-card admin-panel-card" shadow="never">
      <el-form inline :model="queryForm">
        <el-form-item label="用户ID">
          <el-input v-model.number="queryForm.userId" placeholder="精确匹配" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="所属模块">
          <el-select v-model="queryForm.module" clearable placeholder="全部" style="width:110px">
            <el-option label="商城" value="mall" />
            <el-option label="系统" value="system" />
            <el-option label="论坛" value="forum" />
            <el-option label="课程" value="course" />
            <el-option label="AI识别" value="ai" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知类型">
          <el-input v-model="queryForm.type" placeholder="如 order_paid" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="已读状态">
          <el-select v-model="queryForm.isRead" clearable placeholder="全部" style="width:100px">
            <el-option label="未读" :value="0" />
            <el-option label="已读" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="queryForm.priority" clearable placeholder="全部" style="width:100px">
            <el-option label="普通" :value="0" />
            <el-option label="重要" :value="1" />
            <el-option label="紧急" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="标题/内容" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
              v-model="queryForm.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始"
              end-placeholder="结束"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width:320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ===== 列表 Tab / 统计 Tab ===== -->
    <el-card class="record-card admin-panel-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="onTabChange">

        <!-- ── 记录列表 ── -->
        <el-tab-pane label="通知记录" name="list">

          <!-- 操作栏 -->
          <div class="toolbar">
            <el-button
                type="danger"
                :icon="Delete"
                :disabled="selectedIds.length === 0"
                @click="handleBatchDelete"
            >批量删除<template v-if="selectedIds.length">（{{ selectedIds.length }}）</template></el-button>
            <span class="total-tip">共 {{ total }} 条</span>
          </div>

          <el-table
              v-loading="loading"
              :data="tableData"
              @selection-change="rows => selectedIds = rows.map(r => r.id)"
              row-key="id"
              border
              stripe
          >
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="ID" width="70" sortable />

            <el-table-column label="用户" width="150">
              <template #default="{ row }">
                <div style="line-height:1.4">
                  <div style="font-size:11px;color:#999">ID: {{ row.userId }}</div>
                  <div>{{ row.nickname || row.username }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="模块" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="moduleTagType(row.module)" size="small">
                  {{ row.moduleLabel || row.module }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="通知类型" width="160">
              <template #default="{ row }">
                <span style="font-family:monospace;font-size:12px;color:#666">{{ row.type }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
            <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />

            <el-table-column label="优先级" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="priorityTagType(row.priority)" size="small">
                  {{ row.priorityLabel || '普通' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="已读" width="65" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.isRead === 1" color="#67C23A"><CircleCheckFilled /></el-icon>
                <el-icon v-else color="#C0C4CC"><CircleCloseFilled /></el-icon>
              </template>
            </el-table-column>

            <el-table-column prop="createTime" label="发送时间" width="160" sortable />

            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleSingleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 —— current-change 只调 fetchList，不重置 pageNum -->
          <div style="display:flex;justify-content:flex-end;margin-top:16px">
            <el-pagination
                v-model:current-page="queryForm.pageNum"
                v-model:page-size="queryForm.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="val => { queryForm.pageSize = val; queryForm.pageNum = 1; fetchList() }"
                @current-change="val => { queryForm.pageNum = val; fetchList() }"
            />
          </div>

        </el-tab-pane>

        <!-- ── 统计分析 ── -->
        <el-tab-pane label="统计分析" name="stats">

          <!-- 汇总数字 -->
          <el-row :gutter="14" v-loading="statsLoading" style="margin-bottom:20px">
            <el-col :span="4" v-for="c in statCards" :key="c.key">
              <div class="stat-card" :style="{ borderTopColor: c.color }">
                <div class="stat-num" :style="{ color: c.color }">{{ stats[c.key] || 0 }}</div>
                <div class="stat-lbl">{{ c.label }}</div>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="stat-card" style="border-top-color:#9b59b6">
                <div class="stat-num" style="color:#9b59b6">{{ readRate }}%</div>
                <div class="stat-lbl">已读率</div>
              </div>
            </el-col>
          </el-row>

          <!-- 图表 -->
          <el-row :gutter="14">
            <el-col :span="9">
              <el-card shadow="never">
                <template #header>模块分布</template>
                <div ref="pieRef" style="height:280px" />
              </el-card>
            </el-col>
            <el-col :span="15">
              <el-card shadow="never">
                <template #header>通知类型 Top10</template>
                <div ref="barRef" style="height:280px" />
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="never" style="margin-top:14px">
            <template #header>近30天发送趋势</template>
            <div ref="lineRef" style="height:240px" />
          </el-card>

        </el-tab-pane>
      </el-tabs>
    </el-card>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getNotificationList, getNotificationStats, batchDeleteRecord } from '@/api/admin/notification'

// ───── 状态 ─────
const activeTab    = ref('list')
const loading      = ref(false)
const tableData    = ref([])
const total        = ref(0)
const selectedIds  = ref([])
const statsLoading = ref(false)
const stats        = ref({})

const queryForm = reactive({
  pageNum: 1, pageSize: 10,
  userId: null, module: '', type: '', isRead: null,
  priority: null, keyword: '', timeRange: null
})

const statCards = [
  { key: 'totalCount',  label: '总通知数', color: '#409EFF' },
  { key: 'unreadCount', label: '未读数量', color: '#F56C6C' },
  { key: 'readCount',   label: '已读数量', color: '#67C23A' },
  { key: 'todayCount',  label: '今日发送', color: '#E6A23C' },
  { key: 'monthCount',  label: '本月发送', color: '#909399' },
]

const readRate = computed(() => {
  const t = stats.value.totalCount || 0
  if (!t) return 0
  return Math.round((stats.value.readCount / t) * 1000) / 10
})
const unreadRecordCount = computed(() => tableData.value.filter(item => item.isRead === 0).length)
const urgentRecordCount = computed(() => tableData.value.filter(item => item.priority === 2).length)

// ECharts
const pieRef  = ref(null)
const barRef  = ref(null)
const lineRef = ref(null)
let pie = null, bar = null, line = null

onMounted(() => fetchList())

// ───── 列表 ─────
async function fetchList() {
  loading.value = true
  try {
    const p = { pageNum: queryForm.pageNum, pageSize: queryForm.pageSize }
    if (queryForm.userId)  p.userId   = queryForm.userId
    if (queryForm.module)  p.module   = queryForm.module
    if (queryForm.type)    p.type     = queryForm.type
    if (queryForm.isRead   != null && queryForm.isRead   !== '') p.isRead   = queryForm.isRead
    if (queryForm.priority != null && queryForm.priority !== '') p.priority = queryForm.priority
    if (queryForm.keyword) p.keyword  = queryForm.keyword
    if (queryForm.timeRange?.length === 2) {
      p.startTime = queryForm.timeRange[0]
      p.endTime   = queryForm.timeRange[1]
    }
    const res = await getNotificationList(p)
    tableData.value = res.data.records || []
    total.value     = res.data.total   || 0
  } catch { ElMessage.error('获取通知记录失败') }
  finally { loading.value = false }
}

// 搜索时重置到第1页
function handleSearch() { queryForm.pageNum = 1; fetchList() }

function handleReset() {
  Object.assign(queryForm, {
    userId: null, module: '', type: '', isRead: null,
    priority: null, keyword: '', timeRange: null, pageNum: 1
  })
  fetchList()
}

async function handleSingleDelete(row) {
  await ElMessageBox.confirm(`确定删除该记录（ID: ${row.id}）？`, '删除确认', { type: 'warning' })
  try { await batchDeleteRecord([row.id]); ElMessage.success('删除成功'); fetchList() }
  catch { ElMessage.error('删除失败') }
}

async function handleBatchDelete() {
  const n = selectedIds.value.length
  if (!n) return
  await ElMessageBox.confirm(`确定删除选中的 ${n} 条记录？`, '批量删除', { type: 'warning' })
  try {
    await batchDeleteRecord(selectedIds.value)
    ElMessage.success(`已删除 ${n} 条`)
    selectedIds.value = []
    fetchList()
  } catch { ElMessage.error('批量删除失败') }
}

// ───── 统计 ─────
async function fetchStats() {
  statsLoading.value = true
  try {
    const res = await getNotificationStats()
    stats.value = res.data || {}
    await nextTick()
    renderPie(); renderBar(); renderLine()
  } catch { ElMessage.error('获取统计数据失败') }
  finally { statsLoading.value = false }
}

function onTabChange(tab) {
  if (tab.paneName === 'stats' && !stats.value.totalCount) fetchStats()
}

function renderPie() {
  if (!pieRef.value) return
  if (!pie) pie = echarts.init(pieRef.value)
  const d = (stats.value.moduleStats || []).map(m => ({ name: m.moduleLabel || m.module, value: m.count }))
  pie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'middle' },
    series: [{ type: 'pie', radius: ['40%', '68%'], center: ['38%', '50%'], data: d, label: { show: false } }]
  })
}

function renderBar() {
  if (!barRef.value) return
  if (!bar) bar = echarts.init(barRef.value)
  const d = (stats.value.typeStats || []).slice().reverse()
  bar.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '2%', right: '8%', bottom: '4%', top: '4%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: d.map(t => t.typeLabel || t.type) },
    series: [{ type: 'bar', data: d.map(t => t.count),
      itemStyle: { color: '#409EFF', borderRadius: [0, 3, 3, 0] },
      label: { show: true, position: 'right' } }]
  })
}

function renderLine() {
  if (!lineRef.value) return
  if (!line) line = echarts.init(lineRef.value)
  const d = stats.value.dateStats || []
  line.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '2%', right: '3%', bottom: '10%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: d.map(x => x.date), boundaryGap: false, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'line', data: d.map(x => x.count), smooth: true,
      areaStyle: { opacity: 0.15 }, itemStyle: { color: '#409EFF' } }]
  })
}

function moduleTagType(m) {
  return { mall: '', system: 'info', forum: 'success', course: 'warning', ai: 'danger' }[m] || 'info'
}
function priorityTagType(p) {
  return { 0: 'info', 1: 'warning', 2: 'danger' }[p] || 'info'
}
</script>

<style scoped>
.page-container { padding: 0; }
.record-card { margin-top: 16px; }
.filter-card :deep(.el-card__body) { padding: 16px 20px 4px; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.total-tip { font-size: 13px; color: #909399; }

/* 统计卡片 */
.stat-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-top: 3px solid #eee;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
}
.stat-num  { font-size: 26px; font-weight: 700; }
.stat-lbl  { font-size: 12px; color: #909399; margin-top: 4px; }

:deep(.el-table th.el-table__cell) {
  background: #f8fafc;
  color: #475569;
  font-weight: 800;
}
</style>
