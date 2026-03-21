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
          <h2 class="page-title">课程收藏</h2>
          <p class="page-subtitle">共收藏 {{ total }} 门课程</p>
        </div>
      </div>
      <el-button type="primary" plain size="small" @click="router.push('/course')">
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
        <div class="empty-icon">⭐</div>
      </template>
      <el-button type="primary" @click="router.push('/course')">去发现课程</el-button>
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
            {{ item.type === 0 ? '🎬 视频课' : '📖 书本课' }}
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
                    color="#409eff"
                    class="progress-bar"
                />
                <span class="progress-text">{{ item.completedCount || 0 }}/{{ item.chapterCount }}</span>
              </div>
            </template>
            <template v-else>
              <!-- 无进度：未学习 badge -->
              <el-tag type="info" size="small" effect="plain" class="no-study-tag">
                📌 未学习
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

const difficultyMap = { 1: '⭐ 入门', 2: '⭐⭐ 进阶', 3: '⭐⭐⭐ 高级' }

const defaultCover = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%231a1a2e"/><text x="150" y="100" font-size="40" text-anchor="middle" fill="%23444">🌌</text></svg>'

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
        { confirmButtonText: '确定', cancelButtonText: '我再想想', type: 'warning', center: true }
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
.course-favorite-page { padding: 0 4px; min-height: 400px; }

/* 页头 */
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0); }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-icon { font-size: 28px; color: #f7ba2a; flex-shrink: 0; }
.page-title { font-size: 20px; font-weight: 600; color: var(--el-text-color-primary, #303133); margin: 0; }
.page-subtitle { font-size: 13px; color: var(--el-text-color-secondary, #909399); margin: 2px 0 0; }

/* 骨架屏 */
.skeleton-card { background: var(--el-bg-color, #fff); border-radius: 10px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
.skeleton-cover { width: 100%; height: 160px; }
.skeleton-body { padding: 12px; }

/* 空状态 */
.empty-state { padding: 60px 0; }
.empty-icon { font-size: 64px; line-height: 1; }

/* 网格 */
.grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
@media (max-width: 1200px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .grid-container { grid-template-columns: 1fr; } }

/* 卡片 */
.course-card { background: var(--el-bg-color, #fff); border-radius: 10px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; }
.course-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.14); }

/* 封面 */
.card-cover-wrapper { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; background: #1a1a2e; }
.card-cover { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.course-card:hover .card-cover { transform: scale(1.04); }
.type-tag { position: absolute; bottom: 8px; left: 8px; font-size: 11px; pointer-events: none; }
.unfavorite-btn { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.92); border: none; width: 28px; height: 28px; opacity: 0; transition: opacity 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.course-card:hover .unfavorite-btn { opacity: 1; }

/* 信息区 */
.card-body { padding: 12px 14px 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary, #303133); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-subtitle { font-size: 12px; color: var(--el-text-color-secondary, #909399); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-meta { display: flex; align-items: center; gap: 14px; font-size: 12px; color: var(--el-text-color-regular, #606266); }
.meta-item { display: flex; align-items: center; gap: 3px; }
.meta-item .el-icon { font-size: 13px; color: var(--el-color-primary, #409eff); }

/* 学习状态 */
.study-status { display: flex; flex-direction: column; gap: 4px; }
.last-chapter-hint { display: flex; align-items: center; gap: 4px; font-size: 12px; overflow: hidden; }
.lc-icon { color: var(--el-color-primary, #409eff); font-size: 13px; flex-shrink: 0; }
.lc-text { color: var(--el-text-color-secondary, #909399); flex-shrink: 0; }
.lc-title { color: var(--el-color-primary, #409eff); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.progress-row { display: flex; align-items: center; gap: 6px; }
.progress-bar { flex: 1; }
.progress-text { font-size: 11px; color: var(--el-text-color-placeholder, #c0c4cc); white-space: nowrap; }
.no-study-tag { font-size: 11px; }

/* 标签 */
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tag-chip { font-size: 11px; border-radius: 20px; }

/* 底部 */
.card-footer { display: flex; justify-content: flex-end; margin-top: auto; padding-top: 8px; border-top: 1px dashed var(--el-border-color-lighter, #f0f0f0); }

/* 分页 */
.pagination-wrap { display: flex; justify-content: center; margin-top: 32px; }
</style>