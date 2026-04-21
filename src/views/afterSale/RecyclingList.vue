<template>
  <div class="recycling-container">

    <!-- 顶部 Banner -->
    <div class="page-banner">
      <div class="banner-text">
        <div class="banner-icon">
          <el-icon><Finished /></el-icon>
        </div>
        <div>
          <span class="section-kicker">SECOND-HAND RECOVERY</span>
          <h2>二手回收</h2>
          <p>提交闲置器材，附上实拍图片获得更准确的报价</p>
        </div>
      </div>
      <el-button class="apply-btn" type="primary" @click="openApplyDialog">
        <el-icon><Plus /></el-icon>
        提交回收申请
      </el-button>
    </div>

    <!-- 申请列表 -->
    <div v-loading="loading" class="list-wrapper">
      <el-empty v-if="!loading && list.length === 0"
                description="暂无回收申请，可以提交闲置器材进行估价"
                :image-size="100" />

      <div v-else class="card-list">
        <div
            v-for="item in list"
            :key="item.id"
            class="recycling-card"
            :class="`status-${item.status}`"
            @click="openDetail(item)"
        >
          <div class="status-bar"></div>

          <div class="card-main">
            <div class="card-header">
              <div class="header-left">
                <span class="product-name">{{ item.productName }}</span>
                <div class="meta-tags">
                  <span v-if="item.brand" class="meta-chip">{{ item.brand }}</span>
                  <span v-if="item.model" class="meta-chip">{{ item.model }}</span>
                  <span class="condition-chip" :class="`cond-${item.conditionLevel}`">
                    {{ item.conditionLevel }} 级
                  </span>
                </div>
              </div>
              <el-tag :type="getStatusTagType(item.status)" size="small" round>
                {{ item.statusText }}
              </el-tag>
            </div>

            <!-- 图片缩略图行 -->
            <div v-if="parseImages(item.images).length > 0" class="thumb-row">
              <div
                  v-for="(img, idx) in parseImages(item.images).slice(0, 4)"
                  :key="idx"
                  class="thumb-item"
                  @click.stop="openImagePreview(parseImages(item.images), idx)"
              >
                <img :src="img" alt="器材图片" />
                <div v-if="idx === 3 && parseImages(item.images).length > 4" class="thumb-more">
                  +{{ parseImages(item.images).length - 4 }}
                </div>
              </div>
            </div>

            <div v-if="item.assessedPrice" class="price-banner">
              <span class="price-label">管理员报价</span>
              <span class="price-amount">¥{{ Number(item.assessedPrice).toFixed(2) }}</span>
              <span v-if="item.status === 1" class="price-hint">等待您确认</span>
            </div>

            <div v-if="item.logisticsCompany" class="logistics-row">
              <el-icon><Van /></el-icon>
              <span>{{ item.logisticsCompany }}</span>
              <span class="tracking-no">{{ item.trackingNumber }}</span>
            </div>

            <div class="card-footer">
              <span class="recycle-no">{{ item.recycleNo }}</span>
              <span class="create-time">{{ item.createTime }}</span>
              <div class="action-buttons" @click.stop>
                <el-button v-if="item.status === 0"
                           size="small" type="danger" plain round @click="handleCancel(item)">
                  取消申请
                </el-button>
                <template v-if="item.status === 1">
                  <el-button size="small" type="success" round @click="handleConfirmQuote(item)">确认报价</el-button>
                  <el-button size="small" type="warning" plain round @click="handleRejectQuote(item)">拒绝报价</el-button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-pagination
          v-if="total > 0"
          class="pagination"
          background layout="prev, pager, next"
          :total="total" :page-size="pageSize"
          v-model:current-page="pageNum"
          @current-change="loadList"
      />
    </div>

    <!-- ==================== 提交申请弹窗 ==================== -->
    <el-dialog
        v-model="applyDialogVisible"
        title="提交二手回收申请"
        width="560px"
        align-center append-to-body destroy-on-close
        class="apply-dialog"
    >
      <el-form
          ref="applyFormRef"
          :model="applyForm"
          :rules="applyRules"
          label-position="top"
      >
        <el-form-item label="器材名称" prop="productName">
          <el-input
              v-model="applyForm.productName"
              placeholder="例：天文望远镜 C8"
              maxlength="200" show-word-limit size="large"
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="品牌" class="form-item-half">
            <el-input v-model="applyForm.brand" placeholder="例：星特朗（可选）" maxlength="100" />
          </el-form-item>
          <el-form-item label="型号" class="form-item-half">
            <el-input v-model="applyForm.model" placeholder="例：PowerSeeker 70AZ（可选）" maxlength="100" />
          </el-form-item>
        </div>

        <el-form-item label="成色等级" prop="conditionLevel">
          <div class="condition-grid">
            <div
                v-for="opt in conditionOptions" :key="opt.value"
                class="condition-card"
                :class="[`cond-card-${opt.value}`, { active: applyForm.conditionLevel === opt.value }]"
                @click="applyForm.conditionLevel = opt.value"
            >
              <div class="cond-grade">{{ opt.value }} 级</div>
              <div class="cond-desc">{{ opt.desc }}</div>
              <div class="cond-check">
                <el-icon v-if="applyForm.conditionLevel === opt.value"><Select /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- ===== 图片上传区 ===== -->
        <el-form-item class="upload-form-item">
          <template #label>
            <span class="upload-label">
              <span class="upload-label-title">器材实拍图片</span>
              <span class="upload-label-hint">最多 6 张，每张不超过 10MB，有图片更易获得准确报价</span>
            </span>
          </template>

          <!-- 已选图片预览 -->
          <div class="upload-area">
            <div class="upload-grid">
              <div
                  v-for="(img, idx) in uploadedImages"
                  :key="idx"
                  class="upload-preview-item"
              >
                <img :src="img" alt="预览" @click="openImagePreview(uploadedImages, idx)" />
                <button class="remove-btn" @click.stop="removeImage(idx)">
                  <el-icon><Close /></el-icon>
                </button>
              </div>

              <!-- 上传触发按钮 -->
              <div
                  v-if="uploadedImages.length < 6"
                  class="upload-trigger"
                  :class="{ 'drag-over': isDragOver }"
                  @click="triggerFileInput"
                  @dragover.prevent="isDragOver = true"
                  @dragleave="isDragOver = false"
                  @drop.prevent="handleDrop"
              >
                <span class="upload-text">点击或拖入</span>
                <span class="upload-sub">JPG / PNG / WEBP</span>
              </div>
            </div>

            <!-- 隐藏的 file input -->
            <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style="display:none"
                @change="handleFileSelect"
            />
          </div>

          <!-- 压缩进度 -->
          <div v-if="compressing" class="compress-hint">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在处理图片…
          </div>
        </el-form-item>

        <el-form-item label="器材描述">
          <el-input
              v-model="applyForm.description"
              type="textarea" :rows="3"
              placeholder="描述器材实际状况、配件是否齐全、使用痕迹等（选填）"
              maxlength="1000" show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">提交申请</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 申请详情弹窗 ==================== -->
    <el-dialog
        v-model="detailDialogVisible"
        title="回收申请详情"
        width="580px"
        align-center append-to-body
        class="detail-dialog"
    >
      <div v-if="currentDetail" class="detail-content">

        <div class="detail-status-header" :class="`detail-status-${currentDetail.status}`">
          <el-icon class="status-icon-big">
            <component :is="getStatusIcon(currentDetail.status)" />
          </el-icon>
          <div>
            <div class="status-name">{{ currentDetail.statusText }}</div>
            <div class="status-sub">回收单号：{{ currentDetail.recycleNo }}</div>
          </div>
        </div>

        <!-- 图片画廊 -->
        <div v-if="parseImages(currentDetail.images).length > 0" class="detail-section gallery-section">
          <div class="section-label">器材图片（{{ parseImages(currentDetail.images).length }} 张）</div>
          <div class="gallery-grid">
            <div
                v-for="(img, idx) in parseImages(currentDetail.images)"
                :key="idx"
                class="gallery-item"
                @click="openImagePreview(parseImages(currentDetail.images), idx)"
            >
              <img :src="img" :alt="`图片${idx+1}`" />
              <div class="gallery-overlay">
                <el-icon><ZoomIn /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-label">器材信息</div>
          <div class="info-grid">
            <div class="info-item span2">
              <span class="info-key">器材名称</span>
              <span class="info-val bold">{{ currentDetail.productName }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">品牌</span>
              <span class="info-val">{{ currentDetail.brand || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">型号</span>
              <span class="info-val">{{ currentDetail.model || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">成色等级</span>
              <span class="info-val">
                <span class="condition-chip" :class="`cond-${currentDetail.conditionLevel}`">{{ currentDetail.conditionLevel }} 级</span>
                &nbsp;{{ currentDetail.conditionLevelText }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-key">申请时间</span>
              <span class="info-val">{{ currentDetail.createTime }}</span>
            </div>
          </div>
          <div v-if="currentDetail.description" class="desc-block">
            <span class="info-key">器材描述</span>
            <p class="desc-text">{{ currentDetail.description }}</p>
          </div>
        </div>

        <div v-if="currentDetail.assessedPrice" class="detail-section quote-section">
          <div class="section-label">回收报价</div>
          <div class="quote-display">
            <span class="quote-price">¥{{ Number(currentDetail.assessedPrice).toFixed(2) }}</span>
            <span v-if="currentDetail.status === 4" class="quote-badge success">已到账钱包</span>
            <span v-else-if="currentDetail.status === 1" class="quote-badge pending">待您确认</span>
          </div>
          <p v-if="currentDetail.adminRemark" class="quote-remark">{{ currentDetail.adminRemark }}</p>
        </div>

        <div v-if="currentDetail.status === 5 && currentDetail.adminRemark" class="detail-section reject-section">
          <div class="section-label">拒绝原因</div>
          <p class="reject-text">{{ currentDetail.adminRemark }}</p>
        </div>

        <div v-if="currentDetail.logisticsCompany" class="detail-section">
          <div class="section-label">取件快递</div>
          <div class="logistics-info">
            <span class="logistics-company">{{ currentDetail.logisticsCompany }}</span>
            <span class="logistics-tracking">{{ currentDetail.trackingNumber }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <template v-if="currentDetail && currentDetail.status === 1">
            <el-button type="success" :loading="submitLoading" @click="handleConfirmQuote(currentDetail)">确认报价</el-button>
            <el-button type="warning" plain :loading="submitLoading" @click="handleRejectQuote(currentDetail)">拒绝报价</el-button>
          </template>
          <el-button v-if="currentDetail && currentDetail.status === 0"
                     type="danger" plain :loading="submitLoading" @click="handleCancel(currentDetail)">取消申请</el-button>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 图片大图预览 ==================== -->
    <el-image-viewer
        v-if="previewVisible"
        :url-list="previewImages"
        :initial-index="previewIndex"
        @close="previewVisible = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Van, Select, Close, Loading, ZoomIn,
  Clock, WarningFilled, CircleCheckFilled, CircleCloseFilled, Finished
} from '@element-plus/icons-vue'
import {
  getMyRecyclingList, submitRecycling,
  confirmRecyclingQuote, rejectRecyclingQuote, cancelRecycling
} from '@/api/recycling'

// ────────── 列表状态 ──────────
const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const recyclingMessageOptions = {
  customClass: 'recycling-message-box',
  confirmButtonClass: 'recycling-message-confirm',
  cancelButtonClass: 'recycling-message-cancel'
}

// ────────── 弹窗状态 ──────────
const applyDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const submitLoading = ref(false)
const currentDetail = ref(null)

// ────────── 申请表单 ──────────
const applyFormRef = ref(null)
const applyForm = ref({ productName: '', brand: '', model: '', conditionLevel: '', description: '' })
const applyRules = {
  productName: [{ required: true, message: '请输入器材名称', trigger: 'blur' }],
  conditionLevel: [{ required: true, message: '请选择成色等级', trigger: 'change' }]
}
const conditionOptions = [
  { value: 'S', desc: '全新 / 几乎未使用' },
  { value: 'A', desc: '九成新，无明显磨损' },
  { value: 'B', desc: '七八成新，有轻微痕迹' },
  { value: 'C', desc: '六成以下，有明显瑕疵' }
]

// ────────── 图片上传 ──────────
const uploadedImages = ref([])   // base64 数组
const fileInputRef = ref(null)
const isDragOver = ref(false)
const compressing = ref(false)

const triggerFileInput = () => fileInputRef.value?.click()

const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  await processFiles(files)
}

const handleDrop = async (e) => {
  isDragOver.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  await processFiles(files)
}

const processFiles = async (files) => {
  const remaining = 6 - uploadedImages.value.length
  if (remaining <= 0) return
  const toProcess = files.slice(0, remaining)

  compressing.value = true
  try {
    const results = await Promise.all(toProcess.map(compressImage))
    uploadedImages.value.push(...results)
  } catch {
    ElMessage.error('图片处理失败，请重试')
  } finally {
    compressing.value = false
  }
}

// 压缩到最长边 1200px，质量 0.82，返回 base64
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const removeImage = (idx) => {
  uploadedImages.value.splice(idx, 1)
}

// ────────── 图片预览 ──────────
const previewVisible = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)

const openImagePreview = (images, index) => {
  previewImages.value = images
  previewIndex.value = index
  previewVisible.value = true
}

// ────────── 工具：解析 images 字段 ──────────
const parseImages = (images) => {
  if (!images) return []
  try { return JSON.parse(images) } catch { return [] }
}

// ────────── 加载列表 ──────────
const loadList = async () => {
  loading.value = true
  try {
    const res = await getMyRecyclingList({ pageNum: pageNum.value, pageSize: pageSize.value })
    list.value = res.data.records || []
    total.value = res.data.total || 0
  } catch { ElMessage.error('加载失败，请重试') }
  finally { loading.value = false }
}

// ────────── 打开申请弹窗 ──────────
const openApplyDialog = () => {
  applyForm.value = { productName: '', brand: '', model: '', conditionLevel: '', description: '' }
  uploadedImages.value = []
  applyDialogVisible.value = true
}

// ────────── 提交申请 ──────────
const handleSubmit = async () => {
  if (!applyFormRef.value) return
  await applyFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = {
        ...applyForm.value,
        images: uploadedImages.value.length > 0 ? JSON.stringify(uploadedImages.value) : null
      }
      await submitRecycling(payload)
      ElMessage.success('申请提交成功，等待管理员审核')
      applyDialogVisible.value = false
      loadList()
    } catch (e) { ElMessage.error(e?.response?.data?.message || '提交失败') }
    finally { submitLoading.value = false }
  })
}

// ────────── 详情 ──────────
const openDetail = (item) => { currentDetail.value = item; detailDialogVisible.value = true }

// ────────── 确认报价 ──────────
const handleConfirmQuote = async (item) => {
  try {
    await ElMessageBox.confirm(
        `确认接受 ¥${Number(item.assessedPrice).toFixed(2)} 的回收报价？确认后管理员将安排上门取件。`,
        '确认报价',
        {
          confirmButtonText: '确认接受',
          cancelButtonText: '再考虑',
          type: 'success',
          appendToBody: true,
          ...recyclingMessageOptions
        }
    )
  } catch { return }
  submitLoading.value = true
  try {
    await confirmRecyclingQuote(item.id)
    ElMessage.success('已确认报价，等待管理员安排取件')
    detailDialogVisible.value = false; loadList()
  } catch (e) { ElMessage.error(e?.response?.data?.message || '操作失败') }
  finally { submitLoading.value = false }
}

// ────────── 拒绝报价 ──────────
const handleRejectQuote = async (item) => {
  try {
    await ElMessageBox.confirm('确认拒绝此次报价？申请将被关闭。', '拒绝报价',
        {
          confirmButtonText: '确认拒绝',
          cancelButtonText: '取消',
          type: 'warning',
          appendToBody: true,
          ...recyclingMessageOptions
        })
  } catch { return }
  submitLoading.value = true
  try {
    await rejectRecyclingQuote(item.id)
    ElMessage.success('已拒绝报价')
    detailDialogVisible.value = false; loadList()
  } catch (e) { ElMessage.error(e?.response?.data?.message || '操作失败') }
  finally { submitLoading.value = false }
}

// ────────── 取消申请 ──────────
const handleCancel = async (item) => {
  try {
    await ElMessageBox.confirm('确认取消此回收申请？', '取消申请',
        {
          confirmButtonText: '确认取消',
          cancelButtonText: '不取消',
          type: 'warning',
          appendToBody: true,
          ...recyclingMessageOptions
        })
  } catch { return }
  submitLoading.value = true
  try {
    await cancelRecycling(item.id)
    ElMessage.success('申请已取消')
    detailDialogVisible.value = false; loadList()
  } catch (e) { ElMessage.error(e?.response?.data?.message || '操作失败') }
  finally { submitLoading.value = false }
}

// ────────── 工具方法 ──────────
const getStatusTagType = (status) =>
    ({ 0: 'info', 1: 'warning', 2: 'primary', 3: 'primary', 4: 'success', 5: 'danger', 6: 'info' }[status] ?? 'info')

const getStatusIcon = (status) =>
    ({ 0: Clock, 1: WarningFilled, 2: CircleCheckFilled, 3: Van, 4: Finished, 5: CircleCloseFilled, 6: CircleCloseFilled }[status] ?? Clock)

onMounted(loadList)
</script>

<style scoped>
.recycling-container {
  padding: 24px;
  max-width: 860px;
  margin: 0 auto;
}

/* ─── Banner ─── */
.page-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border: 1px solid #c8e6c9;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
}
.banner-text { display: flex; align-items: center; gap: 14px; }
.banner-icon { font-size: 36px; line-height: 1; }
.banner-text h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #2e7d32; }
.banner-text p { margin: 0; font-size: 13px; color: #558b2f; }
.apply-btn { background: #43a047; border-color: #43a047; border-radius: 8px; padding: 10px 20px; font-weight: 600; }
.apply-btn:hover { background: #2e7d32; border-color: #2e7d32; }

/* ─── 列表卡片 ─── */
.list-wrapper { min-height: 200px; }
.card-list { display: flex; flex-direction: column; gap: 10px; }

.recycling-card {
  display: flex;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
}
.recycling-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); transform: translateY(-1px); }

.status-bar { width: 4px; flex-shrink: 0; }
.status-0 .status-bar { background: #909399; }
.status-1 .status-bar { background: #e6a23c; }
.status-2 .status-bar, .status-3 .status-bar { background: #409eff; }
.status-4 .status-bar { background: #67c23a; }
.status-5 .status-bar, .status-6 .status-bar { background: #f56c6c; }

.card-main { flex: 1; padding: 14px 16px; min-width: 0; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.header-left { flex: 1; min-width: 0; }
.product-name { display: block; font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.meta-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.meta-chip { font-size: 11px; color: #606266; background: #f4f4f5; border-radius: 4px; padding: 2px 7px; }

.condition-chip { font-size: 11px; font-weight: 600; border-radius: 4px; padding: 2px 8px; }
.cond-S { background: #e8f5e9; color: #2e7d32; }
.cond-A { background: #e3f2fd; color: #1565c0; }
.cond-B { background: #fff8e1; color: #e65100; }
.cond-C { background: #fce4ec; color: #c62828; }

/* ─── 卡片缩略图 ─── */
.thumb-row {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.thumb-item {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #e8eaed;
  cursor: zoom-in;
}
.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.thumb-item:hover img { transform: scale(1.08); }
.thumb-more {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.price-banner {
  display: flex; align-items: center; gap: 10px;
  background: linear-gradient(90deg, #f0faf0, #fafff9);
  border: 1px solid #c8e6c9; border-radius: 6px;
  padding: 8px 12px; margin-bottom: 8px;
}
.price-label { font-size: 12px; color: #558b2f; }
.price-amount { font-size: 20px; font-weight: 700; color: #2e7d32; letter-spacing: -0.5px; }
.price-hint { font-size: 11px; color: #e6a23c; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 10px; padding: 1px 8px; }

.logistics-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #606266; margin-bottom: 8px; }
.tracking-no { color: #409eff; font-family: 'Courier New', monospace; font-weight: 600; }

.card-footer {
  display: flex; align-items: center; gap: 8px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}
.recycle-no { font-size: 11px; color: #bbb; font-family: 'Courier New', monospace; flex: 1; }
.create-time { font-size: 11px; color: #c0c4cc; }
.action-buttons { display: flex; gap: 6px; }
.pagination { margin-top: 20px; text-align: center; }

/* ─── 提交弹窗 ─── */
:deep(.apply-dialog .el-dialog__header) { padding: 20px 24px 16px; border-bottom: 1px solid #f0f0f0; }
:deep(.apply-dialog .el-dialog__body) { padding: 20px 24px; }
:deep(.el-form--label-top .el-form-item__label) { font-size: 13px; font-weight: 600; color: #303133; padding-bottom: 6px; }

.form-row { display: flex; gap: 16px; }
.form-item-half { flex: 1; }

/* 成色卡片 */
.condition-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
.condition-card {
  position: relative; border: 2px solid #e8eaed; border-radius: 10px;
  padding: 12px 14px; cursor: pointer; transition: all 0.2s;
  background: #fafafa; user-select: none;
}
.condition-card:hover { background: #fff; }
.cond-card-S.active { border-color: #43a047; background: #f1f8e9; }
.cond-card-A.active { border-color: #1e88e5; background: #e8f4fd; }
.cond-card-B.active { border-color: #ef6c00; background: #fff8f0; }
.cond-card-C.active { border-color: #e53935; background: #fff5f5; }
.cond-card-S:hover:not(.active) { border-color: #a5d6a7; }
.cond-card-A:hover:not(.active) { border-color: #90caf9; }
.cond-card-B:hover:not(.active) { border-color: #ffcc80; }
.cond-card-C:hover:not(.active) { border-color: #ef9a9a; }
.cond-grade { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
.cond-card-S .cond-grade { color: #2e7d32; }
.cond-card-A .cond-grade { color: #1565c0; }
.cond-card-B .cond-grade { color: #e65100; }
.cond-card-C .cond-grade { color: #c62828; }
.cond-desc { font-size: 11px; color: #909399; line-height: 1.4; }
.cond-check { position: absolute; top: 8px; right: 8px; font-size: 16px; }
.cond-card-S .cond-check { color: #43a047; }
.cond-card-A .cond-check { color: #1e88e5; }
.cond-card-B .cond-check { color: #ef6c00; }
.cond-card-C .cond-check { color: #e53935; }

/* ─── 图片上传区 ─── */
.upload-label { display: flex; align-items: baseline; gap: 8px; }
.upload-label-hint { font-size: 11px; color: #aaa; font-weight: 400; }

.upload-area { width: 100%; }

.upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.upload-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  flex-shrink: 0;
}
.upload-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
  transition: transform 0.2s;
}
.upload-preview-item:hover img { transform: scale(1.05); }

.remove-btn {
  position: absolute;
  top: 3px; right: 3px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  padding: 0;
  transition: background 0.15s;
}
.remove-btn:hover { background: rgba(220,40,40,0.85); }

.upload-trigger {
  width: 80px;
  height: 80px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
  flex-shrink: 0;
}
.upload-trigger:hover, .upload-trigger.drag-over {
  border-color: #409eff;
  background: #ecf5ff;
}
.upload-trigger.drag-over { border-style: solid; }

.upload-icon { font-size: 22px; color: #c0c4cc; }
.upload-trigger:hover .upload-icon, .upload-trigger.drag-over .upload-icon { color: #409eff; }
.upload-text { font-size: 11px; color: #909399; }
.upload-sub { font-size: 10px; color: #c0c4cc; }

.compress-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

/* ─── 详情弹窗 ─── */
:deep(.detail-dialog .el-dialog__body) { padding: 0 0 8px; }

.detail-content { display: flex; flex-direction: column; }

.detail-status-header { display: flex; align-items: center; gap: 14px; padding: 20px 24px; }
.detail-status-0 { background: #f5f5f5; }
.detail-status-1 { background: #fdf6ec; }
.detail-status-2, .detail-status-3 { background: #ecf5ff; }
.detail-status-4 { background: #f0f9eb; }
.detail-status-5, .detail-status-6 { background: #fef0f0; }
.status-icon-big { font-size: 32px; }
.detail-status-0 .status-icon-big { color: #909399; }
.detail-status-1 .status-icon-big { color: #e6a23c; }
.detail-status-2 .status-icon-big, .detail-status-3 .status-icon-big { color: #409eff; }
.detail-status-4 .status-icon-big { color: #67c23a; }
.detail-status-5 .status-icon-big, .detail-status-6 .status-icon-big { color: #f56c6c; }
.status-name { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.status-sub { font-size: 12px; color: #909399; font-family: 'Courier New', monospace; margin-top: 2px; }

.detail-section { padding: 14px 24px; border-top: 1px solid #f5f5f5; }
.section-label { font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }

/* 图片画廊 */
.gallery-section { background: #fafafa; }
.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.gallery-item {
  position: relative;
  width: 90px; height: 90px;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid #e8eaed;
}
.gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.gallery-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 20px;
  transition: background 0.2s;
}
.gallery-item:hover img { transform: scale(1.06); }
.gallery-item:hover .gallery-overlay { background: rgba(0,0,0,0.3); }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-item { display: flex; flex-direction: column; gap: 3px; }
.info-item.span2 { grid-column: span 2; }
.info-key { font-size: 11px; color: #aaa; }
.info-val { font-size: 14px; color: #303133; }
.info-val.bold { font-weight: 600; font-size: 15px; }
.desc-block { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; }
.desc-text { margin: 6px 0 0; font-size: 13px; color: #606266; line-height: 1.7; white-space: pre-wrap; }

.quote-section { background: #f9fef9; }
.quote-display { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.quote-price { font-size: 32px; font-weight: 800; color: #2e7d32; letter-spacing: -1px; }
.quote-badge { font-size: 12px; border-radius: 20px; padding: 3px 10px; font-weight: 500; }
.quote-badge.success { background: #e8f5e9; color: #2e7d32; }
.quote-badge.pending { background: #fdf6ec; color: #e6a23c; border: 1px solid #faecd8; }
.quote-remark { margin: 0; font-size: 13px; color: #909399; }

.reject-section { background: #fff8f8; }
.reject-text { margin: 0; font-size: 14px; color: #f56c6c; line-height: 1.6; }

.logistics-info { display: flex; align-items: center; gap: 12px; background: #f5f7fa; border-radius: 6px; padding: 10px 14px; }
.logistics-company { font-size: 14px; font-weight: 600; color: #303133; }
.logistics-tracking { font-size: 13px; color: #409eff; font-family: 'Courier New', monospace; font-weight: 600; }

.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 0 24px; }

/* Final after-sale recycling pass */
:global(body .recycling-container.recycling-container) {
  max-width: 100%;
  padding: 0;
  color: #111827;
}

:global(body .recycling-container.recycling-container .page-banner) {
  margin: 0 0 16px;
  padding: 18px 22px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 14px 38px rgba(17, 24, 39, 0.06);
}

:global(body .recycling-container.recycling-container .banner-text) {
  align-items: center;
}

:global(body .recycling-container.recycling-container .banner-icon) {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(156, 107, 53, 0.22);
  border-radius: 7px;
  background: #fff8ec;
  color: #8a5a22;
  font-size: 21px;
}

:global(body .recycling-container.recycling-container .section-kicker) {
  display: block;
  margin-bottom: 7px;
  color: #9c6b35;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0;
}

:global(body .recycling-container.recycling-container .banner-text h2) {
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 850;
  letter-spacing: 0;
}

:global(body .recycling-container.recycling-container .banner-text p) {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
}

:global(body .recycling-container.recycling-container .el-button) {
  min-height: 34px;
  border-radius: 4px;
  font-weight: 760;
  letter-spacing: 0;
}

:global(body .recycling-container.recycling-container .el-button span) {
  color: inherit;
}

:global(body .recycling-container.recycling-container .apply-btn.el-button--primary),
:global(body .recycling-container.recycling-container .el-button--primary) {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

:global(body .recycling-container.recycling-container .apply-btn.el-button--primary:hover),
:global(body .recycling-container.recycling-container .el-button--primary:hover) {
  border-color: #273142;
  background: #273142;
}

:global(body .recycling-container.recycling-container .el-button--success) {
  border-color: #4d7c5a;
  background: #4d7c5a;
  color: #fff;
}

:global(body .recycling-container.recycling-container .el-button--warning.is-plain) {
  border-color: rgba(156, 107, 53, 0.34);
  background: #fff8ec;
  color: #8a5a22;
}

:global(body .recycling-container.recycling-container .el-button--danger.is-plain) {
  border-color: rgba(156, 79, 30, 0.34);
  background: #fff8ec;
  color: #9c4f1e;
}

:global(body .recycling-container.recycling-container .list-wrapper) {
  min-height: 260px;
}

:global(body .recycling-container.recycling-container .card-list) {
  gap: 12px;
}

:global(body .recycling-container.recycling-container .recycling-card) {
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.055);
}

:global(body .recycling-container.recycling-container .recycling-card:hover) {
  border-color: rgba(156, 107, 53, 0.26);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.09);
  transform: translateY(-2px);
}

:global(body .recycling-container.recycling-container .status-bar) {
  width: 4px;
}

:global(body .recycling-container.recycling-container .status-0 .status-bar) {
  background: #6b7280;
}

:global(body .recycling-container.recycling-container .status-1 .status-bar) {
  background: #9c6b35;
}

:global(body .recycling-container.recycling-container .status-2 .status-bar),
:global(body .recycling-container.recycling-container .status-3 .status-bar) {
  background: #111827;
}

:global(body .recycling-container.recycling-container .status-4 .status-bar) {
  background: #4d7c5a;
}

:global(body .recycling-container.recycling-container .status-5 .status-bar),
:global(body .recycling-container.recycling-container .status-6 .status-bar) {
  background: #9c4f1e;
}

:global(body .recycling-container.recycling-container .card-main) {
  padding: 16px 18px;
}

:global(body .recycling-container.recycling-container .product-name) {
  color: #111827;
  font-size: 16px;
  font-weight: 850;
  line-height: 1.5;
}

:global(body .recycling-container.recycling-container .meta-chip),
:global(body .recycling-container.recycling-container .condition-chip) {
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 999px;
  background: #f8f5ef;
  color: #4b5563;
  font-weight: 700;
}

:global(body .recycling-container.recycling-container .cond-S),
:global(body .recycling-container.recycling-container .cond-A),
:global(body .recycling-container.recycling-container .cond-B),
:global(body .recycling-container.recycling-container .cond-C) {
  border-color: rgba(156, 107, 53, 0.24);
  background: #fff8ec;
  color: #8a5a22;
}

:global(body .recycling-container.recycling-container .el-tag) {
  border-radius: 999px;
  font-weight: 760;
}

:global(body .recycling-container.recycling-container .el-tag--info),
:global(body .recycling-container.recycling-container .el-tag--primary),
:global(body .recycling-container.recycling-container .el-tag--warning) {
  border-color: rgba(156, 107, 53, 0.26);
  background: #fff8ec;
  color: #8a5a22;
}

:global(body .recycling-container.recycling-container .el-tag--success) {
  border-color: rgba(77, 124, 90, 0.28);
  background: #f4f8f2;
  color: #4d7c5a;
}

:global(body .recycling-container.recycling-container .el-tag--danger) {
  border-color: rgba(156, 79, 30, 0.28);
  background: #fff1e8;
  color: #9c4f1e;
}

:global(body .recycling-container.recycling-container .thumb-item) {
  border-color: rgba(17, 24, 39, 0.12);
  border-radius: 6px;
  background: #f8f5ef;
}

:global(body .recycling-container.recycling-container .price-banner) {
  border-color: rgba(156, 107, 53, 0.24);
  border-radius: 7px;
  background: #fff8ec;
}

:global(body .recycling-container.recycling-container .price-label),
:global(body .recycling-container.recycling-container .price-hint) {
  color: #8a5a22;
  font-weight: 700;
}

:global(body .recycling-container.recycling-container .price-amount) {
  color: #9c6b35;
  font-weight: 850;
  letter-spacing: 0;
}

:global(body .recycling-container.recycling-container .price-hint) {
  border-color: rgba(156, 107, 53, 0.2);
  background: #fffdfa;
}

:global(body .recycling-container.recycling-container .logistics-row),
:global(body .recycling-container.recycling-container .create-time),
:global(body .recycling-container.recycling-container .recycle-no) {
  color: #6b7280;
  font-weight: 650;
}

:global(body .recycling-container.recycling-container .tracking-no) {
  color: #8a5a22;
}

:global(body .recycling-container.recycling-container .card-footer) {
  border-top-color: rgba(17, 24, 39, 0.08);
}

:global(body .recycling-container.recycling-container .el-empty) {
  min-height: 340px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 14px 38px rgba(17, 24, 39, 0.06);
}

:global(body .recycling-container.recycling-container .el-empty__description p) {
  color: #4b5563;
  font-weight: 650;
}

:global(body .recycling-container.recycling-container .pagination) {
  margin-top: 22px;
}

:global(body .recycling-container.recycling-container .el-pagination.is-background .el-pager li),
:global(body .recycling-container.recycling-container .el-pagination.is-background button) {
  border-radius: 4px;
  background: #fffdfa;
  color: #374151;
}

:global(body .recycling-container.recycling-container .el-pagination.is-background .el-pager li.is-active) {
  background: #111827;
  color: #fff;
}

:global(.apply-dialog .el-dialog),
:global(.apply-dialog.el-dialog),
:global(.detail-dialog .el-dialog),
:global(.detail-dialog.el-dialog) {
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 28px 70px rgba(17, 24, 39, 0.22);
}

:global(.apply-dialog .el-dialog__header),
:global(.apply-dialog.el-dialog .el-dialog__header),
:global(.detail-dialog .el-dialog__header),
:global(.detail-dialog.el-dialog .el-dialog__header) {
  margin: 0;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  background: #f8f5ef;
}

:global(.apply-dialog .el-dialog__title),
:global(.apply-dialog.el-dialog .el-dialog__title),
:global(.detail-dialog .el-dialog__title),
:global(.detail-dialog.el-dialog .el-dialog__title) {
  color: #111827;
  font-size: 18px;
  font-weight: 850;
}

:global(.apply-dialog .el-dialog__body),
:global(.apply-dialog.el-dialog .el-dialog__body),
:global(.detail-dialog .el-dialog__body),
:global(.detail-dialog.el-dialog .el-dialog__body) {
  padding: 20px 22px;
}

:global(.apply-dialog .el-dialog__footer),
:global(.apply-dialog.el-dialog .el-dialog__footer),
:global(.detail-dialog .el-dialog__footer),
:global(.detail-dialog.el-dialog .el-dialog__footer) {
  padding: 0 22px 20px;
}

:global(.apply-dialog .el-form-item__label),
:global(.apply-dialog.el-dialog .el-form-item__label) {
  color: #111827;
  font-weight: 760;
}

:global(.apply-dialog .el-input__wrapper),
:global(.apply-dialog .el-textarea__inner),
:global(.apply-dialog.el-dialog .el-input__wrapper),
:global(.apply-dialog.el-dialog .el-textarea__inner) {
  min-height: 38px;
  border-radius: 5px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.14);
}

:global(.apply-dialog .el-input__inner),
:global(.apply-dialog .el-textarea__inner),
:global(.apply-dialog.el-dialog .el-input__inner),
:global(.apply-dialog.el-dialog .el-textarea__inner) {
  color: #111827;
  font-weight: 600;
}

:global(.apply-dialog .el-input__wrapper.is-focus),
:global(.apply-dialog .el-textarea__inner:focus),
:global(.apply-dialog.el-dialog .el-input__wrapper.is-focus),
:global(.apply-dialog.el-dialog .el-textarea__inner:focus) {
  box-shadow: inset 0 0 0 1px #9c6b35, 0 0 0 3px rgba(156, 107, 53, 0.1);
}

:global(.apply-dialog .condition-card),
:global(.apply-dialog.el-dialog .condition-card) {
  border-width: 1px;
  border-color: rgba(17, 24, 39, 0.12);
  border-radius: 7px;
  background: #fff;
}

:global(.apply-dialog .condition-card:hover),
:global(.apply-dialog .condition-card.active),
:global(.apply-dialog.el-dialog .condition-card:hover),
:global(.apply-dialog.el-dialog .condition-card.active) {
  border-color: rgba(156, 107, 53, 0.48);
  background: #fff8ec;
}

:global(.apply-dialog .cond-grade),
:global(.apply-dialog.el-dialog .cond-grade) {
  color: #111827;
}

:global(.apply-dialog .cond-desc),
:global(.apply-dialog.el-dialog .cond-desc),
:global(.apply-dialog .upload-label-hint),
:global(.apply-dialog.el-dialog .upload-label-hint) {
  color: #6b7280;
}

:global(.apply-dialog .upload-form-item),
:global(.apply-dialog.el-dialog .upload-form-item) {
  margin-top: 2px;
}

:global(.apply-dialog .upload-form-item .el-form-item__label),
:global(.apply-dialog.el-dialog .upload-form-item .el-form-item__label) {
  display: block;
  height: auto;
  min-height: 0;
  margin-bottom: 10px;
  padding-bottom: 0;
  line-height: 1.45;
  white-space: normal;
}

:global(.apply-dialog .upload-label),
:global(.apply-dialog.el-dialog .upload-label) {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  line-height: 1.45;
}

:global(.apply-dialog .upload-label-title),
:global(.apply-dialog.el-dialog .upload-label-title) {
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

:global(.apply-dialog .upload-label-hint),
:global(.apply-dialog.el-dialog .upload-label-hint) {
  display: block;
  max-width: 100%;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.55;
  white-space: normal;
}

:global(.apply-dialog .upload-area),
:global(.apply-dialog.el-dialog .upload-area) {
  margin-top: 8px;
}

:global(.apply-dialog .upload-preview-item),
:global(.apply-dialog .upload-trigger),
:global(.apply-dialog.el-dialog .upload-preview-item),
:global(.apply-dialog.el-dialog .upload-trigger) {
  border-color: rgba(17, 24, 39, 0.14);
  border-radius: 7px;
  background: #f8f5ef;
}

:global(.apply-dialog .upload-trigger),
:global(.apply-dialog.el-dialog .upload-trigger) {
  width: 104px;
  height: 84px;
  gap: 6px;
  padding: 0 10px;
  text-align: center;
  line-height: 1.35;
}

:global(.apply-dialog .upload-trigger:hover),
:global(.apply-dialog .upload-trigger.drag-over),
:global(.apply-dialog.el-dialog .upload-trigger:hover),
:global(.apply-dialog.el-dialog .upload-trigger.drag-over) {
  border-color: #9c6b35;
  background: #fff8ec;
}

:global(.apply-dialog .upload-text),
:global(.apply-dialog.el-dialog .upload-text) {
  color: #374151;
  font-size: 12px;
  font-weight: 700;
}

:global(.apply-dialog .upload-sub),
:global(.apply-dialog.el-dialog .upload-sub),
:global(.apply-dialog .compress-hint),
:global(.apply-dialog.el-dialog .compress-hint) {
  color: #6b7280;
  font-size: 11px;
  line-height: 1.45;
}

:global(.detail-dialog .detail-status-header),
:global(.detail-dialog.el-dialog .detail-status-header),
:global(.detail-dialog .gallery-section),
:global(.detail-dialog.el-dialog .gallery-section),
:global(.detail-dialog .quote-section),
:global(.detail-dialog.el-dialog .quote-section),
:global(.detail-dialog .reject-section),
:global(.detail-dialog.el-dialog .reject-section) {
  background: #f8f5ef;
}

:global(.detail-dialog .detail-section),
:global(.detail-dialog.el-dialog .detail-section) {
  border-top-color: rgba(17, 24, 39, 0.08);
}

:global(.detail-dialog .status-name),
:global(.detail-dialog .info-val),
:global(.detail-dialog .logistics-company),
:global(.detail-dialog.el-dialog .status-name),
:global(.detail-dialog.el-dialog .info-val),
:global(.detail-dialog.el-dialog .logistics-company) {
  color: #111827;
}

:global(.detail-dialog .status-sub),
:global(.detail-dialog .section-label),
:global(.detail-dialog .info-key),
:global(.detail-dialog .desc-text),
:global(.detail-dialog .quote-remark),
:global(.detail-dialog.el-dialog .status-sub),
:global(.detail-dialog.el-dialog .section-label),
:global(.detail-dialog.el-dialog .info-key),
:global(.detail-dialog.el-dialog .desc-text),
:global(.detail-dialog.el-dialog .quote-remark) {
  color: #6b7280;
}

:global(.detail-dialog .quote-price),
:global(.detail-dialog.el-dialog .quote-price) {
  color: #9c6b35;
  letter-spacing: 0;
}

:global(.detail-dialog .logistics-info),
:global(.detail-dialog.el-dialog .logistics-info) {
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
}

:global(.detail-dialog .logistics-tracking),
:global(.detail-dialog.el-dialog .logistics-tracking) {
  color: #8a5a22;
}

:global(.detail-dialog .gallery-item),
:global(.detail-dialog.el-dialog .gallery-item) {
  border-color: rgba(17, 24, 39, 0.12);
  border-radius: 7px;
}

:global(.apply-dialog .dialog-footer .el-button--primary),
:global(.apply-dialog.el-dialog .dialog-footer .el-button--primary),
:global(.detail-dialog .dialog-footer .el-button--primary),
:global(.detail-dialog.el-dialog .dialog-footer .el-button--primary) {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

:global(.apply-dialog .dialog-footer .el-button--success),
:global(.apply-dialog.el-dialog .dialog-footer .el-button--success),
:global(.detail-dialog .dialog-footer .el-button--success),
:global(.detail-dialog.el-dialog .dialog-footer .el-button--success) {
  border-color: #4d7c5a;
  background: #4d7c5a;
  color: #fff;
}

:global(body .recycling-message-box.el-message-box) {
  width: 420px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 7px;
  box-shadow: 0 28px 70px rgba(17, 24, 39, 0.24);
}

:global(body .recycling-message-box .el-message-box__header) {
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  background: #f8f5ef;
}

:global(body .recycling-message-box .el-message-box__title) {
  color: #111827;
  font-size: 17px;
  font-weight: 800;
}

:global(body .recycling-message-box .el-message-box__content) {
  padding: 18px 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
}

:global(body .recycling-message-box .el-message-box__btns) {
  padding: 0 20px 18px;
}

:global(body .recycling-message-confirm.el-button--primary) {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

:global(body .recycling-message-cancel.el-button) {
  border-color: rgba(17, 24, 39, 0.16);
  background: #fff;
  color: #111827;
}

@media (max-width: 720px) {
  :global(body .recycling-container.recycling-container .page-banner) {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  :global(body .recycling-container.recycling-container .card-footer) {
    align-items: flex-start;
    flex-direction: column;
  }

  :global(.apply-dialog .el-dialog),
  :global(.apply-dialog.el-dialog),
  :global(.detail-dialog .el-dialog),
  :global(.detail-dialog.el-dialog) {
    width: calc(100vw - 28px) !important;
  }

  :global(.apply-dialog .form-row),
  :global(.apply-dialog.el-dialog .form-row),
  :global(.detail-dialog .info-grid),
  :global(.detail-dialog.el-dialog .info-grid) {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
