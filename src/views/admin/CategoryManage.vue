<!-- ============================================ -->
<!-- CategoryManage.vue - 分类管理页            -->
<!-- 路径: src/views/admin/CategoryManage.vue   -->
<!-- ============================================ -->
<template>
  <div class="category-manage">

    <!-- ===== 搜索/筛选栏 ===== -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="分类名称">
          <el-input
              v-model="searchForm.keyword"
              placeholder="输入分类名称"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="分类层级">
          <el-select
              v-model="searchForm.level"
              placeholder="全部"
              clearable
              style="width: 120px"
          >
            <el-option label="一级分类" :value="1" />
            <el-option label="二级分类" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="显示状态">
          <el-select
              v-model="searchForm.isShow"
              placeholder="全部"
              clearable
              style="width: 120px"
          >
            <el-option label="显示" :value="1" />
            <el-option label="隐藏" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ===== 分类树表格 ===== -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>分类列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd(null)">
            新增一级分类
          </el-button>
        </div>
      </template>

      <el-table
          :data="filteredTree"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          default-expand-all
          v-loading="loading"
          border
          stripe
      >
        <!-- 分类名称 -->
        <el-table-column prop="categoryName" label="分类名称" min-width="180">
          <template #default="{ row }">
            <div class="name-cell">
              <el-avatar
                  v-if="row.icon"
                  :src="row.icon"
                  :size="28"
                  shape="square"
                  class="category-icon"
              />
              <el-icon v-else class="no-icon"><FolderOpened /></el-icon>
              <span :class="{ 'level1-name': row.level === 1, 'level2-name': row.level === 2 }">
                {{ row.categoryName }}
              </span>
              <el-tag
                  :type="row.level === 1 ? 'primary' : 'info'"
                  size="small"
                  style="margin-left: 6px"
              >
                {{ row.level === 1 ? '一级' : '二级' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 排序值 -->
        <el-table-column prop="sort" label="排序" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.sort }}</el-tag>
          </template>
        </el-table-column>

        <!-- 商品数量 -->
        <el-table-column prop="productCount" label="商品数量" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.productCount > 0 ? 'success' : 'info'" size="small">
              {{ row.productCount }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 是否显示 -->
        <el-table-column label="是否显示" width="110" align="center">
          <template #default="{ row }">
            <el-switch
                :model-value="row.isShow === 1"
                @change="(val) => handleToggleShow(row, val)"
            />
          </template>
        </el-table-column>

        <!-- 描述 -->
        <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />

        <!-- 创建时间 -->
        <el-table-column prop="createTime" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
                v-if="row.level === 1"
                type="success"
                size="small"
                :icon="Plus"
                @click="handleAdd(row)"
            >
              添加子分类
            </el-button>
            <el-button
                type="info"
                size="small"
                plain
                :icon="Top"
                title="上移（增大排序值）"
                @click="handleMove(row, 'up')"
            />
            <el-button
                type="info"
                size="small"
                plain
                :icon="Bottom"
                title="下移（减小排序值）"
                @click="handleMove(row, 'down')"
            />
            <el-button
                type="primary"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
                :title="getDeleteConfirmText(row)"
                confirm-button-text="确认删除"
                cancel-button-text="取消"
                @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" size="small" :icon="Delete">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ===== 新增/编辑 对话框 ===== -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="520px"
        :close-on-click-modal="false"
        :center="true"
        align-center
        append-to-body
    >
      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
      >
        <el-form-item label="所属分类">
          <el-tag v-if="form.parentId === 0" type="primary">一级分类</el-tag>
          <el-tag v-else type="info">二级分类（父：{{ parentName }}）</el-tag>
        </el-form-item>

        <el-form-item label="分类名称" prop="categoryName">
          <el-input
              v-model="form.categoryName"
              placeholder="请输入分类名称（不超过50字）"
              maxlength="50"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="图标URL">
          <div style="width: 100%">
            <el-input
                v-model="form.icon"
                placeholder="请输入图标图片URL（选填）"
                clearable
            />
            <div v-if="form.icon" style="margin-top: 8px">
              <el-avatar :src="form.icon" :size="40" shape="square" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px">预览</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="排序值" prop="sort">
          <el-input-number
              v-model="form.sort"
              :min="0"
              :max="9999"
              :step="10"
              controls-position="right"
              style="width: 180px"
          />
          <span style="margin-left: 8px; color: #909399; font-size: 12px">数字越大越靠前</span>
        </el-form-item>

        <el-form-item label="是否显示">
          <el-radio-group v-model="form.isShow">
            <el-radio :label="1">显示</el-radio>
            <el-radio :label="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="分类描述">
          <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分类描述（选填，不超过200字）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确认保存
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus, Edit, Delete, FolderOpened, Top, Bottom, Search
} from '@element-plus/icons-vue'
import {
  getCategoryTree,
  addCategory,
  updateCategory,
  deleteCategory,
  sortCategories
} from '@/api/admin/category'

// ============================================================
// 响应式数据
// ============================================================

const categoryTree = ref([])
const loading = ref(false)

// ============================================================
// 搜索筛选
// ============================================================

const searchForm = reactive({
  keyword: '',
  level: null,
  isShow: null
})

/** 前端实时过滤树 */
const filteredTree = computed(() => {
  const { keyword, level, isShow } = searchForm

  if (!keyword && level === null && isShow === null) {
    return categoryTree.value
  }

  const filterNodes = (nodes) => {
    return nodes.reduce((acc, node) => {
      const nameMatch = !keyword || node.categoryName.includes(keyword)
      const levelMatch = level === null || node.level === level
      const showMatch = isShow === null || node.isShow === isShow
      const filteredChildren = node.children ? filterNodes(node.children) : []
      const selfMatch = nameMatch && levelMatch && showMatch

      if (selfMatch || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren })
      }
      return acc
    }, [])
  }

  return filterNodes(categoryTree.value)
})

