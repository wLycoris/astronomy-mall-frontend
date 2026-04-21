<template>
  <div class="checkin-history">
    <div class="page-header">
      <div>
        <div class="section-kicker">OBSERVATION LOG</div>
        <h3 class="page-title">我的观测足迹</h3>
        <p class="page-subtitle">记录你去过的观测点、天气和月相，方便复盘下一次观测计划。</p>
      </div>
      <div class="header-side">
        <span class="page-total" v-if="total > 0">{{ total }} 次签到</span>
        <el-button class="primary-action" @click="router.push('/location')">前往观测点</el-button>
      </div>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading && list.length === 0" class="skeleton-wrap">
      <el-skeleton v-for="i in 5" :key="i" :rows="2" animated class="skeleton-item" />
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="list.length === 0" description="还没有签到记录，快去观测点打卡吧" class="empty-state">
      <el-button class="primary-action" @click="router.push('/location')">前往观测点</el-button>
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
            <span v-if="item.weather" class="meta-tag">天气 {{ item.weather }}</span>
            <span v-if="item.moonPhase" class="meta-tag">月相 {{ item.moonPhase }}</span>
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
  min-height: 420px;
  padding: 0;
  color: #172033;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
  padding: 24px 26px;
  border: 1px solid #e9e1d4;
  border-radius: 8px;
  background:
    radial-gradient(520px 180px at 12% 0%, rgba(199, 165, 114, .14), transparent 64%),
    linear-gradient(180deg, #fffdfa 0%, #f8f4ec 100%);
  box-shadow: 0 16px 38px rgba(35, 30, 22, .08);
}

.section-kicker {
  margin-bottom: 8px;
  color: #9a6b36;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.8px;
}

.page-title {
  margin: 0;
  color: #101827;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.7;
}

.header-side {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.page-total {
  color: #8a5f2e;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.primary-action {
  min-width: 104px;
  border: 1px solid #111827;
  border-radius: 4px;
  background: #111827;
  color: #fffdfa;
  font-weight: 800;
}

.primary-action:hover {
  border-color: #9a6b36;
  background: #9a6b36;
  color: #fffdfa;
}

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-item {
  padding: 18px;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
}

.empty-state {
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
}

.history-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  position: relative;
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s, transform .2s;
}

.history-card::before {
  content: '';
  position: absolute;
  left: 52px;
  top: 18px;
  bottom: 18px;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(154, 107, 54, .34), transparent);
}

.history-card:hover {
  border-color: rgba(154, 107, 54, .48);
  box-shadow: 0 14px 28px rgba(35, 30, 22, .10);
  transform: translateY(-1px);
}

.card-date {
  position: relative;
  z-index: 1;
  width: 58px;
  height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  border: 1px solid rgba(247, 236, 210, .20);
  background:
    radial-gradient(60px 46px at 42% 18%, rgba(247, 236, 210, .18), transparent 62%),
    #111827;
  color: #f4d08a;
  box-shadow: 0 12px 22px rgba(17, 24, 39, .18);
}

.date-day {
  font-size: 24px;
  font-weight: 900;
  line-height: 1.1;
}

.date-month {
  margin-top: 4px;
  color: rgba(255, 253, 250, .78);
  font-size: 11px;
  font-weight: 700;
}

.card-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.card-name {
  color: #111827;
  font-size: 16px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-location {
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 3px 9px;
  border: 1px solid #e8ded0;
  border-radius: 999px;
  background: #faf6ef;
  color: #6b5132;
  font-size: 12px;
  font-weight: 700;
}

.meta-time {
  margin-left: auto;
  color: #9aa3b2;
  font-size: 12px;
  font-weight: 700;
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #111827;
}

@media (max-width: 720px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .header-side {
    width: 100%;
    justify-content: space-between;
  }

  .history-card {
    grid-template-columns: 58px minmax(0, 1fr);
    padding: 16px;
  }
}
</style>
