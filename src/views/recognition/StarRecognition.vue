<template>
  <div class="page">
    <!-- Minimal top bar -->
    <header class="topbar">
      <div class="topbar__inner">
        <span class="tb-link" @click="router.push('/home')">首页</span>
        <span class="tb-dot">·</span>
        <span class="tb-current">AI 星图识别</span>
        <span class="tb-spacer"></span>
        <span class="tb-link" @click="router.push('/recognition/history')">识别历史</span>
      </div>
    </header>

    <!-- HERO: painterly scene — moon IS the dropzone -->
    <section class="hero">
      <div class="hero__letterbox hero__letterbox--top"></div>
      <div class="hero__letterbox hero__letterbox--bot"></div>

      <!-- painted sky + stars + soft drifting clouds -->
      <div class="sky"></div>
      <div class="stars stars--a"></div>
      <div class="stars stars--b"></div>
      <div class="stars stars--c"></div>

      <!-- shooting stars -->
      <div class="shoot shoot--a"></div>
      <div class="shoot shoot--b"></div>

      <svg class="clouds" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="22"/>
          </filter>
        </defs>
        <g filter="url(#softBlur)" fill="#3a4a82" opacity=".35">
          <ellipse cx="200" cy="180" rx="260" ry="28" class="cloud cloud--a"/>
          <ellipse cx="1260" cy="260" rx="340" ry="36" class="cloud cloud--b"/>
          <ellipse cx="900" cy="120" rx="220" ry="22" class="cloud cloud--c"/>
          <ellipse cx="500" cy="340" rx="300" ry="26" class="cloud cloud--d" opacity=".6"/>
        </g>
      </svg>

      <!-- THE MOON = DROPZONE -->
      <div
          class="moon"
          :class="{
            'is-drag': isDragover,
            'is-ready': previewUrl,
            'is-busy': isCompressing || isSubmitting
          }"
          @click="triggerFileInput"
          @dragover.prevent="isDragover = true"
          @dragleave.prevent="isDragover = false"
          @drop.prevent="handleDrop"
      >
        <div class="moon__halo moon__halo--outer"></div>
        <div class="moon__halo moon__halo--inner"></div>
        <div class="moon__iris"></div>
        <div class="moon__disc">
          <img v-if="previewUrl" :src="previewUrl" class="moon__img" alt="star field preview" />
          <div v-else class="moon__empty">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 8v16m0 0l-6-6m6 6l6-6M6 28h24" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            </svg>
            <span class="moon__empty-main">将星图置入月中</span>
            <span class="moon__empty-sub">拖拽 &nbsp;/&nbsp; 点击上传</span>
          </div>
          <!-- busy ring -->
          <svg v-if="isCompressing || isSubmitting" class="moon__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="47" fill="none" stroke="#f7ecd2" stroke-width="0.6" stroke-dasharray="60 230" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- hand-drawn splash marks around moon -->
        <svg class="moon__ticks" viewBox="-320 -320 640 640" aria-hidden="true">
          <g stroke="#f7ecd2" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="0.78">
            <path d="M -260 -180 q 10 -8 22 -2"/>
            <path d="M -210 -240 q 8 4 6 16"/>
            <path d="M 180 -250 q 10 2 14 14"/>
            <path d="M 250 -150 q -4 10 4 20"/>
            <path d="M 260 60 q -10 6 -10 18"/>
            <path d="M 180 220 q 10 -2 18 6"/>
            <path d="M -200 230 q -4 -10 4 -18"/>
            <path d="M -270 40 q 10 -4 14 6"/>
            <path d="M -120 -280 q 6 -2 10 6"/>
            <path d="M 80 -280 q -2 6 6 10"/>
          </g>
          <g fill="#f7ecd2" opacity="0.68">
            <circle cx="-290" cy="-80" r="1.6"/>
            <circle cx="-250" cy="140" r="1.4"/>
            <circle cx="-160" cy="-290" r="1.5"/>
            <circle cx="120" cy="-290" r="1.4"/>
            <circle cx="290" cy="-60" r="1.8"/>
            <circle cx="280" cy="170" r="1.5"/>
            <circle cx="-40" cy="280" r="1.4"/>
            <circle cx="80" cy="280" r="1.6"/>
          </g>
        </svg>

        <!-- reset btn when ready -->
        <span v-if="previewUrl && !isSubmitting" class="moon__reset" @click.stop="clearImage">
          重新选择
        </span>
      </div>

      <input
          ref="fileInputRef"
          type="file"
          accept=".jpg,.jpeg,.png,.fits,.fit"
          style="display:none"
          @change="handleFileChange"
      />

      <!-- foreground: flora + hills + distant observatories + lone figure -->
      <svg class="scene" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="hillFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#050814" stop-opacity="0.72"/>
            <stop offset="100%" stop-color="#050814" stop-opacity="1"/>
          </linearGradient>
        </defs>

        <!-- far hill (bluish) -->
        <path d="M 0 540 Q 300 490 560 510 Q 820 530 1080 495 Q 1340 460 1600 500 L 1600 600 L 0 600 Z"
              fill="#0b1530" opacity="0.85"/>

        <!-- distant observatory — left -->
        <g transform="translate(280 512)" fill="#050814">
          <path d="M -18 0 Q -18 -18 0 -18 Q 18 -18 18 0 Z"/>
          <rect x="-16" y="0" width="32" height="24"/>
          <rect x="-1" y="-8" width="2" height="12"/>
          <!-- little star atop -->
          <circle class="top-star" cx="0" cy="-22" r="1.6" fill="#f7ecd2"/>
        </g>

        <!-- distant observatory — right (smaller, farther) -->
        <g transform="translate(1330 504)" fill="#050814" opacity="0.92">
          <path d="M -14 0 Q -14 -14 0 -14 Q 14 -14 14 0 Z"/>
          <rect x="-12" y="0" width="24" height="20"/>
        </g>

        <!-- tall spire — right of center -->
        <g transform="translate(1100 508)" fill="#050814" opacity="0.88">
          <path d="M -3 -42 L 0 -62 L 3 -42 L 8 0 L -8 0 Z"/>
          <circle class="top-star top-star--b" cx="0" cy="-44" r="2" fill="#f7ecd2" opacity="0.7"/>
        </g>

        <!-- near hill (darker gradient) -->
        <path d="M 0 600 L 0 545 Q 200 510 420 530 Q 640 548 860 522 Q 1120 492 1320 520 Q 1460 540 1600 525 L 1600 600 Z"
              fill="url(#hillFade)"/>

        <!-- LEFT flora: branching silhouette with blossoms -->
        <g class="flora flora--left">
          <g fill="#050814" opacity="0.95">
            <path d="M 0 600 L 0 410
                     C 18 388 38 398 36 370
                     C 34 340 58 328 50 300
                     C 68 278 82 286 74 258
                     L 94 600 Z"/>
          </g>
          <g stroke="#050814" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.9">
            <path d="M 38 378 Q 72 360 90 330"/>
            <path d="M 52 320 Q 90 305 110 278"/>
            <path d="M 72 262 Q 100 252 116 230"/>
            <path d="M 90 330 L 108 318"/>
            <path d="M 110 278 L 128 268"/>
          </g>
          <g fill="#050814">
            <circle cx="90" cy="330" r="3"/>
            <circle cx="108" cy="318" r="2.2"/>
            <circle cx="110" cy="278" r="3"/>
            <circle cx="128" cy="268" r="2.2"/>
            <circle cx="116" cy="230" r="2.8"/>
            <circle cx="36" cy="370" r="2.5"/>
          </g>
        </g>

        <!-- RIGHT flora: mirror branching silhouette -->
        <g class="flora flora--right">
          <g fill="#050814" opacity="0.95">
            <path d="M 1600 600 L 1600 400
                     C 1582 378 1560 388 1562 358
                     C 1564 326 1540 314 1548 284
                     C 1528 262 1512 272 1520 242
                     L 1500 600 Z"/>
          </g>
          <g stroke="#050814" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.9">
            <path d="M 1558 366 Q 1522 348 1502 316"/>
            <path d="M 1544 308 Q 1504 292 1482 262"/>
            <path d="M 1522 246 Q 1494 236 1478 214"/>
            <path d="M 1502 316 L 1484 304"/>
            <path d="M 1482 262 L 1464 252"/>
          </g>
          <g fill="#050814">
            <circle cx="1502" cy="316" r="3"/>
            <circle cx="1484" cy="304" r="2.2"/>
            <circle cx="1482" cy="262" r="3"/>
            <circle cx="1464" cy="252" r="2.2"/>
            <circle cx="1478" cy="214" r="2.8"/>
            <circle cx="1562" cy="358" r="2.5"/>
          </g>
        </g>

        <!-- glowing blue bloom field — a carpet of tiny flowers along the horizon -->
        <g class="bloom" fill="#6ea6ea" opacity="0.85">
          <g class="bloom__cluster" transform="translate(160 582)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(220 588) scale(.85)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(340 584) scale(1.1)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(470 586)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(560 590) scale(.8)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(700 588) scale(1.05)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(900 586)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(1020 590) scale(.9)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(1180 584) scale(1.1)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(1280 590) scale(.85)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
          <g class="bloom__cluster" transform="translate(1400 586)">
            <circle cx="0"  cy="0"  r="2.2"/><circle cx="3"  cy="-2" r="1.8"/><circle cx="-3" cy="-2" r="1.8"/>
            <circle cx="2"  cy="2"  r="1.8"/><circle cx="-2" cy="2"  r="1.8"/><circle cx="0"  cy="0"  r="0.8" fill="#f7ecd2"/>
          </g>
        </g>

        <!-- water ripples at observer's feet -->
        <g class="ripples" transform="translate(800 552)" fill="none" stroke="#cfd6ff" stroke-opacity=".55">
          <ellipse class="ripple ripple--1" cx="0" cy="0" rx="24" ry="4" stroke-width=".8"/>
          <ellipse class="ripple ripple--2" cx="0" cy="0" rx="24" ry="4" stroke-width=".7"/>
          <ellipse class="ripple ripple--3" cx="0" cy="0" rx="24" ry="4" stroke-width=".6"/>
        </g>

        <!-- central figure: Columbina-style silhouette — slim, windswept, moonlight at feet -->
        <g transform="translate(800 552) scale(1.55)" fill="#050814">
          <!-- water shadow -->
          <ellipse cx="0" cy="0" rx="16" ry="2" opacity="0.55"/>
          <!-- moonlight pool on water at feet (reuses glow-core/aura anim) -->
          <ellipse class="glow-aura" cx="2" cy="0" rx="14" ry="2" fill="#f7ecd2" opacity="0.3"/>
          <ellipse class="glow-core" cx="2" cy="0" rx="6"  ry="1" fill="#f7ecd2" opacity="0.7"/>

          <g class="figure">
            <!-- LONG hair cascading to the left — the defining silhouette read -->
            <path d="M -3 -52
                     C -14 -46 -26 -36 -32 -20
                     C -38 -6  -32 2  -22 2
                     L -14 2
                     C -18 -6  -18 -18 -12 -30
                     C -8  -38 -4 -44 -2 -46 Z"
                  opacity="0.97"/>

            <!-- wind-blown hair tip (trailing stroke — reuses cape anim) -->
            <path class="cape cape--l"
                  d="M -26 -10 Q -40 -4 -38 4 L -30 4 Q -32 -2 -24 -8 Z"
                  opacity="0.85"/>

            <!-- neck + slim bodice -->
            <path d="M -2 -50 L -2.5 -32 L 2.5 -32 L 2 -50 Z"/>

            <!-- SHORT dress — stops mid-thigh so legs show below -->
            <path d="M -3 -32
                     L -9 -14
                     L 9 -14
                     L 3 -32 Z"/>

            <!-- dress back hem kicked out by wind (right) -->
            <path class="cape cape--r"
                  d="M 3 -22 Q 13 -16 15 -6 Q 13 -3 9 -5 L 3 -14 Z"
                  opacity="0.9"/>

            <!-- dress inner pleat shadow -->
            <path d="M -1 -32 L -4 -14 L 4 -14 L 1 -32 Z" opacity="0.86"/>

            <!-- SLIM LEGS (visible beneath short dress — key Columbina trait) -->
            <!-- left leg -->
            <path d="M -3 -14 L -3.2 -2 L -0.6 -2 L -0.6 -14 Z"/>
            <!-- right leg -->
            <path d="M 0.6 -14 L 0.6 -2 L 3.2 -2 L 3 -14 Z"/>

            <!-- head -->
            <circle cx="0" cy="-54" r="4.2"/>

            <!-- very subtle wing tips — barely visible, just shape hints -->
            <path d="M -2.5 -57 Q -7 -60 -9 -57 Q -5 -56 -3 -57 Z" opacity="0.88"/>
            <path d="M  2.5 -57 Q  7 -60  9 -57 Q  5 -56  3 -57 Z" opacity="0.88"/>
          </g>
        </g>

        <!-- scattered grass / ink flecks on horizon -->
        <g stroke="#050814" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".7">
          <path d="M 180 582 L 178 568"/>
          <path d="M 210 582 L 213 566"/>
          <path d="M 1380 580 L 1378 566"/>
          <path d="M 1410 580 L 1414 566"/>
          <path d="M 620 568 L 622 558"/>
          <path d="M 980 562 L 983 552"/>
        </g>
      </svg>

      <!-- TITLE copy (floats on left of moon) -->
      <div class="hero__copy">
        <div class="kicker">No. 01 &nbsp;—&nbsp; 仰望夜空</div>
        <h1 class="title">
          星图<br />
          <em>识别</em>
        </h1>
        <p class="desc">
          上传你拍摄的星野照片，由 Astrometry.net 解算赤经赤纬、视野范围，并辨认其中的星云、星团与星系。
        </p>
      </div>

      <!-- SUBMIT: the action, integrated into the scene under the moon -->
      <div class="hero__act">
        <transition name="fade">
          <div v-if="imageInfo" class="info" :key="imageInfo.name">
            <span class="info__name">{{ imageInfo.name }}</span>
            <span class="info__sep">·</span>
            <span>{{ imageInfo.compressedSizeKB }} KB</span>
          </div>
        </transition>

        <button
            class="submit"
            :class="{ 'is-ready': compressedBase64 && !isSubmitting, 'is-disabled': !compressedBase64 || isSubmitting }"
            :disabled="!compressedBase64 || isSubmitting"
            @click="handleSubmit"
        >
          <span v-if="!isSubmitting">让它被阅读</span>
          <span v-else>正在提交…</span>
          <span class="submit__arrow">→</span>
        </button>

        <transition name="fade">
          <div v-if="errorMsg" class="err">
            {{ errorMsg }}
            <span class="err__close" @click="errorMsg = ''">×</span>
          </div>
        </transition>
      </div>

      <!-- floating pale petals / butterflies -->
      <div class="petal petal--1"></div>
      <div class="petal petal--2"></div>
      <div class="petal petal--3"></div>
      <div class="petal petal--4"></div>
      <div class="petal petal--5"></div>
      <div class="petal petal--6"></div>

      <!-- paper grain overlay -->
      <div class="grain"></div>
    </section>

    <!-- Flow notes -->
    <section class="notes">
      <div class="note">
        <div class="note__num">II.</div>
        <div class="note__body">
          <h3>后台解算</h3>
          <p>提交后由 Astrometry.net 引擎在后台解算，通常需要 30 秒到 3 分钟。你可以关掉页面，稍后在识别历史里查看结果。</p>
        </div>
      </div>
      <div class="note">
        <div class="note__num">III.</div>
        <div class="note__body">
          <h3>观测档案</h3>
          <p>解算完成后，系统会为这次观测生成一份档案——包含天球坐标、视野、识别到的天体，以及根据内容推荐的器材与相关课程。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { submitRecognition } from '@/api/recognition'

