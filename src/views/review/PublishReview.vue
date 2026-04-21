<template>
  <div class="publish-review-page">
    <el-card class="review-card">
      <template #header>
        <div class="card-header">
          <span>发布评价</span>
          <el-button text @click="goBack">返回</el-button>
        </div>
      </template>

      <div v-loading="loadingOrderInfo" element-loading-text="加载订单信息...">
        <!-- 订单信息 -->
        <div v-if="orderInfo.orderNo" class="order-info">
          <div class="info-row">
            <span class="label">订单号:</span>
            <span>{{ orderInfo.orderNo }}</span>
          </div>
          <div class="info-row">
            <span class="label">下单时间:</span>
            <span>{{ orderInfo.createTime }}</span>
          </div>
        </div>

        <!-- 商品选择区域 -->
        <div v-if="orderProducts.length > 0" class="product-select-section">
          <div class="section-title">选择要评价的商品</div>
          <div class="product-list">
            <div
                v-for="item in orderProducts"
                :key="item.productId"
                class="product-item"
                :class="{
                  selected: selectedProductId === item.productId,
                  disabled: item.hasReviewed
                }"
                @click="handleSelectProduct(item)"
            >
              <el-image :src="item.productImage" fit="cover" class="product-image" />
              <div class="product-details">
                <div class="product-name">{{ item.productName }}</div>
                <div class="product-price">¥{{ item.productPrice }}</div>
                <div class="product-brand">{{ item.productBrand }}</div>
              </div>
              <div class="product-status">
                <el-tag v-if="item.hasReviewed" type="success">已评价</el-tag>
                <el-tag v-else-if="selectedProductId === item.productId" type="primary">
                  <el-icon><Check /></el-icon>
                  已选择
                </el-tag>
                <el-tag v-else type="info">待评价</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 已选商品提示 -->
        <el-alert
            v-if="selectedProduct"
            :title="`当前评价商品: ${selectedProduct.productName}`"
            type="info"
            :closable="false"
            style="margin: 20px 0"
        />

        <!-- 无商品提示 -->
        <el-alert
            v-else-if="!loadingOrderInfo && orderProducts.length === 0"
            title="订单信息异常,无法加载商品列表"
            type="error"
            :closable="false"
            show-icon
        />

        <!-- 评价表单 -->
        <el-form
            v-if="selectedProduct"
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="80px"
            class="review-form"
        >
          <!-- 评分 -->
          <el-form-item label="商品评分" prop="rating">
            <el-rate
                v-model="form.rating"
                :texts="['非常差', '差', '一般', '好', '非常好']"
                show-text
            />
          </el-form-item>

          <!-- 评价内容 -->
          <el-form-item label="评价内容" prop="content">
            <el-input
                v-model="form.content"
                type="textarea"
                :rows="6"
                placeholder="请分享您的购买心得,帮助其他买家做出更好的选择~(10-500字)"
                maxlength="500"
                show-word-limit
            />
          </el-form-item>

          <!-- 上传图片 -->
          <el-form-item label="上传图片">
            <el-upload
                v-model:file-list="fileList"
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                :limit="9"
                :on-exceed="handleExceed"
                :on-preview="handlePreview"
                :on-remove="handleRemove"
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">
                  最多上传9张图片,支持jpg/png格式
                </div>
              </template>
            </el-upload>
          </el-form-item>

          <!-- 匿名评价 -->
          <el-form-item label="匿名评价">
            <el-switch v-model="form.isAnonymous" />
            <span class="anonymous-tip">开启后将隐藏您的昵称和头像</span>
          </el-form-item>

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">
              提交评价
            </el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>

        <!-- 未选择商品提示 -->
        <el-empty
            v-else-if="!loadingOrderInfo && orderProducts.length > 0"
            description="请先选择要评价的商品"
        />
      </div>
    </el-card>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览">
      <el-image :src="previewImage" fit="contain" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check } from '@element-plus/icons-vue'
