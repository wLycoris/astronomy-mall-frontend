<template>
  <div class="my-reviews-page">
    <el-card>
      <template #header>
        <span>我的评价</span>
      </template>

      <div v-loading="loading" class="review-list">
        <div
            v-for="review in reviews"
            :key="review.id"
            class="review-item"
            :class="{ 'review-item--deleted': review.status === 0 }"
        >
          <!-- 商品信息 -->
          <div class="product-info">
            <el-image :src="review.productImage" fit="cover" class="product-image" />
            <div class="product-details">
              <div class="product-name">{{ review.productName }}</div>
              <div class="product-price">¥{{ review.productPrice }}</div>
            </div>
          </div>

          <!-- ① 已被管理员删除：只显示原始内容 + 提示 -->
          <template v-if="review.status === 0">
            <div class="review-content">
              <div class="review-header">
                <el-rate :model-value="review.rating" disabled show-score text-color="#ff9900" />
                <span class="review-time">{{ review.createTime }}</span>
              </div>
              <div class="review-text review-text--faded">{{ review.content }}</div>
              <div class="deleted-tip">
                <el-icon><WarnTriangleFilled /></el-icon>
                该评价已被管理员删除，无法再修改或删除
              </div>
            </div>
            <!-- 已删除的评价不显示任何操作按钮 -->
          </template>

          <!-- ② 正常评价 -->
          <template v-else>
            <div class="review-content">
              <div class="review-header">
                <el-rate :model-value="review.rating" disabled show-score text-color="#ff9900" />
                <span class="review-time">{{ review.createTime }}</span>
              </div>
              <div class="review-text">{{ review.content }}</div>

              <!-- 评价图片 -->
              <div v-if="review.imageList && review.imageList.length" class="review-images">
                <el-image
                    v-for="(img, index) in review.imageList"
                    :key="index"
                    :src="img"
                    :preview-src-list="review.imageList"
                    :initial-index="index"
                    fit="cover"
                    class="review-image"
                />
              </div>

              <!-- 商家回复 -->
              <div v-if="review.reply" class="merchant-reply">
                <div class="reply-label">商家回复:</div>
                <div class="reply-content">{{ review.reply }}</div>
                <div class="reply-time">{{ review.replyTime }}</div>
              </div>

              <!-- 点赞数 -->
              <div class="review-stats">
                <el-icon><StarFilled /></el-icon>
                <span>{{ review.likeCount || 0 }}人觉得有用</span>
              </div>
            </div>

            <!-- 操作按钮（仅正常评价显示） -->
            <div class="review-actions">
              <el-button type="primary" size="small" @click="handleEdit(review)">
                修改评价
              </el-button>
              <el-button type="danger" size="small" plain @click="handleDelete(review)">
                删除评价
              </el-button>
            </div>
          </template>
        </div>

        <el-empty v-if="!loading && reviews.length === 0" description="暂无评价记录" />
      </div>

      <el-pagination
          v-if="total > 0"
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadReviews"
          @size-change="handleSizeChange"
          class="pagination"
      />
    </el-card>

    <!-- 修改评价弹窗 -->
    <el-dialog
        v-model="editDialogVisible"
        title="修改评价"
        width="700px"
        :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <div class="dialog-product-info">
          <el-image :src="editForm.productImage" fit="cover" style="width: 60px; height: 60px" />
          <div>
            <div>{{ editForm.productName }}</div>
            <div style="color: #999; font-size: 12px">订单号: {{ editForm.orderId }}</div>
          </div>
        </div>

        <el-form-item label="商品评分" prop="rating">
          <el-rate v-model="editForm.rating" :texts="['非常差', '差', '一般', '好', '非常好']" show-text />
        </el-form-item>

        <el-form-item label="评价内容" prop="content">
          <el-input
              v-model="editForm.content"
              type="textarea"
              :rows="6"
              placeholder="请分享您的购买心得（10-500字）"
              maxlength="500"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="上传图片">
          <el-upload
              v-model:file-list="editFileList"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :limit="9"
              :on-exceed="handleExceed"
              :on-remove="handleRemoveImage"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">最多上传9张图片，支持jpg/png格式</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="匿名评价">
          <el-switch v-model="editForm.isAnonymous" />
          <span style="margin-left: 12px; font-size: 13px; color: #999">
            开启后将隐藏您的昵称和头像
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitEdit">
          提交修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StarFilled, Plus, WarnTriangleFilled } from '@element-plus/icons-vue'
