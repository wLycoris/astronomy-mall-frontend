<template>
  <!--
    views/user/CourseFavorite.vue
    课程收藏页
    接口：
      GET  /api/course/favorite/list         (getCourseFavoriteList)
      POST /api/course/favorite/toggle/{id}  (toggleCourseFavorite)
    ⚠️ CourseVO 主键字段名为 id（非 courseId），统一用 item.id
  -->
  <div class="course-favorite-page">

    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <el-icon class="header-icon"><StarFilled /></el-icon>
        <div>
          <div class="section-kicker">SAVED COURSES</div>
          <h2 class="page-title">课程收藏</h2>
          <p class="page-subtitle">共收藏 {{ total }} 门课程，适合把想看的内容先收进书架。</p>
        </div>
      </div>
      <el-button class="primary-action" size="small" @click="router.push('/course')">
        <el-icon><Search /></el-icon>
        发现更多课程
      </el-button>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading" class="grid-container">
      <el-skeleton v-for="i in 6" :key="i" :loading="true" animated class="skeleton-card">
        <template #template>
          <el-skeleton-item variant="image" class="skeleton-cover" />
          <div class="skeleton-body">
            <el-skeleton-item variant="text" style="width: 80%" />
            <el-skeleton-item variant="text" style="width: 60%; margin-top: 8px" />
            <el-skeleton-item variant="text" style="width: 40%; margin-top: 8px" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 空状态 -->
    <el-empty
        v-else-if="!loading && list.length === 0"
        description="还没有收藏任何课程"
        :image-size="140"
        class="empty-state"
    >
      <template #image>
        <div class="empty-icon">SAVE</div>
      </template>
      <el-button class="primary-action" @click="router.push('/course')">去发现课程</el-button>
    </el-empty>

    <!-- 课程卡片网格 -->
    <div v-else class="grid-container">
      <div
          v-for="item in list"
          :key="item.id"
          class="course-card"
          @click="goDetail(item.id)"
      >
        <!-- 封面 -->
        <div class="card-cover-wrapper">
          <img
              :src="item.cover || defaultCover"
              :alt="item.title"
              class="card-cover"
              loading="lazy"
              @error="handleImgError"
          />
          <el-tag
              :type="item.type === 0 ? 'danger' : 'primary'"
              size="small"
              class="type-tag"
              effect="dark"
          >
            {{ item.type === 0 ? '视频课' : '图文课' }}
          </el-tag>
          <!-- 取消收藏（悬停显示） -->
          <el-tooltip content="取消收藏" placement="top">
            <el-button
                class="unfavorite-btn"
                circle
                size="small"
                :loading="cancelingIds.has(item.id)"
                @click.stop="handleUnfavorite(item)"
            >
              <el-icon color="#f56c6c"><StarFilled /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- 信息区 -->
        <div class="card-body">
          <div class="card-title" :title="item.title">{{ item.title }}</div>
          <div v-if="item.subtitle" class="card-subtitle">{{ item.subtitle }}</div>

          <div class="card-meta">
            <span class="meta-item">
              <el-icon><Reading /></el-icon>
              {{ difficultyMap[item.difficulty] || '未知' }}
            </span>
            <span class="meta-item">
              <el-icon><Files /></el-icon>
              {{ item.chapterCount || 0 }} 章节
            </span>
          </div>

          <!-- 学习状态 -->
          <div class="study-status">
            <template v-if="item.lastChapterId">
              <!-- 有进度：上次章节 + 进度条 -->
              <div class="last-chapter-hint">
                <el-icon class="lc-icon"><Notebook /></el-icon>
                <span class="lc-text">上次：</span>
                <span class="lc-title" :title="item.lastChapterTitle">
                  {{ item.lastChapterTitle || '章节 ' + item.lastChapterId }}
                </span>
              </div>
              <div v-if="item.chapterCount > 0" class="progress-row">
                <el-progress
                    :percentage="calcProgress(item.completedCount, item.chapterCount)"
                    :stroke-width="3"
                    :show-text="false"
                    color="#c7a572"
                    class="progress-bar"
                />
                <span class="progress-text">{{ item.completedCount || 0 }}/{{ item.chapterCount }}</span>
              </div>
            </template>
            <template v-else>
              <!-- 无进度：未学习 badge -->
              <el-tag type="info" size="small" effect="plain" class="no-study-tag">
                未学习
              </el-tag>
            </template>
          </div>

          <!-- 标签 chips -->
          <div v-if="parseTags(item.tags).length" class="card-tags">
            <el-tag
                v-for="tag in parseTags(item.tags).slice(0, 3)"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
                class="tag-chip"
            >{{ tag }}</el-tag>
          </div>

          <!-- 底部 -->
          <div class="card-footer">
            <el-button type="primary" link size="small" @click.stop="goDetail(item.id)">
              {{ item.lastChapterId ? '继续学习 →' : '开始学习 →' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="fetchList"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StarFilled, Search, Reading, Files, Notebook } from '@element-plus/icons-vue'
import { getCourseFavoriteList, toggleCourseFavorite } from '@/api/course'

const router = useRouter()

const loading     = ref(false)
const list        = ref([])
const total       = ref(0)
const currentPage = ref(1)
const pageSize    = ref(12)

/** 正在取消中的课程 ID（防重复点击） */
const cancelingIds = ref(new Set())

const difficultyMap = { 1: '入门', 2: '进阶', 3: '高级' }

const defaultCover = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23111827"/><circle cx="150" cy="84" r="36" fill="%23f3e9cf" opacity="0.86"/><path d="M52 138h196" stroke="%23c7a572" stroke-width="3" opacity="0.6"/><text x="150" y="154" font-size="15" text-anchor="middle" fill="%23f3e9cf">COURSE</text></svg>'

// ─────────────────────────────────────────────────

async function fetchList(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const res = await getCourseFavoriteList(currentPage.value, pageSize.value)
    if (res.code === 200) {
      // MyBatis-Plus IPage 分页对象：records / total
      list.value  = res.data.records || res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取收藏列表失败')
    }
  } catch (e) {
    console.error('[CourseFavorite] fetchList error', e)
  } finally {
    loading.value = false
  }
}

