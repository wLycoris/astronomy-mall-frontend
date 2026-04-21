<template>
  <div class="rr">
    <!-- painterly sky + stars + paper grain -->
    <div class="sky"></div>
    <div class="stars"></div>
    <div class="grain"></div>

    <!-- topbar -->
    <header class="topbar">
      <div class="crumbs">
        <span class="crumb" @click="router.push('/recognition')">← 重新识别</span>
      </div>
      <div class="crumbs crumbs--end">
        <span class="crumb" @click="router.push('/recognition/history')">识别历史 →</span>
      </div>
    </header>

    <!-- loading -->
    <div v-if="loading" class="phase phase--loading">
      <div class="orb orb--sm">
        <div class="orb__halo"></div>
        <div class="orb__disc"></div>
      </div>
      <div class="phase__title">月光正在取回这份档案</div>
      <div class="phase__en"><em>— retrieving · plate</em></div>
    </div>

    <!-- ═══════════ 识别失败 ═══════════ -->
    <section v-else-if="detail && detail.status === 2" class="phase phase--fail">
      <div class="panel panel--fail">
        <div class="panel__kicker"><em>— unresolved · plate</em></div>
        <h2 class="panel__title">月亮没能读出这张星图</h2>
        <p class="panel__reason">{{ detail.failReason || '图片中未能检测到足够的星点信息' }}</p>

        <div class="tips">
          <div class="tips__head">让月亮更容易辨认的建议</div>
          <ul>
            <li>使用 RAW 格式或高质量 JPEG（不低于 3 MP）</li>
            <li>确保图片中星点清晰，无严重拖线</li>
            <li>避免地平线、树木等地景遮挡</li>
            <li>拍摄时间尽量避开满月前后</li>
          </ul>
        </div>

        <button class="submit" @click="router.push('/recognition')">
          <span class="submit__en"><em>try · another · plate</em></span>
          <span class="submit__cn">重新上传</span>
        </button>
      </div>
    </section>

    <!-- ═══════════ 识别成功 ═══════════ -->
    <section v-else-if="detail && detail.status === 1" class="phase phase--ok">

      <!-- dossier head -->
      <div class="head">
        <div class="head__kicker"><em>— plate · archive</em></div>
        <div class="head__row">
          <div class="head__num">#{{ String(recognitionId).padStart(4, '0') }}</div>
          <div class="head__sep"></div>
          <div class="head__meta">
            <div class="mrow">
              <span class="mk">识别时间</span>
              <span class="mv">{{ detail.createTime || '—' }}</span>
            </div>
            <div class="mrow">
              <span class="mk">识别天体</span>
              <span class="mv">{{ celestialCount }} 个</span>
            </div>
          </div>
        </div>
        <div class="head__rule">
          <span class="dot"></span>
          <span class="line"></span>
          <span class="glyph">☾</span>
          <span class="line"></span>
          <span class="dot"></span>
        </div>
      </div>

      <!-- main grid -->
      <div class="grid">
        <!-- left: plate -->
        <div class="plate-wrap">
          <div class="plate">
            <div v-if="imageLoading" class="plate__load">
              <div class="orb orb--xs">
                <div class="orb__halo"></div>
                <div class="orb__disc"></div>
              </div>
              <span>月光正在点亮标注图</span>
            </div>
            <img
                v-show="!imageLoading && !imageError"
                :src="detail.resultImageUrl"
                alt="星图标注图"
                class="plate__img"
                @load="imageLoading = false"
                @error="handleImageError"
            />
            <div v-if="imageError" class="plate__err">
              <div class="plate__err-glyph">✦</div>
              <p>标注图片加载失败</p>
              <span class="link link--on" @click="retryImage">重试 →</span>
            </div>
            <div v-if="!detail.resultImageUrl && !imageLoading && !imageError" class="plate__err">
              <div class="plate__err-glyph">✦</div>
              <p>暂无标注图片</p>
            </div>

            <div class="plate__tag">
              <span class="pt-k">档案</span>
              <span class="pt-v">#{{ String(recognitionId).padStart(4, '0') }}</span>
            </div>
          </div>

          <div class="plate-caption">
            <span><em>— marked by Astrometry.net</em></span>
            <el-link
                v-if="detail.resultImageUrl"
                :href="detail.resultImageUrl"
                target="_blank"
                class="plate-caption__link"
            >
              在新标签页打开 ↗
            </el-link>
          </div>
        </div>

        <!-- right: data cards -->
        <div class="data">

          <!-- ① coords -->
          <div class="card">
            <div class="card__head">
              <div class="card__kicker"><em>celestial · coordinates · J2000</em></div>
              <h3 class="card__title">天球坐标</h3>
            </div>
            <div class="coords">
              <div class="coord">
                <div class="coord__k">赤经</div>
                <div class="coord__v">{{ detail.raFormatted || formatRA(detail.ra) }}</div>
                <div class="coord__d">{{ detail.ra != null ? Number(detail.ra).toFixed(4) + '°' : '—' }}</div>
              </div>
              <div class="coord">
                <div class="coord__k">赤纬</div>
                <div class="coord__v">{{ detail.decFormatted || formatDec(detail.dec) }}</div>
                <div class="coord__d">{{ detail.dec != null ? Number(detail.dec).toFixed(4) + '°' : '—' }}</div>
              </div>
              <div class="coord">
                <div class="coord__k">视野范围</div>
                <div class="coord__v">
                  {{ detail.radiusFormatted || (detail.radius != null ? Number(detail.radius).toFixed(3) + '°' : '—') }}
                </div>
                <div class="coord__d">图像覆盖</div>
              </div>
              <div class="coord">
                <div class="coord__k">方向角</div>
                <div class="coord__v">
                  {{ detail.orientationFormatted || (detail.orientation != null ? Number(detail.orientation).toFixed(2) + '°' : '—') }}
                </div>
                <div class="coord__d">相对正北</div>
              </div>
            </div>
          </div>

          <!-- ② celestial objects -->
          <div v-if="hasCelestialData" class="card">
            <div class="card__head">
              <div class="card__kicker"><em>bodies · in · field</em></div>
              <h3 class="card__title">
                识别到的天体
                <span class="card__sub">· 共 {{ celestialCount }} 个</span>
              </h3>
            </div>
            <div v-if="detail.celestialObjects && detail.celestialObjects.length > 0" class="objs">
              <div
                  v-for="obj in detail.celestialObjects"
                  :key="obj.en"
                  class="obj"
                  :class="`obj--${obj.type}`"
              >
                <div class="obj__type">{{ typeLabel(obj.type) }}</div>
                <div class="obj__zh">{{ obj.zh }}</div>
                <div class="obj__en"><em>{{ obj.en }}</em></div>
              </div>
            </div>
            <div v-else class="objs">
              <div v-for="obj in detail.objectsInField" :key="obj" class="obj obj--unknown">
                <div class="obj__type">天体</div>
                <div class="obj__zh">{{ obj }}</div>
                <div class="obj__en"><em>unclassified</em></div>
              </div>
            </div>
          </div>

          <!-- ③ tags -->
          <div v-if="detail.machineTags && detail.machineTags.length > 0" class="card">
            <div class="card__head">
              <div class="card__kicker"><em>machine · tags</em></div>
              <h3 class="card__title">天体类型标签</h3>
            </div>
            <div class="chips">
              <span v-for="tag in detail.machineTags" :key="tag" class="chip">{{ tag }}</span>
            </div>
          </div>

          <!-- ④ share -->
          <div class="card">
            <div class="card__head">
              <div class="card__kicker"><em>share · this · plate</em></div>
              <h3 class="card__title">分享识别结果</h3>
            </div>
            <p class="share-desc">将这份观测档案分享给另一位抬头看月亮的人</p>
            <div class="share-actions">
              <button class="quiet-btn" @click="handleShare">
                <span class="qb-mark">✧</span>
                <span>复制文字</span>
              </button>
              <button class="quiet-btn quiet-btn--primary" @click="handleShareToForum">
                <span class="qb-mark">✦</span>
                <span>分享到论坛 →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ reel: gear ═══════════ -->
      <section class="reel">
        <div class="reel__head">
          <div class="reel__head-l">
            <div class="reel__kicker"><em>suggested · equipment</em></div>
            <h3 class="reel__title">推荐观测器材</h3>
          </div>
          <div class="reel__head-r">
            <span v-if="recommendLoading" class="reel__hint">
              <span class="pulse"></span> 匹配中
            </span>
            <span v-else-if="recommendList.length > 0" class="reel__hint">
              根据识别天体类型智能推荐
            </span>
            <span
                v-if="!recommendLoading && recommendList.length > 0"
                class="link link--on"
                @click="router.push('/products')"
            >查看全部 →</span>
          </div>
        </div>

        <div v-if="recommendLoading" class="track">
          <div v-for="i in 4" :key="i" class="cell skeleton">
            <div class="sk-img"></div>
            <div class="sk-line sk-line--l"></div>
            <div class="sk-line sk-line--s"></div>
          </div>
        </div>

        <div v-else-if="recommendList.length > 0" class="track">
          <div
              v-for="product in recommendList"
              :key="product.id"
              class="cell"
              @click="goProduct(product.id)"
          >
            <div class="cell__img">
              <img
                  v-if="product.mainImage"
                  :src="product.mainImage"
                  :alt="product.productName"
                  @error="e => e.target.style.display='none'"
              />
              <div v-else class="cell__ph">🔭</div>
              <div class="cell__overlay">
                <span class="cell__cta">去看看 →</span>
              </div>
            </div>
            <div class="cell__name">{{ product.productName }}</div>
            <div class="cell__price">¥ {{ formatPrice(product.price) }}</div>
            <div v-if="product.reason" class="cell__reason">{{ product.reason }}</div>
          </div>
        </div>

        <div v-else class="reel__empty">
          <p><em>— no · matching · gear —</em></p>
          <span class="link link--on" @click="router.push('/products')">浏览全部器材 →</span>
        </div>
      </section>

      <!-- ═══════════ reel: course ═══════════ -->
      <section class="reel">
        <div class="reel__head">
          <div class="reel__head-l">
            <div class="reel__kicker"><em>related · studies</em></div>
            <h3 class="reel__title">推荐相关课程</h3>
          </div>
          <div class="reel__head-r">
            <span v-if="courseRecommendLoading" class="reel__hint">
              <span class="pulse"></span> 匹配中
            </span>
            <span v-else-if="courseRecommendList.length > 0" class="reel__hint">
              深入了解你识别到的天体
            </span>
            <span
                v-if="!courseRecommendLoading && courseRecommendList.length > 0"
                class="link link--on"
                @click="router.push('/course')"
            >查看全部 →</span>
          </div>
        </div>

        <div v-if="courseRecommendLoading" class="track">
          <div v-for="i in 4" :key="i" class="cell skeleton">
            <div class="sk-img"></div>
            <div class="sk-line sk-line--l"></div>
            <div class="sk-line sk-line--s"></div>
          </div>
        </div>

        <div v-else-if="courseRecommendList.length > 0" class="track">
          <div
              v-for="course in courseRecommendList"
              :key="course.id"
              class="cell cell--course"
              @click="goCourse(course.id)"
          >
            <div class="cell__img">
              <img
                  v-if="course.cover"
                  :src="course.cover"
                  :alt="course.title"
                  @error="e => e.target.style.display='none'"
              />
              <div v-else class="cell__ph">📖</div>
              <div class="cell__overlay">
                <span class="cell__cta">去学习 →</span>
              </div>
            </div>
            <div class="cell__name">{{ course.title }}</div>
            <div class="course-meta">
              <span class="course-badge">{{ course.difficultyText || '课程' }}</span>
              <span v-if="course.chapterCount" class="course-chapters">共 {{ course.chapterCount }} 章</span>
            </div>
            <div class="cell__reason">{{ course.subtitle || '点击查看详情' }}</div>
          </div>
        </div>

        <div v-else class="reel__empty">
          <p><em>— no · matching · courses —</em></p>
          <span class="link link--on" @click="router.push('/courses')">浏览全部课程 →</span>
        </div>
      </section>

    </section>

    <!-- ═══════════ 识别中 ═══════════ -->
    <section v-else-if="detail && detail.status === 0" class="phase phase--still">
      <div class="panel">
        <div class="orb">
          <div class="orb__halo"></div>
          <div class="orb__disc"></div>
          <div class="orb__ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none"
                      stroke="rgba(247,236,210,0.85)"
                      stroke-width="1.4"
                      stroke-dasharray="24 330"
                      stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <h2 class="panel__title">这份档案还在被月光阅读</h2>
        <p class="panel__reason">识别尚未完成，稍等片刻。</p>
        <button class="submit" @click="router.push(`/recognition/waiting?id=${recognitionId}`)">
          <span class="submit__en"><em>back · to · waiting</em></span>
          <span class="submit__cn">返回等待页</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getRecognitionResult, getRecognitionRecommend } from '@/api/recognition'
