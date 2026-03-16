<template>
  <div class="star-recognition-page">
    <!-- ============================================================ -->
    <!-- 页面头部                                                       -->
    <!-- ============================================================ -->
    <div class="page-header">
      <div class="header-content">
        <el-button text class="back-btn" @click="router.push('/home')">
          ← 返回首页
        </el-button>
        <h1>
          <span class="icon">🌠</span>
          AI 星图识别
        </h1>
        <p class="subtitle">上传您的星野照片，AI 自动识别天体坐标与星云信息</p>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 主内容区                                                       -->
    <!-- ============================================================ -->
    <div class="main-content">
      <el-card class="upload-card" shadow="hover">

        <!-- 上传区域 -->
        <div
            class="upload-zone"
            :class="{
            'is-dragover': isDragover,
            'has-image': previewUrl,
            'is-uploading': isSubmitting
          }"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
        >
          <!-- 已选图片预览 -->
          <div v-if="previewUrl" class="preview-container">
            <img :src="previewUrl" alt="预览图" class="preview-image" />
            <div class="preview-overlay">
              <el-button type="primary" plain size="small" @click.stop="clearImage">
                重新选择
              </el-button>
            </div>
          </div>

          <!-- 未选图片时的提示区 -->
          <div v-else class="upload-hint">
            <div class="upload-icon">
              <el-icon size="60" color="#8ecdf7"><UploadFilled /></el-icon>
            </div>
            <p class="hint-primary">点击或拖拽图片到此区域</p>
            <p class="hint-secondary">支持 JPG、PNG、FITS 格式 · 建议上传清晰星野照片</p>
            <p class="hint-tip">
              <el-icon><InfoFilled /></el-icon>
              图片将自动压缩优化，无需手动处理
            </p>
          </div>

          <!-- 压缩进度提示 -->
          <div v-if="isCompressing" class="compressing-mask">
            <el-icon class="rotating"><Loading /></el-icon>
            <span>正在优化图片...</span>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <input
            ref="fileInputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.fits,.fit"
            style="display: none"
            @change="handleFileChange"
        />

        <!-- 图片信息展示 -->
        <div v-if="imageInfo" class="image-info">
          <el-tag type="info" size="small">
            <el-icon><Picture /></el-icon>
            {{ imageInfo.name }}
          </el-tag>
          <el-tag type="success" size="small">
            压缩后约 {{ imageInfo.compressedSizeKB }} KB
          </el-tag>
          <el-tag type="warning" size="small" v-if="imageInfo.originalSizeKB > 500">
            原始 {{ imageInfo.originalSizeKB }} KB → 已优化
          </el-tag>
        </div>

        <!-- 提交按钮 -->
        <div class="action-area">
          <el-button
              type="primary"
              size="large"
              :disabled="!compressedBase64 || isSubmitting"
              :loading="isSubmitting"
              class="submit-btn"
              @click="handleSubmit"
          >
            <el-icon v-if="!isSubmitting"><Search /></el-icon>
            {{ isSubmitting ? '提交识别中...' : '开始识别' }}
          </el-button>
        </div>

        <!-- 提示信息 -->
        <el-alert
            v-if="errorMsg"
            :title="errorMsg"
            type="error"
            show-icon
            closable
            class="error-alert"
            @close="errorMsg = ''"
        />
      </el-card>

      <!-- 使用说明卡片 -->
      <el-card class="tips-card" shadow="never">
        <template #header>
          <span>📖 使用说明</span>
        </template>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-icon">📷</span>
            <div>
              <strong>拍摄建议</strong>
              <p>建议使用曝光时间 ≥ 5 秒的星野照片，确保星点清晰可见</p>
            </div>
          </div>
          <div class="tip-item">
            <span class="tip-icon">⏱️</span>
            <div>
              <strong>识别时间</strong>
              <p>通常需要 30 秒 ~ 3 分钟，请耐心等待，勿关闭页面</p>
            </div>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🛍️</span>
            <div>
              <strong>智能推荐</strong>
              <p>识别成功后，系统将根据天体类型为您推荐适合的观测器材</p>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  UploadFilled, InfoFilled, Loading, Picture, Search
} from '@element-plus/icons-vue'
import { submitRecognition } from '@/api/recognition'

const router = useRouter()

// ============================================================
// 响应式状态
// ============================================================

/** 是否正在拖拽文件到上传区 */
const isDragover = ref(false)

/** 是否正在 Canvas 压缩 */
const isCompressing = ref(false)

/** 是否正在提交识别请求 */
const isSubmitting = ref(false)

/** 图片预览 URL（用于 <img> 展示，使用 createObjectURL） */
const previewUrl = ref('')

