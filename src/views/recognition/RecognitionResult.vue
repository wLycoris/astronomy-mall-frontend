<template>
  <div class="recognition-result-page">

    <!-- 顶部返回栏 -->
    <div class="nav-bar">
      <el-button text @click="router.push('/recognition')" class="back-btn">← 重新识别</el-button>
      <span class="nav-title">识别结果</span>
      <el-button text @click="router.push('/recognition/history')" class="history-btn">历史记录 →</el-button>
    </div>

    <!-- ============================================================ -->
    <!-- 加载中 -->
    <!-- ============================================================ -->
    <div v-if="loading" class="loading-container">
      <el-icon class="rotating" size="40" color="#4a9eff"><Loading /></el-icon>
      <p>加载识别结果...</p>
    </div>

    <!-- ============================================================ -->
    <!-- 识别失败 -->
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
        <el-button type="primary" @click="router.push('/recognition')">重新上传</el-button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 识别成功：主内容 -->
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
            <span>🌌</span><p>暂无标注图片</p>
          </div>
        </div>
        <p class="image-caption">
          由 Astrometry.net 生成的标注图像
          <el-link v-if="detail.resultImageUrl" :href="detail.resultImageUrl" target="_blank" type="primary" size="small">
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
              <span class="coord-value">{{ detail.raFormatted || formatRA(detail.ra) }}</span>
              <em class="coord-deg">{{ detail.ra != null ? Number(detail.ra).toFixed(4) + '°' : '—' }}</em>
            </div>
            <div class="coord-item">
              <span class="coord-label">赤纬 Dec</span>
              <span class="coord-value">{{ detail.decFormatted || formatDec(detail.dec) }}</span>
              <em class="coord-deg">{{ detail.dec != null ? Number(detail.dec).toFixed(4) + '°' : '—' }}</em>
            </div>
            <div class="coord-item">
              <span class="coord-label">视野半径</span>
              <span class="coord-value">{{ detail.radiusFormatted || (detail.radius != null ? Number(detail.radius).toFixed(3) + '°' : '—') }}</span>
              <em class="coord-deg">图像覆盖天区范围</em>
            </div>
            <div class="coord-item">
              <span class="coord-label">方向角 PA</span>
              <span class="coord-value">{{ detail.orientationFormatted || (detail.orientation != null ? Number(detail.orientation).toFixed(2) + '°' : '—') }}</span>
              <em class="coord-deg">图像上方指向北极偏转量</em>
            </div>
          </div>
        </el-card>

        <!-- ② 天体列表卡 -->
        <el-card v-if="hasCelestialData" class="info-card objects-card" shadow="never">
          <template #header>
            <span class="card-title">⭐ 识别到的天体</span>
            <el-tag size="small" type="info" style="float:right">共 {{ celestialCount }} 个</el-tag>
          </template>

          <!-- 有中英文对照数据时（getResult接口） -->
          <div v-if="detail.celestialObjects && detail.celestialObjects.length > 0" class="objects-bilingual">
            <div v-for="obj in detail.celestialObjects" :key="obj.en" class="bilingual-tag" :class="`type-${obj.type}`">
              <span class="tag-zh">{{ obj.zh }}</span>
              <span class="tag-en">{{ obj.en }}</span>
              <span class="tag-type">{{ typeLabel(obj.type) }}</span>
            </div>
          </div>
          <div v-else class="objects-list">
            <el-tag v-for="obj in detail.objectsInField" :key="obj" class="object-tag" type="warning" effect="dark">{{ obj }}</el-tag>
          </div>
        </el-card>

        <!-- ③ 机器标签卡 -->
        <el-card v-if="detail.machineTags && detail.machineTags.length > 0" class="info-card tags-card" shadow="never">
          <template #header><span class="card-title">🏷️ 天体类型标签</span></template>
          <div class="tags-list">
            <el-tag v-for="tag in detail.machineTags" :key="tag" class="machine-tag" type="info" size="small">{{ tag }}</el-tag>
          </div>
        </el-card>

        <!-- ④ 分享卡片 -->
        <el-card class="info-card share-card" shadow="never">
          <template #header><span class="card-title">📤 分享结果</span></template>
          <div class="share-area">
            <p class="share-tip">将识别结果复制为文字，分享给天文爱好者</p>
            <el-button type="primary" plain size="small" @click="handleShare">复制结果文字</el-button>
          </div>
        </el-card>

      </div>
    </div>

    <!-- ============================================================
      ⭐ 4.4 推荐器材区（横向滑动卡片，全宽展示在结果下方）
      仅 status=1 识别成功时显示
    ============================================================ -->
    <div v-if="detail && detail.status === 1" class="recommend-section">
      <div class="recommend-header">
        <span class="recommend-title">🔭 推荐观测器材</span>
        <span v-if="recommendLoading" class="recommend-hint">
          <el-icon class="rotating" size="14"><Loading /></el-icon> 匹配中...
        </span>
        <span v-else-if="recommendList.length > 0" class="recommend-hint">
          根据识别天体类型智能推荐
        </span>
        <el-button
            v-if="recommendList.length > 0"
            text
            size="small"
            class="recommend-more-btn"
            @click="router.push('/products')"
        >查看全部器材 →</el-button>
      </div>

      <!-- 加载骨架 -->
      <div v-if="recommendLoading" class="recommend-scroll">
        <div v-for="i in 4" :key="i" class="product-card skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-line long"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>

      <!-- 商品横滑卡片 -->
      <div v-else-if="recommendList.length > 0" class="recommend-scroll">
        <div
            v-for="product in recommendList"
            :key="product.id"
            class="product-card"
            @click="goProduct(product.id)"
        >
          <!-- 商品图 -->
          <div class="product-img-wrap">
            <img
                v-if="product.mainImage"
                :src="product.mainImage"
                :alt="product.productName"
                class="product-img"
                @error="e => e.target.style.display='none'"
            />
            <div v-else class="product-img-placeholder">🔭</div>
          </div>

          <!-- 商品信息 -->
          <div class="product-info">
            <p class="product-name">{{ product.productName }}</p>
            <p class="product-price">¥{{ formatPrice(product.price) }}</p>
            <p class="product-reason">{{ product.reason }}</p>
          </div>

          <!-- 去看看按钮 -->
          <el-button type="primary" size="small" class="product-btn" @click.stop="goProduct(product.id)">
            去看看
          </el-button>
        </div>
      </div>

      <!-- 无推荐结果（理论上不出现，因为有兜底热销） -->
      <div v-else class="recommend-empty">
        <p>暂无推荐器材</p>
        <el-button type="primary" plain size="small" @click="router.push('/products')">浏览全部器材</el-button>
      </div>
    </div>

    <!-- 识别中 -->
    <div v-else-if="detail && detail.status === 0" class="still-processing">
      <div class="processing-card">
        <el-icon class="rotating" size="48" color="#4a9eff"><Loading /></el-icon>
        <h2>识别尚未完成</h2>
        <p>正在处理中，请稍候...</p>
        <el-button type="primary" @click="router.push(`/recognition/waiting?id=${recognitionId}`)">返回等待页</el-button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getRecognitionResult, getRecognitionRecommend } from '@/api/recognition'

