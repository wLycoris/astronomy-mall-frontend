<template>
  <!--
    📡 NASA 每日天文图片 (APOD) 卡片组件
    ✨ 中英文切换：MyMemory 免费翻译 API（分段翻译解决500字符限制）
  -->
  <div class="apod-card" v-if="!loadFailed">

    <!-- 骨架屏 -->
    <el-skeleton v-if="loading" :rows="3" animated class="apod-skeleton" />

    <!-- 内容区 -->
    <div v-else-if="apod" class="apod-content">

      <!-- 顶部角标 + 语言切换 -->
      <div class="apod-header">
        <span class="apod-badge">📡 NASA · 每日天文图片</span>
        <div class="apod-header-right">
          <span class="apod-date">{{ apod.date }}</span>
          <el-tooltip
              :content="isChinese ? '切换为英文原文' : '切换为中文翻译'"
              placement="top"
          >
            <el-button
                class="lang-btn"
                size="small"
                :loading="translating"
                @click="toggleLanguage"
            >
              <span v-if="!translating">{{ isChinese ? '🇺🇸 EN' : '🇨🇳 中文' }}</span>
              <span v-else>翻译中...</span>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 图片（image 类型） -->
      <el-image
          v-if="apod.mediaType === 'image'"
          :src="apod.url"
          :preview-src-list="[apod.hdurl || apod.url]"
          fit="cover"
          class="apod-image"
          lazy
      >
        <template #placeholder>
          <div class="apod-image-placeholder">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>

      <!-- 视频（video 类型） -->
      <iframe
          v-else-if="apod.mediaType === 'video'"
          :src="apod.url"
          class="apod-video"
          frameborder="0"
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />

      <!-- 文字区域 -->
      <div class="apod-text">

        <!-- 标题 -->
        <h3 class="apod-title">
          {{ isChinese && translatedTitle ? translatedTitle : apod.title }}
        </h3>

        <!-- 翻译来源标注（中文模式） -->
        <span v-if="isChinese" class="translate-tag">🌐 机器翻译仅供参考</span>

        <!-- 说明文字（折叠/展开） -->
        <div class="apod-explanation-wrap">
          <p class="apod-explanation">
            <template v-if="isChinese && translatedExplanation">
              {{ expanded
                ? translatedExplanation
                : translatedExplanation.slice(0, 120) + '...' }}
            </template>
            <template v-else>
              {{ expanded
                ? apod.explanation
                : apod.explanation.slice(0, 120) + '...' }}
            </template>
          </p>
          <el-button link type="primary" size="small" @click="expanded = !expanded">
            {{ expanded ? '收起' : '展开全文' }}
          </el-button>
        </div>

        <!-- 版权 -->
        <span v-if="apod.copyright" class="apod-copyright">
          © {{ apod.copyright }}
        </span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getTodayApod } from '@/api/nasa.js'

// ============================================================
// 响应式状态
// ============================================================

const apod = ref(null)
const loading = ref(true)
const expanded = ref(false)
const loadFailed = ref(false)
const isChinese = ref(false)
const translating = ref(false)
const translatedTitle = ref('')
const translatedExplanation = ref('')

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  try {
    const res = await getTodayApod()
    if (res && res.data) {
      apod.value = res.data
    } else {
      loadFailed.value = true
    }
  } catch (e) {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
})

// ============================================================
// 语言切换
// ============================================================

async function toggleLanguage() {
  // 切回英文，直接切
  if (isChinese.value) {
    isChinese.value = false
    return
  }
  // 有缓存，直接切
  if (translatedTitle.value && translatedExplanation.value) {
    isChinese.value = true
    return
  }
  // 首次翻译
  await translate()
}

