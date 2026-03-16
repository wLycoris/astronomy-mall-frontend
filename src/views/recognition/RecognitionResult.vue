<template>
  <div class="recognition-result-page">

    <!-- 顶部返回栏 -->
    <div class="nav-bar">
      <el-button text @click="router.push('/recognition')" class="back-btn">
        ← 重新识别
      </el-button>
      <span class="nav-title">识别结果</span>
      <el-button text @click="router.push('/recognition/history')" class="history-btn">
        历史记录 →
      </el-button>
    </div>

    <!-- ============================================================ -->
    <!-- 加载中                                                         -->
    <!-- ============================================================ -->
    <div v-if="loading" class="loading-container">
      <el-icon class="rotating" size="40" color="#4a9eff"><Loading /></el-icon>
      <p>加载识别结果...</p>
    </div>

    <!-- ============================================================ -->
    <!-- 识别失败                                                       -->
    <!-- ============================================================ -->
    <div v-else-if="detail && detail.status === 2" class="failed-container">
      <div class="failed-card">
        <div class="failed-icon">🔭</div>
        <h2>识别未能成功</h2>
        <p class="fail-reason">{{ detail.failReason || '图片中未能检测到足够的星点信息' }}</p>
        <el-button type="primary" @click="router.push('/recognition')">
          重新上传
        </el-button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 识别成功：主内容                                               -->
    <!-- ============================================================ -->
    <div v-else-if="detail && detail.status === 1" class="result-content">

      <!-- ========== 左侧：标注图片 ========== -->
      <div class="image-section">
        <div class="annotated-image-wrapper">
          <div v-if="imageLoading" class="image-skeleton">
            <el-icon class="rotating" size="28" color="#4a6a9a"><Loading /></el-icon>
            <span>加载标注图片...</span>
          </div>
          <img
              v-show="!imageLoading"
              :src="detail.resultImageUrl"
              alt="星图标注图"
              class="annotated-image"
              @load="imageLoading = false"
              @error="handleImageError"
          />
          <!-- 图片加载失败提示 -->
          <div v-if="imageError" class="image-error">
            <span>🌌</span>
            <p>标注图片加载失败</p>
            <el-button size="small" @click="retryImage">重试</el-button>
          </div>
        </div>
        <p class="image-caption">
          由 Astrometry.net 生成的标注图像
          <el-link :href="detail.resultImageUrl" target="_blank" type="primary" size="small">
            在新标签页打开 ↗
          </el-link>
        </p>
      </div>

      <!-- ========== 右侧：识别信息 ========== -->
      <div class="info-section">

        <!-- 坐标信息卡 -->
        <el-card class="info-card coords-card" shadow="never">
          <template #header>
            <span class="card-title">🎯 天球坐标</span>
          </template>
          <div class="coords-grid">
            <div class="coord-item">
              <span class="coord-label">赤经 (RA)</span>
              <span class="coord-value">
                {{ formatRA(detail.ra) }}
                <em class="coord-deg">{{ detail.ra != null ? detail.ra.toFixed(4) + '°' : '—' }}</em>
              </span>
            </div>
            <div class="coord-item">
              <span class="coord-label">赤纬 (Dec)</span>
              <span class="coord-value">
                {{ formatDec(detail.dec) }}
                <em class="coord-deg">{{ detail.dec != null ? detail.dec.toFixed(4) + '°' : '—' }}</em>
              </span>
            </div>
            <div class="coord-item">
              <span class="coord-label">视野半径</span>
              <span class="coord-value">{{ detail.radius != null ? detail.radius.toFixed(3) + '°' : '—' }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">方向角</span>
              <span class="coord-value">{{ detail.orientation != null ? detail.orientation.toFixed(2) + '°' : '—' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 天体列表卡 -->
        <el-card
            v-if="detail.objectsInField && detail.objectsInField.length > 0"
            class="info-card objects-card"
            shadow="never"
        >
          <template #header>
            <span class="card-title">⭐ 识别到的天体</span>
            <el-tag size="small" type="info" style="float:right">
              共 {{ detail.objectsInField.length }} 个
            </el-tag>
          </template>
          <div class="objects-list">
            <el-tag
                v-for="obj in detail.objectsInField"
                :key="obj"
                class="object-tag"
                type="warning"
                effect="dark"
            >
              {{ obj }}
            </el-tag>
          </div>
        </el-card>

        <!-- 机器标签卡 -->
        <el-card
            v-if="detail.machineTags && detail.machineTags.length > 0"
            class="info-card tags-card"
            shadow="never"
        >
          <template #header>
            <span class="card-title">🏷️ 天体类型标签</span>
          </template>
          <div class="tags-list">
            <el-tag
                v-for="tag in detail.machineTags"
                :key="tag"
                class="machine-tag"
                type="info"
                size="small"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-card>

        <!-- 推荐商品卡（4.3 节完成后解除占位） -->
        <el-card class="info-card recommend-card" shadow="never">
          <template #header>
            <span class="card-title">🛍️ 推荐观测器材</span>
          </template>

          <!-- 有推荐商品时展示（4.3 节接入后生效） -->
          <div
              v-if="detail.recommendedProductIds && detail.recommendedProductIds.length > 0"
              class="recommend-placeholder"
          >
            <p class="coming-soon-tip">根据识别天体类型，智能推荐以下器材 👇</p>
            <!-- 4.3 节：此处渲染商品卡片列表 -->
            <div class="product-ids-debug">
              商品 ID: {{ detail.recommendedProductIds.join(', ') }}
            </div>
          </div>

          <!-- 暂无推荐（识别刚完成，推荐模块尚未填充） -->
          <div v-else class="coming-soon">
            <el-icon size="36" color="#3a5a7a"><ShoppingCart /></el-icon>
            <p>智能推荐器材功能正在开发中</p>
            <el-button
                type="primary"
                plain
                size="small"
                @click="router.push('/products')"
            >
              浏览全部器材 →
            </el-button>
          </div>
        </el-card>

      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 识别中（从结果页直接刷新时，识别还没完成）                     -->
    <!-- ============================================================ -->
    <div v-else-if="detail && detail.status === 0" class="still-processing">
      <div class="processing-card">
        <el-icon class="rotating" size="48" color="#4a9eff"><Loading /></el-icon>
        <h2>识别尚未完成</h2>
        <p>正在处理中，请稍候...</p>
        <el-button type="primary" @click="router.push(`/recognition/waiting?id=${recognitionId}`)">
          返回等待页
        </el-button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, ShoppingCart } from '@element-plus/icons-vue'
import { getRecognitionDetail } from '@/api/recognition'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const detail = ref(null)
const recognitionId = ref(null)
const imageLoading = ref(true)
const imageError = ref(false)

// ============================================================
// 初始化
// ============================================================

onMounted(async () => {
  const id = route.query.id
  if (!id) {
    ElMessage.error('缺少识别 ID')
    router.replace('/recognition')
    return
  }

  recognitionId.value = Number(id)
  await fetchDetail()
})

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getRecognitionDetail(recognitionId.value)
    detail.value = res.data
  } catch (err) {
    ElMessage.error('加载识别结果失败，请重试')
    console.error('[RecognitionResult] 加载失败:', err)
  } finally {
    loading.value = false
  }
}