import { getMyReviews, deleteReview, updateReview } from '@/api/review'

const loading    = ref(false)
const submitting = ref(false)
const reviews    = ref([])
const total      = ref(0)
const pageNum    = ref(1)
const pageSize   = ref(10)

const editDialogVisible = ref(false)
const editFormRef       = ref(null)
const editFileList      = ref([])
const currentReviewId   = ref(null)

const editForm = reactive({
  productId:    null,
  orderId:      null,
  productName:  '',
  productImage: '',
  rating:       5,
  content:      '',
  images:       [],
  isAnonymous:  false
})

const editRules = {
  rating:  [{ required: true, message: '请选择评分', trigger: 'change' }],
  content: [
    { required: true, message: '请输入评价内容', trigger: 'blur' },
    { min: 10, max: 500, message: '评价内容长度为10-500字', trigger: 'blur' }
  ]
}

// 加载评价列表（包含已被管理员删除的记录）
const loadReviews = async () => {
  loading.value = true
  try {
    const res = await getMyReviews({ pageNum: pageNum.value, pageSize: pageSize.value })

    reviews.value = res.data.records.map(review => {
      // 已被管理员删除(status=0)的评价不处理图片
      if (review.status === 0) return review

      if (review.images && typeof review.images === 'string') {
        review.imageList = review.images.startsWith('[')
            ? JSON.parse(review.images)
            : review.images.split(',').filter(Boolean)
      } else {
        review.imageList = []
      }
      return review
    })

    total.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 打开编辑弹窗
const handleEdit = (review) => {
  currentReviewId.value    = review.id
  editForm.productId       = review.productId
  editForm.orderId         = review.orderId
  editForm.productName     = review.productName
  editForm.productImage    = review.productImage
  editForm.rating          = review.rating
  editForm.content         = review.content
  editForm.isAnonymous     = review.isAnonymous === 1

  editFileList.value = (review.imageList || []).map((url, index) => ({
    uid: -index - 1,
    name: `image-${index}.jpg`,
    url,
    status: 'success'
  }))

  editDialogVisible.value = true
}

// 提交修改（直接UPDATE，不走删除重发）
const handleSubmitEdit = async () => {
  try {
    await editFormRef.value.validate()
    submitting.value = true

    const images = editFileList.value.map((file, index) =>
        file.url || `https://picsum.photos/200/200?random=${Date.now()}-${index}`
    )

    await updateReview(currentReviewId.value, {
      orderId:     editForm.orderId,
      productId:   editForm.productId,
      rating:      editForm.rating,
      content:     editForm.content,
      images,
      isAnonymous: editForm.isAnonymous
    })

    ElMessage.success('修改成功')
    editDialogVisible.value = false
    loadReviews()
  } catch (error) {
    if (error !== false) ElMessage.error(error.message || '修改失败')
  } finally {
    submitting.value = false
  }
}

// 删除评价
const handleDelete = async (review) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteReview(review.id)
    ElMessage.success('删除成功')
    loadReviews()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除失败')
  }
}

const handleSizeChange  = (size) => { pageSize.value = size; pageNum.value = 1; loadReviews() }
const handleExceed      = () => ElMessage.warning('最多上传9张图片')
const handleRemoveImage = (file) => {
  const index = editFileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) editFileList.value.splice(index, 1)
}

onMounted(() => loadReviews())
</script>

<style scoped lang="scss">
.my-reviews-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.review-list { min-height: 400px; }

