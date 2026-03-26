<template>
  <div class="obs-page">

    <!-- ══════════════════════════════════════════
         顶部导航栏
         ══════════════════════════════════════════ -->
    <header class="obs-header">
      <div class="obs-header-inner">
        <div class="header-left">
          <el-button text @click="router.push('/home')" class="back-btn">
            <el-icon><ArrowLeft /></el-icon> 返回首页
          </el-button>
          <div class="header-divider"></div>
          <span class="header-title">🔭 天文观测点</span>
        </div>

        <div class="header-right">
          <div class="location-badge" :class="locationBadgeClass">
            <el-icon v-if="locating" class="spin"><Loading /></el-icon>
            <el-icon v-else-if="locationError"><WarnTriangleFilled /></el-icon>
            <el-icon v-else><Location /></el-icon>
            <span>{{ locationStatusText }}</span>
          </div>
          <el-segmented
              v-model="viewMode"
              :options="[{ label: '🗺 地图', value: 'map' }, { label: '📋 列表', value: 'list' }]"
              size="small"
          />
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════
         筛选栏
         ══════════════════════════════════════════ -->
    <div class="filter-bar">
      <div class="filter-inner">
        <el-select
            v-model="filter.province" placeholder="省份" clearable size="small"
            class="filter-select" @change="onProvinceChange"
        >
          <el-option v-for="p in provinceList" :key="p.value" :label="p.label" :value="p.label" />
        </el-select>

        <el-select
            v-model="filter.city" placeholder="城市" clearable size="small"
            class="filter-select" :disabled="!filter.province" @change="onCityChange"
        >
          <el-option v-for="c in cityList" :key="c.value" :label="c.label" :value="c.label" />
        </el-select>

        <el-select v-model="filter.radius" size="small" class="filter-select-sm" @change="loadSpots">
          <el-option label="50km" :value="50" />
          <el-option label="100km" :value="100" />
          <el-option label="200km" :value="200" />
          <el-option label="500km" :value="500" />
        </el-select>

        <div class="bortle-wrap">
          <span class="bortle-label">暗天 ≤</span>
          <el-slider v-model="filter.maxBortle" :min="1" :max="9" :step="1"
                     show-stops size="small" style="width:130px" @change="loadSpots" />
          <el-tag :type="bortleTagType" size="small" effect="dark" round>
            B{{ filter.maxBortle }} {{ bortleLevelShort }}
          </el-tag>
        </div>

        <el-button size="small" plain @click="resetFilter">重置</el-button>
      </div>

      <div v-if="locationError" class="fallback-tip">
        <el-icon><InfoFilled /></el-icon>
        定位被拒绝，请选择省市作为搜索中心
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         今晚观测条件卡片（6.2）
         ══════════════════════════════════════════ -->
    <div class="tonight-bar" v-if="tonightData || tonightLoading">
      <div class="tonight-inner">
        <!-- 加载态 -->
        <div v-if="tonightLoading" class="tonight-loading">
          <el-icon class="spin"><Loading /></el-icon>
          <span>正在获取今晚观测条件…</span>
        </div>

        <!-- 数据展示 -->
        <template v-else-if="tonightData">
          <!-- 综合评分星级 -->
          <div class="tonight-score">
            <div class="tonight-stars">
              <span v-for="i in starsArray(tonightData.overallStars)" :key="i" class="star-icon">★</span>
              <span v-for="i in starsArray(5 - tonightData.overallStars)" :key="'e'+i" class="star-icon star-empty">★</span>
            </div>
            <span class="tonight-score-num">{{ tonightData.overallScore }}分</span>
          </div>

          <!-- 天气适宜度 -->
          <div class="tonight-item">
            <span class="tonight-label">天气</span>
            <span class="tonight-val">{{ tonightData.weatherSuitability }}分</span>
          </div>

          <!-- 月相信息 -->
          <div class="tonight-item">
            <span class="tonight-label">月相</span>
            <span class="tonight-val">{{ tonightData.moonPhaseName }}（{{ tonightData.moonIllumination }}%）</span>
          </div>

          <!-- 建议文字 -->
          <div class="tonight-suggestion">
            {{ tonightData.suggestion }}
          </div>
        </template>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         主体
         ══════════════════════════════════════════ -->
    <div class="obs-body">
      <!-- 地图 -->
      <div v-show="viewMode === 'map'" id="amap-container" class="map-box" ref="mapContainerRef"></div>

      <!-- 列表面板 -->
      <div class="list-panel" :class="{ 'list-full': viewMode === 'list' }">
        <div class="list-header">
          <span class="list-count" v-if="!loading">
            共 <strong>{{ spots.length }}</strong> 个观测点
          </span>
          <span class="list-count" v-else>加载中…</span>
          <span class="list-sort-tip">按距离排序</span>
        </div>

        <div v-if="loading" class="skeleton-wrap">
          <el-skeleton v-for="i in 5" :key="i" :rows="2" animated class="skeleton-item" />
        </div>

        <el-empty v-else-if="spots.length === 0" description="暂无观测点，试试扩大范围" class="empty-state">
          <template #image><div class="empty-icon">🌌</div></template>
        </el-empty>

        <div v-else class="card-list">
          <div
              v-for="spot in spots" :key="spot.id"
              class="spot-card" :class="{ 'spot-card--active': selectedSpotId === spot.id }"
              @click="onCardClick(spot)"
          >
            <div class="card-thumb">
              <el-image :src="spot.mainImage || defaultImg" fit="cover" lazy class="thumb-img">
                <template #error><div class="thumb-err">🔭</div></template>
              </el-image>
              <div class="bortle-badge" :class="bortleBadgeClass(spot.bortleLevel)">B{{ spot.bortleLevel }}</div>
            </div>

            <div class="card-body">
              <div class="card-name">{{ spot.name }}</div>
              <div class="card-sub">{{ spot.province }} · {{ spot.city }}</div>
              <div class="card-tags">
                <span class="tag-distance">📍 {{ spot.distance }} km</span>
                <span class="tag-alt" v-if="spot.altitude">🏔 {{ spot.altitude }}m</span>
              </div>
              <div class="card-rating-row">
                <el-rate :model-value="spot.rating ? parseFloat(spot.rating) : 0"
                         disabled allow-half :max="5" :colors="['#f7ba2a','#f7ba2a','#f7ba2a']"
                         style="--el-rate-icon-size:14px" />
                <span class="rating-val">{{ spot.rating ? parseFloat(spot.rating).toFixed(1) : '暂无' }}</span>
                <span class="rating-cnt" v-if="spot.ratingCount">({{ spot.ratingCount }})</span>
              </div>
            </div>

            <div v-if="spot.myScore" class="my-score-badge">⭐ {{ spot.myScore }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6.3 签到区块已移入详情弹窗内 -->

    <!-- ══════════════════════════════════════════
         详情弹窗
         ══════════════════════════════════════════ -->
    <el-dialog v-model="dialogVisible" :title="detailSpot?.name || '观测点详情'"
               width="580px" top="5vh" class="detail-dialog" @close="onDialogClose" destroy-on-close>

      <el-skeleton v-if="detailLoading" :rows="5" animated />

      <div v-else-if="detailSpot" class="dialog-body">

        <!-- 图片 -->
        <el-carousel v-if="detailSpot.images?.length" height="150px" :autoplay="false" class="detail-carousel">
          <el-carousel-item v-for="img in detailSpot.images" :key="img">
            <el-image :src="img" fit="cover" style="width:100%;height:150px" />
          </el-carousel-item>
        </el-carousel>

        <!-- 四格指标 -->
        <div class="metric-row">
          <div class="metric-cell">
            <div class="metric-label">暗天等级</div>
            <div class="metric-main">
              <span class="bortle-pill" :class="bortleBadgeClass(detailSpot.bortleLevel)">
                B{{ detailSpot.bortleLevel }}
              </span>
            </div>
            <div class="metric-sub">{{ bortleLevelDesc(detailSpot.bortleLevel) }}</div>
          </div>
          <div class="metric-cell">
            <div class="metric-label">综合评分</div>
            <div class="metric-main score-big">
              {{ detailSpot.rating ? parseFloat(detailSpot.rating).toFixed(1) : '—' }}
            </div>
            <div class="metric-sub">{{ detailSpot.ratingCount ? detailSpot.ratingCount + ' 人评分' : '暂无评分' }}</div>
          </div>
          <div class="metric-cell">
            <div class="metric-label">海拔</div>
            <div class="metric-main score-big">{{ detailSpot.altitude || '—' }}</div>
            <div class="metric-sub">{{ detailSpot.altitude ? '米' : '' }}</div>
          </div>
          <div class="metric-cell">
            <div class="metric-label">今日签到</div>
            <div class="metric-main score-big">{{ detailSpot.todayCheckinCount || 0 }}</div>
            <div class="metric-sub">累计 {{ detailSpot.totalCheckinCount || 0 }} 次</div>
          </div>
        </div>

        <!-- 位置 -->
        <div class="detail-section">
          <div class="section-key">位置</div>
          <div class="section-val">{{ detailSpot.province }} {{ detailSpot.city }} · {{ detailSpot.address }}</div>
        </div>

        <!-- 介绍 -->
        <div v-if="detailSpot.fullDescription || detailSpot.description" class="detail-section">
          <div class="section-key">观测点介绍</div>
          <div class="section-val desc-text">{{ detailSpot.fullDescription || detailSpot.description }}</div>
        </div>

        <!-- 天气（懒加载，6.2）-->
        <div class="weather-panel">
          <div class="weather-panel-title">当前天气</div>
          <div v-if="spotWeatherLoading" class="weather-loading">
            <el-icon class="spin"><Loading /></el-icon> 加载天气中…
          </div>
          <div v-else-if="spotWeather" class="weather-grid">
            <div class="weather-cell">
              <span class="weather-icon">🌤</span>
              <span class="weather-info">{{ spotWeather.condition }}</span>
            </div>
            <div class="weather-cell">
              <span class="weather-icon">🌡</span>
              <span class="weather-info">{{ spotWeather.temperature }}°C</span>
            </div>
            <div class="weather-cell">
              <span class="weather-icon">💧</span>
              <span class="weather-info">{{ spotWeather.humidity }}%</span>
            </div>
            <div class="weather-cell">
              <span class="weather-icon">🌬</span>
              <span class="weather-info">{{ spotWeather.windDirection }} {{ spotWeather.windLevel }}级</span>
            </div>
            <div class="weather-suitability">
              <span class="suit-label">观测适宜度</span>
              <span class="suit-badge" :style="{ background: spotWeather.suitabilityColor, color: '#fff' }">
                {{ spotWeather.suitabilityLevel }} {{ spotWeather.suitabilityScore }}分
              </span>
            </div>
          </div>
          <div v-else class="weather-empty">暂无天气数据</div>
        </div>

        <!-- 签到（6.3）-->
        <div class="checkin-panel">
          <div v-if="!isLoggedIn" class="checkin-unauth">
            <router-link to="/login" class="login-link">登录</router-link> 后可签到打卡
          </div>
          <div v-else-if="checkinDone" class="checkin-done">
            <span class="checkin-done-icon">✅</span>
            <div class="checkin-done-info">
              <div class="checkin-done-title">今日已签到</div>
              <div class="checkin-done-meta">
                <span v-if="checkinResult.weather">{{ checkinResult.weather }}</span>
                <span v-if="checkinResult.moonPhaseName"> · {{ checkinResult.moonPhaseName }}</span>
                <span v-if="checkinResult.todayCheckinCount"> · 今日第 {{ checkinResult.todayCheckinCount }} 人</span>
              </div>
            </div>
          </div>
          <div v-else class="checkin-action">
            <el-button type="success" :loading="checkinSubmitting" @click="doCheckin" round>
              📍 签到打卡
            </el-button>
            <span class="checkin-tip">需在观测点 5km 范围内</span>
          </div>
        </div>

        <!-- 评分 -->
        <div class="rating-panel">
          <div class="rating-panel-title">评分</div>
          <div v-if="!isLoggedIn" class="rating-unauth">
            <router-link to="/login" class="login-link">登录</router-link> 后可提交评分
          </div>
          <!-- 已评分 + 非编辑模式：展示已评信息 + 修改按钮 -->
          <div v-else-if="detailSpot.myScore && !ratingEditing" class="rating-done-row">
            <el-rate :model-value="detailSpot.myScore" disabled :max="5"
                     :colors="['#f7ba2a','#f7ba2a','#f7ba2a']" />
            <span class="done-label">您已评 {{ detailSpot.myScore }} 星 · 感谢评价</span>
            <el-button type="primary" link size="small" @click="startEditRating" class="edit-rating-btn">
              修改
            </el-button>
          </div>
          <!-- 未评分 或 编辑模式：输入评分 -->
          <div v-else class="rating-input-row">
            <el-rate v-model="ratingInput" :max="5"
                     :texts="['很差','较差','一般','不错','非常好']" show-text
                     :colors="['#f7ba2a','#f7ba2a','#f7ba2a']" />
            <el-button type="primary" size="small" :loading="ratingSubmitting"
                       :disabled="!ratingInput" @click="doSubmitRating" style="margin-left:10px">
              {{ ratingEditing ? '更新' : '提交' }}
            </el-button>
            <el-button v-if="ratingEditing" size="small" @click="cancelEditRating">取消</el-button>
          </div>
        </div>

      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Location, Loading, WarnTriangleFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getNearbySpots, getSpotDetail, submitRating as apiSubmitRating, getWeather, getTonightCondition, checkin as apiCheckin } from '@/api/location.js'
