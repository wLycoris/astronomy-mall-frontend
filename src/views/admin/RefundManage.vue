<!-- ============================================ -->
<!-- RefundManage.vue - 退款审核页(占位) -->
<!-- 路径: src/views/admin/RefundManage.vue -->
<!-- ============================================ -->
<template>
  <div class="refund-manage">
    <section class="commerce-hero refund-hero">
      <div class="hero-copy">
        <span class="hero-kicker">AFTERSALE REVIEW</span>
        <h2>退款审核</h2>
        <p>集中审核退款申请、查看订单与支付信息，降低售后处理遗漏。</p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span>退款记录</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="metric-card warning">
          <span>本页待审核</span>
          <strong>{{ pendingRefundCount }}</strong>
        </div>
        <div class="metric-card danger">
          <span>退款失败</span>
          <strong>{{ failedRefundCount }}</strong>
        </div>
      </div>
    </section>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="退款单号">
          <el-input v-model="queryForm.refundNo" placeholder="请输入退款单号" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="订单编号">
          <el-input v-model="queryForm.orderNo" placeholder="请输入订单编号" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="退款状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width:130px">
            <el-option label="待审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="审核拒绝" :value="2" />
            <el-option label="退款成功" :value="3" />
            <el-option label="退款失败" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width:240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-title">退款申请列表</span>
            <small>优先处理待审核和退款失败的记录</small>
          </div>
        </div>
      </template>

      <el-table
          v-loading="loading"
          :data="tableData"
          border
          stripe
          style="width:100%"
      >
        <el-table-column label="退款单号" prop="refundNo" min-width="180" show-overflow-tooltip />
        <el-table-column label="订单编号" prop="orderNo" min-width="180" show-overflow-tooltip />
        <el-table-column label="用户" min-width="120">
          <template #default="{ row }">
            <div>{{ row.nickname || row.username }}</div>
            <div class="text-gray" style="font-size:12px">{{ row.username }}</div>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" prop="refundAmount" min-width="110" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.refundAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退款原因" prop="refundReason" min-width="150" show-overflow-tooltip />
        <el-table-column label="退款类型" prop="refundTypeDesc" min-width="100" align="center" />
        <el-table-column label="状态" prop="status" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.statusDesc }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" prop="createTime" min-width="165" />
        <el-table-column label="操作" fixed="right" min-width="200">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleViewDetail(row)">详情</el-button>
            <template v-if="row.status === 0">
              <el-button size="small" text type="success" @click="handleApprove(row)">通过</el-button>
              <el-button size="small" text type="danger" @click="handleReject(row)">拒绝</el-button>
            </template>
            <el-button
                v-if="row.status === 4"
                size="small" text type="warning"
                @click="handleProcess(row)"
            >重试退款</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="queryForm.pageNum"
            v-model:page-size="queryForm.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
        v-model="detailDrawerVisible"
        title="退款详情"
        size="620px"
        destroy-on-close
    >
      <div v-if="detailData" class="detail-content">
        <!-- 退款状态 -->
        <div class="detail-status-banner" :class="'status-' + detailData.status">
          <el-icon style="font-size:32px"><component :is="getStatusIcon(detailData.status)" /></el-icon>
          <div>
            <div class="status-text">{{ detailData.statusDesc }}</div>
            <div class="status-sub" v-if="detailData.auditTime">审核时间: {{ detailData.auditTime }}</div>
          </div>
        </div>

        <!-- 退款信息 -->
        <el-descriptions title="退款信息" :column="2" border class="detail-section">
          <el-descriptions-item label="退款单号" :span="2">{{ detailData.refundNo }}</el-descriptions-item>
          <el-descriptions-item label="退款金额">
            <span class="amount-text">¥{{ detailData.refundAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退款类型">{{ detailData.refundTypeDesc }}</el-descriptions-item>
          <el-descriptions-item label="退款原因" :span="2">{{ detailData.refundReason }}</el-descriptions-item>
          <el-descriptions-item v-if="detailData.adminRemark" label="审核备注" :span="2">
            {{ detailData.adminRemark }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间" :span="2">{{ detailData.createTime }}</el-descriptions-item>
          <el-descriptions-item v-if="detailData.refundTime" label="退款时间" :span="2">
            {{ detailData.refundTime }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 用户信息 -->
        <el-descriptions title="用户信息" :column="2" border class="detail-section">
          <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailData.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailData.phone || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 订单信息 -->
        <el-descriptions title="订单信息" :column="2" border class="detail-section">
          <el-descriptions-item label="订单编号" :span="2">{{ detailData.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ detailData.orderAmount }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detailData.orderCreateTime }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detailData.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailData.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ detailData.receiverAddress }}</el-descriptions-item>
        </el-descriptions>

        <!-- 支付信息 -->
        <el-descriptions title="支付信息" :column="2" border class="detail-section">
          <el-descriptions-item label="支付流水号" :span="2">{{ detailData.paymentNo }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ detailData.paymentTypeDesc }}</el-descriptions-item>
          <el-descriptions-item label="支付金额">¥{{ detailData.paymentAmount }}</el-descriptions-item>
          <el-descriptions-item label="支付时间" :span="2">{{ detailData.paymentTime }}</el-descriptions-item>
        </el-descriptions>

        <!-- 商品列表 -->
        <div class="detail-section">
          <div class="section-title">订单商品</div>
          <el-table :data="detailData.orderItems" border size="small">
            <el-table-column label="商品" min-width="200">
              <template #default="{ row }">
                <div class="product-cell">
                  <el-image :src="row.productImage" style="width:48px;height:48px;flex-shrink:0" fit="cover" />
                  <span style="margin-left:8px">{{ row.productName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单价" prop="productPrice" align="right" width="100">
              <template #default="{ row }">¥{{ row.productPrice }}</template>
            </el-table-column>
            <el-table-column label="数量" prop="quantity" align="center" width="80" />
            <el-table-column label="小计" prop="totalPrice" align="right" width="100">
              <template #default="{ row }">¥{{ row.totalPrice }}</template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 底部操作按钮 -->
        <div class="detail-actions" v-if="detailData.status === 0">
          <el-button type="success" @click="handleApprove(detailData)">审核通过</el-button>
          <el-button type="danger" @click="handleReject(detailData)">审核拒绝</el-button>
        </div>
        <div class="detail-actions" v-if="detailData.status === 4">
          <el-button type="warning" @click="handleProcess(detailData)">重试退款</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 审核通过弹窗 -->
    <el-dialog v-model="approveDialogVisible" title="审核通过确认" width="420px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="退款金额">
          <span class="amount-text large">
            ¥{{ currentRefund?.refundAmount }}
          </span>
        </el-form-item>
        <el-form-item label="退款原因">{{ currentRefund?.refundReason }}</el-form-item>
        <el-form-item label="审核备注">
          <el-input
              v-model="approveForm.adminRemark"
              type="textarea"
              :rows="3"
              placeholder="可填写审核备注（选填）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
        <el-alert type="info" :closable="false" style="margin-top:8px">
          审核通过后将自动为用户退款至原支付方式
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="submitLoading" @click="submitApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 审核拒绝弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="审核拒绝" width="420px">
      <el-form :model="rejectForm" label-width="80px" ref="rejectFormRef">
        <el-form-item label="退款金额">
          <span>¥{{ currentRefund?.refundAmount }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因" prop="adminRemark" :rules="[{ required: true, message: '请填写拒绝原因' }]">
          <el-input
              v-model="rejectForm.adminRemark"
              type="textarea"
              :rows="3"
              placeholder="请填写拒绝原因（必填）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitLoading" @click="submitReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, CircleCheck, CircleClose, Clock, Finished, Warning } from '@element-plus/icons-vue'
import {
  getRefundList,
  getRefundDetail,
  approveRefund,
  rejectRefund,
  processRefund
} from '@/api/admin/refund'

// ===== 列表数据 =====
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const pendingRefundCount = computed(() => tableData.value.filter(item => item.status === 0).length)
const failedRefundCount = computed(() => tableData.value.filter(item => item.status === 4).length)

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  status: undefined,
  orderNo: '',
  refundNo: '',
  startTime: '',
  endTime: ''
})

// ===== 详情抽屉 =====
const detailDrawerVisible = ref(false)
const detailData = ref(null)

// ===== 审核弹窗 =====
const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const submitLoading = ref(false)
const currentRefund = ref(null)
const rejectFormRef = ref(null)

const approveForm = reactive({ adminRemark: '' })
const rejectForm = reactive({ adminRemark: '' })

// ===== 方法 =====
const fetchRefundList = async () => {
  loading.value = true
  try {
    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      queryForm.startTime = dateRange.value[0]
      queryForm.endTime = dateRange.value[1]
    } else {
      queryForm.startTime = ''
      queryForm.endTime = ''
    }

    const res = await getRefundList(queryForm)
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.pageNum = 1
  fetchRefundList()
}

const handleReset = () => {
  queryForm.status = undefined
  queryForm.orderNo = ''
  queryForm.refundNo = ''
  queryForm.startTime = ''
  queryForm.endTime = ''
  dateRange.value = []
  queryForm.pageNum = 1
  fetchRefundList()
}

const handleSizeChange = (size) => {
  queryForm.pageSize = size
  queryForm.pageNum = 1
  fetchRefundList()
}

const handleCurrentChange = (page) => {
  queryForm.pageNum = page
  fetchRefundList()
}

// 查看详情
const handleViewDetail = async (row) => {
  const res = await getRefundDetail(row.id)
  if (res.code === 200) {
    detailData.value = res.data
    detailDrawerVisible.value = true
  }
}

// 审核通过
const handleApprove = (row) => {
  currentRefund.value = row
  approveForm.adminRemark = ''
  approveDialogVisible.value = true
}

const submitApprove = async () => {
  submitLoading.value = true
  try {
    const res = await approveRefund(currentRefund.value.id, { adminRemark: approveForm.adminRemark })
    if (res.code === 200) {
      ElMessage.success('审核通过，已为用户发起退款')
      approveDialogVisible.value = false
      detailDrawerVisible.value = false
      fetchRefundList()
    }
  } finally {
    submitLoading.value = false
  }
}

// 审核拒绝
const handleReject = (row) => {
  currentRefund.value = row
  rejectForm.adminRemark = ''
  rejectDialogVisible.value = true
}

const submitReject = async () => {
  await rejectFormRef.value?.validate()
  submitLoading.value = true
  try {
    const res = await rejectRefund(currentRefund.value.id, { adminRemark: rejectForm.adminRemark })
    if (res.code === 200) {
      ElMessage.success('已拒绝退款申请')
      rejectDialogVisible.value = false
      detailDrawerVisible.value = false
      fetchRefundList()
    }
  } finally {
    submitLoading.value = false
  }
}

// 处理退款（重试）
const handleProcess = async (row) => {
  await ElMessageBox.confirm(`确定重新处理退款 ¥${row.refundAmount} 吗？`, '处理退款', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  const res = await processRefund(row.id)
  if (res.code === 200) {
    ElMessage.success('退款处理成功')
    fetchRefundList()
  }
}

// ===== 工具方法 =====
const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'danger', 3: 'success', 4: 'danger' }
  return map[status] || 'info'
}

const getStatusIcon = (status) => {
  const map = { 0: 'Clock', 1: 'CircleCheck', 2: 'CircleClose', 3: 'Finished', 4: 'Warning' }
  return map[status] || 'Clock'
}

onMounted(() => {
  fetchRefundList()
})
</script>

<style scoped>
.refund-manage {
  padding: 18px;
  color: #111827;
}

.commerce-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
  margin-bottom: 18px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
      linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.88)),
      radial-gradient(circle at 90% 20%, rgba(220, 38, 38, 0.2), transparent 32%);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.hero-kicker {
  color: #fca5a5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.6px;
}

