<template>
  <div class="statistics-page">
    <div class="dashboard-header">
      <div>
        <div class="header-kicker">ADMIN ANALYTICS</div>
        <h1>运营数据看板</h1>
        <p>汇总交易、订单、用户与评价数据，辅助后台快速判断今日运营状态。</p>
      </div>
      <div class="header-panel">
        <span class="panel-label">最近更新</span>
        <strong>{{ lastUpdated || '等待加载' }}</strong>
        <el-button size="small" class="refresh-btn" @click="reloadAll">刷新数据</el-button>
      </div>
    </div>

    <!-- ==================== 数据概览卡片 ==================== -->
    <div class="section-title">
      <div>
        <span class="section-kicker">OVERVIEW</span>
        <strong>核心指标</strong>
      </div>
    </div>
    <el-row :gutter="16" class="overview-cards" v-loading="overviewLoading">
      <!-- 今日订单 -->
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card tone-blue">
          <div class="stat-icon bg-blue">
            <el-icon size="28"><ShoppingCart /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日订单数</div>
            <div class="stat-value">{{ overview.todayOrderCount ?? '--' }}</div>
            <div class="stat-growth" :class="growthClass(overview.todayOrderGrowth)">
              <el-icon><component :is="growthIcon(overview.todayOrderGrowth)" /></el-icon>
              {{ formatGrowth(overview.todayOrderGrowth) }}
            </div>
          </div>
        </div>
      </el-col>
      <!-- 今日销售额 -->
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card tone-green">
          <div class="stat-icon bg-green">
            <el-icon size="28"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日销售额</div>
            <div class="stat-value">¥ {{ formatAmount(overview.todaySalesAmount) }}</div>
            <div class="stat-growth" :class="growthClass(overview.todaySalesGrowth)">
              <el-icon><component :is="growthIcon(overview.todaySalesGrowth)" /></el-icon>
              {{ formatGrowth(overview.todaySalesGrowth) }}
            </div>
          </div>
        </div>
      </el-col>
      <!-- 本月销售额 -->
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card tone-gold">
          <div class="stat-icon bg-purple">
            <el-icon size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月销售额</div>
            <div class="stat-value">¥ {{ formatAmount(overview.monthSalesAmount) }}</div>
            <div class="stat-growth" :class="growthClass(overview.monthSalesGrowth)">
              <el-icon><component :is="growthIcon(overview.monthSalesGrowth)" /></el-icon>
              {{ formatGrowth(overview.monthSalesGrowth) }}
            </div>
          </div>
        </div>
      </el-col>
      <!-- 待处理预警 -->
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card tone-warn">
          <div class="stat-icon bg-orange">
            <el-icon size="28"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">待处理事项</div>
            <div class="stat-value">
              <span class="badge-item" :class="{ 'badge-warn': overview.pendingOrderCount > 0 }">
                {{ overview.pendingOrderCount ?? 0 }} 待发货
              </span>
            </div>
            <div class="stat-value-sm">
              <el-tag size="small" type="danger" v-if="overview.pendingRefundCount > 0">
                {{ overview.pendingRefundCount }} 待退款审核
              </el-tag>
              <el-tag size="small" type="warning" v-if="overview.stockWarningCount > 0">
                {{ overview.stockWarningCount }} 库存预警
              </el-tag>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- ==================== 销售统计 ==================== -->
    <div class="section-title">
      <div>
        <span class="section-kicker">SALES</span>
        <strong>销售统计</strong>
      </div>
      <el-radio-group v-model="salesDays" size="small" @change="loadSalesTrend" class="period-selector">
        <el-radio-button :label="7">近7天</el-radio-button>
        <el-radio-button :label="30">近30天</el-radio-button>
        <el-radio-button :label="90">近90天</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" v-loading="salesLoading">
      <!-- 销售趋势折线图 -->
      <el-col :xs="24" :lg="16">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>销售趋势</strong>
              <span>订单数与销售额走势</span>
            </div>
          </div>
          <div ref="salesChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 分类销售占比饼图 -->
      <el-col :xs="24" :lg="8">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>分类销售占比</strong>
              <span>按商品分类汇总销售额</span>
            </div>
          </div>
          <div ref="categoryChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 商品销售排行 -->
    <div class="chart-card mt-16" v-loading="salesLoading">
      <div class="chart-title">
        <div>
          <strong>商品销售排行 TOP 10</strong>
          <span>按销量和销售额排序</span>
        </div>
      </div>
      <el-table :data="productRank" size="small" style="width:100%">
        <el-table-column type="index" label="排名" width="60" align="center">
          <template #default="{ $index }">
            <span class="rank-badge" :class="rankClass($index)">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image :src="row.productImage" class="product-thumb" fit="cover" />
              <span>{{ row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="salesCount" label="销量" width="100" align="center" sortable />
        <el-table-column label="销售额" width="130" align="right" sortable>
          <template #default="{ row }">¥ {{ formatAmount(row.salesAmount) }}</template>
        </el-table-column>
        <el-table-column label="销量占比" width="200">
          <template #default="{ row }">
            <el-progress
                :percentage="calcRankPct(row.salesCount)"
                :color="'#2563eb'"
                :stroke-width="8"
                :show-text="false"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ==================== 订单统计 ==================== -->
    <div class="section-title">
      <div>
        <span class="section-kicker">ORDERS</span>
        <strong>订单统计</strong>
      </div>
    </div>
    <el-row :gutter="16" v-loading="orderLoading">
      <!-- 订单状态分布 -->
      <el-col :xs="24" :lg="10">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>订单状态分布</strong>
              <span>待支付、待发货、待收货等状态</span>
            </div>
          </div>
          <div ref="orderStatusChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 订单金额分布 -->
      <el-col :xs="24" :lg="14">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>订单金额分布</strong>
              <span>不同金额区间的订单数量</span>
            </div>
          </div>
          <div ref="orderAmountChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- ==================== 用户统计 ==================== -->
    <div class="section-title">
      <div>
        <span class="section-kicker">USERS</span>
        <strong>用户统计</strong>
      </div>
      <el-radio-group v-model="userDays" size="small" @change="loadUserStatistics" class="period-selector">
        <el-radio-button :label="7">近7天</el-radio-button>
        <el-radio-button :label="30">近30天</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" v-loading="userLoading">
      <!-- 新增用户趋势 -->
      <el-col :xs="24" :lg="16">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>新增用户趋势</strong>
              <span>统计周期内新增注册用户</span>
            </div>
          </div>
          <div ref="userTrendChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 活跃度 -->
      <el-col :xs="24" :lg="8">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>用户活跃度</strong>
              <span>近30天活跃用户占比</span>
            </div>
          </div>
          <div ref="activeChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16" v-loading="userLoading">
      <!-- 地区分布 -->
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>用户地区分布 TOP 10</strong>
              <span>按省份统计用户数量</span>
            </div>
          </div>
          <div ref="provinceChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 等级分布 -->
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>用户等级分布</strong>
              <span>按观测等级统计用户结构</span>
            </div>
          </div>
          <div ref="levelChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- ==================== 评价统计 ==================== -->
    <div class="section-title">
      <div>
        <span class="section-kicker">REVIEWS</span>
        <strong>评价统计</strong>
      </div>
      <el-radio-group v-model="reviewDays" size="small" @change="loadReviewStatistics" class="period-selector">
        <el-radio-button :label="7">近7天</el-radio-button>
        <el-radio-button :label="30">近30天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 评价概览数字卡片 -->
    <el-row :gutter="16" class="review-overview" v-loading="reviewLoading">
      <el-col :xs="24" :sm="8">
        <div class="mini-card">
          <div class="mini-val">{{ reviewData.totalCount ?? 0 }}</div>
          <div class="mini-label">总评价数</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="mini-card">
          <div class="mini-val">{{ reviewData.avgRating ?? '0.0' }}</div>
          <div class="mini-label">平均评分</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="mini-card">
          <div class="mini-val text-green">{{ reviewData.goodRate ?? 0 }}%</div>
          <div class="mini-label">好评率</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16" v-loading="reviewLoading">
      <!-- 评分分布 -->
      <el-col :xs="24" :lg="10">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>评分分布</strong>
              <span>不同星级评价数量</span>
            </div>
          </div>
          <div ref="ratingChartRef" class="chart-body-sm"></div>
        </div>
      </el-col>
      <!-- 评价趋势 -->
      <el-col :xs="24" :lg="14">
        <div class="chart-card">
          <div class="chart-title">
            <div>
              <strong>评价趋势</strong>
              <span>统计周期内评价提交数量</span>
            </div>
          </div>
          <div ref="reviewTrendChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  ShoppingCart, Money, TrendCharts, Warning,
  ArrowUp, ArrowDown, Minus
} from '@element-plus/icons-vue'
import {
  getOverview,
  getSalesTrend,
  getOrderStatistics,
  getUserStatistics,
  getReviewStatistics
} from '@/api/admin/statistics'

// ==================== 响应式数据 ====================
const overview = ref({})
const productRank = ref([])
const reviewData = ref({})
const lastUpdated = ref('')

const salesDays = ref(7)
const userDays = ref(7)
const reviewDays = ref(7)

const overviewLoading = ref(false)
const salesLoading = ref(false)
const orderLoading = ref(false)
const userLoading = ref(false)
const reviewLoading = ref(false)

// ==================== ECharts 实例引用 ====================
const salesChartRef = ref(null)
const categoryChartRef = ref(null)
const orderStatusChartRef = ref(null)
const orderAmountChartRef = ref(null)
const userTrendChartRef = ref(null)
const activeChartRef = ref(null)
const provinceChartRef = ref(null)
const levelChartRef = ref(null)
const ratingChartRef = ref(null)
const reviewTrendChartRef = ref(null)

let salesChart, categoryChart, orderStatusChart, orderAmountChart,
    userTrendChart, activeChart, provinceChart, levelChart,
    ratingChart, reviewTrendChart

// ==================== 颜色常量 ====================
const COLORS = ['#2563eb', '#059669', '#c0842f', '#dc2626', '#64748b', '#7c3aed']
const ORDER_STATUS_MAP = {
  0: { name: '待支付', color: '#c0842f' },
  1: { name: '待发货', color: '#2563eb' },
  2: { name: '待收货', color: '#7c3aed' },
  3: { name: '已完成', color: '#059669' },
  4: { name: '已取消', color: '#64748b' }
}

// ==================== 工具函数 ====================
const formatAmount = (val) => {
  if (val == null) return '0.00'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatGrowth = (val) => {
  if (val == null) return '--'
  const prefix = val > 0 ? '+' : ''
  return `${prefix}${val}% 较昨日`
}

const growthClass = (val) => {
  if (val == null || val === 0) return 'neutral'
  return val > 0 ? 'up' : 'down'
}

const growthIcon = (val) => {
  if (val == null || val === 0) return Minus
  return val > 0 ? ArrowUp : ArrowDown
}

const calcRankPct = (salesCount) => {
  if (!productRank.value.length) return 0
  const max = productRank.value[0].salesCount || 1
  return Math.round((salesCount / max) * 100)
}

const rankClass = (index) => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

const updateTime = () => {
  const now = new Date()
  lastUpdated.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

async function reloadAll() {
  await Promise.all([
    loadOverview(),
    loadSalesTrend(),
    loadOrderStatistics(),
    loadUserStatistics(),
    loadReviewStatistics()
  ])
  updateTime()
}

// ==================== 数据加载 ====================

async function loadOverview() {
  overviewLoading.value = true
  try {
    const res = await getOverview()
    if (res.code === 200) {
      overview.value = res.data
    }
  } catch (e) {
    ElMessage.error('概览数据加载失败')
  } finally {
    overviewLoading.value = false
  }
}

async function loadSalesTrend() {
  salesLoading.value = true
  try {
    const res = await getSalesTrend(salesDays.value)
    if (res.code === 200) {
      const d = res.data
      productRank.value = d.productRank || []
      await nextTick()
      renderSalesChart(d.dates, d.orderCounts, d.salesAmounts)
      renderCategoryChart(d.categorySales)
    }
  } catch (e) {
    ElMessage.error('销售数据加载失败')
  } finally {
    salesLoading.value = false
  }
}

async function loadOrderStatistics() {
  orderLoading.value = true
  try {
    const res = await getOrderStatistics()
    if (res.code === 200) {
      const d = res.data
      await nextTick()
      renderOrderStatusChart(d)
      renderOrderAmountChart(d.amountDistribution)
    }
  } catch (e) {
    ElMessage.error('订单数据加载失败')
  } finally {
    orderLoading.value = false
  }
}

async function loadUserStatistics() {
  userLoading.value = true
  try {
    const res = await getUserStatistics(userDays.value)
    if (res.code === 200) {
      const d = res.data
      await nextTick()
      renderUserTrendChart(d.dates, d.newUserCounts)
      renderActiveChart(d.activeUserCount, d.totalUserCount, d.activeRate)
      renderProvinceChart(d.provinceDistribution)
      renderLevelChart(d.levelDistribution)
    }
  } catch (e) {
    ElMessage.error('用户数据加载失败')
  } finally {
    userLoading.value = false
  }
}

async function loadReviewStatistics() {
  reviewLoading.value = true
  try {
    const res = await getReviewStatistics(reviewDays.value)
    if (res.code === 200) {
      reviewData.value = res.data
      await nextTick()
      renderRatingChart(res.data.ratingDistribution)
      renderReviewTrendChart(res.data.dates, res.data.reviewCounts)
    }
  } catch (e) {
    ElMessage.error('评价数据加载失败')
  } finally {
    reviewLoading.value = false
  }
}

// ==================== ECharts 渲染函数 ====================

function initOrGet(ref, instance) {
  if (!instance || instance.isDisposed()) {
    return echarts.init(ref)
  }
  return instance
}

/** 销售趋势折线图（双Y轴：订单数 + 销售额） */
function renderSalesChart(dates, orderCounts, salesAmounts) {
  salesChart = initOrGet(salesChartRef.value, salesChart)
  salesChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['订单数', '销售额'], top: 4 },
    grid: { left: 60, right: 70, bottom: 30, top: 40 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '订单数', nameTextStyle: { fontSize: 11 } },
      {
        type: 'value',
        name: '销售额(¥)',
        nameTextStyle: { fontSize: 11 },
        axisLabel: { formatter: (v) => `${(v / 1000).toFixed(1)}k` }
      }
    ],
    series: [
      {
        name: '订单数', type: 'bar', data: orderCounts,
        itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 30
      },
      {
        name: '销售额', type: 'line', yAxisIndex: 1, data: salesAmounts,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#059669', width: 2 },
        areaStyle: { color: 'rgba(5,150,105,0.08)' },
        itemStyle: { color: '#059669' }
      }
    ]
  })
}

