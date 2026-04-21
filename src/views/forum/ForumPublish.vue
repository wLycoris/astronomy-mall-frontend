<template>
  <div class="creator-platform">
    <!-- ═══════════ 编辑区 ═══════════ -->
    <main class="editor-area">
      <!-- ① 图片编辑区 -->
      <div class="section-block image-block">
        <div class="image-header">
          <div class="image-header-left">
            <span class="section-title">图片编辑</span>
            <span v-if="uploadedImages.length > 0" class="image-num">{{ uploadedImages.length }}/9</span>
          </div>
          <span v-if="uploadedImages.length > 0" class="cover-hint">第一张将作为封面</span>
        </div>
        <div
          class="image-zone"
          :class="{ 'drag-active': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <!-- + 添加按钮 -->
          <div v-if="uploadedImages.length < 9" class="add-btn" @click="triggerFileInput">
            <el-icon :size="28"><Plus /></el-icon>
          </div>
          <!-- 缩略图 -->
          <div
            v-for="(img, idx) in uploadedImages"
            :key="idx"
            class="thumb"
            @click="previewIndex = idx; previewVisible = true"
          >
            <img :src="img" />
            <span class="thumb-num">{{ idx + 1 }}</span>
            <div class="thumb-del" @click.stop="removeImage(idx)">
              <el-icon :size="10"><Close /></el-icon>
            </div>
          </div>
          <!-- 空状态文字 -->
          <span v-if="uploadedImages.length === 0" class="zone-hint">拖拽图片到此处或点击上传，最多9张</span>
        </div>
        <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="handleFileSelect" />
      </div>

      <!-- ② 标题 -->
      <div class="section-block title-block">
        <input v-model="form.title" class="title-input" placeholder="填写标题会有更多赞哦" maxlength="200" />
      </div>

      <!-- ③ 正文 -->
      <div class="section-block content-block">
        <textarea v-model="form.content" class="content-input" placeholder="分享你的天文观测经历、器材使用心得、摄影技巧..."></textarea>
        <!-- AI识别关联 -->
        <div v-if="recognitionId" class="recognition-badge">
          <el-icon><Connection /></el-icon>
          <span>已关联AI识别结果 #{{ recognitionId }}</span>
        </div>
      </div>

      <!-- ④ 标签横排（仿小红书 #话题） -->
      <div class="section-block tags-block">
        <!-- 已选标签 -->
        <span v-for="tag in selectedTags" :key="tag" class="tag-item selected" @click="removeTag(tag)">
          #{{ tag }} <el-icon :size="10"><Close /></el-icon>
        </span>
        <!-- 未选预设 -->
        <span v-for="tag in visibleUnselected" :key="'u-'+tag" class="tag-item" @click="toggleTag(tag)">
          #{{ tag }}
        </span>
        <span v-if="hasMore && !showAll" class="tag-item more" @click="showAll = true">更多 ></span>
      </div>

      <!-- ⑤ 工具栏 -->
      <div class="section-block toolbar-block">
        <div class="toolbar-left">
          <el-popover placement="top" :width="260" trigger="click">
            <template #reference>
              <span class="tool-btn"># 话题</span>
            </template>
            <el-input v-model="customTag" placeholder="输入自定义标签，回车添加" @keydown.enter.prevent="addCustomTag">
              <template #append><el-button @click="addCustomTag">添加</el-button></template>
            </el-input>
          </el-popover>
        </div>
        <span class="tool-count">{{ form.content.length }}/10000</span>
      </div>

      <!-- ⑥ 内容设置（折叠区） -->
      <div class="section-block settings-block">
        <div class="settings-header" @click="settingsOpen = !settingsOpen">
          <span class="section-title">内容设置</span>
          <span class="settings-toggle">{{ settingsOpen ? '收起' : '展开' }} {{ settingsOpen ? '∧' : '∨' }}</span>
        </div>
        <div v-if="settingsOpen" class="settings-body">
          <div class="setting-row">
            <span>原创声明</span>
            <el-switch v-model="originalDeclare" size="small" />
          </div>
        </div>
      </div>

      <!-- ⑦ 底部操作按钮 -->
      <div class="action-bar">
        <el-button class="btn-save" round @click="goBack">暂存离开</el-button>
        <el-button class="btn-pub" type="primary" round :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '发布' }}
        </el-button>
      </div>
    </main>

    <!-- ═══════════ 右侧预览区 ═══════════ -->
    <aside class="preview-side">
      <!-- Tab 切换 -->
      <div class="preview-tabs">
        <span class="ptab" :class="{ active: previewTab === 'note' }" @click="previewTab = 'note'">笔记预览</span>
        <span class="ptab" :class="{ active: previewTab === 'cover' }" @click="previewTab = 'cover'">封面预览</span>
      </div>

      <!-- ── 笔记预览（帖子详情页） ── -->
      <div v-if="previewTab === 'note'" class="web-preview">
        <div class="detail-preview">
          <!-- 顶部作者栏 -->
          <div class="dp-header">
            <span class="dp-back">‹</span>
            <div class="dp-author-bar">
              <div class="dp-avatar"><el-icon :size="14"><User /></el-icon></div>
              <span class="dp-name">我</span>
            </div>
            <span class="dp-follow">关注</span>
          </div>
          <!-- 图片区 -->
          <div class="dp-images" v-if="uploadedImages.length > 0">
            <img :src="uploadedImages[0]" />
            <span v-if="uploadedImages.length > 1" class="dp-img-count">1/{{ uploadedImages.length }}</span>
          </div>
          <div v-else class="dp-images-empty">
            <el-icon :size="36"><Picture /></el-icon>
            <span>暂无图片</span>
          </div>
          <!-- 正文 -->
          <div class="dp-content-area">
            <div class="dp-title">{{ form.title || '帖子标题' }}</div>
            <div class="dp-text">{{ previewContent || '帖子正文内容...' }}</div>
            <div class="dp-tags" v-if="selectedTags.length">
              <span v-for="t in selectedTags" :key="t">#{{ t }}</span>
            </div>
            <div class="dp-time">编辑于 刚刚</div>
          </div>
          <!-- 评论区占位 -->
          <div class="dp-comment-hint">
            <div class="dp-avatar-sm"><el-icon :size="12"><User /></el-icon></div>
            <span>说点什么，让 TA 也认识看笔记的你</span>
          </div>
          <!-- 底部操作栏 -->
          <div class="dp-actions">
            <span class="dp-input-hint">说点什么...</span>
            <div class="dp-btns">
              <span>点赞</span>
              <span>收藏</span>
              <span>评论</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 封面预览（瀑布流列表中的卡片） ── -->
      <div v-if="previewTab === 'cover'" class="web-preview">
        <div class="cover-waterfall">
          <!-- 左列 -->
          <div class="wf-column">
            <!-- 我的帖子卡片（高亮） -->
            <div class="wf-card mine">
              <div class="wf-cover">
                <img v-if="uploadedImages.length > 0" :src="uploadedImages[0]" />
                <div v-else class="wf-cover-empty"></div>
              </div>
              <div class="wf-info">
                <div class="wf-title">{{ form.title || '帖子标题预览' }}</div>
                <div class="wf-meta">
                  <div class="wf-avatar"><el-icon :size="10"><User /></el-icon></div>
                  <span class="wf-nick">我</span>
                  <span class="wf-like">0</span>
                </div>
              </div>
            </div>
            <!-- 占位卡片 -->
            <div class="wf-card placeholder">
              <div class="wf-cover"><div class="wf-cover-empty short"></div></div>
              <div class="wf-info">
                <div class="wf-title placeholder-text">示例笔记标题2</div>
                <div class="wf-meta">
                  <div class="wf-avatar"><el-icon :size="10"><User /></el-icon></div>
                  <span class="wf-nick">用户名</span>
                  <span class="wf-like">0</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 右列 -->
          <div class="wf-column">
            <div class="wf-card placeholder">
              <div class="wf-cover"><div class="wf-cover-empty tall"></div></div>
              <div class="wf-info">
                <div class="wf-title placeholder-text">示例笔记标题1</div>
                <div class="wf-meta">
                  <div class="wf-avatar"><el-icon :size="10"><User /></el-icon></div>
                  <span class="wf-nick">用户名</span>
                  <span class="wf-like">0</span>
                </div>
              </div>
            </div>
            <div class="wf-card placeholder">
              <div class="wf-cover"><div class="wf-cover-empty"></div></div>
              <div class="wf-info">
                <div class="wf-title placeholder-text">示例笔记标题3</div>
                <div class="wf-meta">
                  <div class="wf-avatar"><el-icon :size="10"><User /></el-icon></div>
                  <span class="wf-nick">用户名</span>
                  <span class="wf-like">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 图片大图预览 -->
    <el-image-viewer v-if="previewVisible" :url-list="uploadedImages" :initial-index="previewIndex" @close="previewVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, Close, Connection, Picture, PictureFilled, User, Star
} from '@element-plus/icons-vue'
import { publishPost, updatePost } from '@/api/forum'

