<template>
  <!--
    views/user/CourseHistory.vue
    学习历史页
    接口：GET /api/course/history  (getCourseHistory)
    ⚠️ CourseVO 主键字段名为 id（非 courseId），统一用 item.id
    ⚠️ 章节总数字段为 chapterCount（非 totalChapters），统一用 item.chapterCount
  -->
  <div class="course-history-page">

    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <el-icon class="header-icon"><VideoPlay /></el-icon>
        <div>
          <h2 class="page-title">学习历史</h2>
          <p class="page-subtitle">共 {{ total }} 条记录</p>
        </div>
      </div>
      <el-button type="primary" plain size="small" @click="router.push('/course')">
        <el-icon><Search /></el-icon>
        发现新课程
      </el-button>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading" class="list-container">
      <el-skeleton v-for="i in 5" :key="i" :loading="true" animated class="skeleton-item">
        <template #template>
          <div class="skeleton-row">
            <el-skeleton-item variant="image" class="sk-cover" />
            <div class="sk-body">
              <el-skeleton-item variant="text" style="width: 60%" />
              <el-skeleton-item variant="text" style="width: 45%; margin-top: 8px" />
              <el-skeleton-item variant="text" style="width: 80%; margin-top: 8px" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 空状态 -->
    <el-empty
        v-else-if="!loading && list.length === 0"
        description="还没有学习记录，快去学习吧！"
        :image-size="140"
        class="empty-state"
    >
      <template #image>
        <div class="empty-icon">🚀</div>
      </template>
      <el-button type="primary" @click="router.push('/course')">浏览课程</el-button>
    </el-empty>

    <!-- 历史列表 -->
    <div v-else class="list-container">
      <div
          v-for="item in list"
          :key="item.id"
          class="history-item"
          @click="goLastChapter(item)"
      >
        <!-- 封面缩略图 -->
        <div class="item-cover-wrapper">
          <img
              :src="item.cover || defaultCover"
              :alt="item.title"
              class="item-cover"
              loading="lazy"
              @error="handleImgError"
          />
          <span class="cover-type-badge" :class="item.type === 0 ? 'badge-video' : 'badge-book'">
            {{ item.type === 0 ? '🎬' : '📖' }}
          </span>
        </div>

        <!-- 信息区 -->
        <div class="item-body">
          <div class="item-title" :title="item.title">{{ item.title }}</div>

          <!-- 学习状态：有进度 or 未学习 -->
          <template v-if="item.lastChapterId">
            <!-- 上次章节 -->
            <div class="last-chapter">
              <el-icon class="lc-icon"><Notebook /></el-icon>
              <span class="lc-text">上次学至：</span>
              <span class="lc-title">{{ item.lastChapterTitle || '章节 ' + item.lastChapterId }}</span>
            </div>
            <!-- 进度条 -->
            <div v-if="item.chapterCount > 0" class="progress-row">
              <el-progress
                  :percentage="calcProgress(item.completedCount, item.chapterCount)"
                  :stroke-width="4"
                  :show-text="false"
                  color="#409eff"
                  class="progress-bar"
              />
              <span class="progress-text">
                {{ item.completedCount || 0 }} / {{ item.chapterCount }} 章
              </span>
            </div>
          </template>
          <template v-else>
            <!-- 未学习：只浏览过详情页，未点击任何章节 -->
            <div class="no-study-row">
              <el-tag type="info" size="small" effect="plain">📌 未学习</el-tag>
              <span class="no-study-hint">点击进入课程开始学习</span>
            </div>
          </template>

          <!-- 标签 -->
          <div v-if="parseTags(item.tags).length" class="item-tags">
            <el-tag
                v-for="tag in parseTags(item.tags).slice(0, 2)"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
                class="tag-chip"
            >{{ tag }}</el-tag>
          </div>
        </div>

        <!-- 右侧：时间 + 按钮 -->
        <div class="item-right">
          <div class="learn-time">
            <el-icon><Clock /></el-icon>
            <span>{{ formatTime(item.lastLearnTime) }}</span>
          </div>
          <el-button
              type="primary"
              size="small"
              round
              class="continue-btn"
              @click.stop="goLastChapter(item)"
          >
            {{ item.lastChapterId ? '继续学习' : '去学习' }}
          </el-button>
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
import { ElMessage } from 'element-plus'
import { VideoPlay, Search, Notebook, Clock } from '@element-plus/icons-vue'
import { getCourseHistory } from '@/api/course'

const router = useRouter()

const loading     = ref(false)
const list        = ref([])
const total       = ref(0)
const currentPage = ref(1)
const pageSize    = ref(10)

const defaultCover = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90"><rect width="160" height="90" fill="%231a1a2e"/><text x="80" y="54" font-size="24" text-anchor="middle" fill="%23444">🌌</text></svg>'

// ─────────────────────────────────────────────────

async function fetchList(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const res = await getCourseHistory(currentPage.value, pageSize.value)
    if (res.code === 200) {
      // MyBatis-Plus IPage：records / total
      list.value  = res.data.records || res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取学习历史失败')
    }
  } catch (e) {
    console.error('[CourseHistory] fetchList error', e)
  } finally {
    loading.value = false
  }
}