import { getRecognitionCourseRecommend } from '@/api/recommend'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const detail = ref(null)
const recognitionId = ref(null)
const imageLoading = ref(true)
const imageError = ref(false)

const recommendLoading = ref(false)
const recommendList = ref([])

const courseRecommendLoading = ref(false)
const courseRecommendList = ref([])

const hasCelestialData = computed(() => {
  if (!detail.value) return false
  return (detail.value.celestialObjects && detail.value.celestialObjects.length > 0) ||
      (detail.value.objectsInField && detail.value.objectsInField.length > 0)
})

const celestialCount = computed(() => {
  if (!detail.value) return 0
  return detail.value.celestialObjects?.length || detail.value.objectsInField?.length || 0
})

onMounted(async () => {
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
    if (detail.value?.status === 1) {
      fetchRecommend()
      fetchCourseRecommend()
    }
  } catch (err) {
    ElMessage.error('加载识别结果失败，请重试')
    console.error('[RecognitionResult] 加载失败:', err)
  } finally {
    loading.value = false
  }
}

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

async function fetchCourseRecommend() {
  courseRecommendLoading.value = true
  try {
    const res = await getRecognitionCourseRecommend(recognitionId.value, { limit: 6 })
    courseRecommendList.value = res.data || []
  } catch (err) {
    console.warn('[RecognitionResult] 加载推荐课程失败:', err)
    courseRecommendList.value = []
  } finally {
    courseRecommendLoading.value = false
  }
}