const router = useRouter()

const isDragover = ref(false)
const isCompressing = ref(false)
const isSubmitting = ref(false)
const previewUrl = ref('')
const compressedBase64 = ref('')
const imageInfo = ref(null)
const errorMsg = ref('')
const fileInputRef = ref(null)

function triggerFileInput() {
  if (isSubmitting.value || isCompressing.value) return
  if (previewUrl.value) return  // don't reopen when already has image (click reset instead)
  fileInputRef.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
  e.target.value = ''
}

function handleDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function clearImage() {
  previewUrl.value = ''
  compressedBase64.value = ''
  imageInfo.value = null
  errorMsg.value = ''
}

async function processFile(file) {
  errorMsg.value = ''
  clearImage()

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  const isFits = file.name.toLowerCase().endsWith('.fits') ||
      file.name.toLowerCase().endsWith('.fit')

  if (!allowedTypes.includes(file.type) && !isFits) {
    errorMsg.value = '不支持的文件格式，请上传 JPG、PNG 或 FITS 文件'
    return
  }

  if (file.size > 50 * 1024 * 1024) {
    errorMsg.value = '文件过大，请上传 50MB 以内的图片'
    return
  }

  isCompressing.value = true

  try {
    const originalSizeKB = Math.round(file.size / 1024)

    if (isFits) {
      const base64 = await fileToBase64(file)
      compressedBase64.value = base64
      previewUrl.value = ''
      imageInfo.value = { name: file.name, originalSizeKB, compressedSizeKB: originalSizeKB }
      ElMessage.info('FITS 格式已就绪，点击开始识别')
    } else {
      const { base64, previewDataUrl, compressedSizeKB } = await compressImage(file)
      compressedBase64.value = base64
      previewUrl.value = previewDataUrl
      imageInfo.value = { name: file.name, originalSizeKB, compressedSizeKB }
    }
  } catch (err) {
    console.error('[StarRecognition] 图片处理失败:', err)
    errorMsg.value = '图片处理失败，请重试或换一张图片'
  } finally {
    isCompressing.value = false
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX_SIDE = 1200
      let { width, height } = img
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width >= height) { height = Math.round(height * MAX_SIDE / width); width = MAX_SIDE }
        else { width = Math.round(width * MAX_SIDE / height); height = MAX_SIDE }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const base64 = previewDataUrl.split(',')[1]
      const compressedSizeKB = Math.round(base64.length * 0.75 / 1024)
      resolve({ base64, previewDataUrl, compressedSizeKB })
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('图片加载失败')) }
    img.src = objectUrl
  })
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target.result
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleSubmit() {
  if (!compressedBase64.value) {
    errorMsg.value = '请先选择一张星图'
    return
  }
  isSubmitting.value = true
  errorMsg.value = ''
  try {
    const res = await submitRecognition(compressedBase64.value)
    const recognitionId = res.data?.id
    if (!recognitionId) throw new Error('服务器未返回识别 ID')
    ElMessage.success('提交成功，正在识别中...')
    router.push({ path: '/recognition/waiting', query: { id: recognitionId } })
  } catch (err) {
    console.error('[StarRecognition] 提交失败:', err)
    errorMsg.value = err.message || '提交失败，请检查网络后重试'
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
/* ─────────────────────────────────
   GRIS-like painterly scene
   moon = dropzone (functional)
   ───────────────────────────────── */

$moon:       #f7ecd2;
$moon-soft:  #f1e2b8;
$sky-top:    #1a2547;
$sky-mid:    #0e1731;
$sky-bot:    #070b1d;

$bg:        $sky-bot;
$fg:        #f3ede1;
$fg-mute:   rgba(243,237,225,0.62);
$fg-faint:  rgba(243,237,225,0.35);
$hair:      rgba(243,237,225,0.14);
$hair-soft: rgba(243,237,225,0.08);

$sans:  'Inter','PingFang SC','Microsoft YaHei','Helvetica Neue',Arial,sans-serif;
$serif: 'Cormorant Garamond','Playfair Display',Georgia,serif;

.page {
  min-height: 100vh;
  background: $bg;
  color: $fg;
  font-family: $sans;
  -webkit-font-smoothing: antialiased;
}

/* ── Topbar (sits above letterbox) ── */
.topbar {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 10;
  background: transparent;
}
.topbar__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 14px 48px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  letter-spacing: .3px;
  color: rgba(247,236,210,0.78);
}
.tb-link {
  color: rgba(247,236,210,0.72);
  cursor: pointer;
  transition: color .2s;
  &:hover { color: $moon; }
}
.tb-current { color: $moon; }
.tb-dot { color: rgba(247,236,210,0.35); }
.tb-spacer { flex: 1; }

/* ── HERO canvas ── */
.hero {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  isolation: isolate;
  background: $sky-bot;
}

/* cinematic letterbox */
.hero__letterbox {
  position: absolute;
  left: 0; right: 0;
  height: 48px;
  background: #000;
  z-index: 9;
  pointer-events: none;
  &--top { top: 0; }
  &--bot { bottom: 0; }
}

/* painted sky — deep blue base with whisper of moon-goddess violet/rose */
.sky {
  position: absolute; inset: 0;
  z-index: 0;
  background:
      radial-gradient(ellipse 70% 55% at 50% 32%, rgba(247,236,210,0.17), transparent 70%),
      radial-gradient(ellipse 65% 55% at 82% 24%, rgba(176,134,214,0.16), transparent 70%),
      radial-gradient(ellipse 70% 60% at 16% 70%, rgba(214,134,182,0.10), transparent 70%),
      radial-gradient(ellipse 70% 90% at 28% 18%, rgba(78,96,168,0.25), transparent 65%),
      radial-gradient(ellipse 80% 70% at 82% 92%, rgba(92,58,140,0.22), transparent 65%),
      linear-gradient(180deg, $sky-top 0%, $sky-mid 55%, $sky-bot 100%);
}

/* stars — three layers twinkling out of sync */
.stars {
  position: absolute; inset: 0;
  z-index: 1;
  background-image:
      radial-gradient(1px 1px at 12% 22%, rgba(247,236,210,0.78), transparent 60%),
      radial-gradient(1px 1px at 78% 16%, rgba(247,236,210,0.6), transparent 60%),
      radial-gradient(1.3px 1.3px at 34% 34%, rgba(255,255,255,0.65), transparent 60%),
      radial-gradient(1px 1px at 88% 42%, rgba(247,236,210,0.5), transparent 60%),
      radial-gradient(1px 1px at 6% 58%, rgba(255,255,255,0.55), transparent 60%),
      radial-gradient(1.5px 1.5px at 62% 10%, rgba(247,236,210,0.8), transparent 60%),
      radial-gradient(1px 1px at 92% 60%, rgba(255,255,255,0.5), transparent 60%),
      radial-gradient(1px 1px at 20% 68%, rgba(247,236,210,0.55), transparent 60%),
      radial-gradient(1px 1px at 48% 46%, rgba(255,255,255,0.6), transparent 60%),
      radial-gradient(1.3px 1.3px at 72% 56%, rgba(247,236,210,0.65), transparent 60%),
      radial-gradient(1px 1px at 4% 36%, rgba(255,255,255,0.5), transparent 60%),
      radial-gradient(1.1px 1.1px at 96% 28%, rgba(247,236,210,0.6), transparent 60%);
  background-size: 1200px 1200px, 900px 900px, 1100px 1100px, 1000px 1000px, 1400px 1400px, 800px 800px, 1300px 1300px, 1150px 1150px, 1250px 1250px, 1050px 1050px, 960px 960px, 1090px 1090px;
  pointer-events: none;
  will-change: opacity;
}
.stars--a {
  animation: twinkle-a 2.2s ease-in-out infinite;
}
.stars--b {
  background-size: 820px 820px, 720px 720px, 940px 940px, 880px 880px, 1060px 1060px, 670px 670px, 970px 970px, 890px 890px, 930px 930px, 790px 790px, 740px 740px, 870px 870px;
  background-position: 40% 20%, 10% 60%, 70% 30%, 25% 80%, 90% 50%, 55% 75%, 15% 15%, 80% 85%, 30% 10%, 65% 65%, 5% 45%, 95% 5%;
  animation: twinkle-b 3.1s ease-in-out infinite .4s;
}
.stars--c {
  background-size: 1320px 1320px, 1000px 1000px, 1240px 1240px, 1120px 1120px, 1520px 1520px, 880px 880px, 1420px 1420px, 1260px 1260px, 1360px 1360px, 1160px 1160px, 1040px 1040px, 1180px 1180px;
  background-position: 20% 50%, 80% 80%, 60% 20%, 5% 30%, 45% 90%, 75% 45%, 35% 5%, 50% 55%, 85% 25%, 15% 75%, 70% 60%, 25% 35%;
  animation: twinkle-c 4.3s ease-in-out infinite 1.1s;
}
/* big opacity range makes twinkling actually visible */
@keyframes twinkle-a { 0%,100% { opacity: .95; } 50% { opacity: .25; } }
@keyframes twinkle-b { 0%,100% { opacity: .2;  } 50% { opacity: .9;  } }
@keyframes twinkle-c { 0%,100% { opacity: .6;  } 50% { opacity: .1;  } }

/* shooting stars */
.shoot {
  position: absolute;
  z-index: 2;
  width: 240px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(247,236,210,0.05) 8%, rgba(247,236,210,0.9) 55%, rgba(255,255,255,1) 100%);
  border-radius: 2px;
  opacity: 0;
  pointer-events: none;
  filter: drop-shadow(0 0 6px rgba(247,236,210,0.9)) drop-shadow(0 0 14px rgba(247,236,210,0.4));
}
.shoot--a {
  top: 14%; left: -160px;
  animation: shoot-a 6s ease-in 1.5s infinite;
}
.shoot--b {
  top: 28%; right: -180px;
  animation: shoot-b 8s ease-in 4s infinite;
}
/* keep streak visible longer and with a hard flash */
@keyframes shoot-a {
  0%   { transform: translate(0,0) rotate(-20deg); opacity: 0; }
  5%   { opacity: 1; }
  40%  { transform: translate(60vw, 30vh) rotate(-20deg); opacity: 0; }
  100% { transform: translate(60vw, 30vh) rotate(-20deg); opacity: 0; }
}
@keyframes shoot-b {
  0%   { transform: translate(0,0) rotate(18deg); opacity: 0; }
  5%   { opacity: 1; }
  42%  { transform: translate(-54vw, 38vh) rotate(18deg); opacity: 0; }
  100% { transform: translate(-54vw, 38vh) rotate(18deg); opacity: 0; }
}

