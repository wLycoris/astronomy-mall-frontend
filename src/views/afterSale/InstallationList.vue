<template>
  <div class="installation-list-page">

    <!-- ── 页面标题 ─────────────────────────── -->
    <div class="page-header">
      <h2>安装预约</h2>
      <el-button type="primary" @click="openApplyDialog">
        <el-icon><Plus /></el-icon> 提交安装预约
      </el-button>
    </div>

    <!-- ── 预约列表 ─────────────────────────── -->
    <div v-loading="loading">
      <el-empty v-if="!loading && list.length === 0" description="暂无安装预约记录" />

      <div v-else class="list-container">
        <el-card
            v-for="item in list"
            :key="item.id"
            class="installation-card"
            shadow="hover"
        >
          <div class="card-header">
            <div class="left">
              <span class="order-no">订单号：{{ item.orderNo || '-' }}</span>
              <span class="product-name">{{ item.productName }}</span>
            </div>
            <el-tag :type="statusTagType(item.status)" size="default">
              {{ item.statusText }}
            </el-tag>
          </div>

          <el-divider />

          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="安装地址">{{ item.address }}</el-descriptions-item>
            <el-descriptions-item label="联系人">
              {{ item.contactName }} {{ item.contactPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="期望上门时间">
              {{ formatTime(item.expectedTime) || '未填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ formatTime(item.createTime) }}
            </el-descriptions-item>

            <template v-if="item.status === 1">
              <el-descriptions-item label="确认上门时间">
                <span class="highlight">{{ formatTime(item.confirmedTime) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="工程师">
                {{ item.engineerName }} {{ item.engineerPhone }}
              </el-descriptions-item>
            </template>

            <el-descriptions-item v-if="item.userRemark" label="我的备注" :span="2">
              {{ item.userRemark }}
            </el-descriptions-item>
            <el-descriptions-item
                v-if="item.status === 2 && item.adminRemark"
                label="取消原因"
                :span="2"
            >
              <span class="cancel-reason">{{ item.adminRemark }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <div class="card-actions">
            <el-button
                v-if="item.canCancel"
                type="danger"
                size="small"
                plain
                @click="handleCancel(item)"
            >
              取消预约
            </el-button>
          </div>
        </el-card>
      </div>

      <el-pagination
          v-if="total > 0"
          class="pagination"
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
      />
    </div>

    <!-- ── 提交预约弹窗 ──────────────────────── -->
    <el-dialog
        v-model="applyDialogVisible"
        title="提交安装预约"
        width="600px"
        :close-on-click-modal="false"
        @close="resetApplyForm"
    >
      <el-form
          ref="applyFormRef"
          :model="applyForm"
          :rules="applyRules"
          label-width="100px"
      >

        <!-- ① 选择订单（卡片列表） -->
        <el-form-item label="选择订单" prop="orderId">
          <div v-if="loadingOrders" style="width:100%">
            <el-skeleton :rows="2" animated />
          </div>
          <div v-else-if="eligibleOrders.length === 0" class="form-tip">
            暂无符合条件的订单（需「待收货」或「已完成」状态）
          </div>
          <div v-else class="order-card-list">
            <div
                v-for="order in eligibleOrders"
                :key="order.id"
                class="order-card-item"
                :class="{ selected: applyForm.orderId === order.id }"
                @click="selectOrder(order)"
            >
              <!-- 缩略图 -->
              <div class="oc-thumb">
                <img
                    v-if="order.items?.[0]?.productImage"
                    :src="order.items[0].productImage"
                />
                <span v-else>🔭</span>
              </div>
              <!-- 主信息 -->
              <div class="oc-info">
                <div class="oc-no">{{ order.orderNo }}</div>
                <div class="oc-product">
                  {{ order.items?.[0]?.productName || '商品' }}
                  <span v-if="order.items?.length > 1" class="oc-more">
                    等 {{ order.items.length }} 件
                  </span>
                </div>
                <div class="oc-meta">
                  <span class="oc-amount">¥{{ order.paymentAmount }}</span>
                  <span class="oc-date">{{ formatTime(order.createTime) }}</span>
                </div>
              </div>
              <!-- 状态 + 选中勾 -->
              <div class="oc-right">
                <el-tag
                    :type="order.status === 2 ? 'primary' : 'success'"
                    size="small"
                    effect="plain"
                >
                  {{ orderStatusText(order.status) }}
                </el-tag>
                <el-icon v-if="applyForm.orderId === order.id" class="oc-check">
                  <CircleCheckFilled />
                </el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- ② 选择商品（选中订单后出现，也用卡片） -->
        <el-form-item v-if="currentOrderItems.length" label="安装商品" prop="productId">
          <div class="product-card-list">
            <div
                v-for="item in currentOrderItems"
                :key="item.productId"
                class="product-card-item"
                :class="{ selected: applyForm.productId === item.productId }"
                @click="applyForm.productId = item.productId"
            >
              <img
                  v-if="item.productImage"
                  :src="item.productImage"
                  class="pc-img"
              />
              <span v-else class="pc-img pc-placeholder">🔭</span>
              <span class="pc-name">{{ item.productName }}</span>
              <el-icon v-if="applyForm.productId === item.productId" class="pc-check">
                <CircleCheckFilled />
              </el-icon>
            </div>
          </div>
        </el-form-item>

        <!-- ③ 安装地址（只读，选中订单自动填入） -->
        <el-form-item label="安装地址">
          <el-input
              :value="currentOrderAddress"
              readonly
              placeholder="选择订单后自动填入"
          />
        </el-form-item>

        <!-- ④ 联系人 -->
        <el-form-item label="联系人">
          <el-input
              :value="currentOrderContact"
              readonly
              placeholder="选择订单后自动填入"
          />
        </el-form-item>

        <!-- ⑤ 期望上门时间 -->
        <el-form-item label="期望时间">
          <el-date-picker
              v-model="applyForm.expectedTime"
              type="datetime"
              placeholder="选择期望上门时间（选填）"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled-date="disabledPastDate"
          />
        </el-form-item>

        <!-- ⑥ 备注 -->
        <el-form-item label="备注">
          <el-input
              v-model="applyForm.userRemark"
              type="textarea"
              :rows="2"
              placeholder="如：门禁密码、停车位信息等（选填）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交预约
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CircleCheckFilled } from '@element-plus/icons-vue'
import {
  submitInstallation,
  getMyInstallationList,
  cancelInstallation
} from '@/api/installation'
import { getOrderList, getOrderDetail } from '@/api/order'

// ── 列表数据 ─────────────────────────────────
const loading  = ref(false)
const list     = ref([])
const total    = ref(0)
const pageNum  = ref(1)
const pageSize = ref(10)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getMyInstallationList({ pageNum: pageNum.value, pageSize: pageSize.value })
    list.value  = res.data?.records || []
    total.value = res.data?.total   || 0
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => { pageNum.value = page; fetchList() }

// ── 取消预约 ─────────────────────────────────
const handleCancel = async (item) => {
  try {
    await ElMessageBox.confirm(
        `确定要取消订单「${item.orderNo}」的安装预约吗？`,
        '取消确认',
        { type: 'warning', confirmButtonText: '确定取消', cancelButtonText: '暂不取消' }
    )
    await cancelInstallation(item.id)
    ElMessage.success('预约已取消')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  }
}

// ── 提交预约弹窗 ──────────────────────────────
const applyDialogVisible = ref(false)
const submitting         = ref(false)
const loadingOrders      = ref(false)
const applyFormRef       = ref(null)

const applyForm = reactive({
  orderId:      null,
  productId:    null,
  expectedTime: null,
  userRemark:   ''
})

const applyRules = {
  orderId:   [{ required: true, message: '请选择订单',    trigger: 'change' }],
  productId: [{ required: true, message: '请选择安装商品', trigger: 'change' }]
}

const eligibleOrders      = ref([])
const currentOrderItems   = ref([])
const currentOrderAddress = ref('')
const currentOrderContact = ref('')

const openApplyDialog = async () => {
  applyDialogVisible.value = true
  await loadEligibleOrders()
}

// 加载符合条件的订单（status=2 待收货 + status=3 已完成）
const loadEligibleOrders = async () => {
  loadingOrders.value = true
  try {
    const [res2, res3] = await Promise.all([
      getOrderList({ status: 2, pageNum: 1, pageSize: 50 }),
      getOrderList({ status: 3, pageNum: 1, pageSize: 50 })
    ])
    eligibleOrders.value = [
      ...(res2.data?.records || []),
      ...(res3.data?.records || [])
    ]
  } catch (e) {
    ElMessage.error('加载订单列表失败')
  } finally {
    loadingOrders.value = false
  }
}

/**
 * 点击订单卡片
 * - 已选中同一张 → 取消选中
 * - 订单自带 items → 直接用，不再请求详情
 * - 订单无 items  → 请求 getOrderDetail 补全
 */
const selectOrder = async (order) => {
  if (applyForm.orderId === order.id) {
    applyForm.orderId   = null
    applyForm.productId = null
    currentOrderItems.value   = []
    currentOrderAddress.value = ''
    currentOrderContact.value = ''
    return
  }

  applyForm.orderId   = order.id
  applyForm.productId = null
  currentOrderItems.value   = []
  currentOrderAddress.value = ''
  currentOrderContact.value = ''

  if (order.items?.length) {
    currentOrderItems.value   = order.items
    currentOrderAddress.value = buildAddress(order)
    currentOrderContact.value = `${order.receiverName || ''}  ${order.receiverPhone || ''}`
    if (order.items.length === 1) applyForm.productId = order.items[0].productId
    return
  }

  try {
    const res    = await getOrderDetail(order.id)
    const detail = res.data
    if (!detail) return
    currentOrderItems.value   = detail.items || []
    currentOrderAddress.value = buildAddress(detail)
    currentOrderContact.value = `${detail.receiverName || ''}  ${detail.receiverPhone || ''}`
    if (currentOrderItems.value.length === 1) {
      applyForm.productId = currentOrderItems.value[0].productId
    }
  } catch (e) {
    ElMessage.error('加载订单详情失败')
  }
}

const buildAddress = (o) =>
    [o.receiverProvince, o.receiverCity, o.receiverDistrict, o.receiverAddress]
        .filter(Boolean).join('')

// 提交预约
const handleSubmit = async () => {
  const valid = await applyFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await submitInstallation({
      orderId:      applyForm.orderId,
      productId:    applyForm.productId,
      expectedTime: applyForm.expectedTime || null,
      userRemark:   applyForm.userRemark   || null
    })
    ElMessage.success('预约提交成功，等待管理员确认')
    applyDialogVisible.value = false
    fetchList()
  } catch (e) {
    ElMessage.error(e?.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const resetApplyForm = () => {
  applyForm.orderId      = null
  applyForm.productId    = null
  applyForm.expectedTime = null
  applyForm.userRemark   = ''
  currentOrderItems.value   = []
  currentOrderAddress.value = ''
  currentOrderContact.value = ''
}

// ── 工具函数 ─────────────────────────────────
const statusTagType   = (s) => ({ 0: 'warning', 1: 'success', 2: 'info' })[s] ?? 'info'
const orderStatusText = (s) => ({ 2: '待收货', 3: '已完成' })[s] ?? ''
const formatTime = (t) => { if (!t) return ''; return String(t).replace('T', ' ').slice(0, 16) }
const disabledPastDate = (d) => d < new Date(new Date().setHours(0, 0, 0, 0))

onMounted(fetchList)
</script>

<style scoped>
.installation-list-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { margin: 0; font-size: 20px; }
.list-container { display: flex; flex-direction: column; gap: 16px; }
.installation-card { border-radius: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.order-no { font-size: 12px; color: #909399; margin-right: 12px; }
.product-name { font-weight: 600; font-size: 15px; }
.card-actions { margin-top: 12px; display: flex; justify-content: flex-end; }
.highlight { color: #409eff; font-weight: 600; }
.cancel-reason { color: #f56c6c; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }
.pagination { margin-top: 24px; display: flex; justify-content: center; }

/* ── 订单卡片列表 ─────────────────────────────── */
.order-card-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 2px;
}

.order-card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1.5px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.order-card-item:hover   { border-color: #409eff; background: #f0f7ff; }
.order-card-item.selected { border-color: #409eff; background: #ecf5ff; }

.oc-thumb {
  width: 48px; height: 48px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  font-size: 22px;
}
.oc-thumb img { width: 100%; height: 100%; object-fit: cover; }

.oc-info { flex: 1; min-width: 0; }
.oc-no { font-size: 11px; color: #909399; margin-bottom: 2px; }
.oc-product {
  font-size: 13px; font-weight: 500; color: #303133;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.oc-more { font-size: 11px; color: #909399; }
.oc-meta { display: flex; gap: 10px; margin-top: 3px; }
.oc-amount { font-size: 13px; font-weight: 600; color: #f56c6c; }
.oc-date   { font-size: 11px; color: #c0c4cc; }

.oc-right {
  display: flex; flex-direction: column;
  align-items: center; gap: 6px; flex-shrink: 0;
}
.oc-check { font-size: 18px; color: #409eff; }

/* ── 商品卡片列表 ─────────────────────────────── */
.product-card-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.product-card-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1.5px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.product-card-item:hover   { border-color: #409eff; background: #f0f7ff; }
.product-card-item.selected { border-color: #409eff; background: #ecf5ff; }

.pc-img {
  width: 36px; height: 36px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
}
.pc-placeholder {
  display: flex; align-items: center;
  justify-content: center;
  background: #f5f7fa; font-size: 18px;
}
.pc-name  { flex: 1; font-size: 13px; color: #303133; }
.pc-check { font-size: 16px; color: #409eff; flex-shrink: 0; }
</style>