/** 分类销售占比饼图 */
function renderCategoryChart(data) {
  if (!data || !data.length) return
  categoryChart = initOrGet(categoryChartRef.value, categoryChart)
  categoryChart.setOption({
    color: COLORS,
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>销售额：¥${Number(p.data.value).toLocaleString()}<br/>占比：${p.percent}%`
    },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: data.map(d => ({
        name: d.categoryName,
        value: Number(d.salesAmount)
      })),
      label: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
      }
    }]
  })
}

/** 订单状态分布 - 圆环图 */
function renderOrderStatusChart(data) {
  orderStatusChart = initOrGet(orderStatusChartRef.value, orderStatusChart)
  const pieData = [
    { name: '待支付', value: data.waitPayCount, itemStyle: { color: '#c0842f' } },
    { name: '待发货', value: data.waitDeliverCount, itemStyle: { color: '#2563eb' } },
    { name: '待收货', value: data.waitReceiveCount, itemStyle: { color: '#7c3aed' } },
    { name: '已完成', value: data.completedCount, itemStyle: { color: '#059669' } },
    { name: '已取消', value: data.cancelledCount, itemStyle: { color: '#64748b' } }
  ].filter(d => d.value > 0)

  orderStatusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['38%', '62%'],
      center: ['50%', '45%'],
      data: pieData,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 }
    }]
  })
}

/** 订单金额分布 - 横向柱状图 */
function renderOrderAmountChart(data) {
  if (!data || !data.length) return
  orderAmountChart = initOrGet(orderAmountChartRef.value, orderAmountChart)
  orderAmountChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (p) => `${p[0].name}：${p[0].value} 笔 (${data[p[0].dataIndex]?.percentage}%)`
    },
    grid: { left: 90, right: 40, bottom: 20, top: 20 },
    xAxis: { type: 'value', name: '订单数' },
    yAxis: { type: 'category', data: data.map(d => d.label), axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({
        value: d.count,
        itemStyle: { color: COLORS[i % COLORS.length], borderRadius: [0, 3, 3, 0] }
      })),
      barMaxWidth: 22,
      label: { show: true, position: 'right', formatter: '{c} 笔', fontSize: 11 }
    }]
  })
}

/** 新增用户趋势 */
function renderUserTrendChart(dates, counts) {
  userTrendChart = initOrGet(userTrendChartRef.value, userTrendChart)
  userTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, bottom: 30, top: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', name: '用户数', minInterval: 1 },
    series: [{
      type: 'line', data: counts, smooth: true,
      symbol: 'circle', symbolSize: 6,
      lineStyle: { color: '#2563eb', width: 2 },
      areaStyle: { color: 'rgba(37,99,235,0.08)' },
      itemStyle: { color: '#2563eb' }
    }]
  })
}

/** 用户活跃度 - 仪表盘 */
function renderActiveChart(activeCount, totalCount, activeRate) {
  activeChart = initOrGet(activeChartRef.value, activeChart)
  activeChart.setOption({
    tooltip: { formatter: `活跃用户 ${activeCount} / 总用户 ${totalCount}` },
    series: [{
      type: 'gauge',
      startAngle: 200, endAngle: -20,
      min: 0, max: 100,
      splitNumber: 5,
      radius: '80%',
      axisLine: {
        lineStyle: {
          width: 12,
          color: [[0.3, '#dc2626'], [0.7, '#c0842f'], [1, '#059669']]
        }
      },
      pointer: { itemStyle: { color: 'auto' } },
      axisTick: { distance: -15, length: 8, lineStyle: { color: '#fff', width: 2 } },
      splitLine: { distance: -20, length: 15, lineStyle: { color: '#fff', width: 3 } },
      axisLabel: { color: 'inherit', distance: 18, fontSize: 10, formatter: (v) => `${v}%` },
      detail: {
        valueAnimation: true,
        formatter: `{value}%\n活跃率`,
        color: 'inherit',
        fontSize: 18,
        offsetCenter: [0, '60%']
      },
      data: [{ value: activeRate }]
    }]
  })
}

/** 省份分布 - 横向柱状图 */
function renderProvinceChart(data) {
  if (!data || !data.length) return
  provinceChart = initOrGet(provinceChartRef.value, provinceChart)
  provinceChart.setOption({
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].name}：${p[0].value} 人` },
    grid: { left: 60, right: 30, bottom: 20, top: 20 },
    xAxis: { type: 'value', name: '用户数', minInterval: 1 },
    yAxis: {
      type: 'category',
      data: data.map(d => d.province),
      axisLabel: { fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({
        value: d.userCount,
        itemStyle: { color: COLORS[i % COLORS.length], borderRadius: [0, 3, 3, 0] }
      })),
      barMaxWidth: 18,
      label: { show: true, position: 'right', fontSize: 11 }
    }]
  })
}