import { publishReview, getMyReviews } from '@/api/review'
import { getOrderDetail } from '@/api/order'

const route = useRoute()
const router = useRouter()

const orderId = ref(route.query.orderId)
const presetProductId = ref(route.query.productId)

const formRef = ref(null)
const submitting = ref(false)
const loadingOrderInfo = ref(false)
const fileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')

const orderInfo = reactive({
  orderNo: '',
  createTime: ''
})

const orderProducts = ref([])
const selectedProductId = ref(null)

const selectedProduct = computed(() => {
  return orderProducts.value.find(item => item.productId === selectedProductId.value)
})

const form = reactive({
  rating: 5,
  content: '',
  isAnonymous: false
})

const rules = {
  rating: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入评价内容', trigger: 'blur' },
    { min: 10, max: 500, message: '评价内容长度为10-500字', trigger: 'blur' }
  ]
}

// 加载订单信息
const loadOrderInfo = async () => {
  if (!orderId.value) {
    ElMessage.error('缺少订单ID')
    return
  }

  loadingOrderInfo.value = true

  try {
    console.log('=== 加载订单信息 ===')
    console.log('订单ID:', orderId.value)

    const res = await getOrderDetail(orderId.value)
    console.log('订单详情:', res.data)

    if (res.data.status !== 3) {
      ElMessage.error('只能评价已完成的订单')
      console.error('订单状态错误:', {
        currentStatus: res.data.status,
        statusText: res.data.statusText,
        requiredStatus: 3
      })
      setTimeout(() => router.push('/order/list'), 2000)
      return
    }

    orderInfo.orderNo = res.data.orderNo
    orderInfo.createTime = res.data.createTime

    orderProducts.value = res.data.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      productImage: item.productImage,
      productBrand: item.productBrand,
      hasReviewed: false
    }))

    console.log('订单商品列表:', orderProducts.value)

    // ✅ 检查哪些商品已评价
    await checkReviewedProducts()

    // 如果URL中指定了商品ID,自动选中
    if (presetProductId.value) {
      const presetProduct = orderProducts.value.find(
          item => item.productId == presetProductId.value && !item.hasReviewed
      )
      if (presetProduct) {
        selectedProductId.value = presetProduct.productId
        console.log('自动选中商品:', presetProduct.productName)
      }
    }

  } catch (error) {
    console.error('❌ 加载订单信息失败:', error)
    ElMessage.error(error.message || '加载订单信息失败')
  } finally {
    loadingOrderInfo.value = false
  }
}

// ✅ 核心修复: 检查已评价的商品
const checkReviewedProducts = async () => {
  try {
    console.log('=== 检查已评价商品 ===')
    console.log('当前订单ID:', orderId.value)

    // 获取我的所有评价
    const res = await getMyReviews({ pageNum: 1, pageSize: 100 })
    const myReviews = res.data.records

    console.log('我的所有评价:', myReviews)
    console.log('当前订单的所有商品:', orderProducts.value.map(p => ({
      productId: p.productId,
      productName: p.productName
    })))

    // ✅ 标记已评价的商品: 必须同时匹配 orderId 和 productId
    orderProducts.value.forEach(item => {
      const reviewed = myReviews.find(r => {
        // 使用 == 而不是 ===,因为ID可能是字符串或数字
        const orderMatch = r.orderId == orderId.value
        const productMatch = r.productId == item.productId

        console.log(`检查商品 ${item.productName}:`, {
          评价中的订单ID: r.orderId,
          当前订单ID: orderId.value,
          订单匹配: orderMatch,
          评价中的商品ID: r.productId,
          当前商品ID: item.productId,
          商品匹配: productMatch,
          结果: orderMatch && productMatch ? '✅ 已评价' : '❌ 未评价'
        })

        return orderMatch && productMatch
      })

      item.hasReviewed = !!reviewed

      if (reviewed) {
        console.log(`✅ 商品 "${item.productName}" (ID:${item.productId}) 已评价`)
      } else {
        console.log(`❌ 商品 "${item.productName}" (ID:${item.productId}) 未评价`)
      }
    })

    console.log('=== 最终商品状态 ===')
    orderProducts.value.forEach(p => {
      console.log(`${p.hasReviewed ? '✅' : '❌'} ${p.productName} (ID:${p.productId})`)
    })

  } catch (error) {
    console.error('检查评价状态失败:', error)
  }
}

