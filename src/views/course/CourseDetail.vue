<template>
  <div class="course-detail-page" v-loading="pageLoading">
    <div class="paper-grain"></div>

    <!-- ===== 课程顶部信息 ===== -->
    <div class="course-header" v-if="course">
      <div class="header-content">
        <div class="course-meta">
          <div class="course-kicker">astronomy course folio</div>
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
              {{ course.type === 0 ? '视频课' : '书本课' }}
            </el-tag>
            <el-tag v-if="course.isApodCourse === 1" type="warning" size="small">
              NASA APOD 每日同步
            </el-tag>
            <el-tag v-if="course.isMarsCourse === 1" type="warning" size="small">
              火星探测车日志
            </el-tag>
            <span class="chapter-stat"><em>chapters</em>{{ course.chapterCount }}</span>
            <span class="view-stat"><em>readers</em>{{ course.viewCount || 0 }}</span>
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
          <span class="sidebar-title">章节目录</span>
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
          <div class="welcome-icon">☾</div>
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
                NASA APOD
              </el-tag>
              <el-tag v-else-if="currentChapter.source === 'mars_rover'" type="warning" size="small">
                火星探测车
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
          <el-icon><ChatDotRound /></el-icon>
          去论坛讨论
        </el-button>
        <span class="forum-hint">与其他天文爱好者交流这门课程的心得</span>
      </div>

      <!-- ===== 5.6 课程评价区 ===== -->
      <div class="review-section">

        <!-- 标题行 -->
        <div class="review-header">
          <span class="review-title">课程评价</span>
          <span class="review-total" v-if="reviewTotal > 0">{{ reviewTotal }} 条</span>
        </div>

        <!-- 提交表单（已登录 + 有进度 + 未评过）-->
        <div v-if="isLogin && canSubmitReview && !myReview" class="review-form">
          <div class="form-stars">
            <span class="form-label">评分</span>
            <span
                v-for="n in 5"
                :key="n"
                class="form-star"
                :class="{ lit: reviewForm.rating >= n || hoverRating >= n }"
                @mouseenter="hoverRating = n"
                @mouseleave="hoverRating = 0"
                @click="reviewForm.rating = n"
            >★</span>
            <span class="form-hint" v-if="reviewForm.rating > 0">{{ ratingHintMap[reviewForm.rating] }}</span>
          </div>
          <el-input
              v-model="reviewForm.content"
              type="textarea"
              :rows="3"
              placeholder="说说你的学习感受吧～（选填）"
              maxlength="500"
              show-word-limit
          />
          <div class="form-footer">
            <el-button
                type="primary"
                size="small"
                :loading="submitLoading"
                :disabled="reviewForm.rating === 0"
                @click="handleSubmitReview"
            >发布评价</el-button>
            <span class="form-tip" v-if="reviewForm.rating === 0">请先点击星星评分</span>
          </div>
        </div>

        <!-- 未登录 -->
        <div v-else-if="!isLogin" class="review-tip">
          <span>登录后参与评价</span>
          <el-button type="primary" link size="small" @click="router.push('/login')">去登录</el-button>
        </div>

        <!-- 已登录但未学习 -->
        <div v-else-if="isLogin && !canSubmitReview && !myReview" class="review-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>先学习课程内容，解锁评价功能</span>
        </div>

        <!-- 已评过：展示我的评价 + 编辑入口 -->
        <div v-if="myReview && !editingMyReview" class="my-review-bar">
          <div class="my-review-left">
            <span class="my-review-label">我的评价</span>
            <span class="review-stars">
              <span v-for="n in myReview.rating" :key="'on'+n">★</span>
              <span class="review-stars-off" v-for="n in (5-myReview.rating)" :key="'off'+n">★</span>
            </span>
            <span class="my-review-content" v-if="myReview.content">{{ myReview.content }}</span>
            <span class="my-review-content empty" v-else>未填写文字</span>
          </div>
          <el-button size="small" @click="openEditMyReview">编辑</el-button>
        </div>

        <!-- 编辑我的评价表单 -->
        <div v-if="myReview && editingMyReview" class="review-form">
          <div class="form-stars">
            <span class="form-label">评分</span>
            <span
                v-for="n in 5"
                :key="n"
                class="form-star"
                :class="{ lit: editForm.rating >= n || editHover >= n }"
                @mouseenter="editHover = n"
                @mouseleave="editHover = 0"
                @click="editForm.rating = n"
            >★</span>
            <span class="form-hint" v-if="editForm.rating > 0">{{ ratingHintMap[editForm.rating] }}</span>
          </div>
          <el-input
              v-model="editForm.content"
              type="textarea"
              :rows="3"
              placeholder="说说你的学习感受吧～（选填）"
              maxlength="500"
              show-word-limit
          />
          <div class="form-footer">
            <el-button
                type="primary"
                size="small"
                :loading="submitLoading"
                :disabled="editForm.rating === 0"
                @click="handleUpdateReview"
            >保存修改</el-button>
            <el-button size="small" @click="editingMyReview = false">取消</el-button>
          </div>
        </div>

        <!-- 评价列表加载中 -->
        <div v-if="reviewLoading" class="review-skeleton">
          <el-skeleton :rows="2" animated />
        </div>

        <!-- 评价列表 -->
        <div v-else-if="reviewList.length > 0" class="review-list">
          <div
              v-for="item in reviewList"
              :key="item.id"
              class="review-card"
              :class="{ 'is-mine': myReview && item.id === myReview.id }"
          >
            <el-avatar :src="item.avatar" :size="38" class="review-avatar">
              {{ (item.nickname || '?').charAt(0) }}
            </el-avatar>
            <div class="review-body">
              <div class="review-top">
                <span class="review-name">{{ item.nickname || '天文爱好者' }}</span>
                <span class="review-mine-tag" v-if="myReview && item.id === myReview.id">我</span>
                <span class="review-stars">
                  <span v-for="n in item.rating" :key="'s'+n">★</span>
                  <span class="review-stars-off" v-for="n in (5-item.rating)" :key="'o'+n">★</span>
                </span>
                <span class="review-date">{{ formatReviewTime(item.createTime) }}</span>
              </div>
              <p class="review-text" v-if="item.content">{{ item.content }}</p>
              <p class="review-text no-content" v-else>该用户未留下文字</p>
            </div>
          </div>
        </div>

        <!-- 暂无评价 -->
        <div v-else-if="!reviewLoading" class="review-empty">
          <span>暂无评价，来第一个评价吧 🌟</span>
        </div>

        <!-- 分页 -->
        <div v-if="reviewTotal > reviewPageSize" class="review-pager">
          <el-pagination
              v-model:current-page="reviewPageNum"
              :page-size="reviewPageSize"
              :total="reviewTotal"
              layout="prev, pager, next"
              small
              @current-change="handleReviewPageChange"
          />
        </div>

      </div>
    </div>

    <!-- ============================================================
      🆕 8.3.2 跨模块联动: 完课 → 推荐下一门课程
      触发条件：completedCount === chapterCount 且不是 APOD/火星车课
    ============================================================ -->
    <el-dialog
        v-model="completionDialogVisible"
        title="恭喜你完成了这门课程！"
        width="640px"
        :close-on-click-modal="false"
        class="completion-dialog"
    >
      <div class="completion-content">
        <p class="completion-desc">
          📚 学完了「{{ course?.title }}」，继续深入探索这些方向？
        </p>

        <!-- 加载中 -->
        <div v-if="nextCourseLoading" class="next-course-loading">
          <el-skeleton :rows="2" animated />
        </div>

        <!-- 推荐课程列表 -->
        <div v-else-if="nextCourseList.length > 0" class="next-course-grid">
          <div
              v-for="nc in nextCourseList"
              :key="nc.id"
              class="next-course-card"
              @click="goToNextCourse(nc.id)"
          >
            <div class="next-course-cover">
              <img v-if="nc.cover" :src="nc.cover" :alt="nc.title" />
              <div v-else class="next-course-cover-placeholder">📖</div>
            </div>
            <div class="next-course-info">
              <p class="next-course-title">{{ nc.title }}</p>
              <p class="next-course-meta">
                <span class="next-course-badge">{{ nc.difficultyText || '课程' }}</span>
                <span v-if="nc.chapterCount" class="next-course-chapters">{{ nc.chapterCount }} 章</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 空态 -->
        <div v-else class="next-course-empty">
          <p>🌟 暂无相关推荐课程</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="completionDialogVisible = false">稍后再看</el-button>
        <el-button type="primary" @click="goToAllCourses">浏览全部课程</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Star, StarFilled, CircleCheck, ChatDotRound, InfoFilled
} from '@element-plus/icons-vue'
import { getCourseDetail, getCourseChapter, toggleCourseFavorite, getCourseReviews, submitReview, getMyReview, updateCourseReview } from '@/api/course'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'
// 🆕 8.3.2 跨模块联动：完课 → 下一门课程推荐
import { getNextCourseRecommend } from '@/api/recommend'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isLogin = computed(() => !!getToken())