/** 用户等级分布 - 柱状图 */
function renderLevelChart(data) {
  if (!data || !data.length) return
  levelChart = initOrGet(levelChartRef.value, levelChart)
  const levelColors = ['#64748b', '#059669', '#2563eb', '#c0842f', '#dc2626']
  levelChart.setOption({
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].name}：${p[0].value} 人 (${data[p[0].dataIndex]?.percentage}%)` },
    grid: { left: 50, right: 20, bottom: 30, top: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.levelName),
      axisLabel: { fontSize: 12 }
    },
    yAxis: { type: 'value', name: '用户数', minInterval: 1 },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({
        value: d.userCount,
        itemStyle: { color: levelColors[i % 5], borderRadius: [4, 4, 0, 0] }
      })),
      barMaxWidth: 40,
      label: { show: true, position: 'top', fontSize: 11 }
    }]
  })
}

/** 评分分布 - 水平条形图 */
function renderRatingChart(data) {
  if (!data || !data.length) return
  ratingChart = initOrGet(ratingChartRef.value, ratingChart)
  const starColors = ['#dc2626', '#c0842f', '#c0842f', '#059669', '#059669']
  // 按评分1→5排序
  const sorted = [...data].sort((a, b) => a.rating - b.rating)
  ratingChart.setOption({
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].name}星：${p[0].value} 条 (${sorted[p[0].dataIndex]?.percentage}%)` },
    grid: { left: 40, right: 60, bottom: 20, top: 10 },
    xAxis: { type: 'value', name: '数量', minInterval: 1 },
    yAxis: {
      type: 'category',
      data: sorted.map(d => `${d.rating}★`),
      axisLabel: { fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: sorted.map((d, i) => ({
        value: d.count,
        itemStyle: { color: starColors[i], borderRadius: [0, 3, 3, 0] }
      })),
      barMaxWidth: 20,
      label: {
        show: true, position: 'right', fontSize: 11,
        formatter: (p) => `${p.value} 条 (${sorted[p.dataIndex]?.percentage}%)`
      }
    }]
  })
}