// 选择商品
const handleSelectProduct = (item) => {
  if (item.hasReviewed) {
    ElMessage.warning('该商品已评价,无需重复评价')
    return
  }

  if (selectedProductId.value === item.productId) {
    selectedProductId.value = null
    ElMessage.info('已取消选择')
  } else {
    selectedProductId.value = item.productId
    ElMessage.success(`已选择: ${item.productName}`)

    form.rating = 5
    form.content = ''
    form.isAnonymous = false
    fileList.value = []
  }
}

// 图片上传超出限制
const handleExceed = () => {
  ElMessage.warning('最多上传9张图片')
}

// 图片预览
const handlePreview = (file) => {
  previewImage.value = file.url
  previewVisible.value = true
}

// 图片移除
const handleRemove = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

// ✅ 提交评价
const handleSubmit = async () => {
  if (!selectedProductId.value) {
    ElMessage.warning('请先选择要评价的商品')
    return
  }

  try {
    await formRef.value.validate()

    submitting.value = true

    const images = fileList.value.map((file, index) =>
        file.url || `https://picsum.photos/200/200?random=${Date.now()}-${index}`
    )

    console.log('=== 提交评价 ===')
    console.log('请求参数:', {
      orderId: parseInt(orderId.value),
      productId: parseInt(selectedProductId.value),
      rating: form.rating,
      content: form.content,
      images: images,
      isAnonymous: form.isAnonymous
    })

    // 提交评价
    await publishReview({
      orderId: parseInt(orderId.value),
      productId: parseInt(selectedProductId.value),
      rating: form.rating,
      content: form.content,
      images: images,
      isAnonymous: form.isAnonymous
    })

    ElMessage.success('评价发布成功')

    console.log('=== 评价成功,重新检查状态 ===')

    // ✅ 重新检查评价状态
    await checkReviewedProducts()

    // 清空当前选择
    selectedProductId.value = null
    form.rating = 5
    form.content = ''
    form.isAnonymous = false
    fileList.value = []

    // 检查是否还有未评价的商品
    const hasUnreviewed = orderProducts.value.some(item => !item.hasReviewed)

    console.log('是否还有未评价商品:', hasUnreviewed)
    console.log('商品列表状态:', orderProducts.value.map(p => ({
      name: p.productName,
      hasReviewed: p.hasReviewed
    })))

    if (hasUnreviewed) {
      // 还有未评价的商品,询问是否继续
      ElMessageBox.confirm('是否继续评价其他商品?', '提示', {
        confirmButtonText: '继续评价',
        cancelButtonText: '返回订单',
        type: 'info'
      }).then(() => {
        // 继续评价,不做任何操作
        console.log('用户选择继续评价')
      }).catch(() => {
        // 返回订单列表
        console.log('用户选择返回订单')
        router.push('/order/list')
      })
    } else {
      // 所有商品都已评价完成
      ElMessage.success('该订单所有商品已评价完成')
      setTimeout(() => router.push('/order/list'), 1500)
    }

  } catch (error) {
    if (error !== false) {
      console.error('❌ 评价发布失败:', error)
      ElMessage.error(error.message || '评价发布失败')
    }
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  console.log('=== PublishReview 页面加载 ===')
  console.log('路由参数:', route.query)
  loadOrderInfo()
})
</script>

<style scoped lang="scss">
.publish-review-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      width: 80px;
      font-weight: bold;
      color: #606266;
    }
  }
}

