<template>
  <div class="course-manage">
    <section class="admin-page-hero tone-violet">
      <div class="admin-page-copy">
        <span class="admin-page-kicker">LEARNING OPS</span>
        <h2>课程管理</h2>
        <p>管理视频课、书本课和 APOD 章节导入，控制课程发布状态与内容结构。</p>
      </div>
      <div class="admin-page-metrics">
        <div class="admin-metric-card">
          <span>课程总数</span>
          <strong>{{ pagination.total }}</strong>
        </div>
        <div class="admin-metric-card success">
          <span>当页已发布</span>
          <strong>{{ publishedCourseCount }}</strong>
        </div>
        <div class="admin-metric-card warning">
          <span>当页 APOD</span>
          <strong>{{ apodCourseCount }}</strong>
        </div>
      </div>
    </section>

    <!-- ========== 顶部：APOD 同步面板 ========== -->
    <el-card class="apod-sync-card admin-panel-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>NASA APOD 历史数据批量同步</span>
          <el-tooltip content="逐日调用 NASA API 导入历史天文图片为书本课章节，已存在日期自动跳过" placement="top">
            <el-icon class="tip-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <div class="apod-sync-body">
        <el-date-picker
            v-model="apodDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :disabled-date="(d) => d > new Date()"
            style="width: 320px;"
        />
        <el-button
            type="primary"
            :loading="apodSyncing"
            :disabled="!apodDateRange || apodDateRange.length !== 2"
            @click="handleApodSync"
            style="margin-left: 12px;"
        >
          {{ apodSyncing ? '同步中...' : '一键批量导入' }}
        </el-button>
        <span v-if="apodLastResult" class="apod-result-tip">
          本次新增 {{ apodLastResult }} 条章节
        </span>
      </div>
    </el-card>

    <!-- ========== 主体：课程列表 + 章节抽屉 ========== -->
    <el-card class="course-list-card admin-panel-card" shadow="never">
      <div class="admin-toolbar-header">
        <div>
          <span class="admin-card-title">课程列表</span>
          <span class="admin-card-subtitle">维护课程基础信息、章节结构和上下架状态</span>
        </div>
      </div>

      <!-- 搜索 + 新增工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
              v-model="searchForm.keyword"
              placeholder="搜索课程标题"
              clearable
              style="width: 220px;"
              @keyup.enter="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="searchForm.type" placeholder="课程类型" clearable style="width: 120px; margin-left: 8px;">
            <el-option label="视频课" :value="0" />
            <el-option label="书本课" :value="1" />
          </el-select>

          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px; margin-left: 8px;">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
          </el-select>

          <el-button type="primary" @click="handleSearch" style="margin-left: 8px;">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>

        <el-button type="primary" @click="openCourseDialog()">
          <el-icon><Plus /></el-icon> 新增课程
        </el-button>
      </div>

      <!-- 课程表格 -->
      <el-table
          v-loading="loading"
          :data="courseList"
          row-key="id"
          style="width: 100%; margin-top: 16px;"
          border
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="封面" width="80" align="center">
          <template #default="{ row }">
            <el-image
                v-if="row.cover"
                :src="row.cover"
                style="width: 50px; height: 50px; border-radius: 4px;"
                fit="cover"
                :preview-src-list="[row.cover]"
                preview-teleported
            />
            <div v-else class="no-cover">暂无</div>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="课程标题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div>
              <span>{{ row.title }}</span>
              <el-tag v-if="row.isApodCourse === 1" size="small" type="warning" style="margin-left: 4px;">APOD</el-tag>
              <el-tag v-if="row.isMarsCourse === 1" size="small" type="danger" style="margin-left: 4px;">火星</el-tag>
            </div>
            <div v-if="row.subtitle" class="subtitle-text">{{ row.subtitle }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="typeText" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 0 ? 'primary' : 'success'" size="small">{{ row.typeText }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="difficultyText" label="难度" width="80" align="center" />

        <el-table-column prop="chapterCount" label="章节数" width="80" align="center" />

        <el-table-column prop="viewCount" label="学习人次" width="90" align="center" />

        <el-table-column label="标签" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="parseTags(row.tags).length">
              <el-tag
                  v-for="tag in parseTags(row.tags).slice(0, 3)"
                  :key="tag"
                  size="small"
                  style="margin: 2px;"
              >{{ tag }}</el-tag>
              <span v-if="parseTags(row.tags).length > 3" style="font-size: 11px; color: #999;">
                +{{ parseTags(row.tags).length - 3 }}
              </span>
            </template>
            <span v-else style="color: #ccc;">—</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <!-- 发布/下架 -->
            <el-button
                :type="row.status === 1 ? 'warning' : 'success'"
                size="small"
                @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '发布' }}
            </el-button>
            <!-- 章节管理 -->
            <el-button type="primary" size="small" @click="openChapterDrawer(row)">章节</el-button>
            <!-- 编辑 -->
            <el-button size="small" @click="openCourseDialog(row)">编辑</el-button>
            <!-- 删除 -->
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="fetchCourseList"
            @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- ============================================================
         新增/编辑课程弹窗
    ============================================================= -->
    <el-dialog
        v-model="courseDialogVisible"
        :title="courseForm.id ? '编辑课程' : '新增课程'"
        width="680px"
        align-center
        append-to-body
        destroy-on-close
    >
      <el-form
          ref="courseFormRef"
          :model="courseForm"
          :rules="courseRules"
          label-width="90px"
      >
        <el-form-item label="课程标题" prop="title">
          <el-input v-model="courseForm.title" placeholder="请输入课程标题" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="副标题">
          <el-input v-model="courseForm.subtitle" placeholder="简短描述课程内容（可选）" maxlength="300" show-word-limit />
        </el-form-item>

        <el-form-item label="封面图">
          <el-input v-model="courseForm.cover" placeholder="封面图片 URL（可选）" clearable />
          <div v-if="courseForm.cover" style="margin-top: 8px;">
            <el-image :src="courseForm.cover" style="height: 80px;" fit="cover" />
          </div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="课程类型" prop="type">
              <el-radio-group v-model="courseForm.type">
                <el-radio :label="0">📺 视频课</el-radio>
                <el-radio :label="1">📖 书本课</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度">
              <el-select v-model="courseForm.difficulty" style="width: 100%;">
                <el-option label="⭐ 入门" :value="1" />
                <el-option label="⭐⭐ 进阶" :value="2" />
                <el-option label="⭐⭐⭐ 高级" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="排序值">
          <el-input-number v-model="courseForm.sort" :min="0" :max="9999" />
          <span style="margin-left: 8px; color: #999; font-size: 12px;">越大越靠前</span>
        </el-form-item>

        <!-- 标签选择器：预设 chips + 自定义输入 -->
        <el-form-item label="课程标签">
          <div class="tag-selector">
            <!-- 预设标签池 -->
            <div class="preset-tags">
              <span
                  v-for="tag in presetTags"
                  :key="tag"
                  :class="['preset-tag', { active: courseForm.tags.includes(tag) }]"
                  @click="toggleTag(tag)"
              >{{ tag }}</span>
            </div>
            <!-- 已选标签展示 -->
            <div v-if="courseForm.tags.length" class="selected-tags">
              <el-tag
                  v-for="tag in courseForm.tags"
                  :key="tag"
                  closable
                  size="small"
                  style="margin: 2px;"
                  @close="removeTag(tag)"
              >{{ tag }}</el-tag>
            </div>
            <!-- 自定义标签输入 -->
            <div class="custom-tag-input">
              <el-input
                  v-model="customTagInput"
                  placeholder="输入自定义标签后回车追加"
                  size="small"
                  style="width: 220px;"
                  @keyup.enter="addCustomTag"
              >
                <template #append>
                  <el-button size="small" @click="addCustomTag">添加</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSaveCourse">
          {{ courseForm.id ? '保存修改' : '立即创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ============================================================
         章节管理抽屉
    ============================================================= -->
    <el-drawer
        v-model="chapterDrawerVisible"
        :title="`章节管理 — ${currentCourse?.title || ''}`"
        size="700px"
        direction="rtl"
        destroy-on-close
    >
      <template #header>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 600; font-size: 15px;">
            章节管理 — {{ currentCourse?.title }}
          </span>
          <el-tag size="small" :type="currentCourse?.type === 0 ? 'primary' : 'success'">
            {{ currentCourse?.typeText }}
          </el-tag>
        </div>
      </template>

      <!-- 章节列表 -->
      <div v-loading="chapterLoading" class="chapter-list">
        <div
            v-for="(chapter, index) in chapterList"
            :key="chapter.id"
            class="chapter-item"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop="onDrop(index)"
        >
          <el-icon class="drag-handle"><Rank /></el-icon>
          <div class="chapter-info">
            <span class="chapter-index">{{ index + 1 }}</span>
            <div class="chapter-title">
              {{ chapter.title }}
              <el-tag size="small" :type="chapter.source === 'apod' ? 'warning' : (chapter.source === 'mars_rover' ? 'danger' : 'info')" style="margin-left: 6px;">
                {{ chapter.source === 'apod' ? 'APOD' : (chapter.source === 'mars_rover' ? '火星车' : '手动') }}
              </el-tag>
            </div>
            <span class="chapter-duration">{{ chapter.duration || 0 }} min</span>
          </div>
          <div class="chapter-actions">
            <el-button size="small" @click="openChapterDialog(chapter)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteChapter(chapter)">删除</el-button>
          </div>
        </div>

        <el-empty v-if="!chapterLoading && chapterList.length === 0" description="暂无章节，快去新增吧" />
      </div>

      <!-- 底部：新增章节按钮 -->
      <div class="drawer-footer">
        <el-button type="primary" style="width: 100%;" @click="openChapterDialog(null)">
          <el-icon><Plus /></el-icon> 新增章节
        </el-button>
      </div>
    </el-drawer>

    <!-- ============================================================
         新增/编辑章节弹窗
    ============================================================= -->
    <el-dialog
        v-model="chapterDialogVisible"
        :title="chapterForm.id ? '编辑章节' : '新增章节'"
        width="760px"
        align-center
        append-to-body
        destroy-on-close
    >
      <el-form
          ref="chapterFormRef"
          :model="chapterForm"
          :rules="chapterRules"
          label-width="90px"
      >
        <el-form-item label="章节标题" prop="title">
          <el-input v-model="chapterForm.title" placeholder="请输入章节标题" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="内容类型" prop="type">
          <el-radio-group v-model="chapterForm.type" @change="onChapterTypeChange">
            <el-radio :label="0">📺 视频章节</el-radio>
            <el-radio :label="1">📖 图文章节</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 视频章节：平台模板 + ID 输入 + 预览 -->
        <template v-if="chapterForm.type === 0">
          <el-form-item label="视频平台">
            <el-radio-group v-model="videoPlatform" @change="onPlatformChange">
              <el-radio label="bilibili">B站</el-radio>
              <el-radio label="youtube">YouTube</el-radio>
              <el-radio label="douyin">抖音</el-radio>
              <el-radio label="custom">自定义</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="videoPlatform !== 'custom'" :label="videoIdLabel">
            <el-input
                v-model="videoIdInput"
                :placeholder="videoIdPlaceholder"
                @input="buildVideoUrl"
            />
            <div style="margin-top: 4px; color: #999; font-size: 12px;">
              将自动拼接为：{{ previewUrl || '—' }}
            </div>
          </el-form-item>

          <el-form-item label="完整 URL" prop="videoUrl">
            <el-input
                v-model="chapterForm.videoUrl"
                placeholder="视频嵌入 URL（自动填充或直接粘贴完整 URL）"
            />
          </el-form-item>

          <!-- iframe 实时预览 -->
          <el-form-item label="预览效果">
            <div v-if="chapterForm.videoUrl" class="video-preview">
              <iframe
                  :src="chapterForm.videoUrl"
                  frameborder="0"
                  allowfullscreen
                  style="width: 100%; aspect-ratio: 16/9; border-radius: 6px;"
              />
            </div>
            <span v-else style="color: #ccc;">填写视频 URL 后此处显示预览</span>
          </el-form-item>
        </template>

        <!-- 图文章节：TinyMCE 富文本编辑器 -->
        <template v-if="chapterForm.type === 1">
          <el-form-item label="章节内容">
            <!-- TinyMCE 编辑器 -->
            <div ref="tinymceContainer" style="width: 100%;">
              <textarea :id="tinymceId" v-model="chapterForm.content" />
            </div>
            <!-- 图片插入按钮（独立于TinyMCE，100%可靠） -->
            <div style="margin-top: 8px;">
              <el-button size="small" @click="triggerImageUpload">
                <el-icon><Picture /></el-icon> 插入图片
              </el-button>
              <span style="margin-left: 8px; font-size: 12px; color: #909399;">支持 JPG / PNG / GIF，单张建议不超过 2MB</span>
              <input
                  ref="imageFileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  style="display: none;"
                  @change="handleImageInsert"
              />
            </div>
          </el-form-item>
        </template>

        <el-form-item label="学习时长">
          <el-input-number v-model="chapterForm.duration" :min="0" :max="999" />
          <span style="margin-left: 8px; color: #999; font-size: 12px;">分钟</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="chapterDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="chapterSaveLoading" @click="handleSaveChapter">
          {{ chapterForm.id ? '保存修改' : '添加章节' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, QuestionFilled, Rank, Picture
} from '@element-plus/icons-vue'
import {
  getCourseList,
  addCourse, updateCourse, deleteCourse, updateCourseStatus,
  getChapterList, addChapter, updateChapter, deleteChapter, sortChapters,
  syncApod
} from '@/api/admin/course'

// ============================================================
// =================== 预设标签池 ============================
// ============================================================
const presetTags = [
  '深空摄影', '望远镜', '行星观测', '月球', '星座', '天体物理',
  '设备选购', '极光', 'NASA', '火星探测', '哈勃望远镜', '彗星',
  '流星雨', '日食月食', '双筒望远镜', '目镜', '赤道仪'
]

// ============================================================
// =================== 课程列表相关 ==========================
// ============================================================
const loading = ref(false)
const courseList = ref([])
const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ keyword: '', type: null, status: null })

const publishedCourseCount = computed(() => courseList.value.filter(item => item.status === 1).length)
const apodCourseCount = computed(() => courseList.value.filter(item => item.isApodCourse === 1).length)

const fetchCourseList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      type: searchForm.type !== null ? searchForm.type : undefined,
      status: searchForm.status !== null ? searchForm.status : undefined
    }
    const res = await getCourseList(params)
    courseList.value = res.data.records || []
    pagination.total = res.data.total || 0
  } catch (e) {
    ElMessage.error('获取课程列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchCourseList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.type = null
  searchForm.status = null
  pagination.pageNum = 1
  fetchCourseList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchCourseList()
}

// tags JSON 解析工具
const parseTags = (tagsJson) => {
  if (!tagsJson) return []
  try { return JSON.parse(tagsJson) } catch { return [] }
}

// ============================================================
// =================== 发布/下架 =============================
// ============================================================
const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const label = newStatus === 1 ? '发布' : '下架'
  try {
    await ElMessageBox.confirm(`确定要${label}「${row.title}」吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await updateCourseStatus(row.id, newStatus)
    ElMessage.success(`${label}成功`)
    await fetchCourseList()
  } catch (e) {
    ElMessage.error(`${label}失败`)
  }
}

// ============================================================
// =================== 删除课程 ==============================
// ============================================================
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？此操作不可恢复！`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await deleteCourse(row.id)
    ElMessage.success('删除成功')
    // 删的是当前页最后一条时退一页，避免停在空页
    if (courseList.value.length === 1 && pagination.pageNum > 1) {
      pagination.pageNum--
    }
    await fetchCourseList()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// ============================================================
// =================== 新增/编辑课程弹窗 =====================
// ============================================================
const courseDialogVisible = ref(false)
const saveLoading = ref(false)
const courseFormRef = ref(null)
const customTagInput = ref('')

const courseForm = reactive({
  id: null,
  title: '',
  subtitle: '',
  cover: '',
  type: 0,
  difficulty: 1,
  sort: 0,
  tags: []
})

const courseRules = {
  title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择课程类型', trigger: 'change' }]
}

const openCourseDialog = (row = null) => {
  Object.assign(courseForm, {
    id: null, title: '', subtitle: '', cover: '', type: 0, difficulty: 1, sort: 0, tags: []
  })
  customTagInput.value = ''
  if (row) {
    Object.assign(courseForm, {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle || '',
      cover: row.cover || '',
      type: row.type,
      difficulty: row.difficulty || 1,
      sort: row.sort || 0,
      tags: parseTags(row.tags)
    })
  }
  courseDialogVisible.value = true
}

// 标签操作
const toggleTag = (tag) => {
  const idx = courseForm.tags.indexOf(tag)
  if (idx >= 0) {
    courseForm.tags.splice(idx, 1)
  } else {
    if (courseForm.tags.length >= 10) {
      ElMessage.warning('最多添加10个标签')
      return
    }
    courseForm.tags.push(tag)
  }
}

const removeTag = (tag) => {
  const idx = courseForm.tags.indexOf(tag)
  if (idx >= 0) courseForm.tags.splice(idx, 1)
}

const addCustomTag = () => {
  const tag = customTagInput.value.trim()
  if (!tag) return
  if (courseForm.tags.includes(tag)) {
    ElMessage.warning('标签已存在')
    return
  }
  if (courseForm.tags.length >= 10) {
    ElMessage.warning('最多添加10个标签')
    return
  }
  courseForm.tags.push(tag)
  customTagInput.value = ''
}

const handleSaveCourse = async () => {
  await courseFormRef.value.validate()
  saveLoading.value = true
  try {
    const payload = {
      title: courseForm.title,
      subtitle: courseForm.subtitle || undefined,
      cover: courseForm.cover || undefined,
      type: courseForm.type,
      difficulty: courseForm.difficulty,
      sort: courseForm.sort,
      tags: courseForm.tags.length ? courseForm.tags : []
    }
    if (courseForm.id) {
      await updateCourse(courseForm.id, payload)
      ElMessage.success('编辑成功')
    } else {
      await addCourse(payload)
      ElMessage.success('创建成功')
    }
    courseDialogVisible.value = false
    await fetchCourseList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    saveLoading.value = false
  }
}

// ============================================================
// =================== 章节管理抽屉 ==========================
// ============================================================
const chapterDrawerVisible = ref(false)
const chapterLoading = ref(false)
const currentCourse = ref(null)
const chapterList = ref([])

// 拖拽排序状态
const dragStartIndex = ref(-1)

const openChapterDrawer = async (course) => {
  currentCourse.value = course
  chapterDrawerVisible.value = true
  await fetchChapterList()
}

const fetchChapterList = async () => {
  if (!currentCourse.value) return
  chapterLoading.value = true
  try {
    const res = await getChapterList(currentCourse.value.id)
    chapterList.value = res.data || []
  } catch (e) {
    ElMessage.error('获取章节列表失败')
  } finally {
    chapterLoading.value = false
  }
}

// 删除章节
const handleDeleteChapter = async (chapter) => {
  try {
    await ElMessageBox.confirm(`确定删除章节「${chapter.title}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteChapter(chapter.id)
    ElMessage.success('删除成功')
    await fetchChapterList()
    // 同步更新课程列表中的章节数
    await fetchCourseList()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// 拖拽排序
const onDragStart = (index) => {
  dragStartIndex.value = index
}

const onDrop = async (dropIndex) => {
  if (dragStartIndex.value === -1 || dragStartIndex.value === dropIndex) return
  const list = [...chapterList.value]
  const [moved] = list.splice(dragStartIndex.value, 1)
  list.splice(dropIndex, 0, moved)
  chapterList.value = list
  dragStartIndex.value = -1

  // 构建排序请求
  const sortPayload = list.map((item, idx) => ({ id: item.id, sort: idx }))
  try {
    await sortChapters(sortPayload)
    ElMessage.success('排序已保存')
  } catch (e) {
    ElMessage.error('排序保存失败')
    fetchChapterList()
  }
}

// ============================================================
// =================== 新增/编辑章节弹窗 =====================
// ============================================================
const chapterDialogVisible = ref(false)
const chapterSaveLoading = ref(false)
const chapterFormRef = ref(null)

// 视频平台选择
const videoPlatform = ref('youtube')
const videoIdInput = ref('')
const previewUrl = ref('')

const chapterForm = reactive({
  id: null,
  courseId: null,
  title: '',
  type: null,   // 跟随课程 type 初始化
  videoUrl: '',
  content: '',
  duration: 5
})

const chapterRules = {
  title: [{ required: true, message: '请输入章节标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择内容类型', trigger: 'change' }]
}

const videoIdLabel = computed(() => {
  const labels = { bilibili: 'BV号', youtube: '视频ID', douyin: '视频ID' }
  return labels[videoPlatform.value] || '视频ID'
})

const videoIdPlaceholder = computed(() => {
  const map = {
    bilibili: '如 BV1xx411c7mD',
    youtube: '如 dQw4w9WgXcQ',
    douyin: '如 7278945678901234567'
  }
  return map[videoPlatform.value] || ''
})

// 根据平台 + ID 拼接嵌入 URL
const buildVideoUrl = () => {
  const id = videoIdInput.value.trim()
  if (!id) { previewUrl.value = ''; chapterForm.videoUrl = ''; return }

  let url = ''
  if (videoPlatform.value === 'bilibili') {
    url = `https://player.bilibili.com/player.html?bvid=${id}&page=1&high_quality=1&danmaku=0`
  } else if (videoPlatform.value === 'youtube') {
    url = `https://www.youtube.com/embed/${id}`
  } else if (videoPlatform.value === 'douyin') {
    url = `https://open.douyin.com/player/video?vid=${id}`
  }
  previewUrl.value = url
  chapterForm.videoUrl = url
}

const onPlatformChange = () => {
  videoIdInput.value = ''
  previewUrl.value = ''
  chapterForm.videoUrl = ''
}

const onChapterTypeChange = () => {
  chapterForm.videoUrl = ''
  chapterForm.content = ''
  videoIdInput.value = ''
  previewUrl.value = ''
}

// TinyMCE 相关
const tinymceId = `tinymce-chapter-${Date.now()}`
const tinymceContainer = ref(null)
const imageFileInput = ref(null)
let tinymceEditor = null

// 触发图片选择
const triggerImageUpload = () => {
  imageFileInput.value?.click()
}

// 图片选择后转 base64 插入编辑器
const handleImageInsert = (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return
  const promises = files.map(file => new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = (ev) => resolve(`<img src="${ev.target.result}" style="max-width: 100%; height: auto;" />`)
    reader.readAsDataURL(file)
  }))
  Promise.all(promises).then(imgTags => {
    const newContent = (chapterForm.content || '') + imgTags.join('')
    chapterForm.content = newContent
    // 同步到 TinyMCE 显示（如果编辑器已初始化）
    if (tinymceEditor) {
      tinymceEditor.setContent(newContent)
    }
  })
  e.target.value = ''
}

// 等待 TinyMCE CDN 脚本加载完成（最多等 10 秒）
const waitForTinyMCE = () => new Promise((resolve, reject) => {
  if (typeof window.tinymce !== 'undefined') { resolve(); return }
  let attempts = 0
  const timer = setInterval(() => {
    attempts++
    if (typeof window.tinymce !== 'undefined') {
      clearInterval(timer)
      resolve()
    } else if (attempts >= 100) {  // 100 × 100ms = 10s
      clearInterval(timer)
      reject(new Error('TinyMCE 加载超时，请检查网络或 API key'))
    }
  }, 100)
})

const initTinyMCE = async () => {
  await nextTick()
  try {
    await waitForTinyMCE()
  } catch (e) {
    console.error(e.message)
    ElMessage.error('富文本编辑器加载失败，请刷新页面重试')
    return
  }
  window.tinymce.init({
    selector: `#${tinymceId}`,
    language: 'zh_CN',
    height: 380,

    plugins: 'lists link image table code fullscreen paste',
    toolbar: 'undo redo | styleselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image | table | code | fullscreen',
    paste_data_images: true,
    automatic_uploads: false,
    setup: (editor) => {
      tinymceEditor = editor
      editor.on('change keyup', () => {
        chapterForm.content = editor.getContent()
      })
    }
  })
}

const destroyTinyMCE = () => {
  if (tinymceEditor) {
    tinymceEditor.destroy()
    tinymceEditor = null
  }
}

const openChapterDialog = async (chapter = null) => {
  // 清空表单
  Object.assign(chapterForm, {
    id: null,
    courseId: currentCourse.value?.id,
    title: '',
    type: currentCourse.value?.type ?? 0,
    videoUrl: '',
    content: '',
    duration: 5
  })
  videoIdInput.value = ''
  previewUrl.value = ''
  videoPlatform.value = 'youtube'

  if (chapter) {
    Object.assign(chapterForm, {
      id: chapter.id,
      courseId: currentCourse.value?.id,
      title: chapter.title,
      type: chapter.type,
      videoUrl: chapter.videoUrl || '',
      content: chapter.content || '',
      duration: chapter.duration || 5
    })
  }

  chapterDialogVisible.value = true

  // 图文类型时初始化 TinyMCE
  if (chapterForm.type === 1) {
    await nextTick()
    initTinyMCE()
  }
}

// 监听 type 变化以初始化/销毁编辑器
const handleChapterTypeChange = async (type) => {
  destroyTinyMCE()
  if (type === 1) {
    await nextTick()
    initTinyMCE()
  }
}

const handleSaveChapter = async () => {
  await chapterFormRef.value.validate()

  // 同步 TinyMCE 内容
  if (chapterForm.type === 1 && tinymceEditor) {
    chapterForm.content = tinymceEditor.getContent()
  }

  if (chapterForm.type === 0 && !chapterForm.videoUrl) {
    ElMessage.warning('请填写视频 URL')
    return
  }

  chapterSaveLoading.value = true
  try {
    const payload = {
      courseId: chapterForm.courseId,
      title: chapterForm.title,
      type: chapterForm.type,
      videoUrl: chapterForm.videoUrl || undefined,
      content: chapterForm.content || undefined,
      duration: chapterForm.duration
    }

    if (chapterForm.id) {
      await updateChapter(chapterForm.id, payload)
      ElMessage.success('章节编辑成功')
    } else {
      await addChapter(payload)
      ElMessage.success('章节添加成功')
    }

    destroyTinyMCE()
    chapterDialogVisible.value = false
    await fetchChapterList()
    await fetchCourseList() // 刷新章节数
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    chapterSaveLoading.value = false
  }
}

// ============================================================
// =================== APOD 批量同步 =========================
// ============================================================
const apodDateRange = ref([])
const apodSyncing = ref(false)
const apodLastResult = ref(null)

const handleApodSync = async () => {
  if (!apodDateRange.value || apodDateRange.value.length !== 2) return

  const [startDate, endDate] = apodDateRange.value
  const diffDays = (new Date(endDate) - new Date(startDate)) / 86400000
  if (diffDays > 60) {
    ElMessage.warning('单次同步范围不能超过60天，请分批操作')
    return
  }

  try {
    await ElMessageBox.confirm(
        `将批量同步 ${startDate} 至 ${endDate} 共约 ${Math.ceil(diffDays) + 1} 天的 NASA APOD 数据，已存在日期自动跳过，确认继续？`,
        'APOD 批量同步',
        { type: 'info', confirmButtonText: '开始同步' }
    )
  } catch {
    return
  }

  apodSyncing.value = true
  apodLastResult.value = null
  try {
    const res = await syncApod({ startDate, endDate })
    apodLastResult.value = res.data.newCount
    ElMessage.success(`同步完成，本次新增 ${res.data.newCount} 条章节`)
    await fetchCourseList() // 刷新章节数
  } catch (e) {
    ElMessage.error(e.message || 'APOD 同步失败')
  } finally {
    apodSyncing.value = false
  }
}

// ============================================================
// =================== 生命周期 ==============================
// ============================================================
onMounted(() => {
  fetchCourseList()
})

onBeforeUnmount(() => {
  destroyTinyMCE()
})
</script>

<style scoped>
.course-manage {
  padding: 0;
}

.course-list-card {
  margin-top: 16px;
}

/* ===== APOD 同步面板 ===== */
.apod-sync-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #111827;
  color: #f8fafc;
  border-radius: 12px 12px 0 0;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.tip-icon {
  cursor: help;
  opacity: 0.7;
}
.apod-sync-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  padding: 4px 0;
}
.apod-result-tip {
  margin-left: 16px;
  color: #8a5a1f;
  font-size: 13px;
}

:deep(.el-table th.el-table__cell) {
  background: #f8fafc;
  color: #475569;
  font-weight: 800;
}

/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

/* ===== 分页 ===== */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ===== 封面 ===== */
.no-cover {
  width: 50px;
  height: 50px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 12px;
  margin: 0 auto;
}
.subtitle-text {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

/* ===== 标签选择器 ===== */
.tag-selector {
  width: 100%;
}
.preset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.preset-tag {
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #dcdfe6;
  font-size: 12px;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s;
  user-select: none;
}
.preset-tag:hover {
  border-color: #409eff;
  color: #409eff;
}
.preset-tag.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}
.selected-tags {
  margin-bottom: 8px;
}
.custom-tag-input {
  margin-top: 4px;
}

/* ===== 章节抽屉 ===== */
.chapter-list {
  padding: 0 4px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}
.chapter-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  cursor: grab;
  transition: box-shadow 0.2s;
}
.chapter-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.drag-handle {
  color: #c0c4cc;
  margin-right: 10px;
  cursor: grab;
}
.chapter-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.chapter-index {
  font-size: 12px;
  color: #909399;
  min-width: 24px;
}
.chapter-title {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chapter-duration {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}
.chapter-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}
.drawer-footer {
  padding: 12px 0 0;
  border-top: 1px solid #ebeef5;
  margin-top: 8px;
}

/* ===== 视频预览 ===== */
.video-preview {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ebeef5;
}
</style>