/** 评价趋势折线图 */
function renderReviewTrendChart(dates, counts) {
  reviewTrendChart = initOrGet(reviewTrendChartRef.value, reviewTrendChart)
  reviewTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, bottom: 30, top: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', name: '评价数', minInterval: 1 },
    series: [{
      type: 'line', data: counts, smooth: true,
      symbol: 'circle', symbolSize: 6,
      lineStyle: { color: '#c0842f', width: 2 },
      areaStyle: { color: 'rgba(192,132,47,0.1)' },
      itemStyle: { color: '#c0842f' }
    }]
  })
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await reloadAll()

  // 响应式 resize
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ;[salesChart, categoryChart, orderStatusChart, orderAmountChart,
    userTrendChart, activeChart, provinceChart, levelChart,
    ratingChart, reviewTrendChart
  ].forEach(c => c && !c.isDisposed() && c.dispose())
})

function handleResize() {
  ;[salesChart, categoryChart, orderStatusChart, orderAmountChart,
    userTrendChart, activeChart, provinceChart, levelChart,
    ratingChart, reviewTrendChart
  ].forEach(c => c && !c.isDisposed() && c.resize())
}
</script>

<style scoped>
.statistics-page {
  min-height: 100vh;
  padding: 22px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.96)),
    radial-gradient(circle at 85% 0%, rgba(37, 99, 235, 0.08), transparent 34%);
  color: #0f172a;
}