async function handleUnfavorite(item) {
  try {
    await ElMessageBox.confirm(
        `确定取消收藏「${item.title}」吗？`,
        '取消收藏',
        {
          confirmButtonText: '确定',
          cancelButtonText: '我再想想',
          type: 'warning',
          center: true,
          customClass: 'course-favorite-message-box'
        }
    )
  } catch { return }

  if (cancelingIds.value.has(item.id)) return
  cancelingIds.value.add(item.id)

  try {
    const res = await toggleCourseFavorite(item.id)
    if (res.code === 200) {
      list.value  = list.value.filter(c => c.id !== item.id)
      total.value = Math.max(0, total.value - 1)
      ElMessage.success('已取消收藏')
      if (list.value.length === 0 && currentPage.value > 1) {
        fetchList(currentPage.value - 1)
      }
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    console.error('[CourseFavorite] handleUnfavorite error', e)
  } finally {
    cancelingIds.value.delete(item.id)
  }
}

function goDetail(courseId) {
  router.push(`/course/${courseId}`)
}

function calcProgress(completed, total) {
  if (!total || total <= 0) return 0
  return Math.min(100, Math.round(((completed || 0) / total) * 100))
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { return JSON.parse(tags) } catch { return [] }
}

function handleImgError(e) {
  e.target.src = defaultCover
}

onMounted(() => fetchList(1))
</script>

<style scoped>
.course-favorite-page {
  min-height: 420px;
  color: #172033;
}

.page-header {
  display: flex;
  align-items: center;
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

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.header-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #111827;
  color: #f4d08a;
  font-size: 22px;
  flex-shrink: 0;
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

.skeleton-card {
  overflow: hidden;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
  box-shadow: 0 12px 28px rgba(35, 30, 22, .07);
}

.skeleton-cover {
  width: 100%;
  height: 160px;
}

.skeleton-body {
  padding: 14px;
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

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.course-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(35, 30, 22, .07);
  transition: transform .2s, box-shadow .2s, border-color .2s;
}

.course-card:hover {
  border-color: rgba(154, 107, 54, .44);
  box-shadow: 0 18px 36px rgba(35, 30, 22, .12);
  transform: translateY(-3px);
}

.card-cover-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #111827;
}

.card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .3s;
}

.course-card:hover .card-cover {
  transform: scale(1.04);
}

.type-tag {
  position: absolute;
  left: 10px;
  bottom: 10px;
  border-color: rgba(247, 236, 210, .32);
  border-radius: 999px;
  background: rgba(17, 24, 39, .84) !important;
  color: #f3e9cf !important;
  font-size: 11px;
  font-weight: 800;
  pointer-events: none;
}

.unfavorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(247, 236, 210, .28);
  background: rgba(17, 24, 39, .76);
  opacity: 0;
  transition: opacity .2s, background .2s;
  box-shadow: 0 8px 18px rgba(0,0,0,.24);
}

.unfavorite-btn:hover {
  background: rgba(17, 24, 39, .95);
}

.course-card:hover .unfavorite-btn {
  opacity: 1;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px 15px 15px;
}

.card-title {
  min-height: 40px;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-subtitle {
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5f6b7a;
  font-size: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-item .el-icon {
  color: #9a6b36;
  font-size: 13px;
}

.study-status {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.last-chapter-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  color: #5f6b7a;
  font-size: 12px;
}

.lc-icon {
  color: #9a6b36;
  font-size: 13px;
  flex-shrink: 0;
}

.lc-text {
  color: #8b95a5;
  flex-shrink: 0;
}

.lc-title {
  max-width: 180px;
  color: #8a5f2e;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.progress-bar {
  flex: 1;
}

.progress-text {
  color: #8b95a5;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.no-study-tag {
  width: fit-content;
  border-color: #e8ded0;
  background: #faf6ef;
  color: #6b5132;
  font-size: 11px;
  font-weight: 700;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-chip {
  border-color: #e8ded0;
  border-radius: 999px;
  background: #faf6ef;
  color: #6b5132;
  font-size: 11px;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed #ebe3d7;
}

.card-footer :deep(.el-button) {
  color: #8a5f2e;
  font-weight: 800;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

:deep(.el-progress-bar__outer) {
  background-color: #efe8dc;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #111827;
}

:global(.course-favorite-message-box) {
  border-radius: 8px !important;
  border: 1px solid #e9e1d4 !important;
}

:global(.course-favorite-message-box .el-message-box__title) {
  color: #111827 !important;
  font-weight: 800 !important;
}

:global(.course-favorite-message-box .el-button--primary) {
  border-color: #111827 !important;
  background: #111827 !important;
}

@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
