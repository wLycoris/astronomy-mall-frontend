<template>
  <div class="course-detail-page" v-loading="pageLoading">

    <!-- ===== 课程顶部信息 ===== -->
    <div class="course-header" v-if="course">
      <div class="header-content">
        <div class="course-meta">
          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ name: 'CourseList' }">课程中心</el-breadcrumb-item>
            <el-breadcrumb-item>{{ course.title }}</el-breadcrumb-item>
          </el-breadcrumb>

          <div class="title-row">
            <h1 class="course-title">{{ course.title }}</h1>
            <!-- 收藏按钮（始终显示，未登录点击时提示去登录） -->
            <button
                :class="['fav-btn', { active: course.isFavorite }]"
                @click="handleToggleFavorite"
            >
              <el-icon size="20">
                <StarFilled v-if="course.isFavorite" />
                <Star v-else />
              </el-icon>
              {{ course.isFavorite ? '已收藏' : '收藏' }}
            </button>
          </div>

          <p v-if="course.subtitle" class="course-subtitle">{{ course.subtitle }}</p>

          <!-- 标签行 -->
          <div class="course-info-row">
            <el-tag :type="difficultyTagType(course.difficulty)" size="small">
              {{ course.difficultyText }}
            </el-tag>
            <el-tag :type="course.type === 0 ? 'danger' : 'success'" size="small">
              {{ course.type === 0 ? '▶ 视频课' : '📖 书本课' }}
            </el-tag>
            <el-tag v-if="course.isApodCourse === 1" type="warning" size="small">
              🌌 NASA APOD 每日同步
            </el-tag>
            <el-tag v-if="course.isMarsCourse === 1" type="warning" size="small">
              🔴 火星探测车日志
            </el-tag>
            <span class="chapter-stat">{{ course.chapterCount }} 个章节</span>
            <span class="view-stat">{{ course.viewCount || 0 }} 人学习</span>
          </div>

          <!-- 课程标签 chips -->
          <div v-if="parseTags(course.tags).length > 0" class="course-tags">
            <el-tag
                v-for="tag in parseTags(course.tags)"
                :key="tag"
                size="small"
                type="info"
                class="course-tag"
            >{{ tag }}</el-tag>
          </div>
        </div>

        <!-- 封面（右侧小图） -->
        <div class="header-cover">
          <el-image
              :src="course.cover"
              fit="cover"
              class="cover-img"
          />
        </div>
      </div>
    </div>

    <!-- ===== 主体区域（左侧目录 + 右侧内容）===== -->
    <div class="course-body" v-if="course">

      <!-- 左侧章节目录 -->
      <div class="chapter-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">📋 章节目录</span>
          <span class="progress-text" v-if="completedCount > 0">
            {{ completedCount }}/{{ course.chapterCount }} 已完成
          </span>
        </div>
        <div class="sidebar-scroll">
          <div
              v-for="(chapter, index) in course.chapters"
              :key="chapter.id"
              :class="['chapter-item', {
              active: currentChapterId === chapter.id,
              completed: chapter.isCompleted
            }]"
              @click="loadChapter(chapter.id)"
          >
            <!-- 序号/完成标记 -->
            <span class="chapter-num">
              <el-icon v-if="chapter.isCompleted" color="#52c41a"><CircleCheck /></el-icon>
              <span v-else>{{ index + 1 }}</span>
            </span>
            <!-- 章节标题 -->
            <span class="chapter-title-text">{{ chapter.title }}</span>
            <!-- 时长 -->
            <span v-if="chapter.duration" class="chapter-duration">{{ chapter.duration }}min</span>
          </div>

          <!-- 空状态 -->
          <div v-if="!course.chapters || course.chapters.length === 0" class="no-chapters">
            <el-empty description="暂无章节" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="chapter-content-area">

        <!-- 未选择章节时的引导状态 -->
        <div v-if="!currentChapter && !contentLoading" class="welcome-state">
          <div class="welcome-icon">🌌</div>
          <h3>
            {{ course.lastChapterId ? '继续上次的学习' : '选择一个章节开始学习' }}
          </h3>
          <p>点击左侧章节目录开始你的天文之旅</p>
          <el-button
              v-if="course.lastChapterId"
              type="primary"
              @click="loadChapter(course.lastChapterId)"
          >
            继续学习
          </el-button>
          <el-button
              v-else-if="course.chapters && course.chapters.length > 0"
              type="primary"
              @click="loadChapter(course.chapters[0].id)"
          >
            开始第一章
          </el-button>
        </div>

        <!-- 章节内容加载中 -->
        <div v-else-if="contentLoading" class="content-loading">
          <el-skeleton :rows="8" animated />
        </div>

        <!-- 章节内容 -->
        <div v-else-if="currentChapter" class="chapter-content">
          <!-- 章节标题栏 -->
          <div class="content-header">
            <h2 class="content-title">{{ currentChapter.title }}</h2>
            <div class="content-meta">
              <el-tag v-if="currentChapter.source === 'apod'" type="warning" size="small">
                🌌 NASA APOD
              </el-tag>
              <el-tag v-else-if="currentChapter.source === 'mars_rover'" type="warning" size="small">
                🔴 火星探测车
              </el-tag>
              <span v-if="currentChapter.duration" class="content-duration">
                预计学习 {{ currentChapter.duration }} 分钟
              </span>
            </div>
          </div>

          <!-- APOD 配图（source=apod 时显示在内容顶部）-->
          <div v-if="currentChapter.apodImage" class="apod-image-wrapper">
            <el-image
                :src="currentChapter.apodImage"
                fit="contain"
                :preview-src-list="[currentChapter.apodImage]"
                preview-teleported
                class="apod-image"
            />
            <p class="apod-image-caption">📸 点击图片可全屏预览</p>
          </div>

          <!-- 视频章节（type=0）：iframe 嵌入 -->
          <div v-if="currentChapter.type === 0 && currentChapter.videoUrl" class="video-wrapper">
            <iframe
                :src="currentChapter.videoUrl"
                class="video-iframe"
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                frameborder="0"
            ></iframe>
            <!-- 遮罩层：覆盖B站顶部区域，点击时在新标签页打开原视频 -->
            <div class="video-overlay" @click="openVideoInNewTab" title="点击在新标签页中打开视频">
              <span class="overlay-hint">↗ 在新标签页打开</span>
            </div>
          </div>

          <!-- 书本章节（type=1）：v-html 渲染富文本 -->
          <div
              v-else-if="currentChapter.type === 1 && currentChapter.content"
              class="rich-content"
              v-html="currentChapter.content"
          ></div>

          <!-- 内容缺失兜底 -->
          <el-empty
              v-else
              description="章节内容暂未录入"
              :image-size="80"
          />
        </div>

      </div>
    </div>

    <!-- ===== 底部功能区 ===== -->
    <div class="course-footer" v-if="course">
      <!-- 论坛跳转按钮 -->
      <div class="forum-link-section">
        <el-button
            type="default"
            size="large"
            @click="goToForum"
            class="forum-btn"
        >
          💬 去论坛讨论
        </el-button>
        <span class="forum-hint">与其他天文爱好者交流这门课程的心得</span>
      </div>

      <!-- 课程评价占位区 -->
      <div class="review-section">
        <div class="review-placeholder">
          <el-icon size="32" color="#ccc"><ChatDotRound /></el-icon>
          <p class="review-placeholder-text">
            课程评价功能即将开放，期待你的反馈 ✨
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Star, StarFilled, CircleCheck, ChatDotRound
} from '@element-plus/icons-vue'
import { getCourseDetail, getCourseChapter, toggleCourseFavorite } from '@/api/course'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isLogin = computed(() => userStore.isLogin)

