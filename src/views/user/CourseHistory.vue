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
          <div class="section-kicker">COURSE LOG</div>
          <h2 class="page-title">学习历史</h2>
          <p class="page-subtitle">共 {{ total }} 条记录，继续上一次停下的章节。</p>
        </div>
      </div>
      <el-button class="primary-action" size="small" @click="router.push('/course')">
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
        <div class="empty-icon">LEARN</div>
      </template>
      <el-button class="primary-action" @click="router.push('/course')">浏览课程</el-button>
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
            {{ item.type === 0 ? '视频' : '图文' }}
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
                  color="#c7a572"
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
              <el-tag type="info" size="small" effect="plain">未学习</el-tag>
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

const defaultCover = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90"><rect width="160" height="90" fill="%23111827"/><circle cx="80" cy="45" r="18" fill="%23f3e9cf" opacity="0.86"/><path d="M22 68h116" stroke="%23c7a572" stroke-width="2" opacity="0.6"/><text x="80" y="78" font-size="11" text-anchor="middle" fill="%23f3e9cf">COURSE</text></svg>'

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
.course-history-page {
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

.skeleton-item {
  margin-bottom: 12px;
  padding: 16px;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
}

.skeleton-row {
  display: flex;
  gap: 14px;
}

.sk-cover {
  width: 128px;
  height: 72px;
  border-radius: 6px;
  flex-shrink: 0;
}

.sk-body {
  flex: 1;
  padding-top: 4px;
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

.list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #ebe3d7;
  border-radius: 8px;
  background: #fffdfa;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s, transform .2s;
}

.history-item:hover {
  border-color: rgba(154, 107, 54, .45);
  box-shadow: 0 14px 30px rgba(35, 30, 22, .10);
  transform: translateY(-1px);
}

.item-cover-wrapper {
  position: relative;
  width: 132px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 7px;
  background: #111827;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
}

.item-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .25s;
}

.history-item:hover .item-cover {
  transform: scale(1.04);
}

.cover-type-badge {
  position: absolute;
  left: 8px;
  bottom: 7px;
  padding: 2px 8px;
  border: 1px solid rgba(247, 236, 210, .32);
  border-radius: 999px;
  background: rgba(17, 24, 39, .82);
  color: #f3e9cf;
  font-size: 11px;
  font-weight: 800;
}

.item-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-title {
  color: #111827;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-chapter {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #5f6b7a;
  font-size: 12px;
  line-height: 1.5;
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
  max-width: 280px;
  color: #8a5f2e;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  min-width: 120px;
}

.progress-text {
  color: #8b95a5;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.no-study-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-study-hint {
  color: #8b95a5;
  font-size: 12px;
}

.item-tags {
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

.item-right {
  min-width: 96px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.learn-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9aa3b2;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.continue-btn {
  border-color: #111827;
  background: #111827;
  color: #fffdfa;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.continue-btn:hover {
  border-color: #9a6b36;
  background: #9a6b36;
  color: #fffdfa;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #111827;
}

:deep(.el-progress-bar__outer) {
  background-color: #efe8dc;
}

@media (max-width: 820px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-item {
    grid-template-columns: 112px minmax(0, 1fr);
  }

  .item-cover-wrapper {
    width: 112px;
  }

  .item-right {
    grid-column: 1 / -1;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px dashed #ebe3d7;
  }
}
</style>