/* clouds */
.clouds {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}
.cloud--a { animation: drift-a 28s ease-in-out infinite alternate; }
.cloud--b { animation: drift-b 34s ease-in-out infinite alternate; }
.cloud--c { animation: drift-c 42s ease-in-out infinite alternate; }
.cloud--d { animation: drift-d 50s ease-in-out infinite alternate; }
@keyframes drift-a {
  from { transform: translate(-420px, -18px); }
  to   { transform: translate(420px, 14px); }
}
@keyframes drift-b {
  from { transform: translate(380px, 22px); }
  to   { transform: translate(-380px, -16px); }
}
@keyframes drift-c {
  from { transform: translate(-320px, 12px); }
  to   { transform: translate(360px, -24px); }
}
@keyframes drift-d {
  from { transform: translate(280px, -10px); }
  to   { transform: translate(-320px, 18px); }
}

/* ── MOON (dropzone) ── */
.moon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -54%);
  width: min(520px, 44vw);
  aspect-ratio: 1 / 1;
  z-index: 5;
  cursor: pointer;
  transition: transform .6s cubic-bezier(.2,.8,.3,1);

  &:hover { transform: translate(-50%, -54%) scale(1.012); }
  &.is-drag { transform: translate(-50%, -54%) scale(1.04); }
  &.is-busy { cursor: wait; }
  &.is-ready { cursor: default; }
}

