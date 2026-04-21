<template>
  <div class="stock-warning">
    <section class="commerce-hero stock-hero">
      <div class="hero-copy">
        <span class="hero-kicker">INVENTORY SIGNAL</span>
        <h2>库存预警</h2>
        <p>集中处理低库存与缺货商品，优先保障热销器材的可售状态。</p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card warning">
          <span>预警商品</span>
          <strong>{{ tableData.length }}</strong>
        </div>
        <div class="metric-card danger">
          <span>已缺货</span>
          <strong>{{ emptyStockCount }}</strong>
        </div>
        <div class="metric-card">
          <span>低库存</span>
          <strong>{{ lowStockCount }}</strong>
        </div>
      </div>
    </section>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-title">
            <el-icon style="vertical-align: middle;"><Warning /></el-icon>
            库存预警
            </span>
            <small>库存不足时建议先核对销量和采购周期，再执行补货</small>
          </div>
          <el-button type="primary" @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 统计信息 -->
      <el-alert
          v-if="tableData.length > 0"
          :title="`当前共有 ${tableData.length} 件商品库存不足，请及时补货！`"
          type="warning"
          :closable="false"
          class="warning-alert"
      />

      <el-alert
          v-else
          title="暂无库存预警商品"
          type="success"
          :closable="false"
          class="warning-alert"
      />

      <!-- 预警表格 -->
      <el-table
          :data="tableData"
          v-loading="loading"
          border
          style="width: 100%;"
      >
        <!-- 序号列 -->
        <el-table-column type="index" label="序号" width="60" align="center" />

        <!-- 商品图片 -->
        <el-table-column label="商品图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
                :src="row.mainImage"
                :preview-src-list="[row.mainImage]"
                style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer;"
                fit="cover"
            />
          </template>
        </el-table-column>

        <!-- 商品名称 -->
        <el-table-column prop="productName" label="商品名称" min-width="250" show-overflow-tooltip />

        <!-- 分类 -->
        <el-table-column prop="categoryName" label="分类" width="150" align="center" />

        <!-- 库存 -->
        <el-table-column label="库存" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.stock === 0 ? 'danger' : 'warning'" size="large" effect="dark">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 销量 -->
        <el-table-column prop="sales" label="销量" width="100" align="center">
          <template #default="{ row }">
            <span class="sales-text">{{ row.sales }}</span>
          </template>
        </el-table-column>

        <!-- 预警等级 -->
        <el-table-column label="预警等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.warningLevel === 2 ? 'danger' : 'warning'" effect="dark">
              {{ row.warningDesc }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleAdjust(row)">
              <el-icon><Plus /></el-icon>
              补货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 库存调整对话框 -->
    <el-dialog
        v-model="dialogVisible"
        title="库存调整"
        width="500px"
        @close="resetForm"
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
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-width="100px"
      >
        <el-form-item label="调整类型" prop="adjustType">
          <el-radio-group v-model="form.adjustType">
            <el-radio :label="1">增加库存</el-radio>
            <el-radio :label="2">减少库存</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="调整数量" prop="quantity">
          <el-input-number
              v-model="form.quantity"
              :min="1"
              style="width: 200px;"
          />
        </el-form-item>

        <el-form-item label="调整原因" prop="reason">
          <el-input
              v-model="form.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Refresh, Plus } from '@element-plus/icons-vue'
import { getStockWarning, adjustStock } from '@/api/admin/product'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const emptyStockCount = computed(() => tableData.value.filter(item => Number(item.stock) === 0).length)
const lowStockCount = computed(() => tableData.value.filter(item => Number(item.stock) > 0).length)

// 对话框
const dialogVisible = ref(false)
const currentProduct = ref({})

// 表单
const formRef = ref()
const form = reactive({
  adjustType: 1,
  quantity: 1,
  reason: ''
})

const formRules = {
  adjustType: [{ required: true, message: '请选择调整类型' }],
  quantity: [{ required: true, message: '请输入调整数量' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

// 加载库存预警列表
const loadData = async () => {
  loading.value = true
  try {
    const res = await getStockWarning()
    tableData.value = res.data
  } catch (error) {
    console.error('加载库存预警失败:', error)
    ElMessage.error('加载库存预警失败')
  } finally {
    loading.value = false
  }
}

// 补货 - 打开库存调整对话框
const handleAdjust = (row) => {
  currentProduct.value = {
    productId: row.productId,
    productName: row.productName,
    stock: row.stock
  }
  dialogVisible.value = true
}

// 提交库存调整
const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await adjustStock(currentProduct.value.productId, form)
    ElMessage.success('库存调整成功')
    dialogVisible.value = false

    // 重新加载库存预警列表
    loadData()
  } catch (error) {
    console.error('库存调整失败:', error)
    ElMessage.error('库存调整失败')
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.adjustType = 1
  form.quantity = 1
  form.reason = ''
  formRef.value?.resetFields()
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.stock-warning {
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
      radial-gradient(circle at 90% 20%, rgba(245, 158, 11, 0.2), transparent 32%);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.hero-kicker {
  color: #fcd34d;
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

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.warning-alert {
  margin-bottom: 18px;
}

.sales-text {
  color: #2563eb;
  font-weight: 800;
}

:deep(.el-card__header) {
  border-bottom-color: #e5e7eb;
  background: #fafafa;
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
