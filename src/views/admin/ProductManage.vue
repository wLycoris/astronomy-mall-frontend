<!--
  📌 商品管理 - 完整版
  包含所有字段的新增/编辑表单
-->

<template>
  <div class="product-manage">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input
              v-model="searchForm.productName"
              placeholder="请输入商品名称"
              clearable
              style="width: 200px;"
          />
        </el-form-item>

        <el-form-item label="商品状态">
          <el-select
              v-model="searchForm.status"
              placeholder="全部"
              clearable
              style="width: 150px;"
          >
            <el-option label="全部" :value="null" />
            <el-option label="已上架" :value="1" />
            <el-option label="已下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-input
              v-model="searchForm.brand"
              placeholder="请输入品牌"
              clearable
              @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <div>
            <!-- 🆕 批量操作按钮 -->
            <el-button
                type="success"
                :disabled="selectedIds.length === 0"
                @click="handleBatchOnline"
                style="margin-right: 10px;"
            >
              批量上架 ({{ selectedIds.length }})
            </el-button>
            <el-button
                type="warning"
                :disabled="selectedIds.length === 0"
                @click="handleBatchOffline"
                style="margin-right: 10px;"
            >
              批量下架 ({{ selectedIds.length }})
            </el-button>
            <!-- 🔥 在这里添加导入导出按钮 -->
            <el-upload
                action=""
                :http-request="handleImport"
                :show-file-list="false"
                :before-upload="beforeUpload"
                accept=".xlsx,.xls"
                style="display: inline-block; margin-right: 10px;"
            >
              <el-button type="success">
                <el-icon><Upload /></el-icon> 批量导入
              </el-button>
            </el-upload>

            <el-button type="warning" @click="handleExport" style="margin-right: 10px;">
              <el-icon><Download /></el-icon> 批量导出
            </el-button>

            <el-button type="info" @click="handleDownloadTemplate" style="margin-right: 10px;">
              <el-icon><Document /></el-icon> 下载模板
            </el-button>

            <el-button type="warning" @click="goToStockWarning">
              <el-icon><Warning /></el-icon>
              库存预警
            </el-button>
            <el-button type="primary" @click="handleAdd" style="margin-left: 10px;">
              新增商品
            </el-button>
          </div>
        </div>
      </template>

      <el-table
          :data="tableData"
          border
          v-loading="loading"
          style="width: 100%;"
          @selection-change="handleSelectionChange"
      >
        <!-- 🆕 选择列 -->
        <el-table-column type="selection" width="55" align="center" />
        <!-- 🔥 序号列 - 自动计算 -->
        <el-table-column label="序号" width="70" align="center">
          <template #default="{ $index }">
            {{ (pagination.pageNum - 1) * pagination.pageSize + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="商品图片" width="90" align="center">
          <template #default="{ row }">
            <el-image
                v-if="row.mainImage"
                :src="row.mainImage"
                :preview-src-list="[row.mainImage]"
                fit="cover"
                style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer;"
            />
          </template>
        </el-table-column>

        <el-table-column prop="productName" label="商品名称" min-width="200" show-overflow-tooltip />

        <el-table-column prop="price" label="价格" width="110" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">¥{{ row.price }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="stock" label="库存" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.stock < 10 ? 'danger' : 'success'" size="small">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sales" label="销量" width="90" align="center" />

        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
                link
                :type="row.status === 1 ? 'warning' : 'success'"
                size="small"
                @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleStockAdjust(row)">
              库存
            </el-button>
            <el-button link type="info" size="small" @click="handleViewStockLog(row)">
              日志
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 - 完整版 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="900px"
        @close="resetForm"
        :close-on-click-modal="false"
    >
      <el-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-width="120px"
      >
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="商品名称" prop="productName">
              <el-input
                  v-model="form.productName"
                  placeholder="请输入商品名称"
                  maxlength="200"
                  show-word-limit
              />
            </el-form-item>

            <el-form-item label="副标题">
              <el-input
                  v-model="form.subTitle"
                  placeholder="请输入副标题"
                  maxlength="300"
                  show-word-limit
              />
            </el-form-item>

            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%;">
                <el-option
                    v-for="cat in categories"
                    :key="cat.id"
                    :label="cat.categoryName"
                    :value="cat.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="品牌">
              <el-input
                  v-model="form.brand"
                  placeholder="请输入品牌"
                  maxlength="100"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="商品价格" prop="price" label-width="120px">
                  <el-input-number
                      v-model="form.price"
                      :min="0.01"
                      :precision="2"
                      :step="1"
                      style="width: 100%;"
                      placeholder="请输入价格"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="原价" label-width="80px">
                  <el-input-number
                      v-model="form.originalPrice"
                      :min="0.01"
                      :precision="2"
                      :step="1"
                      style="width: 100%;"
                      placeholder="请输入原价"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="库存" prop="stock">
              <el-input-number
                  v-model="form.stock"
                  :min="0"
                  style="width: 200px;"
              />
            </el-form-item>

            <el-form-item label="商品标签">
              <el-checkbox v-model="form.isRecommend" :true-label="1" :false-label="0">
                推荐
              </el-checkbox>
              <el-checkbox v-model="form.isHot" :true-label="1" :false-label="0">
                热卖
              </el-checkbox>
              <el-checkbox v-model="form.isNew" :true-label="1" :false-label="0">
                新品
              </el-checkbox>
            </el-form-item>

            <el-form-item label="搜索关键词">
              <el-input
                  v-model="form.keywords"
                  placeholder="多个关键词用逗号分隔"
                  maxlength="500"
              />
            </el-form-item>
          </el-tab-pane>

          <!-- 图片信息 -->
          <el-tab-pane label="图片信息" name="image">
            <el-form-item label="主图URL" prop="mainImage">
              <el-input
                  v-model="form.mainImage"
                  placeholder="请输入主图URL"
              />
              <div v-if="form.mainImage" style="margin-top: 10px;">
                <el-image
                    :src="form.mainImage"
                    style="width: 200px; height: 200px;"
                    fit="cover"
                />
              </div>
            </el-form-item>

            <el-form-item label="详情图片">
              <el-input
                  v-model="form.images"
                  type="textarea"
                  :rows="3"
                  placeholder="多个图片URL用逗号分隔"
              />
              <div v-if="form.images" style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                <el-image
                    v-for="(img, index) in imageList"
                    :key="index"
                    :src="img"
                    style="width: 100px; height: 100px;"
                    fit="cover"
                />
              </div>
            </el-form-item>
          </el-tab-pane>

          <!-- 详细信息 -->
          <el-tab-pane label="详细信息" name="detail">
            <el-form-item label="商品详情">
              <el-input
                  v-model="form.detail"
                  type="textarea"
                  :rows="10"
                  placeholder="请输入商品详情(支持HTML)"
              />
            </el-form-item>

            <el-form-item label="规格参数">
              <el-input
                  v-model="form.specifications"
                  type="textarea"
                  :rows="6"
                  placeholder='请输入规格参数(JSON格式)，例如: {"口径":"70mm","焦距":"900mm","倍率":"26x-165x"}'
              />
            </el-form-item>

            <el-form-item label="商品标签">
              <el-input
                  v-model="form.tags"
                  type="textarea"
                  :rows="3"
                  placeholder='请输入商品标签(JSON数组)，例如: ["天文望远镜","入门级","便携式"]'
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 库存调整对话框 -->
    <el-dialog
        v-model="stockDialogVisible"
        title="库存调整"
        width="500px"
        @close="resetStockForm"
    >
      <el-descriptions :column="2" border style="margin-bottom: 20px;">
        <el-descriptions-item label="商品名称">{{ currentProduct.productName }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">
          <el-tag :type="currentProduct.stock < 10 ? 'danger' : 'success'">
            {{ currentProduct.stock }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-form
          ref="stockFormRef"
          :model="stockForm"
          :rules="stockFormRules"
          label-width="100px"
      >
        <el-form-item label="调整类型" prop="adjustType">
          <el-radio-group v-model="stockForm.adjustType">
            <el-radio :label="1">增加库存</el-radio>
            <el-radio :label="2">减少库存</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="调整数量" prop="quantity">
          <el-input-number
              v-model="stockForm.quantity"
              :min="1"
              style="width: 200px;"
          />
        </el-form-item>

        <el-form-item label="调整原因" prop="reason">
          <el-input
              v-model="stockForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStockSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 🆕 库存日志对话框 -->
    <el-dialog
        v-model="stockLogDialogVisible"
        title="库存调整日志"
        width="900px"
    >
      <div style="margin-bottom: 15px;">
        <el-tag type="info">商品: {{ currentProduct.productName }}</el-tag>
        <el-tag type="success" style="margin-left: 10px;">当前库存: {{ currentProduct.stock }}件</el-tag>
      </div>

      <el-table :data="stockLogList" v-loading="stockLogLoading" border>
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="调整类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.adjustType === 1 ? 'success' : 'warning'" size="small">
              {{ row.adjustType === 1 ? '增加' : '减少' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="调整数量" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.adjustType === 1 ? '#67c23a' : '#e6a23c' }">
              {{ row.adjustType === 1 ? '+' : '-' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="库存变化" width="150" align="center">
          <template #default="{ row }">
            <span>{{ row.beforeStock }} → {{ row.afterStock }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="调整原因" min-width="200" show-overflow-tooltip />

        <el-table-column label="操作人" width="120" align="center">
          <template #default="{ row }">
            {{ row.operatorName }}
          </template>
        </el-table-column>

        <el-table-column label="操作时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
            v-model:current-page="stockLogPage"
            v-model:page-size="stockLogPageSize"
            :total="stockLogTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadStockLog"
            @size-change="handleStockLogSizeChange"
        />
      </div>

      <template #footer>
        <el-button @click="stockLogDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'  // 🔥 添加 ElLoading
import { Upload, Download, Document } from '@element-plus/icons-vue'  // 🔥 新增
import { useRouter } from 'vue-router'
import {
  getProductList,
  getProductDetail,
  addProduct,
  updateProduct,
  updateProductStatus,
  adjustStock,
  deleteProduct,
  importProducts,
  exportProducts,
  downloadTemplate
} from '@/api/admin/product'
import { getCategoryTree } from '@/api/category'
import request from '@/utils/request'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const activeTab = ref('basic')

// 搜索表单
const searchForm = reactive({
  productName: '',
  status: null,
  brand: ''
})

// 分页
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 表格数据
const tableData = ref([])

// 分类列表
const categories = ref([])

// 🆕 批量操作 - 选中的商品ID列表
const selectedIds = ref([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = computed(() => form.id ? '编辑商品' : '新增商品')

// 表单
const formRef = ref()
const form = reactive({
  id: null,
  categoryId: null,
  productName: '',
  subTitle: '',
  brand: '',
  price: null,
  originalPrice: null,
  stock: 0,
  mainImage: '',
  images: '',
  detail: '',
  specifications: '',
  tags: '',
  keywords: '',
  isRecommend: 0,
  isHot: 0,
  isNew: 0
})

const formRules = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  mainImage: [{ required: true, message: '请输入主图URL', trigger: 'blur' }]
}

// 图片列表
const imageList = computed(() => {
  if (!form.images) return []
  return form.images.split(',').map(img => img.trim()).filter(Boolean)
})

// 库存调整
const stockDialogVisible = ref(false)
const currentProduct = ref({})
const stockFormRef = ref()
const stockForm = reactive({
  adjustType: 1,
  quantity: 1,
  reason: ''
})

const stockFormRules = {
  adjustType: [{ required: true, message: '请选择调整类型' }],
  quantity: [{ required: true, message: '请输入调整数量' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

// 🆕 库存日志
const stockLogDialogVisible = ref(false)
const stockLogLoading = ref(false)
const stockLogList = ref([])
const stockLogPage = ref(1)
const stockLogPageSize = ref(10)
const stockLogTotal = ref(0)

// 🆕 跳转到库存预警页面
const goToStockWarning = () => {
  router.push('/admin/stock-warning')
}

// 🆕 批量操作 - 选择改变
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
  console.log('选中的商品ID:', selectedIds.value)
}

// 🆕 批量上架
const handleBatchOnline = async () => {
  try {
    await ElMessageBox.confirm(
        `确定要上架选中的 ${selectedIds.value.length} 件商品吗?`,
        '批量上架',
        {
          type: 'success',
          confirmButtonText: '确定上架',
          cancelButtonText: '取消'
        }
    )

    await updateProductStatus({
      productIds: selectedIds.value,
      status: 1
    })

    ElMessage.success('批量上架成功')
    selectedIds.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量上架失败:', error)
      ElMessage.error('批量上架失败')
    }
  }
}

// 🆕 批量下架
const handleBatchOffline = async () => {
  try {
    await ElMessageBox.confirm(
        `确定要下架选中的 ${selectedIds.value.length} 件商品吗?`,
        '批量下架',
        {
          type: 'warning',
          confirmButtonText: '确定下架',
          cancelButtonText: '取消'
        }
    )

    await updateProductStatus({
      productIds: selectedIds.value,
      status: 0
    })

    ElMessage.success('批量下架成功')
    selectedIds.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量下架失败:', error)
      ElMessage.error('批量下架失败')
    }
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const res = await getCategoryTree()
    // 展平分类树,包含一级和二级分类
    const flatList = []
    res.data.forEach(first => {
      flatList.push({ id: first.id, categoryName: first.categoryName })
      if (first.children) {
        first.children.forEach(second => {
          flatList.push({
            id: second.id,
            categoryName: `${first.categoryName} / ${second.categoryName}`
          })
        })
      }
    })
    categories.value = flatList
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载商品列表
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      productName: searchForm.productName || undefined,
      status: searchForm.status,
      brand: searchForm.brand || undefined,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }

    const res = await getProductList(params)
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error(error.message || '加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.pageNum = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.productName = ''
  searchForm.status = null
  searchForm.brand = ''
  pagination.pageNum = 1
  loadData()
}

// 页码改变
const handlePageChange = (page) => {
  pagination.pageNum = page
  loadData()
}

// 每页数量改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  loadData()
}

// 新增
const handleAdd = () => {
  activeTab.value = 'basic'
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row) => {
  try {
    const res = await getProductDetail(row.id)
    const data = res.data

    form.id = data.id
    form.categoryId = data.categoryId
    form.productName = data.productName
    form.subTitle = data.subTitle || ''
    form.brand = data.brand || ''
    form.price = data.price
    form.originalPrice = data.originalPrice
    form.stock = data.stock
    form.mainImage = data.mainImage
    form.images = data.images || ''
    form.detail = data.detail || ''
    form.specifications = data.specifications || ''
    form.tags = data.tags || ''
    form.keywords = data.keywords || ''
    form.isRecommend = data.isRecommend || 0
    form.isHot = data.isHot || 0
    form.isNew = data.isNew || 0

    activeTab.value = 'basic'
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载商品详情失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (form.id) {
      await updateProduct(form.id, form)
      ElMessage.success('编辑成功')
    } else {
      await addProduct(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.categoryId = null
  form.productName = ''
  form.subTitle = ''
  form.brand = ''
  form.price = null
  form.originalPrice = null
  form.stock = 0
  form.mainImage = ''
  form.images = ''
  form.detail = ''
  form.specifications = ''
  form.tags = ''
  form.keywords = ''
  form.isRecommend = 0
  form.isHot = 0
  form.isNew = 0
  formRef.value?.resetFields()
}

// 上下架
const handleToggleStatus = async (row) => {
  const action = row.status === 1 ? '下架' : '上架'
  try {
    await ElMessageBox.confirm(`确定要${action}该商品吗?`, '提示', {
      type: 'warning'
    })

    await updateProductStatus({
      productIds: [row.id],
      status: row.status === 1 ? 0 : 1
    })

    ElMessage.success(`${action}成功`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗? 删除后不可恢复!', '警告', {
      type: 'error',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })

    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 库存调整
const handleStockAdjust = (row) => {
  currentProduct.value = row
  stockDialogVisible.value = true
}

// 提交库存调整
const handleStockSubmit = async () => {
  const valid = await stockFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await adjustStock(currentProduct.value.id, stockForm)
    ElMessage.success('库存调整成功')
    stockDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('库存调整失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置库存表单
const resetStockForm = () => {
  stockForm.adjustType = 1
  stockForm.quantity = 1
  stockForm.reason = ''
  stockFormRef.value?.resetFields()
}

// 🆕 查看库存日志
const handleViewStockLog = (row) => {
  currentProduct.value = row
  stockLogDialogVisible.value = true
  stockLogPage.value = 1
  loadStockLog()
}

// 🆕 加载库存日志
const loadStockLog = async () => {
  stockLogLoading.value = true
  try {
    const res = await request.get(`/admin/stock-log/product/${currentProduct.value.id}`, {
      params: {
        pageNum: stockLogPage.value,
        pageSize: stockLogPageSize.value
      }
    })
    stockLogList.value = res.data.records
    stockLogTotal.value = res.data.total
  } catch (error) {
    console.error('加载库存日志失败:', error)
    ElMessage.error('加载库存日志失败')
  } finally {
    stockLogLoading.value = false
  }
}

// 🆕 库存日志分页改变
const handleStockLogSizeChange = (size) => {
  stockLogPageSize.value = size
  stockLogPage.value = 1
  loadStockLog()
}

// 🆕 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
// 文件上传前校验
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件(.xlsx或.xls)')
    return false
  }

  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }

  return true
}

// 批量导入
const handleImport = async ({ file }) => {
  const formData = new FormData()
  formData.append('file', file)

  const loadingInstance = ElLoading.service({
    text: '正在导入，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const res = await importProducts(formData)
    loadingInstance.close()

    const { total, successCount, failCount, errorList } = res.data

    if (failCount === 0) {
      ElMessage.success(`导入成功！共${total}条，成功${successCount}条`)
    } else {
      // 显示详细错误信息
      const errorMsg = errorList.slice(0, 10).join('\n')  // 只显示前10条错误
      const moreMsg = errorList.length > 10 ? `\n\n...还有${errorList.length - 10}条错误` : ''

      ElMessageBox.alert(
          `导入完成！\n总数：${total}\n成功：${successCount}\n失败：${failCount}\n\n错误详情：\n${errorMsg}${moreMsg}`,
          '导入结果',
          {
            confirmButtonText: '确定',
            type: failCount === total ? 'error' : 'warning'
          }
      )
    }

    // 刷新列表
    loadData()
  } catch (error) {
    loadingInstance.close()
    ElMessage.error('导入失败：' + (error.message || '未知错误'))
  }
}

// 批量导出
const handleExport = async () => {
  try {
    ElMessage.info('正在导出，请稍候...')

    await exportProducts({
      productName: searchForm.productName,
      status: searchForm.status,
      brand: searchForm.brand
    })

    ElMessage.success('导出成功！')
  } catch (error) {
    ElMessage.error('导出失败：' + (error.message || '未知错误'))
  }
}

// 下载模板
const handleDownloadTemplate = () => {
  try {
    downloadTemplate()
    ElMessage.success('模板下载成功！')
  } catch (error) {
    ElMessage.error('下载失败：' + (error.message || '未知错误'))
  }
}
// 初始化
onMounted(() => {
  loadCategories()
  loadData()
})
</script>

<style scoped lang="scss">
.product-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>