/* outer soft halo (painted wash) — breathes */
.moon__halo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--outer {
    inset: -22%;
    background: radial-gradient(circle, rgba(247,236,210,0.32), transparent 65%);
    filter: blur(40px);
    transition: opacity .5s;
    animation: halo-breath 3.8s ease-in-out infinite;
  }
  &--inner {
    inset: -8%;
    background: radial-gradient(circle, rgba(247,236,210,0.28), transparent 72%);
    filter: blur(12px);
    animation: halo-breath-inner 2.8s ease-in-out infinite;
  }

  .moon.is-drag & {
    &--outer { opacity: 1.5; }
  }
}
@keyframes halo-breath {
  0%, 100% { opacity: .7; transform: scale(1);    }
  50%      { opacity: 1.3; transform: scale(1.18); }
}
@keyframes halo-breath-inner {
  0%, 100% { opacity: .65; transform: scale(1);    }
  50%      { opacity: 1.15; transform: scale(1.1); }
}

/* iridescent chromatic ring — a whisper of prism light around the moon */
.moon__iris {
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  pointer-events: none;
  background: conic-gradient(from 0deg,
      rgba(247,200,230,0.35),
      rgba(200,180,240,0.30),
      rgba(178,210,255,0.35),
      rgba(220,240,255,0.25),
      rgba(255,214,196,0.30),
      rgba(232,192,220,0.28),
      rgba(247,200,230,0.35));
  filter: blur(14px);
  mix-blend-mode: screen;
  opacity: .75;
  mask: radial-gradient(circle, transparent 56%, #000 62%, #000 74%, transparent 80%);
  -webkit-mask: radial-gradient(circle, transparent 56%, #000 62%, #000 74%, transparent 80%);
  animation: iris-spin 22s linear infinite;
}
@keyframes iris-spin { to { transform: rotate(360deg); } }

/* the disc itself — cream with painterly edge + breathing glow */
.moon__disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
      radial-gradient(circle at 54% 46%, $moon 0%, $moon 60%, $moon-soft 76%, rgba(247,236,210,0.5) 90%, rgba(247,236,210,0) 100%);
  filter: saturate(.92);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: disc-glow 4.2s ease-in-out infinite;

  .moon.is-drag & {
    animation: none;
    box-shadow:
        0 0 90px 32px rgba(247,236,210,0.35),
        0 0 220px 100px rgba(247,236,210,0.14);
  }
}
@keyframes disc-glow {
  0%, 100% {
    box-shadow:
        0 0 60px 20px rgba(247,236,210,0.18),
        0 0 140px 60px rgba(247,236,210,0.08);
  }
  50% {
    box-shadow:
        0 0 96px 36px rgba(247,236,210,0.32),
        0 0 220px 96px rgba(247,236,210,0.16);
  }
}

/* empty state hint (painted ink) */
.moon__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #4a5275;
  text-align: center;
  transition: opacity .3s, transform .3s;

  svg { opacity: .6; }
  .moon__empty-main {
    font-family: $serif;
    font-style: italic;
    font-size: 22px;
    letter-spacing: 1px;
    color: #3a4268;
  }
  .moon__empty-sub {
    font-size: 11.5px;
    letter-spacing: 2.4px;
    color: #6d769a;
  }
  .moon.is-drag & {
    opacity: 0;
    transform: scale(1.08);
  }
}