const route = useRoute()
const router = useRouter()

// ────────── 表单数据 ──────────
const form = ref({ title: '', content: '' })
const uploadedImages = ref([])
const selectedTags = ref([])
const customTag = ref('')
const submitting = ref(false)
const compressing = ref(false)
const isDragOver = ref(false)
const fileInputRef = ref(null)
const showAll = ref(false)
const settingsOpen = ref(false)
const originalDeclare = ref(false)
const previewTab = ref('note') // 'note' | 'cover'

// 图片预览
const previewVisible = ref(false)
const previewIndex = ref(0)

// 编辑/AI识别
const postId = computed(() => route.query.id ? Number(route.query.id) : null)
const isEdit = computed(() => !!postId.value)
const recognitionId = computed(() => route.query.recognitionId ? Number(route.query.recognitionId) : null)

// ────────── 标签 ──────────
const presetTags = [
  '深空摄影', '行星摄影', '星野摄影', '望远镜', '目镜',
  '赤道仪', '经纬仪', '天文相机', '滤镜', '观测报告',
  '器材评测', '新手入门', '星空分享', '月球', '太阳',
  '流星雨', '彗星', '星云', '星团', '银河'
]
const VISIBLE = 7
const unselected = computed(() => presetTags.filter(t => !selectedTags.value.includes(t)))
const visibleUnselected = computed(() => showAll.value ? unselected.value : unselected.value.slice(0, VISIBLE))
const hasMore = computed(() => unselected.value.length > VISIBLE)

