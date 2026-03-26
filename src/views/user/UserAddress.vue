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
          <div style="display: flex; gap: 8px; width: 100%;">
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
              📍 定位
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
              active-text="设为默认地址"
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
</style>