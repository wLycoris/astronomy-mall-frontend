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
            <div class="address-actions">
              <!-- 6.4 地址联动：定位按钮，自动填充并保存经纬度 -->
              <el-button
                  link
                  type="primary"
                  :loading="locating"
                  @click="handleLocateAndFill"
              >
                <el-icon><Aim /></el-icon>
                <span>使用当前位置</span>
              </el-button>
              <el-button link type="primary" @click="router.push('/user/address')">
                管理地址 →
              </el-button>
            </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Aim, Plus } from '@element-plus/icons-vue'
import { getCartList } from '@/api/cart'
import { createOrder } from '@/api/order'
import { getFreightSetting } from '@/api/admin/setting'
import { getAddressList } from '@/api/address'
import { updateUserLocation } from '@/api/user'

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
// 6.4 地址联动：定位 → 逆地理编码 → 匹配最近地址
// =====================================================================
const locating = ref(false)

/**
 * 点击「使用当前位置」：
 * 1. 浏览器定位获取经纬度
 * 2. 调用后端保存坐标到用户表
 * 3. 逆地理编码获取省市区
 * 4. 在已有地址列表中匹配同城市的地址并自动选中
 */
const handleLocateAndFill = () => {
  if (!navigator.geolocation) {
    ElMessage.warning('您的浏览器不支持定位功能')
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lng = position.coords.longitude
      const lat = position.coords.latitude

      // 静默保存经纬度到用户表
      updateUserLocation({ longitude: lng, latitude: lat }).catch(() => {})

      // 逆地理编码 → 匹配地址
      if (window.AMap) {
        AMap.plugin('AMap.Geocoder', () => {
          const geocoder = new AMap.Geocoder()
          geocoder.getAddress([lng, lat], (status, result) => {
            locating.value = false
            if (status === 'complete' && result.regeocode) {
              const component = result.regeocode.addressComponent
              const city     = component.city || component.province || ''
              const district = component.district || ''

              // 在已有地址中查找同城市 + 同区的地址
              let matched = addressList.value.find(
                a => a.city === city && a.district === district
              )
              // 退而求其次：只匹配城市
              if (!matched) {
                matched = addressList.value.find(a => a.city === city)
              }

              if (matched) {
                selectedAddressId.value = matched.id
                ElMessage.success(`已定位到 ${city} ${district}，已自动选中匹配地址`)
              } else {
                ElMessage.info(`已定位到 ${city} ${district}，但无匹配地址，请手动选择或添加`)
              }
            } else {
              ElMessage.error('定位解析失败，请手动选择地址')
            }
          })
        })
      } else {
        locating.value = false
        ElMessage.error('地图服务未加载')
      }
    },
    (error) => {
      locating.value = false
      const messages = {
        1: '您拒绝了定位权限，请在浏览器设置中允许',
        2: '无法获取位置信息，请检查网络',
        3: '定位超时，请重试'
      }
      ElMessage.warning(messages[error.code] || '定位失败')
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
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

/* Trade flow polish */
.checkout-page {
  min-height: 100vh;
  padding: 28px 0 78px;
  background:
    radial-gradient(circle at 12% 0%, rgba(199,165,114,.10), transparent 28%),
    linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
  color: #172033;
}

.container {
  width: min(1200px, calc(100% - 48px));
}

.el-breadcrumb {
  margin-bottom: 22px;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: #6f7787 !important;
  font-weight: 500 !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #172033 !important;
}

.checkout-container {
  padding: 28px;
  border: 1px solid rgba(23,32,51,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.94);
  box-shadow: 0 18px 45px rgba(23,32,51,.08);
}

.section {
  margin-bottom: 34px;
}

.section-header {
  border-bottom: 1px solid rgba(23,32,51,.08);
}

.section-title {
  color: #172033;
  font-size: 21px;
  font-weight: 750;
  letter-spacing: .4px;
}

.address-card,
.addr-add-btn,
.product-section .product-item {
  border-color: rgba(23,32,51,.10);
  border-radius: 10px;
  background: #fff;
}

.address-card {
  padding: 16px 18px;

  &:hover {
    border-color: rgba(199,165,114,.54);
    background: #fffaf1;
  }

  &.is-selected {
    border-color: #172033;
    background: linear-gradient(180deg, #f8fbff, #f3f6fb);
    box-shadow: 0 10px 24px rgba(23,32,51,.08);
  }
}

.select-dot {
  border-color: rgba(23,32,51,.22);

  .address-card.is-selected & {
    border-color: #172033;
  }
}

.dot-inner {
  background: #172033;
}

.recv-name {
  color: #172033;
}

.recv-phone,
.addr-detail {
  color: #657084;
}

.addr-add-btn {
  color: #657084;

  &:hover {
    border-color: rgba(199,165,114,.54);
    color: #7a5e3d;
    background: #fffaf1;
  }
}

.product-section {
  .product-item {
    padding: 18px;
    transition: box-shadow .2s ease, transform .2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(23,32,51,.08);
    }
  }

  .product-image {
    width: 88px;
    height: 88px;
    border-radius: 8px;
    border: 1px solid rgba(23,32,51,.08);
    background: #eef2f7;
    overflow: hidden;
  }

  .product-name {
    color: #172033;
    font-weight: 650;
  }

  .product-brand {
    color: #8a92a3;
  }

  .product-price {
    color: #5a6272;
    font-weight: 600;
  }

  .product-subtotal {
    color: #d85c25;
    font-size: 20px;
  }
}

:deep(.remark-section .el-textarea__inner) {
  min-height: 88px !important;
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(23,32,51,.10) inset;
  background: #fff;
}

:deep(.remark-section .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #172033 inset;
}

.summary-section {
  max-width: 440px;
  margin-left: auto;
  padding: 20px 22px;
  border: 1px solid rgba(23,32,51,.08);
  border-radius: 10px;
  background: #fbfcff;

  .summary-item {
    color: #5a6272;

    .amount {
      color: #172033;
      font-weight: 650;

      &.discount {
        color: #4d9b4a;
      }
    }

    &.total {
      color: #172033;
      border-top-color: rgba(23,32,51,.10);

      .amount {
        color: #d85c25;
        font-size: 28px;
        letter-spacing: .5px;
      }
    }
  }
}

.freight-tip {
  color: #7a5e3d;
}

.submit-section {
  margin-top: 24px;
  padding-top: 22px;
  border-top: 1px solid rgba(23,32,51,.08);
}

:deep(.el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #27334b;
  --el-button-hover-border-color: #27334b;
  --el-button-active-bg-color: #101827;
  --el-button-active-border-color: #101827;
  min-width: 112px;
  font-weight: 650;
}

:deep(.el-button.is-link) {
  color: #59647a;
}

:deep(.el-button.is-link:hover) {
  color: #7a5e3d;
}

@media (max-width: 860px) {
  .container {
    width: calc(100% - 28px);
  }

  .checkout-container {
    padding: 20px;
  }

  .section-header,
  .product-section .product-item,
  .submit-section {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-section .product-price,
  .product-section .product-quantity,
  .product-section .product-subtotal {
    width: auto;
    text-align: left;
  }

  .summary-section {
    max-width: none;
  }
}
/* Final direction: restrained premium checkout */
.checkout-page {
  min-height: 100vh;
  padding: 28px 0 64px;
  background:
    linear-gradient(180deg, rgba(18, 27, 43, 0.035), transparent 220px),
    #f6f4ef;
  color: #172033;
}

.container {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto;
}

.el-breadcrumb {
  margin-bottom: 18px;
  font-size: 13px;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: #7a8494 !important;
  font-weight: 500 !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #172033 !important;
}

.checkout-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: start;
}

.section {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
}

.address-section,
.product-section,
.remark-section {
  grid-column: 1;
}

.summary-section,
.submit-section {
  grid-column: 2;
}

.summary-section {
  position: sticky;
  top: 20px;
  background: #172033;
  color: #ffffff;
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.16);
}

.submit-section {
  position: sticky;
  top: 320px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.section-header {
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
}

.section-title {
  color: #172033;
  font-size: 18px;
  font-weight: 760;
  letter-spacing: 0;
}

.summary-section .section-title {
  color: #ffffff;
}

.section-header :deep(.el-button),
.address-section :deep(.el-button.is-link) {
  color: #8a6a3f;
  font-weight: 650;
}

.address-list {
  gap: 12px;
}

.address-card {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: #fbfcfd;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.address-card:hover {
  border-color: rgba(159, 122, 68, 0.24);
  background: #fffaf1;
}

.address-card.is-selected {
  border-color: #172033;
  background: #fffaf1;
  box-shadow: none;
}

.select-dot {
  border-color: rgba(23, 32, 51, 0.24);
}

.dot-inner {
  background: #172033;
}

.recv-name {
  color: #172033;
  font-weight: 760;
}

.recv-phone,
.addr-detail {
  color: #6b7280;
}

.addr-add-btn {
  border: 1px dashed rgba(23, 32, 51, 0.18);
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
}

.addr-add-btn:hover {
  border-color: rgba(159, 122, 68, 0.35);
  background: #fffaf1;
  color: #8a6a3f;
}

.product-item {
  min-height: 116px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
}

.product-item:last-child {
  border-bottom: 0;
}

.product-image {
  width: 92px;
  height: 92px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 6px;
  background: #eef0f3;
  overflow: hidden;
}

.product-name {
  color: #172033;
  font-size: 15px;
  font-weight: 680;
  line-height: 1.5;
}

.product-brand {
  color: #8a93a3;
}

.product-price,
.product-quantity {
  color: #4b5563;
  font-weight: 650;
}

.product-subtotal {
  color: #b35d25;
  font-weight: 800;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.12) inset;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #172033 inset;
}

.summary-item {
  color: rgba(255, 255, 255, 0.74);
  font-size: 14px;
}

.summary-item .amount {
  color: #ffffff;
  font-weight: 700;
}

.summary-item .discount {
  color: #9bd49d;
}

.summary-item.total {
  margin-top: 14px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.summary-item.total .amount {
  color: #e7c078;
  font-size: 30px;
  font-weight: 800;
}

.freight-tip {
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.72);
}

.submit-section :deep(.el-button--primary) {
  --el-button-bg-color: #172033;
  --el-button-border-color: #172033;
  --el-button-hover-bg-color: #28344d;
  --el-button-hover-border-color: #28344d;
  width: 100%;
  height: 46px;
  border-radius: 6px;
  font-weight: 800;
}

.no-addr-tip {
  display: block;
  margin-bottom: 10px;
  color: #b35d25;
  text-align: center;
}

@media (max-width: 980px) {
  .checkout-container {
    grid-template-columns: 1fr;
  }

  .address-section,
  .product-section,
  .remark-section,
  .summary-section,
  .submit-section {
    grid-column: 1;
  }

  .summary-section,
  .submit-section {
    position: static;
  }
}

@media (max-width: 720px) {
  .checkout-page {
    padding: 18px 0 44px;
  }

  .container {
    width: calc(100% - 28px);
  }

  .product-item {
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 12px;
  }

  .product-image {
    width: 76px;
    height: 76px;
  }
}

/* Checkout final pass: page-local rules, not a shared blanket override. */
:global(body .checkout-page.checkout-page.checkout-page) {
  min-height: 100vh !important;
  padding: 28px 0 72px !important;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88) 0%, rgba(246, 243, 236, 0.96) 260px),
    #f6f3ec !important;
  color: #1f2933 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .container) {
  width: min(1160px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
}

