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
        <div class="fail-tips">
          <p>💡 提升识别成功率的建议：</p>
          <ul>
            <li>使用 RAW 格式或高质量 JPEG（≥3MP）</li>
            <li>确保图片中星点清晰，无严重拖线</li>
            <li>避免地平线、树木等地景遮挡</li>
            <li>拍摄时间避免满月前后</li>
          </ul>
        </div>
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
              v-show="!imageLoading && !imageError"
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
          <!-- 无标注图片 -->
          <div v-if="!detail.resultImageUrl && !imageLoading" class="image-error">
            <span>🌌</span>
            <p>暂无标注图片</p>
          </div>
        </div>
        <p class="image-caption">
          由 Astrometry.net 生成的标注图像
          <el-link
              v-if="detail.resultImageUrl"
              :href="detail.resultImageUrl"
              target="_blank"
              type="primary"
              size="small"
          >
            在新标签页打开 ↗
          </el-link>
        </p>
      </div>

      <!-- ========== 右侧：识别信息 ========== -->
      <div class="info-section">

        <!-- ① 坐标信息卡 -->
        <el-card class="info-card coords-card" shadow="never">
          <template #header>
            <span class="card-title">🎯 天球坐标</span>
            <span class="card-subtitle">赤道坐标系 J2000.0</span>
          </template>
          <div class="coords-grid">
            <div class="coord-item">
              <span class="coord-label">赤经 RA</span>
              <!-- ⭐ 优先显示后端格式化值；降级显示前端计算值 -->
              <span class="coord-value">
                {{ detail.raFormatted || formatRA(detail.ra) }}
              </span>
              <em class="coord-deg">{{ detail.ra != null ? Number(detail.ra).toFixed(4) + '°' : '—' }}</em>
            </div>
            <div class="coord-item">
              <span class="coord-label">赤纬 Dec</span>
              <span class="coord-value">
                {{ detail.decFormatted || formatDec(detail.dec) }}
              </span>
              <em class="coord-deg">{{ detail.dec != null ? Number(detail.dec).toFixed(4) + '°' : '—' }}</em>
            </div>
            <div class="coord-item">
              <span class="coord-label">视野半径</span>
              <span class="coord-value">
                {{ detail.radiusFormatted || (detail.radius != null ? Number(detail.radius).toFixed(3) + '°' : '—') }}
              </span>
              <em class="coord-deg">图像覆盖天区范围</em>
            </div>
            <div class="coord-item">
              <span class="coord-label">方向角 PA</span>
              <span class="coord-value">
                {{ detail.orientationFormatted || (detail.orientation != null ? Number(detail.orientation).toFixed(2) + '°' : '—') }}
              </span>
              <em class="coord-deg">图像上方指向北极偏转量</em>
            </div>
          </div>
        </el-card>

        <!-- ② 天体列表卡 ⭐ 4.3升级：优先展示中英文对照 -->
        <el-card
            v-if="hasCelestialData"
            class="info-card objects-card"
            shadow="never"
        >
          <template #header>
            <span class="card-title">⭐ 识别到的天体</span>
            <el-tag size="small" type="info" style="float:right">
              共 {{ celestialCount }} 个
            </el-tag>
          </template>

          <!-- 有中英文对照数据时（getResult接口） -->
          <div v-if="detail.celestialObjects && detail.celestialObjects.length > 0" class="objects-bilingual">
            <div
                v-for="obj in detail.celestialObjects"
                :key="obj.en"
                class="bilingual-tag"
                :class="`type-${obj.type}`"
            >
              <span class="tag-zh">{{ obj.zh }}</span>
              <span class="tag-en">{{ obj.en }}</span>
              <span class="tag-type">{{ typeLabel(obj.type) }}</span>
            </div>
          </div>

          <!-- 降级：仅英文名（getDetail接口兼容，不应出现但保留安全降级） -->
          <div v-else-if="detail.objectsInField && detail.objectsInField.length > 0" class="objects-list">
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

        <!-- ③ 机器标签卡 -->
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

        <!-- ④ 分享卡片 -->
        <el-card class="info-card share-card" shadow="never">
          <template #header>
            <span class="card-title">📤 分享结果</span>
          </template>
          <div class="share-area">
            <p class="share-tip">将识别结果复制为文字，分享给天文爱好者</p>
            <el-button type="primary" plain size="small" @click="handleShare">
              复制结果文字
            </el-button>
          </div>
        </el-card>

        <!-- ⑤ 推荐商品卡（4.4 节完成后接入） -->
        <el-card class="info-card recommend-card" shadow="never">
          <template #header>
            <span class="card-title">🛍️ 推荐观测器材</span>
          </template>
          <div class="coming-soon">
            <el-icon size="36" color="#3a5a7a"><ShoppingCart /></el-icon>
            <p>根据识别天体智能推荐器材</p>
            <p class="coming-soon-sub">功能开发中，敬请期待 ✨</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, ShoppingCart } from '@element-plus/icons-vue'