import { regionOptions } from '@/utils/regionData'

const router = useRouter()
const userStore = useUserStore()
const isLoggedIn = computed(() => !!userStore.userInfo?.id)

// ── 定位 ──
const locating      = ref(true)
const locationError = ref(false)
const userLng       = ref(null)
const userLat       = ref(null)

// ── 筛选 ──
const filter = ref({ province: '', city: '', radius: 100, maxBortle: 9 })

const provinceList = computed(() => regionOptions || [])
const cityList = computed(() => {
  if (!filter.value.province) return []
  const p = regionOptions.find(p => p.label === filter.value.province)
  return p?.children || []
})

const CITY_COORDS = {
  // 直辖市
  '北京':  [116.4074, 39.9042], '北京市':  [116.4074, 39.9042],
  '上海':  [121.4737, 31.2304], '上海市':  [121.4737, 31.2304],
  '天津':  [117.1900, 39.1256], '天津市':  [117.1900, 39.1256],
  '重庆':  [106.5516, 29.5630], '重庆市':  [106.5516, 29.5630],
  // 省会
  '广州':  [113.2644, 23.1291], '广州市':  [113.2644, 23.1291],
  '深圳':  [114.0579, 22.5431], '深圳市':  [114.0579, 22.5431],
  '成都':  [104.0668, 30.5728], '成都市':  [104.0668, 30.5728],
  '杭州':  [120.1536, 30.2741], '杭州市':  [120.1536, 30.2741],
  '武汉':  [114.3054, 30.5931], '武汉市':  [114.3054, 30.5931],
  '西安':  [108.9402, 34.3416], '西安市':  [108.9402, 34.3416],
  '南京':  [118.7969, 32.0603], '南京市':  [118.7969, 32.0603],
  '哈尔滨':[126.5350, 45.8038], '哈尔滨市':[126.5350, 45.8038],
  '长春':  [125.3245, 43.8868], '长春市':  [125.3245, 43.8868],
  '沈阳':  [123.4291, 41.7968], '沈阳市':  [123.4291, 41.7968],
  '济南':  [117.1209, 36.6512], '济南市':  [117.1209, 36.6512],
  '郑州':  [113.6254, 34.7466], '郑州市':  [113.6254, 34.7466],
  '合肥':  [117.2272, 31.8206], '合肥市':  [117.2272, 31.8206],
  '福州':  [119.3062, 26.0753], '福州市':  [119.3062, 26.0753],
  '南昌':  [115.8581, 28.6820], '南昌市':  [115.8581, 28.6820],
  '长沙':  [112.9388, 28.2278], '长沙市':  [112.9388, 28.2278],
  '海口':  [110.3312, 20.0319], '海口市':  [110.3312, 20.0319],
  '南宁':  [108.3665, 22.8170], '南宁市':  [108.3665, 22.8170],
  '太原':  [112.5489, 37.8570], '太原市':  [112.5489, 37.8570],
  '石家庄':[114.5149, 38.0428], '石家庄市':[114.5149, 38.0428],
  '银川':  [106.2309, 38.4872], '银川市':  [106.2309, 38.4872],
  '呼和浩特':[111.7520,40.8415],'呼和浩特市':[111.7520,40.8415],
  '乌鲁木齐':[87.6168, 43.8256],'乌鲁木齐市':[87.6168, 43.8256],
  '昆明':  [102.8329, 24.8801], '昆明市':  [102.8329, 24.8801],
  '贵阳':  [106.6302, 26.6470], '贵阳市':  [106.6302, 26.6470],
  '兰州':  [103.8343, 36.0611], '兰州市':  [103.8343, 36.0611],
  '西宁':  [101.7782, 36.6171], '西宁市':  [101.7782, 36.6171],
  '拉萨':  [91.1722,  29.6525], '拉萨市':  [91.1722,  29.6525],
  // 常用非省会城市
  '宁波':  [121.5440, 29.8683], '宁波市':  [121.5440, 29.8683],
  '嘉兴':  [120.7505, 30.7538], '嘉兴市':  [120.7505, 30.7538],
  '温州':  [120.6724, 28.0000], '温州市':  [120.6724, 28.0000],
  '苏州':  [120.5853, 31.2990], '苏州市':  [120.5853, 31.2990],
  '青岛':  [120.3826, 36.0671], '青岛市':  [120.3826, 36.0671],
  '厦门':  [118.0894, 24.4798], '厦门市':  [118.0894, 24.4798],
  '大连':  [121.6147, 38.9140], '大连市':  [121.6147, 38.9140],
  '三沙':  [112.3340, 16.8310], '三沙市':  [112.3340, 16.8310],
  // 省份中心坐标（选了省但没选市时的兜底）
  '广东':  [113.2644, 23.1291], '广东省':  [113.2644, 23.1291],
  '浙江':  [120.1536, 30.2741], '浙江省':  [120.1536, 30.2741],
  '江苏':  [118.7969, 32.0603], '江苏省':  [118.7969, 32.0603],
  '山东':  [117.1209, 36.6512], '山东省':  [117.1209, 36.6512],
  '河南':  [113.6254, 34.7466], '河南省':  [113.6254, 34.7466],
  '湖北':  [114.3054, 30.5931], '湖北省':  [114.3054, 30.5931],
  '湖南':  [112.9388, 28.2278], '湖南省':  [112.9388, 28.2278],
  '四川':  [104.0668, 30.5728], '四川省':  [104.0668, 30.5728],
  '福建':  [119.3062, 26.0753], '福建省':  [119.3062, 26.0753],
  '安徽':  [117.2272, 31.8206], '安徽省':  [117.2272, 31.8206],
  '江西':  [115.8581, 28.6820], '江西省':  [115.8581, 28.6820],
  '陕西':  [108.9402, 34.3416], '陕西省':  [108.9402, 34.3416],
  '云南':  [102.8329, 24.8801], '云南省':  [102.8329, 24.8801],
  '贵州':  [106.6302, 26.6470], '贵州省':  [106.6302, 26.6470],
  '甘肃':  [103.8343, 36.0611], '甘肃省':  [103.8343, 36.0611],
  '河北':  [114.5149, 38.0428], '河北省':  [114.5149, 38.0428],
  '黑龙江':[126.5350, 45.8038], '黑龙江省':[126.5350, 45.8038],
  '吉林':  [125.3245, 43.8868], '吉林省':  [125.3245, 43.8868],
  '辽宁':  [123.4291, 41.7968], '辽宁省':  [123.4291, 41.7968],
  '山西':  [112.5489, 37.8570], '山西省':  [112.5489, 37.8570],
  '广西':  [108.3665, 22.8170], '广西壮族自治区': [108.3665, 22.8170],
  '海南':  [110.3312, 20.0319], '海南省':  [110.3312, 20.0319],
  '新疆':  [87.6168,  43.8256], '新疆维吾尔自治区': [87.6168, 43.8256],
  '西藏':  [91.1722,  29.6525], '西藏自治区': [91.1722, 29.6525],
  '内蒙古':[111.7520, 40.8415], '内蒙古自治区': [111.7520, 40.8415],
  '宁夏':  [106.2309, 38.4872], '宁夏回族自治区': [106.2309, 38.4872],
  '青海':  [101.7782, 36.6171], '青海省':  [101.7782, 36.6171],
}