.product-select-section {
  margin-bottom: 24px;

  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 16px;
    padding-left: 12px;
    border-left: 4px solid #409eff;
  }

  .product-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .product-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover:not(.disabled) {
      border-color: #409eff;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
    }

    &.selected {
      border-color: #409eff;
      background: #ecf5ff;
    }

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f5f7fa;
    }

    .product-image {
      width: 80px;
      height: 80px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .product-details {
      flex: 1;

      .product-name {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 8px;
      }

      .product-price {
        font-size: 18px;
        color: #ff6b00;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .product-brand {
        font-size: 14px;
        color: #909399;
      }
    }

    .product-status {
      flex-shrink: 0;
    }
  }
}

.review-form {
  .anonymous-tip {
    margin-left: 12px;
    font-size: 13px;
    color: #999;
  }

  .el-upload__tip {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
  }
}

/* Trade review polish */
.publish-review-page {
  max-width: none;
  min-height: calc(100vh - 64px);
  padding: 32px 20px 56px;
  background:
    radial-gradient(circle at 12% 0%, rgba(184, 141, 62, 0.12), transparent 34%),
    linear-gradient(180deg, #f8f9fb 0%, #f2f4f8 100%);
}

.review-card {
  max-width: 980px;
  margin: 0 auto;
}

:deep(.review-card.el-card) {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 45px rgba(23, 32, 51, 0.08);
  overflow: hidden;
}

:deep(.review-card .el-card__header) {
  padding: 22px 26px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: linear-gradient(180deg, #ffffff 0%, #faf7ef 100%);
}

:deep(.review-card .el-card__body) {
  padding: 26px;
}

.card-header span {
  color: #172033;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
}

.card-header :deep(.el-button) {
  color: #5f6b7a;

  &:hover,
  &:focus {
    color: #172033;
  }
}

.order-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(250, 247, 239, 0.95), rgba(255, 255, 255, 0.96)),
    #ffffff;
}

.order-info .info-row {
  margin-bottom: 0;
  min-width: 0;
}

.order-info .info-row .label {
  width: 92px;
  color: #697386;
  font-weight: 650;
}

.order-info .info-row span:last-child {
  min-width: 0;
  color: #172033;
  word-break: break-word;
}

.product-select-section {
  margin-top: 26px;
  margin-bottom: 28px;
}

.product-select-section .section-title {
  position: relative;
  padding-left: 14px;
  border-left: 0;
  color: #172033;
  font-size: 17px;
  font-weight: 750;
}

.product-select-section .section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 4px;
  border-radius: 999px;
  background: #b88d3e;
}

.product-select-section .product-list {
  gap: 14px;
}

.product-select-section .product-item {
  position: relative;
  gap: 18px;
  padding: 18px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(23, 32, 51, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;

  &:hover:not(.disabled) {
    transform: translateY(-2px);
    border-color: rgba(184, 141, 62, 0.34);
    box-shadow: 0 18px 34px rgba(23, 32, 51, 0.09);
  }

  &.selected {
    border-color: #172033;
    background: linear-gradient(135deg, rgba(23, 32, 51, 0.045), rgba(184, 141, 62, 0.09));
  }

  &.selected::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    border-radius: 8px 0 0 8px;
    background: #172033;
  }

  &.disabled {
    background: #f6f7f9;
    border-color: rgba(120, 124, 132, 0.16);
    opacity: 0.72;
  }
}

.product-select-section .product-item .product-image {
  width: 92px;
  height: 92px;
  border-radius: 6px;
  background: #e9edf4;
  box-shadow: 0 8px 20px rgba(23, 32, 51, 0.08);
  overflow: hidden;
}

.product-select-section .product-item .product-details {
  min-width: 0;
}

.product-select-section .product-item .product-name {
  color: #172033;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
}

.product-select-section .product-item .product-price {
  color: #d85c25;
  font-size: 20px;
  font-weight: 750;
}

.product-select-section .product-item .product-brand {
  color: #8b94a3;
}

:deep(.el-tag--primary) {
  border-color: rgba(23, 32, 51, 0.16);
  background: #172033;
  color: #ffffff;
}