// ⭐ 4.3: 改用 getRecognitionResult（含格式化字段），保留 getRecognitionDetail 以备降级
import { getRecognitionResult } from '@/api/recognition'

const route = useRoute()
const router = useRouter()

const loading      = ref(true)
const detail       = ref(null)
const recognitionId = ref(null)
const imageLoading = ref(true)
const imageError   = ref(false)

// ============================================================
// 计算属性
// ============================================================

/** 是否有天体数据（支持两种数据源） */
const hasCelestialData = computed(() => {
  if (!detail.value) return false
  return (detail.value.celestialObjects && detail.value.celestialObjects.length > 0) ||
      (detail.value.objectsInField    && detail.value.objectsInField.length    > 0)
})

/** 天体数量 */
const celestialCount = computed(() => {
  if (!detail.value) return 0
  if (detail.value.celestialObjects) return detail.value.celestialObjects.length
  if (detail.value.objectsInField)   return detail.value.objectsInField.length
  return 0
})

// ============================================================
// 初始化
// ============================================================

onMounted(async () => {
  // 支持路由参数 (:id) 或查询参数 (?id=)
  const id = route.params.id || route.query.id
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
    // ⭐ 4.3: 使用 getRecognitionResult 获取完整格式化结果
    const res = await getRecognitionResult(recognitionId.value)
    detail.value = res.data
    // 若无 resultImageUrl，跳过图片加载
    if (!detail.value?.resultImageUrl) {
      imageLoading.value = false
    }
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
  imageError.value   = true
}

function retryImage() {
  imageError.value   = false
  imageLoading.value = true
  if (detail.value?.resultImageUrl) {
    const ts = Date.now()
    detail.value.resultImageUrl = detail.value.resultImageUrl.split('?')[0] + '?t=' + ts
  }
}

// ============================================================
// 坐标格式化（前端降级计算，后端已提供格式化字段时不会用到）
// ============================================================

function formatRA(raDeg) {
  if (raDeg == null) return '—'
  const totalHours = Number(raDeg) / 15
  const h   = Math.floor(totalHours)
  const mT  = (totalHours - h) * 60
  const m   = Math.floor(mT)
  const s   = ((mT - m) * 60).toFixed(1)
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(4, '0')}s`
}

function formatDec(decDeg) {
  if (decDeg == null) return '—'
  const sign = Number(decDeg) >= 0 ? '+' : '−'
  const abs  = Math.abs(Number(decDeg))
  const d    = Math.floor(abs)
  const mT   = (abs - d) * 60
  const m    = Math.floor(mT)
  const s    = ((mT - m) * 60).toFixed(1)
  return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(4, '0')}″`
}

// ============================================================
// ⭐ 4.3: 天体类型中文标签
// ============================================================

function typeLabel(type) {
  const map = {
    nebula:        '星云',
    galaxy:        '星系',
    cluster:       '星团',
    constellation: '星座',
    unknown:       '天体'
  }
  return map[type] || '天体'
}

// ============================================================
// ⭐ 4.3: 分享 - 复制结果文字
// ============================================================