const route  = useRoute()
const router = useRouter()

const loading         = ref(true)
const detail          = ref(null)
const recognitionId   = ref(null)
const imageLoading    = ref(true)
const imageError      = ref(false)

// ⭐ 4.4 新增
const recommendLoading = ref(false)
const recommendList    = ref([])

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
  return detail.value.celestialObjects?.length || detail.value.objectsInField?.length || 0
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
    const res = await getRecognitionResult(recognitionId.value)
    detail.value = res.data
    if (!detail.value?.resultImageUrl) imageLoading.value = false
    // ⭐ 识别成功后异步加载推荐器材，不阻塞页面渲染
    if (detail.value?.status === 1) fetchRecommend()
  } catch (err) {
    ElMessage.error('加载识别结果失败，请重试')
    console.error('[RecognitionResult] 加载失败:', err)
  } finally {
    loading.value = false
  }
}

// ⭐ 4.4: 加载推荐器材（异步，不影响主内容渲染）
async function fetchRecommend() {
  recommendLoading.value = true
  try {
    const res = await getRecognitionRecommend(recognitionId.value)
    recommendList.value = res.data || []
  } catch (err) {
    console.warn('[RecognitionResult] 加载推荐器材失败:', err)
    recommendList.value = []
  } finally {
    recommendLoading.value = false
  }
}