:global(body .checkout-page.checkout-page.checkout-page .checkout-container) {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 320px !important;
  gap: 22px !important;
  align-items: start !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

:global(body .checkout-page.checkout-page.checkout-page .checkout-container::before) {
  display: none !important;
  content: none !important;
}

:global(body .checkout-page.checkout-page.checkout-page .section) {
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: rgba(255, 253, 250, 0.98) !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-section),
:global(body .checkout-page.checkout-page.checkout-page .product-section),
:global(body .checkout-page.checkout-page.checkout-page .remark-section) {
  grid-column: 1 !important;
  padding: 22px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-section) {
  grid-row: 1 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-section) {
  grid-row: 2 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .remark-section) {
  grid-row: 3 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section) {
  grid-column: 2 !important;
  grid-row: 1 / span 3 !important;
  position: sticky !important;
  top: 24px !important;
  align-self: start !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 14px !important;
  width: auto !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 22px !important;
  border: 1px solid #111827 !important;
  border-radius: 7px !important;
  background: #111827 !important;
  color: #f9fafb !important;
  box-shadow: none !important;
}

:global(body .checkout-page.checkout-page.checkout-page .section-title) {
  margin: 0 0 16px !important;
  color: #111827 !important;
  font-size: 18px !important;
  font-weight: 780 !important;
  line-height: 1.35 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .section-title) {
  margin-bottom: 8px !important;
  color: #f9fafb !important;
}

:global(body .checkout-page.checkout-page.checkout-page .section-header) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  margin-bottom: 16px !important;
  padding-bottom: 14px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
}