.hero-copy h2 {
  margin: 8px 0 6px;
  color: #f8fafc;
  font-size: 24px;
  line-height: 1.2;
}

.hero-copy p {
  margin: 0;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
  gap: 10px;
  min-width: 360px;
}

.metric-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.metric-card span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: #f8fafc;
  font-size: 24px;
  line-height: 1;
}

.metric-card.warning strong {
  color: #facc15;
}

.metric-card.danger strong {
  color: #fb7185;
}

.search-card {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: block;
  color: #111827;
  font-size: 16px;
  font-weight: 800;
}

.card-header small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.text-gray {
  color: #64748b;
}

.amount-text {
  color: #b45309;
  font-weight: 800;
}

.amount-text.large {
  font-size: 18px;
}

/* 详情抽屉 */
.detail-content {
  padding: 0 4px;
}

.detail-status-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: white;
}

.status-0 { background: linear-gradient(135deg, #e6a23c, #f0c070); }
.status-1 { background: linear-gradient(135deg, #409eff, #70b8ff); }
.status-2 { background: linear-gradient(135deg, #f56c6c, #f08080); }
.status-3 { background: linear-gradient(135deg, #67c23a, #85d05a); }
.status-4 { background: linear-gradient(135deg, #909399, #b0b3b8); }

.status-text {
  font-size: 18px;
  font-weight: bold;
}

.status-sub {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #111827;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #0f172a;
}

.product-cell {
  display: flex;
  align-items: center;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 8px;
}

:deep(.el-card__header) {
  border-bottom-color: #e5e7eb;
  background: #fafafa;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 14px;
  margin-bottom: 12px;
}

:deep(.el-table) {
  --el-table-border-color: #e5e7eb;
  --el-table-header-bg-color: #f8fafc;
  color: #334155;
}

:deep(.el-table th.el-table__cell) {
  color: #475569;
  font-weight: 800;
}

:deep(.el-table__row:hover > td.el-table__cell) {
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .commerce-hero {
    flex-direction: column;
  }

  .hero-metrics {
    min-width: 0;
  }
}
</style>