/**
 * 跳转到上次所在章节
 * 若有 lastChapterId → 附 query.chapterId，CourseDetail.vue 自动定位
 * 若无（未学习）→ 直接进入课程详情
 * ✅ 使用 item.id（CourseVO 主键字段）
 */
function goLastChapter(item) {
  if (item.lastChapterId) {
    router.push({
      path: `/course/${item.id}`,
      query: { chapterId: item.lastChapterId }
    })
  } else {
    router.push(`/course/${item.id}`)
  }
}

/**
 * 计算学习进度百分比
 * ✅ 使用 item.chapterCount（CourseVO 字段名，非 totalChapters）
 */
function calcProgress(completed, chapterCount) {
  if (!chapterCount || chapterCount <= 0) return 0
  return Math.min(100, Math.round(((completed || 0) / chapterCount) * 100))
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { return JSON.parse(tags) } catch { return [] }
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const now  = new Date()
  const time = new Date(timeStr)
  const diff = Math.floor((now - time) / 1000)
  if (diff < 60)      return '刚刚'
  if (diff < 3600)    return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400)   return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  return time.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function handleImgError(e) {
  e.target.src = defaultCover
}

onMounted(() => fetchList(1))
</script>

<style scoped>
.course-history-page { padding: 0 4px; min-height: 400px; }

/* 页头 */
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0); }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-icon { font-size: 28px; color: #409eff; }
.page-title { font-size: 20px; font-weight: 600; color: var(--el-text-color-primary, #303133); margin: 0; }
.page-subtitle { font-size: 13px; color: var(--el-text-color-secondary, #909399); margin: 2px 0 0; }

/* 骨架屏 */
.skeleton-item { background: var(--el-bg-color, #fff); border-radius: 10px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 12px; }
.skeleton-row { display: flex; gap: 14px; }
.sk-cover { width: 120px; height: 68px; border-radius: 6px; flex-shrink: 0; }
.sk-body { flex: 1; padding-top: 4px; }

/* 空状态 */
.empty-state { padding: 60px 0; }
.empty-icon { font-size: 64px; line-height: 1; }

/* 列表 */
.list-container { display: flex; flex-direction: column; gap: 12px; }

/* 单条记录 */
.history-item {
  display: flex; align-items: flex-start; gap: 14px;
  background: var(--el-bg-color, #fff);
  border-radius: 10px; padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer; transition: box-shadow 0.2s, transform 0.2s;
  border: 1px solid transparent;
}
.history-item:hover { box-shadow: 0 4px 16px rgba(64,158,255,0.16); border-color: rgba(64,158,255,0.25); transform: translateX(2px); }

/* 封面 */
.item-cover-wrapper { position: relative; flex-shrink: 0; width: 120px; height: 68px; border-radius: 6px; overflow: hidden; background: #1a1a2e; }
.item-cover { width: 100%; height: 100%; object-fit: cover; transition: transform 0.25s; }
.history-item:hover .item-cover { transform: scale(1.05); }
.cover-type-badge { position: absolute; bottom: 3px; left: 4px; font-size: 12px; background: rgba(0,0,0,0.55); border-radius: 3px; padding: 1px 3px; }

/* 信息区 */
.item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.item-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary, #303133); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 上次章节 */
.last-chapter { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--el-text-color-regular, #606266); }
.lc-icon { color: var(--el-color-primary, #409eff); font-size: 13px; flex-shrink: 0; }
.lc-text { color: var(--el-text-color-secondary, #909399); flex-shrink: 0; }
.lc-title { color: var(--el-color-primary, #409eff); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

/* 进度条 */
.progress-row { display: flex; align-items: center; gap: 8px; }
.progress-bar { flex: 1; }
.progress-text { font-size: 11px; color: var(--el-text-color-placeholder, #c0c4cc); white-space: nowrap; flex-shrink: 0; }

/* 未学习行 */
.no-study-row { display: flex; align-items: center; gap: 8px; }
.no-study-hint { font-size: 12px; color: var(--el-text-color-placeholder, #c0c4cc); }

/* 标签 */
.item-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tag-chip { font-size: 11px; border-radius: 20px; }

/* 右侧 */
.item-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; min-width: 80px; }
.learn-time { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--el-text-color-placeholder, #c0c4cc); white-space: nowrap; }
.continue-btn { font-size: 12px; padding: 4px 12px; white-space: nowrap; }

/* 分页 */
.pagination-wrap { display: flex; justify-content: center; margin-top: 32px; }

/* 响应式 */
@media (max-width: 640px) {
  .history-item { flex-wrap: wrap; }
  .item-cover-wrapper { width: 90px; height: 51px; }
  .item-right { width: 100%; flex-direction: row; justify-content: space-between; align-items: center; border-top: 1px dashed var(--el-border-color-lighter, #f0f0f0); padding-top: 8px; }
}
</style>