// ======================== 状态 ========================
const pageLoading = ref(false)
const contentLoading = ref(false)
const course = ref(null)
const currentChapterId = ref(null)
const currentChapter = ref(null)

// ======================== 计算属性 ========================

/** 已完成章节数量 */
const completedCount = computed(() => {
  if (!course.value?.chapters) return 0
  return course.value.chapters.filter(c => c.isCompleted).length
})

// ======================== 方法 ========================

async function loadCourseDetail() {
  const courseId = route.params.id
  if (!courseId) return
  pageLoading.value = true
  try {
    const res = await getCourseDetail(courseId)
    if (res.code === 200) {
      course.value = res.data

      // 优先使用 URL query.chapterId（来自学习历史跳转），其次使用进度记录
      const queryChapterId = route.query.chapterId
          ? Number(route.query.chapterId)
          : null
      const targetChapterId = queryChapterId || course.value.lastChapterId

      if (targetChapterId) {
        await loadChapter(targetChapterId)
      }
    } else {
      ElMessage.error(res.message || '课程不存在')
      router.push({ name: 'CourseList' })
    }
  } catch (e) {
    ElMessage.error('加载失败，请重试')
  } finally {
    pageLoading.value = false
  }
}

/** 加载章节内容（点击章节目录触发） */
async function loadChapter(chapterId) {
  if (currentChapterId.value === chapterId) return  // 防止重复加载
  currentChapterId.value = chapterId
  contentLoading.value = true
  currentChapter.value = null

  try {
    const res = await getCourseChapter(chapterId)
    if (res.code === 200) {
      currentChapter.value = res.data
      // 同步更新左侧目录中该章节的 isCompleted 状态（乐观更新）
      if (course.value?.chapters) {
        const chapterInList = course.value.chapters.find(c => c.id === chapterId)
        if (chapterInList) {
          chapterInList.isCompleted = true
        }
      }
    }
  } catch (e) {
    ElMessage.error('章节加载失败，请重试')
    currentChapterId.value = null
  } finally {
    contentLoading.value = false
  }
}