.dashboard-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 26px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background:
    linear-gradient(135deg, #0f172a 0%, #172033 58%, #1e293b 100%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  color: #fff;
}

.header-kicker,
.section-kicker {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.dashboard-header h1 {
  margin: 8px 0 8px;
  font-size: 28px;
  font-weight: 900;
  line-height: 1.2;
}

.dashboard-header p {
  margin: 0;
  max-width: 620px;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.7;
}

.header-panel {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}

.panel-label {
  color: #cbd5e1;
  font-size: 12px;
}

.header-panel strong {
  font-size: 22px;
  line-height: 1;
}

.refresh-btn {
  width: 100%;
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.refresh-btn:hover {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.section-title {
  margin: 24px 0 12px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-title strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
}

.period-selector {
  margin-left: auto;
}

:deep(.period-selector .el-radio-button__inner) {
  border-color: #dbe3ef;
  color: #475569;
  font-weight: 700;
}

:deep(.period-selector .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #0f172a;
  background: #0f172a;
  color: #fff;
  box-shadow: -1px 0 0 0 #0f172a;
}

.overview-cards :deep(.el-col),
.review-overview :deep(.el-col),
.statistics-page > .el-row :deep(.el-col) {
  margin-bottom: 16px;
}

.stat-card {
  min-height: 142px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: #2563eb;
}

.stat-card:hover,
.chart-card:hover,
.mini-card:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.26);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.1);
}

