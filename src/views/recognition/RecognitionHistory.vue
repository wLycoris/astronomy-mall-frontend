<template>
  <div class="recognition-history-page">
    <div class="page-header">
      <h2>🌠 识别历史</h2>
      <el-button type="primary" @click="router.push('/recognition')">
        + 新建识别
      </el-button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-area">
      <el-icon class="rotating" size="32" color="#4a9eff"><Loading /></el-icon>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!list.length" class="empty-area">
      <el-empty description="暂无识别记录">
        <el-button type="primary" @click="router.push('/recognition')">
          去识别星图
        </el-button>
      </el-empty>
    </div>

    <!-- 列表 -->
    <div v-else class="history-list">
      <div
          v-for="item in list"
          :key="item.id"
          class="history-item"
          @click="handleItemClick(item)"
      >
        <!-- 状态图标 -->
        <div class="item-status">
          <span v-if="item.status === 0" class="status-icon status-processing">
            <el-icon class="rotating"><Loading /></el-icon>
          </span>
          <span v-else-if="item.status === 1" class="status-icon status-success">✅</span>
          <span v-else class="status-icon status-failed">❌</span>
        </div>

        <!-- 信息 -->
        <div class="item-info">
          <div class="item-title">
            <span v-if="item.status === 1 && item.objectsInField && item.objectsInField.length">
              {{ item.objectsInField.slice(0, 2).join('、') }}
              <span v-if="item.objectsInField.length > 2" class="more-objects">
                等 {{ item.objectsInField.length }} 个天体
              </span>
            </span>
            <span v-else-if="item.status === 0" class="processing-text">识别中...</span>
            <span v-else class="failed-text">识别失败</span>
          </div>

          <div class="item-meta">
            <span v-if="item.ra != null" class="coord-text">
              RA {{ Number(item.ra).toFixed(2) }}°
              Dec {{ Number(item.dec) >= 0 ? '+' : '' }}{{ Number(item.dec).toFixed(2) }}°
            </span>
            <span class="time-text">{{ formatTime(item.createTime) }}</span>
          </div>

          <!-- 失败原因 -->
          <div v-if="item.status === 2 && item.failReason" class="fail-reason">
            {{ item.failReason }}
          </div>
        </div>

        <!-- 右箭头 -->
        <el-icon color="#3a5a7a"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-area">
      <el-pagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="fetchList"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, ArrowRight } from '@element-plus/icons-vue'
import { getRecognitionHistory } from '@/api/recognition'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getRecognitionHistory(pageNum.value, pageSize.value)
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    ElMessage.error('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

function handleItemClick(item) {
  if (item.status === 0) {
    router.push(`/recognition/waiting?id=${item.id}`)
  } else if (item.status === 1) {
    router.push(`/recognition/result?id=${item.id}`)
  }
  // 失败不跳转
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.recognition-history-page { padding: 0; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #a0c4e8;
}

.loading-area, .empty-area {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.history-list { display: flex; flex-direction: column; gap: 10px; }

.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(10, 22, 48, 0.7);
  border: 1px solid rgba(80, 130, 200, 0.15);
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: rgba(80, 130, 200, 0.35);
  background: rgba(20, 40, 80, 0.6);
}

.status-icon { font-size: 1.2rem; flex-shrink: 0; }
.status-processing { color: #4a9eff; }

.item-info { flex: 1; min-width: 0; }

.item-title {
  font-size: 0.92rem;
  color: #c0deff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-objects { color: #5a8ac8; font-size: 0.82rem; }
.processing-text { color: #4a9eff; }
.failed-text { color: #c87060; }

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.78rem;
}

.coord-text { color: #5a8ac8; font-family: monospace; }
.time-text { color: #3a5a7a; }

.fail-reason {
  font-size: 0.78rem;
  color: #8a6050;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-area { margin-top: 20px; display: flex; justify-content: center; }

@keyframes rotate { to { transform: rotate(360deg); } }
.rotating { animation: rotate 1s linear infinite; }
</style>