function handleImageError() { imageLoading.value = false; imageError.value = true }
function retryImage() {
  imageError.value = false; imageLoading.value = true
  if (detail.value?.resultImageUrl) {
    detail.value.resultImageUrl = detail.value.resultImageUrl.split('?')[0] + '?t=' + Date.now()
  }
}

function goProduct(productId) { router.push(`/product/${productId}`) }
function goCourse(courseId) { router.push(`/course/${courseId}`) }

function formatRA(raDeg) {
  if (raDeg == null) return '—'
  const h = Math.floor(Number(raDeg) / 15)
  const mT = (Number(raDeg) / 15 - h) * 60
  const m = Math.floor(mT)
  const s = ((mT - m) * 60).toFixed(1)
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(4, '0')}s`
}
function formatDec(decDeg) {
  if (decDeg == null) return '—'
  const sign = Number(decDeg) >= 0 ? '+' : '−'
  const abs = Math.abs(Number(decDeg))
  const d = Math.floor(abs)
  const mT = (abs - d) * 60
  const m = Math.floor(mT)
  const s = ((mT - m) * 60).toFixed(1)
  return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(4, '0')}″`
}

function typeLabel(type) {
  return { nebula: '星云', galaxy: '星系', cluster: '星团', constellation: '星座', unknown: '天体' }[type] || '天体'
}