// 预览截断
const previewContent = computed(() => {
  const c = form.value.content
  return c.length > 120 ? c.slice(0, 120) + '...' : c
})

// ────────── 编辑模式 / AI识别预填加载 ──────────
// 7.8: 编辑模式与"从识别页分享"模式都从 query 读预填字段，
// 二者结构完全一致(title/content/images/tags), recognitionId 仅在分享模式存在。
onMounted(() => {
  if (isEdit.value || recognitionId.value) {
    const { title, content, images, tags } = route.query
    if (title) form.value.title = title
    if (content) form.value.content = content
    if (images) { try { uploadedImages.value = JSON.parse(images) } catch {} }
    if (tags) { try { selectedTags.value = JSON.parse(tags) } catch {} }
  }
})

// ────────── 标签操作 ──────────
const toggleTag = (tag) => {
  if (selectedTags.value.length >= 5) { ElMessage.warning('最多选择5个标签'); return }
  selectedTags.value.push(tag)
}
const removeTag = (tag) => {
  const i = selectedTags.value.indexOf(tag)
  if (i >= 0) selectedTags.value.splice(i, 1)
}
const addCustomTag = () => {
  const t = customTag.value.trim()
  if (!t) return
  if (selectedTags.value.includes(t)) { ElMessage.warning('标签已存在'); customTag.value = ''; return }
  if (selectedTags.value.length >= 5) { ElMessage.warning('最多选择5个标签'); return }
  selectedTags.value.push(t); customTag.value = ''
}