/** 压缩后的纯 base64 字符串（不含 data: 前缀，用于提交） */
const compressedBase64 = ref('')

/** 图片基本信息展示 */
const imageInfo = ref(null)

/** 错误提示信息 */
const errorMsg = ref('')

/** 文件输入 ref */
const fileInputRef = ref(null)

// ============================================================
// 文件选择处理
// ============================================================

/** 触发文件选择框 */
function triggerFileInput() {
  if (isSubmitting.value) return
  fileInputRef.value?.click()
}

/** 处理 input[type=file] 变化 */
function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
  // 重置 input，允许重复选同一文件
  e.target.value = ''
}

/** 处理拖拽释放 */
function handleDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

/** 清除已选图片，重置状态 */
function clearImage() {
  previewUrl.value = ''
  compressedBase64.value = ''
  imageInfo.value = null
  errorMsg.value = ''
}

// ============================================================
// 核心：图片处理（读取 → Canvas压缩 → base64）
// ============================================================

/**
 * 处理选中的文件
 *
 * 流程:
 *   1. 校验文件类型和大小
 *   2. FITS 格式直接 base64 编码（不走 Canvas）
 *   3. JPG/PNG 走 Canvas 压缩（最长边 1200px，JPEG 质量 0.85）
 *   4. 生成预览 URL
 *
 * @param {File} file 用户选择的文件
 */
async function processFile(file) {
  errorMsg.value = ''
  clearImage()

  // 1. 类型校验
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  const isFits = file.name.toLowerCase().endsWith('.fits') ||
      file.name.toLowerCase().endsWith('.fit')

  if (!allowedTypes.includes(file.type) && !isFits) {
    errorMsg.value = '不支持的文件格式，请上传 JPG、PNG 或 FITS 文件'
    return
  }

  // 2. 大小校验（原始文件 < 50MB）
  if (file.size > 50 * 1024 * 1024) {
    errorMsg.value = '文件过大，请上传 50MB 以内的图片'
    return
  }

  isCompressing.value = true

  try {
    const originalSizeKB = Math.round(file.size / 1024)

    if (isFits) {
      // FITS 格式：直接 base64 编码，不经过 Canvas
      const base64 = await fileToBase64(file)
      compressedBase64.value = base64
      previewUrl.value = '' // FITS 无法直接预览
      imageInfo.value = {
        name: file.name,
        originalSizeKB,
        compressedSizeKB: originalSizeKB
      }
      ElMessage.info('FITS 格式已就绪，点击开始识别')
    } else {
      // JPG/PNG：Canvas 压缩
      const { base64, previewDataUrl, compressedSizeKB } = await compressImage(file)
      compressedBase64.value = base64
      previewUrl.value = previewDataUrl
      imageInfo.value = {
        name: file.name,
        originalSizeKB,
        compressedSizeKB
      }
    }
  } catch (err) {
    console.error('[StarRecognition] 图片处理失败:', err)
    errorMsg.value = '图片处理失败，请重试或换一张图片'
  } finally {
    isCompressing.value = false
  }
}

/**
 * 使用 Canvas 压缩图片
 *
 * 规格:
 *   - 最长边缩放至 1200px（等比）
 *   - 输出格式: JPEG
 *   - JPEG 质量: 0.85
 *
 * @param {File} file 图片文件
 * @returns {{ base64: string, previewDataUrl: string, compressedSizeKB: number }}
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl) // 释放内存

      const MAX_SIDE = 1200
      let { width, height } = img

      // 计算等比缩放尺寸
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width >= height) {
          height = Math.round(height * MAX_SIDE / width)
          width = MAX_SIDE
        } else {
          width = Math.round(width * MAX_SIDE / height)
          height = MAX_SIDE
        }
      }

      // 创建 Canvas 并绘制
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // 导出为 JPEG base64（quality=0.85）
      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85)

      // 去除 data:image/jpeg;base64, 前缀，只保留纯 base64
      const base64 = previewDataUrl.split(',')[1]

      // 估算压缩后大小（base64 字节数 * 0.75 = 实际字节数）
      const compressedSizeKB = Math.round(base64.length * 0.75 / 1024)

      resolve({ base64, previewDataUrl, compressedSizeKB })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片加载失败'))
    }

    img.src = objectUrl
  })
}

/**
 * 文件转 base64（FITS 格式用）
 * @param {File} file
 * @returns {Promise<string>} 纯 base64 字符串（不含前缀）
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target.result
      // 去除 data:...;base64, 前缀
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============================================================
// 提交识别
// ============================================================

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

    if (!recognitionId) {
      throw new Error('服务器未返回识别 ID')
    }

    ElMessage.success('提交成功，正在识别中...')

    // 跳转识别等待页
    router.push({
      path: '/recognition/waiting',
      query: { id: recognitionId }
    })

  } catch (err) {
    console.error('[StarRecognition] 提交失败:', err)
    errorMsg.value = err.message || '提交失败，请检查网络后重试'
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* ============================================================ */
/* 页面布局                                                       */
/* ============================================================ */
.star-recognition-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0a0e1a 0%, #0d1b2e 60%, #0a1628 100%);
  color: #e0eaff;
}

