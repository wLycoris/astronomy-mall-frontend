<template>
  <div class="address-manage">
    <!-- ===== 页面标题 + 新增按钮 ===== -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">收货地址</h2>
        <span class="address-count">{{ addressList.length }}/5 个地址</span>
      </div>
      <el-button
          type="primary"
          :icon="Plus"
          :disabled="addressList.length >= 5"
          @click="handleAdd"
      >
        新增地址
      </el-button>
    </div>

    <!-- ===== 地址列表 ===== -->
    <div v-loading="loading" class="address-list">
      <!-- 空状态 -->
      <el-empty
          v-if="!loading && addressList.length === 0"
          description="暂无收货地址，请添加"
          :image-size="120"
      >
        <el-button type="primary" @click="handleAdd">立即添加</el-button>
      </el-empty>

      <!-- 地址卡片列表 -->
      <div
          v-for="address in addressList"
          :key="address.id"
          class="address-card"
          :class="{ 'is-default': address.isDefault === 1 }"
      >
        <!-- 默认地址徽标 -->
        <div class="address-badge" v-if="address.isDefault === 1">
          <el-tag type="success" size="small" effect="dark">默认</el-tag>
        </div>

        <!-- 地址内容 -->
        <div class="address-info">
          <div class="address-header">
            <span class="receiver-name">{{ address.receiverName }}</span>
            <span class="receiver-phone">{{ address.receiverPhone }}</span>
          </div>
          <div class="address-detail">
            {{ address.province }} {{ address.city }} {{ address.district }}
            {{ address.detail }}
          </div>
        </div>

        <!-- 操作按钮行 -->
        <div class="address-actions">
          <el-button
              v-if="address.isDefault !== 1"
              link
              type="primary"
              :loading="settingDefaultId === address.id"
              @click="handleSetDefault(address)"
          >
            设为默认
          </el-button>
          <el-button link type="primary" @click="handleEdit(address)">编辑</el-button>
          <el-popconfirm
              title="确定删除该收货地址吗？"
              confirm-button-text="确定删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              @confirm="handleDelete(address.id)"
          >
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- ===== 新增/编辑地址弹窗 ===== -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '编辑收货地址' : '新增收货地址'"
        width="520px"
        align-center
        :close-on-click-modal="false"
        @close="resetForm"
    >
      <el-form
          ref="addressFormRef"
          :model="addressForm"
          :rules="formRules"
          label-width="90px"
          label-position="right"
      >
        <!-- 收货人姓名 -->
        <el-form-item label="收货人" prop="receiverName">
          <el-input
              v-model="addressForm.receiverName"
              placeholder="请输入收货人姓名"
              maxlength="50"
              clearable
          />
        </el-form-item>

        <!-- 手机号 -->
        <el-form-item label="手机号" prop="receiverPhone">
          <el-input
              v-model="addressForm.receiverPhone"
              placeholder="请输入手机号"
              maxlength="11"
              clearable
          />
        </el-form-item>

        <!-- 省市区级联 + 定位按钮（6.4 地址联动） -->
        <el-form-item label="所在地区" prop="region">
          <div class="region-row">
            <el-cascader
                v-model="addressForm.region"
                :options="regionOptions"
                :props="cascaderProps"
                placeholder="请选择省/市/区县"
                style="flex: 1"
                filterable
                clearable
                @change="handleRegionChange"
            />
            <el-button
                :icon="Location"
                :loading="locating"
                @click="handleUseCurrentLocation"
                title="使用当前位置自动填充省市区"
            >
              定位
            </el-button>
          </div>
        </el-form-item>

        <!-- 详细地址 -->
        <el-form-item label="详细地址" prop="detail">
          <el-input
              v-model="addressForm.detail"
              type="textarea"
              :rows="3"
              placeholder="请输入街道、楼栋、门牌号等详细地址"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>

        <!-- 设为默认 -->
        <el-form-item label="设为默认">
          <el-switch
              v-model="addressForm.isDefault"
              :active-value="1"
              :inactive-value="0"
              active-text="默认地址"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '保存地址' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getAddressList,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '@/api/address'