// ────────── 图片上传 ──────────
const triggerFileInput = () => fileInputRef.value?.click()
const handleFileSelect = async (e) => {
  await processFiles(Array.from(e.target.files).filter(f => f.type.startsWith('image/')))
  e.target.value = ''
}
const handleDrop = async (e) => {
  isDragOver.value = false
  await processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')))
}
const processFiles = async (files) => {
  const rem = 9 - uploadedImages.value.length
  if (rem <= 0) { ElMessage.warning('最多上传9张图片'); return }
  compressing.value = true
  try {
    const r = await Promise.all(files.slice(0, rem).map(compressImage))
    uploadedImages.value.push(...r)
  } catch { ElMessage.error('图片处理失败') }
  finally { compressing.value = false }
}
const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1200
      let { width: w, height: h } = img
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX } else { w = Math.round(w * MAX / h); h = MAX }
      }
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject; img.src = e.target.result
  }
  reader.onerror = reject; reader.readAsDataURL(file)
})
const removeImage = (i) => uploadedImages.value.splice(i, 1)

// ────────── 提交 ──────────
const handleSubmit = async () => {
  if (!form.value.title.trim()) { ElMessage.warning('请输入帖子标题'); return }
  if (!form.value.content.trim()) { ElMessage.warning('请输入帖子内容'); return }
  submitting.value = true
  try {
    const data = {
      title: form.value.title.trim(),
      content: form.value.content,
      images: uploadedImages.value.length > 0 ? JSON.stringify(uploadedImages.value) : null,
      tags: selectedTags.value.length > 0 ? JSON.stringify(selectedTags.value) : null,
      recognitionId: recognitionId.value || null
    }
    if (isEdit.value) { await updatePost(postId.value, data); ElMessage.success('帖子已更新') }
    else { await publishPost(data); ElMessage.success('帖子发布成功') }
    router.push('/forum')
  } catch (err) { ElMessage.error(err.response?.data?.message || '操作失败') }
  finally { submitting.value = false }
}
const goBack = () => router.back()
</script>

<style lang="scss" scoped>
/* ═══════════════════════════════════════
   完全仿小红书创作服务平台 Web 版
   ═══════════════════════════════════════ */
$red: #d84b5f;
$ink: #101722;
$gold: #c89b53;
$blue: #2f6f9f;
$border: #e7e1d7;
$bg: #f7f5ef;
$card: #fffdfa;
$text: #101722;
$text2: #536071;
$text3: #7a8494;
$text4: #a8b0ba;

.creator-platform {
  display: flex;
  min-height: 100vh;
  background:
    linear-gradient(rgba(16, 23, 34, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 23, 34, 0.025) 1px, transparent 1px),
    #f7f5ef;
  background-size: 36px 36px, 36px 36px, auto;
}

/* ─── 编辑区 ─── */
.editor-area {
  flex: 1;
  min-width: 0;
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
  margin: 20px 0 20px 24px;
  background: $card;
  border: 1px solid $border;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 14px 32px rgba(16, 23, 34, 0.07);
}

.section-block {
  padding: 0 32px;
}

/* ① 图片编辑 */
.image-block {
  padding-top: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid $border;
}

.image-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.image-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: $text;
}

.image-num {
  font-size: 13px;
  color: $text3;
}

.cover-hint {
  font-size: 12px;
  color: $gold;
}

.image-zone {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f1e9;
  border: 1px dashed rgba(16, 23, 34, 0.16);
  border-radius: 8px;
  padding: 16px;
  min-height: 88px;
  overflow-x: auto;
  transition: outline 0.2s;

  &.drag-active {
    outline: 2px solid rgba(47, 111, 159, 0.2);
    background: #eef5f7;
  }

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }
}