// ============================================================
// 标注图片处理
// ============================================================

function handleImageError() {
  imageLoading.value = false
  imageError.value = true
}

function retryImage() {
  imageError.value = false
  imageLoading.value = true
  // 通过修改 src 触发重新加载（加时间戳防缓存）
  if (detail.value?.resultImageUrl) {
    const ts = Date.now()
    detail.value.resultImageUrl = detail.value.resultImageUrl.split('?')[0] + '?t=' + ts
  }
}

// ============================================================
// 坐标格式化（度 → 时分秒 / 度分秒）
// ============================================================

/**
 * 赤经格式化：度 → hh h mm m ss.ss s
 * 赤经范围 0~360°，除以 15 转为时角
 */
function formatRA(raDeg) {
  if (raDeg == null) return '—'
  const totalHours = raDeg / 15
  const h = Math.floor(totalHours)
  const mTotal = (totalHours - h) * 60
  const m = Math.floor(mTotal)
  const s = ((mTotal - m) * 60).toFixed(1)
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(4, '0')}s`
}

/**
 * 赤纬格式化：度 → ±dd° mm′ ss.s″
 */
function formatDec(decDeg) {
  if (decDeg == null) return '—'
  const sign = decDeg >= 0 ? '+' : '−'
  const abs = Math.abs(decDeg)
  const d = Math.floor(abs)
  const mTotal = (abs - d) * 60
  const m = Math.floor(mTotal)
  const s = ((mTotal - m) * 60).toFixed(1)
  return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(4, '0')}″`
}
</script>

<style scoped>
/* ============================================================ */
/* 页面基础                                                       */
/* ============================================================ */
.recognition-result-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #050c1a 0%, #0a1525 50%, #070f1e 100%);
  color: #e0eaff;
  padding-bottom: 60px;
}