.review-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }

  /* 已被删除的评价：灰色背景 + 降低透明度 */
  &--deleted {
    background: #f5f5f5;
    border-color: #dcdcdc;
    opacity: 0.8;
  }

  .product-info {
    flex-shrink: 0;
    width: 200px;
    display: flex;
    gap: 12px;

    .product-image { width: 80px; height: 80px; border-radius: 4px; }

    .product-details {
      flex: 1;
      .product-name {
        font-size: 14px;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .product-price { font-size: 18px; color: #ff6b00; font-weight: bold; }
    }
  }

  .review-content {
    flex: 1;

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      .review-time { font-size: 14px; color: #999; }
    }

    .review-text {
      font-size: 15px;
      line-height: 1.6;
      color: #666;
      margin-bottom: 12px;
      &--faded { color: #aaa; }
    }

    /* 已被删除提示 */
    .deleted-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #f56c6c;
      font-size: 13px;
      padding: 8px 12px;
      background: #fef0f0;
      border-radius: 4px;
      border: 1px solid #fde2e2;
      margin-top: 8px;

      .el-icon { font-size: 16px; }
    }

    .review-images {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
      .review-image { width: 80px; height: 80px; border-radius: 4px; cursor: pointer; }
    }

    .merchant-reply {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 12px;
      .reply-label { font-size: 14px; font-weight: bold; color: #409eff; margin-bottom: 8px; }
      .reply-content { font-size: 14px; line-height: 1.5; color: #666; margin-bottom: 6px; }
      .reply-time { font-size: 12px; color: #999; text-align: right; }
    }

    .review-stats {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #999;
      .el-icon { color: #ff9900; }
    }
  }

  .review-actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
  }
}

.pagination { display: flex; justify-content: center; margin-top: 20px; }

.dialog-product-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

:deep(.el-upload__tip) { font-size: 12px; color: #999; margin-top: 8px; }

/* Trade review polish */
.my-reviews-page {
  max-width: none;
  min-height: calc(100vh - 64px);
  margin: 0;
  padding: 32px 20px 56px;
  background:
    radial-gradient(circle at 12% 0%, rgba(184, 141, 62, 0.12), transparent 34%),
    linear-gradient(180deg, #f8f9fb 0%, #f2f4f8 100%);
}

:deep(.el-card) {
  max-width: 1180px;
  margin: 0 auto;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 45px rgba(23, 32, 51, 0.08);
  overflow: hidden;
}

:deep(.el-card__header) {
  padding: 22px 26px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: linear-gradient(180deg, #ffffff 0%, #faf7ef 100%);

  span {
    color: #172033;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0;
  }
}

:deep(.el-card__body) {
  padding: 24px 26px 28px;
}

.review-list {
  min-height: 420px;
}

.review-item {
  position: relative;
  align-items: stretch;
  gap: 22px;
  padding: 22px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  margin-bottom: 16px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(23, 32, 51, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(184, 141, 62, 0.34);
    box-shadow: 0 18px 34px rgba(23, 32, 51, 0.09);
  }

  &--deleted {
    background: #f7f7f5;
    border-color: rgba(120, 124, 132, 0.18);
    box-shadow: none;
    opacity: 1;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(23, 32, 51, 0.035));
    }
  }

  .product-info {
    width: 230px;
    padding: 12px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid rgba(23, 32, 51, 0.06);
  }

  .product-info .product-image {
    width: 86px;
    height: 86px;
    border-radius: 6px;
    background: #e9edf4;
    box-shadow: 0 8px 20px rgba(23, 32, 51, 0.08);
  }

  .product-info .product-details .product-name {
    color: #172033;
    font-weight: 650;
    line-height: 1.45;
  }

  .product-info .product-details .product-price {
    color: #d85c25;
    font-size: 20px;
    font-weight: 750;
  }

  .review-content {
    min-width: 0;
    padding: 2px 0;
  }

  .review-content .review-header {
    align-items: flex-start;
    gap: 16px;
  }

  .review-content .review-time {
    flex-shrink: 0;
    color: #8b94a3;
    font-size: 13px;
  }

  .review-content .review-text {
    color: #4e5969;
    font-size: 15px;
    line-height: 1.8;
    word-break: break-word;
  }

  .review-content .review-text--faded {
    color: #9aa1ad;
  }

  .review-content .deleted-tip {
    border: 1px solid rgba(216, 92, 37, 0.18);
    border-radius: 8px;
    background: #fff5ef;
    color: #b85628;
  }

  .review-content .review-images {
    gap: 10px;
  }

  .review-content .review-image {
    width: 86px;
    height: 86px;
    border-radius: 6px;
    border: 1px solid rgba(23, 32, 51, 0.08);
    box-shadow: 0 8px 18px rgba(23, 32, 51, 0.06);
    overflow: hidden;
  }

  .review-content .merchant-reply {
    padding: 14px 16px;
    border: 1px solid rgba(184, 141, 62, 0.18);
    border-radius: 8px;
    background: #fffaf0;
  }

  .review-content .merchant-reply .reply-label {
    color: #7a5e3d;
    font-weight: 700;
  }

  .review-content .merchant-reply .reply-content {
    color: #4e5969;
  }

  .review-content .merchant-reply .reply-time,
  .review-content .review-stats {
    color: #8b94a3;
  }

  .review-content .review-stats .el-icon {
    color: #b88d3e;
  }

  .review-actions {
    min-width: 92px;
  }
}

:deep(.el-rate__icon) {
  color: #d4a62f;
}

:deep(.el-button--primary) {
  border-color: #172033;
  background: #172033;
  box-shadow: 0 8px 18px rgba(23, 32, 51, 0.14);

  &:hover,
  &:focus {
    border-color: #24314c;
    background: #24314c;
  }
}

:deep(.el-button--danger.is-plain) {
  border-color: rgba(216, 92, 37, 0.28);
  background: #fff7f2;
  color: #b85628;

  &:hover,
  &:focus {
    border-color: #d85c25;
    background: #d85c25;
    color: #ffffff;
  }
}

.pagination {
  margin-top: 26px;
}

:deep(.el-pagination.is-background .el-pager li.is-active),
:deep(.el-pagination .el-pager li.is-active) {
  background: #172033;
  color: #ffffff;
}

.dialog-product-info {
  padding: 16px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #f8fafc;
}

.dialog-product-info :deep(.el-image) {
  border-radius: 6px;
  overflow: hidden;
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding: 22px 24px 12px;
}

:deep(.el-dialog__title) {
  color: #172033;
  font-weight: 700;
}

:deep(.el-textarea__inner),
:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.12) inset;
}

:deep(.el-textarea__inner:focus),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #172033 inset;
}

:deep(.el-upload--picture-card),
:deep(.el-upload-list--picture-card .el-upload-list__item) {
  border-radius: 8px;
  border-color: rgba(23, 32, 51, 0.12);
}

:deep(.el-empty) {
  padding: 76px 0;
}

@media (max-width: 900px) {
  .my-reviews-page {
    padding: 20px 12px 40px;
  }

  :deep(.el-card__body) {
    padding: 18px 14px 22px;
  }

  .review-item {
    flex-direction: column;
    gap: 16px;
    padding: 16px;

    .product-info {
      width: 100%;
    }

    .review-actions {
      flex-direction: row;
      justify-content: flex-start;
    }

    .review-content .review-header {
      flex-direction: column;
      gap: 8px;
    }
  }
}
/* Final direction: restrained premium reviews */
.my-reviews-page {
  max-width: none;
  min-height: 100vh;
  margin: 0;
  padding: 28px 0 64px;
  background:
    linear-gradient(180deg, rgba(18, 27, 43, 0.035), transparent 220px),
    #f6f4ef;
  color: #172033;
}

:deep(.el-card) {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
  overflow: hidden;
}

:deep(.el-card__header) {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: #fbfcfd;
}

:deep(.el-card__header span) {
  color: #172033;
  font-size: 20px;
  font-weight: 760;
}

:deep(.el-card__body) {
  padding: 20px 22px 24px;
}

.review-list {
  display: grid;
  gap: 14px;
  min-height: 360px;
}

.review-item {
  align-items: stretch;
  gap: 18px;
  margin-bottom: 0;
  padding: 18px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
}

.review-item:hover {
  transform: none;
  border-color: rgba(159, 122, 68, 0.24);
  box-shadow: none;
}

.review-item--deleted {
  background: #f6f7f9;
  border-color: rgba(23, 32, 51, 0.08);
  opacity: 1;
}

.review-item .product-info {
  width: 240px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.review-item .product-info .product-image {
  width: 86px;
  height: 86px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 6px;
  background: #eef0f3;
  box-shadow: none;
  overflow: hidden;
}

.review-item .product-info .product-details .product-name {
  color: #172033;
  font-size: 14px;
  font-weight: 680;
  line-height: 1.5;
}

.review-item .product-info .product-details .product-price {
  color: #b35d25;
  font-size: 17px;
  font-weight: 800;
}

.review-content {
  color: #4b5563;
}

.review-header {
  gap: 16px;
  margin-bottom: 10px;
}

.review-time {
  color: #8a93a3;
}

.review-text {
  color: #4b5563;
  line-height: 1.75;
}

.review-text--faded {
  color: #9aa3b2;
}

.deleted-tip {
  border: 1px solid rgba(179, 93, 37, 0.16);
  border-radius: 8px;
  background: #fff8ee;
  color: #b35d25;
}

.review-image {
  width: 78px;
  height: 78px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 6px;
  overflow: hidden;
}

.merchant-reply {
  border: 1px solid rgba(159, 122, 68, 0.16);
  border-radius: 8px;
  background: #fbf4e8;
}

.reply-label {
  color: #8a6a3f;
  font-weight: 760;
}

.reply-content {
  color: #4b5563;
}

.reply-time,
.review-stats {
  color: #8a93a3;
}

.review-stats .el-icon {
  color: #9f7a44;
}

.review-actions {
  min-width: 96px;
}

:deep(.el-rate__icon) {
  color: #d8ad5d;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #28344d;
  --el-button-hover-border-color: #28344d;
}

:deep(.el-button--danger.is-plain) {
  --el-button-text-color: #b35d25;
  --el-button-border-color: rgba(179, 93, 37, 0.24);
  --el-button-hover-bg-color: #b35d25;
  --el-button-hover-border-color: #b35d25;
}

.pagination {
  justify-content: center;
  margin-top: 24px;
}

.dialog-product-info {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #f6f7f9;
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-dialog__title) {
  color: #172033;
  font-weight: 760;
}

:deep(.el-textarea__inner),
:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.12) inset;
}

:deep(.el-textarea__inner:focus),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #172033 inset;
}

