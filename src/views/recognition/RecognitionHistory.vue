<template>
  <div class="recognition-history">

    <!-- ============ 顶部统计卡片 ============ -->
    <div class="stats-row" v-loading="statsLoading">
      <div class="stat-card total">
        <div class="stat-icon">🔭</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total ?? '--' }}</div>
          <div class="stat-label">总识别次数</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.successCount ?? '--' }}</div>
          <div class="stat-label">识别成功</div>
        </div>
      </div>
      <div class="stat-card rate">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total > 0 ? stats.successRate + '%' : '--' }}</div>
          <div class="stat-label">成功率</div>
        </div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingCount ?? '--' }}</div>
          <div class="stat-label">识别中</div>
        </div>
      </div>
    </div>

    <!-- ============ 页面标题 + 操作栏 ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <el-button
            text
            class="nav-btn"
            @click="$router.push('/home')"
        >
          ← 返回首页
        </el-button>
        <span class="nav-divider">/</span>
        <el-button
            text
            class="nav-btn"
            @click="$router.push('/recognition')"
        >
          🌠 AI识别
        </el-button>
        <span class="nav-divider">/</span>
        <span class="page-title">识别历史</span>
      </div>
      <el-button
          type="primary"
          @click="$router.push('/recognition')"
      >
        🌠 识别新星图
      </el-button>
    </div>

    <!-- ============ 状态筛选 Tab ============ -->
    <div class="filter-tabs">
      <div
          v-for="tab in statusTabs"
          :key="tab.value === null ? 'all' : tab.value"
          class="filter-tab"
          :class="{ active: activeStatus === tab.value }"
          @click="handleTabChange(tab.value)"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-count">{{ tab.count }}</span>
      </div>
    </div>

    <!-- ============ 记录列表 ============ -->
    <div v-loading="listLoading" class="list-container">

      <!-- 空状态 -->
      <div v-if="!listLoading && records.length === 0" class="empty-state">
        <div class="empty-icon">🌌</div>
        <div class="empty-title">
          {{ activeStatus === null ? '还没有识别记录' : '该分类暂无记录' }}
        </div>
        <div class="empty-desc">
          {{ activeStatus === null ? '上传一张星空照片，AI帮你识别天体！' : '切换其他筛选条件试试' }}
        </div>
        <el-button
            v-if="activeStatus === null"
            type="primary"
            @click="$router.push('/recognition')"
        >
          去识别第一张星图
        </el-button>
      </div>

      <!-- 记录卡片 -->
      <template v-else>
        <div v-for="item in records" :key="item.id" class="record-card">

          <!-- 缩略图占位 -->
          <div class="record-thumb">
            <div class="thumb-placeholder">
              <span class="thumb-icon">🌠</span>
            </div>
          </div>

          <!-- 记录信息 -->
          <div class="record-info">
            <!-- 状态标签 + 时间 -->
            <div class="record-row-top">
              <el-tag :type="getStatusType(item.status)" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
              <span class="record-time">{{ item.createTime }}</span>
            </div>

            <!-- 天体名 / 失败原因 / 识别中提示 -->
            <div class="record-row-main">
              <template v-if="item.status === 1 && item.mainObjects && item.mainObjects.length > 0">
                <span
                    v-for="(obj, idx) in item.mainObjects.slice(0, 2)"
                    :key="idx"
                    class="object-tag"
                >
                  🌟 {{ obj }}
                </span>
                <span v-if="item.mainObjects.length > 2" class="object-more">
                  +{{ item.mainObjects.length - 2 }}个天体
                </span>
              </template>
              <template v-else-if="item.status === 2">
                <span class="fail-reason">❌ {{ item.failReason || '识别失败，请重试' }}</span>
              </template>
              <template v-else>
                <span class="pending-text">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  AI正在分析中...
                </span>
              </template>
            </div>

            <div class="record-row-id">记录 #{{ item.id }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="record-actions">
            <el-button
                v-if="item.status === 1"
                type="primary"
                size="small"
                @click="viewResult(item.id)"
            >查看结果</el-button>
            <el-button
                v-else-if="item.status === 0"
                size="small"
                @click="viewWaiting(item.id)"
            >查看进度</el-button>
            <el-button
                v-else-if="item.status === 2"
                size="small"
                @click="$router.push('/recognition')"
            >重新识别</el-button>

            <el-button
                type="danger"
                size="small"
                plain
                @click="handleDelete(item)"
            >删除</el-button>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrap">
          <el-pagination
              v-model:current-page="pageNum"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 30]"
              layout="total, sizes, prev, pager, next"
              background
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
          />
        </div>
      </template>
    </div>

    <!-- ============ 删除确认弹窗 ============ -->
    <el-dialog
        v-model="deleteVisible"
        title="删除确认"
        width="360px"
        :close-on-click-modal="false"
    >
      <div class="delete-confirm">
        <el-icon class="confirm-icon"><Warning /></el-icon>
        <div class="confirm-text">
          <p>确定要删除这条识别记录吗？</p>
          <p class="confirm-sub">此操作不可恢复，识别结果将无法找回。</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteVisible = false">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="confirmDelete">
          确认删除
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
/**
 * RecognitionHistory.vue - 识别历史记录页面
 *
 * 文件路径: src/views/recognition/RecognitionHistory.vue
 *
 * 功能:
 *   - 顶部统计卡片（总次数/成功次数/成功率/识别中数量）
 *   - 状态筛选 Tab（全部/识别中/成功/失败）
 *   - 历史记录列表（分页，每页10条，倒序）
 *   - 每条记录：缩略图占位 + 状态标签 + 主要天体名（中文）+ 操作按钮
 *   - 删除单条记录（确认弹窗）
 *   - 空状态引导
 *
 * 对应任务: 4.5 识别历史记录
 * 后端响应格式: { list: RecognitionVO[], total: number, pageNum: number, pageSize: number }
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, Loading } from '@element-plus/icons-vue'
import {
  getRecognitionHistory,
  getRecognitionStats,
  deleteRecognition
} from '@/api/recognition.js'

const router = useRouter()

// ========== 统计数据 ==========
const stats = ref({ total: 0, successCount: 0, failCount: 0, pendingCount: 0, successRate: 0 })
const statsLoading = ref(false)

const fetchStats = async () => {
  try {
    statsLoading.value = true
    const res = await getRecognitionStats()
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('[RecognitionHistory] 获取统计失败', e)
  } finally {
    statsLoading.value = false
  }
}

// ========== 状态筛选 Tab ==========
const activeStatus = ref(null) // null=全部

const statusTabs = computed(() => [
  { label: '全部',     value: null, count: stats.value.total },
  { label: '识别中',   value: 0,    count: stats.value.pendingCount },
  { label: '识别成功', value: 1,    count: stats.value.successCount },
  { label: '识别失败', value: 2,    count: stats.value.failCount }
])

const handleTabChange = (status) => {
  activeStatus.value = status
  pageNum.value = 1
  fetchHistory()
}

// ========== 历史列表 ==========
const records = ref([])
const listLoading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchHistory = async () => {
  try {
    listLoading.value = true
    const res = await getRecognitionHistory(pageNum.value, pageSize.value, activeStatus.value)
    if (res.code === 200 && res.data) {
      // 后端返回 { list, total, pageNum, pageSize }
      records.value = res.data.list || []
      total.value   = res.data.total || 0
    }
  } catch (e) {
    console.error('[RecognitionHistory] 获取历史列表失败', e)
    ElMessage.error('加载历史记录失败')
  } finally {
    listLoading.value = false
  }
}

const handleSizeChange = () => { pageNum.value = 1; fetchHistory() }
const handlePageChange = () => { fetchHistory() }

// ========== 路由跳转 ==========
const viewResult  = (id) => router.push(`/recognition/result?id=${id}`)
const viewWaiting = (id) => router.push(`/recognition/waiting?id=${id}`)

// ========== 删除 ==========
const deleteVisible = ref(false)
const deleteLoading = ref(false)
const deleteTarget  = ref(null)

const handleDelete = (item) => {
  deleteTarget.value = item
  deleteVisible.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  try {
    deleteLoading.value = true
    const res = await deleteRecognition(deleteTarget.value.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      deleteVisible.value = false
      deleteTarget.value  = null
      await Promise.all([fetchHistory(), fetchStats()])
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    console.error('[RecognitionHistory] 删除失败', e)
    ElMessage.error('删除失败，请重试')
  } finally {
    deleteLoading.value = false
  }
}

// ========== 状态辅助 ==========
const getStatusType = (status) => ({ 0: 'primary', 1: 'success', 2: 'danger' }[status] ?? 'info')
const getStatusText = (status) => ({ 0: '识别中', 1: '识别成功', 2: '识别失败' }[status] ?? '未知')

// ========== 生命周期 ==========
onMounted(() => {
  fetchStats()
  fetchHistory()
})
</script>

<style scoped>
/* ============ 整体布局 ============ */
.recognition-history {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* ============ 统计卡片行 ============ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.stat-icon { font-size: 28px; line-height: 1; }
.stat-value { font-size: 26px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 13px; color: #888; }
.stat-card.total   .stat-value { color: #409eff; }
.stat-card.success .stat-value { color: #67c23a; }
.stat-card.rate    .stat-value { color: #e6a23c; }
.stat-card.pending .stat-value { color: #909399; }

/* ============ 页面标题 ============ */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-btn {
  color: #888 !important;
  font-size: 13px;
  padding: 4px 6px !important;
}

.nav-btn:hover {
  color: #409eff !important;
}

.nav-divider {
  color: #ccc;
  font-size: 13px;
  padding: 0 2px;
  user-select: none;
}

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}


/* ============ 筛选 Tab ============ */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: #f5f5f5;
  border-radius: 10px;
  width: fit-content;
}
.filter-tab {
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  user-select: none;
}
.filter-tab:hover { background: rgba(64,158,255,0.08); color: #409eff; }
.filter-tab.active {
  background: #fff;
  color: #409eff;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.tab-count {
  background: #e8f0fe;
  color: #409eff;
  border-radius: 20px;
  font-size: 11px;
  padding: 1px 7px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}
.filter-tab.active .tab-count { background: #409eff; color: #fff; }

/* ============ 空状态 ============ */
.empty-state {
  text-align: center;
  padding: 72px 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
}
.empty-icon  { font-size: 56px; margin-bottom: 16px; line-height: 1; }
.empty-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 8px; }
.empty-desc  { font-size: 14px; color: #888; margin-bottom: 24px; }

/* ============ 记录卡片 ============ */
.list-container { min-height: 200px; }
.record-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s, transform 0.15s;
}
.record-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.09);
  transform: translateY(-1px);
}

/* 缩略图 */
.record-thumb {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  border: 2px solid #e8e8e8;
}
.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-icon { font-size: 28px; line-height: 1; }

/* 记录信息 */
.record-info { flex: 1; min-width: 0; }
.record-row-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.record-time { font-size: 13px; color: #aaa; }
.record-row-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
  min-height: 22px;
}
.object-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: linear-gradient(135deg, #667eea20, #764ba220);
  border: 1px solid #667eea40;
  color: #5b6cf8;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
.object-more  { font-size: 12px; color: #999; }
.fail-reason  {
  font-size: 13px;
  color: #f56c6c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}
.pending-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #409eff;
}
.record-row-id { font-size: 12px; color: #ccc; }

/* 操作按钮 */
.record-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  align-items: flex-end;
}

/* ============ 分页 ============ */
.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 8px;
}

/* ============ 删除确认弹窗 ============ */
.delete-confirm {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 8px 0;
}
.confirm-icon {
  font-size: 28px;
  color: #e6a23c;
  flex-shrink: 0;
  margin-top: 2px;
}
.confirm-text p  { margin: 0 0 6px; font-size: 15px; color: #333; line-height: 1.5; }
.confirm-sub     { font-size: 13px !important; color: #888 !important; }

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .record-card { flex-wrap: wrap; }
  .record-actions { flex-direction: row; width: 100%; justify-content: flex-end; }
  .filter-tabs { flex-wrap: wrap; }
}
</style>