:global(body .checkout-page.checkout-page.checkout-page .section-header > div) {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: flex-end !important;
  gap: 8px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-list) {
  display: grid !important;
  gap: 12px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-card) {
  display: grid !important;
  grid-template-columns: 26px minmax(0, 1fr) !important;
  gap: 12px !important;
  align-items: center !important;
  min-height: 74px !important;
  padding: 14px 16px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 6px !important;
  background: #ffffff !important;
  box-shadow: none !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-card.is-selected) {
  border-color: #9c6b35 !important;
  background: #fff8ec !important;
}

:global(body .checkout-page.checkout-page.checkout-page .recv-name),
:global(body .checkout-page.checkout-page.checkout-page .product-name) {
  color: #111827 !important;
  font-weight: 720 !important;
  line-height: 1.45 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .recv-phone),
:global(body .checkout-page.checkout-page.checkout-page .addr-detail),
:global(body .checkout-page.checkout-page.checkout-page .product-brand) {
  color: #667085 !important;
  line-height: 1.55 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .addr-add-btn) {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  min-height: 44px !important;
  padding: 0 16px !important;
  border: 1px dashed rgba(21, 26, 34, 0.18) !important;
  border-radius: 6px !important;
  background: #ffffff !important;
  color: #4b5563 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-item) {
  display: grid !important;
  grid-template-columns: 86px minmax(0, 1fr) 112px 52px 122px !important;
  gap: 16px !important;
  align-items: center !important;
  min-height: 112px !important;
  padding: 16px 0 !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-item:last-child) {
  border-bottom: 0 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-image) {
  width: 86px !important;
  height: 86px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 5px !important;
  background: #eef0f3 !important;
  overflow: hidden !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-price),
