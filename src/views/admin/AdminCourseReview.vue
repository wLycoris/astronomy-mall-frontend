<template>
  <div class="admin-course-review">

    <!-- ===== 顶部统计卡片 ===== -->
    <el-row :gutter="20" class="stats-row" v-loading="statsLoading">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="总评价数" :value="stats.total">
            <template #prefix>
              <el-icon color="#7c3aed"><Star /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="本周新增" :value="stats.thisWeek">
            <template #prefix>
              <el-icon color="#0ea5e9"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <!-- avgRating 保留1位小数 -->
          <el-statistic title="平均评分" :value="stats.avgRating" :precision="1">
            <template #prefix>
              <el-icon color="#f59e0b"><StarFilled /></el-icon>
            </template>
            <template #suffix>⭐</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 搜索栏 ===== -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <!-- 课程名称关键词 -->
        <el-form-item label="课程名称">
          <el-input
              v-model="searchForm.keyword"
              placeholder="课程名 / 用户名"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <!-- 星级筛选 -->
        <el-form-item label="星级">
          <el-select
              v-model="searchForm.rating"
              placeholder="全部星级"
              clearable
              style="width: 130px"
          >
            <el-option label="全部" :value="0" />
            <el-option label="⭐ 1星" :value="1" />
            <el-option label="⭐⭐ 2星" :value="2" />
            <el-option label="⭐⭐⭐ 3星" :value="3" />
            <el-option label="⭐⭐⭐⭐ 4星" :value="4" />
            <el-option label="⭐⭐⭐⭐⭐ 5星" :value="5" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ===== 评价表格 ===== -->
    <el-card shadow="never" class="table-card">
      <el-table
          v-loading="tableLoading"
          :data="tableData"
          stripe
          style="width: 100%"
      >
        <!-- ID -->
        <el-table-column prop="id" label="ID" width="70" />

        <!-- 课程标题 -->
        <el-table-column label="课程标题" min-width="160">
          <template #default="{ row }">
            <span class="course-title-text">{{ row.courseTitle || '—' }}</span>
          </template>
        </el-table-column>

        <!-- 用户 -->
        <el-table-column label="用户" min-width="120">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="username">{{ row.nickname || row.username }}</span>
              <span class="username-sub">@{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 星级 -->
        <el-table-column label="评分" width="140">
          <template #default="{ row }">
            <span class="star-rating">
              <!-- 实心星 -->
              <span v-for="i in row.rating" :key="'on' + i" class="star on">★</span>
              <!-- 空心星 -->
              <span v-for="i in (5 - row.rating)" :key="'off' + i" class="star off">☆</span>
              <span class="rating-num">{{ row.rating }}分</span>
            </span>
          </template>
        </el-table-column>

        <!-- 评价内容（截断 + tooltip） -->
        <el-table-column label="评价内容" min-width="200">
          <template #default="{ row }">
            <el-tooltip
                v-if="row.content && row.content.length > 40"
                :content="row.content"
                placement="top"
                effect="light"
                :show-after="300"
            >
              <span class="content-ellipsis">{{ row.content.slice(0, 40) }}…</span>
            </el-tooltip>
            <span v-else class="content-text">{{ row.content || '（无文字评价）' }}</span>
          </template>
        </el-table-column>

        <!-- 提交时间 -->
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
                title="确定删除该评价吗？删除后不可恢复"
                confirm-button-text="确认删除"
                cancel-button-text="取消"
                confirm-button-type="danger"
                @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" size="small" plain>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[15, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Star, StarFilled, Search, TrendCharts } from '@element-plus/icons-vue'
import {
  getAdminCourseReviews,
  deleteCourseReview,
  getCourseReviewStats
} from '@/api/admin/course'

// ======================== 状态 ========================

const statsLoading = ref(false)
const tableLoading = ref(false)

/** 顶部统计数据 */
const stats = reactive({
  total: 0,
  thisWeek: 0,
  avgRating: 0.0
})

/** 搜索表单 */
const searchForm = reactive({
  keyword: '',
  rating: null       // null = 全部；1-5 = 精确星级
})

/** 表格数据 */
const tableData = ref([])

/** 分页 */
const pageNum  = ref(1)
const pageSize = ref(15)
const total    = ref(0)

// ======================== 方法 ========================

/** 加载统计数据（3个卡片） */
async function loadStats() {
  statsLoading.value = true
  try {
    const res = await getCourseReviewStats()
    if (res.code === 200) {
      stats.total     = res.data.total     || 0
      stats.thisWeek  = res.data.thisWeek  || 0
      stats.avgRating = res.data.avgRating || 0.0
    }
  } catch (e) {
    console.warn('[统计] 加载失败', e)
  } finally {
    statsLoading.value = false
  }
}

/** 加载评价列表 */
async function loadList() {
  tableLoading.value = true
  try {
    const params = {
      pageNum:  pageNum.value,
      pageSize: pageSize.value
    }
    // 关键词（非空才传）
    if (searchForm.keyword.trim()) {
      params.keyword = searchForm.keyword.trim()
    }
    // 星级（0 或 null 视为全部，不传）
    if (searchForm.rating && searchForm.rating > 0) {
      params.rating = searchForm.rating
    }

    const res = await getAdminCourseReviews(params)
    if (res.code === 200) {
      // MyBatis-Plus Page 对象字段：records / total
      tableData.value = res.data.records || []
      total.value     = res.data.total   || 0
    }
  } catch (e) {
    ElMessage.error('加载评价列表失败')
  } finally {
    tableLoading.value = false
  }
}

/** 搜索（重置到第1页） */
function handleSearch() {
  pageNum.value = 1
  loadList()
}

/** 重置搜索条件 */
function handleReset() {
  searchForm.keyword = ''
  searchForm.rating  = null
  pageNum.value = 1
  loadList()
}

/** 逻辑删除评价（二次确认由 el-popconfirm 承担） */
async function handleDelete(id) {
  try {
    const res = await deleteCourseReview(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      // 同步刷新列表和统计
      await Promise.all([loadList(), loadStats()])
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('操作失败，请重试')
  }
}

/** 每页条数变化 */
function handleSizeChange(size) {
  pageSize.value = size
  pageNum.value  = 1
  loadList()
}

/** 翻页 */
function handlePageChange(page) {
  pageNum.value = page
  loadList()
}

/** 格式化时间（LocalDateTime 数组 / 字符串 均兼容） */
function formatTime(val) {
  if (!val) return '—'
  // 如果后端返回的是 [2026,3,22,10,30,0] 数组（MyBatis LocalDateTime默认序列化方式）
  if (Array.isArray(val)) {
    const [y, M, d, h, m, s] = val
    return `${y}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')} ` +
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s || 0).padStart(2,'0')}`
  }
  // 字符串格式直接截断到秒
  return String(val).slice(0, 19)
}

// ======================== 初始化 ========================
onMounted(() => {
  loadStats()
  loadList()
})
</script>

<style scoped>
.admin-course-review {
  padding: 20px;
}

/* ===== 统计卡片 ===== */
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  text-align: center;
  border-radius: 8px;
}

/* ===== 搜索栏 ===== */
.search-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

/* ===== 表格 ===== */
.table-card {
  border-radius: 8px;
}

/* 课程标题 */
.course-title-text {
  font-size: 13px;
  color: #333;
}

/* 用户单元格 */
.user-cell {
  display: flex;
  flex-direction: column;
}
.username {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}
.username-sub {
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
}

/* 星级渲染 */
.star-rating {
  display: flex;
  align-items: center;
  gap: 1px;
}
.star {
  font-size: 16px;
  line-height: 1;
}
.star.on  { color: #f59e0b; }
.star.off { color: #d1d5db; }
.rating-num {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

/* 评价内容截断 */
.content-ellipsis {
  font-size: 13px;
  color: #555;
  cursor: pointer;
  border-bottom: 1px dashed #ccc;
}
.content-text {
  font-size: 13px;
  color: #555;
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>