import { updateUserLocation } from '@/api/user'
// 📌 引入完整省市区数据
import { regionOptions } from '@/utils/regionData'

// =====================================================================
// 数据状态
// =====================================================================
const loading          = ref(false)
const submitting       = ref(false)
const settingDefaultId = ref(null)
const addressList      = ref([])

// =====================================================================
// 弹窗状态
// =====================================================================
const dialogVisible = ref(false)
const isEdit        = ref(false)
const editId        = ref(null)

const addressFormRef = ref(null)
const addressForm = reactive({
  receiverName:  '',
  receiverPhone: '',
  region:        [],   // 级联选择器值 [省, 市, 区]
  province:      '',
  city:          '',
  district:      '',
  detail:        '',
  isDefault:     0
})

const formRules = {
  receiverName: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { max: 50, message: '姓名最长50个字符', trigger: 'blur' }
  ],
  receiverPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择省市区', trigger: 'change' }
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { max: 200, message: '详细地址最长200个字符', trigger: 'blur' }
  ]
}

// 级联配置
// 📌 filterable=true 支持关键词搜索，方便选偏远地区
const cascaderProps = {
  value:    'value',
  label:    'label',
  children: 'children'
}

// =====================================================================
// 初始化
// =====================================================================
onMounted(() => {
  loadAddressList()
})

// =====================================================================
// 加载地址列表
// =====================================================================
const loadAddressList = async () => {
  loading.value = true
  try {
    const res = await getAddressList()
    addressList.value = res.data || []
  } catch (e) {
    ElMessage.error('加载地址列表失败')
  } finally {
    loading.value = false
  }
}

// =====================================================================
// 省市区级联变更
// =====================================================================
const handleRegionChange = (value) => {
  if (value && value.length === 3) {
    addressForm.province = value[0]
    addressForm.city     = value[1]
    addressForm.district = value[2]
  } else {
    addressForm.province = ''
    addressForm.city     = ''
    addressForm.district = ''
  }
}