// ======================== 状态 ========================
const pageLoading = ref(false)
const contentLoading = ref(false)
const course = ref(null)
const currentChapterId = ref(null)
const currentChapter = ref(null)

// 🆕 8.3.2 完课弹窗状态
const completionDialogVisible = ref(false)
const nextCourseLoading       = ref(false)
const nextCourseList          = ref([])
// 防止同一次会话内重复弹出（loadChapter 会多次触发 watch）
const hasShownCompletionDialog = ref(false)

// ======================== 计算属性 ========================

/** 已完成章节数量 */
const completedCount = computed(() => {
  if (!course.value?.chapters) return 0
  return course.value.chapters.filter(c => c.isCompleted).length
})

// ======================== 5.6 评价状态 ========================
const reviewList      = ref([])
const reviewTotal     = ref(0)
const reviewPageNum   = ref(1)
const reviewPageSize  = 10
const reviewLoading   = ref(false)
const myReview        = ref(null)
const canSubmitReview = ref(false)

// 提交表单
const reviewForm    = reactive({ rating: 0, content: '' })
const hoverRating   = ref(0)
const submitLoading = ref(false)

// 编辑表单
const editingMyReview = ref(false)
const editForm        = reactive({ rating: 0, content: '' })
const editHover       = ref(0)

