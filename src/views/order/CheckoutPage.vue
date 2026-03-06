<template>
  <div class="checkout-page">
    <div class="container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/cart' }">购物车</el-breadcrumb-item>
        <el-breadcrumb-item>订单结算</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="checkout-container">
        <!-- 收货地址 -->
        <div class="section address-section">
          <h3 class="section-title">收货地址</h3>
          <el-form
              ref="addressFormRef"
              :model="addressForm"
              :rules="addressRules"
              label-width="100px"
          >
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="收货人" prop="receiverName">
                  <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="手机号码" prop="receiverPhone">
                  <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号码" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="省份" prop="receiverProvince">
                  <el-input v-model="addressForm.receiverProvince" placeholder="请输入省份" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="城市" prop="receiverCity">
                  <el-input v-model="addressForm.receiverCity" placeholder="请输入城市" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="区县" prop="receiverDistrict">
                  <el-input v-model="addressForm.receiverDistrict" placeholder="请输入区县" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="详细地址" prop="receiverAddress">
              <el-input
                  v-model="addressForm.receiverAddress"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入详细地址"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 商品清单 -->
        <div class="section product-section">
          <h3 class="section-title">商品清单</h3>
          <div v-for="item in selectedItems" :key="item.id" class="product-item">
            <el-image :src="item.productImage" fit="cover" class="product-image" />
            <div class="product-details">
              <div class="product-name">{{ item.productName }}</div>
              <div class="product-brand">{{ item.productBrand }}</div>
            </div>
            <div class="product-price">¥{{ item.productPrice.toFixed(2) }}</div>
            <div class="product-quantity">x{{ item.quantity }}</div>
            <div class="product-subtotal">¥{{ item.subtotal.toFixed(2) }}</div>
          </div>
        </div>

        <!-- 订单备注 -->
        <div class="section remark-section">
          <h3 class="section-title">订单备注</h3>
          <el-input
              v-model="addressForm.remark"
              type="textarea"
              :rows="3"
              placeholder="选填,可填写配送要求等信息"
              maxlength="200"
              show-word-limit
          />
        </div>

        <!-- 费用明细 -->
        <div class="section summary-section">
          <h3 class="section-title">费用明细</h3>
          <div class="summary-item">
            <span>商品总金额:</span>
            <span class="amount">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <!-- 🆕 运费动态显示，联动系统设置 -->
          <div class="summary-item">
            <span>运费:</span>
            <span class="amount">
              <template v-if="freightLoading">计算中...</template>
              <template v-else-if="freight === 0">
                <span style="color: #67c23a">免运费</span>
              </template>
              <template v-else>¥{{ freight.toFixed(2) }}</template>
            </span>
          </div>
          <!-- 包邮提示 -->
          <div class="freight-tip" v-if="freightTip">{{ freightTip }}</div>
          <div class="summary-item">
            <span>优惠金额:</span>
            <span class="amount discount">-¥0.00</span>
          </div>
          <!-- 🆕 应付金额 = 商品总额 + 运费 -->
          <div class="summary-item total">
            <span>应付金额:</span>
            <span class="amount">¥{{ paymentAmount.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 提交订单 -->
        <div class="submit-section">
          <el-button
              type="primary"
              size="large"
              :loading="submitting"
              @click="handleSubmitOrder"
          >
            提交订单
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCartList } from '@/api/cart'
import { createOrder } from '@/api/order'
import { getFreightSetting } from '@/api/admin/setting'  // 🆕

const router = useRouter()

const addressFormRef = ref(null)
const addressForm = ref({
  receiverName: '',
  receiverPhone: '',
  receiverProvince: '',
  receiverCity: '',
  receiverDistrict: '',
  receiverAddress: '',
  remark: ''
})

const addressRules = {
  receiverName:     [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  receiverPhone:    [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  receiverProvince: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  receiverCity:     [{ required: true, message: '请输入城市', trigger: 'blur' }],
  receiverDistrict: [{ required: true, message: '请输入区县', trigger: 'blur' }],
  receiverAddress:  [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const selectedItems  = ref([])
const submitting     = ref(false)

// 🆕 运费相关状态
const freightLoading      = ref(false)
const defaultFreight      = ref(0)      // 默认运费
const freeFreightEnabled  = ref(false)  // 是否开启包邮
const freeFreightAmount   = ref(0)      // 包邮门槛

// 🆕 商品总金额
const totalAmount = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.subtotal, 0)
)

// 🆕 动态计算运费（与后端 calcFreight 逻辑完全一致）
const freight = computed(() => {
  if (defaultFreight.value === 0) return 0
  if (freeFreightEnabled.value && totalAmount.value >= freeFreightAmount.value) return 0
  return defaultFreight.value
})

// 🆕 包邮提示文案
const freightTip = computed(() => {
  if (defaultFreight.value === 0) return ''
  if (!freeFreightEnabled.value) return ''
  if (freight.value === 0) return ''
  const diff = (freeFreightAmount.value - totalAmount.value).toFixed(2)
  return `再购 ¥${diff} 即可享受免运费`
})

// 🆕 应付金额 = 商品总额 + 运费
const paymentAmount = computed(() => totalAmount.value + freight.value)

// 加载运费设置
const loadFreightSetting = async () => {
  freightLoading.value = true
  try {
    const res = await getFreightSetting()
    defaultFreight.value     = Number(res.data.defaultFreight)     || 0
    freeFreightEnabled.value = Boolean(res.data.freeFreightEnabled)
    freeFreightAmount.value  = Number(res.data.freeFreightAmount)  || 0
  } catch (e) {
    // 读取失败兜底免运费，不阻塞下单
    defaultFreight.value = 0
  } finally {
    freightLoading.value = false
  }
}

// 加载选中的商品
const loadSelectedItems = async () => {
  try {
    const res = await getCartList()
    selectedItems.value = res.data.filter(item => item.selected === 1)
    if (selectedItems.value.length === 0) {
      ElMessage.warning('请先选择要购买的商品')
      router.push('/cart')
    }
  } catch (error) {
    ElMessage.error(error.message || '加载商品失败')
  }
}

// 提交订单
const handleSubmitOrder = async () => {
  try {
    await addressFormRef.value.validate()
    submitting.value = true

    const orderData = {
      ...addressForm.value,
      cartIds: selectedItems.value.map(item => item.id)
    }

    const res = await createOrder(orderData)
    ElMessage.success('订单创建成功')
    router.push(`/order/detail/${res.data.id}`)

  } catch (error) {
    if (error !== 'validation failed') {
      ElMessage.error(error.message || '订单创建失败')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSelectedItems()
  loadFreightSetting()  // 🆕
})
</script>

<style scoped lang="scss">
.checkout-page {
  min-height: calc(100vh - 200px);
  padding: 20px 0;
  background: #f5f5f5;
}

.container {
  width: 1200px;
  margin: 0 auto;
}

.el-breadcrumb {
  margin-bottom: 20px;
}

.checkout-container {
  background: white;
  border-radius: 4px;
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  &:last-child { margin-bottom: 0; }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e8e8;
}

.product-section {
  .product-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    margin-bottom: 12px;
    &:last-child { margin-bottom: 0; }
  }
  .product-image {
    width: 80px;
    height: 80px;
    border-radius: 4px;
  }
  .product-details {
    flex: 1;
    margin-left: 16px;
  }
  .product-name {
    font-size: 16px;
    margin-bottom: 6px;
  }
  .product-brand {
    font-size: 14px;
    color: #999;
  }
  .product-price,
  .product-quantity,
  .product-subtotal {
    width: 120px;
    text-align: center;
  }
  .product-price    { color: #ff6b00; }
  .product-subtotal { font-size: 18px; font-weight: 600; color: #ff6b00; }
}

.summary-section {
  .summary-item {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0;
    font-size: 16px;

    &.total {
      font-size: 20px;
      font-weight: 600;
      border-top: 1px solid #e8e8e8;
      margin-top: 12px;
      padding-top: 16px;
    }

    .amount {
      margin-left: 20px;
      color: #ff6b00;
      min-width: 120px;
      text-align: right;
      &.discount { color: #67c23a; }
    }
  }
}

/* 🆕 包邮提示 */
.freight-tip {
  text-align: right;
  font-size: 12px;
  color: #e6a23c;
  margin-top: -8px;
  margin-bottom: 4px;
}

.submit-section {
  margin-top: 30px;
  text-align: right;
}
</style>