function formatPrice(price) {
  if (price == null) return '--'
  return Number(price).toFixed(2)
}

function handleShareToForum() {
  if (!detail.value) return
  const d = detail.value
  const objectStr = d.celestialObjects?.length
      ? d.celestialObjects.map(o => o.zh || o.en).filter(Boolean).slice(0, 3).join('、')
      : (d.objectsInField?.slice(0, 3).join('、') || '星空')
  const presetTitle = `🌌 我用AI识别到了${objectStr}`
  const lines = ['📡 通过天文商城AI星图识别系统，我成功识别出以下天体：', '']
  if (d.celestialObjects?.length) {
    d.celestialObjects.forEach((o, i) => {
      const zh = o.zh || ''
      const en = o.en ? `(${o.en})` : ''
      const type = o.type ? ` - ${typeLabel(o.type)}` : ''
      lines.push(`${i + 1}. ${zh}${en}${type}`)
    })
  } else if (d.objectsInField?.length) {
    d.objectsInField.forEach((o, i) => lines.push(`${i + 1}. ${o}`))
  }
  lines.push('')
  if (d.raFormatted) lines.push(`赤经：${d.raFormatted}`)
  if (d.decFormatted) lines.push(`赤纬：${d.decFormatted}`)
  if (d.radiusFormatted) lines.push(`视野半径：${d.radiusFormatted}`)
  lines.push('')
  lines.push('✨ 一起来探索星空吧！')
  const presetContent = lines.join('\n')
  const presetImages = d.resultImageUrl ? [d.resultImageUrl] : []

  router.push({
    path: '/forum/publish',
    query: {
      recognitionId: recognitionId.value,
      title: presetTitle,
      content: presetContent,
      images: JSON.stringify(presetImages),
      tags: JSON.stringify(['AI识别', '星空'])
    }
  })
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
    d.raFormatted ? `赤经(RA)：${d.raFormatted}` : null,
    d.decFormatted ? `赤纬(Dec)：${d.decFormatted}` : null,
    d.orientationFormatted ? `方向角：${d.orientationFormatted}` : null,
    d.radiusFormatted ? `视野半径：${d.radiusFormatted}` : null,
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

<style lang="scss" scoped>
/* ── palette (shared with StarRecognition / Waiting / History) ───── */
$moon:      #f7ecd2;
$moon-soft: #ede2c3;
$cream:     #f3e9cf;
$cream-dim: rgba(243,233,207,0.72);
$cream-low: rgba(243,233,207,0.42);
$cream-xlow:rgba(243,233,207,0.22);

$sky-top: #1a2547;
$sky-mid: #0e1731;
$sky-bot: #070b1d;

$violet:  #9a86d1;
$rose:    #d99db4;
$bloom:   #6b8ed6;
$petal:   #f2e4c7;

$ok:   #a6dcbc;
$warn: #e9b7b7;
$mid:  #b9c8e8;

$sans:  'Inter','PingFang SC','Microsoft YaHei','Hiragino Sans GB','Helvetica Neue',Arial,sans-serif;
$serif: 'Cormorant Garamond','Playfair Display',Georgia,'Songti SC',serif;

/* ── page base ───────────────────────────────────────────────────── */
.rr {
  min-height: 100vh;
  position: relative;
  color: $cream;
  font-family: $sans;
  overflow-x: hidden;
  padding-bottom: 120px;
  background: $sky-bot;
}

/* painterly sky */
.sky {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(154,134,209,0.18), transparent 60%),
    radial-gradient(900px 520px at 85% 10%, rgba(217,157,180,0.10), transparent 60%),
    radial-gradient(1400px 900px at 50% 110%, rgba(107,142,214,0.14), transparent 70%),
    linear-gradient(180deg, $sky-top 0%, $sky-mid 45%, $sky-bot 100%);
}