.tone-green::before { background: #059669; }
.tone-gold::before { background: #c0842f; }
.tone-warn::before { background: #dc2626; }

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.bg-blue { background: #2563eb; }
.bg-green { background: #059669; }
.bg-purple { background: #c0842f; }
.bg-orange { background: #dc2626; }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.stat-value {
  margin-top: 8px;
  color: #0f172a;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value-sm {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stat-growth {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 800;
}

.stat-growth.up { color: #059669; background: #ecfdf5; }
.stat-growth.down { color: #dc2626; background: #fef2f2; }
.stat-growth.neutral { color: #64748b; background: #f1f5f9; }

.chart-card,
.mini-card {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.chart-card {
  padding: 18px;
}

.chart-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.chart-title strong {
  display: block;
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
}

.chart-title span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.chart-body {
  height: 286px;
}

.chart-body-sm {
  height: 230px;
}

.mt-16 {
  margin-top: 0;
}

:deep(.el-table) {
  --el-table-border-color: #e2e8f0;
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #334155;
  --el-table-row-hover-bg-color: #f8fafc;
  color: #334155;
}

:deep(.el-table th.el-table__cell) {
  font-weight: 800;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.product-cell span {
  color: #0f172a;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  background: #f1f5f9;
  color: #475569;
}

.rank-gold {
  background: #fef3c7;
  color: #92400e;
}

.rank-silver {
  background: #e2e8f0;
  color: #334155;
}

.rank-bronze {
  background: #ffedd5;
  color: #9a3412;
}

.review-overview {
  margin-bottom: 0;
}

.mini-card {
  padding: 22px;
  text-align: center;
}

.mini-val {
  color: #0f172a;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.1;
}

.mini-label {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.text-green {
  color: #059669;
}

.badge-item {
  color: #0f172a;
  font-size: 17px;
  font-weight: 900;
}

.badge-warn {
  color: #c0842f;
}

@media (max-width: 980px) {
  .statistics-page {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
  }

  .header-panel {
    width: auto;
  }
}

@media (max-width: 640px) {
  .section-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .period-selector {
    margin-left: 0;
  }

  .dashboard-header h1 {
    font-size: 24px;
  }
}
</style>