/* preview image — shows the star photo as if through a telescope */
.moon__img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(.95) contrast(1.04);
  animation: moon-reveal .7s ease both;
}
@keyframes moon-reveal {
  from { opacity: 0; transform: scale(1.1); }
  to   { opacity: 1; transform: scale(1); }
}

/* busy ring animates around the moon edge */
.moon__ring {
  position: absolute;
  inset: -4%;
  width: 108%; height: 108%;
  animation: ring-spin 1.4s linear infinite;
}
@keyframes ring-spin { to { transform: rotate(360deg); } }

/* splash marks — slow full orbit around the moon */
.moon__ticks {
  position: absolute;
  inset: -35%;
  width: 170%; height: 170%;
  pointer-events: none;
  animation: ticks-orbit 60s linear infinite;
}
@keyframes ticks-orbit {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}

/* reset button (appears when preview is loaded) */
.moon__reset {
  position: absolute;
  bottom: -46px;
  left: 50%;
  transform: translateX(-50%);
  font-family: $serif;
  font-style: italic;
  font-size: 14px;
  color: rgba(247,236,210,0.7);
  letter-spacing: .6px;
  padding: 6px 14px;
  border-bottom: 1px solid rgba(247,236,210,0.4);
  cursor: pointer;
  transition: color .2s, border-color .2s;
  &:hover { color: $moon; border-color: $moon; }
}

