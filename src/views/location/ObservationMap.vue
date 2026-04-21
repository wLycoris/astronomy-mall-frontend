<template>
  <div class="obs">
    <!-- painterly sky + stars + grain -->
    <div class="sky"></div>
    <div class="stars"></div>
    <div class="grain"></div>

    <!-- topbar -->
    <header class="topbar">
      <div class="topbar__left">
        <span class="crumb" @click="router.push('/home')">← 返回首页</span>
        <span class="sep">·</span>
        <span class="title-ish">观测 · 地图</span>
        <span class="kicker"><em>find the darkest sky above you</em></span>
      </div>

      <div class="topbar__right">
        <div class="loc-badge" :class="locationBadgeClass">
          <el-icon v-if="locating" class="spin"><Loading /></el-icon>
          <el-icon v-else-if="locationError"><WarnTriangleFilled /></el-icon>
          <el-icon v-else><Location /></el-icon>
          <span>{{ locationStatusText }}</span>
        </div>
        <div class="seg">
          <span class="seg__item" :class="{ 'seg__item--on': viewMode === 'map' }" @click="viewMode = 'map'">地图</span>
          <span class="seg__item" :class="{ 'seg__item--on': viewMode === 'list' }" @click="viewMode = 'list'">列表</span>
        </div>
      </div>
    </header>

    <!-- filters -->
    <div class="filters">
      <div class="filters__inner">
        <el-select
            v-model="filter.province" placeholder="省份" clearable size="small"
            class="f-select" @change="onProvinceChange"
        >
          <el-option v-for="p in provinceList" :key="p.value" :label="p.label" :value="p.label" />
        </el-select>

        <el-select
            v-model="filter.city" placeholder="城市" clearable size="small"
            class="f-select" :disabled="!filter.province" @change="onCityChange"
        >
          <el-option v-for="c in cityList" :key="c.value" :label="c.label" :value="c.label" />
        </el-select>

        <el-select v-model="filter.radius" size="small" class="f-select f-select--sm" @change="loadSpots">
          <el-option label="50 公里" :value="50" />
          <el-option label="100 公里" :value="100" />
          <el-option label="200 公里" :value="200" />
          <el-option label="500 公里" :value="500" />
        </el-select>

        <div class="bortle">
          <span class="bortle__label"><em>dark sky ≤</em></span>
          <el-slider v-model="filter.maxBortle" :min="1" :max="9" :step="1"
                     show-stops size="small" style="width:130px" @change="loadSpots" />
          <span class="bortle__pill" :class="'bortle__pill--' + bortleTagType">
            B{{ filter.maxBortle }} · {{ bortleLevelShort }}
          </span>
        </div>

        <span class="link" @click="resetFilter">重置</span>
      </div>

      <div v-if="locationError" class="fallback-tip">
        <el-icon><InfoFilled /></el-icon>
        定位被拒绝，请选择省市作为搜索中心
      </div>
    </div>

    <!-- tonight bar -->
    <div class="tonight" v-if="tonightData || tonightLoading">
      <div class="tonight__inner">
        <div v-if="tonightLoading" class="tonight__loading">
          <el-icon class="spin"><Loading /></el-icon>
          <span><em>— reading · tonight's · sky</em></span>
        </div>

        <template v-else-if="tonightData">
          <div class="tonight__score">
            <div class="tonight__stars">
              <span v-for="i in starsArray(tonightData.overallStars)" :key="i" class="t-star">★</span>
              <span v-for="i in starsArray(5 - tonightData.overallStars)" :key="'e'+i" class="t-star t-star--off">★</span>
            </div>
            <span class="tonight__num">{{ tonightData.overallScore }}<em class="tn-unit">分</em></span>
          </div>

          <div class="tonight__item">
            <span class="tonight__k"><em>天气</em></span>
            <span class="tonight__v">{{ tonightData.weatherSuitability }} 分</span>
          </div>

          <div class="tonight__item">
            <span class="tonight__k"><em>月相</em></span>
            <span class="tonight__v">{{ tonightData.moonPhaseName }} · {{ tonightData.moonIllumination }}%</span>
          </div>

          <div class="tonight__sugg">
            {{ tonightData.suggestion }}
          </div>
        </template>
      </div>
    </div>

    <!-- body -->
    <div class="body">
      <!-- map -->
      <div v-show="viewMode === 'map'" id="amap-container" class="map" ref="mapContainerRef"></div>

      <!-- list panel -->
      <div class="list" :class="{ 'list--full': viewMode === 'list' }">
        <div class="list__head">
          <span class="list__count" v-if="!loading">
            共 <strong>{{ spots.length }}</strong> 个观测点
          </span>
          <span class="list__count" v-else><em>— loading —</em></span>
          <span class="list__sort"><em>by · distance</em></span>
        </div>

        <div v-if="loading" class="sk-wrap">
          <div v-for="i in 5" :key="i" class="sk-item">
            <div class="sk-thumb"></div>
            <div class="sk-body">
              <div class="sk-line sk-line--l"></div>
              <div class="sk-line sk-line--s"></div>
            </div>
          </div>
        </div>

        <div v-else-if="spots.length === 0" class="empty">
          <div class="empty__orb">
            <div class="empty__halo"></div>
            <div class="empty__disc"></div>
          </div>
          <div class="empty__title">这片天区还很寂静</div>
          <div class="empty__desc">试试扩大范围，或切换到别的省份看看。</div>
        </div>

        <div v-else class="cards">
          <div
              v-for="spot in spots" :key="spot.id"
              class="card" :class="{ 'card--on': selectedSpotId === spot.id }"
              @click="onCardClick(spot)"
          >
            <div class="card__thumb">
              <el-image :src="spot.mainImage || defaultImg" fit="cover" lazy class="thumb-img">
                <template #error><div class="thumb-err">✦</div></template>
              </el-image>
              <div class="bortle-tag" :class="'bortle-tag--' + bortleBadgeClass(spot.bortleLevel)">B{{ spot.bortleLevel }}</div>
            </div>

            <div class="card__body">
              <div class="card__name">{{ spot.name }}</div>
              <div class="card__sub"><em>{{ spot.province }} · {{ spot.city }}</em></div>
              <div class="card__tags">
                <span class="tag-dist">{{ spot.distance }} 公里</span>
                <span class="tag-alt" v-if="spot.altitude"><em>海拔</em> {{ spot.altitude }} m</span>
              </div>
              <div class="card__rate">
                <el-rate :model-value="spot.rating ? parseFloat(spot.rating) : 0"
                         disabled allow-half :max="5"
                         :colors="['#f7ecd2','#f7ecd2','#f7ecd2']"
                         style="--el-rate-icon-size:14px" />
                <span class="rate-val">{{ spot.rating ? parseFloat(spot.rating).toFixed(1) : '—' }}</span>
                <span class="rate-cnt" v-if="spot.ratingCount">({{ spot.ratingCount }})</span>
              </div>
            </div>

            <div v-if="spot.myScore" class="my-score">★ {{ spot.myScore }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- detail dialog -->
    <el-dialog v-model="dialogVisible" :title="detailSpot?.name || '观测点详情'"
               width="580px" top="5vh" class="obs-dialog" @close="onDialogClose" destroy-on-close>

      <el-skeleton v-if="detailLoading" :rows="5" animated />

      <div v-else-if="detailSpot" class="dlg-body">

        <el-carousel v-if="detailSpot.images?.length" height="180px" :autoplay="false" class="dlg-carousel">
          <el-carousel-item v-for="img in detailSpot.images" :key="img">
            <el-image :src="img" fit="cover" style="width:100%;height:180px" />
          </el-carousel-item>
        </el-carousel>

        <!-- metrics -->
        <div class="metric">
          <div class="metric__cell">
            <div class="metric__k"><em>dark · sky</em></div>
            <div class="metric__v">
              <span class="bortle-pill" :class="'bortle-tag--' + bortleBadgeClass(detailSpot.bortleLevel)">
                B{{ detailSpot.bortleLevel }}
              </span>
            </div>
            <div class="metric__sub">{{ bortleLevelDesc(detailSpot.bortleLevel) }}</div>
          </div>
          <div class="metric__cell">
            <div class="metric__k"><em>rating</em></div>
            <div class="metric__v metric__v--big">
              {{ detailSpot.rating ? parseFloat(detailSpot.rating).toFixed(1) : '—' }}
            </div>
            <div class="metric__sub">{{ detailSpot.ratingCount ? detailSpot.ratingCount + ' 人评分' : '暂无评分' }}</div>
          </div>
          <div class="metric__cell">
            <div class="metric__k"><em>altitude</em></div>
            <div class="metric__v metric__v--big">{{ detailSpot.altitude || '—' }}</div>
            <div class="metric__sub">{{ detailSpot.altitude ? '米' : '' }}</div>
          </div>
          <div class="metric__cell">
            <div class="metric__k"><em>checkins · today</em></div>
            <div class="metric__v metric__v--big">{{ detailSpot.todayCheckinCount || 0 }}</div>
            <div class="metric__sub">累计 {{ detailSpot.totalCheckinCount || 0 }} 次</div>
          </div>
        </div>

        <div class="section">
          <div class="section__k"><em>location</em></div>
          <div class="section__v">{{ detailSpot.province }} {{ detailSpot.city }} · {{ detailSpot.address }}</div>
        </div>

        <div v-if="detailSpot.fullDescription || detailSpot.description" class="section">
          <div class="section__k"><em>about · this · place</em></div>
          <div class="section__v section__v--desc">{{ detailSpot.fullDescription || detailSpot.description }}</div>
        </div>

        <!-- weather -->
        <div class="panel">
          <div class="panel__title"><em>current · weather</em></div>
          <div v-if="spotWeatherLoading" class="panel__loading">
            <el-icon class="spin"><Loading /></el-icon> 正在读取天气…
          </div>
          <div v-else-if="spotWeather" class="w-grid">
            <div class="w-cell"><span class="w-icon">☁</span><span>{{ spotWeather.condition }}</span></div>
            <div class="w-cell"><span class="w-icon">°</span><span>{{ spotWeather.temperature }}°C</span></div>
            <div class="w-cell"><span class="w-icon">◐</span><span>{{ spotWeather.humidity }}%</span></div>
            <div class="w-cell"><span class="w-icon">↗</span><span>{{ spotWeather.windDirection }} {{ spotWeather.windLevel }}级</span></div>
            <div class="w-suit">
              <span class="w-suit__k"><em>suitability</em></span>
              <span class="w-suit__badge" :style="{ background: spotWeather.suitabilityColor, color: '#070b1d' }">
                {{ spotWeather.suitabilityLevel }} · {{ spotWeather.suitabilityScore }}分
              </span>
            </div>
          </div>
          <div v-else class="panel__empty"><em>— no · weather · data —</em></div>
        </div>

        <!-- checkin -->
        <div class="panel panel--checkin">
          <div v-if="!isLoggedIn" class="checkin-unauth">
            <router-link to="/login" class="login-link">登录</router-link> 后可在此签到
          </div>
          <div v-else-if="checkinDone" class="checkin-done">
            <span class="checkin-done__glyph">✓</span>
            <div class="checkin-done__info">
              <div class="checkin-done__title">今日已签到</div>
              <div class="checkin-done__meta">
                <span v-if="checkinResult.weather">{{ checkinResult.weather }}</span>
                <span v-if="checkinResult.moonPhaseName"> · {{ checkinResult.moonPhaseName }}</span>
                <span v-if="checkinResult.todayCheckinCount"> · 今日第 {{ checkinResult.todayCheckinCount }} 人</span>
              </div>
            </div>
          </div>
          <div v-else class="checkin-action">
            <button class="submit submit--sm" :disabled="checkinSubmitting" @click="doCheckin">
              <span class="submit__en"><em>mark · this · night</em></span>
              <span class="submit__cn">{{ checkinSubmitting ? '签到中…' : '签到打卡' }}</span>
            </button>
            <span class="checkin-tip"><em>need to be within 5 km</em></span>
          </div>
        </div>

        <!-- equipment reel -->
        <div v-if="checkinDone && spotEquipmentList.length > 0" class="panel">
          <div class="panel__title panel__title--row">
            <span><em>gear · for · this · sky</em></span>
            <span class="panel__hint">根据海拔 / 光污染 / 常见天体智能匹配</span>
          </div>
          <div class="equip-scroll">
            <div v-for="prod in spotEquipmentList" :key="prod.id" class="equip" @click="goToProduct(prod.id)">
              <div class="equip__img">
                <img v-if="prod.mainImage" :src="prod.mainImage" :alt="prod.productName" />
                <div v-else class="equip__ph">✦</div>
              </div>
              <div class="equip__info">
                <div class="equip__name">{{ prod.productName }}</div>
                <div class="equip__price">¥ {{ Number(prod.price || 0).toFixed(2) }}</div>
                <div class="equip__reason">{{ prod.reason || '适合该观测点' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="checkinDone && spotEquipmentLoading" class="panel">
          <div class="panel__title"><em>— matching · gear —</em></div>
          <el-skeleton :rows="2" animated />
        </div>

        <!-- rating -->
        <div class="panel">
          <div class="panel__title"><em>your · rating</em></div>
          <div v-if="!isLoggedIn" class="rate-unauth">
            <router-link to="/login" class="login-link">登录</router-link> 后可提交评分
          </div>
          <div v-else-if="detailSpot.myScore && !ratingEditing" class="rate-done">
            <el-rate :model-value="detailSpot.myScore" disabled :max="5"
                     :colors="['#f7ecd2','#f7ecd2','#f7ecd2']" />
            <span class="rate-done__label">您已评 {{ detailSpot.myScore }} 星 · 感谢评价</span>
            <span class="link" @click="startEditRating">修改</span>
          </div>
          <div v-else class="rate-input">
            <el-rate v-model="ratingInput" :max="5"
                     :texts="['很差','较差','一般','不错','非常好']" show-text
                     :colors="['#f7ecd2','#f7ecd2','#f7ecd2']" />
            <button
                class="quiet-btn quiet-btn--primary"
                :disabled="!ratingInput || ratingSubmitting"
                @click="doSubmitRating"
                style="margin-left:10px"
            >
              <span class="qb-mark">✧</span>
              <span>{{ ratingEditing ? '更新' : '提交' }}</span>
            </button>
            <span v-if="ratingEditing" class="link" @click="cancelEditRating">取消</span>
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
// 🆕 8.3.3 跨模块联动：签到 → 推荐适合器材
import { getSpotEquipmentRecommend } from '@/api/recommend'

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

// 🆕 8.3.3 签到后器材推荐
const spotEquipmentLoading = ref(false)
const spotEquipmentList    = ref([])

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
  'loc-badge--loading': locating.value,
  'loc-badge--error':   locationError.value,
  'loc-badge--ok':      !locating.value && !locationError.value,
}))
const bortleTagType = computed(() => {
  const v = filter.value.maxBortle
  if (v <= 3) return 'ok'
  if (v <= 6) return 'warn'
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
    mapStyle: 'amap://styles/darkblue',
  })
  if (!locationError.value) {
    new window.AMap.Marker({
      map: mapInstance, position: [userLng.value, userLat.value],
      content: `<div style="width:14px;height:14px;background:#f7ecd2;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 7px rgba(247,236,210,.22)"></div>`,
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
        <span style="font-size:22px;color:${color};filter:drop-shadow(0 0 6px ${color});line-height:1">★</span>
        <span style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:11px;color:#f7ecd2;background:rgba(7,11,29,.75);padding:2px 8px;border-radius:999px;margin-top:3px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.5px">${spot.name}</span>
      </div>`,
      offset: new window.AMap.Pixel(-11, -24), zIndex: 100,
    })
    m.on('click', () => onCardClick(spot))
    markers.push(m)
  })
  mapInstance.add(markers)
}
function bortleColor(l) {
  if (l <= 2) return '#a6dcbc'
  if (l <= 4) return '#d9e2a6'
  if (l <= 6) return '#f7ecd2'
  if (l <= 8) return '#e9b7b7'
  return '#d99db4'
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
  // 🆕 8.3.3 重置器材推荐状态（切换观测点时防止旧数据残留）
  spotEquipmentList.value = []
  spotEquipmentLoading.value = false
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
      // 🆕 8.3.3 已签到 → 直接拉取器材推荐
      fetchSpotEquipmentRecommend(spot.id)
    } else {
      // 兜底：从 localStorage 恢复（未登录时）
      const cached = loadCheckinCache(spot.id)
      if (cached) {
        checkinDone.value = true
        checkinResult.value = cached
        fetchSpotEquipmentRecommend(spot.id)
      }
    }
    // 6.2: 弹窗打开后按需懒加载该观测点的天气
    loadSpotWeather(detailSpot.value)
  } catch { ElMessage.error('加载观测点详情失败'); dialogVisible.value = false }
  finally { detailLoading.value = false }
}
function onDialogClose() {
  detailSpot.value = null
  ratingInput.value = 0
  selectedSpotId.value = null
  // 🆕 8.3.3 关闭时清理器材推荐状态
  spotEquipmentList.value = []
  spotEquipmentLoading.value = false
}

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
    // 🆕 8.3.3 签到成功后异步拉取适合器材推荐
    fetchSpotEquipmentRecommend(detailSpot.value.id)
  } catch (e) {
    const msg = e?.response?.data?.message || '签到失败'
    // 如果是"今日已签到"，标记为已签到状态
    if (msg.includes('已') && msg.includes('签到')) {
      checkinDone.value = true
      checkinResult.value = {}
      // 🆕 8.3.3 今日已签到也要拉取推荐
      if (detailSpot.value) fetchSpotEquipmentRecommend(detailSpot.value.id)
    }
    ElMessage.warning(msg)
  } finally {
    checkinSubmitting.value = false
  }
}

/**
 * 🆕 8.3.3: 签到成功后（或今日已签到时）拉取适合该观测点的器材推荐
 * 根据观测点海拔/光污染等级做规则前置过滤 + tags Jaccard 排序
 * 失败静默降级，不影响签到流程
 */
async function fetchSpotEquipmentRecommend(spotId) {
  if (!spotId) return
  spotEquipmentLoading.value = true
  spotEquipmentList.value = []
  try {
    const res = await getSpotEquipmentRecommend(spotId, { limit: 6 })
    spotEquipmentList.value = res.data || []
  } catch (err) {
    console.warn('[ObservationMap] 器材推荐加载失败:', err)
    spotEquipmentList.value = []
  } finally {
    spotEquipmentLoading.value = false
  }
}

/** 🆕 8.3.3: 跳转商品详情 */
function goToProduct(productId) {
  router.push(`/product/${productId}`)
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
  if (l <= 3) return 'ok'
  if (l <= 5) return 'warm'
  if (l <= 7) return 'hot'
  return 'bad'
}
function bortleLevelDesc(l) {
  return {1:'极佳暗天，银河清晰可见',2:'典型暗天遗址',3:'乡村天空',4:'乡村/城郊过渡',
    5:'城郊天空',6:'明亮城郊天空',7:'城郊/城市过渡',8:'城市天空',9:'市区（光污染严重）'}[l] || ''
}
</script>

<style lang="scss" scoped>
/* ── palette (shared) ──────────────────────────────────────────── */
$moon:      #f7ecd2;
$moon-soft: #ede2c3;
$cream:     #f3e9cf;
$cream-dim: rgba(243,233,207,0.72);
$cream-low: rgba(243,233,207,0.42);
$cream-xlow:rgba(243,233,207,0.22);

$sky-top: #1a2547;
$sky-mid: #0e1731;
$sky-bot: #070b1d;

$violet:  #9a86d1;
$rose:    #d99db4;
$bloom:   #6b8ed6;

$ok:   #a6dcbc;
$warn: #e9b7b7;
$mid:  #b9c8e8;

$sans:  'Inter','PingFang SC','Microsoft YaHei','Hiragino Sans GB','Helvetica Neue',Arial,sans-serif;
$serif: 'Cormorant Garamond','Playfair Display',Georgia,'Songti SC',serif;

/* ── page base ─────────────────────────────────────────────────── */
.obs {
  min-height: 100vh;
  position: relative;
  color: $cream;
  font-family: $sans;
  display: flex;
  flex-direction: column;
  background: $sky-bot;
  overflow: hidden;
}

.sky {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(154,134,209,0.18), transparent 60%),
    radial-gradient(900px 520px at 85% 10%, rgba(217,157,180,0.10), transparent 60%),
    radial-gradient(1400px 900px at 50% 110%, rgba(107,142,214,0.14), transparent 70%),
    linear-gradient(180deg, $sky-top 0%, $sky-mid 45%, $sky-bot 100%);
}
.stars {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    radial-gradient(1.2px 1.2px at 18% 22%, rgba(255,255,255,0.85), transparent 55%),
    radial-gradient(1px 1px at 72% 18%, rgba(247,236,210,0.75), transparent 55%),
    radial-gradient(1px 1px at 34% 68%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(1.4px 1.4px at 88% 54%, rgba(185,200,232,0.7), transparent 55%),
    radial-gradient(1px 1px at 9% 82%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(1px 1px at 57% 88%, rgba(217,157,180,0.55), transparent 55%),
    radial-gradient(1.2px 1.2px at 44% 36%, rgba(255,255,255,0.4), transparent 55%),
    radial-gradient(1px 1px at 95% 86%, rgba(247,236,210,0.55), transparent 55%);
  background-size: 720px 720px, 940px 940px, 620px 620px, 1100px 1100px,
                   820px 820px, 1020px 1020px, 520px 520px, 1220px 1220px;
  opacity: .75;
  animation: twinkle 6.5s ease-in-out infinite alternate;
}
@keyframes twinkle { 0% { opacity: .5; } 100% { opacity: .85; } }

.grain {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  mix-blend-mode: overlay;
  opacity: .15;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.82  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

/* ── topbar ───────────────────────────────────────────────────── */
.topbar {
  position: relative; z-index: 10;
  padding: 22px 36px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(7,11,29,0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid $cream-xlow;
  flex-shrink: 0;
}
.topbar__left {
  display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;
  font-family: $serif;
  color: $cream-dim;
}
.crumb {
  font-size: 13px;
  font-style: italic;
  letter-spacing: .6px;
  cursor: pointer;
  transition: color .2s;
  &:hover { color: $moon; }
}
.sep { color: $cream-xlow; }
.title-ish {
  font-family: $serif;
  font-weight: 500;
  font-size: 22px;
  letter-spacing: 6px;
  color: $moon;
  line-height: 1;
  text-shadow: 0 2px 20px rgba(247,236,210,0.18);
}
.kicker {
  font-family: $serif;
  font-style: italic;
  font-size: 12.5px;
  letter-spacing: 1.5px;
  color: $cream-low;
  padding-left: 2px;
}

.topbar__right { display: flex; align-items: center; gap: 14px; }

.loc-badge {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: $serif;
  font-style: italic;
  font-size: 13px;
  letter-spacing: .5px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid $cream-xlow;
  background: rgba(247,236,210,0.04);
  color: $cream-dim;
  transition: all .2s;

  &--loading { color: $cream-low; }
  &--error   { color: $warn; border-color: rgba(233,183,183,0.4); background: rgba(233,183,183,0.06); }
  &--ok      { color: $moon; border-color: $cream-low; background: rgba(247,236,210,0.08); }
}
.spin { animation: rot 1.4s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }

.seg {
  display: inline-flex;
  padding: 3px;
  border: 1px solid $cream-xlow;
  border-radius: 999px;
  background: rgba(247,236,210,0.04);
}
.seg__item {
  padding: 6px 16px;
  font-family: $sans;
  font-size: 12px;
  letter-spacing: 2px;
  color: $cream-dim;
  cursor: pointer;
  border-radius: 999px;
  transition: all .2s;
  user-select: none;

  &:hover { color: $moon; }
  &--on {
    background: rgba(247,236,210,0.15);
    color: $moon;
  }
}

/* ── filters ──────────────────────────────────────────────────── */
.filters {
  position: relative; z-index: 2;
  padding: 14px 36px;
  border-bottom: 1px solid $cream-xlow;
  background: rgba(7,11,29,0.4);
  backdrop-filter: blur(6px);
  flex-shrink: 0;

  &__inner {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
}

.f-select    { width: 128px; }
.f-select--sm { width: 108px; }

.bortle {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 5px 16px;
  background: rgba(247,236,210,0.04);
  border: 1px solid $cream-xlow;
  border-radius: 999px;

  &__label {
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    color: $cream-dim;
    letter-spacing: .5px;
    white-space: nowrap;
  }
  &__pill {
    font-family: $sans;
    font-size: 11.5px;
    letter-spacing: 1.5px;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid currentColor;
    white-space: nowrap;

    &--ok     { color: $ok; }
    &--warn   { color: $moon; }
    &--danger { color: $warn; }
  }
}

.fallback-tip {
  display: flex; align-items: center; gap: 6px;
  margin-top: 8px;
  font-family: $serif; font-style: italic;
  font-size: 13px;
  color: $warn;
  letter-spacing: .5px;
}

/* element plus overrides for filters */
:deep(.el-select .el-input__wrapper) {
  background: rgba(247,236,210,0.04) !important;
  box-shadow: 0 0 0 1px $cream-xlow inset !important;
  border-radius: 999px !important;
  padding: 2px 14px !important;
  &:hover { box-shadow: 0 0 0 1px $cream-low inset !important; }
}
:deep(.el-select .el-input__inner) {
  color: $cream !important;
  font-family: $sans;
}
:deep(.el-select .el-input__inner::placeholder) { color: $cream-low !important; }

:deep(.el-slider) {
  --el-slider-main-bg-color: #{$moon};
  --el-slider-runway-bg-color: #{$cream-xlow};
}
:deep(.el-slider__button) {
  border-color: $moon;
  background: $moon;
}
:deep(.el-slider__stop) { background: $cream-xlow; }

/* ── tonight bar ──────────────────────────────────────────────── */
.tonight {
  position: relative; z-index: 2;
  padding: 14px 36px;
  border-bottom: 1px solid $cream-xlow;
  background:
    linear-gradient(90deg, rgba(154,134,209,0.08), rgba(247,236,210,0.05));
  flex-shrink: 0;

  &__inner {
    display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
  }
  &__loading {
    display: flex; align-items: center; gap: 8px;
    font-family: $serif; font-style: italic;
    font-size: 14px;
    color: $cream-dim;
    letter-spacing: 1px;
  }
  &__score {
    display: flex; align-items: center; gap: 12px;
  }
  &__stars {
    display: flex; gap: 3px;
  }
  &__num {
    font-family: $serif;
    font-weight: 500;
    font-size: 22px;
    color: $moon;
    letter-spacing: 1px;
    .tn-unit {
      font-size: 13px;
      color: $cream-dim;
      font-style: italic;
      margin-left: 2px;
    }
  }
  &__item {
    display: flex; align-items: baseline; gap: 8px;
    font-family: $sans;
    font-size: 13.5px;
  }
  &__k {
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    color: $cream-low;
  }
  &__v {
    color: $cream;
    letter-spacing: .5px;
  }
  &__sugg {
    flex: 1; min-width: 240px;
    font-family: $serif; font-style: italic;
    font-size: 13.5px;
    color: $cream-dim;
    line-height: 1.6;
    letter-spacing: .5px;
    padding: 6px 16px;
    background: rgba(247,236,210,0.04);
    border-left: 2px solid $cream-low;
    border-radius: 2px;
  }
}
.t-star {
  font-size: 18px;
  color: $moon;
  text-shadow: 0 0 8px rgba(247,236,210,0.45);
  &--off {
    color: $cream-xlow;
    text-shadow: none;
  }
}

/* ── body ─────────────────────────────────────────────────────── */
.body {
  flex: 1;
  display: flex;
  position: relative;
  z-index: 2;
  min-height: 0;
  overflow: hidden;
}

/* map */
.map {
  flex: 1;
  min-width: 0;
  border-right: 1px solid $cream-xlow;
  position: relative;

  :deep(.amap-logo), :deep(.amap-copyright) { opacity: .4; }
}

/* list panel */
.list {
  width: 380px; flex-shrink: 0;
  display: flex; flex-direction: column;
  background: rgba(7,11,29,0.72);
  backdrop-filter: blur(10px);
  overflow: hidden;

  &--full { width: 100%; }

  &__head {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 18px 22px 14px;
    border-bottom: 1px solid $cream-xlow;
    flex-shrink: 0;
  }
  &__count {
    font-family: $sans;
    font-size: 13px;
    letter-spacing: 1px;
    color: $cream-dim;
    strong {
      color: $moon;
      font-family: $serif;
      font-weight: 500;
      font-size: 16px;
      margin: 0 4px;
    }
  }
  &__sort {
    font-family: $serif;
    font-style: italic;
    font-size: 12.5px;
    letter-spacing: .5px;
    color: $cream-low;
  }
}

.sk-wrap {
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
}
.sk-item {
  display: flex; gap: 12px;
  padding: 12px;
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  background: rgba(247,236,210,0.02);
}
.sk-thumb {
  width: 72px; height: 72px;
  border-radius: 4px;
  background: linear-gradient(90deg,
    rgba(247,236,210,0.04),
    rgba(247,236,210,0.10),
    rgba(247,236,210,0.04));
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
  flex-shrink: 0;
}
.sk-body { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
.sk-line {
  height: 10px;
  background: linear-gradient(90deg,
    rgba(247,236,210,0.04),
    rgba(247,236,210,0.10),
    rgba(247,236,210,0.04));
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
  border-radius: 2px;
  &--l { width: 75%; }
  &--s { width: 45%; }
}
@keyframes skeleton {
  0%,100% { background-position: 0% 0; }
  50%     { background-position: -100% 0; }
}

/* empty */
.empty {
  padding: 60px 24px;
  text-align: center;

  &__orb {
    position: relative;
    width: 96px; height: 96px;
    margin: 0 auto 22px;
  }
  &__halo {
    position: absolute; inset: -12px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(247,236,210,0.22), transparent 70%);
    animation: breath 5s ease-in-out infinite alternate;
  }
  &__disc {
    position: absolute; inset: 8px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 32%, #fff7e0, $moon 55%, $moon-soft 100%);
    box-shadow: 0 0 24px rgba(247,236,210,0.25);
    opacity: .75;
  }
  &__title {
    font-family: $serif;
    font-size: 22px;
    letter-spacing: 3px;
    color: $moon;
    margin-bottom: 10px;
  }
  &__desc {
    font-family: $sans;
    font-size: 13px;
    color: $cream-dim;
    letter-spacing: .5px;
  }
}
@keyframes breath {
  0%   { opacity: .55; transform: scale(.96); }
  100% { opacity: .95; transform: scale(1.04); }
}

/* cards */
.cards {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex; flex-direction: column; gap: 10px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: $cream-xlow; border-radius: 2px; }
  &::-webkit-scrollbar-thumb:hover { background: $cream-low; }
}

.card {
  display: flex; gap: 14px;
  padding: 12px 14px;
  background: rgba(247,236,210,0.03);
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  cursor: pointer;
  transition: all .2s;
  position: relative;

  &:hover {
    border-color: $cream-low;
    background: rgba(247,236,210,0.06);
    transform: translateX(2px);
  }
  &--on {
    border-color: $moon;
    background: rgba(247,236,210,0.1);
    box-shadow: 0 0 0 1px rgba(247,236,210,0.15), 0 0 30px rgba(247,236,210,0.08);
  }

  &__thumb {
    position: relative;
    width: 78px; height: 78px; flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(7,11,29,0.5);
  }
  .thumb-img { width: 100%; height: 100%; display: block; }
  .thumb-err {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    color: $moon-soft;
    background: rgba(7,11,29,0.5);
  }

  &__body {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 4px;
  }
  &__name {
    font-family: $serif;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 1px;
    color: $moon;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__sub {
    font-family: $serif;
    font-style: italic;
    font-size: 12.5px;
    letter-spacing: .5px;
    color: $cream-low;
  }
  &__tags {
    display: flex; gap: 10px; align-items: center;
    margin-top: 2px;
    .tag-dist {
      font-family: $sans;
      font-size: 12px;
      letter-spacing: 1px;
      color: $moon-soft;
      padding: 2px 8px;
      border: 1px solid $cream-xlow;
      border-radius: 999px;
    }
    .tag-alt {
      font-family: $serif;
      font-style: italic;
      font-size: 12px;
      color: $cream-low;
      em { font-style: italic; margin-right: 2px; }
    }
  }
  &__rate {
    display: flex; align-items: center; gap: 5px;
    margin-top: 2px;
    .rate-val {
      font-family: $serif;
      font-size: 13px;
      color: $moon;
      letter-spacing: .5px;
      font-weight: 500;
    }
    .rate-cnt {
      font-family: $serif;
      font-style: italic;
      font-size: 11.5px;
      color: $cream-low;
    }
  }
}

.bortle-tag {
  position: absolute;
  bottom: 4px; left: 4px;
  font-family: $sans;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 1px 7px;
  border-radius: 999px;
  line-height: 1.5;

  &--ok   { background: rgba(166,220,188,0.9);  color: $sky-bot; }
  &--warm { background: rgba(247,236,210,0.9);  color: $sky-bot; }
  &--hot  { background: rgba(217,157,180,0.9);  color: $sky-bot; }
  &--bad  { background: rgba(233,183,183,0.9);  color: $sky-bot; }
}

.my-score {
  position: absolute;
  top: 10px; right: 12px;
  font-family: $serif;
  font-size: 12px;
  color: $moon;
  letter-spacing: 1px;
  padding: 2px 9px;
  border: 1px solid $cream-low;
  border-radius: 999px;
  background: rgba(247,236,210,0.1);
}

/* ── dialog ───────────────────────────────────────────────────── */
:deep(.el-overlay:has(.obs-dialog)) {
  background: rgba(4,7,18,0.92) !important;
  backdrop-filter: blur(10px);
}
:deep(.obs-dialog) {
  background: $sky-bot !important;
  background-image:
    radial-gradient(circle at 50% -10%, rgba(154,134,209,0.18), transparent 55%),
    linear-gradient(180deg, $sky-mid 0%, $sky-bot 100%) !important;
  border: 1px solid $cream-low !important;
  border-radius: 6px !important;
  box-shadow:
    0 0 0 1px rgba(247,236,210,0.05) inset,
    0 32px 80px rgba(0,0,0,.85) !important;
  --el-dialog-bg-color: #{$sky-bot};
}
:deep(.obs-dialog .el-dialog__body) {
  background: transparent;
}
:deep(.obs-dialog .el-dialog__header) {
  padding: 22px 26px 16px;
  border-bottom: 1px solid $cream-xlow;
  margin-right: 0;
}
:deep(.obs-dialog .el-dialog__title) {
  font-family: $serif;
  color: $moon;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 3px;
}
:deep(.obs-dialog .el-dialog__body) { padding: 0 24px 24px; }
:deep(.obs-dialog .el-dialog__headerbtn) { top: 20px; right: 20px; }
:deep(.obs-dialog .el-dialog__headerbtn .el-icon) { color: $cream-low; font-size: 18px; }
:deep(.obs-dialog .el-dialog__headerbtn:hover .el-icon) { color: $moon; }

.dlg-body { display: flex; flex-direction: column; gap: 16px; padding-top: 14px; }
.dlg-carousel { border-radius: 4px; overflow: hidden; border: 1px solid $cream-xlow; }

/* metric grid */
.metric {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(247,236,210,0.03);

  &__cell {
    padding: 14px 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: center;
    border-right: 1px solid $cream-xlow;
    &:last-child { border-right: none; }
  }
  &__k {
    font-family: $serif;
    font-style: italic;
    font-size: 11.5px;
    letter-spacing: 1.5px;
    color: $cream-low;
  }
  &__v {
    display: flex; align-items: center; justify-content: center;
    min-height: 26px;
    &--big {
      font-family: $serif;
      font-weight: 500;
      font-size: 24px;
      color: $moon;
      letter-spacing: 1px;
    }
  }
  &__sub {
    font-family: $sans;
    font-size: 11px;
    color: $cream-low;
    letter-spacing: .5px;
    line-height: 1.4;
  }
}
.bortle-pill {
  font-family: $sans;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 3px 12px;
  border-radius: 999px;
  display: inline-block;
}

/* sections */
.section {
  padding: 4px 0 4px 16px;
  border-left: 2px solid $cream-xlow;

  &__k {
    font-family: $serif;
    font-style: italic;
    font-size: 12.5px;
    letter-spacing: 1.5px;
    color: $cream-low;
    margin-bottom: 6px;
  }
  &__v {
    font-family: $sans;
    font-size: 13.5px;
    color: $cream-dim;
    line-height: 1.75;
    letter-spacing: .3px;
    &--desc { white-space: pre-wrap; }
  }
}

/* panels */
.panel {
  background: rgba(247,236,210,0.03);
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  padding: 16px 18px;

  &__title {
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    letter-spacing: 2px;
    color: $cream-low;
    margin-bottom: 12px;

    &--row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
  }
  &__hint {
    font-family: $sans;
    font-size: 11.5px;
    color: $cream-low;
    letter-spacing: .5px;
    font-style: normal;
  }
  &__loading {
    display: flex; align-items: center; gap: 8px;
    font-family: $serif; font-style: italic;
    font-size: 13.5px;
    color: $cream-dim;
  }
  &__empty {
    font-family: $serif; font-style: italic;
    font-size: 13px;
    color: $cream-low;
    letter-spacing: 1px;
  }

  &--checkin {
    display: flex; align-items: center;
  }
}

/* weather grid */
.w-grid {
  display: flex; flex-wrap: wrap; gap: 10px;
  align-items: center;
}
.w-cell {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 14px;
  border: 1px solid $cream-xlow;
  border-radius: 999px;
  background: rgba(247,236,210,0.04);
  font-family: $sans;
  font-size: 13px;
  color: $cream;
  letter-spacing: .5px;

  .w-icon {
    font-family: $serif;
    font-size: 15px;
    color: $moon;
  }
}
.w-suit {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 8px;

  &__k {
    font-family: $serif;
    font-style: italic;
    font-size: 12.5px;
    color: $cream-low;
    letter-spacing: .5px;
  }
  &__badge {
    font-family: $sans;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    padding: 4px 12px;
    border-radius: 999px;
  }
}

/* checkin */
.checkin-unauth, .rate-unauth {
  font-family: $sans;
  font-size: 13.5px;
  color: $cream-dim;
  letter-spacing: .3px;
}
.login-link {
  color: $moon; text-decoration: none;
  border-bottom: 1px solid $cream-low;
  &:hover { color: #fff7e0; }
}
.checkin-action {
  display: flex; align-items: center; gap: 14px;
  width: 100%;
  flex-wrap: wrap;
}
.checkin-tip {
  font-family: $serif;
  font-style: italic;
  font-size: 12.5px;
  color: $cream-low;
  letter-spacing: .5px;
}
.checkin-done {
  display: flex; align-items: center; gap: 14px;
  width: 100%;
  background: rgba(166,220,188,0.06);
  border: 1px solid rgba(166,220,188,0.3);
  border-radius: 4px;
  padding: 12px 16px;
  margin: -4px;

  &__glyph {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: rgba(166,220,188,0.15);
    border: 1px solid rgba(166,220,188,0.4);
    display: flex; align-items: center; justify-content: center;
    font-family: $serif;
    font-size: 20px;
    color: $ok;
    flex-shrink: 0;
  }
  &__info { display: flex; flex-direction: column; gap: 3px; }
  &__title {
    font-family: $serif;
    font-size: 15px;
    letter-spacing: 2px;
    color: $ok;
  }
  &__meta {
    font-family: $serif;
    font-style: italic;
    font-size: 12.5px;
    color: $cream-low;
    letter-spacing: .5px;
  }
}

/* equipment */
.equip-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: $cream-xlow transparent;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: $cream-xlow; border-radius: 2px; }
}
.equip {
  flex-shrink: 0;
  width: 150px;
  background: rgba(247,236,210,0.04);
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all .2s;

  &:hover {
    border-color: $cream-low;
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(7,11,29,0.4);
  }

  &__img {
    width: 100%; height: 96px;
    background: rgba(7,11,29,0.6);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; }
  }
  &__ph {
    font-size: 26px;
    color: $moon-soft;
    opacity: .6;
  }
  &__info { padding: 10px 12px 12px; }
  &__name {
    font-family: $serif;
    font-size: 13px;
    letter-spacing: .8px;
    color: $moon;
    margin: 0 0 5px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 36px;
  }
  &__price {
    font-family: $serif;
    font-size: 14.5px;
    font-weight: 500;
    color: $moon-soft;
    margin: 0 0 4px;
    letter-spacing: .5px;
  }
  &__reason {
    font-family: $serif;
    font-style: italic;
    font-size: 11.5px;
    color: $cream-low;
    margin: 0;
    letter-spacing: .5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* rating */
.rate-done {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 16px;
  background: rgba(247,236,210,0.05);
  border: 1px solid $cream-xlow;
  border-radius: 4px;
  flex-wrap: wrap;

  &__label {
    font-family: $serif;
    font-size: 13.5px;
    color: $moon;
    letter-spacing: 1px;
    flex: 1;
  }
}
.rate-input {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}

:deep(.obs-dialog .el-rate__text) {
  color: $cream-dim !important;
  font-family: $serif !important;
  font-style: italic;
  font-size: 13px !important;
}

/* buttons */
.quiet-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 18px;
  background: transparent;
  border: 1px solid $cream-xlow;
  color: $cream-dim;
  font-family: $sans;
  font-size: 12px;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all .25s;
  border-radius: 999px;

  .qb-mark { color: $moon; font-size: 11px; }
  &:hover:not(:disabled) {
    color: $moon;
    border-color: $cream-low;
    background: rgba(247,236,210,0.06);
  }
  &:disabled { opacity: .45; cursor: not-allowed; }

  &--primary {
    color: $moon;
    border-color: $cream-low;
    background: rgba(247,236,210,0.1);
    &:hover:not(:disabled) { background: rgba(247,236,210,0.2); }
  }
}

.submit {
  display: inline-flex; flex-direction: column; align-items: center;
  gap: 2px;
  padding: 12px 32px;
  background: linear-gradient(180deg, rgba(247,236,210,0.14), rgba(247,236,210,0.05));
  border: 1px solid $cream-low;
  border-radius: 999px;
  cursor: pointer;
  transition: all .3s;
  color: $moon;
  font-family: $sans;

  &__en {
    font-family: $serif; font-style: italic;
    font-size: 11px; letter-spacing: 1.8px;
    color: $cream-dim;
  }
  &__cn { font-size: 13px; letter-spacing: 3px; }

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(247,236,210,0.24), rgba(247,236,210,0.1));
    box-shadow: 0 0 30px rgba(247,236,210,0.18);
    transform: translateY(-1px);
  }
  &:disabled { opacity: .55; cursor: not-allowed; }
  &--sm { padding: 10px 24px; .submit__cn { font-size: 13px; letter-spacing: 2.5px; } }
}

.link {
  font-family: $sans;
  font-size: 12.5px;
  letter-spacing: 1.2px;
  color: $cream-dim;
  cursor: pointer;
  padding: 6px 4px;
  transition: color .2s;
  user-select: none;
  white-space: nowrap;
  border-bottom: 1px solid transparent;

  &:hover { color: $moon; border-bottom-color: $cream-low; }
}

/* element plus loading mask inside dialog */
:deep(.obs-dialog .el-loading-mask) {
  background: rgba(7,11,29,0.65);
  .el-loading-spinner .path { stroke: $moon; }
}

/* skeleton inside dialog */
:deep(.obs-dialog .el-skeleton__item) {
  background: linear-gradient(90deg,
    rgba(247,236,210,0.05),
    rgba(247,236,210,0.12),
    rgba(247,236,210,0.05));
}

/* responsive */
@media (max-width: 980px) {
  .body { flex-direction: column; }
  .map { min-height: 300px; border-right: none; border-bottom: 1px solid $cream-xlow; }
  .list { width: 100%; }
  .title-ish { font-size: 18px; letter-spacing: 4px; }
  .kicker { display: none; }
}
@media (max-width: 640px) {
  .topbar { padding: 14px 20px 10px; flex-wrap: wrap; gap: 10px; }
  .filters { padding: 12px 20px; }
  .tonight { padding: 12px 20px; }
  .metric { grid-template-columns: repeat(2, 1fr);
    .metric__cell:nth-child(2) { border-right: none; }
    .metric__cell:nth-child(1),
    .metric__cell:nth-child(2) { border-bottom: 1px solid $cream-xlow; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .stars, .empty__halo, .sk-thumb, .sk-line { animation: none !important; }
}
</style>