.page-header {
  background: linear-gradient(135deg, rgba(22, 60, 100, 0.8), rgba(8, 25, 50, 0.9));
  border-bottom: 1px solid rgba(100, 160, 255, 0.15);
  padding: 40px 0 30px;
  text-align: center;
  position: relative;
}

/* 返回按钮：绝对定位在左上角 */
.back-btn {
  position: absolute;
  top: 16px;
  left: 20px;
  color: #5a8ac8 !important;
  font-size: 0.88rem;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #c0deff;
  margin: 0 0 8px;
  letter-spacing: 2px;
}

.header-content .icon {
  margin-right: 10px;
}

.subtitle {
  color: #7a9cc8;
  font-size: 0.95rem;
  margin: 0;
}

.main-content {
  max-width: 760px;
  margin: 40px auto;
  padding: 0 20px;
}

/* ============================================================ */
/* 上传卡片                                                       */
/* ============================================================ */
.upload-card {
  background: rgba(12, 28, 55, 0.85) !important;
  border: 1px solid rgba(80, 130, 200, 0.2) !important;
  border-radius: 16px !important;
  margin-bottom: 20px;
}

/* 上传区域 */
.upload-zone {
  border: 2px dashed rgba(80, 140, 220, 0.4);
  border-radius: 12px;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: rgba(8, 20, 45, 0.6);
}

.upload-zone:hover,
.upload-zone.is-dragover {
  border-color: #4a9eff;
  background: rgba(20, 50, 100, 0.5);
  box-shadow: 0 0 20px rgba(74, 158, 255, 0.15);
}

.upload-zone.has-image {
  border-style: solid;
  border-color: rgba(80, 140, 220, 0.3);
  min-height: 300px;
}

.upload-zone.is-uploading {
  cursor: not-allowed;
  opacity: 0.7;
}

/* 上传提示 */
.upload-hint {
  text-align: center;
  padding: 20px;
}

.upload-icon {
  margin-bottom: 16px;
}

.hint-primary {
  font-size: 1.1rem;
  color: #8ecdf7;
  margin: 0 0 8px;
}

.hint-secondary {
  color: #5a7a9a;
  font-size: 0.88rem;
  margin: 0 0 12px;
}

.hint-tip {
  color: #4a6a8a;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0;
}

/* 图片预览 */
.preview-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 360px;
  border-radius: 8px;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  bottom: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

/* 压缩遮罩 */
.compressing-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 10, 30, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8ecdf7;
  font-size: 0.95rem;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

.rotating {
  animation: rotate 1s linear infinite;
  font-size: 28px;
}

/* 图片信息 */
.image-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}

/* 操作区 */
.action-area {
  margin-top: 20px;
  text-align: center;
}

.submit-btn {
  width: 200px;
  height: 44px;
  font-size: 1rem;
  letter-spacing: 1px;
  border-radius: 22px;
  background: linear-gradient(135deg, #1a6abf, #0e4a9a) !important;
  border-color: #1a6abf !important;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2a7acf, #1a5aaa) !important;
  box-shadow: 0 4px 15px rgba(30, 100, 200, 0.4);
}

.error-alert {
  margin-top: 16px;
}

/* ============================================================ */
/* 使用说明卡片                                                   */
/* ============================================================ */
.tips-card {
  background: rgba(10, 22, 45, 0.6) !important;
  border: 1px solid rgba(60, 100, 160, 0.15) !important;
  border-radius: 12px !important;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tip-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-item strong {
  display: block;
  color: #a0c4e8;
  margin-bottom: 4px;
}

.tip-item p {
  color: #5a7a9a;
  font-size: 0.88rem;
  margin: 0;
}

/* ============================================================ */
/* Element Plus 深色主题覆盖                                     */
/* ============================================================ */
:deep(.el-card__header) {
  color: #8ab4d8;
  border-bottom: 1px solid rgba(60, 100, 160, 0.2);
  padding: 14px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-tag) {
  background: rgba(20, 50, 100, 0.5);
  border-color: rgba(80, 140, 220, 0.3);
  color: #8ab4d8;
}
</style>