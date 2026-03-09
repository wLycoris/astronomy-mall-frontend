<template>
  <div class="checkout-page">
    <div class="container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/cart' }">购物车</el-breadcrumb-item>
        <el-breadcrumb-item>订单结算</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="checkout-container">

        <!-- ===== 收货地址 ===== -->
        <div class="section address-section">
          <div class="section-header">
            <h3 class="section-title">收货地址</h3>
            <el-button link type="primary" @click="router.push('/user/address')">
              管理地址 →
            </el-button>
          </div>

          <div v-if="addressLoading" class="address-loading">
            <el-skeleton :rows="2" animated />
          </div>

          <el-empty
              v-else-if="addressList.length === 0"
              description="您还没有收货地址，请先添加"
              :image-size="80"
          >
            <el-button type="primary" @click="router.push('/user/address')">
              去添加地址
            </el-button>
          </el-empty>

          <div v-else class="address-list">
            <div
                v-for="addr in addressList"
                :key="addr.id"
                class="address-card"
                :class="{ 'is-selected': selectedAddressId === addr.id }"
                @click="selectedAddressId = addr.id"
            >
              <div class="select-dot">
                <div class="dot-inner" v-if="selectedAddressId === addr.id" />
              </div>
              <div class="addr-body">
                <div class="addr-top">
                  <span class="recv-name">{{ addr.receiverName }}</span>
                  <span class="recv-phone">{{ addr.receiverPhone }}</span>
                  <el-tag v-if="addr.isDefault === 1" type="success" size="small" effect="dark">默认</el-tag>
                </div>
                <div class="addr-detail">
                  {{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}
                </div>
              </div>
            </div>

            <div class="addr-add-btn" @click="router.push('/user/address')">
              <el-icon><Plus /></el-icon>
              <span>添加新地址</span>
            </div>
          </div>
        </div>

        <!-- ===== 商品清单 ===== -->
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

        <!-- ===== 订单备注 ===== -->
        <div class="section remark-section">
          <h3 class="section-title">订单备注</h3>
          <el-input
              v-model="remark"
              type="textarea"
              :rows="3"
              placeholder="选填，可填写配送要求等信息"
              maxlength="200"
              show-word-limit
          />
        </div>

        <!-- ===== 费用明细 ===== -->
        <div class="section summary-section">
          <h3 class="section-title">费用明细</h3>
          <div class="summary-item">
            <span>商品总金额:</span>
            <span class="amount">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
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
          <div class="freight-tip" v-if="freightTip">{{ freightTip }}</div>
          <div class="summary-item">
            <span>优惠金额:</span>
            <span class="amount discount">-¥0.00</span>
          </div>
          <div class="summary-item total">
            <span>应付金额:</span>
            <span class="amount">¥{{ paymentAmount.toFixed(2) }}</span>
          </div>
        </div>

        <!-- ===== 提交订单 ===== -->
        <div class="submit-section">
          <span v-if="addressList.length > 0 && !selectedAddressId" class="no-addr-tip">
            请选择收货地址
          </span>
          <el-button
              type="primary"
              size="large"
              :loading="submitting"
              :disabled="addressList.length === 0 || !selectedAddressId"
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
import { Plus } from '@element-plus/icons-vue'
import { getCartList } from '@/api/cart'
import { createOrder } from '@/api/order'
import { getFreightSetting } from '@/api/admin/setting'
import { getAddressList } from '@/api/address'

const router = useRouter()

// =====================================================================
// 收货地址
// =====================================================================
const addressLoading    = ref(false)
const addressList       = ref([])
const selectedAddressId = ref(null)

const loadAddressList = async () => {
  addressLoading.value = true
  try {
    const res = await getAddressList()
    addressList.value = res.data || []
    if (addressList.value.length > 0) {
      const defaultAddr = addressList.value.find(a => a.isDefault === 1)
      selectedAddressId.value = defaultAddr ? defaultAddr.id : addressList.value[0].id
    }
  } catch (e) {
    ElMessage.error('加载收货地址失败')
  } finally {
    addressLoading.value = false
  }
}

// =====================================================================
// 商品清单
// =====================================================================
const selectedItems = ref([])

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

// =====================================================================
// 运费计算
// =====================================================================
const freightLoading     = ref(false)
const defaultFreight     = ref(0)
const freeFreightEnabled = ref(false)
const freeFreightAmount  = ref(0)
const remark             = ref('')

const totalAmount = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.subtotal, 0)
)

