<template>
  <div class="spot-manage">

    <!-- ========== 搜索 + 操作工具栏 ========== -->
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <!-- 关键词搜索 -->
          <el-input
              v-model="searchForm.keyword"
              placeholder="搜索观测点名称"
              clearable
              style="width: 200px;"
              @keyup.enter="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <!-- 省份筛选 -->
          <el-input
              v-model="searchForm.province"
              placeholder="省份"
              clearable
              style="width: 120px; margin-left: 8px;"
          />

          <!-- 城市筛选 -->
          <el-input
              v-model="searchForm.city"
              placeholder="城市"
              clearable
              style="width: 120px; margin-left: 8px;"
          />

          <el-button type="primary" @click="handleSearch" style="margin-left: 8px;">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>

        <el-button type="primary" @click="openSpotDialog()">
          <el-icon><Plus /></el-icon> 新增观测点
        </el-button>
      </div>

      <!-- ========== 观测点表格 ========== -->
      <el-table
          v-loading="loading"
          :data="spotList"
          row-key="id"
          style="width: 100%; margin-top: 16px;"
          stripe
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="spotName" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="省/市" width="140">
          <template #default="{ row }">
            {{ row.province || '-' }} / {{ row.city || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="altitude" label="海拔(m)" width="90" align="center">
          <template #default="{ row }">{{ row.altitude || 0 }}</template>
        </el-table-column>
        <el-table-column label="Bortle" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getBortleType(row.lightPollutionLevel)" size="small">
              {{ row.lightPollutionLevel || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.ratingCount > 0">⭐ {{ Number(row.rating).toFixed(1) }} ({{ row.ratingCount }})</span>
            <span v-else style="color: #999;">暂无</span>
          </template>
        </el-table-column>
        <el-table-column prop="checkinCount" label="签到数" width="80" align="center">
          <template #default="{ row }">{{ row.checkinCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="坐标" width="200">
          <template #default="{ row }">
            <span style="font-size: 12px; color: #999;">
              {{ Number(row.longitude).toFixed(4) }}, {{ Number(row.latitude).toFixed(4) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openSpotDialog(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="openStatsDialog(row)">统计</el-button>
            <el-popconfirm
                title="确定删除该观测点吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadSpots"
            @current-change="loadSpots"
        />
      </div>
    </el-card>

    <!-- ========== 新增/编辑弹窗 ========== -->
    <el-dialog
        v-model="spotDialogVisible"
        :title="isEdit ? '编辑观测点' : '新增观测点'"
        width="900px"
        destroy-on-close
        @open="initMap"
    >
      <div class="spot-dialog-body">
        <!-- 左侧表单 -->
        <div class="form-side">
          <el-form :model="spotForm" :rules="spotRules" ref="spotFormRef" label-width="100px" size="default">
            <el-form-item label="名称" prop="spotName">
              <el-input v-model="spotForm.spotName" placeholder="观测点名称" />
            </el-form-item>
            <el-form-item label="省份" prop="province">
              <el-input v-model="spotForm.province" placeholder="省份" />
            </el-form-item>
            <el-form-item label="城市" prop="city">
              <el-input v-model="spotForm.city" placeholder="城市" />
            </el-form-item>
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="spotForm.address" placeholder="详细地址" />
            </el-form-item>
            <el-form-item label="经度" prop="longitude">
              <el-input-number v-model="spotForm.longitude" :precision="7" :step="0.001" :min="-180" :max="180" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="spotForm.latitude" :precision="7" :step="0.001" :min="-90" :max="90" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="海拔(m)">
              <el-input-number v-model="spotForm.altitude" :min="0" :max="9000" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="Bortle等级">
              <el-slider v-model="spotForm.lightPollutionLevel" :min="1" :max="9" :marks="bortleMarks" show-stops />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="spotForm.description" type="textarea" :rows="3" placeholder="观测点描述（推荐设备/最佳季节等）" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 右侧地图坐标拾取 -->
        <div class="map-side">
          <div class="map-tip">点击地图拾取坐标，自动填入经纬度</div>
          <div id="spot-map-container" class="map-container"></div>
        </div>
      </div>

      <template #footer>
        <el-button @click="spotDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitSpot">
          {{ isEdit ? '保存修改' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 签到统计弹窗 ========== -->
    <el-dialog
        v-model="statsDialogVisible"
        :title="`签到统计 - ${statsSpotName}`"
        width="500px"
        destroy-on-close
    >
      <div v-loading="statsLoading" class="stats-body">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-statistic title="总签到次数" :value="statsData.totalCount || 0" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="近7日" :value="statsData.last7Days || 0" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="近30日" :value="statsData.last30Days || 0" />
          </el-col>
        </el-row>

        <!-- TOP5 签到用户 -->
        <div class="top-users" v-if="statsData.topUsers && statsData.topUsers.length > 0">
          <h4 style="margin: 20px 0 10px;">TOP5 签到用户</h4>
          <el-table :data="statsData.topUsers" size="small" stripe>
            <el-table-column label="排名" width="60" align="center">
              <template #default="{ $index }">
                <span :class="['rank-badge', $index < 3 ? 'rank-top' : '']">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="userId" label="用户ID" />
            <el-table-column prop="checkinCount" label="签到次数" align="center" />
          </el-table>
        </div>
        <el-empty v-else-if="!statsLoading" description="暂无签到数据" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { getAdminSpotList, addSpot, updateSpot, deleteSpot, getSpotStats } from '@/api/admin/location'

// ==================== 列表相关 ====================

const loading = ref(false)
const spotList = ref([])
const searchForm = reactive({ keyword: '', province: '', city: '' })
const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

/** 加载观测点列表 */
const loadSpots = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    // 清除空值参数
    Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k] })
    const res = await getAdminSpotList(params)
    spotList.value = res.data?.records || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error('加载观测点列表失败', e)
  } finally {
    loading.value = false
  }
}

/** 搜索 */
const handleSearch = () => {
  pagination.pageNum = 1
  loadSpots()
}

/** 重置搜索条件 */
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.province = ''
  searchForm.city = ''
  pagination.pageNum = 1
  loadSpots()
}

/** Bortle等级颜色：1-3绿色(暗天)，4-5蓝色(郊区)，6-7黄色(亮)，8-9红色(城市) */
const getBortleType = (level) => {
  if (!level) return 'info'
  if (level <= 3) return 'success'
  if (level <= 5) return 'primary'
  if (level <= 7) return 'warning'
  return 'danger'
}

/** 删除观测点 */
const handleDelete = async (id) => {
  try {
    await deleteSpot(id)
    ElMessage.success('删除成功')
    loadSpots()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// ==================== 新增/编辑弹窗 ====================

const spotDialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const spotFormRef = ref(null)

// Bortle等级滑块标记
const bortleMarks = { 1: '1', 3: '3', 5: '5', 7: '7', 9: '9' }

const spotForm = reactive({
  spotName: '',
  longitude: null,
  latitude: null,
  province: '',
  city: '',
  address: '',
  altitude: 0,
  lightPollutionLevel: 5,
  description: '',
  images: ''
})

const spotRules = {
  spotName: [{ required: true, message: '请输入观测点名称', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入或点击地图选择经度', trigger: 'change' }],
  latitude: [{ required: true, message: '请输入或点击地图选择纬度', trigger: 'change' }]
}

// 地图实例和标记
let mapInstance = null
let mapMarker = null

/** 打开新增/编辑弹窗 */
const openSpotDialog = (row) => {
  if (row) {
    // 编辑模式：回填数据
    isEdit.value = true
    editingId.value = row.id
    spotForm.spotName = row.spotName
    spotForm.longitude = Number(row.longitude)
    spotForm.latitude = Number(row.latitude)
    spotForm.province = row.province || ''
    spotForm.city = row.city || ''
    spotForm.address = row.address || ''
    spotForm.altitude = row.altitude || 0
    spotForm.lightPollutionLevel = row.lightPollutionLevel || 5
    spotForm.description = row.description || ''
    spotForm.images = row.images || ''
  } else {
    // 新增模式：清空
    isEdit.value = false
    editingId.value = null
    spotForm.spotName = ''
    spotForm.longitude = null
    spotForm.latitude = null
    spotForm.province = ''
    spotForm.city = ''
    spotForm.address = ''
    spotForm.altitude = 0
    spotForm.lightPollutionLevel = 5
    spotForm.description = ''
    spotForm.images = ''
  }
  spotDialogVisible.value = true
}

/** 弹窗打开后初始化高德地图（坐标拾取） */
const initMap = () => {
  nextTick(() => {
    // 等待 DOM 就绪
    setTimeout(() => {
      const AMap = window.AMap
      if (!AMap) {
        console.warn('AMap 未加载')
        return
      }

      // 初始中心点：编辑模式用已有坐标，新增默认北京天安门
      const center = (spotForm.longitude && spotForm.latitude)
          ? [spotForm.longitude, spotForm.latitude]
          : [116.397428, 39.90923]

      // 创建地图实例
      mapInstance = new AMap.Map('spot-map-container', {
        zoom: 10,
        center: center,
        mapStyle: 'amap://styles/dark'    // 暗色主题与后台风格一致
      })

      // 已有坐标时放置标记
      if (spotForm.longitude && spotForm.latitude) {
        mapMarker = new AMap.Marker({ position: center })
        mapInstance.add(mapMarker)
      }

      // 点击地图拾取坐标
      mapInstance.on('click', (e) => {
        const lng = e.lnglat.getLng()
        const lat = e.lnglat.getLat()

        // 更新表单经纬度
        spotForm.longitude = Number(lng.toFixed(7))
        spotForm.latitude = Number(lat.toFixed(7))

        // 更新/创建标记
        if (mapMarker) {
          mapMarker.setPosition([lng, lat])
        } else {
          mapMarker = new AMap.Marker({ position: [lng, lat] })
          mapInstance.add(mapMarker)
        }

        // 逆地理编码自动填充省市区地址
        const geocoder = new AMap.Geocoder({ radius: 1000 })
        geocoder.getAddress([lng, lat], (status, result) => {
          if (status === 'complete' && result.regeocode) {
            const addr = result.regeocode.addressComponent
            spotForm.province = addr.province || ''
            spotForm.city = addr.city || ''
            spotForm.address = result.regeocode.formattedAddress || ''
          }
        })
      })
    }, 300)
  })
}

/** 提交新增/编辑 */
const handleSubmitSpot = async () => {
  try {
    await spotFormRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const data = { ...spotForm }
    if (isEdit.value) {
      await updateSpot(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await addSpot(data)
      ElMessage.success('新增成功')
    }
    spotDialogVisible.value = false
    loadSpots()
  } catch (e) {
    ElMessage.error(isEdit.value ? '更新失败' : '新增失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 签到统计弹窗 ====================

const statsDialogVisible = ref(false)
const statsLoading = ref(false)
const statsSpotName = ref('')
const statsData = ref({})

/** 打开签到统计弹窗 */
const openStatsDialog = async (row) => {
  statsSpotName.value = row.spotName
  statsDialogVisible.value = true
  statsLoading.value = true
  try {
    const res = await getSpotStats(row.id)
    statsData.value = res.data || {}
  } catch (e) {
    ElMessage.error('获取统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

// ==================== 初始加载 ====================
loadSpots()
</script>

<style scoped>
.spot-manage {
  padding: 0;
}

/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

/* ===== 分页 ===== */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ===== 新增/编辑弹窗布局 ===== */
.spot-dialog-body {
  display: flex;
  gap: 20px;
}
.form-side {
  flex: 1;
  min-width: 360px;
}
.map-side {
  width: 380px;
  display: flex;
  flex-direction: column;
}
.map-tip {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}
.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
}

/* ===== 签到统计 ===== */
.stats-body {
  min-height: 120px;
}
.top-users h4 {
  font-size: 14px;
  color: #303133;
}
.rank-badge {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  background: #f0f0f0;
  color: #666;
}
.rank-top {
  background: linear-gradient(135deg, #f6d365, #fda085);
  color: #fff;
  font-weight: bold;
}
</style>