/* ── Foreground scene (hills + flora + figure) ── */
.scene {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  width: 100%;
  height: 48%;
  z-index: 4;
  pointer-events: none;
  display: block;
}

/* paper grain */
.grain {
  position: absolute; inset: 0;
  z-index: 7;
  pointer-events: none;
  opacity: .38;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.98, 0 0 0 0 0.92, 0 0 0 0 0.78, 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  background-size: 220px 220px;
}

/* ── Title copy (floating left) ── */
.hero__copy {
  position: absolute;
  z-index: 6;
  top: 17%;
  left: max(48px, 6vw);
  max-width: 340px;
}
.kicker {
  font-family: $serif;
  font-style: italic;
  font-size: 15px;
  letter-spacing: 1.2px;
  color: rgba(247,236,210,0.78);
  margin-bottom: 20px;
}
.title {
  font-family: $serif;
  font-weight: 400;
  font-size: clamp(56px, 7.2vw, 104px);
  line-height: 0.92;
  letter-spacing: -1.5px;
  margin: 0 0 24px;
  color: $moon;
  text-shadow: 0 2px 38px rgba(7,11,29,0.55);
  em {
    font-style: italic;
    color: $moon;
    opacity: .95;
  }
}
.desc {
  font-family: $sans;
  font-size: 14.5px;
  line-height: 1.85;
  color: rgba(247,236,210,0.72);
  margin: 0;
  letter-spacing: .3px;
  text-shadow: 0 1px 16px rgba(7,11,29,0.6);
}