const freight = computed(() => {
  if (defaultFreight.value === 0) return 0
  if (freeFreightEnabled.value && totalAmount.value >= freeFreightAmount.value) return 0
  return defaultFreight.value
})

const freightTip = computed(() => {
  if (defaultFreight.value === 0 || !freeFreightEnabled.value || freight.value === 0) return ''
  const diff = (freeFreightAmount.value - totalAmount.value).toFixed(2)
  return `再购 ¥${diff} 即可享受免运费`
})

const paymentAmount = computed(() => totalAmount.value + freight.value)

const loadFreightSetting = async () => {
  freightLoading.value = true
  try {
    const res = await getFreightSetting()
    defaultFreight.value     = Number(res.data.defaultFreight)     || 0
    freeFreightEnabled.value = Boolean(res.data.freeFreightEnabled)
    freeFreightAmount.value  = Number(res.data.freeFreightAmount)  || 0
  } catch (e) {
    defaultFreight.value = 0
  } finally {
    freightLoading.value = false
  }
}

// =====================================================================
// 提交订单
// =====================================================================
const submitting = ref(false)

const handleSubmitOrder = async () => {
  if (!selectedAddressId.value) {
    ElMessage.warning('请先选择收货地址')
    return
  }

  submitting.value = true
  try {
    const res = await createOrder({
      cartIds:   selectedItems.value.map(item => item.id),
      addressId: selectedAddressId.value,
      remark:    remark.value || ''
    })

    ElMessage.success('订单创建成功')
    router.push(`/order/detail/${res.data.id}`)

  } catch (error) {
    ElMessage.error(error.message || '订单创建失败')
  } finally {
    submitting.value = false
  }
}

// =====================================================================
// 初始化
// =====================================================================
onMounted(() => {
  loadAddressList()
  loadSelectedItems()
  loadFreightSetting()
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e8e8;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.address-loading { padding: 12px 0; }

.address-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1.5px solid #e5e6eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s;

  &:hover { border-color: #409eff; background: #f0f7ff; }
  &.is-selected { border-color: #409eff; background: #ecf5ff; }
}

.select-dot {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #c0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.18s;

  .address-card.is-selected & { border-color: #409eff; }
}

.dot-inner { width: 10px; height: 10px; border-radius: 50%; background: #409eff; }

.addr-body { flex: 1; }

.addr-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.recv-name  { font-size: 15px; font-weight: 600; color: #1d2129; }
.recv-phone { font-size: 14px; color: #4e5969; }
.addr-detail { font-size: 14px; color: #4e5969; line-height: 1.5; }

.addr-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  border: 1.5px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  transition: all 0.18s;
  &:hover { border-color: #409eff; color: #409eff; background: #f0f7ff; }
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
  .product-image   { width: 80px; height: 80px; border-radius: 4px; }
  .product-details { flex: 1; margin-left: 16px; }
  .product-name    { font-size: 16px; margin-bottom: 6px; }
  .product-brand   { font-size: 14px; color: #999; }
  .product-price,
  .product-quantity,
  .product-subtotal { width: 120px; text-align: center; }
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

.freight-tip {
  text-align: right;
  font-size: 12px;
  color: #e6a23c;
  margin-top: -8px;
  margin-bottom: 4px;
}

.submit-section {
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.no-addr-tip { font-size: 14px; color: #f56c6c; }
</style>