const ratingHintMap = { 1: '很差', 2: '较差', 3: '一般', 4: '不错', 5: '非常棒！' }

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

      // ✅ 5.6：加载评价数据
      checkCanSubmit()
      await Promise.all([loadReviews(), loadMyReview()])
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
      // 点击章节后更新可评价状态
      canSubmitReview.value = true
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

/**
 * 跳转论坛
 * 7.8: 课程 → 论坛跨模块联动
 *   优先取课程第一个 tag 作为论坛筛选条件，让讨论页直接定位相关话题。
 *   ForumList.vue 在 onMounted 读取 ?tag=xxx 自动 setCurrentTag。
 */
function goToForum() {
  if (!course.value) return
  const tags = parseTags(course.value.tags)
  const query = tags.length > 0 ? { tag: tags[0] } : {}
  const target = router.resolve({ name: 'ForumList', query })
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

// ======================== 🆕 8.3.2 完课检测与推荐 ========================

/**
 * 监听已完成章节数变化
 * 当 completedCount === chapterCount 且课程有章节 → 触发完课弹窗
 *
 * 🆕 v8.58 防重复弹：localStorage 按 用户+课程 记录已弹过，
 *   之后再进这门课只要 completedCount 没从 < total 跨到 >= total（即"刚完课那一刻"），
 *   就不会再弹（即使重新登录/换浏览器都不再弹，一次见即终身不扰）。
 *
 * 注意排除:
 *  - APOD 课程 (isApodCourse=1) 和火星车课程 (isMarsCourse=1)
 *    这两类章节每天自动递增，永远不会"真的"完课
 *  - 未登录用户（登录后才能累积已完成章节）
 *  - 同一会话已弹过的（hasShownCompletionDialog）
 *  - 历史已弹过的（localStorage completionDialogShown:{userId}:{courseId}）
 */
function completionDialogStorageKey() {
  const uid = userStore.userInfo?.id || 'anon'
  const cid = course.value?.id || route.params.id
  return `completionDialogShown:${uid}:${cid}`
}
watch(completedCount, async (newVal, oldVal) => {
  if (!course.value) return
  if (hasShownCompletionDialog.value) return
  if (!isLogin.value) return
  if (course.value.isApodCourse === 1 || course.value.isMarsCourse === 1) return

  const total = course.value.chapterCount || 0
  if (total <= 0 || newVal < total) return

  // 💡 只有在「刚好跨过完课线」那一刻才弹，已经完课再进入不弹
  // oldVal 可能是 undefined（首次进页面就已完成）→ 此时检查 localStorage
  const storageKey = completionDialogStorageKey()
  const alreadyShown = localStorage.getItem(storageKey) === '1'
  if (alreadyShown) {
    hasShownCompletionDialog.value = true  // 防止后续再次触发
    return
  }

  // 到这里说明: 是"从未完课 → 刚刚完课"的真实瞬间
  hasShownCompletionDialog.value = true
  localStorage.setItem(storageKey, '1')
  await fetchNextCourseRecommend()
  completionDialogVisible.value = true
})

/** 拉取下一门课程推荐 */
async function fetchNextCourseRecommend() {
  if (!course.value) return
  nextCourseLoading.value = true
  try {
    const res = await getNextCourseRecommend(course.value.id, { limit: 4 })
    nextCourseList.value = res.data || []
  } catch (err) {
    console.warn('[CourseDetail] 下一门课程推荐加载失败:', err)
    nextCourseList.value = []
  } finally {
    nextCourseLoading.value = false
  }
}

/** 跳转下一门课程（关闭弹窗） */
async function goToNextCourse(courseId) {
  if (!courseId) {
    ElMessage.warning('课程信息缺失')
    return
  }
  completionDialogVisible.value = false
  // 同一 CourseDetail 组件切换 :id 不会自动重载，需要主动刷新数据
  await router.push(`/course/${courseId}`)
  await loadCourseDetail()
  // 滚到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 跳转全部课程列表 */
function goToAllCourses() {
  completionDialogVisible.value = false
  router.push('/course')
}

// ======================== 5.6 评价方法 ========================

function checkCanSubmit() {
  canSubmitReview.value = !!(course.value && course.value.lastChapterId)
}

async function loadReviews() {
  if (!course.value) return
  reviewLoading.value = true
  try {
    const res = await getCourseReviews(course.value.id, reviewPageNum.value, reviewPageSize)
    if (res.code === 200) {
      reviewList.value  = res.data.records || []
      reviewTotal.value = res.data.total   || 0
    }
  } catch (e) {
    console.warn('[评价] 加载失败', e)
  } finally {
    reviewLoading.value = false
  }
}

async function loadMyReview() {
  if (!isLogin.value || !course.value) return
  try {
    const res = await getMyReview(course.value.id)
    myReview.value = (res.code === 200) ? res.data : null
  } catch (e) {
    myReview.value = null
  }
}

async function handleSubmitReview() {
  if (!getToken()) { ElMessage.warning('请先登录'); return }
  if (reviewForm.rating === 0) { ElMessage.warning('请先选择评分'); return }
  submitLoading.value = true
  try {
    const res = await submitReview(course.value.id, {
      rating:  reviewForm.rating,
      content: reviewForm.content.trim() || undefined
    })
    if (res.code === 200) {
      ElMessage.success('评价发布成功 🌟')
      reviewForm.rating  = 0
      reviewForm.content = ''
      reviewPageNum.value = 1
      await Promise.all([loadMyReview(), loadReviews()])
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (e) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

/** 打开编辑我的评价 */
function openEditMyReview() {
  editForm.rating  = myReview.value.rating
  editForm.content = myReview.value.content || ''
  editHover.value  = 0
  editingMyReview.value = true
}

/** 保存编辑 */
async function handleUpdateReview() {
  if (editForm.rating === 0) { ElMessage.warning('请先选择评分'); return }
  submitLoading.value = true
  try {
    const res = await updateCourseReview(course.value.id, {
      rating:  editForm.rating,
      content: editForm.content.trim() || undefined
    })
    if (res.code === 200) {
      ElMessage.success('评价已更新')
      editingMyReview.value = false
      reviewPageNum.value = 1
      await Promise.all([loadMyReview(), loadReviews()])
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (e) {
    ElMessage.error('更新失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

function handleReviewPageChange(page) {
  reviewPageNum.value = page
  loadReviews()
}

function formatReviewTime(val) {
  if (!val) return ''
  // 数组格式 [2026,3,22,10,0,0]
  if (Array.isArray(val)) {
    const [y, M, d] = val
    return `${y}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  return String(val).slice(0, 10)
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

/* ===== 评价区 ===== */
.review-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  padding: 24px 28px;
}

/* 标题行 */
.review-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}
.review-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}
.review-total {
  font-size: 13px;
  color: #999;
}

/* 提交/编辑表单 */
.review-form {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px 18px;
  margin-bottom: 24px;
}
.form-stars {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 12px;
}
.form-label {
  font-size: 13px;
  color: #666;
  margin-right: 6px;
}
.form-star {
  font-size: 26px;
  color: #e0e0e0;
  cursor: pointer;
  transition: color 0.12s;
  line-height: 1;
  user-select: none;
}
.form-star.lit {
  color: #f59e0b;
}
.form-hint {
  font-size: 12px;
  color: #f59e0b;
  margin-left: 6px;
}
.form-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.form-tip {
  font-size: 12px;
  color: #bbb;
}

/* 未登录/未学习提示 */
.review-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
  margin-bottom: 20px;
}

/* 我的评价横条 */
.my-review-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fffdf5;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.my-review-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}
.my-review-label {
  font-size: 12px;
  font-weight: 600;
  color: #7c3aed;
  background: #f3eeff;
  padding: 1px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}
.my-review-stars {
  font-size: 14px;
  color: #f59e0b;
  flex-shrink: 0;
}
.my-review-content {
  font-size: 13px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.my-review-content.empty {
  color: #ccc;
  font-style: italic;
}

/* 骨架屏 */
.review-skeleton {
  padding: 8px 0;
}

/* 评价列表 */
.review-list {
  display: flex;
  flex-direction: column;
}
.review-card {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}
.review-card:last-child {
  border-bottom: none;
}
.review-card.is-mine {
  background: #fffdf5;
  margin: 0 -28px;
  padding: 16px 28px;
}
.review-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
  font-weight: 600;
}
.review-body {
  flex: 1;
  min-width: 0;
}
.review-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.review-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.review-mine-tag {
  font-size: 11px;
  color: #7c3aed;
  background: #f3eeff;
  padding: 1px 6px;
  border-radius: 10px;
  line-height: 1.6;
}
.review-stars {
  font-size: 13px;
  color: #f59e0b;
  letter-spacing: 1px;
}
.review-stars-off {
  color: #e0e0e0;
}
.review-date {
  font-size: 12px;
  color: #bbb;
  margin-left: auto;
}
.review-text {
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  margin: 0;
  word-break: break-word;
}
.review-text.no-content {
  color: #ccc;
  font-style: italic;
}

/* 暂无评价 */
.review-empty {
  padding: 32px 0;
  text-align: center;
  font-size: 14px;
  color: #bbb;
}

/* 分页 */
.review-pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
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

/* ============================================================ */
/* 🆕 8.3.2 完课推荐弹窗                                        */
/* ============================================================ */
.completion-content {
  padding: 10px 4px 4px;
}
.completion-desc {
  color: #444;
  margin: 0 0 16px;
  font-size: 14px;
}
.next-course-loading {
  padding: 10px 0;
}
.next-course-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.next-course-card {
  display: flex;
  gap: 12px;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  background: #fafbfc;
}
.next-course-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}
.next-course-cover {
  width: 80px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #eef2f8;
}
.next-course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.next-course-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #aaa;
}
.next-course-info {
  flex: 1;
  min-width: 0;
}
.next-course-title {
  font-size: 13px;
  color: #333;
  margin: 0 0 6px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.next-course-meta {
  font-size: 11px;
  color: #666;
  margin: 0;
  display: flex;
  gap: 6px;
}
.next-course-badge {
  background: #ecf5ff;
  color: #409eff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
}
.next-course-chapters {
  color: #999;
}
.next-course-empty {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 14px;
}
@media (max-width: 640px) {
  .next-course-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================================ */
/* Textbook polish: old astronomy manual style                  */
/* ============================================================ */
.course-detail-page {
  --paper: #f4ebd9;
  --paper-deep: #ebe1cc;
  --paper-soft: #f8f1e3;
  --paper-edge: #cdbe9f;
  --rule: #b8a989;
  --rule-soft: rgba(184, 169, 137, .36);
  --ink: #131a2e;
  --ink-med: #2a3354;
  --ink-soft: #5c5b4f;
  --ink-dim: #8a8470;
  --gold: #b88d3e;
  --gold-soft: #cfa657;
  --rose: #a0556d;
  --moss: #6b7c4a;
  --sepia: #7a5e3d;
  --serif: "Cormorant Garamond", Georgia, "Noto Serif SC", "Songti SC", serif;
  --sans: Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;

  max-width: none;
  min-height: 100vh;
  margin: 0;
  padding: 0 0 72px;
  position: relative;
  color: var(--ink);
  background:
    radial-gradient(ellipse at top, rgba(255,248,229,.58), transparent 58%),
    linear-gradient(180deg, #f6ecd8 0%, #f0e5cd 100%);
  font-family: var(--sans);
}

.paper-grain {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: .18;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.35  0 0 0 0.42 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

.course-header,
.course-body,
.course-footer {
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin-left: auto;
  margin-right: auto;
}

.course-header {
  margin-top: 28px;
  margin-bottom: 28px;
  padding: 34px 38px;
  overflow: hidden;
  color: var(--ink);
  background:
    linear-gradient(90deg, rgba(255,248,229,.78), rgba(246,236,216,.72)),
    var(--paper-soft);
  border: 1px solid var(--rule-soft);
  border-radius: 4px;
  box-shadow:
    0 1px 0 rgba(255,248,229,.8) inset,
    0 18px 42px rgba(60,45,20,.08);
}

.course-header::before {
  content: "";
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(184,169,137,.42);
  pointer-events: none;
}

.course-header::after {
  content: "COURSE";
  position: absolute;
  right: 34px;
  bottom: -8px;
  font-family: var(--serif);
  font-size: 92px;
  line-height: 1;
  color: rgba(19,26,46,.045);
  letter-spacing: 14px;
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 34px;
  align-items: stretch;
}

.course-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.course-kicker {
  margin-bottom: 12px;
  font-family: var(--serif);
  font-style: italic;
  font-size: 14px;
  color: var(--sepia);
  letter-spacing: 2.8px;
  text-transform: lowercase;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__inner a) {
  color: var(--ink-soft) !important;
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400 !important;
}

:deep(.el-breadcrumb__separator) {
  color: var(--rule) !important;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--ink) !important;
  font-style: normal;
}

.title-row {
  margin: 18px 0 10px;
  gap: 18px;
}

.course-title {
  font-family: var(--serif);
  font-size: clamp(34px, 4vw, 54px);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: 5px;
  color: var(--ink);
}

.course-subtitle {
  max-width: 720px;
  margin: 0 0 18px;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 16px;
  font-style: italic;
  line-height: 1.75;
  letter-spacing: .8px;
}

.fav-btn {
  height: 38px;
  padding: 0 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  background: rgba(255,248,229,.5);
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 14px;
  letter-spacing: 1px;
}

.fav-btn:hover,
.fav-btn.active {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(184,141,62,.08);
}

.course-info-row {
  gap: 8px 10px;
  margin-bottom: 14px;
}

.chapter-stat,
.view-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 3px 0;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 14px;
}

.chapter-stat em,
.view-stat em {
  color: var(--ink-dim);
  font-size: 12px;
  font-style: italic;
}

.course-tags {
  gap: 8px;
}

.course-tag,
:deep(.course-info-row .el-tag) {
  height: auto !important;
  padding: 4px 10px !important;
  border-radius: 999px !important;
  background: rgba(255,248,229,.64) !important;
  border: 1px solid var(--rule-soft) !important;
  color: var(--ink-soft) !important;
  font-family: var(--serif);
  font-size: 12px !important;
  letter-spacing: .7px;
}

:deep(.course-info-row .el-tag--danger) {
  color: var(--rose) !important;
  border-color: rgba(160,85,109,.32) !important;
}

:deep(.course-info-row .el-tag--success) {
  color: var(--moss) !important;
  border-color: rgba(107,124,74,.32) !important;
}

:deep(.course-info-row .el-tag--warning) {
  color: var(--sepia) !important;
  border-color: rgba(184,141,62,.36) !important;
}

.header-cover {
  display: flex;
  align-items: stretch;
}

.cover-img {
  width: 240px;
  height: 100%;
  min-height: 172px;
  border-radius: 3px;
  border: 1px solid var(--paper-edge);
  background: var(--paper-deep);
  box-shadow:
    0 0 0 1px rgba(255,248,229,.75) inset,
    0 10px 24px rgba(60,45,20,.12);
}

:deep(.cover-img .el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(.9) contrast(.98);
}

.course-body {
  display: grid;
  grid-template-columns: 292px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  min-height: 620px;
}

.chapter-sidebar,
.chapter-content-area,
.forum-link-section,
.review-section {
  background: rgba(255,248,229,.54);
  border: 1px solid var(--rule-soft);
  border-radius: 4px;
  box-shadow:
    0 1px 0 rgba(255,248,229,.75) inset,
    0 10px 28px rgba(60,45,20,.06);
}

.chapter-sidebar {
  width: auto;
  top: 22px;
  max-height: calc(100vh - 44px);
}

.sidebar-header {
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--rule-soft);
}

.sidebar-title {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 4px;
}

.progress-text {
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(184,141,62,.1);
  color: var(--sepia);
  font-family: var(--serif);
  font-size: 12px;
}

.sidebar-scroll {
  padding: 8px 0 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--rule) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 5px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: var(--rule);
  border-radius: 3px;
}

.chapter-item {
  gap: 12px;
  padding: 12px 16px;
  border-left: 2px solid transparent;
}

.chapter-item:hover {
  background: rgba(255,248,229,.55);
}

.chapter-item.active {
  background: rgba(19,26,46,.055);
  border-left-color: var(--gold);
}

.chapter-item.completed .chapter-title-text {
  color: var(--ink-dim);
}

.chapter-num {
  width: 25px;
  height: 25px;
  border: 1px solid var(--rule-soft);
  border-radius: 50%;
  background: rgba(255,248,229,.72);
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 12px;
}

.chapter-item.active .chapter-num {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.chapter-item.completed .chapter-num {
  color: var(--moss);
  background: rgba(107,124,74,.09);
}

.chapter-title-text {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 15px;
  line-height: 1.45;
  letter-spacing: .5px;
}

.chapter-duration {
  color: var(--ink-dim);
  font-family: var(--serif);
  font-style: italic;
  font-size: 12px;
}

.chapter-content-area {
  min-height: 620px;
  overflow: hidden;
}

.welcome-state {
  min-height: 520px;
  height: auto;
  padding: 56px 36px;
}

.welcome-icon {
  width: 82px;
  height: 82px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 50%;
  color: var(--gold);
  font-family: var(--serif);
  font-size: 46px;
  background: rgba(255,248,229,.62);
  animation: none;
}

.welcome-state h3 {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: 2px;
}

.welcome-state p {
  color: var(--ink-soft);
  font-family: var(--serif);
  font-style: italic;
  font-size: 15px;
}

.chapter-content {
  padding: 34px 42px 42px;
}

.content-header {
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--rule-soft);
}

.content-title {
  color: var(--ink);
  font-family: var(--serif);
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 2px;
}

.content-meta {
  gap: 8px 12px;
  flex-wrap: wrap;
}

.content-duration {
  color: var(--ink-soft);
  font-family: var(--serif);
  font-style: italic;
  font-size: 14px;
}

:deep(.content-meta .el-tag) {
  border-radius: 999px !important;
  background: rgba(184,141,62,.09) !important;
  border: 1px solid rgba(184,141,62,.32) !important;
  color: var(--sepia) !important;
  font-family: var(--serif);
}

.apod-image-wrapper {
  margin-bottom: 26px;
}

.apod-image {
  max-height: 460px;
  border-radius: 3px;
  border: 1px solid var(--rule-soft);
  background: var(--paper-deep);
}

.apod-image-caption {
  color: var(--ink-dim);
  font-family: var(--serif);
  font-style: italic;
  font-size: 13px;
}

.video-wrapper {
  margin-bottom: 28px;
  border-radius: 4px;
  border: 1px solid rgba(19,26,46,.18);
  background: #08090d;
  box-shadow: 0 16px 36px rgba(19,26,46,.18);
}

.overlay-hint {
  border-radius: 999px;
  background: rgba(19,26,46,.72);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 12px;
}

.rich-content {
  max-width: 820px;
  margin: 0 auto;
  color: var(--ink);
  font-size: 16px;
  line-height: 1.92;
  letter-spacing: .2px;
}

:deep(.rich-content p) {
  margin: 0 0 18px;
}

:deep(.rich-content h1),
:deep(.rich-content h2),
:deep(.rich-content h3) {
  color: var(--ink);
  font-family: var(--serif);
  font-weight: 500;
  line-height: 1.25;
}

:deep(.rich-content h1) {
  margin: 34px 0 18px;
  font-size: 34px;
}

:deep(.rich-content h2) {
  margin: 30px 0 16px;
  font-size: 28px;
}

:deep(.rich-content h3) {
  margin: 24px 0 12px;
  font-size: 22px;
}

:deep(.rich-content img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 24px auto;
  border-radius: 4px;
  border: 1px solid var(--rule-soft);
  background: var(--paper-deep);
}

:deep(.rich-content blockquote) {
  margin: 24px 0;
  padding: 16px 20px;
  border-left: 3px solid var(--gold);
  border-radius: 0 4px 4px 0;
  background: rgba(255,248,229,.62);
  color: var(--ink-soft);
  font-family: var(--serif);
  font-style: italic;
}

:deep(.rich-content ul),
:deep(.rich-content ol) {
  padding-left: 24px;
  margin: 16px 0 20px;
}

:deep(.rich-content li) {
  margin-bottom: 8px;
}

:deep(.rich-content code) {
  padding: 2px 6px;
  border: 1px solid var(--rule-soft);
  border-radius: 3px;
  background: rgba(255,248,229,.78);
  color: var(--rose);
}

.content-loading {
  padding: 34px 42px;
}

.course-footer {
  margin-top: 28px;
}

.forum-link-section {
  margin-bottom: 22px;
  padding: 20px 24px;
}

.forum-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-color: var(--rule-soft) !important;
  background: rgba(255,248,229,.56) !important;
  color: var(--ink) !important;
  font-family: var(--serif);
  letter-spacing: 1px;
}

.forum-btn:hover {
  border-color: var(--gold) !important;
  color: var(--gold) !important;
}

.forum-hint {
  color: var(--ink-soft);
  font-family: var(--serif);
  font-style: italic;
  font-size: 14px;
}

.review-section {
  padding: 26px 30px;
}

.review-header {
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--rule-soft);
}

.review-title {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 4px;
}

.review-total {
  color: var(--ink-dim);
  font-family: var(--serif);
  font-style: italic;
}

.review-form,
.my-review-bar,
.review-card.is-mine {
  background: rgba(255,248,229,.56);
  border: 1px solid var(--rule-soft);
  border-radius: 4px;
}

.form-label,
.review-tip,
.review-date,
.form-tip {
  color: var(--ink-soft);
  font-family: var(--serif);
}

.form-star,
.review-stars {
  color: var(--gold);
}

.form-star {
  color: rgba(184,169,137,.42);
}

.form-star.lit {
  color: var(--gold);
}

.form-hint {
  color: var(--sepia);
  font-family: var(--serif);
}

.my-review-label,
.review-mine-tag {
  background: rgba(184,141,62,.1);
  color: var(--sepia);
  font-family: var(--serif);
}

.my-review-content,
.review-name,
.review-text {
  color: var(--ink);
}

.review-card {
  border-bottom-color: rgba(184,169,137,.24);
}

.review-avatar {
  background: var(--ink);
  color: var(--paper);
}

.review-empty {
  color: var(--ink-dim);
  font-family: var(--serif);
  font-style: italic;
}

:deep(.review-form .el-textarea__inner) {
  background: rgba(255,248,229,.78) !important;
  border: 1px solid var(--rule-soft) !important;
  box-shadow: none !important;
  color: var(--ink);
}

:deep(.review-form .el-textarea__inner:focus) {
  border-color: var(--gold) !important;
}

:deep(.el-button--primary) {
  --el-button-bg-color: var(--ink);
  --el-button-border-color: var(--ink);
  --el-button-hover-bg-color: var(--ink-med);
  --el-button-hover-border-color: var(--ink-med);
  --el-button-active-bg-color: var(--ink);
  --el-button-active-border-color: var(--ink);
  font-family: var(--serif);
  letter-spacing: 1px;
}

:deep(.el-button:not(.el-button--primary)) {
  font-family: var(--serif);
}

:deep(.el-loading-mask) {
  background: rgba(244,235,217,.76) !important;
}

:deep(.el-loading-spinner .path) {
  stroke: var(--gold);
}

:deep(.el-loading-spinner .el-loading-text),
:deep(.el-empty__description p) {
  color: var(--ink-soft) !important;
  font-family: var(--serif);
  font-style: italic;
}

:deep(.el-skeleton__item) {
  background: linear-gradient(90deg, rgba(184,169,137,.14), rgba(255,248,229,.72), rgba(184,169,137,.14)) !important;
}

:deep(.completion-dialog) {
  background: var(--paper-soft) !important;
  border: 1px solid var(--rule-soft);
  border-radius: 4px !important;
}

:deep(.completion-dialog .el-dialog__title) {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 24px;
  letter-spacing: 2px;
}

.completion-desc {
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 15px;
}

.next-course-card {
  border-color: var(--rule-soft);
  border-radius: 4px;
  background: rgba(255,248,229,.62);
}

.next-course-card:hover {
  border-color: var(--gold);
  box-shadow: 0 8px 20px rgba(60,45,20,.12);
}

.next-course-cover {
  border-radius: 3px;
  background: var(--paper-deep);
}

.next-course-title {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 14px;
}

.next-course-meta,
.next-course-empty {
  color: var(--ink-soft);
  font-family: var(--serif);
}

.next-course-badge {
  background: rgba(184,141,62,.1);
  color: var(--sepia);
  border-radius: 999px;
}

@media (max-width: 1180px) {
  .course-header,
  .course-body,
  .course-footer {
    margin-left: 24px;
    margin-right: 24px;
  }
}

@media (max-width: 900px) {
  .header-content {
    grid-template-columns: 1fr;
  }

  .header-cover {
    display: none;
  }

  .course-body {
    display: flex;
    flex-direction: column;
  }

  .chapter-sidebar {
    width: 100%;
    position: static;
    max-height: 320px;
  }
}

@media (max-width: 640px) {
  .course-header {
    margin: 16px 16px 22px;
    padding: 24px 22px;
  }

  .course-header::before {
    inset: 12px;
  }

  .course-title {
    font-size: 31px;
    letter-spacing: 2px;
  }

  .course-body,
  .course-footer {
    margin-left: 16px;
    margin-right: 16px;
  }

  .chapter-content {
    padding: 26px 20px 32px;
  }

  .rich-content {
    font-size: 15px;
  }

  .forum-link-section {
    align-items: flex-start;
    flex-direction: column;
  }

  .review-top {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .review-date {
    margin-left: 0;
  }
}
</style>
