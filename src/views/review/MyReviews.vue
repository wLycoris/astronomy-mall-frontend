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
</style>