.stars {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    radial-gradient(1.2px 1.2px at 18% 22%, rgba(255,255,255,0.85), transparent 55%),
    radial-gradient(1px 1px at 72% 18%, rgba(247,236,210,0.75), transparent 55%),
    radial-gradient(1px 1px at 34% 68%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(1.4px 1.4px at 88% 54%, rgba(185,200,232,0.7), transparent 55%),
    radial-gradient(1px 1px at 9% 82%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(1px 1px at 57% 88%, rgba(217,157,180,0.55), transparent 55%),
    radial-gradient(1.2px 1.2px at 44% 36%, rgba(255,255,255,0.4), transparent 55%),
    radial-gradient(1px 1px at 95% 86%, rgba(247,236,210,0.55), transparent 55%);
  background-size: 720px 720px, 940px 940px, 620px 620px, 1100px 1100px,
                   820px 820px, 1020px 1020px, 520px 520px, 1220px 1220px;
  opacity: .85;
  animation: twinkle 6.5s ease-in-out infinite alternate;
}
@keyframes twinkle { 0% { opacity: .55; } 100% { opacity: .95; } }

.grain {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  mix-blend-mode: overlay;
  opacity: .22;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.82  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

/* ── topbar ──────────────────────────────────────────────────────── */
.topbar {
  position: relative; z-index: 3;
  max-width: 1440px;
  margin: 0 auto;
  padding: 26px 40px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.crumbs {
  display: flex; align-items: center; gap: 10px;
  font-family: $serif;
  font-size: 14px;
  font-style: italic;
  letter-spacing: .6px;
  color: $cream-dim;

  &--end { justify-content: flex-end; }
}
.crumb { cursor: pointer; transition: color .2s; &:hover { color: $moon; } }

/* ── orb (reusable moon) ─────────────────────────────────────────── */
.orb {
  position: relative;
  width: 120px; height: 120px;
  flex-shrink: 0;

  &__halo {
    position: absolute; inset: -16px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(247,236,210,0.26), transparent 70%);
    animation: breath 5s ease-in-out infinite alternate;
  }
  &__disc {
    position: absolute; inset: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 32%, #fff7e0, $moon 55%, $moon-soft 100%);
    box-shadow: 0 0 30px rgba(247,236,210,0.25);
  }
  &__ring {
    position: absolute; inset: 0;
    animation: spin 2.2s linear infinite;
    svg { width: 100%; height: 100%; }
  }

  &--sm { width: 86px; height: 86px; .orb__halo { inset: -12px; } .orb__disc { inset: 7px; } }
  &--xs { width: 54px; height: 54px; .orb__halo { inset: -8px; } .orb__disc { inset: 5px; } }
}
@keyframes breath {
  0%   { opacity: .55; transform: scale(.96); }
  100% { opacity: .95; transform: scale(1.04); }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse-dot {
  0%,100% { opacity: .4; transform: scale(.8); }
  50%     { opacity: 1;  transform: scale(1.15); }
}
.pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: currentColor;
  display: inline-block;
  animation: pulse-dot 1.2s ease infinite;
  margin-right: 4px;
}

/* ── phases ──────────────────────────────────────────────────────── */
.phase {
  position: relative; z-index: 2;
  max-width: 1440px;
  margin: 0 auto;
  padding: 60px 40px 0;
}
.phase--loading {
  min-height: 60vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 22px;

  .phase__title {
    font-family: $serif;
    font-size: 24px;
    letter-spacing: 3px;
    color: $moon;
  }
  .phase__en {
    font-family: $serif; font-style: italic;
    font-size: 13px; letter-spacing: 2px;
    color: $cream-low;
  }
}
.phase--fail, .phase--still {
  min-height: 70vh;
  display: flex; align-items: center; justify-content: center;
}

/* ── panels (fail / still) ──────────────────────────────────────── */
.panel {
  position: relative;
  max-width: 560px;
  padding: 52px 44px 44px;
  border: 1px solid $cream-xlow;
  background: linear-gradient(180deg, rgba(247,236,210,0.03), rgba(247,236,210,0.01));
  border-radius: 4px;
  text-align: center;
  backdrop-filter: blur(6px);

  &__kicker {
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    letter-spacing: 2px;
    color: $cream-low;
    margin-bottom: 14px;
  }
  &__title {
    font-family: $serif;
    font-size: 30px;
    letter-spacing: 3px;
    color: $moon;
    margin: 0 0 14px;
    font-weight: 500;
  }
  &__reason {
    font-family: $sans;
    font-size: 14px;
    color: $cream-dim;
    letter-spacing: .5px;
    line-height: 1.7;
    margin: 0 0 28px;
  }

  .orb { margin: 0 auto 20px; }
}
.panel--fail .panel__kicker { color: $warn; }

.tips {
  text-align: left;
  border: 1px solid $cream-xlow;
  border-left: 2px solid $warn;
  border-radius: 2px;
  padding: 18px 22px;
  margin-bottom: 28px;
  background: rgba(247,236,210,0.02);

  &__head {
    font-family: $serif; font-style: italic;
    font-size: 14px; letter-spacing: 1.5px;
    color: $warn;
    margin-bottom: 10px;
  }
  ul {
    margin: 0;
    padding-left: 22px;
    color: $cream-dim;
    font-family: $sans;
    font-size: 13px;
    line-height: 1.9;
    list-style: '— ';
    li::marker { color: $cream-low; }
  }
}

/* ── dossier head ────────────────────────────────────────────────── */
.phase--ok { padding: 50px 40px 0; }

.head {
  margin-bottom: 48px;

  &__kicker {
    font-family: $serif;
    font-style: italic;
    font-size: 14px;
    letter-spacing: 2px;
    color: $cream-low;
    margin-bottom: 14px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 22px;
    flex-wrap: wrap;
  }

  &__num {
    font-family: $serif;
    font-weight: 500;
    font-size: 64px;
    line-height: 1;
    color: $moon;
    letter-spacing: 4px;
  }
  &__sep {
    width: 1px; height: 48px;
    background: $cream-xlow;
  }
  &__meta {
    display: flex; flex-direction: column;
    gap: 6px;
  }

  &__rule {
    margin-top: 32px;
    display: flex; align-items: center;
    gap: 14px;
    .dot { width: 4px; height: 4px; border-radius: 50%; background: $cream-low; }
    .line { flex: 1; max-width: 140px; height: 1px; background: linear-gradient(90deg, transparent, $cream-xlow, transparent); }
    .glyph { font-family: $serif; font-size: 18px; color: $moon; }
  }
}
.mrow {
  display: inline-flex; gap: 12px; align-items: baseline;
  .mk {
    font-family: $serif; font-style: italic;
    font-size: 13px; letter-spacing: 1px;
    color: $cream-low;
    width: 80px;
  }
  .mv {
    font-family: $sans;
    font-size: 13.5px;
    color: $cream;
    letter-spacing: .5px;
  }
}

/* ── grid ────────────────────────────────────────────────────────── */
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 32px;
  margin-bottom: 80px;
}

/* plate */
.plate-wrap { min-width: 0; }
.plate {
  position: relative;
  aspect-ratio: 1 / 1;
  background:
    radial-gradient(circle at center, rgba(247,236,210,0.04), transparent 70%),
    rgba(7,11,29,0.55);
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  &__load, &__err {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    color: $cream-dim;
    font-family: $serif;
    font-style: italic;
    font-size: 14px;
    letter-spacing: 1px;
    p {
      margin: 0;
      font-family: $sans; font-style: normal;
      font-size: 13.5px;
      letter-spacing: .5px;
    }
  }
  &__err-glyph {
    font-size: 36px;
    color: $moon-soft;
    opacity: .8;
  }

  &__tag {
    position: absolute;
    left: 14px; bottom: 14px;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 5px 12px;
    background: rgba(7,11,29,0.7);
    border: 1px solid $cream-xlow;
    border-radius: 999px;
    font-family: $serif; font-style: italic;
    font-size: 12px;
    letter-spacing: 1px;
    .pt-k { color: $cream-low; }
    .pt-v { color: $moon; font-style: normal; letter-spacing: 1.5px; }
  }
}

.plate-caption {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: $serif;
  font-style: italic;
  font-size: 13px;
  letter-spacing: .8px;
  color: $cream-low;

  &__link {
    color: $moon !important;
    font-family: $sans !important;
    font-style: normal !important;
    font-size: 12.5px !important;
    letter-spacing: 1.2px !important;
    &:hover { color: #fff7e0 !important; }
  }
}

/* ── data cards ──────────────────────────────────────────────────── */
.data {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  position: relative;
  background: linear-gradient(180deg, rgba(247,236,210,0.035), rgba(247,236,210,0.01));
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  padding: 24px 24px 26px;
  backdrop-filter: blur(6px);

  &__head { margin-bottom: 18px; }
  &__kicker {
    font-family: $serif; font-style: italic;
    font-size: 12.5px;
    letter-spacing: 2px;
    color: $cream-low;
    margin-bottom: 6px;
  }
  &__title {
    font-family: $serif;
    font-size: 22px;
    font-weight: 500;
    color: $moon;
    margin: 0;
    letter-spacing: 2.5px;
  }
  &__sub {
    font-family: $serif; font-style: italic;
    font-size: 14px;
    color: $cream-low;
    font-weight: 400;
    letter-spacing: 1px;
    margin-left: 4px;
  }
}

/* coords */
.coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.coord {
  padding: 14px 16px;
  background: rgba(7,11,29,0.55);
  border: 1px solid $cream-xlow;
  border-radius: 2px;

  &__k {
    font-family: $serif; font-style: italic;
    font-size: 12px;
    letter-spacing: 1.5px;
    color: $cream-low;
    margin-bottom: 8px;
  }
  &__v {
    font-family: $serif;
    font-size: 18px;
    color: $moon;
    letter-spacing: 1px;
    font-weight: 500;
    margin-bottom: 4px;
    word-break: break-all;
    line-height: 1.25;
  }
  &__d {
    font-family: $sans;
    font-size: 11.5px;
    letter-spacing: 1px;
    color: $cream-low;
  }
}

/* objects */
.objs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.obj {
  padding: 14px 16px;
  border: 1px solid $cream-xlow;
  background: rgba(7,11,29,0.5);
  border-radius: 2px;
  transition: all .25s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: currentColor;
    background: rgba(7,11,29,0.75);
  }

  &__type {
    display: inline-block;
    font-family: $sans;
    font-size: 10.5px;
    letter-spacing: 1.5px;
    padding: 2px 9px;
    border-radius: 999px;
    margin-bottom: 8px;
    border: 1px solid currentColor;
  }
  &__zh {
    font-family: $serif;
    font-size: 18px;
    color: $moon;
    font-weight: 500;
    letter-spacing: 2px;
    margin-bottom: 3px;
  }
  &__en {
    font-family: $serif; font-style: italic;
    font-size: 12.5px;
    letter-spacing: 1px;
    color: $cream-low;
  }

  &--nebula         { color: $rose; }
  &--galaxy         { color: $violet; }
  &--cluster        { color: $moon-soft; }
  &--constellation  { color: $bloom; }
  &--unknown        { color: $mid; }
}

/* chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  font-family: $sans;
  font-size: 12px;
  letter-spacing: 1px;
  color: $moon-soft;
  padding: 5px 14px;
  border: 1px solid $cream-xlow;
  background: rgba(247,236,210,0.04);
  border-radius: 999px;
  transition: all .2s;
  &:hover {
    background: rgba(247,236,210,0.1);
    color: $moon;
    border-color: $cream-low;
  }
}

/* share */
.share-desc {
  font-family: $serif; font-style: italic;
  font-size: 14px;
  color: $cream-dim;
  margin: 0 0 16px;
  letter-spacing: .5px;
}
.share-actions {
  display: flex; gap: 10px; flex-wrap: wrap;
}

/* ── buttons ─────────────────────────────────────────────────────── */
.quiet-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid $cream-xlow;
  color: $cream-dim;
  font-family: $sans;
  font-size: 12.5px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .25s;
  border-radius: 999px;

  .qb-mark { color: $moon; font-size: 11px; }
  &:hover {
    color: $moon;
    border-color: $cream-low;
    background: rgba(247,236,210,0.04);
  }
  &--primary {
    color: $moon;
    border-color: $cream-low;
    background: rgba(247,236,210,0.08);
    &:hover { background: rgba(247,236,210,0.16); }
  }
}

.submit {
  display: inline-flex; flex-direction: column; align-items: center;
  gap: 4px;
  padding: 16px 52px;
  background: linear-gradient(180deg, rgba(247,236,210,0.12), rgba(247,236,210,0.04));
  border: 1px solid $cream-low;
  border-radius: 999px;
  cursor: pointer;
  transition: all .3s;
  color: $moon;
  font-family: $sans;

  &__en {
    font-family: $serif; font-style: italic;
    font-size: 12px; letter-spacing: 2px;
    color: $cream-dim;
  }
  &__cn { font-size: 15px; letter-spacing: 4px; }

  &:hover {
    background: linear-gradient(180deg, rgba(247,236,210,0.22), rgba(247,236,210,0.08));
    box-shadow: 0 0 40px rgba(247,236,210,0.18);
    transform: translateY(-1px);
  }
}

.link {
  font-family: $sans;
  font-size: 12.5px;
  letter-spacing: 1.2px;
  color: $cream-dim;
  cursor: pointer;
  padding: 6px 2px;
  transition: color .2s;
  user-select: none;
  white-space: nowrap;
  border-bottom: 1px solid transparent;

  &:hover { color: $moon; border-bottom-color: $cream-low; }
  &--on { color: $moon; }
}

/* ── reels ───────────────────────────────────────────────────────── */
.reel {
  margin-bottom: 64px;

  &__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 22px;
    padding-bottom: 16px;
    border-bottom: 1px solid $cream-xlow;
    gap: 16px;
    flex-wrap: wrap;
  }
  &__head-l { display: flex; flex-direction: column; gap: 6px; }
  &__head-r {
    display: flex; align-items: center; gap: 20px;
    font-family: $serif; font-style: italic;
    font-size: 13px;
    color: $cream-low;
  }
  &__kicker {
    font-family: $serif; font-style: italic;
    font-size: 13px;
    letter-spacing: 1.5px;
    color: $cream-low;
  }
  &__title {
    font-family: $serif;
    font-size: 26px;
    font-weight: 500;
    letter-spacing: 3px;
    color: $moon;
    margin: 0;
  }
  &__hint { color: $cream-low; }
  &__empty {
    text-align: center;
    padding: 60px 20px;
    border: 1px dashed $cream-xlow;
    border-radius: 4px;
    p {
      font-family: $serif; font-style: italic;
      font-size: 14px;
      color: $cream-low;
      letter-spacing: 1.5px;
      margin: 0 0 14px;
    }
  }
}