async function translate() {
  if (!apod.value) return
  translating.value = true

  try {
    // 标题较短，直接翻译
    // 说明文字较长，先分段再翻译拼接
    const [titleResult, explanationResult] = await Promise.all([
      translateText(apod.value.title),
      translateLongText(apod.value.explanation)
    ])

    translatedTitle.value = titleResult || apod.value.title
    translatedExplanation.value = explanationResult || apod.value.explanation
    isChinese.value = true

  } catch (e) {
    console.warn('[ApodCard] 翻译失败:', e.message)
    ElMessage.warning('翻译服务暂时不可用，请稍后再试')
  } finally {
    translating.value = false
  }
}

// ============================================================
// 翻译工具函数
// ============================================================

/**
 * 翻译长文本（核心改进）
 *
 * MyMemory API 单次请求限制约 500 字符。
 * 解决方案：按句子切分，每段不超过 400 字符，逐段翻译后拼接。
 *
 * 切分规则：优先在句号/问号/感叹号处断句，保证语义完整。
 *
 * @param {string} text  待翻译的长文本
 * @returns {string}     拼接后的中文翻译
 */
async function translateLongText(text) {
  if (!text) return ''

  // 按句子切分（. ! ? 后跟空格或结尾）
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text]

  // 将句子合并为不超过 400 字符的块
  const chunks = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > 400) {
      if (current) chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())

  // 逐块翻译（顺序执行，避免频率限制）
  const translatedChunks = []
  for (const chunk of chunks) {
    const result = await translateText(chunk)
    translatedChunks.push(result || chunk) // 单块失败保留原文
    // 每块之间稍作延迟，避免触发频率限制
    if (chunks.length > 1) {
      await sleep(300)
    }
  }

  return translatedChunks.join(' ')
}

/**
 * 单段文本翻译（调用 MyMemory API）
 *
 * 📌 免费接口，无需 API Key
 * 📌 限制：单次 ≤ 500 字符，每天 5000 字
 *
 * @param {string} text  待翻译文本（≤400字符）
 * @returns {string}     翻译结果，失败返回空字符串
 */
async function translateText(text) {
  if (!text) return ''
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`
    const res = await fetch(url)
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    }
    return ''
  } catch (e) {
    return ''
  }
}

/**
 * 延迟工具函数
 * @param {number} ms 毫秒
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
</script>

<style scoped>
.apod-card {
  background: linear-gradient(135deg, #0d1b2a 0%, #1a2a3a 100%);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
  border: 1px solid rgba(100, 160, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.apod-skeleton {
  padding: 20px;
}

.apod-content {
  display: flex;
  flex-direction: column;
}

/* ── 顶部角标栏 ── */
.apod-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.3);
}

.apod-badge {
  font-size: 12px;
  color: #64a0ff;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.apod-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.apod-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* ── 语言切换按钮 ── */
.lang-btn {
  font-size: 12px;
  background: rgba(100, 160, 255, 0.12) !important;
  border: 1px solid rgba(100, 160, 255, 0.3) !important;
  color: #90bfff !important;
  border-radius: 20px !important;
  padding: 0 12px !important;
  height: 26px !important;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: rgba(100, 160, 255, 0.28) !important;
  color: #fff !important;
}

/* ── 图片 ── */
.apod-image {
  width: 100%;
  height: 320px;
  display: block;
}

.apod-image-placeholder {
  width: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
  font-size: 48px;
}

/* ── 视频 ── */
.apod-video {
  width: 100%;
  height: 320px;
  display: block;
  border: none;
}

/* ── 文字区域 ── */
.apod-text {
  padding: 16px;
}

.apod-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #e8f0ff;
  line-height: 1.4;
}

.translate-tag {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 11px;
  color: rgba(150, 190, 255, 0.5);
}

.apod-explanation-wrap {
  margin-bottom: 4px;
}

.apod-explanation {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.75;
  margin: 0 0 6px 0;
}

.apod-copyright {
  display: block;
  margin-top: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

@media (max-width: 768px) {
  .apod-image,
  .apod-video,
  .apod-image-placeholder {
    height: 200px;
  }
}
</style>