.add-btn {
  width: 72px;
  height: 72px;
  border: 1.5px dashed #b8aa98;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  color: $text3;
  transition: all 0.2s;
  background: rgba(255, 253, 250, 0.72);
  &:hover { border-color: $gold; color: $ink; background: #fffdfa; }
}

.thumb {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  border: 2px solid transparent;
  &:hover { border-color: $gold; }
  img { width: 100%; height: 100%; object-fit: cover; }

  .thumb-num {
    position: absolute; top: 2px; left: 2px;
    min-width: 16px; height: 16px;
    background: rgba(0,0,0,.55); color: #fff;
    font-size: 10px; border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
  }

  .thumb-del {
    position: absolute; top: 2px; right: 2px;
    width: 16px; height: 16px;
    background: rgba(0,0,0,.45); color: #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.15s; cursor: pointer;
    &:hover { background: $ink; }
  }
  &:hover .thumb-del { opacity: 1; }
}

.zone-hint {
  font-size: 13px;
  color: #c0c0c0;
  white-space: nowrap;
}

/* ② 标题 */
.title-block {
  padding-top: 20px;
  padding-bottom: 0;
}

.title-input {
  width: 100%;
  border: none;
  padding: 0 0 14px;
  font-size: 17px;
  font-weight: 700;
  color: $text;
  outline: none;
  border-bottom: 1px solid $border;
  background: transparent;
  &::placeholder { color: $text4; font-weight: 400; }
  &:focus { border-bottom-color: $gold; }
}

/* ③ 正文 */
.content-block {
  padding-top: 16px;
  flex: 1;
}

.content-input {
  width: 100%;
  border: none;
  padding: 0;
  font-size: 15px;
  line-height: 1.8;
  color: $text;
  resize: none;
  outline: none;
  min-height: 240px;
  background: transparent;
  &::placeholder { color: $text4; }
}

.recognition-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #f6ead4;
  border-radius: 3px;
  color: #8a5d1f;
  font-size: 12px;
  margin-top: 8px;
}

/* ④ 标签 */
.tags-block {
  padding-top: 12px;
  padding-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border-top: 1px solid $border;
}

.tag-item {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  color: $text3;
  background: #f3efe7;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: all 0.15s;
  &:hover { color: $ink; background: #ece5d9; }
  &.selected { color: $ink; background: #f4eadb; font-weight: 700; }
  &.more { background: transparent; color: $gold; &:hover { color: $ink; } }
}

/* ⑤ 工具栏 */
.toolbar-block {
  padding-top: 10px;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid $border;
}

.tool-btn {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: $text2;
  cursor: pointer;
  &:hover { background: #f3efe7; }
}

.tool-count {
  font-size: 12px;
  color: $text4;
}

/* ⑥ 内容设置 */
.settings-block {
  padding-top: 0;
  padding-bottom: 0;
  border-top: 1px solid $border;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  cursor: pointer;
}

.settings-toggle {
  font-size: 13px;
  color: $text3;
}

.settings-body {
  padding-bottom: 14px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: $text2;
}

/* ⑦ 底部操作 */
.action-bar {
  padding: 20px 32px;
  display: flex;
  justify-content: center;
  gap: 16px;
  border-top: 1px solid $border;
  background: $card;
  position: sticky;
  bottom: 0;
}

.btn-save {
  min-width: 130px;
  height: 40px;
  font-size: 14px;
  color: $text2;
  border-color: #d8cebf;
  background: #fffdfa;
  &:hover { color: $text; border-color: $gold; }
}

.btn-pub {
  min-width: 130px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  background: $ink;
  border-color: $ink;
  &:hover { background: #1b2637; border-color: #1b2637; }
}

/* ─── 右侧预览 ─── */
.preview-side {
  width: 340px;
  flex-shrink: 0;
  padding: 20px 20px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  background: transparent;
}

.preview-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid $border;
  padding-bottom: 10px;
}

.ptab {
  font-size: 14px;
  color: $text3;
  cursor: pointer;
  padding-bottom: 10px;
  margin-bottom: -11px;
  &.active {
    color: $text;
    font-weight: 600;
    border-bottom: 2px solid $gold;
  }
}

.web-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 详情预览（模拟帖子详情页） */
.detail-preview {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 16px 34px rgba(16,23,34,.12);
  background: $card;
  border: 1px solid $border;
}

.dp-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  gap: 8px;
  border-bottom: 1px solid $border;
  background: #fffdfa;
}

.dp-back {
  font-size: 18px;
  color: $text3;
  cursor: default;
}

.dp-author-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.dp-avatar {
  width: 24px; height: 24px;
  border-radius: 50%; background: #f1eadf;
  display: flex; align-items: center; justify-content: center;
  color: #bbb;
}

.dp-name {
  font-size: 13px;
  color: $text;
  font-weight: 500;
}

.dp-follow {
  font-size: 12px;
  color: $blue;
  border: 1px solid rgba(47, 111, 159, 0.32);
  border-radius: 12px;
  padding: 2px 12px;
  cursor: default;
}

.dp-images {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: $ink;

  img { width: 100%; height: 100%; object-fit: contain; }

  .dp-img-count {
    position: absolute;
    bottom: 8px; right: 8px;
    background: rgba(0,0,0,.55);
    color: #fff; font-size: 11px;
    padding: 1px 8px; border-radius: 8px;
  }
}

.dp-content-area {
  padding: 12px;
}

.dp-title {
  font-size: 15px;
  font-weight: 600;
  color: $text;
  margin-bottom: 6px;
  line-height: 1.4;
}

.dp-text {
  font-size: 13px;
  color: $text2;
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: 8px;
}

.dp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  span {
    font-size: 12px;
    color: $blue;
  }
}

.dp-time {
  font-size: 11px;
  color: $text4;
}

.dp-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: 1px solid $border;

.dp-input-hint {
    font-size: 12px;
    color: $text4;
    background: #f3efe7;
    padding: 4px 12px;
    border-radius: 14px;
  }

  .dp-btns {
    display: flex;
    gap: 12px;
    span {
      font-size: 11px;
      color: $text3;
    }
  }
}