:global(body .checkout-page.checkout-page.checkout-page .product-quantity) {
  color: #374151 !important;
  font-weight: 650 !important;
  text-align: right !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-subtotal) {
  color: #a6531f !important;
  font-size: 18px !important;
  font-weight: 820 !important;
  text-align: right !important;
}

:global(body .checkout-page.checkout-page.checkout-page .remark-section .el-textarea__inner) {
  min-height: 96px !important;
  border-radius: 6px !important;
  color: #1f2933 !important;
  background: #ffffff !important;
  box-shadow: 0 0 0 1px rgba(21, 26, 34, 0.14) inset !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  margin: 0 !important;
  color: #f9fafb !important;
  font-size: 14px !important;
  line-height: 1.55 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item span) {
  color: #f9fafb !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item .amount) {
  color: #f0c878 !important;
  font-weight: 760 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item.total) {
  margin-top: 6px !important;
  padding-top: 16px !important;
  border-top: 1px solid rgba(255, 253, 250, 0.18) !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item.total .amount) {
  font-size: 26px !important;
  font-weight: 850 !important;
  line-height: 1.1 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .freight-tip) {
  margin: -4px 0 0 !important;
  padding: 8px 10px !important;
  border-radius: 5px !important;
  background: rgba(255, 253, 250, 0.08) !important;
  color: rgba(249, 250, 251, 0.82) !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .submit-section) {
  position: static !important;
  display: grid !important;
  gap: 10px !important;
  margin: 8px 0 0 !important;
  padding: 18px 0 0 !important;
  border-top: 1px solid rgba(255, 253, 250, 0.18) !important;
  background: transparent !important;
  box-shadow: none !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .submit-section .el-button) {
  width: 100% !important;
  height: 44px !important;
  border-color: #f0c878 !important;
  border-radius: 4px !important;
  background: #f0c878 !important;
  color: #111827 !important;
  font-weight: 780 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .submit-section .el-button span) {
  color: #111827 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .section-header .el-button),
:global(body .checkout-page.checkout-page.checkout-page .addr-add-btn),
:global(body .checkout-page.checkout-page.checkout-page .el-button.is-link) {
  color: #374151 !important;
  font-weight: 650 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-actions) {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-actions .el-button) {
  --el-button-bg-color: #fffdf7 !important;
  --el-button-border-color: rgba(156, 107, 53, 0.28) !important;
  --el-button-hover-bg-color: #fff8ec !important;
  --el-button-hover-border-color: rgba(156, 107, 53, 0.48) !important;
  --el-button-active-bg-color: #f5ead8 !important;
  --el-button-active-border-color: rgba(156, 107, 53, 0.58) !important;
  height: 30px !important;
  min-width: 0 !important;
  margin-left: 0 !important;
  padding: 0 12px !important;
  border: 1px solid rgba(156, 107, 53, 0.28) !important;
  border-radius: 4px !important;
  background: #fffdf7 !important;
  color: #1f2933 !important;
  box-shadow: none !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-actions .el-button span) {
  color: #1f2933 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-actions .el-button .el-icon) {
  margin-right: 4px !important;
  color: currentColor !important;
  font-size: 14px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-actions .el-button:hover) {
  background: #fff8ec !important;
  color: #8a5a22 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-actions .el-button:hover span) {
  color: #8a5a22 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-details) {
  min-width: 0 !important;
  margin-left: 0 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-price),
:global(body .checkout-page.checkout-page.checkout-page .product-quantity),
:global(body .checkout-page.checkout-page.checkout-page .product-subtotal) {
  width: auto !important;
  min-width: 0 !important;
  padding: 0 !important;
  line-height: 1.25 !important;
  white-space: nowrap !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-item) {
  grid-template-columns: 86px minmax(220px, 1fr) max-content max-content max-content !important;
  column-gap: 14px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-price) {
  justify-self: end !important;
  color: #6f4e2b !important;
  font-size: 14px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-quantity) {
  justify-self: center !important;
  color: #667085 !important;
  font-size: 13px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-subtotal) {
  justify-self: end !important;
  min-width: 116px !important;
  padding-left: 14px !important;
  border-left: 1px solid rgba(21, 26, 34, 0.12) !important;
  color: #9c4f1e !important;
  font-size: 18px !important;
}

/* Checkout pass 2: keep the receipt language, reduce the floating feeling. */
:global(body .checkout-page.checkout-page.checkout-page .checkout-container) {
  gap: 18px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .section) {
  margin-bottom: 0 !important;
  box-shadow: 0 10px 24px rgba(21, 26, 34, 0.045) !important;
}

:global(body .checkout-page.checkout-page.checkout-page .address-section),
:global(body .checkout-page.checkout-page.checkout-page .product-section),
:global(body .checkout-page.checkout-page.checkout-page .remark-section) {
  padding: 20px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section) {
  gap: 12px !important;
  padding: 20px !important;
  border-color: rgba(21, 26, 34, 0.14) !important;
  background: #fffdfa !important;
  color: #1f2933 !important;
  box-shadow: 0 10px 24px rgba(21, 26, 34, 0.06) !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .section-title) {
  margin-bottom: 4px !important;
  padding-bottom: 14px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  color: #111827 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item) {
  color: #4b5563 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item span) {
  color: inherit !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item .amount) {
  color: #111827 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item.total) {
  margin-top: 4px !important;
  padding-top: 16px !important;
  border-top: 1px solid rgba(21, 26, 34, 0.12) !important;
  color: #111827 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .summary-item.total .amount) {
  color: #9c4f1e !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .submit-section) {
  padding-top: 16px !important;
  border-top: 1px solid rgba(21, 26, 34, 0.12) !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .submit-section .el-button) {
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

:global(body .checkout-page.checkout-page.checkout-page .summary-section .submit-section .el-button span) {
  color: #fffdfa !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-section .section-title) {
  margin-bottom: 12px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-item) {
  min-height: 96px !important;
  padding: 12px 0 !important;
}

:global(body .checkout-page.checkout-page.checkout-page .product-image) {
  width: 78px !important;
  height: 78px !important;
}

:global(body .checkout-page.checkout-page.checkout-page .remark-section .el-textarea__inner) {
  min-height: 84px !important;
}

@media (max-width: 980px) {
  :global(body .checkout-page.checkout-page.checkout-page .container) {
    width: calc(100vw - 28px) !important;
  }

  :global(body .checkout-page.checkout-page.checkout-page .checkout-container) {
    grid-template-columns: 1fr !important;
  }

  :global(body .checkout-page.checkout-page.checkout-page .address-section),
  :global(body .checkout-page.checkout-page.checkout-page .product-section),
  :global(body .checkout-page.checkout-page.checkout-page .remark-section),
  :global(body .checkout-page.checkout-page.checkout-page .summary-section) {
    grid-column: 1 !important;
    grid-row: auto !important;
  }

  :global(body .checkout-page.checkout-page.checkout-page .summary-section) {
    position: static !important;
  }
}

@media (max-width: 720px) {
  :global(body .checkout-page.checkout-page.checkout-page .section-header) {
    align-items: flex-start !important;
    flex-direction: column !important;
  }

  :global(body .checkout-page.checkout-page.checkout-page .section-header > div) {
    justify-content: flex-start !important;
  }

  :global(body .checkout-page.checkout-page.checkout-page .product-item) {
    grid-template-columns: 76px minmax(0, 1fr) !important;
  }

  :global(body .checkout-page.checkout-page.checkout-page .product-price),
  :global(body .checkout-page.checkout-page.checkout-page .product-quantity),
  :global(body .checkout-page.checkout-page.checkout-page .product-subtotal) {
    grid-column: 2 !important;
    text-align: left !important;
  }

  :global(body .checkout-page.checkout-page.checkout-page .product-image) {
    width: 76px !important;
    height: 76px !important;
  }
}
</style>
