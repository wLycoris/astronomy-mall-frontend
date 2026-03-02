<template>
  <div class="statistics-page">

    <!-- ==================== 数据概览卡片 ==================== -->
    <div class="section-title">📊 数据概览</div>
    <el-row :gutter="16" class="overview-cards" v-loading="overviewLoading">
      <!-- 今日订单 -->
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon bg-blue">
            <el-icon size="28"><ShoppingCart /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overview.todayOrderCount ?? '--' }}</div>
            <div class="stat-label">今日订单数</div>
            <div class="stat-growth" :class="growthClass(overview.todayOrderGrowth)">
              <el-icon><component :is="growthIcon(overview.todayOrderGrowth)" /></el-icon>
              {{ formatGrowth(overview.todayOrderGrowth) }}
            </div>
          </div>
        </div>
      </el-col>
      <!-- 今日销售额 -->
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon bg-green">
            <el-icon size="28"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥ {{ formatAmount(overview.todaySalesAmount) }}</div>
            <div class="stat-label">今日销售额</div>
            <div class="stat-growth" :class="growthClass(overview.todaySalesGrowth)">
              <el-icon><component :is="growthIcon(overview.todaySalesGrowth)" /></el-icon>
              {{ formatGrowth(overview.todaySalesGrowth) }}
            </div>
          </div>
        </div>
      </el-col>
      <!-- 本月销售额 -->
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon bg-purple">
            <el-icon size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥ {{ formatAmount(overview.monthSalesAmount) }}</div>
            <div class="stat-label">本月销售额</div>
            <div class="stat-growth" :class="growthClass(overview.monthSalesGrowth)">
              <el-icon><component :is="growthIcon(overview.monthSalesGrowth)" /></el-icon>
              {{ formatGrowth(overview.monthSalesGrowth) }}
            </div>
          </div>
        </div>
      </el-col>
      <!-- 待处理预警 -->
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon bg-orange">
            <el-icon size="28"><Warning /></el-icon>
          </div>
          <div class="stat-info">
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
            <div class="stat-label">待处理事项</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- ==================== 销售统计 ==================== -->
    <div class="section-title">
      📈 销售统计
      <el-radio-group v-model="salesDays" size="small" @change="loadSalesTrend" class="period-selector">
        <el-radio-button :label="7">近7天</el-radio-button>
        <el-radio-button :label="30">近30天</el-radio-button>
        <el-radio-button :label="90">近90天</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" v-loading="salesLoading">
      <!-- 销售趋势折线图 -->
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-title">销售趋势</div>
          <div ref="salesChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 分类销售占比饼图 -->
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">分类销售占比</div>
          <div ref="categoryChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 商品销售排行 -->
    <div class="chart-card mt-16" v-loading="salesLoading">
      <div class="chart-title">商品销售排行 TOP 10</div>
      <el-table :data="productRank" stripe size="small" style="width:100%">
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
                :color="'#409eff'"
                :stroke-width="8"
                :show-text="false"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ==================== 订单统计 ==================== -->
    <div class="section-title">📦 订单统计</div>
    <el-row :gutter="16" v-loading="orderLoading">
      <!-- 订单状态分布 -->
      <el-col :span="10">
        <div class="chart-card">
          <div class="chart-title">订单状态分布</div>
          <div ref="orderStatusChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 订单金额分布 -->
      <el-col :span="14">
        <div class="chart-card">
          <div class="chart-title">订单金额分布</div>
          <div ref="orderAmountChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- ==================== 用户统计 ==================== -->
    <div class="section-title">
      👤 用户统计
      <el-radio-group v-model="userDays" size="small" @change="loadUserStatistics" class="period-selector">
        <el-radio-button :label="7">近7天</el-radio-button>
        <el-radio-button :label="30">近30天</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" v-loading="userLoading">
      <!-- 新增用户趋势 -->
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-title">新增用户趋势</div>
          <div ref="userTrendChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 活跃度 -->
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">用户活跃度 (近30天)</div>
          <div ref="activeChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16" v-loading="userLoading">
      <!-- 地区分布 -->
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">用户地区分布 (Top 10)</div>
          <div ref="provinceChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <!-- 等级分布 -->
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">用户等级分布</div>
          <div ref="levelChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- ==================== 评价统计 ==================== -->
    <div class="section-title">
      ⭐ 评价统计
      <el-radio-group v-model="reviewDays" size="small" @change="loadReviewStatistics" class="period-selector">
        <el-radio-button :label="7">近7天</el-radio-button>
        <el-radio-button :label="30">近30天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 评价概览数字卡片 -->
    <el-row :gutter="16" class="review-overview" v-loading="reviewLoading">
      <el-col :span="8">
        <div class="mini-card">
          <div class="mini-val">{{ reviewData.totalCount ?? 0 }}</div>
          <div class="mini-label">总评价数</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="mini-card">
          <div class="mini-val">{{ reviewData.avgRating ?? '0.0' }}</div>
          <div class="mini-label">平均评分</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="mini-card">
          <div class="mini-val text-green">{{ reviewData.goodRate ?? 0 }}%</div>
          <div class="mini-label">好评率</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16" v-loading="reviewLoading">
      <!-- 评分分布 -->
      <el-col :span="10">
        <div class="chart-card">
          <div class="chart-title">评分分布</div>
          <div ref="ratingChartRef" class="chart-body-sm"></div>
        </div>
      </el-col>
      <!-- 评价趋势 -->
      <el-col :span="14">
        <div class="chart-card">
          <div class="chart-title">评价趋势</div>
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
const COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9b59b6']
const ORDER_STATUS_MAP = {
  0: { name: '待支付', color: '#e6a23c' },
  1: { name: '待发货', color: '#409eff' },
  2: { name: '待收货', color: '#9b59b6' },
  3: { name: '已完成', color: '#67c23a' },
  4: { name: '已取消', color: '#909399' }
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
        itemStyle: { color: '#409eff', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 30
      },
      {
        name: '销售额', type: 'line', yAxisIndex: 1, data: salesAmounts,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#67c23a', width: 2 },
        areaStyle: { color: 'rgba(103,194,58,0.08)' },
        itemStyle: { color: '#67c23a' }
      }
    ]
  })
}