/* ============================================================ */
/* 导航栏                                                         */
/* ============================================================ */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: rgba(8, 20, 45, 0.9);
  border-bottom: 1px solid rgba(80, 130, 200, 0.15);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.nav-title {
  font-size: 1rem;
  color: #8ab4d8;
  font-weight: 500;
  letter-spacing: 1px;
}

.back-btn,
.history-btn {
  color: #5a8ac8 !important;
  font-size: 0.85rem;
}

/* ============================================================ */
/* 加载中                                                         */
/* ============================================================ */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  gap: 16px;
  color: #4a6a8a;
}

/* ============================================================ */
/* 识别失败                                                       */
/* ============================================================ */
.failed-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 20px;
}

.failed-card {
  background: rgba(10, 22, 48, 0.9);
  border: 1px solid rgba(200, 80, 60, 0.2);
  border-radius: 16px;
  padding: 50px 40px;
  text-align: center;
  max-width: 440px;
}

.failed-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
}

.failed-card h2 {
  color: #c0deff;
  margin: 0 0 12px;
}

.fail-reason {
  color: #8a6050;
  margin: 0 0 24px;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ============================================================ */
/* 主内容布局（图片 + 信息双栏）                                  -->
/* ============================================================ */
.result-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  align-items: start;
}

/* 响应式：小屏单栏 */
@media (max-width: 900px) {
  .result-content {
    grid-template-columns: 1fr;
  }
}

/* ============================================================ */
/* 标注图片区                                                     */
/* ============================================================ */
.image-section {
  position: sticky;
  top: 70px;
}

.annotated-image-wrapper {
  background: rgba(5, 15, 35, 0.8);
  border: 1px solid rgba(80, 130, 200, 0.2);
  border-radius: 12px;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #4a6a8a;
  font-size: 0.9rem;
  padding: 60px;
}

.annotated-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px;
  color: #4a6a8a;
  font-size: 2rem;
}

.image-error p {
  font-size: 0.9rem;
  margin: 0;
}

.image-caption {
  text-align: center;
  color: #3a5a7a;
  font-size: 0.8rem;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* ============================================================ */
/* 信息区                                                         */
/* ============================================================ */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ============================================================ */
/* 信息卡片通用样式                                               */
/* ============================================================ */
.info-card {
  background: rgba(10, 22, 48, 0.85) !important;
  border: 1px solid rgba(80, 130, 200, 0.18) !important;
  border-radius: 12px !important;
}

.card-title {
  font-size: 0.95rem;
  color: #8ab4d8;
  font-weight: 500;
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(60, 100, 160, 0.2);
  padding: 12px 16px;
}

:deep(.el-card__body) {
  padding: 16px;
}

/* ============================================================ */
/* 坐标网格                                                       */
/* ============================================================ */
.coords-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.coord-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(5, 15, 40, 0.6);
  border-radius: 8px;
  padding: 10px 12px;
}

.coord-label {
  font-size: 0.75rem;
  color: #4a6a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coord-value {
  font-size: 0.9rem;
  color: #8ecdf7;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  word-break: break-all;
}

.coord-deg {
  font-style: normal;
  color: #5a7a9a;
  font-size: 0.78rem;
  display: block;
  margin-top: 2px;
}

/* ============================================================ */
/* 天体列表                                                       */
/* ============================================================ */
.objects-list,
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.object-tag {
  font-size: 0.85rem;
  cursor: default;
}

.machine-tag {
  background: rgba(30, 60, 100, 0.5) !important;
  border-color: rgba(80, 130, 200, 0.25) !important;
  color: #6a9ac8 !important;
}

/* ============================================================ */
/* 推荐商品                                                       -->
/* ============================================================ */
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 0;
  text-align: center;
}

.coming-soon p {
  color: #3a5a7a;
  font-size: 0.85rem;
  margin: 0;
}

.coming-soon-tip {
  color: #6a8aaa;
  font-size: 0.85rem;
  margin: 0 0 12px;
}

.product-ids-debug {
  font-size: 0.78rem;
  color: #3a5a7a;
  font-family: monospace;
}

/* ============================================================ */
/* 识别中状态                                                     -->
/* ============================================================ */
.still-processing {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
}

.processing-card {
  background: rgba(10, 22, 48, 0.85);
  border: 1px solid rgba(80, 130, 200, 0.2);
  border-radius: 16px;
  padding: 50px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.processing-card h2 {
  color: #c0deff;
  margin: 0;
}

.processing-card p {
  color: #6a8aaa;
  margin: 0;
}

/* ============================================================ */
/* 通用工具                                                       -->
/* ============================================================ */
@keyframes rotate {
  to { transform: rotate(360deg); }
}

.rotating {
  animation: rotate 1s linear infinite;
}
</style>