/* 笔记预览 - 详情补充样式 */
.dp-images-empty {
  width: 100%;
  aspect-ratio: 4/3;
  background: #f3efe7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #ddd;
  font-size: 12px;
}

.dp-comment-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid $border;
  font-size: 12px;
  color: $text4;
}

.dp-avatar-sm {
  width: 24px; height: 24px;
  border-radius: 50%; background: #f1eadf;
  display: flex; align-items: center; justify-content: center;
  color: #ccc; flex-shrink: 0;
}

/* 封面预览 - 瀑布流 */
.cover-waterfall {
  display: flex;
  gap: 8px;
}

.wf-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wf-card {
  border-radius: 8px;
  overflow: hidden;
  background: $card;
  border: 1px solid $border;
  box-shadow: 0 10px 24px rgba(16,23,34,.07);

  &.mine {
    box-shadow: 0 0 0 2px rgba(200,155,83,.55), 0 12px 26px rgba(16,23,34,.12);
  }

  &.placeholder {
    opacity: 0.5;
  }
}

.wf-cover {
  width: 100%;
  overflow: hidden;
  background: #f1eadf;

  img {
    width: 100%;
    display: block;
    object-fit: cover;
  }
}

.wf-cover-empty {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #e6ded2, #f5f1e9);

  &.short { height: 90px; }
  &.tall { height: 150px; }
}

.wf-info {
  padding: 8px 10px;
}

.wf-title {
  font-size: 12px;
  font-weight: 600;
  color: $text;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
  min-height: 16px;

  &.placeholder-text {
    color: $text3;
    font-weight: 400;
  }
}

.wf-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: $text3;
}

.wf-avatar {
  width: 14px; height: 14px;
  border-radius: 50%; background: #eee;
  display: flex; align-items: center; justify-content: center;
  color: #ccc;
}

.wf-nick { flex: 1; }

.wf-like { color: $text4; }

/* ─── 响应式 ─── */
@media (max-width: 1200px) {
  .preview-side { display: none; }
}
</style>