/** 分类销售占比饼图 */
function renderCategoryChart(data) {
  if (!data || !data.length) return
  categoryChart = initOrGet(categoryChartRef.value, categoryChart)
  categoryChart.setOption({
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
    { name: '待支付', value: data.waitPayCount, itemStyle: { color: '#e6a23c' } },
    { name: '待发货', value: data.waitDeliverCount, itemStyle: { color: '#409eff' } },
    { name: '待收货', value: data.waitReceiveCount, itemStyle: { color: '#9b59b6' } },
    { name: '已完成', value: data.completedCount, itemStyle: { color: '#67c23a' } },
    { name: '已取消', value: data.cancelledCount, itemStyle: { color: '#909399' } }
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
      lineStyle: { color: '#409eff', width: 2 },
      areaStyle: { color: 'rgba(64,158,255,0.1)' },
      itemStyle: { color: '#409eff' }
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
          color: [[0.3, '#f56c6c'], [0.7, '#e6a23c'], [1, '#67c23a']]
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
  const levelColors = ['#909399', '#67c23a', '#409eff', '#e6a23c', '#f56c6c']
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
  const starColors = ['#f56c6c', '#e6a23c', '#e6a23c', '#67c23a', '#67c23a']
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
      lineStyle: { color: '#e6a23c', width: 2 },
      areaStyle: { color: 'rgba(230,162,60,0.1)' },
      itemStyle: { color: '#e6a23c' }
    }]
  })
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await Promise.all([
    loadOverview(),
    loadSalesTrend(),
    loadOrderStatistics(),
    loadUserStatistics(),
    loadReviewStatistics()
  ])

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
  padding: 16px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 标题 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.period-selector {
  margin-left: auto;
}

/* 概览卡片 */
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.bg-blue   { background: linear-gradient(135deg, #409eff, #6ec3ff); }
.bg-green  { background: linear-gradient(135deg, #67c23a, #95d475); }
.bg-purple { background: linear-gradient(135deg, #9b59b6, #c68fe8); }
.bg-orange { background: linear-gradient(135deg, #e6a23c, #f5c56e); }

.stat-info { flex: 1; min-width: 0; }

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value-sm {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.stat-growth {
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-growth.up     { color: #67c23a; }
.stat-growth.down   { color: #f56c6c; }
.stat-growth.neutral { color: #909399; }

/* 图表卡片 */
.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.chart-body {
  height: 280px;
}

.chart-body-sm {
  height: 220px;
}

.mt-16 { margin-top: 16px; }

/* 商品排行 */
.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  background: #f2f3f5;
  color: #606266;
}

.rank-gold   { background: #ffd700; color: #7a4f00; }
.rank-silver { background: #c0c0c0; color: #444; }
.rank-bronze { background: #cd7f32; color: #fff; }

/* 评价概览迷你卡片 */
.review-overview { margin-bottom: 0; }

.mini-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.mini-val {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.mini-label {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
}

.text-green { color: #67c23a; }

.badge-item { font-size: 16px; color: #303133; }
.badge-warn { color: #e6a23c; }
</style>