// ── 数据 ──
const spots          = ref([])
const loading        = ref(false)
const selectedSpotId = ref(null)
const viewMode       = ref('map')
const defaultImg     = 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=400'

// ── 地图 ──
const mapContainerRef = ref(null)
let mapInstance = null
let markers = []

// ── 天气 & 今晚条件（6.2）──
const tonightData      = ref(null)       // TonightVO
const tonightLoading   = ref(false)
const tonightError     = ref(false)
const spotWeather      = ref(null)       // 详情弹窗中的 WeatherVO（按需懒加载）
const spotWeatherLoading = ref(false)

// ── 签到（6.3）── 使用 localStorage 持久化当天签到状态
const checkinSubmitting = ref(false)
const checkinDone       = ref(false)
const checkinResult     = ref({})   // { todayCheckinCount, weather, moonPhaseName }

// 签到缓存 key: checkin_{spotId}_{yyyy-MM-dd}
function getCheckinCacheKey(spotId) {
  const d = new Date()
  const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return `checkin_${spotId}_${ds}`
}
function saveCheckinCache(spotId, data) {
  try { localStorage.setItem(getCheckinCacheKey(spotId), JSON.stringify(data)) } catch {}
}
function loadCheckinCache(spotId) {
  try {
    const raw = localStorage.getItem(getCheckinCacheKey(spotId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
// 清理过期缓存（非今天的 checkin_ 开头的 key）
function cleanExpiredCheckinCache() {
  try {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith('checkin_') && !key.endsWith(today)) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}

// ── 弹窗 ──
const dialogVisible    = ref(false)
const detailLoading    = ref(false)
const detailSpot       = ref(null)
const ratingInput      = ref(0)
const ratingSubmitting = ref(false)
const ratingEditing    = ref(false)   // 是否处于修改评分模式

// ── 计算 ──
const locationStatusText = computed(() => {
  if (locating.value) return '定位中…'
  if (locationError.value) return '定位失败'
  return `${userLng.value?.toFixed(2)}, ${userLat.value?.toFixed(2)}`
})
const locationBadgeClass = computed(() => ({
  'badge--loading': locating.value,
  'badge--error':   locationError.value,
  'badge--ok':      !locating.value && !locationError.value,
}))
const bortleTagType = computed(() => {
  const v = filter.value.maxBortle
  if (v <= 3) return 'success'
  if (v <= 6) return 'warning'
  return 'danger'
})
const bortleLevelShort = computed(() => {
  const v = filter.value.maxBortle
  if (v <= 2) return '极佳'
  if (v <= 4) return '良好'
  if (v <= 6) return '郊区'
  if (v <= 8) return '城郊'
  return '全部'
})

// ── 生命周期 ──
onMounted(() => { initLocation(); cleanExpiredCheckinCache() })
onUnmounted(() => destroyMap())
watch(viewMode, v => {
  if (v === 'map') nextTick(() => mapInstance ? mapInstance.resize() : initMap())
})

// ── 定位 ──
function initLocation() {
  locating.value = true
  if (!navigator.geolocation) { handleLocErr(); return }
  navigator.geolocation.getCurrentPosition(
      pos => {
        userLng.value = pos.coords.longitude
        userLat.value = pos.coords.latitude
        locating.value = false
        loadSpots()
        loadTonightCondition()
        nextTick(initMap)
      },
      err => { console.warn('[Geo]', err.message); handleLocErr() },
      { enableHighAccuracy: true, timeout: 10000 }
  )
}
function handleLocErr() {
  locating.value = false; locationError.value = true
  userLng.value = 116.4074; userLat.value = 39.9042
  loadSpots(); loadTonightCondition(); nextTick(initMap)
}

// ── 筛选 ──
function onProvinceChange() { filter.value.city = ''; updateCenter(); loadSpots() }
function onCityChange()     { updateCenter(); loadSpots() }
function updateCenter() {
  // 优先用城市，没有城市就用省份
  const k = filter.value.city || filter.value.province
  if (!k) return
  // 直接查表（表里已覆盖带市/省/自治区的全写和简写）
  const c = CITY_COORDS[k]
  if (c) {
    userLng.value = c[0]; userLat.value = c[1]
    mapInstance?.setCenter(c)
    mapInstance?.setZoom(7)
  }
  // 找不到坐标时不移动地图，避免用错误坐标查询
}
function resetFilter() {
  filter.value = { province: '', city: '', radius: 100, maxBortle: 9 }
  if (locationError.value) { userLng.value = 116.4074; userLat.value = 39.9042 }
  loadSpots()
}

// ── 加载数据 ──
async function loadSpots() {
  if (!userLng.value || !userLat.value) return
  loading.value = true
  try {
    const res = await getNearbySpots(
        userLng.value, userLat.value, filter.value.radius, 20,
        undefined,  // 省市只用来切换搜索中心，不作为SQL过滤条件
        undefined,
        filter.value.maxBortle < 9 ? filter.value.maxBortle : undefined
    )
    spots.value = res.data || []
    await nextTick(); updateMarkers()
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败，请确认后端服务已启动且 LocationController 在正确目录')
  } finally {
    loading.value = false
  }
}

// ── 地图 ──
function initMap() {
  if (!window.AMap) { setTimeout(initMap, 500); return }
  if (mapInstance) return
  mapInstance = new window.AMap.Map('amap-container', {
    zoom: 7, center: [userLng.value || 116.4074, userLat.value || 39.9042],
    mapStyle: 'amap://styles/grey',
  })
  if (!locationError.value) {
    new window.AMap.Marker({
      map: mapInstance, position: [userLng.value, userLat.value],
      content: `<div style="width:14px;height:14px;background:#4a9eff;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(74,158,255,.25)"></div>`,
      offset: new window.AMap.Pixel(-7, -7), zIndex: 200
    })
  }
  updateMarkers()
}
function updateMarkers() {
  if (!mapInstance || !window.AMap) return
  if (markers.length) { mapInstance.remove(markers); markers = [] }
  spots.value.forEach(spot => {
    const color = bortleColor(spot.bortleLevel)
    const m = new window.AMap.Marker({
      position: [parseFloat(spot.longitude), parseFloat(spot.latitude)],
      content: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
        <span style="font-size:22px;color:${color};filter:drop-shadow(0 0 5px ${color});line-height:1">★</span>
        <span style="font-size:10px;color:#fff;background:rgba(0,0,0,.65);padding:1px 5px;border-radius:3px;margin-top:2px;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${spot.name}</span>
      </div>`,
      offset: new window.AMap.Pixel(-11, -24), zIndex: 100,
    })
    m.on('click', () => onCardClick(spot))
    markers.push(m)
  })
  mapInstance.add(markers)
}
function bortleColor(l) {
  if (l <= 2) return '#00e676'
  if (l <= 4) return '#aeea00'
  if (l <= 6) return '#ffd740'
  if (l <= 8) return '#ff6d00'
  return '#ff1744'
}
function destroyMap() {
  if (mapInstance) { mapInstance.destroy(); mapInstance = null; markers = [] }
}

// ── 本地评分缓存（弥补白名单导致myScore丢失的问题）──
const localRatingCache = {}   // { spotId: score }

// ── 卡片 & 弹窗 ──
function onCardClick(spot) {
  selectedSpotId.value = spot.id
  if (viewMode.value === 'map' && mapInstance) {
    mapInstance.setCenter([parseFloat(spot.longitude), parseFloat(spot.latitude)])
    mapInstance.setZoom(11)
  }
  openDialog(spot)
}
async function openDialog(spot) {
  dialogVisible.value = true; detailLoading.value = true; ratingInput.value = 0; ratingEditing.value = false
  spotWeather.value = null; checkinDone.value = false; checkinResult.value = {}  // 重置天气和签到状态
  try {
    const res = await getSpotDetail(spot.id)
    detailSpot.value = res.data
    // 合并本地缓存的评分（白名单接口拿不到登录用户的myScore）
    if (!detailSpot.value.myScore && localRatingCache[spot.id]) {
      detailSpot.value.myScore = localRatingCache[spot.id]
    }
    // 优先用后端返回的签到状态（登录时后端能查到 todayCheckedIn + 天气月相快照）
    if (detailSpot.value.todayCheckedIn) {
      checkinDone.value = true
      checkinResult.value = {
        weather: detailSpot.value.checkinWeather || '',
        moonPhaseName: detailSpot.value.checkinMoonPhase || '',
        todayCheckinCount: detailSpot.value.todayCheckinCount || 0
      }
    } else {
      // 兜底：从 localStorage 恢复（未登录时）
      const cached = loadCheckinCache(spot.id)
      if (cached) {
        checkinDone.value = true
        checkinResult.value = cached
      }
    }
    // 6.2: 弹窗打开后按需懒加载该观测点的天气
    loadSpotWeather(detailSpot.value)
  } catch { ElMessage.error('加载观测点详情失败'); dialogVisible.value = false }
  finally { detailLoading.value = false }
}
function onDialogClose() { detailSpot.value = null; ratingInput.value = 0; selectedSpotId.value = null }

// ── 评分 ──
async function doSubmitRating() {
  if (!ratingInput.value) { ElMessage.warning('请先选择星级'); return }
  ratingSubmitting.value = true
  try {
    const res = await apiSubmitRating(detailSpot.value.id, ratingInput.value)
    const { newRating, ratingCount } = res.data
    detailSpot.value.myScore = ratingInput.value
    detailSpot.value.rating = newRating
    detailSpot.value.ratingCount = ratingCount
    // 写入本地缓存，下次重新打开弹窗时仍能显示已评状态
    localRatingCache[detailSpot.value.id] = ratingInput.value
    const item = spots.value.find(s => s.id === detailSpot.value.id)
    if (item) { item.myScore = ratingInput.value; item.rating = newRating; item.ratingCount = ratingCount }
    ratingEditing.value = false  // 退出编辑模式
    ElMessage.success(ratingEditing.value ? '评分已更新 ⭐' : `评分成功，您给了 ${ratingInput.value} 星 ⭐`)
  } catch (e) { ElMessage.error(e?.response?.data?.message || '评分失败') }
  finally { ratingSubmitting.value = false }
}

// 进入修改评分模式
function startEditRating() {
  ratingEditing.value = true
  ratingInput.value = detailSpot.value.myScore || 0
}
// 取消修改
function cancelEditRating() {
  ratingEditing.value = false
  ratingInput.value = 0
}

// ── 今晚条件加载（6.2）──
async function loadTonightCondition() {
  if (!userLng.value || !userLat.value) return
  tonightLoading.value = true
  tonightError.value = false
  try {
    const res = await getTonightCondition(userLng.value, userLat.value)
    tonightData.value = res.data
  } catch (e) {
    console.warn('[Tonight]', e)
    tonightError.value = true
  } finally {
    tonightLoading.value = false
  }
}

// ── 详情弹窗天气懒加载（6.2）──
async function loadSpotWeather(spot) {
  if (!spot) return
  spotWeather.value = null
  spotWeatherLoading.value = true
  try {
    const lng = parseFloat(spot.longitude)
    const lat = parseFloat(spot.latitude)
    const res = await getWeather(lng, lat)
    spotWeather.value = res.data
  } catch (e) {
    console.warn('[SpotWeather]', e)
    spotWeather.value = null
  } finally {
    spotWeatherLoading.value = false
  }
}

// ── 签到（6.3）──
async function doCheckin() {
  if (!detailSpot.value) return
  checkinSubmitting.value = true
  try {
    const res = await apiCheckin(detailSpot.value.id, userLng.value, userLat.value)
    checkinDone.value = true
    checkinResult.value = res.data || {}
    // 持久化到 localStorage，关闭弹窗再打开仍显示已签到
    saveCheckinCache(detailSpot.value.id, checkinResult.value)
    // 更新弹窗中今日签到数
    if (detailSpot.value) {
      detailSpot.value.todayCheckinCount = res.data.todayCheckinCount
      detailSpot.value.totalCheckinCount = (detailSpot.value.totalCheckinCount || 0) + 1
    }
    ElMessage.success('签到成功！')
  } catch (e) {
    const msg = e?.response?.data?.message || '签到失败'
    // 如果是"今日已签到"，标记为已签到状态
    if (msg.includes('已') && msg.includes('签到')) {
      checkinDone.value = true
      checkinResult.value = {}
    }
    ElMessage.warning(msg)
  } finally {
    checkinSubmitting.value = false
  }
}

// 星级数组（用于v-for渲染星星）
function starsArray(count) {
  return Array.from({ length: count || 0 }, (_, i) => i)
}

// ── 工具 ──
function bortleTagTypeByLevel(l) {
  if (l <= 3) return 'success'; if (l <= 5) return 'warning'
  if (l <= 7) return 'danger';  return 'info'
}
function bortleBadgeClass(l) {
  if (l <= 3) return 'bortle-green'; if (l <= 5) return 'bortle-yellow'
  if (l <= 7) return 'bortle-orange'; return 'bortle-red'
}
function bortleLevelDesc(l) {
  return {1:'极佳暗天，银河清晰可见',2:'典型暗天遗址',3:'乡村天空',4:'乡村/城郊过渡',
    5:'城郊天空',6:'明亮城郊天空',7:'城郊/城市过渡',8:'城市天空',9:'市区（光污染严重）'}[l] || ''
}
</script>

<style scoped>
.obs-page {
  min-height: 100vh;
  background: #080c1a;
  color: #dde6f0;
  display: flex;
  flex-direction: column;
}

/* ── 顶部导航 ── */
.obs-header {
  background: rgba(12,16,35,.95);
  border-bottom: 1px solid rgba(91,141,238,.2);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 999;
}
.obs-header-inner {
  max-width: 1600px; margin: 0 auto;
  padding: 0 20px; height: 56px;
  display: flex; align-items: center; justify-content: space-between;
}
.header-left  { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 14px; }
.back-btn { color: #8ab4f8 !important; font-size: 13px; padding: 0 !important; }
.back-btn:hover { color: #fff !important; }
.header-divider { width: 1px; height: 18px; background: rgba(255,255,255,.15); }
.header-title { font-size: 17px; font-weight: 600; color: #c8e6ff; letter-spacing:.5px; }

.location-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 4px 10px; border-radius: 20px; border: 1px solid transparent;
}
.badge--loading { color: #aaa; border-color: rgba(255,255,255,.1); }
.badge--error   { color: #f56c6c; border-color: rgba(245,108,108,.3); background: rgba(245,108,108,.08); }
.badge--ok      { color: #67c23a; border-color: rgba(103,194,58,.3);  background: rgba(103,194,58,.08);  }
.spin { animation: rot 1.2s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }

:deep(.el-segmented) {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
}
:deep(.el-segmented-item.is-selected) { background: #5b8dee; color: #fff; }

/* ── 筛选栏 ── */
.filter-bar {
  background: rgba(14,18,40,.9);
  border-bottom: 1px solid rgba(91,141,238,.12);
  padding: 10px 20px;
}
.filter-inner {
  max-width: 1600px; margin: 0 auto;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.filter-select    { width: 120px; }
.filter-select-sm { width: 88px; }

.bortle-wrap {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.04); padding: 4px 12px;
  border-radius: 8px; border: 1px solid rgba(255,255,255,.08);
}
.bortle-label { font-size: 12px; color: #aaa; white-space: nowrap; }
.fallback-tip {
  display: flex; align-items: center; gap: 5px;
  margin-top: 7px; font-size: 12px; color: #e6a23c;
  max-width: 1600px; margin-left: auto; margin-right: auto;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(255,255,255,.06) !important;
  box-shadow: 0 0 0 1px rgba(255,255,255,.1) !important;
}
:deep(.el-select .el-input__inner) { color: #dde6f0 !important; }
:deep(.el-slider__bar)   { background: #5b8dee; }
:deep(.el-slider__button) { border-color: #5b8dee; }

/* ── 主体 ── */
.obs-body {
  flex: 1; display: flex;
  height: calc(100vh - 116px); /* 56px header + ~60px filter */
  overflow: hidden;
}

/* 地图 */
.map-box {
  flex: 1; min-width: 0;
  border-right: 1px solid rgba(91,141,238,.15);
}

/* 列表面板 */
.list-panel {
  width: 360px; flex-shrink: 0;
  display: flex; flex-direction: column;
  background: rgba(8,12,26,.9);
  overflow: hidden;
}
.list-panel.list-full { width: 100%; }

.list-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(255,255,255,.05);
  flex-shrink: 0;
}
.list-count { font-size: 13px; color: #8ab4f8; }
.list-count strong { color: #c8e6ff; }
.list-sort-tip { font-size: 11px; color: #444; }

.skeleton-wrap { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.skeleton-item { background: rgba(255,255,255,.03); border-radius: 10px; padding: 10px; }
.empty-state { padding: 40px 0; }
.empty-icon  { font-size: 52px; }

/* ── 卡片 ── */
.card-list {
  flex: 1; overflow-y: auto;
  padding: 10px; display: flex; flex-direction: column; gap: 8px;
}
.card-list::-webkit-scrollbar { width: 3px; }
.card-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

.spot-card {
  display: flex; gap: 12px; padding: 11px 12px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px; cursor: pointer; transition: all .18s;
  position: relative; overflow: hidden;
}
.spot-card:hover {
  border-color: rgba(91,141,238,.45);
  background: rgba(91,141,238,.07);
  transform: translateX(2px);
}
.spot-card--active {
  border-color: #5b8dee;
  background: rgba(91,141,238,.12);
  box-shadow: 0 0 0 1px rgba(91,141,238,.25);
}

.card-thumb {
  width: 76px; height: 76px; flex-shrink: 0;
  border-radius: 8px; overflow: hidden; position: relative;
}
.thumb-img { width: 100%; height: 100%; display: block; }
.thumb-err {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; background: rgba(255,255,255,.04);
}

.bortle-badge {
  position: absolute; bottom: 3px; left: 3px;
  font-size: 10px; font-weight: 700; padding: 1px 5px;
  border-radius: 4px; line-height: 1.6;
}
.bortle-green  { background: rgba(0,230,118,.85); color: #002010; }
.bortle-yellow { background: rgba(255,215,64,.85); color: #3d2e00; }
.bortle-orange { background: rgba(255,109,0,.85);  color: #fff; }
.bortle-red    { background: rgba(255,23,68,.85);   color: #fff; }

.card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.card-name { font-size: 14px; font-weight: 600; color: #c8e6ff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-sub  { font-size: 12px; color: #5a7080; }
.card-tags { display: flex; gap: 8px; align-items: center; }
.tag-distance { font-size: 12px; color: #5b8dee; }
.tag-alt      { font-size: 12px; color: #666; }
.card-rating-row { display: flex; align-items: center; gap: 4px; margin-top: 1px; }
.rating-val { font-size: 12px; color: #f7ba2a; font-weight: 600; }
.rating-cnt { font-size: 11px; color: #555; }

.my-score-badge {
  position: absolute; top: 9px; right: 9px;
  background: linear-gradient(135deg,#f7ba2a,#f0a020);
  color: #1a1000; font-size: 11px; font-weight: 700;
  padding: 2px 7px; border-radius: 10px;
}

/* ── 详情弹窗 ── */
:deep(.detail-dialog .el-dialog) {
  background: #1c1c21;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px;
  box-shadow: 0 32px 80px rgba(0,0,0,.85);
}
:deep(.detail-dialog .el-dialog__header) {
  padding: 20px 22px 14px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  margin-right: 0;
}
:deep(.detail-dialog .el-dialog__title) {
  color: #f0f0f0;
  font-size: 17px;
  font-weight: 600;
}
:deep(.detail-dialog .el-dialog__body) { padding: 0 20px 20px; }
:deep(.detail-dialog .el-dialog__headerbtn) { top: 18px; right: 18px; }
:deep(.detail-dialog .el-dialog__headerbtn .el-icon) { color: #555; font-size: 16px; }
:deep(.detail-dialog .el-dialog__headerbtn:hover .el-icon) { color: #aaa; }

.dialog-body { display: flex; flex-direction: column; gap: 14px; padding-top: 14px; }
.detail-carousel { border-radius: 8px; overflow: hidden; }

/* 四格指标 */
.metric-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(255,255,255,.07);
  border-radius: 10px;
  overflow: hidden;
}
.metric-cell {
  background: #252529;
  padding: 13px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  text-align: center;
}
.metric-label {
  font-size: 11px;
  color: #666;
  letter-spacing: .04em;
}
.metric-main { display: flex; justify-content: center; align-items: center; }
.score-big { font-size: 21px; font-weight: 600; color: #e8e8e8; }
.metric-sub { font-size: 11px; color: #666; line-height: 1.4; }

.bortle-pill {
  font-size: 12px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  display: inline-block;
}
.bortle-green  { background: rgba(0,180,80,.2);  color: #00d46a; border: 1px solid rgba(0,180,80,.4); }
.bortle-yellow { background: rgba(220,180,0,.18); color: #f5c800; border: 1px solid rgba(220,180,0,.4); }
.bortle-orange { background: rgba(220,100,0,.2);  color: #ff8c40; border: 1px solid rgba(220,100,0,.4); }
.bortle-red    { background: rgba(200,40,40,.2);  color: #ff6060; border: 1px solid rgba(200,40,40,.4); }

/* 位置/介绍分区 */
.detail-section {
  border-left: 2px solid #3a3a42;
  padding: 2px 0 2px 14px;
}
.section-key {
  font-size: 11px;
  color: #666;
  letter-spacing: .04em;
  margin-bottom: 5px;
}
.section-val { font-size: 13px; color: #c0c0c0; line-height: 1.75; }
.desc-text { white-space: pre-wrap; }

/* 评分区 */
.rating-panel {
  background: #252529 !important;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px;
  padding: 14px 16px;
}
.rating-panel-title {
  font-size: 11px;
  color: #666;
  letter-spacing: .04em;
  margin-bottom: 10px;
}
.rating-unauth { font-size: 13px; color: #666; }
.login-link  { color: #7aa8ff; text-decoration: none; }
.login-link:hover { text-decoration: underline; }
.rating-done-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(247,186,42,.07);
  border: 1px solid rgba(247,186,42,.2);
  border-radius: 8px;
  padding: 10px 14px;
}
.done-label { font-size: 13px; color: #f7ba2a; font-weight: 500; flex: 1; }
.edit-rating-btn { font-size: 12px; color: #8ab4f8 !important; margin-left: auto; }
.rating-input-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
:deep(.detail-dialog .el-rate__text) { color: #888 !important; font-size: 13px; }

/* 强制整个弹窗覆盖层背景深色，消除白色外框 */
:deep(.detail-dialog) { background: transparent !important; }
:deep(.detail-dialog .el-overlay) { background: rgba(0,0,0,.7) !important; }

/* ── 今晚观测条件卡片（6.2）── */
.tonight-bar {
  background: linear-gradient(135deg, rgba(14,18,40,.95), rgba(20,30,60,.95));
  border-bottom: 1px solid rgba(91,141,238,.18);
  padding: 12px 20px;
}
.tonight-inner {
  max-width: 1600px; margin: 0 auto;
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
}
.tonight-loading {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #8ab4f8;
}
.tonight-score {
  display: flex; align-items: center; gap: 8px;
}
.tonight-stars { display: flex; gap: 2px; }
.star-icon {
  font-size: 18px; color: #f7ba2a;
  text-shadow: 0 0 6px rgba(247,186,42,.4);
}
.star-empty { color: #3a3a42; text-shadow: none; }
.tonight-score-num {
  font-size: 15px; font-weight: 700;
  color: #c8e6ff;
  background: rgba(91,141,238,.15);
  padding: 2px 10px; border-radius: 12px;
}
.tonight-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px;
}
.tonight-label {
  color: #5a7080;
}
.tonight-val {
  color: #c0d8f0;
  font-weight: 500;
}
.tonight-suggestion {
  font-size: 12px; color: #8ab4f8;
  line-height: 1.5;
  flex: 1; min-width: 200px;
  padding: 4px 12px;
  background: rgba(91,141,238,.08);
  border-radius: 8px;
  border-left: 3px solid rgba(91,141,238,.4);
}

/* ── 详情弹窗天气面板（6.2）── */
.weather-panel {
  background: #252529;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px;
  padding: 14px 16px;
}
.weather-panel-title {
  font-size: 11px;
  color: #666;
  letter-spacing: .04em;
  margin-bottom: 10px;
}
.weather-loading {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #888;
}
.weather-grid {
  display: flex; flex-wrap: wrap; gap: 10px;
  align-items: center;
}
.weather-cell {
  display: flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,.04);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
}
.weather-icon { font-size: 16px; }
.weather-info { color: #c0c0c0; }
.weather-suitability {
  display: flex; align-items: center; gap: 8px;
  margin-left: auto;
}
.suit-label { font-size: 12px; color: #666; }
.suit-badge {
  font-size: 12px; font-weight: 600;
  padding: 3px 10px; border-radius: 12px;
}
.weather-empty { font-size: 13px; color: #555; }

/* ── 签到面板（6.3）── */
.checkin-panel {
  background: #252529;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex; align-items: center;
}
.checkin-unauth { font-size: 13px; color: #666; }
.checkin-action {
  display: flex; align-items: center; gap: 12px;
  width: 100%;
}
.checkin-tip { font-size: 12px; color: #555; }
.checkin-done {
  display: flex; align-items: center; gap: 12px;
  width: 100%;
  background: rgba(103,194,58,.07);
  border: 1px solid rgba(103,194,58,.2);
  border-radius: 8px;
  padding: 10px 14px;
  margin: -2px;
}
.checkin-done-icon { font-size: 20px; }
.checkin-done-info { display: flex; flex-direction: column; gap: 2px; }
.checkin-done-title { font-size: 14px; font-weight: 600; color: #67c23a; }
.checkin-done-meta { font-size: 12px; color: #888; }
</style>