/** 收藏/取消收藏（始终显示，未登录时提示去登录） */
async function handleToggleFavorite() {
  if (!getToken()) {
    ElMessage.warning('请先登录后再收藏')
    return
  }
  try {
    const res = await toggleCourseFavorite(course.value.id)
    if (res.code === 200) {
      course.value.isFavorite = res.data.isFavorite
      ElMessage.success(res.data.message)
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

/** 在新标签页打开原视频（点击视频顶部遮罩触发） */
function openVideoInNewTab() {
  const url = currentChapter.value?.videoUrl
  if (!url) return
  const bvidMatch = url.match(/bvid=([^&]+)/)
  if (bvidMatch) {
    window.open(`https://www.bilibili.com/video/${bvidMatch[1]}`, '_blank')
  } else {
    window.open(url, '_blank')
  }
}

/** 跳转论坛 */
function goToForum() {
  const target = router.resolve({ name: 'ForumList', query: { courseId: course.value.id } })
  if (target.matched.length > 0) {
    router.push(target)
  } else {
    ElMessage.info('论坛功能即将上线，敬请期待 💬')
  }
}

/** 解析 tags JSON 字符串 */
function parseTags(tagsStr) {
  if (!tagsStr) return []
  try {
    return JSON.parse(tagsStr)
  } catch { return [] }
}

/** 难度标签类型 */
function difficultyTagType(difficulty) {
  const map = { 1: 'success', 2: 'warning', 3: 'danger' }
  return map[difficulty] || 'info'
}

// ======================== 初始化 ========================
onMounted(() => {
  loadCourseDetail()
})
</script>

<style scoped>
.course-detail-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

/* ===== 课程顶部 ===== */
.course-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 0 0 16px 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  color: #fff;
}
.header-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.course-meta {
  flex: 1;
}
:deep(.el-breadcrumb__inner) {
  color: rgba(255,255,255,0.6) !important;
}
:deep(.el-breadcrumb__separator) {
  color: rgba(255,255,255,0.4) !important;
}
:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: rgba(255,255,255,0.9) !important;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 10px 0 6px;
  flex-wrap: wrap;
}
.course-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  flex: 1;
  min-width: 0;
}
.course-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  margin: 0 0 12px;
}
.course-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.chapter-stat, .view-stat {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
}
.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.course-tag {
  background: rgba(255,255,255,0.12) !important;
  border-color: transparent !important;
  color: rgba(255,255,255,0.85) !important;
  font-size: 12px !important;
}