.track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 230px;
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 18px;
  scrollbar-width: thin;
  scrollbar-color: $cream-xlow transparent;
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: $cream-xlow; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: $cream-low; }
}

.cell {
  position: relative;
  background: linear-gradient(180deg, rgba(247,236,210,0.035), rgba(247,236,210,0.01));
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  cursor: pointer;
  transition: all .25s ease;
  padding-bottom: 18px;
  min-width: 0;
  overflow: hidden;

  &:hover {
    border-color: $cream-low;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(7,11,29,0.4);
    .cell__overlay { opacity: 1; }
  }

  &__img {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: rgba(7,11,29,0.6);
    img { width: 100%; height: 100%; object-fit: cover; }
  }
  &__ph {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 40px; color: $cream-low;
  }
  &__overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(7,11,29,0.7);
    opacity: 0;
    transition: opacity .25s;
  }
  &__cta {
    font-family: $sans;
    font-size: 12px;
    letter-spacing: 2px;
    color: $moon;
    padding: 8px 18px;
    border: 1px solid $cream-low;
    border-radius: 999px;
    background: rgba(247,236,210,0.08);
  }
  &__name {
    padding: 14px 16px 4px;
    font-family: $serif;
    font-size: 15.5px;
    color: $moon;
    font-weight: 500;
    letter-spacing: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.45;
    min-height: 45px;
  }
  &__price {
    padding: 0 16px 4px;
    font-family: $serif;
    font-size: 18px;
    color: $moon-soft;
    letter-spacing: 1px;
    font-weight: 500;
  }
  &__reason {
    padding: 0 16px;
    font-family: $serif; font-style: italic;
    font-size: 12px;
    color: $cream-low;
    letter-spacing: .5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.course-meta {
  padding: 0 16px 4px;
  display: flex; gap: 8px; align-items: center;
  .course-badge {
    font-family: $sans;
    font-size: 10.5px;
    letter-spacing: 1.5px;
    color: $violet;
    border: 1px solid rgba(154,134,209,0.4);
    padding: 2px 8px;
    border-radius: 999px;
  }
  .course-chapters {
    font-family: $serif; font-style: italic;
    font-size: 12px;
    color: $cream-low;
    letter-spacing: .5px;
  }
}

/* skeletons */
.skeleton .sk-img {
  aspect-ratio: 1 / 1;
  background: linear-gradient(90deg,
    rgba(247,236,210,0.04),
    rgba(247,236,210,0.10),
    rgba(247,236,210,0.04));
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
}
.sk-line {
  height: 10px;
  margin: 14px 16px 0;
  background: linear-gradient(90deg,
    rgba(247,236,210,0.04),
    rgba(247,236,210,0.10),
    rgba(247,236,210,0.04));
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
  border-radius: 2px;
  &--l { width: 80%; }
  &--s { width: 50%; }
}
@keyframes skeleton {
  0%,100% { background-position: 0% 0; }
  50%     { background-position: -100% 0; }
}

/* element-plus loading */
:deep(.el-loading-mask) {
  background-color: rgba(7,11,29,0.65);
  .el-loading-spinner .path { stroke: $moon; }
}

/* responsive */
@media (max-width: 1100px) {
  .grid { grid-template-columns: 1fr; }
  .coords, .objs { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .topbar { padding: 20px 22px 14px; flex-wrap: wrap; gap: 10px; }
  .phase, .phase--ok { padding: 30px 22px 0; }
  .head__num { font-size: 44px; letter-spacing: 2px; }
  .head__sep { display: none; }
  .coords, .objs { grid-template-columns: 1fr; }
  .track { grid-auto-columns: 180px; }
  .reel__title { font-size: 22px; letter-spacing: 2px; }
  .panel { padding: 40px 24px 32px; }
}

@media (prefers-reduced-motion: reduce) {
  .stars, .orb__halo, .orb__ring, .pulse, .skeleton .sk-img, .sk-line { animation: none !important; }
}
</style>