function handleSearch() {
  // 前端过滤，computed 自动响应
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.level = null
  searchForm.isShow = null
}

// ============================================================
// 对话框
// ============================================================

const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const submitLoading = ref(false)
const editingId = ref(null)
const parentName = ref('')

const form = reactive({
  categoryName: '',
  parentId: 0,
  icon: '',
  sort: 0,
  isShow: 1,
  description: ''
})

const rules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 50, message: '名称不超过50个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

const formRef = ref(null)

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  loadCategoryTree()
})

// ============================================================
// 数据加载
// ============================================================

async function loadCategoryTree() {
  loading.value = true
  try {
    const res = await getCategoryTree()
    categoryTree.value = res.data || []
  } catch (e) {
    ElMessage.error('加载分类数据失败')
  } finally {
    loading.value = false
  }
}

// ============================================================
// 新增
// ============================================================

function handleAdd(parentRow) {
  editingId.value = null
  resetForm()

  if (parentRow === null) {
    form.parentId = 0
    parentName.value = ''
    dialogTitle.value = '新增一级分类'
  } else {
    form.parentId = parentRow.id
    parentName.value = parentRow.categoryName
    dialogTitle.value = `新增二级分类（父：${parentRow.categoryName}）`
  }

  dialogVisible.value = true
}

// ============================================================
// 编辑
// ============================================================

function handleEdit(row) {
  editingId.value = row.id
  dialogTitle.value = '编辑分类'

  form.categoryName = row.categoryName
  form.parentId = row.parentId
  form.icon = row.icon || ''
  form.sort = row.sort || 0
  form.isShow = row.isShow ?? 1
  form.description = row.description || ''

  if (row.parentId !== 0) {
    const parent = findCategoryById(categoryTree.value, row.parentId)
    parentName.value = parent ? parent.categoryName : ''
  } else {
    parentName.value = ''
  }

  dialogVisible.value = true
}

// ============================================================
// 提交保存
// ============================================================

async function handleSubmit() {
  await formRef.value?.validate()

  submitLoading.value = true
  try {
    const payload = {
      categoryName: form.categoryName,
      parentId: form.parentId,
      icon: form.icon || null,
      sort: form.sort,
      isShow: form.isShow,
      description: form.description || null
    }

    if (editingId.value === null) {
      await addCategory(payload)
      ElMessage.success('新增分类成功')
    } else {
      await updateCategory(editingId.value, payload)
      ElMessage.success('编辑分类成功')
    }

    dialogVisible.value = false
    await loadCategoryTree()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// ============================================================
// 删除
// ============================================================

async function handleDelete(row) {
  try {
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    await loadCategoryTree()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

// ============================================================
// 切换显示状态
// ============================================================

async function handleToggleShow(row, val) {
  try {
    await updateCategory(row.id, {
      categoryName: row.categoryName,
      parentId: row.parentId,
      icon: row.icon,
      sort: row.sort,
      isShow: val ? 1 : 0,
      description: row.description
    })
    row.isShow = val ? 1 : 0
    ElMessage.success(val ? '已设置为显示' : '已设置为隐藏')
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// ============================================================
// 排序
// ============================================================

async function handleMove(row, direction) {
  const newSort = direction === 'up'
      ? (row.sort || 0) + 10
      : Math.max(0, (row.sort || 0) - 10)

  try {
    await sortCategories([{ id: row.id, sort: newSort }])
    row.sort = newSort
    await loadCategoryTree()
  } catch (e) {
    ElMessage.error('排序更新失败')
  }
}

// ============================================================
// 工具函数
// ============================================================

function resetForm() {
  form.categoryName = ''
  form.parentId = 0
  form.icon = ''
  form.sort = 0
  form.isShow = 1
  form.description = ''
  editingId.value = null
  parentName.value = ''
  formRef.value?.clearValidate()
}

function getDeleteConfirmText(row) {
  if (row.level === 1) {
    const childCount = row.children ? row.children.length : 0
    if (childCount > 0) {
      return `该一级分类下有 ${childCount} 个子分类，将一并删除。如有关联商品则无法删除，确认继续？`
    }
    return '确认删除该一级分类吗？'
  }
  return '确认删除该二级分类吗？'
}

function findCategoryById(tree, id) {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children && node.children.length) {
      const found = findCategoryById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function formatTime(val) {
  if (!val) return '-'
  if (typeof val === 'string') return val.replace('T', ' ').slice(0, 16)
  if (Array.isArray(val)) {
    const [y, mo, d, h, mi] = val
    return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`
  }
  return val
}
</script>

<style scoped>
.category-manage {
  padding: 16px;
}

/* ======================== 筛选栏 ======================== */
.filter-card {
  margin-bottom: 16px;
}

/* ======================== 表格卡片 ======================== */
.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ======================== 分类名称列 ======================== */
.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  flex-shrink: 0;
}

.no-icon {
  font-size: 22px;
  color: #C0C4CC;
  flex-shrink: 0;
}

.level1-name {
  font-weight: 600;
  color: #303133;
}

.level2-name {
  font-weight: 400;
  color: #606266;
}

/* ======================== 操作按钮间距 ======================== */
:deep(.el-table .el-button + .el-button) {
  margin-left: 4px;
}
</style>