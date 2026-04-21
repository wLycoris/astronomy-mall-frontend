<template>
  <div class="admin-recycling">
    <section class="admin-page-hero tone-green">
      <div class="admin-page-copy">
        <span class="admin-page-kicker">AFTERMARKET FLOW</span>
        <h2>二手回收管理</h2>
        <p>审核用户提交的器材回收申请，完成报价、取件安排和回收款发放的后台闭环。</p>
      </div>
      <div class="admin-page-metrics">
        <div class="admin-metric-card">
          <span>回收单总数</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="admin-metric-card warning">
          <span>当页待审核</span>
          <strong>{{ pendingRecycleCount }}</strong>
        </div>
        <div class="admin-metric-card success">
          <span>当页履约中</span>
          <strong>{{ activeRecycleCount }}</strong>
        </div>
      </div>
    </section>

    <!-- 搜索栏 -->
    <el-card class="search-card admin-panel-card" shadow="never">
      <el-form :model="query" inline>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width:130px">
            <el-option label="待审核" :value="0" />
            <el-option label="已报价" :value="1" />
            <el-option label="用户确认" :value="2" />
            <el-option label="待取件" :value="3" />
            <el-option label="已回收" :value="4" />
            <el-option label="已拒绝" :value="5" />
            <el-option label="用户取消" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="器材名称">
          <el-input v-model="query.productName" placeholder="器材名称" clearable style="width:150px" />
        </el-form-item>
        <el-form-item label="回收单号">
          <el-input v-model="query.recycleNo" placeholder="回收单号" clearable style="width:180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card admin-panel-card" shadow="never">
      <div class="admin-toolbar-header">
        <div>
          <span class="admin-card-title">回收申请</span>
          <span class="admin-card-subtitle">报价、拒绝、安排取件和完成回收都在这里处理</span>
        </div>
      </div>
      <el-table
          v-loading="loading"
          :data="list"
          border
          stripe
          style="width:100%"
      >
        <el-table-column label="回收单号" prop="recycleNo" min-width="180" fixed />
        <el-table-column label="用户" min-width="120">
          <template #default="{ row }">
            <div>{{ row.nickname || row.username }}</div>
            <div class="text-gray">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="器材信息" min-width="160">
          <template #default="{ row }">
            <div class="product-name">{{ row.productName }}</div>
            <div class="text-gray">
              <span v-if="row.brand">{{ row.brand }}</span>
              <span v-if="row.model"> | {{ row.model }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成色" prop="conditionLevel" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getConditionTagType(row.conditionLevel)" size="small">
              {{ row.conditionLevel }} 级
            </el-tag>
          </template>
        </el-table-column>
        <!-- 图片列 -->
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <span v-if="parseImages(row.images).length > 0" class="img-count" @click.stop="openDetail(row)">
              <el-icon><Picture /></el-icon> {{ parseImages(row.images).length }}
            </span>
            <span v-else class="text-gray">—</span>
          </template>
        </el-table-column>
        <el-table-column label="报价(¥)" prop="assessedPrice" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.assessedPrice" class="price-text">
              {{ Number(row.assessedPrice).toFixed(2) }}
            </span>
            <span v-else class="text-gray">未报价</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" prop="createTime" min-width="150" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
            <!-- 待审核：报价 or 拒绝 -->
            <template v-if="row.status === 0">
              <el-button size="small" type="primary" @click="openQuoteDialog(row)">报价</el-button>
              <el-button size="small" type="danger" plain @click="openRejectDialog(row)">拒绝</el-button>
            </template>
            <!-- 用户确认：安排取件 -->
            <el-button
                v-if="row.status === 2"
                size="small"
                type="warning"
                @click="openArrangeDialog(row)"
            >安排取件</el-button>
            <!-- 待取件：完成回收 -->
            <el-button
                v-if="row.status === 3"
                size="small"
                type="success"
                @click="handleComplete(row)"
            >完成回收</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
          class="pagination"
          background
          layout="total, prev, pager, next, sizes"
          :total="total"
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          @current-change="loadList"
          @size-change="loadList"
      />
    </el-card>

    <!-- ==================== 详情弹窗 ==================== -->
    <el-dialog
        v-model="detailVisible"
        title="回收申请详情"
        width="600px"
        align-center
        append-to-body
    >
      <div v-if="currentRow" class="detail-body">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="回收单号" :span="2">{{ currentRow.recycleNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentRow.status)">{{ currentRow.statusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentRow.createTime }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentRow.nickname || currentRow.username }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentRow.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="器材名称" :span="2">{{ currentRow.productName }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ currentRow.brand || '-' }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ currentRow.model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="成色等级">
            <el-tag size="small" :type="getConditionTagType(currentRow.conditionLevel)">
              {{ currentRow.conditionLevel }} 级
            </el-tag>
            {{ currentRow.conditionLevelText }}
          </el-descriptions-item>
          <el-descriptions-item label="报价金额">
            <span v-if="currentRow.assessedPrice" class="price-text">
              ¥{{ Number(currentRow.assessedPrice).toFixed(2) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRow.adminRemark" label="备注/原因" :span="2">
            {{ currentRow.adminRemark }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRow.logisticsCompany" label="快递公司">
            {{ currentRow.logisticsCompany }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRow.trackingNumber" label="快递单号">
            {{ currentRow.trackingNumber }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 器材图片 -->
        <div v-if="parseImages(currentRow.images).length > 0" class="images-block">
          <strong>器材图片（{{ parseImages(currentRow.images).length }} 张）：</strong>
          <div class="images-grid">
            <img
                v-for="(img, idx) in parseImages(currentRow.images)"
                :key="idx"
                :src="img"
                class="detail-img"
                @click="openImagePreview(parseImages(currentRow.images), idx)"
            />
          </div>
        </div>

        <div v-if="currentRow.description" class="desc-block">
          <strong>器材描述：</strong>
          <p>{{ currentRow.description }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 报价弹窗 ==================== -->
    <el-dialog
        v-model="quoteVisible"
        title="提交回收报价"
        width="440px"
        align-center
        append-to-body
        destroy-on-close
    >
      <el-form ref="quoteFormRef" :model="quoteForm" :rules="quoteRules" label-width="90px">
        <el-form-item label="报价金额" prop="assessedPrice">
          <el-input-number
              v-model="quoteForm.assessedPrice"
              :min="0.01"
              :precision="2"
              :step="10"
              style="width:200px"
          />
          <span style="margin-left:8px">元</span>
        </el-form-item>
        <el-form-item label="报价说明">
          <el-input
              v-model="quoteForm.adminRemark"
              type="textarea"
              :rows="3"
              placeholder="报价说明（可选）"
              maxlength="500"
              show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quoteVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleQuoteSubmit">提交报价</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 拒绝弹窗 ==================== -->
    <el-dialog
        v-model="rejectVisible"
        title="拒绝回收申请"
        width="440px"
        align-center
        append-to-body
        destroy-on-close
    >
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="90px">
        <el-form-item label="拒绝原因" prop="adminRemark">
          <el-input
              v-model="rejectForm.adminRemark"
              type="textarea"
              :rows="4"
              placeholder="请填写拒绝原因"
              maxlength="500"
              show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="handleRejectSubmit">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 安排取件弹窗 ==================== -->
    <el-dialog
        v-model="arrangeVisible"
        title="安排上门取件"
        width="440px"
        align-center
        append-to-body
        destroy-on-close
    >
      <el-form ref="arrangeFormRef" :model="arrangeForm" :rules="arrangeRules" label-width="90px">
        <el-form-item label="快递公司" prop="logisticsCompany">
          <el-select v-model="arrangeForm.logisticsCompany" placeholder="请选择快递公司" style="width:100%">
            <el-option v-for="c in courierList" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" prop="trackingNumber">
          <el-input v-model="arrangeForm.trackingNumber" placeholder="请填写快递单号" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="arrangeVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleArrangeSubmit">确认安排</el-button>
      </template>
    </el-dialog>

    <!-- 大图预览 -->
    <el-image-viewer
        v-if="previewVisible"
        :url-list="previewImages"
        :initial-index="previewIndex"
        @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Picture } from '@element-plus/icons-vue'
import {
  getRecyclingList,
  submitQuote,
  rejectRecycling,
  arrangePickup,
  completeRecycling
} from '@/api/admin/recycling'

// ==================== 列表数据 ====================
const loading = ref(false)
const list = ref([])
const total = ref(0)

const pendingRecycleCount = computed(() => list.value.filter(item => item.status === 0).length)
const activeRecycleCount = computed(() => list.value.filter(item => [2, 3].includes(item.status)).length)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  status: undefined,
  productName: '',
  recycleNo: ''
})

// ==================== 操作 Loading ====================
const actionLoading = ref(false)

// ==================== 当前操作行 ====================
const currentRow = ref(null)

// ==================== 弹窗控制 ====================
const detailVisible = ref(false)
const quoteVisible = ref(false)
const rejectVisible = ref(false)
const arrangeVisible = ref(false)

// ==================== 表单数据 ====================
const quoteFormRef = ref(null)
const quoteForm = reactive({ assessedPrice: null, adminRemark: '' })
const quoteRules = {
  assessedPrice: [{ required: true, message: '请输入报价金额', trigger: 'blur' }]
}

const rejectFormRef = ref(null)
const rejectForm = reactive({ adminRemark: '' })
const rejectRules = {
  adminRemark: [{ required: true, message: '请填写拒绝原因', trigger: 'blur' }]
}

const arrangeFormRef = ref(null)
const arrangeForm = reactive({ logisticsCompany: '', trackingNumber: '' })
const arrangeRules = {
  logisticsCompany: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  trackingNumber: [{ required: true, message: '请填写快递单号', trigger: 'blur' }]
}

// 常用快递公司
const courierList = ['顺丰速运', '京东快递', '中通快递', '圆通速递', '申通快递', '韵达快递', '极兔速递', '其他']

// ==================== 图片预览 ====================
const previewVisible = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)

const parseImages = (images) => {
  if (!images) return []
  try { return JSON.parse(images) } catch { return [] }
}

const openImagePreview = (images, index) => {
  previewImages.value = images
  previewIndex.value = index
  previewVisible.value = true
}

// ==================== 加载列表 ====================
const loadList = async () => {
  loading.value = true
  try {
    const params = { ...query }
    if (params.status === undefined || params.status === '') delete params.status
    const res = await getRecyclingList(params)
    list.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  loadList()
}

const handleReset = () => {
  query.status = undefined
  query.productName = ''
  query.recycleNo = ''
  query.pageNum = 1
  loadList()
}

// ==================== 详情 ====================
const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

// ==================== 报价 ====================
const openQuoteDialog = (row) => {
  currentRow.value = row
  quoteForm.assessedPrice = null
  quoteForm.adminRemark = ''
  quoteVisible.value = true
}

const handleQuoteSubmit = async () => {
  await quoteFormRef.value.validate(async (valid) => {
    if (!valid) return
    actionLoading.value = true
    try {
      await submitQuote(currentRow.value.id, { ...quoteForm })
      ElMessage.success('报价已提交，等待用户确认')
      quoteVisible.value = false
      loadList()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || '提交失败')
    } finally {
      actionLoading.value = false
    }
  })
}

// ==================== 拒绝 ====================
const openRejectDialog = (row) => {
  currentRow.value = row
  rejectForm.adminRemark = ''
  rejectVisible.value = true
}

const handleRejectSubmit = async () => {
  await rejectFormRef.value.validate(async (valid) => {
    if (!valid) return
    actionLoading.value = true
    try {
      await rejectRecycling(currentRow.value.id, { adminRemark: rejectForm.adminRemark })
      ElMessage.success('已拒绝申请')
      rejectVisible.value = false
      loadList()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || '操作失败')
    } finally {
      actionLoading.value = false
    }
  })
}

// ==================== 安排取件 ====================
const openArrangeDialog = (row) => {
  currentRow.value = row
  arrangeForm.logisticsCompany = ''
  arrangeForm.trackingNumber = ''
  arrangeVisible.value = true
}

const handleArrangeSubmit = async () => {
  await arrangeFormRef.value.validate(async (valid) => {
    if (!valid) return
    actionLoading.value = true
    try {
      await arrangePickup(currentRow.value.id, { ...arrangeForm })
      ElMessage.success('取件已安排，等待快递上门取件')
      arrangeVisible.value = false
      loadList()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || '操作失败')
    } finally {
      actionLoading.value = false
    }
  })
}

// ==================== 完成回收（发放余额）====================
const handleComplete = async (row) => {
  const amount = row.assessedPrice ? `¥${Number(row.assessedPrice).toFixed(2)}` : '未知金额'
  await ElMessageBox.confirm(
      `确认完成回收？将向用户发放 ${amount} 回收款到其钱包，此操作不可撤销！`,
      '确认完成回收',
      {
        confirmButtonText: '确认发放',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
  )
  try {
    await completeRecycling(row.id)
    ElMessage.success(`回收完成，${amount} 已发放至用户钱包`)
    loadList()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

// ==================== 工具方法 ====================
const getStatusTagType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'primary', 4: 'success', 5: 'danger', 6: 'info' }
  return map[status] ?? 'info'
}

const getConditionTagType = (level) => {
  const map = { S: 'success', A: '', B: 'warning', C: 'danger' }
  return map[level] ?? ''
}

onMounted(loadList)
</script>

<style scoped>
.admin-recycling {
  padding: 0;
}

.page-title {
  margin-bottom: 16px;
}

.page-title h2 {
  margin: 0;
  font-size: 20px;
}

.search-card {
  margin-bottom: 0;
}

.table-card {
  margin-top: 16px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.text-gray {
  font-size: 12px;
  color: #909399;
}

.product-name {
  font-weight: 600;
  color: #303133;
}

.price-text {
  font-weight: bold;
  color: #8a5a1f;
}

:deep(.el-table th.el-table__cell) {
  background: #f8fafc;
  color: #475569;
  font-weight: 800;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.desc-block {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
}

.desc-block p {
  margin: 6px 0 0;
  color: #606266;
  white-space: pre-wrap;
}

/* 新增：图片相关样式 */
.img-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
}

.images-block {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.detail-img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e8eaed;
  cursor: zoom-in;
  transition: transform 0.2s;
}

.detail-img:hover {
  transform: scale(1.05);
}
</style>
