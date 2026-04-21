<template>
  <div class="my-course-reviews">

    <div class="page-header">
      <div>
        <div class="section-kicker">COURSE NOTES</div>
        <h2 class="page-title">我的课程评价</h2>
        <p class="page-subtitle">整理你给课程留下的评分和学习感受。</p>
      </div>
      <span class="page-total" v-if="total > 0">{{ total }} 条评价</span>
    </div>

    <div v-loading="loading">
      <!-- 空状态 -->
      <el-empty
          v-if="!loading && list.length === 0"
          description="还没有评价过任何课程"
          :image-size="100"
          class="empty-state"
      >
        <template #image>
          <div class="empty-icon">NOTE</div>
        </template>
        <el-button class="primary-action" @click="$router.push('/course')">去看看课程</el-button>
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
                <div class="cover-fallback">课程</div>
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
                  class="secondary-action"
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
        class="course-review-dialog"
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
            class="dialog-primary"
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

const ratingHintMap = { 1: '很差', 2: '较差', 3: '一般', 4: '不错', 5: '非常棒' }

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
  min-height: 420px;
  color: #172033;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding: 22px 24px;
  border: 1px solid #e9e1d4;
  border-radius: 8px;
  background:
    radial-gradient(520px 180px at 8% 0%, rgba(199, 165, 114, .13), transparent 64%),
    linear-gradient(180deg, #fffdfa 0%, #f8f4ec 100%);
  box-shadow: 0 16px 38px rgba(35, 30, 22, .08);
}

.section-kicker {
  margin-bottom: 5px;
  color: #9a6b36;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.8px;
}

.page-title {
  margin: 0;
  color: #101827;
  font-size: 24px;
  font-weight: 800;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.6;
}

.page-total {
  color: #8a5f2e;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.primary-action {
  border: 1px solid #111827;
  border-radius: 4px;
  background: #111827;
  color: #fffdfa;
  font-weight: 800;
}

.primary-action:hover {
  border-color: #9a6b36;
  background: #9a6b36;
  color: #fffdfa;
}

.empty-state {
  padding: 70px 0;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
}

.empty-icon {
  width: 112px;
  height: 112px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background:
    radial-gradient(circle at 42% 34%, #fff7e0, #f3e9cf 58%, #d7c192 100%);
  color: #111827;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 1.8px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-card {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
  box-shadow: 0 12px 28px rgba(35, 30, 22, .07);
  transition: border-color .2s, box-shadow .2s, transform .2s;
}

.review-card:hover {
  border-color: rgba(154, 107, 54, .44);
  box-shadow: 0 16px 34px rgba(35, 30, 22, .11);
  transform: translateY(-1px);
}

.course-cover {
  width: 116px;
  height: 74px;
  overflow: hidden;
  border-radius: 7px;
  background: #111827;
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
  background:
    radial-gradient(80px 54px at 50% 40%, rgba(247, 236, 210, .22), transparent 65%),
    #111827;
  color: #f3e9cf;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
}

.review-body {
  min-width: 0;
}

.review-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
}

.course-title {
  flex: 1;
  color: #111827;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-title:hover {
  color: #8a5f2e;
}

.review-date {
  color: #9aa3b2;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.review-stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 8px;
}

.star {
  font-size: 16px;
  line-height: 1;
}

.star.on {
  color: #c28a2e;
}

.star.off {
  color: #ded6c9;
}

.rating-num {
  margin-left: 6px;
  color: #8a5f2e;
  font-size: 12px;
  font-weight: 800;
}

.review-content {
  margin: 0 0 12px;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.75;
  word-break: break-word;
}

.review-content.empty {
  color: #a6adba;
  font-style: italic;
}

.review-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.secondary-action {
  border-color: #d8caba;
  color: #172033;
  font-weight: 700;
}

.secondary-action:hover {
  border-color: #9a6b36;
  color: #8a5f2e;
  background: #faf6ef;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #111827;
}

.edit-form {
  padding: 4px 0;
}

.edit-stars-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}

.edit-label {
  margin-right: 8px;
  color: #4b5563;
  font-size: 13px;
  font-weight: 700;
}

.edit-star {
  color: #ded6c9;
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
  transition: color .12s, transform .12s;
  user-select: none;
}

.edit-star:hover {
  transform: translateY(-1px);
}

.edit-star.lit {
  color: #c28a2e;
}

.edit-hint {
  margin-left: 8px;
  color: #8a5f2e;
  font-size: 12px;
  font-weight: 800;
}

:deep(.course-review-dialog) {
  border-radius: 8px;
}

:deep(.course-review-dialog .el-dialog__header) {
  margin: 0;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #ebe3d7;
  background: #f8f4ec;
}

:deep(.course-review-dialog .el-dialog__title) {
  color: #111827;
  font-weight: 800;
}

:deep(.course-review-dialog .el-dialog__body) {
  padding: 22px 24px;
}

:deep(.course-review-dialog .el-dialog__footer) {
  padding: 16px 24px 22px;
  border-top: 1px solid #ebe3d7;
}

.dialog-primary {
  border-color: #111827;
  background: #111827;
  font-weight: 800;
}

.dialog-primary:hover {
  border-color: #9a6b36;
  background: #9a6b36;
}

@media (max-width: 720px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .review-card {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .course-cover {
    width: 96px;
    height: 62px;
  }

  .review-top {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