// =====================================================================
// 新增地址
// =====================================================================
const handleAdd = () => {
  if (addressList.value.length >= 5) {
    ElMessage.warning('最多只能保存 5 个收货地址')
    return
  }
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

// =====================================================================
// 编辑地址
// =====================================================================
const handleEdit = (address) => {
  isEdit.value  = true
  editId.value  = address.id

  addressForm.receiverName  = address.receiverName
  addressForm.receiverPhone = address.receiverPhone
  addressForm.province      = address.province
  addressForm.city          = address.city
  addressForm.district      = address.district
  addressForm.detail        = address.detail
  addressForm.isDefault     = address.isDefault
  // 回填级联选择器（三级路径）
  addressForm.region = [address.province, address.city, address.district]

  dialogVisible.value = true
}

// =====================================================================
// 提交表单（新增 / 编辑）
// =====================================================================
const handleSubmit = async () => {
  const valid = await addressFormRef.value?.validate().catch(() => false)
  if (!valid) return

  if (!addressForm.province || !addressForm.city || !addressForm.district) {
    ElMessage.warning('请选择省市区')
    return
  }

  const payload = {
    receiverName:  addressForm.receiverName,
    receiverPhone: addressForm.receiverPhone,
    province:      addressForm.province,
    city:          addressForm.city,
    district:      addressForm.district,
    detail:        addressForm.detail,
    isDefault:     addressForm.isDefault
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateAddress(editId.value, payload)
      ElMessage.success('地址修改成功')
    } else {
      await addAddress(payload)
      ElMessage.success('地址添加成功')
    }
    dialogVisible.value = false
    loadAddressList()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

// =====================================================================
// 删除地址
// =====================================================================
const handleDelete = async (id) => {
  try {
    await deleteAddress(id)
    ElMessage.success('地址删除成功')
    loadAddressList()
  } catch (e) {
    ElMessage.error(e?.message || '删除失败')
  }
}

// =====================================================================
// 设为默认地址
// =====================================================================
const handleSetDefault = async (address) => {
  settingDefaultId.value = address.id
  try {
    await setDefaultAddress(address.id)
    ElMessage.success(`已将"${address.receiverName}"的地址设为默认`)
    loadAddressList()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    settingDefaultId.value = null
  }
}

// =====================================================================
// 6.4 地址联动：使用当前位置自动填充省市区
// =====================================================================
const locating = ref(false)

/**
 * 点击「📍 定位」按钮：
 * 1. navigator.geolocation 获取经纬度
 * 2. AMap.Geocoder 逆地理编码 → 得到省/市/区
 * 3. 自动填充级联选择器 + 详细地址中的街道信息
 * 4. 调用后端 PUT /api/user/location 保存坐标到用户表
 */
const handleUseCurrentLocation = () => {
  if (!navigator.geolocation) {
    ElMessage.warning('您的浏览器不支持定位功能')
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lng = position.coords.longitude
      const lat = position.coords.latitude

      // 调用后端保存经纬度（静默执行，不阻塞主流程）
      updateUserLocation({ longitude: lng, latitude: lat }).catch(() => {})

      // 使用高德地图逆地理编码获取省市区
      if (window.AMap) {
        AMap.plugin('AMap.Geocoder', () => {
          const geocoder = new AMap.Geocoder()
          geocoder.getAddress([lng, lat], (status, result) => {
            locating.value = false
            if (status === 'complete' && result.regeocode) {
              const component = result.regeocode.addressComponent
              const province = component.province || ''
              const city     = component.city     || province  // 直辖市 city 可能为空
              const district = component.district || ''

              // 填充表单字段
              addressForm.province = province
              addressForm.city     = city
              addressForm.district = district
              addressForm.region   = [province, city, district]

              // 如果详细地址为空，用街道+门牌号预填
              if (!addressForm.detail) {
                const street   = component.street     || ''
                const number   = component.streetNumber || ''
                const township = component.township    || ''
                addressForm.detail = township + street + number
              }

              ElMessage.success(`已定位到: ${province} ${city} ${district}`)
            } else {
              ElMessage.error('逆地理编码失败，请手动选择地区')
            }
          })
        })
      } else {
        locating.value = false
        ElMessage.error('地图服务未加载，请手动选择地区')
      }
    },
    (error) => {
      locating.value = false
      const messages = {
        1: '您拒绝了定位权限，请在浏览器设置中允许',
        2: '无法获取位置信息，请检查网络',
        3: '定位超时，请重试'
      }
      ElMessage.warning(messages[error.code] || '定位失败，请手动选择地区')
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

// =====================================================================
// 重置表单
// =====================================================================
const resetForm = () => {
  addressFormRef.value?.resetFields()
  addressForm.receiverName  = ''
  addressForm.receiverPhone = ''
  addressForm.region        = []
  addressForm.province      = ''
  addressForm.city          = ''
  addressForm.district      = ''
  addressForm.detail        = ''
  addressForm.isDefault     = 0
}
</script>

<style scoped>
.address-manage { padding: 0; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.page-title  { margin: 0; font-size: 18px; font-weight: 600; color: #1d2129; }
.address-count {
  font-size: 13px; color: #86909c;
  background: #f2f3f5; padding: 2px 8px; border-radius: 10px;
}

.address-list { display: flex; flex-direction: column; gap: 12px; min-height: 200px; }

.address-card {
  position: relative;
  padding: 18px 20px 14px;
  border: 1.5px solid #e5e6eb;
  border-radius: 10px;
  background: #fff;
  transition: all 0.2s;
}
.address-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64,158,255,.12);
}
.address-card.is-default { border-color: #67c23a; background: #f0f9eb; }

.address-badge { position: absolute; top: 12px; right: 16px; }

.address-info  { margin-bottom: 12px; }
.address-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.receiver-name  { font-size: 15px; font-weight: 600; color: #1d2129; }
.receiver-phone { font-size: 14px; color: #4e5969; }
.address-detail { font-size: 14px; color: #4e5969; line-height: 1.6; }

.address-actions {
  display: flex; align-items: center; gap: 4px;
  border-top: 1px solid #f0f0f0; padding-top: 10px;
}

/* Final direction: restrained premium address book */
.address-manage {
  min-height: 100%;
  padding: 26px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(246, 244, 239, 0.94)),
    #f6f4ef;
}

.page-header {
  margin-bottom: 18px;
  padding: 22px 24px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(23, 32, 51, 0.06);
}

.header-left {
  gap: 12px;
}

.page-title {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #172033;
  font-size: 22px;
  font-weight: 760;
  letter-spacing: 0;
}

.page-title::before {
  content: "";
  width: 34px;
  height: 1px;
  background: #b88d3e;
}

.address-count {
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 999px;
  background: #fbfcfd;
  color: #697386;
  font-weight: 650;
}

.address-list {
  gap: 14px;
}

.address-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px 24px;
  padding: 20px 22px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 30px rgba(23, 32, 51, 0.055);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.address-card:hover {
  transform: translateY(-2px);
  border-color: rgba(184, 141, 62, 0.32);
  box-shadow: 0 18px 38px rgba(23, 32, 51, 0.09);
}

.address-card.is-default {
  border-color: rgba(184, 141, 62, 0.48);
  background: linear-gradient(135deg, #ffffff, #fffaf0);
}

.address-card.is-default::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 8px 0 0 8px;
  background: #b88d3e;
}

.address-badge {
  top: 14px;
  right: 18px;
}

.address-badge :deep(.el-tag) {
  border-color: #172033;
  background: #172033;
  color: #ffffff;
}

.address-info {
  min-width: 0;
  margin-bottom: 0;
}

.address-header {
  gap: 14px;
  margin-bottom: 10px;
  padding-right: 72px;
}

.receiver-name {
  color: #172033;
  font-size: 17px;
  font-weight: 760;
}

.receiver-phone {
  color: #697386;
  font-size: 14px;
}

.address-detail {
  max-width: 680px;
  color: #4e5969;
  font-size: 14px;
  line-height: 1.75;
}

.address-actions {
  align-self: end;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 0;
  border-top: 0;
}

.address-actions :deep(.el-button.is-link) {
  height: 30px;
  padding: 0 4px;
  color: #4e5969;
  font-weight: 650;
}

.address-actions :deep(.el-button.is-link:hover) {
  color: #7a5e3d;
}

.address-actions :deep(.el-button--danger.is-link) {
  color: #b45a4f;
}

.address-manage :deep(.el-empty) {
  min-height: 320px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 30px rgba(23, 32, 51, 0.05);
}

.address-manage :deep(.el-button--primary) {
  border-color: #172033;
  background: #172033;
  box-shadow: 0 10px 22px rgba(23, 32, 51, 0.14);
}

.address-manage :deep(.el-button--primary:hover),
.address-manage :deep(.el-button--primary:focus) {
  border-color: #24314c;
  background: #24314c;
}

.address-manage :deep(.el-button:not(.el-button--primary):not(.is-link):hover),
.address-manage :deep(.el-button:not(.el-button--primary):not(.is-link):focus) {
  border-color: rgba(184, 141, 62, 0.42);
  color: #7a5e3d;
}

.address-manage :deep(.el-dialog) {
  overflow: hidden;
  border-radius: 8px;
}

.address-manage :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  background: #fbfcfd;
}

.address-manage :deep(.el-dialog__title) {
  color: #172033;
  font-weight: 760;
}

.address-manage :deep(.el-dialog__body) {
  padding: 24px 24px 10px;
}

.address-manage :deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
}

.address-manage :deep(.el-form-item__label) {
  color: #4e5969;
  font-weight: 650;
}

.address-manage :deep(.el-input__wrapper),
.address-manage :deep(.el-textarea__inner),
.address-manage :deep(.el-cascader .el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.12) inset;
}

.address-manage :deep(.el-input__wrapper.is-focus),
.address-manage :deep(.el-textarea__inner:focus),
.address-manage :deep(.el-cascader .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #172033 inset;
}

@media (max-width: 820px) {
  .address-manage {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .address-card {
    grid-template-columns: 1fr;
  }

  .address-actions {
    justify-content: flex-start;
    padding-top: 12px;
    border-top: 1px solid rgba(23, 32, 51, 0.08);
  }
}

/* Address final pass: page-local address book. */
:global(body .address-manage.address-manage.address-manage) {
  width: min(1160px, calc(100vw - 48px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
  padding: 28px 0 72px !important;
  color: #1f2933 !important;
}

:global(body .address-manage.address-manage.address-manage .page-header) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  margin-bottom: 18px !important;
  padding: 20px 22px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #fffdfa !important;
  box-shadow: 0 14px 32px rgba(21, 26, 34, 0.055) !important;
}

:global(body .address-manage.address-manage.address-manage .page-title) {
  color: #111827 !important;
  font-size: 22px !important;
  font-weight: 800 !important;
}

:global(body .address-manage.address-manage.address-manage .address-count) {
  color: #667085 !important;
}

:global(body .address-manage.address-manage.address-manage .address-list) {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 14px !important;
}

:global(body .address-manage.address-manage.address-manage .address-card) {
  position: relative !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  gap: 14px !important;
  min-height: 132px !important;
  padding: 20px !important;
  border: 1px solid rgba(21, 26, 34, 0.12) !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  box-shadow: none !important;
  transform: none !important;
}

:global(body .address-manage.address-manage.address-manage .address-card.is-default) {
  border-color: #9c6b35 !important;
  background: #fff8ec !important;
}

:global(body .address-manage.address-manage.address-manage .address-card.is-default::before) {
  content: "" !important;
  position: absolute !important;
  inset: 0 auto 0 0 !important;
  width: 3px !important;
  border-radius: 7px 0 0 7px !important;
  background: #9c6b35 !important;
}

:global(body .address-manage.address-manage.address-manage .address-header) {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 10px !important;
  padding-right: 74px !important;
}

:global(body .address-manage.address-manage.address-manage .receiver-name) {
  color: #111827 !important;
  font-size: 17px !important;
  font-weight: 800 !important;
}

:global(body .address-manage.address-manage.address-manage .receiver-phone),
:global(body .address-manage.address-manage.address-manage .address-detail) {
  color: #667085 !important;
  line-height: 1.65 !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions) {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-end !important;
  gap: 6px !important;
  align-self: end !important;
  padding-top: 0 !important;
  border-top: 0 !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions .el-button.is-link) {
  height: 30px !important;
  color: #374151 !important;
  font-weight: 650 !important;
}

:global(body .address-manage.address-manage.address-manage .el-button--primary) {
  border-color: #111827 !important;
  background: #111827 !important;
  color: #fffdfa !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog) {
  overflow: hidden !important;
  border-radius: 7px !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog__header) {
  padding: 20px 24px !important;
  border-bottom: 1px solid rgba(21, 26, 34, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .address-manage.address-manage.address-manage .el-form-item__label) {
  color: #374151 !important;
  font-weight: 700 !important;
}

:global(body .address-manage.address-manage.address-manage .el-input__wrapper),
:global(body .address-manage.address-manage.address-manage .el-textarea__inner),
:global(body .address-manage.address-manage.address-manage .el-cascader .el-input__wrapper) {
  border-radius: 5px !important;
  box-shadow: 0 0 0 1px rgba(21, 26, 34, 0.14) inset !important;
}

@media (max-width: 820px) {
  :global(body .address-manage.address-manage.address-manage) {
    width: calc(100vw - 28px) !important;
    padding: 18px 0 44px !important;
  }

  :global(body .address-manage.address-manage.address-manage .page-header) {
    align-items: flex-start !important;
    flex-direction: column !important;
  }

  :global(body .address-manage.address-manage.address-manage .address-list),
  :global(body .address-manage.address-manage.address-manage .address-card) {
    grid-template-columns: 1fr !important;
  }

  :global(body .address-manage.address-manage.address-manage .address-actions) {
    flex-direction: row !important;
    justify-content: flex-start !important;
    padding-top: 12px !important;
    border-top: 1px solid rgba(21, 26, 34, 0.1) !important;
  }
}

/* Address polish pass: calmer address book cards and less intrusive actions. */
:global(body .address-manage.address-manage.address-manage .page-header) {
  padding: 18px 22px !important;
  background: #fffdfa !important;
}

:global(body .address-manage.address-manage.address-manage .header-left) {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}

:global(body .address-manage.address-manage.address-manage .address-count) {
  display: inline-flex !important;
  align-items: center !important;
  height: 24px !important;
  padding: 0 10px !important;
  border: 1px solid rgba(21, 26, 34, 0.1) !important;
  border-radius: 999px !important;
  background: #f8f5ef !important;
  color: #667085 !important;
  font-size: 12px !important;
  font-weight: 650 !important;
}

:global(body .address-manage.address-manage.address-manage .page-header .el-button--primary) {
  height: 34px !important;
  min-width: 104px !important;
  border-radius: 4px !important;
  background: #111827 !important;
  color: #fffdfa !important;
  font-weight: 750 !important;
}

:global(body .address-manage.address-manage.address-manage .address-list) {
  align-items: stretch !important;
}

:global(body .address-manage.address-manage.address-manage .address-card) {
  display: block !important;
  min-height: 126px !important;
  padding: 18px 20px 46px !important;
  border-color: rgba(21, 26, 34, 0.12) !important;
  background: #fffdfa !important;
  box-shadow: 0 10px 24px rgba(21, 26, 34, 0.045) !important;
}

:global(body .address-manage.address-manage.address-manage .address-card.is-default) {
  border-color: rgba(156, 107, 53, 0.55) !important;
  background: #fff8ec !important;
}

:global(body .address-manage.address-manage.address-manage .address-card.is-default::before) {
  width: 4px !important;
  background: #b07a3b !important;
}

:global(body .address-manage.address-manage.address-manage .address-badge) {
  position: absolute !important;
  top: 16px !important;
  right: 18px !important;
}

:global(body .address-manage.address-manage.address-manage .address-badge .el-tag) {
  height: 22px !important;
  padding: 0 9px !important;
  border: 1px solid rgba(156, 107, 53, 0.28) !important;
  border-radius: 999px !important;
  background: #fffdfa !important;
  color: #8a5a22 !important;
  font-weight: 750 !important;
}

:global(body .address-manage.address-manage.address-manage .address-header) {
  margin-bottom: 8px !important;
  padding-right: 90px !important;
}

:global(body .address-manage.address-manage.address-manage .receiver-name) {
  font-size: 16px !important;
}

:global(body .address-manage.address-manage.address-manage .receiver-phone) {
  color: #6b7280 !important;
  font-weight: 650 !important;
}

:global(body .address-manage.address-manage.address-manage .address-detail) {
  max-width: 82% !important;
  color: #4b5563 !important;
  line-height: 1.7 !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions) {
  position: absolute !important;
  right: 18px !important;
  bottom: 14px !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 12px !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions .el-button.is-link) {
  width: auto !important;
  height: 24px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  color: #374151 !important;
  font-size: 13px !important;
  font-weight: 700 !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions .el-button.is-link:hover) {
  color: #111827 !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions .el-button--danger.is-link) {
  color: #9c4f1e !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog .el-button) {
  border-radius: 4px !important;
  font-weight: 700 !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog .el-button:not(.el-button--primary)) {
  border-color: rgba(21, 26, 34, 0.16) !important;
  background: #fffdfa !important;
  color: #374151 !important;
}

@media (max-width: 820px) {
  :global(body .address-manage.address-manage.address-manage .header-left) {
    align-items: flex-start !important;
    flex-direction: column !important;
    gap: 8px !important;
  }

  :global(body .address-manage.address-manage.address-manage .address-card) {
    min-height: 0 !important;
    padding-bottom: 58px !important;
  }

  :global(body .address-manage.address-manage.address-manage .address-detail) {
    max-width: none !important;
  }
}

/* Address readability pass: explicit contrast for cards, actions, tags and dialogs. */
:global(body .address-manage.address-manage.address-manage),
:global(body .address-manage.address-manage.address-manage .page-header),
:global(body .address-manage.address-manage.address-manage .address-card) {
  color: #111827 !important;
}

:global(body .address-manage.address-manage.address-manage .page-title),
:global(body .address-manage.address-manage.address-manage .receiver-name),
:global(body .address-manage.address-manage.address-manage .receiver-phone),
:global(body .address-manage.address-manage.address-manage .address-detail),
:global(body .address-manage.address-manage.address-manage .address-count) {
  color: #111827 !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions .el-button.is-link),
:global(body .address-manage.address-manage.address-manage .address-actions .el-button.is-link span) {
  color: #111827 !important;
}

:global(body .address-manage.address-manage.address-manage .address-actions .el-button--danger.is-link),
:global(body .address-manage.address-manage.address-manage .address-actions .el-button--danger.is-link span) {
  color: #8f3f20 !important;
}

:global(body .address-manage.address-manage.address-manage .address-badge .el-tag),
:global(body .address-manage.address-manage.address-manage .address-badge .el-tag__content) {
  color: #8a5a22 !important;
}

:global(body .address-manage.address-manage.address-manage .page-header .el-button--primary),
:global(body .address-manage.address-manage.address-manage .page-header .el-button--primary span),
:global(body .address-manage.address-manage.address-manage .el-dialog .el-button--primary),
:global(body .address-manage.address-manage.address-manage .el-dialog .el-button--primary span) {
  color: #fffdfa !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog),
:global(body .address-manage.address-manage.address-manage .el-dialog__title),
:global(body .address-manage.address-manage.address-manage .el-form-item__label),
:global(body .address-manage.address-manage.address-manage .el-input__inner),
:global(body .address-manage.address-manage.address-manage .el-textarea__inner),
:global(body .address-manage.address-manage.address-manage .el-dialog .el-button:not(.el-button--primary) span) {
  color: #111827 !important;
}

/* Address dialog polish: cleaner spacing and readable validation. */
:global(body .address-manage.address-manage.address-manage .el-dialog) {
  width: min(560px, calc(100vw - 32px)) !important;
  border-radius: 6px !important;
  background: #fffdfa !important;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.18) !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog__header) {
  padding: 22px 28px !important;
  border-bottom: 1px solid rgba(17, 24, 39, 0.1) !important;
  background: #f8f5ef !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog__title) {
  font-size: 18px !important;
  font-weight: 800 !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog__body) {
  padding: 24px 28px 8px !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog__footer) {
  padding: 14px 28px 28px !important;
}

:global(body .address-manage.address-manage.address-manage .el-form-item) {
  align-items: flex-start !important;
  margin-bottom: 22px !important;
}

:global(body .address-manage.address-manage.address-manage .el-form-item__label) {
  height: 36px !important;
  line-height: 36px !important;
  color: #111827 !important;
  font-weight: 760 !important;
}

:global(body .address-manage.address-manage.address-manage .el-form-item__content) {
  min-height: 36px !important;
}

:global(body .address-manage.address-manage.address-manage .region-row) {
  display: flex !important;
  align-items: flex-start !important;
  gap: 10px !important;
  width: 100% !important;
}

:global(body .address-manage.address-manage.address-manage .region-row .el-cascader) {
  flex: 1 1 auto !important;
  min-width: 0 !important;
}

:global(body .address-manage.address-manage.address-manage .region-row .el-button) {
  flex: 0 0 auto !important;
  height: 36px !important;
  min-width: 78px !important;
}

:global(body .address-manage.address-manage.address-manage .el-input__wrapper),
:global(body .address-manage.address-manage.address-manage .el-cascader .el-input__wrapper) {
  min-height: 36px !important;
}

:global(body .address-manage.address-manage.address-manage .el-textarea__inner) {
  min-height: 86px !important;
  padding: 10px 12px !important;
  color: #111827 !important;
}

:global(body .address-manage.address-manage.address-manage .el-form-item__error) {
  position: static !important;
  padding-top: 6px !important;
  color: #9c4f1e !important;
  font-size: 12px !important;
  line-height: 1.35 !important;
}

:global(body .address-manage.address-manage.address-manage .el-switch__label) {
  color: #374151 !important;
  font-weight: 650 !important;
}

:global(body .address-manage.address-manage.address-manage .el-dialog__footer .el-button) {
  min-width: 86px !important;
  height: 36px !important;
}

@media (max-width: 620px) {
  :global(body .address-manage.address-manage.address-manage .region-row) {
    flex-direction: column !important;
  }

  :global(body .address-manage.address-manage.address-manage .region-row .el-button) {
    width: 100% !important;
  }
}
</style>