:deep(.el-tag--success) {
  border-color: rgba(60, 126, 88, 0.16);
  background: #edf8f1;
  color: #2f7a4f;
}

:deep(.el-tag--info) {
  border-color: rgba(105, 115, 134, 0.14);
  background: #f2f4f7;
  color: #697386;
}

:deep(.el-alert) {
  border-radius: 8px;
}

:deep(.el-alert--info.is-light) {
  border: 1px solid rgba(184, 141, 62, 0.2);
  background: #fffaf0;
  color: #7a5e3d;
}

.review-form {
  padding: 24px 22px 8px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(23, 32, 51, 0.05);
}

.review-form :deep(.el-form-item__label) {
  color: #4e5969;
  font-weight: 650;
}

.review-form :deep(.el-rate__icon) {
  color: #d4a62f;
}

.review-form .anonymous-tip {
  color: #8b94a3;
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

:deep(.el-upload--picture-card:hover) {
  border-color: #172033;
  color: #172033;
}

:deep(.el-upload__tip) {
  color: #8b94a3;
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

:deep(.el-button:not(.el-button--primary)) {
  border-color: rgba(23, 32, 51, 0.12);

  &:hover,
  &:focus {
    border-color: rgba(184, 141, 62, 0.42);
    color: #7a5e3d;
  }
}

:deep(.el-empty) {
  padding: 70px 0;
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-dialog__title) {
  color: #172033;
  font-weight: 700;
}

@media (max-width: 760px) {
  .publish-review-page {
    padding: 20px 12px 40px;
  }

  :deep(.review-card .el-card__body) {
    padding: 18px 14px 22px;
  }

  .order-info {
    grid-template-columns: 1fr;
  }

  .product-select-section .product-item {
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 16px;
  }

  .product-select-section .product-item .product-image {
    width: 78px;
    height: 78px;
  }

  .product-select-section .product-item .product-status {
    width: 100%;
  }

  .review-form {
    padding: 18px 14px 6px;
  }
}

/* Publish review final pass: page-local writing desk. */
:global(body .publish-review-page.publish-review-page.publish-review-page) {
  min-height: 100vh !important;
  padding: 28px 0 72px !important;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88) 0%, rgba(246, 243, 236, 0.96) 260px),
    #f6f3ec !important;
  color: #1f2933 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .review-card) {
  width: min(1040px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
  overflow: hidden !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .review-card .el-card__header) {
  padding: 18px 22px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .card-header) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .card-header span) {
  color: #111827 !important;
  font-size: 20px !important;
  font-weight: 800 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .review-card .el-card__body) {
  padding: 22px !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .order-info) {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px 20px !important;
  margin-bottom: 20px !important;
  padding: 14px 16px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 6px !important;
  background: #f8f5ef !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .section-title) {
  margin: 22px 0 14px !important;
  padding-left: 12px !important;
  border-left: 3px solid #9c6b35 !important;
  color: #111827 !important;
  font-size: 18px !important;
  font-weight: 800 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-list) {
  display: grid !important;
  gap: 12px !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-select-section .product-item) {
  display: grid !important;
  grid-template-columns: 86px minmax(0, 1fr) auto !important;
  gap: 14px !important;
  align-items: center !important;
  padding: 14px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  box-shadow: none !important;
  cursor: pointer !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-select-section .product-item.selected) {
  border-color: #9c6b35 !important;
  background: #fff8ec !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-select-section .product-item.disabled) {
  background: #f4f4f2 !important;
  opacity: 0.72 !important;
  cursor: not-allowed !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-image) {
  width: 86px !important;
  height: 86px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 5px !important;
  background: #eef0f3 !important;
  box-shadow: none !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-name) {
  color: #111827 !important;
  font-weight: 720 !important;
  line-height: 1.5 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-price) {
  color: #a6531f !important;
  font-size: 18px !important;
  font-weight: 850 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-brand),
