<!-- ============================================ -->
<!-- UserManage.vue - 用户管理页(占位) -->
<!-- 路径: src/views/admin/UserManage.vue -->
<!-- ============================================ -->
<template>
  <div class="user-manage">

    <!-- ==================== 搜索筛选区 ==================== -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>

        <el-form-item label="关键词">
          <el-input
              v-model="searchForm.keyword"
              placeholder="用户名 / 昵称 / 手机 / 邮箱"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部" clearable style="width: 120px">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员"   :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="观测等级">
          <el-select v-model="searchForm.observationLevel" placeholder="全部" clearable style="width: 120px">
            <el-option label="入门" :value="1" />
            <el-option label="初级" :value="2" />
            <el-option label="中级" :value="3" />
            <el-option label="高级" :value="4" />
            <el-option label="专家" :value="5" />
          </el-select>
        </el-form-item>

        <el-form-item label="注册时间">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>

      </el-form>
    </el-card>

    <!-- ==================== 统计卡片 ==================== -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ pagination.total }}</div>
          <div class="stat-label">用户总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value active">{{ pageStats.active }}</div>
          <div class="stat-label">当页启用</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value danger">{{ pageStats.disabled }}</div>
          <div class="stat-label">当页禁用</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value warning">{{ pageStats.admin }}</div>
          <div class="stat-label">当页管理员</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ==================== 用户列表 ==================== -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">

        <!-- 用户信息列（头像 + 昵称 + 用户名） -->
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.avatar" :size="40" />
              <div class="user-text">
                <div class="username">{{ row.nickname || row.username }}</div>
                <div class="user-sub">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 联系方式列 -->
        <el-table-column label="联系方式" min-width="160">
          <template #default="{ row }">
            <div>{{ row.phone || '-' }}</div>
            <div class="text-gray">{{ row.email || '-' }}</div>
          </template>
        </el-table-column>

        <!-- 角色列 -->
        <el-table-column label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : 'info'" size="small">
              {{ row.roleName }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 状态列 -->
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
              {{ row.statusName }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 观测等级列 -->
        <el-table-column label="观测等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small" plain>{{ row.observationLevelName }}</el-tag>
          </template>
        </el-table-column>

        <!-- 城市列 -->
        <el-table-column label="城市" width="90" align="center">
          <template #default="{ row }">{{ row.city || '-' }}</template>
        </el-table-column>

        <!-- 订单数列 -->
        <el-table-column label="订单数" width="80" align="center">
          <template #default="{ row }">{{ row.orderCount ?? 0 }}</template>
        </el-table-column>

        <!-- 消费金额列 -->
        <el-table-column label="消费金额" width="110" align="center">
          <template #default="{ row }">
            ¥{{ Number(row.totalAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>

        <!-- 注册时间列 -->
        <el-table-column label="注册时间" width="160" align="center">
          <template #default="{ row }">{{ formatTime(row.create_time) }}</template>
        </el-table-column>

        <!-- 最后登录列 -->
        <el-table-column label="最后登录" width="160" align="center">
          <template #default="{ row }">{{ formatTime(row.last_login_time) || '-' }}</template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <!-- 查看详情 -->
            <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>

            <!-- 禁用 / 启用 -->
            <el-button
                :type="row.status === 1 ? 'warning' : 'success'"
                link size="small"
                @click="openStatusDialog(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>

            <!-- 角色切换 -->
            <el-button
                :type="row.role === 1 ? 'info' : 'danger'"
                link size="small"
                @click="handleToggleRole(row)"
            >
              {{ row.role === 1 ? '降为普通' : '设为管理员' }}
            </el-button>
          </template>
        </el-table-column>

      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="fetchList"
            @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- ==================== 用户详情抽屉 ==================== -->
    <el-drawer
        v-model="detailDrawer.visible"
        title="用户详情"
        size="600px"
    >
      <div v-loading="detailDrawer.loading" class="detail-wrap">
        <template v-if="detailData">

          <!-- 基本信息 -->
          <div class="detail-section">
            <div class="detail-section-title">基本信息</div>
            <div class="detail-avatar-row">
              <el-avatar :src="detailData.avatar" :size="64" />
              <div class="detail-name-wrap">
                <div class="detail-name">{{ detailData.nickname || detailData.username }}</div>
                <div class="detail-username">@{{ detailData.username }}</div>
                <div class="detail-tags">
                  <el-tag :type="detailData.role === 1 ? 'danger' : 'info'" size="small">
                    {{ detailData.roleName }}
                  </el-tag>
                  <el-tag
                      :type="detailData.status === 1 ? 'success' : 'warning'"
                      size="small"
                      style="margin-left: 6px"
                  >
                    {{ detailData.statusName }}
                  </el-tag>
                </div>
              </div>
            </div>
            <el-descriptions :column="2" border size="small" style="margin-top: 16px">
              <el-descriptions-item label="手机号">{{ detailData.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="城市">{{ detailData.city || '-' }}</el-descriptions-item>
              <el-descriptions-item label="省份">{{ detailData.province || '-' }}</el-descriptions-item>
              <el-descriptions-item label="观测等级">{{ detailData.observationLevelName }}</el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ detailData.createTime }}</el-descriptions-item>
              <el-descriptions-item label="最后登录">{{ detailData.lastLoginTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="兴趣标签">{{ detailData.interestTags || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 消费统计 -->
          <div class="detail-section">
            <div class="detail-section-title">消费统计</div>
            <el-row :gutter="12">
              <el-col :span="8">
                <div class="stat-mini">
                  <div class="stat-mini-val">{{ detailData.orderCount ?? 0 }}</div>
                  <div class="stat-mini-label">订单总数</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-mini">
                  <div class="stat-mini-val">{{ detailData.completedOrderCount ?? 0 }}</div>
                  <div class="stat-mini-label">已完成</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-mini primary">
                  <div class="stat-mini-val">¥{{ Number(detailData.totalAmount || 0).toFixed(2) }}</div>
                  <div class="stat-mini-label">消费总额</div>
                </div>
              </el-col>
              <el-col :span="8" style="margin-top: 8px">
                <div class="stat-mini">
                  <div class="stat-mini-val">{{ detailData.refundCount ?? 0 }}</div>
                  <div class="stat-mini-label">退款次数</div>
                </div>
              </el-col>
              <el-col :span="8" style="margin-top: 8px">
                <div class="stat-mini">
                  <div class="stat-mini-val">{{ detailData.reviewCount ?? 0 }}</div>
                  <div class="stat-mini-label">评价次数</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 近期订单 -->
          <div class="detail-section">
            <div class="detail-section-title">近期订单（最近5条）</div>
            <el-table :data="detailData.recentOrders" size="small">
              <el-table-column label="订单号" prop="order_no" min-width="150" />
              <el-table-column label="金额" width="90" align="right">
                <template #default="{ row }">¥{{ row.total_amount }}</template>
              </el-table-column>
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" plain>{{ row.statusName }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="下单时间" prop="create_time" min-width="150" />
            </el-table>
          </div>

          <!-- 登录日志 -->
          <div class="detail-section">
            <div class="detail-section-title">近期登录（最近5条）</div>
            <el-table :data="detailData.loginLogs" size="small">
              <el-table-column label="登录时间" prop="login_time" min-width="150" />
              <el-table-column label="IP地址" prop="ip_address" width="130" />
              <el-table-column label="结果" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                    {{ row.status === 1 ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

        </template>
      </div>
    </el-drawer>

    <!-- ==================== 禁用 / 启用确认弹窗 ==================== -->
    <el-dialog
        v-model="statusDialog.visible"
        :title="statusDialog.targetStatus === 0 ? '禁用用户' : '启用用户'"
        width="420px"
    >
      <el-form>
        <el-form-item :label="statusDialog.targetStatus === 0 ? '禁用原因' : '备注'">
          <el-input
              v-model="statusDialog.reason"
              type="textarea"
              :rows="3"
              :placeholder="statusDialog.targetStatus === 0 ? '请输入禁用原因（选填）' : '备注（选填）'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialog.visible = false">取消</el-button>
        <el-button
            :type="statusDialog.targetStatus === 0 ? 'danger' : 'success'"
            :loading="statusDialog.loading"
            @click="confirmStatus"
        >
          确认{{ statusDialog.targetStatus === 0 ? '禁用' : '启用' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, getUserDetail, updateUserStatus, updateUserRole } from '@/api/admin/user'

// ==================== 搜索表单 ====================
const searchForm = reactive({
  keyword: '',
  role: null,
  status: null,
  observationLevel: null
})
const dateRange = ref([])

// ==================== 分页 ====================
const pagination = reactive({ page: 1, size: 10, total: 0 })

// ==================== 列表数据 ====================
const loading = ref(false)
const tableData = ref([])

// ==================== 当页统计（辅助展示用） ====================
const pageStats = reactive({ active: 0, disabled: 0, admin: 0 })

// ==================== 详情抽屉 ====================
const detailDrawer = reactive({ visible: false, loading: false })
const detailData = ref(null)

// ==================== 状态变更弹窗 ====================
const statusDialog = reactive({
  visible: false,
  loading: false,
  userId: null,
  targetStatus: 0, // 目标状态（0-禁用 1-启用）
  reason: ''
})

// ==================== 工具函数 ====================

/**
 * 格式化时间字符串
 * 兼容 "2026-03-02T10:00:00" 和 "2026-03-02 10:00:00" 两种格式
 */
function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').substring(0, 19)
}

/**
 * 更新当页统计数据
 */
function updatePageStats(records) {
  pageStats.active   = records.filter(r => r.status === 1).length
  pageStats.disabled = records.filter(r => r.status === 0).length
  pageStats.admin    = records.filter(r => r.role === 1).length
}

// ==================== 列表请求 ====================

/**
 * 获取用户列表
 */
async function fetchList() {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      size: pagination.size
    }
    // 有选择日期范围才传时间参数
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime   = dateRange.value[1]
    }

    const res = await getUserList(params)
    if (res.code === 200) {
      tableData.value  = res.data.records || []
      pagination.total = res.data.total   || 0
      updatePageStats(tableData.value)
    }
  } finally {
    loading.value = false
  }
}

// ==================== 搜索 / 重置 ====================

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  searchForm.keyword          = ''
  searchForm.role             = null
  searchForm.status           = null
  searchForm.observationLevel = null
  dateRange.value             = []
  pagination.page             = 1
  fetchList()
}

function handleSizeChange(val) {
  pagination.size = val
  pagination.page = 1
  fetchList()
}

// ==================== 用户详情 ====================

/**
 * 打开用户详情抽屉
 */
async function openDetail(row) {
  detailDrawer.visible = true
  detailDrawer.loading = true
  detailData.value     = null
  try {
    const res = await getUserDetail(row.id)
    if (res.code === 200) {
      detailData.value = res.data
    }
  } finally {
    detailDrawer.loading = false
  }
}

// ==================== 修改状态 ====================

/**
 * 打开状态变更弹窗
 */
function openStatusDialog(row) {
  statusDialog.userId        = row.id
  statusDialog.targetStatus  = row.status === 1 ? 0 : 1
  statusDialog.reason        = ''
  statusDialog.visible       = true
}

/**
 * 确认修改状态
 */
async function confirmStatus() {
  statusDialog.loading = true
  try {
    const res = await updateUserStatus(statusDialog.userId, {
      status: statusDialog.targetStatus,
      reason: statusDialog.reason
    })
    if (res.code === 200) {
      ElMessage.success(statusDialog.targetStatus === 1 ? '已启用用户' : '已禁用用户')
      statusDialog.visible = false
      fetchList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } finally {
    statusDialog.loading = false
  }
}

// ==================== 修改角色 ====================

/**
 * 切换用户角色（普通用户 ↔ 管理员），操作前弹窗二次确认
 */
async function handleToggleRole(row) {
  const newRole   = row.role === 1 ? 0 : 1
  const actionTxt = newRole === 1 ? '设置为管理员' : '降级为普通用户'
  const userName  = row.nickname || row.username

  try {
    await ElMessageBox.confirm(
        `确认将用户【${userName}】${actionTxt}？`,
        '角色变更确认',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    // 点击取消，直接返回
    return
  }

  const res = await updateUserRole(row.id, { role: newRole })
  if (res.code === 200) {
    ElMessage.success('角色更新成功')
    fetchList()
  } else {
    ElMessage.error(res.message || '操作失败')
  }
}

// ==================== 初始化 ====================
onMounted(() => fetchList())
</script>

<style scoped>
/* ===== 整体布局 ===== */
.user-manage { padding: 16px; }
.search-card { margin-bottom: 16px; }
.stats-row   { margin-bottom: 16px; }

/* ===== 统计卡片 ===== */
.stat-card   { text-align: center; padding: 8px 0; }
.stat-value  { font-size: 28px; font-weight: bold; color: #303133; }
.stat-value.active  { color: #67c23a; }
.stat-value.danger  { color: #f56c6c; }
.stat-value.warning { color: #e6a23c; }
.stat-label  { font-size: 13px; color: #909399; margin-top: 4px; }

/* ===== 列表用户信息 ===== */
.user-info { display: flex; align-items: center; gap: 10px; }
.user-text .username { font-weight: 500; }
.user-text .user-sub { font-size: 12px; color: #909399; }
.text-gray { font-size: 12px; color: #909399; }

/* ===== 分页 ===== */
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

/* ===== 详情抽屉 ===== */
.detail-wrap    { padding: 0 4px 40px; }
.detail-section { margin-bottom: 24px; }

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-left: 3px solid #409eff;
  padding-left: 8px;
  margin-bottom: 12px;
}

.detail-avatar-row  { display: flex; align-items: center; gap: 16px; }
.detail-name        { font-size: 18px; font-weight: 600; }
.detail-username    { color: #909399; font-size: 13px; margin-top: 2px; }
.detail-tags        { margin-top: 6px; }

/* ===== 小统计格子 ===== */
.stat-mini {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}
.stat-mini.primary .stat-mini-val { color: #409eff; }
.stat-mini-val   { font-size: 20px; font-weight: bold; color: #303133; }
.stat-mini-label { font-size: 12px; color: #909399; margin-top: 4px; }
</style>