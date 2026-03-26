<template>
  <div class="checkin-history">

    <!-- 页面标题 -->
    <div class="page-header">
      <h3 class="page-title">我的观测足迹</h3>
      <span class="page-total" v-if="total > 0">共 {{ total }} 次签到</span>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading && list.length === 0" class="skeleton-wrap">
      <el-skeleton v-for="i in 5" :key="i" :rows="2" animated class="skeleton-item" />
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="list.length === 0" description="还没有签到记录，快去观测点打卡吧">
      <el-button type="primary" @click="router.push('/location')">前往观测点</el-button>
    </el-empty>

    <!-- 足迹列表 -->
    <div v-else class="history-list">
      <div
          v-for="item in list" :key="item.id"
          class="history-card"
          @click="goSpotDetail(item.spotId)"
      >
        <!-- 左侧日期 -->
        <div class="card-date">
          <div class="date-day">{{ formatDay(item.checkinDate) }}</div>
          <div class="date-month">{{ formatMonth(item.checkinDate) }}</div>
        </div>

        <!-- 右侧信息 -->
        <div class="card-info">
          <div class="card-name">{{ item.spotName || '未知观测点' }}</div>
          <div class="card-location">
            <span v-if="item.province">{{ item.province }}</span>
            <span v-if="item.city"> · {{ item.city }}</span>
          </div>
          <div class="card-meta">
            <span v-if="item.weather" class="meta-tag">🌤 {{ item.weather }}</span>
            <span v-if="item.moonPhase" class="meta-tag">🌙 {{ item.moonPhase }}</span>
            <span class="meta-time">{{ formatTime(item.createTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          background
          @current-change="loadData"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCheckinHistory } from '@/api/location.js'

const router = useRouter()

// ── 数据 ──
const list     = ref([])
const total    = ref(0)
const pageNum  = ref(1)
const pageSize = 10
const loading  = ref(false)

// ── 加载数据 ──
async function loadData() {
  loading.value = true
  try {
    const res = await getCheckinHistory(pageNum.value, pageSize)
    list.value  = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error('[CheckinHistory]', e)
    ElMessage.error('加载签到历史失败')
  } finally {
    loading.value = false
  }
}

// ── 跳转观测点详情 ──
function goSpotDetail(spotId) {
  if (spotId) {
    router.push('/location')
  }
}

// ── 日期格式化 ──
function formatDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.getDate()
}

function formatMonth(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return (d.getMonth() + 1) + '月'
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  // createTime 格式: "2026-03-26T18:30:00" 或 "2026-03-26 18:30:00"
  const t = timeStr.replace('T', ' ')
  return t.substring(11, 16) // "18:30"
}

// ── 生命周期 ──
onMounted(() => loadData())
</script>

<style scoped>
.checkin-history {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}
.page-total {
  font-size: 13px;
  color: #909399;
}

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-item {
  padding: 16px;
  background: #fff;
  border-radius: 10px;
}

/* ── 足迹卡片 ── */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all .2s;
}
.history-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64,158,255,.1);
  transform: translateY(-1px);
}

/* 日期区域 */
.card-date {
  width: 54px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff, #337ecc);
  border-radius: 10px;
  padding: 8px;
  color: #fff;
}
.date-day {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.date-month {
  font-size: 11px;
  opacity: .85;
}

/* 信息区域 */
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-location {
  font-size: 13px;
  color: #909399;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.meta-tag {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}
.meta-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-left: auto;
}

/* 分页 */
.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
