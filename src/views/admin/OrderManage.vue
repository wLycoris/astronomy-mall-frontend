<template>
  <div class="order-manage">
    <section class="commerce-hero order-hero">
      <div class="hero-copy">
        <span class="hero-kicker">ORDER CONTROL</span>
        <h2>订单管理</h2>
        <p>跟踪支付、发货、物流与取消流程，优先处理待发货和运输中的订单。</p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span>订单总量</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="metric-card warning">
          <span>本页待发货</span>
          <strong>{{ pendingShipCount }}</strong>
        </div>
        <div class="metric-card">
          <span>本页实收</span>
          <strong>¥{{ pageAmountTotal }}</strong>
        </div>
      </div>
    </section>

    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="订单编号">
          <el-input
              v-model="queryForm.orderNo"
              placeholder="请输入订单编号"
              clearable
              style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="收货人">
          <el-input
              v-model="queryForm.receiverName"
              placeholder="请输入收货人姓名"
              clearable
              style="width: 150px"
          />
        </el-form-item>

        <el-form-item label="联系电话">
          <el-input
              v-model="queryForm.receiverPhone"
              placeholder="请输入联系电话"
              clearable
              style="width: 150px"
          />
        </el-form-item>

        <el-form-item label="订单状态">
          <el-select
              v-model="queryForm.status"
              placeholder="请选择订单状态"
              clearable
              style="width: 120px"
          >
            <el-option label="待支付" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="待收货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>

        <el-form-item label="物流状态">
          <el-select
              v-model="queryForm.logisticsStatus"
              placeholder="请选择物流状态"
              clearable
              style="width: 120px"
          >
            <el-option label="未发货" :value="0" />
            <el-option label="运输中" :value="1" />
            <el-option label="派送中" :value="2" />
            <el-option label="已签收" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 360px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-title">订单列表</span>
            <small>当前筛选 {{ orderList.length }} 条，注意待发货和取消订单</small>
          </div>
        </div>
      </template>

      <el-table
          v-loading="loading"
          :data="orderList"
          border
          stripe
          style="width: 100%"
      >
        <el-table-column prop="orderNo" label="订单编号" min-width="150" fixed />
        <el-table-column prop="username" label="用户名" min-width="100" />
        <el-table-column prop="receiverName" label="收货人" min-width="90" />
        <el-table-column prop="receiverPhone" label="联系电话" width="120" />
        <el-table-column prop="paymentAmount" label="实付金额" width="100" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.paymentAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="statusName" label="订单状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="logisticsStatusName" label="物流状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getLogisticsType(row.logisticsStatus)">
              {{ row.logisticsStatusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="trackingNumber" label="物流单号" min-width="140">
          <template #default="{ row }">
            {{ row.trackingNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="155" />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
                type="primary"
                size="small"
                link
                @click="handleViewDetail(row.id)"
            >
              详情
            </el-button>
            <el-button
                v-if="row.status === 1"
                type="success"
                size="small"
                link
                @click="handleShip(row)"
            >
              发货
            </el-button>
            <!-- 🆕 派送按钮 - 待收货且运输中时显示 -->
            <el-button
                v-if="row.status === 2 && row.logisticsStatus === 1"
                type="success"
                size="small"
                link
                @click="handleDeliver(row)"
            >
              派送
            </el-button>
            <el-button
                v-if="row.status === 0 || row.status === 1"
                type="danger"
                size="small"
                link
                @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button
                type="warning"
                size="small"
                link
                @click="handleRemark(row)"
            >
              备注
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="queryForm.current"
            v-model:page-size="queryForm.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="getOrderList"
            @current-change="getOrderList"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
        v-model="detailVisible"
        title="订单详情"
        width="900px"
    >
      <div v-if="orderDetail" class="detail-container">
        <!-- 订单信息 -->
        <el-descriptions title="订单信息" :column="3" border>
          <el-descriptions-item label="订单编号">{{ orderDetail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ orderDetail.username }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(orderDetail.status)">
              {{ orderDetail.statusName }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品总额">¥{{ orderDetail.totalAmount }}</el-descriptions-item>
          <el-descriptions-item label="运费">¥{{ orderDetail.freight }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">¥{{ orderDetail.discountAmount }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span style="color: #f56c6c; font-weight: bold; font-size: 16px">
              ¥{{ orderDetail.paymentAmount }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ orderDetail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ orderDetail.paymentTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 收货信息 -->
        <el-descriptions title="收货信息" :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="收货人">{{ orderDetail.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ orderDetail.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ orderDetail.fullAddress }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 物流信息 -->
        <el-descriptions title="物流信息" :column="3" border style="margin-top: 20px">
          <el-descriptions-item label="物流公司">
            {{ orderDetail.logisticsCompany || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="物流单号">
            {{ orderDetail.trackingNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="物流状态">
            <el-tag :type="getLogisticsType(orderDetail.logisticsStatus)">
              {{ orderDetail.logisticsStatusName }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发货时间" :span="3">
            {{ orderDetail.deliveryTime || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 🆕 通知记录 -->
        <el-descriptions title="通知记录" :column="1" border style="margin-top: 20px">
          <el-descriptions-item label="发货通知">
            <span v-if="orderDetail.deliveryTime" style="color: #67c23a">
              ✅ {{ orderDetail.deliveryTime }} 已通知用户发货
            </span>
            <span v-else style="color: #909399">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="取消通知">
            <span v-if="orderDetail.status === 4" style="color: #f56c6c">
              ✅ {{ orderDetail.cancelTime }} 已通知用户订单取消并退款
            </span>
            <span v-else style="color: #909399">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="完成通知">
            <span v-if="orderDetail.status === 3" style="color: #67c23a">
              ✅ {{ orderDetail.finishTime }} 用户已确认收货
            </span>
            <span v-else style="color: #909399">-</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品明细 -->
        <div style="margin-top: 20px">
          <div style="font-weight: bold; margin-bottom: 10px">商品明细</div>
          <el-table :data="orderDetail.items" border>
            <el-table-column prop="productName" label="商品名称" min-width="200" />
            <el-table-column prop="productBrand" label="品牌" width="100" />
            <el-table-column prop="productPrice" label="单价" width="100" align="right">
              <template #default="{ row }">¥{{ row.productPrice }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column prop="totalPrice" label="小计" width="100" align="right">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold">¥{{ row.totalPrice }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 备注信息 -->
        <el-descriptions title="备注信息" :column="1" border style="margin-top: 20px">
          <el-descriptions-item label="用户备注">
            {{ orderDetail.remark || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="管理员备注">
            <div style="white-space: pre-line">{{ orderDetail.adminRemark || '-' }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 发货对话框 -->
    <el-dialog
        v-model="shipVisible"
        title="订单发货"
        width="500px"
    >
      <el-form :model="shipForm" :rules="shipRules" ref="shipFormRef" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ currentOrder.orderNo }}</span>
        </el-form-item>
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-select v-model="shipForm.logisticsCompany" placeholder="请选择物流公司" style="width: 100%">
            <el-option label="顺丰速运" value="顺丰速运" />
            <el-option label="圆通速递" value="圆通速递" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="韵达快递" value="韵达快递" />
            <el-option label="申通快递" value="申通快递" />
            <el-option label="邮政EMS" value="邮政EMS" />
            <el-option label="京东物流" value="京东物流" />
            <el-option label="德邦物流" value="德邦物流" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNumber">
          <el-input
              v-model="shipForm.trackingNumber"
              placeholder="请输入物流单号"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
              v-model="shipForm.remark"
              type="textarea"
              :rows="3"
              placeholder="发货备注(可选)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmShip">确认发货</el-button>
      </template>
    </el-dialog>

    <!-- 取消订单对话框 -->
    <el-dialog
        v-model="cancelVisible"
        title="取消订单"
        width="500px"
    >
      <el-form :model="cancelForm" :rules="cancelRules" ref="cancelFormRef" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ currentOrder.orderNo }}</span>
        </el-form-item>
        <el-form-item label="取消原因" prop="cancelReason">
          <el-input
              v-model="cancelForm.cancelReason"
              type="textarea"
              :rows="4"
              placeholder="请输入取消原因"
          />
        </el-form-item>
        <el-alert
            type="warning"
            :closable="false"
            show-icon
            style="margin-top: 10px"
        >
          <template #title>
            <div>取消订单后将:</div>
            <div>• 自动回滚库存</div>
            <div>• 自动退款(如已支付)</div>
            <div>• 通知用户取消原因</div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="cancelVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmCancel">确认取消</el-button>
      </template>
    </el-dialog>

    <!-- 添加备注对话框 -->
    <el-dialog
        v-model="remarkVisible"
        title="添加备注"
        width="500px"
    >
      <el-form :model="remarkForm" :rules="remarkRules" ref="remarkFormRef" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ currentOrder.orderNo }}</span>
        </el-form-item>
        <el-form-item label="备注内容" prop="remark">
          <el-input
              v-model="remarkForm.remark"
              type="textarea"
              :rows="4"
              placeholder="请输入备注内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRemark">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import {
  getOrderList as getOrderListApi,
  getOrderDetail as getOrderDetailApi,
  shipOrder,
  deliverOrder,
  cancelOrder,
  addRemark,
  exportOrders
} from '@/api/admin/order'

// 数据
const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const dateRange = ref([])
const pendingShipCount = computed(() => orderList.value.filter(item => item.status === 1).length)
const pageAmountTotal = computed(() => {
  const totalAmount = orderList.value.reduce((sum, item) => sum + Number(item.paymentAmount || 0), 0)
  return totalAmount.toFixed(2)
})

// 查询表单
const queryForm = reactive({
  orderNo: '',
  receiverName: '',
  receiverPhone: '',
  status: null,
  logisticsStatus: null,
  startTime: '',
  endTime: '',
  current: 1,
  size: 10
})

// 订单详情
const detailVisible = ref(false)
const orderDetail = ref(null)

// 发货
const shipVisible = ref(false)
const shipFormRef = ref(null)
const shipForm = reactive({
  orderId: null,
  logisticsCompany: '',
  trackingNumber: '',
  remark: ''
})
const shipRules = {
  logisticsCompany: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
  trackingNumber: [{ required: true, message: '请输入物流单号', trigger: 'blur' }]
}

// 取消订单
const cancelVisible = ref(false)
const cancelFormRef = ref(null)
const cancelForm = reactive({
  orderId: null,
  cancelReason: ''
})
const cancelRules = {
  cancelReason: [{ required: true, message: '请输入取消原因', trigger: 'blur' }]
}

// 添加备注
const remarkVisible = ref(false)
const remarkFormRef = ref(null)
const remarkForm = reactive({
  orderId: null,
  remark: ''
})
const remarkRules = {
  remark: [{ required: true, message: '请输入备注内容', trigger: 'blur' }]
}

// 当前操作的订单
const currentOrder = ref({})

// 获取订单列表
const getOrderList = async () => {
  loading.value = true
  try {
    // 处理时间范围
    if (dateRange.value && dateRange.value.length === 2) {
      queryForm.startTime = dateRange.value[0]
      queryForm.endTime = dateRange.value[1]
    } else {
      queryForm.startTime = ''
      queryForm.endTime = ''
    }

    const res = await getOrderListApi(queryForm)
    orderList.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('获取订单列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryForm.current = 1
  getOrderList()
}

// 重置
const handleReset = () => {
  Object.assign(queryForm, {
    orderNo: '',
    receiverName: '',
    receiverPhone: '',
    status: null,
    logisticsStatus: null,
    startTime: '',
    endTime: '',
    current: 1,
    size: 10
  })
  dateRange.value = []
  getOrderList()
}

// 导出
const handleExport = async () => {
  try {
    ElMessageBox.confirm('确认导出当前筛选条件下的订单数据?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      const params = { ...queryForm }
      if (dateRange.value && dateRange.value.length === 2) {
        params.startTime = dateRange.value[0]
        params.endTime = dateRange.value[1]
      }

      const blob = await exportOrders(params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `订单列表_${new Date().getTime()}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      ElMessage.success('导出成功')
    })
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导出失败', error)
      ElMessage.error('导出失败')
    }
  }
}

// 查看详情
const handleViewDetail = async (id) => {
  try {
    const res = await getOrderDetailApi(id)
    orderDetail.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败', error)
  }
}

// 发货
const handleShip = (row) => {
  currentOrder.value = row
  shipForm.orderId = row.id
  shipForm.logisticsCompany = ''
  shipForm.trackingNumber = ''
  shipForm.remark = ''
  shipVisible.value = true
}

// 确认发货
const confirmShip = async () => {
  try {
    await shipFormRef.value.validate()
    await shipOrder(shipForm)

    ElMessage.success('发货成功')

    // 🆕 显示通知提示
    ElNotification({
      title: '操作提示',
      message: '已为用户发送发货通知',
      type: 'success',
      duration: 3000
    })

    shipVisible.value = false
    getOrderList()
  } catch (error) {
    if (error !== false) {
      console.error('发货失败', error)
    }
  }
}

// 🆕 派送方法
const handleDeliver = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确认将订单 ${row.orderNo} 的物流状态改为"派送中"吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    await deliverOrder(row.id)

    ElMessage.success('派送成功')

    // 🆕 显示通知提示
    ElNotification({
      title: '操作提示',
      message: '物流状态已更新,用户将收到派送通知',
      type: 'success',
      duration: 3000
    })

    getOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '派送失败')
    }
  }
}

// 取消订单
const handleCancel = (row) => {
  currentOrder.value = row
  cancelForm.orderId = row.id
  cancelForm.cancelReason = ''
  cancelVisible.value = true
}

// 确认取消
const confirmCancel = async () => {
  try {
    await cancelFormRef.value.validate()
    await ElMessageBox.confirm('确认取消该订单? 此操作将回滚库存并自动退款(如已支付)', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelOrder(cancelForm)

    ElMessage.success('取消成功')

    // 🆕 显示通知提示
    ElNotification({
      title: '操作提示',
      message: '已为用户发送取消通知,系统将自动退款',
      type: 'warning',
      duration: 4000
    })

    cancelVisible.value = false
    getOrderList()
  } catch (error) {
    if (error !== 'cancel' && error !== false) {
      console.error('取消订单失败', error)
    }
  }
}

// 添加备注
const handleRemark = (row) => {
  currentOrder.value = row
  remarkForm.orderId = row.id
  remarkForm.remark = ''
  remarkVisible.value = true
}

// 确认备注
const confirmRemark = async () => {
  try {
    await remarkFormRef.value.validate()
    await addRemark(remarkForm)
    ElMessage.success('备注添加成功')
    remarkVisible.value = false
    getOrderList()
  } catch (error) {
    if (error !== false) {
      console.error('添加备注失败', error)
    }
  }
}

// 订单状态标签类型
const getStatusType = (status) => {
  const map = {
    0: 'info',
    1: 'warning',
    2: 'primary',
    3: 'success',
    4: 'danger'
  }
  return map[status] || ''
}

// 物流状态标签类型
const getLogisticsType = (status) => {
  const map = {
    0: 'info',
    1: 'warning',
    2: 'primary',
    3: 'success'
  }
  return map[status] || ''
}

// 初始化
onMounted(() => {
  getOrderList()
})
</script>

<style scoped>
.order-manage {
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
      radial-gradient(circle at 90% 20%, rgba(37, 99, 235, 0.22), transparent 32%);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.hero-kicker {
  color: #93c5fd;
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

.search-card {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.table-card {
  margin-bottom: 20px;
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

.amount-text {
  color: #b45309;
  font-weight: 800;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-container {
  max-height: 600px;
  overflow-y: auto;
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