@media (max-width: 820px) {
  .my-reviews-page {
    padding: 18px 0 44px;
  }

  :deep(.el-card) {
    width: calc(100% - 28px);
  }

  .review-item {
    flex-direction: column;
  }

  .review-item .product-info {
    width: 100%;
  }

  .review-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
}

/* My reviews final pass: page-local review ledger. */
:global(body .my-reviews-page.my-reviews-page.my-reviews-page) {
  min-height: 100vh !important;
  padding: 28px 0 72px !important;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88) 0%, rgba(246, 243, 236, 0.96) 260px),
    #f6f3ec !important;
  color: #1f2933 !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page > .el-card) {
  width: min(1160px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
  overflow: hidden !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .el-card__header) {
  padding: 18px 22px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .el-card__header span) {
  color: #111827 !important;
  font-size: 20px !important;
  font-weight: 800 !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .el-card__body) {
  padding: 22px !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-list) {
  display: grid !important;
  gap: 14px !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-item) {
  display: grid !important;
  grid-template-columns: 260px minmax(0, 1fr) 98px !important;
  gap: 18px !important;
  align-items: start !important;
  padding: 18px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  box-shadow: none !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-item--deleted) {
  background: #f7f7f4 !important;
  opacity: 1 !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-item .product-info) {
  display: grid !important;
  grid-template-columns: 86px minmax(0, 1fr) !important;
  gap: 12px !important;
  width: auto !important;
  background: transparent !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .product-image) {
  width: 86px !important;
  height: 86px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 5px !important;
  background: #eef0f3 !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .product-name) {
  color: #111827 !important;
  font-weight: 720 !important;
  line-height: 1.5 !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .product-price) {
  color: #a6531f !important;
  font-weight: 850 !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-header) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-text) {
  color: #374151 !important;
  line-height: 1.75 !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .merchant-reply) {
  margin-top: 12px !important;
  padding: 12px 14px !important;
  border: 0 !important;
  border-left: 3px solid #9c6b35 !important;
  border-radius: 5px !important;
  background: #f8f5ef !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .deleted-tip) {
  border-radius: 6px !important;
  background: #fff4ed !important;
  color: #a6531f !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-actions) {
  display: grid !important;
  gap: 8px !important;
}

:global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-actions .el-button--primary) {
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

@media (max-width: 820px) {
  :global(body .my-reviews-page.my-reviews-page.my-reviews-page > .el-card) {
    width: calc(100vw - 28px) !important;
  }

  :global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-item) {
    grid-template-columns: 1fr !important;
  }

  :global(body .my-reviews-page.my-reviews-page.my-reviews-page .review-actions) {
    display: flex !important;
    justify-content: flex-start !important;
  }
}
</style>
