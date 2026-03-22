<template>
  <div class="my-course-reviews">

    <div class="page-header">
      <h2 class="page-title">我的课程评价</h2>
      <span class="page-total" v-if="total > 0">共 {{ total }} 条</span>
    </div>

    <div v-loading="loading">
      <!-- 空状态 -->
      <el-empty
          v-if="!loading && list.length === 0"
          description="还没有评价过任何课程"
          :image-size="100"
      >
        <el-button type="primary" @click="$router.push('/course')">去看看课程</el-button>
      </el-empty>

      <!-- 评价列表 -->
      <div v-else class="review-list">
        <div
            v-for="item in list"
            :key="item.id"
            class="review-card"
        >
          <!-- 左侧课程封面 -->
          <div class="course-cover" @click="goToCourse(item.courseId)">
            <el-image
                :src="item.courseCover"
                fit="cover"
                class="cover-img"
            >
              <template #error>
                <div class="cover-fallback">🔭</div>
              </template>
            </el-image>
          </div>

          <!-- 右侧评价内容 -->
          <div class="review-body">
            <div class="review-top">
              <span class="course-title" @click="goToCourse(item.courseId)">
                {{ item.courseTitle || '课程已删除' }}
              </span>
              <span class="review-date">{{ formatTime(item.createTime) }}</span>
            </div>

            <!-- 星级 -->
            <div class="review-stars">
              <span v-for="n in item.rating" :key="'on'+n" class="star on">★</span>
              <span v-for="n in (5 - item.rating)" :key="'off'+n" class="star off">★</span>
              <span class="rating-num">{{ item.rating }} 分</span>
            </div>

            <!-- 评价内容 -->
            <p class="review-content" v-if="item.content">{{ item.content }}</p>
            <p class="review-content empty" v-else>（未填写文字评价）</p>

            <!-- 操作按钮 -->
            <div class="review-actions">
              <el-button
                  size="small"
                  @click="openEdit(item)"
              >编辑评价</el-button>
              <el-button
                  size="small"
                  type="primary"
                  link
                  @click="goToCourse(item.courseId)"
              >查看课程</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <el-pagination
            v-model:current-page="pageNum"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            background
            @current-change="loadList"
        />
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
        v-model="editVisible"
        title="编辑评价"
        width="480px"
        :close-on-click-modal="false"
    >
      <div class="edit-form">
        <div class="edit-stars-row">
          <span class="edit-label">评分</span>
          <span
              v-for="n in 5"
              :key="n"
              class="edit-star"
              :class="{ lit: editForm.rating >= n || editHover >= n }"
              @mouseenter="editHover = n"
              @mouseleave="editHover = 0"
              @click="editForm.rating = n"
          >★</span>
          <span class="edit-hint" v-if="editForm.rating > 0">{{ ratingHintMap[editForm.rating] }}</span>
        </div>
        <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="4"
            placeholder="说说你的学习感受（选填）"
            maxlength="500"
            show-word-limit
        />
      </div>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button
            type="primary"
            :loading="editLoading"
            :disabled="editForm.rating === 0"
            @click="submitEdit"
        >保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyCourseReviews, updateCourseReview } from '@/api/course'

const router = useRouter()

// ======================== 列表状态 ========================
const loading  = ref(false)
const list     = ref([])
const total    = ref(0)
const pageNum  = ref(1)
const pageSize = 10

const totalPages = computed(() => Math.ceil(total.value / pageSize))

// ======================== 编辑状态 ========================
const editVisible  = ref(false)
const editLoading  = ref(false)
const editHover    = ref(0)
const editCourseId = ref(null)
const editForm     = reactive({ rating: 0, content: '' })

const ratingHintMap = { 1: '很差', 2: '较差', 3: '一般', 4: '不错', 5: '非常棒！' }

// ======================== 方法 ========================

async function loadList() {
  loading.value = true
  try {
    const res = await getMyCourseReviews(pageNum.value, pageSize)
    if (res.code === 200) {
      list.value  = res.data.records || []
      total.value = res.data.total   || 0
    }
  } catch (e) {
    console.error('[MyCourseReviews] 加载失败', e)
  } finally {
    loading.value = false
  }
}

function openEdit(item) {
  editCourseId.value    = item.courseId
  editForm.rating       = item.rating
  editForm.content      = item.content || ''
  editHover.value       = 0
  editVisible.value     = true
}

async function submitEdit() {
  if (editForm.rating === 0) { ElMessage.warning('请先选择评分'); return }
  editLoading.value = true
  try {
    const res = await updateCourseReview(editCourseId.value, {
      rating:  editForm.rating,
      content: editForm.content.trim() || undefined
    })
    if (res.code === 200) {
      ElMessage.success('评价已更新')
      editVisible.value = false
      await loadList()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (e) {
    ElMessage.error('更新失败，请重试')
  } finally {
    editLoading.value = false
  }
}

function goToCourse(courseId) {
  if (!courseId) return
  router.push({ name: 'CourseDetail', params: { id: courseId } })
}

function formatTime(val) {
  if (!val) return ''
  if (Array.isArray(val)) {
    const [y, M, d] = val
    return `${y}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  return String(val).slice(0, 10)
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.my-course-reviews {
  padding: 0 4px;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}
.page-total {
  font-size: 13px;
  color: #999;
}

/* 评价列表 */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.review-card {
  display: flex;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid #f5f5f5;
}
.review-card:last-child {
  border-bottom: none;
}

/* 左侧封面 */
.course-cover {
  flex-shrink: 0;
  width: 100px;
  height: 65px;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a2e;
  cursor: pointer;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

/* 右侧内容 */
.review-body {
  flex: 1;
  min-width: 0;
}
.review-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
}
.course-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.course-title:hover {
  color: #7c3aed;
}
.review-date {
  font-size: 12px;
  color: #bbb;
  flex-shrink: 0;
}

/* 星级 */
.review-stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 6px;
}
.star {
  font-size: 15px;
  line-height: 1;
}
.star.on  { color: #f59e0b; }
.star.off { color: #e0e0e0; }
.rating-num {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

/* 评价文字 */
.review-content {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  margin: 0 0 10px;
  word-break: break-word;
}
.review-content.empty {
  color: #ccc;
  font-style: italic;
}

/* 操作 */
.review-actions {
  display: flex;
  gap: 4px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 编辑弹窗 */
.edit-form {
  padding: 4px 0;
}
.edit-stars-row {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 14px;
}
.edit-label {
  font-size: 13px;
  color: #666;
  margin-right: 6px;
}
.edit-star {
  font-size: 28px;
  color: #e0e0e0;
  cursor: pointer;
  transition: color 0.12s;
  line-height: 1;
  user-select: none;
}
.edit-star.lit {
  color: #f59e0b;
}
.edit-hint {
  font-size: 12px;
  color: #f59e0b;
  margin-left: 6px;
}
</style>