/* ── Action area under moon ── */
.hero__act {
  position: absolute;
  z-index: 6;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%);
  text-align: center;
  min-width: 280px;
}
.info {
  font-family: $serif;
  font-style: italic;
  font-size: 14px;
  color: rgba(247,236,210,0.75);
  margin-bottom: 18px;
  letter-spacing: .4px;
  &__name { color: $moon; }
  &__sep  { margin: 0 8px; opacity: .5; }
}
.submit {
  display: inline-flex;
  align-items: baseline;
  gap: 14px;
  padding: 10px 0;
  font-family: $serif;
  font-style: italic;
  font-size: 22px;
  letter-spacing: .4px;
  color: rgba(247,236,210,0.42);
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(247,236,210,0.22);
  cursor: not-allowed;
  transition: color .4s ease, border-color .4s ease, gap .25s ease;

  &__arrow {
    font-family: $serif;
    font-size: 24px;
    transition: transform .25s ease;
  }
  &.is-ready {
    color: $moon;
    border-bottom-color: $moon;
    cursor: pointer;
    text-shadow: 0 0 24px rgba(247,236,210,0.35);
  }
  &.is-ready:hover {
    gap: 22px;
    .submit__arrow { transform: translateX(4px); }
  }
}

/* error */
.err {
  margin-top: 16px;
  padding: 10px 16px;
  border-left: 1px solid #d4817a;
  color: #efb6b0;
  font-size: 13px;
  letter-spacing: .2px;
  background: rgba(212,129,122,0.08);
  position: relative;
  padding-right: 36px;
  &__close {
    position: absolute;
    right: 10px; top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: rgba(247,236,210,0.5);
    font-size: 18px;
    padding: 0 6px;
    &:hover { color: #efb6b0; }
  }
}

/* fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity .3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Notes (below hero) ── */
.notes {
  max-width: 1360px;
  margin: 0 auto;
  padding: 120px 48px 160px;
  display: grid;
  grid-template-columns: 120px 1fr;
  column-gap: 40px;
  row-gap: 0;
  border-top: 1px solid $hair-soft;
}
.note { display: contents; }
.note__num {
  font-family: $serif;
  font-style: italic;
  font-size: 36px;
  color: $fg-faint;
  font-weight: 400;
  padding: 72px 0 0;
  border-top: 1px solid $hair-soft;
  grid-column: 1;
  &:first-of-type { border-top: none; }
}
.note__body {
  padding: 72px 0;
  border-top: 1px solid $hair-soft;
  max-width: 720px;
  grid-column: 2;
  h3 {
    font-family: $serif;
    font-weight: 400;
    font-size: 34px;
    letter-spacing: -.4px;
    margin: 0 0 16px;
    line-height: 1.2;
  }
  p {
    font-size: 15px;
    line-height: 1.85;
    color: $fg-mute;
    margin: 0;
    max-width: 560px;
  }
}
.note:first-of-type .note__body { border-top: none; }

/* ── SVG scene animations ── */

/* flora sway — gently rotate around base of trunk */
.flora {
  transform-box: fill-box;
  will-change: transform;
}
.flora--left {
  transform-origin: 0 600px; /* base of left trunk at ground */
  animation: sway-l 4.5s ease-in-out infinite alternate;
}
.flora--right {
  transform-origin: 1600px 600px;
  animation: sway-r 5.2s ease-in-out infinite alternate;
}
/* visible sway — 5~6 degrees so blossoms really wobble */
@keyframes sway-l {
  from { transform: rotate(-3deg); }
  to   { transform: rotate(4deg); }
}
@keyframes sway-r {
  from { transform: rotate(3.5deg); }
  to   { transform: rotate(-3.5deg); }
}

/* figure subtle breathing — now actually perceptible */
.figure {
  will-change: transform;
  animation: figure-breath 3.2s ease-in-out infinite;
}
@keyframes figure-breath {
  0%, 100% { transform: translateY(0) scale(1);       }
  50%      { transform: translateY(-3px) scale(1.02); }
}

/* cape flutter — bigger angle */
.cape {
  transform-box: fill-box;
  transform-origin: center top;
  will-change: transform;
}
.cape--l { animation: cape-l 2.6s ease-in-out infinite alternate; }
.cape--r { animation: cape-r 3s ease-in-out infinite alternate .4s; }
@keyframes cape-l {
  from { transform: rotate(-3deg) skewX(-3deg); }
  to   { transform: rotate(5deg) skewX(4deg); }
}
@keyframes cape-r {
  from { transform: rotate(3deg) skewX(3deg); }
  to   { transform: rotate(-5deg) skewX(-4deg); }
}

/* the cream dot in the observer's hand — pulses like a lantern */
.glow-core {
  animation: glow-core 1.8s ease-in-out infinite;
}
.glow-aura {
  transform-box: fill-box;
  transform-origin: center;
  animation: glow-aura 1.8s ease-in-out infinite;
}
@keyframes glow-core {
  0%, 100% { opacity: 1;   }
  50%      { opacity: .55; }
}
@keyframes glow-aura {
  0%, 100% { opacity: .2; transform: scale(.9); }
  50%      { opacity: .85; transform: scale(1.9); }
}

/* observatory / spire top stars blink harder */
.top-star {
  animation: blink 1.8s ease-in-out infinite;
}
.top-star--b {
  animation: blink 2.4s ease-in-out infinite .7s;
}
@keyframes blink {
  0%, 100% { opacity: 1;   }
  50%      { opacity: .1; }
}

/* title fade-in on page load — sets a cinematic feeling */
.hero__copy {
  animation: rise-in 1.4s ease-out .2s both;
}
@keyframes rise-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero__act {
  animation: rise-in-center 1.4s ease-out .6s both;
}
@keyframes rise-in-center {
  from { opacity: 0; transform: translate(-50%, 14px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

/* ── Moon-goddess motifs (subtle homage) ── */

/* glowing blue bloom cluster along the horizon — soft halation */
.bloom {
  filter: drop-shadow(0 0 4px rgba(110,166,234,0.9))
          drop-shadow(0 0 10px rgba(110,166,234,0.45));
}
.bloom__cluster {
  transform-box: fill-box;
  transform-origin: center;
  animation: bloom-pulse 3.6s ease-in-out infinite;
}
.bloom__cluster:nth-child(2n)  { animation-duration: 4.2s; animation-delay: .4s; }
.bloom__cluster:nth-child(3n)  { animation-duration: 5.0s; animation-delay: .9s; }
.bloom__cluster:nth-child(5n)  { animation-duration: 4.6s; animation-delay: 1.3s; }
@keyframes bloom-pulse {
  0%, 100% { opacity: .7; }
  50%      { opacity: 1; }
}

/* water ripples around the observer's feet */
.ripples { pointer-events: none; }
.ripple {
  transform-box: fill-box;
  transform-origin: center;
}
.ripple--1 { animation: ripple-out 4.2s ease-out infinite; }
.ripple--2 { animation: ripple-out 4.2s ease-out 1.4s infinite; }
.ripple--3 { animation: ripple-out 4.2s ease-out 2.8s infinite; }
@keyframes ripple-out {
  0%   { transform: scale(0.35); opacity: .7; }
  100% { transform: scale(2.6);  opacity: 0;  }
}

/* pale petals / butterflies drifting across the sky */
.petal {
  position: absolute;
  z-index: 3;
  width: 7px; height: 5px;
  border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
  background: radial-gradient(ellipse at 40% 50%,
      rgba(255,255,255,0.95) 0%,
      rgba(247,236,210,0.85) 50%,
      rgba(190,170,220,0.3) 100%);
  filter: blur(0.3px) drop-shadow(0 0 4px rgba(247,236,210,0.55));
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
}
.petal--1 { left: 18%; bottom: 0;  animation: petal-rise 16s linear 0s   infinite; }
.petal--2 { left: 34%; bottom: 0;  animation: petal-rise 19s linear 3s   infinite; }
.petal--3 { left: 52%; bottom: 0;  animation: petal-rise 22s linear 7s   infinite; }
.petal--4 { left: 68%; bottom: 0;  animation: petal-rise 17s linear 11s  infinite; }
.petal--5 { left: 82%; bottom: 0;  animation: petal-rise 20s linear 2s   infinite; }
.petal--6 { left: 10%; bottom: 0;  animation: petal-rise 24s linear 14s  infinite; }
@keyframes petal-rise {
  0%   { transform: translate(0, 0) rotate(0deg);        opacity: 0; }
  10%  { opacity: .8; }
  30%  { transform: translate(24px, -28vh) rotate(140deg); }
  60%  { transform: translate(-18px, -60vh) rotate(300deg); opacity: .7; }
  90%  { opacity: .2; }
  100% { transform: translate(36px, -96vh) rotate(540deg); opacity: 0; }
}

/* respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .cloud--a, .cloud--b, .cloud--c, .cloud--d,
  .stars--a, .stars--b, .stars--c,
  .shoot--a, .shoot--b,
  .moon__halo--outer, .moon__halo--inner, .moon__iris, .moon__disc,
  .flora--left, .flora--right,
  .figure, .cape--l, .cape--r,
  .glow-core, .glow-aura,
  .top-star, .top-star--b,
  .moon__ticks,
  .bloom__cluster, .ripple--1, .ripple--2, .ripple--3,
  .petal {
    animation: none !important;
  }
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .topbar__inner { padding: 14px 24px; }
  .hero__copy {
    top: 12%;
    left: 24px;
    right: 24px;
    max-width: none;
  }
  .title { font-size: clamp(44px, 11vw, 76px); }
  .moon { width: min(380px, 78vw); }
  .hero__act { bottom: 7%; }
  .submit { font-size: 18px; }
  .notes { padding: 80px 24px 100px; grid-template-columns: 60px 1fr; column-gap: 20px; }
  .note__num { font-size: 26px; padding-top: 48px; }
  .note__body { padding: 48px 0; h3 { font-size: 26px; } }
}
</style>