:global(body .publish-review-page.publish-review-page.publish-review-page .label) {
  color: #667085 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .review-form) {
  margin-top: 20px !important;
  padding: 22px 22px 8px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  box-shadow: none !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .review-form .el-form-item__label) {
  color: #374151 !important;
  font-weight: 700 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-textarea__inner),
:global(body .publish-review-page.publish-review-page.publish-review-page .el-input__wrapper) {
  border-radius: 5px !important;
  box-shadow: 0 0 0 1px rgba(21, 26, 34, 0.14) inset !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-button--primary) {
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

@media (max-width: 760px) {
  :global(body .publish-review-page.publish-review-page.publish-review-page .review-card) {
    width: calc(100vw - 28px) !important;
  }

  :global(body .publish-review-page.publish-review-page.publish-review-page .order-info) {
    grid-template-columns: 1fr !important;
  }

  :global(body .publish-review-page.publish-review-page.publish-review-page .product-select-section .product-item) {
    grid-template-columns: 76px minmax(0, 1fr) !important;
  }

  :global(body .publish-review-page.publish-review-page.publish-review-page .product-status) {
    grid-column: 2 !important;
  }
}

/* Publish review readability pass: selected state and form controls. */
:global(body .publish-review-page.publish-review-page.publish-review-page),
:global(body .publish-review-page.publish-review-page.publish-review-page .review-card),
:global(body .publish-review-page.publish-review-page.publish-review-page .order-info),
:global(body .publish-review-page.publish-review-page.publish-review-page .review-form) {
  color: #111827 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .card-header .el-button) {
  height: 32px !important;
  padding: 0 12px !important;
  border: 1px solid rgba(21, 26, 34, 0.14) !important;
  border-radius: 4px !important;
  background: #fffdfa !important;
  color: #111827 !important;
  font-weight: 700 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .card-header .el-button span) {
  color: #111827 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-select-section .product-item) {
  min-height: 108px !important;
  padding-right: 18px !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-select-section .product-item::before) {
  pointer-events: none !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .product-status) {
  justify-self: end !important;
  min-width: 78px !important;
  text-align: right !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag) {
  height: 28px !important;
  min-width: 66px !important;
  justify-content: center !important;
  border-radius: 999px !important;
  font-weight: 750 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag .el-tag__content) {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  color: inherit !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag--primary) {
  border-color: rgba(156, 107, 53, 0.34) !important;
  background: #fff8ec !important;
  color: #8a5a22 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag--primary .el-tag__content),
:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag--primary svg) {
  color: #8a5a22 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag--info) {
  border-color: rgba(21, 26, 34, 0.16) !important;
  background: #ffffff !important;
  color: #374151 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag--info .el-tag__content) {
  color: #374151 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag--success) {
  border-color: rgba(47, 122, 79, 0.22) !important;
  background: #edf8f1 !important;
  color: #2f7a4f !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-tag--success .el-tag__content) {
  color: #2f7a4f !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-alert__title) {
  color: #111827 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .review-form .el-form-item) {
  margin-bottom: 22px !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .review-form .el-form-item__label) {
  color: #111827 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-rate__text),
:global(body .publish-review-page.publish-review-page.publish-review-page .anonymous-tip),
:global(body .publish-review-page.publish-review-page.publish-review-page .el-upload__tip) {
  color: #4b5563 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-textarea__inner),
:global(body .publish-review-page.publish-review-page.publish-review-page .el-input__inner) {
  color: #111827 !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-button--primary),
:global(body .publish-review-page.publish-review-page.publish-review-page .el-button--primary span) {
  color: #fffdfa !important;
}

:global(body .publish-review-page.publish-review-page.publish-review-page .el-button:not(.el-button--primary) span) {
  color: #111827 !important;
}

@media (max-width: 760px) {
  :global(body .publish-review-page.publish-review-page.publish-review-page .product-status) {
    justify-self: start !important;
    text-align: left !important;
  }
}
</style>