// ============================================================
// 图片处理
// ============================================================
function handleImageError() { imageLoading.value = false; imageError.value = true }
function retryImage() {
  imageError.value = false; imageLoading.value = true
  if (detail.value?.resultImageUrl) {
    detail.value.resultImageUrl = detail.value.resultImageUrl.split('?')[0] + '?t=' + Date.now()
  }
}

// ============================================================
// 导航
// ============================================================
function goProduct(productId) {
  router.push(`/product/${productId}`)
}

// ============================================================
// 坐标格式化（降级计算）
// ============================================================
function formatRA(raDeg) {
  if (raDeg == null) return '—'
  const h  = Math.floor(Number(raDeg) / 15)
  const mT = (Number(raDeg) / 15 - h) * 60
  const m  = Math.floor(mT)
  const s  = ((mT - m) * 60).toFixed(1)
  return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(4,'0')}s`
}
function formatDec(decDeg) {
  if (decDeg == null) return '—'
  const sign = Number(decDeg) >= 0 ? '+' : '−'
  const abs  = Math.abs(Number(decDeg))
  const d    = Math.floor(abs)
  const mT   = (abs - d) * 60
  const m    = Math.floor(mT)
  const s    = ((mT - m) * 60).toFixed(1)
  return `${sign}${String(d).padStart(2,'0')}° ${String(m).padStart(2,'0')}′ ${String(s).padStart(4,'0')}″`
}

// ============================================================
// 工具方法
// ============================================================
function typeLabel(type) {
  return { nebula:'星云', galaxy:'星系', cluster:'星团', constellation:'星座', unknown:'天体' }[type] || '天体'
}

function formatPrice(price) {
  if (price == null) return '--'
  return Number(price).toFixed(2)
}

async function handleShare() {
  if (!detail.value) return
  const d = detail.value
  const objectStr = d.celestialObjects?.length
      ? d.celestialObjects.map(o => `${o.zh}(${o.en})`).join('、')
      : d.objectsInField?.join('、') || '未识别到具体天体'
  const text = [
    '🌠 天文商城 · 星图识别结果',
    '─'.repeat(18),
    `天体：${objectStr}`,
    d.raFormatted          ? `赤经(RA)：${d.raFormatted}`        : null,
    d.decFormatted         ? `赤纬(Dec)：${d.decFormatted}`      : null,
    d.orientationFormatted ? `方向角：${d.orientationFormatted}` : null,
    d.radiusFormatted      ? `视野半径：${d.radiusFormatted}`    : null,
    '─'.repeat(18),
    `识别时间：${d.createTime || ''}`,
    '📲 天文器材商城 - 探索星空，从这里开始'
  ].filter(Boolean).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('识别结果已复制到剪贴板 🎉')
  } catch {
    const el = document.createElement('textarea')
    el.value = text; document.body.appendChild(el); el.select()
    document.execCommand('copy'); document.body.removeChild(el)
    ElMessage.success('识别结果已复制到剪贴板 🎉')
  }
}
</script>

<style scoped>
/* ============================================================ */
/* 页面基础 + 原有样式（与4.3保持一致）                           */
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
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  background: rgba(8, 20, 45, 0.9);
  border-bottom: 1px solid rgba(80, 130, 200, 0.15);
  position: sticky; top: 0; z-index: 10;
  backdrop-filter: blur(10px);
}
.nav-title { font-size: 1rem; color: #8ab4d8; font-weight: 500; letter-spacing: 1px; }
.back-btn, .history-btn { color: #5a8ac8 !important; font-size: 0.85rem; }
.loading-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: calc(100vh - 60px); gap: 16px; color: #4a6a8a;
}
.failed-container {
  display: flex; align-items: center; justify-content: center;
  min-height: calc(100vh - 60px); padding: 20px;
}
.failed-card {
  background: rgba(10, 22, 48, 0.9); border: 1px solid rgba(200, 80, 60, 0.2);
  border-radius: 16px; padding: 50px 40px; text-align: center; max-width: 460px; width: 100%;
}
.failed-icon { font-size: 3.5rem; margin-bottom: 16px; }
.failed-card h2 { color: #c0deff; margin: 0 0 12px; }
.fail-reason { color: #8a6050; margin: 0 0 20px; font-size: 0.9rem; line-height: 1.6; }
.fail-tips {
  text-align: left; background: rgba(255,255,255,0.03); border-radius: 10px;
  padding: 14px 18px; margin-bottom: 24px; font-size: 0.85rem; color: #5a7a8a; line-height: 1.8;
}
.fail-tips p { margin: 0 0 8px; color: #7a9aaa; }
.fail-tips ul { margin: 0; padding-left: 18px; }
.result-content {
  max-width: 1200px; margin: 30px auto; padding: 0 20px;
  display: grid; grid-template-columns: 1fr 420px; gap: 24px; align-items: start;
}
@media (max-width: 900px) { .result-content { grid-template-columns: 1fr; } }
.image-section { position: sticky; top: 70px; }
.annotated-image-wrapper {
  background: rgba(5, 15, 35, 0.8); border: 1px solid rgba(80, 130, 200, 0.2);
  border-radius: 12px; overflow: hidden; min-height: 300px;
  display: flex; align-items: center; justify-content: center;
}
.image-skeleton {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  color: #4a6a8a; font-size: 0.9rem; padding: 60px;
}
.annotated-image { width: 100%; max-height: 70vh; object-fit: contain; display: block; }
.image-error {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px; color: #4a6a8a; font-size: 2rem;
}
.image-error p { font-size: 0.9rem; margin: 0; }
.image-caption {
  text-align: center; color: #3a5a7a; font-size: 0.8rem; margin-top: 10px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.info-section { display: flex; flex-direction: column; gap: 16px; }
.info-card {
  background: rgba(10, 22, 48, 0.85) !important;
  border: 1px solid rgba(80, 130, 200, 0.18) !important;
  border-radius: 12px !important;
}
.card-title { font-size: 0.95rem; color: #8ab4d8; font-weight: 500; }
.card-subtitle { font-size: 0.75rem; color: #3a5a7a; margin-left: 8px; }
:deep(.el-card__header) { border-bottom: 1px solid rgba(60,100,160,0.2); padding: 12px 16px; }
:deep(.el-card__body) { padding: 16px; }
.coords-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.coord-item {
  display: flex; flex-direction: column; gap: 4px;
  background: rgba(5,15,40,0.6); border-radius: 8px; padding: 10px 12px;
}
.coord-label { font-size: 0.72rem; color: #4a6a8a; text-transform: uppercase; letter-spacing: 0.5px; }
.coord-value { font-size: 0.88rem; color: #8ecdf7; font-family: 'Courier New', monospace; font-weight: 600; word-break: break-all; }
.coord-deg { font-style: normal; color: #3a5a7a; font-size: 0.72rem; display: block; margin-top: 2px; }
.objects-bilingual { display: flex; flex-wrap: wrap; gap: 10px; }
.bilingual-tag {
  position: relative; padding: 8px 14px 8px 12px; border-radius: 10px;
  min-width: 120px; max-width: 180px; cursor: default; transition: transform 0.15s;
}
.bilingual-tag:hover { transform: translateY(-2px); }
.tag-zh { display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 3px; }
.tag-en { display: block; font-size: 0.72rem; opacity: 0.7; font-style: italic; }
.tag-type {
  position: absolute; top: -7px; right: 6px;
  font-size: 0.65rem; padding: 1px 7px; border-radius: 8px; font-weight: 700; letter-spacing: 0.3px;
}
.type-nebula { background: rgba(59,130,246,0.14); border: 1px solid rgba(59,130,246,0.38); color: #7ec8fd; }
.type-nebula .tag-type { background: #3b82f6; color: #fff; }
.type-galaxy { background: rgba(139,92,246,0.14); border: 1px solid rgba(139,92,246,0.38); color: #c4a9fd; }
.type-galaxy .tag-type { background: #8b5cf6; color: #fff; }
.type-cluster { background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.38); color: #6ee7b7; }
.type-cluster .tag-type { background: #10b981; color: #fff; }
.type-constellation { background: rgba(245,158,11,0.14); border: 1px solid rgba(245,158,11,0.38); color: #fcd34d; }
.type-constellation .tag-type { background: #f59e0b; color: #fff; }
.type-unknown { background: rgba(100,116,139,0.14); border: 1px solid rgba(100,116,139,0.3); color: #94a3b8; }
.type-unknown .tag-type { background: #64748b; color: #fff; }
.objects-list { display: flex; flex-wrap: wrap; gap: 8px; }
.object-tag { font-size: 0.85rem; cursor: default; }
.tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
.machine-tag { background: rgba(30,60,100,0.5) !important; border-color: rgba(80,130,200,0.25) !important; color: #6a9ac8 !important; }
.share-area { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.share-tip { color: #4a6a8a; font-size: 0.85rem; margin: 0; }
.still-processing { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 60px); }
.processing-card {
  background: rgba(10,22,48,0.85); border: 1px solid rgba(80,130,200,0.2);
  border-radius: 16px; padding: 50px 40px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.processing-card h2 { color: #c0deff; margin: 0; }
.processing-card p { color: #6a8aaa; margin: 0; }

/* ============================================================ */
/* ⭐ 4.4 新增：推荐器材区                                       */
/* ============================================================ */
.recommend-section {
  max-width: 1200px;
  margin: 24px auto 0;
  padding: 0 20px;
}

.recommend-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.recommend-title {
  font-size: 1rem;
  font-weight: 600;
  color: #8ab4d8;
}

.recommend-hint {
  font-size: 0.8rem;
  color: #3a5a7a;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.recommend-more-btn {
  color: #5a8ac8 !important;
  font-size: 0.8rem;
}

/* 横向滚动容器 */
.recommend-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 12px;
  /* 隐藏滚动条但保留功能 */
  scrollbar-width: thin;
  scrollbar-color: rgba(80,130,200,0.3) transparent;
}

.recommend-scroll::-webkit-scrollbar {
  height: 4px;
}
.recommend-scroll::-webkit-scrollbar-thumb {
  background: rgba(80, 130, 200, 0.3);
  border-radius: 2px;
}

/* 商品卡片 */
.product-card {
  flex-shrink: 0;
  width: 160px;
  background: rgba(10, 22, 48, 0.85);
  border: 1px solid rgba(80, 130, 200, 0.18);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: rgba(80, 130, 200, 0.45);
}

/* 商品图片区 */
.product-img-wrap {
  width: 100%;
  height: 120px;
  background: rgba(5, 15, 35, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-img-placeholder {
  font-size: 2.5rem;
  color: #2a4a6a;
}

/* 商品信息区 */
.product-info {
  padding: 10px 10px 4px;
  flex: 1;
}

.product-name {
  font-size: 0.8rem;
  color: #c0d8f0;
  margin: 0 0 6px;
  line-height: 1.4;
  /* 最多两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f59e0b;
  margin: 0 0 4px;
}

.product-reason {
  font-size: 0.7rem;
  color: #3a6a8a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 去看看按钮 */
.product-btn {
  margin: 8px 10px 10px;
  width: calc(100% - 20px);
}

/* 骨架屏 */
.skeleton-card {
  cursor: default;
  pointer-events: none;
}

.skeleton-img {
  width: 100%;
  height: 120px;
  background: linear-gradient(90deg, rgba(30,60,100,0.3) 25%, rgba(50,80,130,0.4) 50%, rgba(30,60,100,0.3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  height: 10px;
  margin: 10px 10px 6px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(30,60,100,0.3) 25%, rgba(50,80,130,0.4) 50%, rgba(30,60,100,0.3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-line.long  { width: calc(100% - 20px); }
.skeleton-line.short { width: 60%; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 无推荐 */
.recommend-empty {
  text-align: center;
  padding: 30px;
  color: #3a5a7a;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
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