async function handleShare() {
  if (!detail.value) return
  const d = detail.value

  // 天体名称（优先中文）
  let objectStr = '未识别到具体天体'
  if (d.celestialObjects && d.celestialObjects.length > 0) {
    objectStr = d.celestialObjects.map(o => `${o.zh}(${o.en})`).join('、')
  } else if (d.objectsInField && d.objectsInField.length > 0) {
    objectStr = d.objectsInField.join('、')
  }

  const lines = [
    '🌠 天文商城 · 星图识别结果',
    '─'.repeat(18),
    `天体：${objectStr}`,
    d.raFormatted          ? `赤经(RA)：${d.raFormatted}`            : null,
    d.decFormatted         ? `赤纬(Dec)：${d.decFormatted}`          : null,
    d.orientationFormatted ? `方向角：${d.orientationFormatted}`     : null,
    d.radiusFormatted      ? `视野半径：${d.radiusFormatted}`        : null,
    '─'.repeat(18),
    `识别时间：${d.createTime || ''}`,
    `📲 天文器材商城 - 探索星空，从这里开始`
  ].filter(Boolean).join('\n')

  try {
    await navigator.clipboard.writeText(lines)
    ElMessage.success('识别结果已复制到剪贴板 🎉')
  } catch {
    // 降级方案
    const el = document.createElement('textarea')
    el.value = lines
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    ElMessage.success('识别结果已复制到剪贴板 🎉')
  }
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
  max-width: 460px;
  width: 100%;
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
  margin: 0 0 20px;
  font-size: 0.9rem;
  line-height: 1.6;
}

.fail-tips {
  text-align: left;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 24px;
  font-size: 0.85rem;
  color: #5a7a8a;
  line-height: 1.8;
}

.fail-tips p {
  margin: 0 0 8px;
  color: #7a9aaa;
}

.fail-tips ul {
  margin: 0;
  padding-left: 18px;
}

/* ============================================================ */
/* 主内容布局（图片 + 信息双栏）                                  */
/* ============================================================ */
.result-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 24px;
  align-items: start;
}

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

.card-subtitle {
  font-size: 0.75rem;
  color: #3a5a7a;
  margin-left: 8px;
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
  font-size: 0.72rem;
  color: #4a6a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coord-value {
  font-size: 0.88rem;
  color: #8ecdf7;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  word-break: break-all;
}

.coord-deg {
  font-style: normal;
  color: #3a5a7a;
  font-size: 0.72rem;
  display: block;
  margin-top: 2px;
}

/* ============================================================ */
/* ⭐ 4.3: 天体中英文双语 Tag 展示                               */
/* ============================================================ */
.objects-bilingual {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.bilingual-tag {
  position: relative;
  padding: 8px 14px 8px 12px;
  border-radius: 10px;
  min-width: 120px;
  max-width: 180px;
  cursor: default;
  transition: transform 0.15s;
}

.bilingual-tag:hover {
  transform: translateY(-2px);
}

.tag-zh {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 3px;
}

.tag-en {
  display: block;
  font-size: 0.72rem;
  opacity: 0.7;
  font-style: italic;
}

.tag-type {
  position: absolute;
  top: -7px;
  right: 6px;
  font-size: 0.65rem;
  padding: 1px 7px;
  border-radius: 8px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

/* 按天体类型分色 */
.type-nebula {
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.38);
  color: #7ec8fd;
}
.type-nebula .tag-type { background: #3b82f6; color: #fff; }

.type-galaxy {
  background: rgba(139, 92, 246, 0.14);
  border: 1px solid rgba(139, 92, 246, 0.38);
  color: #c4a9fd;
}
.type-galaxy .tag-type { background: #8b5cf6; color: #fff; }

.type-cluster {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.38);
  color: #6ee7b7;
}
.type-cluster .tag-type { background: #10b981; color: #fff; }

.type-constellation {
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.38);
  color: #fcd34d;
}
.type-constellation .tag-type { background: #f59e0b; color: #fff; }

.type-unknown {
  background: rgba(100, 116, 139, 0.14);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}
.type-unknown .tag-type { background: #64748b; color: #fff; }

/* 降级英文 Tag（原有样式保留） */
.objects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.object-tag {
  font-size: 0.85rem;
  cursor: default;
}

/* ============================================================ */
/* 机器标签                                                       */
/* ============================================================ */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.machine-tag {
  background: rgba(30, 60, 100, 0.5) !important;
  border-color: rgba(80, 130, 200, 0.25) !important;
  color: #6a9ac8 !important;
}

/* ============================================================ */
/* 分享卡片                                                       */
/* ============================================================ */
.share-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.share-tip {
  color: #4a6a8a;
  font-size: 0.85rem;
  margin: 0;
}

/* ============================================================ */
/* 推荐商品                                                       */
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

.coming-soon-sub {
  color: #2a3a5a !important;
  font-size: 0.78rem !important;
}

/* ============================================================ */
/* 识别中状态                                                     */
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
/* 通用动画                                                       */
/* ============================================================ */
@keyframes rotate {
  to { transform: rotate(360deg); }
}

.rotating {
  animation: rotate 1s linear infinite;
}
</style>