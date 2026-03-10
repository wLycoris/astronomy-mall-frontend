<template>
  <div class="installation-manage">

    <!-- ── 筛选栏 ─────────────────────────── -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width:130px">
            <el-option label="待确认" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已取消" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
              v-model="queryForm.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width:340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ── 数据表格 ─────────────────────────── -->
    <el-card shadow="never" style="margin-top: 16px">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id"          label="预约ID"    width="80" />
        <el-table-column label="用户"        width="120">
          <template #default="{ row }">
            <div>{{ row.nickname || row.username }}</div>
            <div style="font-size:11px; color:#909399">{{ row.username }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo"     label="订单号"     width="180" />
        <el-table-column prop="productName" label="安装商品"   min-width="160" show-overflow-tooltip />
        <el-table-column prop="address"     label="安装地址"   min-width="200" show-overflow-tooltip />
        <el-table-column label="联系人"      width="140">
          <template #default="{ row }">
            <div>{{ row.contactName }}</div>
            <div style="font-size:11px; color:#606266">{{ row.contactPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="期望上门时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.expectedTime) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
                v-if="row.status === 0"
                type="success"
                size="small"
                link
                @click="openConfirmDialog(row)"
            >确认</el-button>
            <el-button
                v-if="row.status === 0 || row.status === 1"
                type="danger"
                size="small"
                link
                @click="openCancelDialog(row)"
            >取消</el-button>
            <el-button type="primary" size="small" link @click="openDetailDialog(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
          class="pagination"
          :current-page="queryForm.pageNum"
          :page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="(s) => { queryForm.pageSize = s; fetchList() }"
          @current-change="(p) => { queryForm.pageNum = p; fetchList() }"
      />
    </el-card>

    <!-- ── 确认预约弹窗 ──────────────────────── -->
    <el-dialog
        v-model="confirmDialogVisible"
        title="确认安装预约"
        width="480px"
        :close-on-click-modal="false"
    >
      <el-form
          ref="confirmFormRef"
          :model="confirmForm"
          :rules="confirmRules"
          label-width="120px"
      >
        <el-form-item label="确认上门时间" prop="confirmedTime">
          <el-date-picker
              v-model="confirmForm.confirmedTime"
              type="datetime"
              placeholder="请选择上门时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
          />
          <div v-if="currentRow?.expectedTime" style="font-size:12px; color:#909399; margin-top:4px">
            用户期望时间：{{ formatTime(currentRow.expectedTime) }}
          </div>
        </el-form-item>
        <el-form-item label="工程师姓名" prop="engineerName">
          <el-input v-model="confirmForm.engineerName" placeholder="请输入工程师姓名" />
        </el-form-item>
        <el-form-item label="工程师电话" prop="engineerPhone">
          <el-input v-model="confirmForm.engineerPhone" placeholder="请输入工程师联系方式" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="operating" @click="handleConfirm">
          确认并通知用户
        </el-button>
      </template>
    </el-dialog>

    <!-- ── 取消预约弹窗 ──────────────────────── -->
    <el-dialog
        v-model="cancelDialogVisible"
        title="取消安装预约"
        width="420px"
        :close-on-click-modal="false"
    >
      <el-form
          ref="cancelFormRef"
          :model="cancelForm"
          :rules="cancelRules"
          label-width="90px"
      >
        <el-form-item label="取消原因" prop="adminRemark">
          <el-input
              v-model="cancelForm.adminRemark"
              type="textarea"
              :rows="3"
              placeholder="请输入取消原因（用户可见）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">关闭</el-button>
        <el-button type="danger" :loading="operating" @click="handleCancelSubmit">
          确认取消
        </el-button>
      </template>
    </el-dialog>

    <!-- ── 详情弹窗 ──────────────────────────── -->
    <el-dialog
        v-model="detailDialogVisible"
        title="预约详情"
        width="560px"
    >
      <el-descriptions v-if="currentRow" :column="2" border>
        <el-descriptions-item label="预约ID">{{ currentRow.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(currentRow.status)">{{ currentRow.statusText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户">
          {{ currentRow.nickname || currentRow.username }}（{{ currentRow.username }}）
        </el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="安装商品" :span="2">{{ currentRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="安装地址" :span="2">{{ currentRow.address }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentRow.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRow.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="期望上门时间" :span="2">
          {{ formatTime(currentRow.expectedTime) || '未填写' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRow.status === 1" label="确认上门时间">
          {{ formatTime(currentRow.confirmedTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRow.status === 1" label="工程师">
          {{ currentRow.engineerName }} {{ currentRow.engineerPhone }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRow.userRemark" label="用户备注" :span="2">
          {{ currentRow.userRemark }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRow.adminRemark" label="管理员备注" :span="2">
          {{ currentRow.adminRemark }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间" :span="2">
          {{ formatTime(currentRow.createTime) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getInstallationList,
  confirmInstallation,
  cancelInstallationAdmin
} from '@/api/admin/installation'

// ── 列表 ───────────────────────────────────
const loading   = ref(false)
const tableData = ref([])
const total     = ref(0)

const queryForm = reactive({
  pageNum:   1,
  pageSize:  10,
  status:    null,
  timeRange: null
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum:   queryForm.pageNum,
      pageSize:  queryForm.pageSize,
      status:    queryForm.status
    }
    if (queryForm.timeRange?.length === 2) {
      params.startTime = queryForm.timeRange[0]
      params.endTime   = queryForm.timeRange[1]
    }
    const res   = await getInstallationList(params)
    tableData.value = res.data?.records || []
    total.value     = res.data?.total   || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { queryForm.pageNum = 1; fetchList() }
const handleReset  = () => {
  queryForm.status    = null
  queryForm.timeRange = null
  queryForm.pageNum   = 1
  fetchList()
}

// ── 确认弹窗 ───────────────────────────────
const confirmDialogVisible = ref(false)
const confirmFormRef       = ref(null)
const operating            = ref(false)
const currentRow           = ref(null)

const confirmForm = reactive({
  confirmedTime: null,
  engineerName:  '',
  engineerPhone: ''
})

const confirmRules = {
  confirmedTime: [{ required: true, message: '请选择上门时间', trigger: 'change' }],
  engineerName:  [{ required: true, message: '请输入工程师姓名', trigger: 'blur' }],
  engineerPhone: [{ required: true, message: '请输入工程师电话', trigger: 'blur' }]
}

const openConfirmDialog = (row) => {
  currentRow.value = row
  // 默认填入用户的期望时间，没有则置空
  confirmForm.confirmedTime = row.expectedTime
      ? String(row.expectedTime).replace('T', ' ').slice(0, 19)
      : null
  confirmForm.engineerName  = ''
  confirmForm.engineerPhone = ''
  confirmDialogVisible.value = true
}

const handleConfirm = async () => {
  const valid = await confirmFormRef.value?.validate().catch(() => false)
  if (!valid) return

  operating.value = true
  try {
    await confirmInstallation(currentRow.value.id, {
      confirmedTime: confirmForm.confirmedTime,
      engineerName:  confirmForm.engineerName,
      engineerPhone: confirmForm.engineerPhone
    })
    ElMessage.success('已确认，通知已发送给用户')
    confirmDialogVisible.value = false
    fetchList()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    operating.value = false
  }
}

// ── 取消弹窗 ───────────────────────────────
const cancelDialogVisible = ref(false)
const cancelFormRef       = ref(null)

const cancelForm = reactive({ adminRemark: '' })
const cancelRules = {
  adminRemark: [{ required: true, message: '请填写取消原因', trigger: 'blur' }]
}

const openCancelDialog = (row) => {
  currentRow.value = row
  cancelForm.adminRemark = ''
  cancelDialogVisible.value = true
}

const handleCancelSubmit = async () => {
  const valid = await cancelFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm('确定要取消该安装预约吗？', '操作确认', { type: 'warning' })
  } catch { return }

  operating.value = true
  try {
    await cancelInstallationAdmin(currentRow.value.id, { adminRemark: cancelForm.adminRemark })
    ElMessage.success('预约已取消')
    cancelDialogVisible.value = false
    fetchList()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    operating.value = false
  }
}

// ── 详情弹窗 ───────────────────────────────
const detailDialogVisible = ref(false)
const openDetailDialog = (row) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

// ── 工具函数 ───────────────────────────────
const statusTagType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] ?? 'info'
}

const formatTime = (t) => {
  if (!t) return ''
  return String(t).replace('T', ' ').slice(0, 16)
}

onMounted(fetchList)
</script>

<style scoped>
.installation-manage { padding: 20px; }
.filter-card { margin-bottom: 0; }
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>