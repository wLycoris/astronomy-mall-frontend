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
</style>