/* 收藏按钮 */
.fav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  border: 1.5px solid rgba(255,255,255,0.4);
  border-radius: 20px;
  background: transparent;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  flex-shrink: 0;
}
.fav-btn:hover {
  border-color: #f59e0b;
  color: #f59e0b;
}
.fav-btn.active {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245,158,11,0.1);
}

/* 右侧封面 */
.header-cover {
  flex-shrink: 0;
}
.cover-img {
  width: 200px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

/* ===== 主体布局 ===== */
.course-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  min-height: 600px;
}

/* 左侧章节目录 */
.chapter-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.progress-text {
  font-size: 12px;
  color: #7c3aed;
  background: #f3eeff;
  padding: 2px 8px;
  border-radius: 10px;
}
.sidebar-scroll {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}

/* 章节列表项 */
.chapter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}
.chapter-item:hover {
  background: #f8f4ff;
}
.chapter-item.active {
  background: #f3eeff;
  border-left-color: #7c3aed;
}
.chapter-item.completed .chapter-title-text {
  color: #888;
}
.chapter-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #666;
  flex-shrink: 0;
}
.chapter-item.active .chapter-num {
  background: #7c3aed;
  color: #fff;
}
.chapter-title-text {
  flex: 1;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.chapter-duration {
  font-size: 11px;
  color: #bbb;
  flex-shrink: 0;
}
.no-chapters {
  padding: 20px;
}

/* 右侧内容区 */
.chapter-content-area {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
  min-height: 500px;
}

/* 欢迎引导态 */
.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  padding: 40px;
}
.welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.welcome-state h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px;
}
.welcome-state p {
  font-size: 14px;
  color: #999;
  margin: 0 0 20px;
}

/* 章节内容 */
.chapter-content {
  padding: 24px 28px;
}
.content-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
}
.content-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.content-duration {
  font-size: 13px;
  color: #aaa;
}

/* APOD 配图 */
.apod-image-wrapper {
  margin-bottom: 20px;
  text-align: center;
}
.apod-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  cursor: zoom-in;
}
.apod-image-caption {
  font-size: 12px;
  color: #aaa;
  margin: 6px 0 0;
}

/* 视频播放器 */
.video-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}
.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}
.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
}
.video-overlay:hover .overlay-hint {
  opacity: 1;
}
.overlay-hint {
  font-size: 12px;
  color: #fff;
  background: rgba(0,0,0,0.5);
  padding: 3px 8px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

/* 富文本内容 */
.rich-content {
  line-height: 1.8;
  color: #333;
  font-size: 15px;
}
:deep(.rich-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 12px 0;
}
:deep(.rich-content h1),
:deep(.rich-content h2),
:deep(.rich-content h3) {
  color: #1a1a2e;
  margin: 24px 0 12px;
}
:deep(.rich-content p) {
  margin: 0 0 12px;
}
:deep(.rich-content blockquote) {
  border-left: 4px solid #7c3aed;
  padding: 12px 12px 12px 16px;
  color: #666;
  margin: 16px 0;
  background: #f9f4ff;
  border-radius: 0 6px 6px 0;
}

/* 内容加载中 */
.content-loading {
  padding: 24px 28px;
}

/* ===== 底部功能区 ===== */
.course-footer {
  margin-top: 32px;
}

.forum-link-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}
.forum-btn {
  flex-shrink: 0;
  font-size: 15px;
}
.forum-hint {
  font-size: 13px;
  color: #999;
}

.review-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}
.review-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  text-align: center;
}
.review-placeholder-text {
  margin: 12px 0 0;
  color: #bbb;
  font-size: 14px;
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .course-body {
    flex-direction: column;
  }
  .chapter-sidebar {
    width: 100%;
    position: static;
    max-height: 300px;
  }
  .header-cover {
    display: none;
  }
}
</style>