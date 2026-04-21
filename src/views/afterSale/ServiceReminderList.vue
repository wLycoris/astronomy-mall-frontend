<template>
  <el-config-provider :locale="zhCn">
    <div class="reminder-page">
      <!-- 页面标题 + 新增按钮 -->
      <div class="page-header">
        <div class="header-left">
          <span class="section-kicker">MAINTENANCE LOG</span>
          <h2 class="page-title">
            <el-icon class="title-icon"><Calendar /></el-icon>
            器材保养提醒
          </h2>
          <p class="page-subtitle">为您的天文器材设置定期保养计划，按时维护延长使用寿命</p>
        </div>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新增提醒
        </el-button>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-cards" v-if="reminders.length > 0">
        <div class="stat-card">
          <span class="stat-num">{{ totalCount }}</span>
          <span class="stat-label">全部提醒</span>
        </div>
        <div class="stat-card warning">
          <span class="stat-num">{{ urgentCount }}</span>
          <span class="stat-label">即将到期（7天内）</span>
        </div>
        <div class="stat-card danger">
          <span class="stat-num">{{ overdueCount }}</span>
          <span class="stat-label">已逾期</span>
        </div>
        <div class="stat-card success">
          <span class="stat-num">{{ doneCount }}</span>
          <span class="stat-label">已完成</span>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-box">
        <el-skeleton :rows="4" animated />
      </div>

      <!-- 空状态 -->
      <el-empty
          v-else-if="!loading && reminders.length === 0"
          description="还没有保养提醒，点击右上角新增一条吧"
          :image-size="120"
      >
        <el-button type="primary" @click="openAddDialog">立即新增</el-button>
      </el-empty>

      <!-- 提醒卡片列表 -->
      <div v-else class="reminder-list">
        <div
            v-for="item in reminders"
            :key="item.id"
            class="reminder-card"
            :class="getCardClass(item)"
        >
          <!-- 卡片左侧：状态标识线 -->
          <div class="card-status-bar" :class="getStatusBarClass(item)"></div>

          <!-- 卡片主体 -->
          <div class="card-body">
            <!-- 顶部：标题 + 类型Tag + 操作按钮 -->
            <div class="card-top">
              <div class="card-title-row">
                <el-icon v-if="item.isDone === 1" class="done-icon"><CircleCheck /></el-icon>
                <span class="card-title" :class="{ 'title-done': item.isDone === 1 }">
                {{ item.remindTitle }}
              </span>
                <el-tag :type="getTypeTagColor(item.remindType)" size="small" class="type-tag">
                  {{ item.remindTypeLabel }}
                </el-tag>
                <el-tag v-if="getDaysUntil(item.remindDate) < 0 && item.isDone === 0" type="danger" size="small">
                  已逾期 {{ Math.abs(getDaysUntil(item.remindDate)) }} 天
                </el-tag>
                <el-tag
                    v-else-if="getDaysUntil(item.remindDate) <= 7 && getDaysUntil(item.remindDate) >= 0 && item.isDone === 0"
                    type="warning"
                    size="small"
                >
                  还有 {{ getDaysUntil(item.remindDate) }} 天
                </el-tag>
                <el-tag v-if="item.isDone === 1" type="success" size="small">已完成</el-tag>
              </div>

              <!-- 操作按钮 -->
              <div class="card-actions">
                <el-button
                    v-if="item.isDone === 0"
                    type="success"
                    size="small"
                    plain
                    @click="openDoneDialog(item)"
                >
                  <el-icon><Check /></el-icon> 完成
                </el-button>
                <el-button v-else size="small" plain @click="handleReactivate(item)">
                  重新激活
                </el-button>
                <el-button size="small" @click="openEditDialog(item)">
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button type="danger" size="small" plain @click="handleDelete(item.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 器材名称 -->
            <div class="card-product">
              <el-icon><Box /></el-icon>
              <span>{{ item.productName }}</span>
            </div>

            <!-- 底部：日期信息 -->
            <div class="card-footer">
            <span class="remind-date" :class="getDateClass(item)">
              <el-icon><Calendar /></el-icon>
              提醒日期：{{ item.remindDate }}
            </span>
              <span v-if="item.isDone === 1 && item.doneTime" class="done-time">
              <el-icon><Clock /></el-icon>
              完成时间：{{ formatDateTime(item.doneTime) }}
            </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 新增 / 编辑 弹窗 ========== -->
      <el-dialog
          v-model="dialogVisible"
          :title="isEdit ? '编辑保养提醒' : '新增保养提醒'"
          width="500px"
          class="maintenance-dialog"
          :close-on-click-modal="false"
          destroy-on-close
      >
        <el-form
            ref="formRef"
            :model="form"
            :rules="formRules"
            label-width="90px"
        >
          <!-- 器材名称 -->
          <el-form-item label="器材名称" prop="productName">
            <el-input
                v-model="form.productName"
                placeholder="请输入器材名称，如：天狼80折射望远镜"
                maxlength="100"
                show-word-limit
            />
          </el-form-item>

          <!-- 提醒标题 -->
          <el-form-item label="提醒标题" prop="remindTitle">
            <el-input
                v-model="form.remindTitle"
                placeholder="如：清洁物镜、校准赤道仪极轴..."
                maxlength="100"
                show-word-limit
            />
          </el-form-item>

          <!-- 保养类型 -->
          <el-form-item label="保养类型">
            <el-select
                v-model="form.remindTypeSelect"
                placeholder="请选择"
                style="width: 100%"
                @change="onRemindTypeChange"
            >
              <el-option label="光学清洁" value="clean" />
              <el-option label="赤道仪校准" value="calibrate" />
              <el-option label="常规检查" value="check" />
              <el-option label="自定义" value="custom" />
            </el-select>
            <!-- 选了"自定义"后出现输入框，让用户填写具体内容 -->
            <el-input
                v-if="form.remindTypeSelect === 'custom'"
                v-model="form.remindTypeCustom"
                placeholder="请输入自定义保养类型，如：镜筒除湿"
                maxlength="20"
                show-word-limit
                style="margin-top: 8px"
            />
          </el-form-item>

          <!-- 提醒日期 -->
          <el-form-item label="提醒日期" prop="remindDate">
            <el-date-picker
                v-model="form.remindDate"
                type="date"
                placeholder="选择提醒日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存' : '新增' }}
          </el-button>
        </template>
      </el-dialog>

      <!-- ========== 标记完成 弹窗 ========== -->
      <el-dialog
          v-model="doneDialogVisible"
          title="标记为已完成"
          width="440px"
          class="maintenance-done-dialog"
          :close-on-click-modal="false"
          destroy-on-close
      >
        <div class="done-dialog-content">
          <p class="done-tip">
            确认完成「<strong>{{ currentItem?.remindTitle }}</strong>」的保养工作？
          </p>

          <div class="next-remind-section">
            <div class="next-remind-toggle">
              <el-checkbox v-model="setNextRemind">同时设置下次提醒日期</el-checkbox>
            </div>
            <el-date-picker
                v-if="setNextRemind"
                v-model="nextRemindDate"
                type="date"
                placeholder="选择下次提醒日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%; margin-top: 10px"
                :disabled-date="disablePastDate"
            />
            <p v-if="setNextRemind && !nextRemindDate" class="tip-text">
              请选择下次提醒日期
            </p>
          </div>
        </div>

        <template #footer>
          <el-button @click="doneDialogVisible = false">取消</el-button>
          <el-button
              type="success"
              :loading="submitting"
              :disabled="setNextRemind && !nextRemindDate"
              @click="handleMarkDone"
          >
            确认完成
          </el-button>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  Plus, Edit, Delete, Check, CircleCheck,
  Calendar, Clock, Box
} from '@element-plus/icons-vue'
import {
  getMyReminderList,
  addReminder,
  updateReminder,
  deleteReminder
} from '@/api/serviceReminder'
import dayjs from 'dayjs'

// ===================== 固定类型集合 =====================
// 用于判断是否为预设类型，还是用户自定义文字
const FIXED_TYPES = ['clean', 'calibrate', 'check']

// ===================== 响应式数据 =====================

const reminders = ref([])
const loading = ref(false)
const submitting = ref(false)
const maintenanceMessageOptions = {
  customClass: 'maintenance-message-box',
  confirmButtonClass: 'maintenance-message-confirm',
  cancelButtonClass: 'maintenance-message-cancel'
}

// 新增/编辑弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

/**
 * form 字段说明：
 *   remindTypeSelect  - 下拉绑定（clean/calibrate/check/custom）
 *   remindTypeCustom  - 选了 custom 后用户填写的自定义文字（如"镜筒除湿"）
 *   remindType        - 最终提交后端的值：
 *                       固定类型 → 英文 key（clean/calibrate/check）
 *                       自定义   → 用户输入的文字，未填则为 'custom'
 */
const form = ref({
  id: null,
  productName: '',
  remindTitle: '',
  remindTypeSelect: 'custom',
  remindTypeCustom: '',
  remindType: 'custom',
  remindDate: ''
})

// 标记完成弹窗
const doneDialogVisible = ref(false)
const currentItem = ref(null)
const setNextRemind = ref(false)
const nextRemindDate = ref('')

// ===================== 表单验证规则 =====================

const formRules = {
  productName: [
    { required: true, message: '请输入器材名称', trigger: 'blur' },
    { max: 100, message: '器材名称不超过100个字符', trigger: 'blur' }
  ],
  remindTitle: [
    { required: true, message: '请输入提醒标题', trigger: 'blur' },
    { max: 100, message: '提醒标题不超过100个字符', trigger: 'blur' }
  ],
  remindDate: [
    { required: true, message: '请选择提醒日期', trigger: 'change' }
  ]
}

// ===================== 计算属性（统计卡片） =====================

const totalCount = computed(() => reminders.value.length)

const urgentCount = computed(() =>
    reminders.value.filter(item => {
      const diff = getDaysUntil(item.remindDate)
      return diff >= 0 && diff <= 7 && item.isDone === 0
    }).length
)

const overdueCount = computed(() =>
    reminders.value.filter(item => getDaysUntil(item.remindDate) < 0 && item.isDone === 0).length
)

const doneCount = computed(() =>
    reminders.value.filter(item => item.isDone === 1).length
)

// ===================== 工具函数 =====================

const getDaysUntil = (remindDate) => {
  return dayjs(remindDate).diff(dayjs().startOf('day'), 'day')
}

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return dayjs(dt).format('YYYY-MM-DD HH:mm')
}

const disablePastDate = (date) => {
  return date < new Date(new Date().setHours(0, 0, 0, 0))
}

// ===================== 样式计算 =====================

const getCardClass = (item) => {
  if (item.isDone === 1) return 'card-done'
  const diff = getDaysUntil(item.remindDate)
  if (diff < 0) return 'card-overdue'
  if (diff <= 7) return 'card-urgent'
  return ''
}

const getStatusBarClass = (item) => {
  if (item.isDone === 1) return 'bar-done'
  const diff = getDaysUntil(item.remindDate)
  if (diff < 0) return 'bar-overdue'
  if (diff <= 7) return 'bar-urgent'
  return 'bar-normal'
}

const getDateClass = (item) => {
  if (item.isDone === 1) return ''
  const diff = getDaysUntil(item.remindDate)
  if (diff < 0) return 'date-overdue'
  if (diff <= 7) return 'date-urgent'
  return ''
}

const getTypeTagColor = (type) => {
  const colorMap = { clean: 'primary', calibrate: 'warning', check: 'info' }
  return colorMap[type] || ''
}

// ===================== 保养类型下拉切换 =====================

/**
 * 选固定类型 → 清空自定义文字，remindType 直接用下拉值
 * 选 custom  → 等用户填输入框，handleSubmit 里再合并
 */
const onRemindTypeChange = (val) => {
  if (FIXED_TYPES.includes(val)) {
    form.value.remindType = val
    form.value.remindTypeCustom = ''
  }
}

// ===================== 数据加载 =====================

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getMyReminderList()
    reminders.value = res.data || []
  } catch (e) {
    ElMessage.error('加载保养提醒列表失败')
  } finally {
    loading.value = false
  }
}

// ===================== 弹窗操作 =====================

const openAddDialog = () => {
  isEdit.value = false
  form.value = {
    id: null,
    productName: '',
    remindTitle: '',
    remindTypeSelect: 'custom',
    remindTypeCustom: '',
    remindType: 'custom',
    remindDate: ''
  }
  dialogVisible.value = true
}

/**
 * 编辑回填逻辑：
 *   固定类型（clean/calibrate/check）→ select 显示对应项，输入框隐藏
 *   自定义文字（如"镜筒除湿"）       → select 选 custom，输入框回填文字
 *   值为 'custom'（未填文字）        → select 选 custom，输入框为空
 */
const openEditDialog = (item) => {
  isEdit.value = true
  const isFixed = FIXED_TYPES.includes(item.remindType)
  form.value = {
    id: item.id,
    productName: item.productName,
    remindTitle: item.remindTitle,
    remindTypeSelect: isFixed ? item.remindType : 'custom',
    remindTypeCustom: isFixed || item.remindType === 'custom' ? '' : item.remindType,
    remindType: item.remindType,
    remindDate: item.remindDate
  }
  dialogVisible.value = true
}

const openDoneDialog = (item) => {
  currentItem.value = item
  setNextRemind.value = false
  nextRemindDate.value = ''
  doneDialogVisible.value = true
}

// ===================== 提交逻辑 =====================

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 自定义类型：用输入框内容作为最终 remindType，未填则降级为 'custom'
  if (form.value.remindTypeSelect === 'custom') {
    form.value.remindType = form.value.remindTypeCustom.trim() || 'custom'
  }

  submitting.value = true
  try {
    const payload = {
      productName: form.value.productName,
      remindTitle: form.value.remindTitle,
      remindType:  form.value.remindType,
      remindDate:  form.value.remindDate
    }

    if (isEdit.value) {
      await updateReminder(form.value.id, payload)
      ElMessage.success('保养提醒已更新')
    } else {
      await addReminder(payload)
      ElMessage.success('保养提醒已新增')
    }

    dialogVisible.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error(isEdit.value ? '更新失败，请重试' : '新增失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleMarkDone = async () => {
  if (setNextRemind.value && !nextRemindDate.value) {
    ElMessage.warning('请选择下次提醒日期')
    return
  }

  submitting.value = true
  try {
    if (setNextRemind.value && nextRemindDate.value) {
      await updateReminder(currentItem.value.id, { isDone: 1 })
      await addReminder({
        productName: currentItem.value.productName,
        remindTitle: currentItem.value.remindTitle,
        remindType:  currentItem.value.remindType,
        remindDate:  nextRemindDate.value
      })
      ElMessage.success(`已完成！下次提醒已设置为 ${nextRemindDate.value}`)
    } else {
      await updateReminder(currentItem.value.id, { isDone: 1 })
      ElMessage.success('已标记为完成')
    }

    doneDialogVisible.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleReactivate = async (item) => {
  try {
    await updateReminder(item.id, { isDone: 0 })
    ElMessage.success('已重新激活')
    await fetchList()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
        '确定删除此条保养提醒？',
        '删除提醒',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
          appendToBody: true,
          ...maintenanceMessageOptions
        }
    )
    await deleteReminder(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.reminder-page {
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-card.warning .stat-num { color: #e6a23c; }
.stat-card.danger .stat-num  { color: #f56c6c; }
.stat-card.success .stat-num { color: #67c23a; }

.loading-box { padding: 20px; }

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-card {
  display: flex;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.reminder-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-overdue { border-color: #fde2e2; background: #fff8f8; }
.card-urgent  { border-color: #faecd8; background: #fffaf4; }
.card-done    { border-color: #e9ede9; background: #f8f8f8; opacity: 0.8; }

.card-status-bar {
  width: 5px;
  flex-shrink: 0;
  border-radius: 10px 0 0 10px;
}

.bar-normal  { background: #409eff; }
.bar-urgent  { background: #e6a23c; }
.bar-overdue { background: #f56c6c; }
.bar-done    { background: #67c23a; }

.card-body {
  flex: 1;
  padding: 16px 16px 12px;
  min-width: 0;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.done-icon { color: #67c23a; font-size: 18px; }

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.title-done {
  color: #909399;
  text-decoration: line-through;
}

.type-tag { margin-left: 2px; }

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.card-product {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
  font-size: 13px;
  color: #909399;
}

.remind-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-overdue { color: #f56c6c; font-weight: 600; }
.date-urgent  { color: #e6a23c; font-weight: 600; }

.done-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
}

.done-dialog-content { padding: 4px 0; }

.done-tip {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
}

.next-remind-section {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
}

.next-remind-toggle { margin-bottom: 4px; }

.tip-text {
  margin: 8px 0 0;
  font-size: 12px;
  color: #e6a23c;
}

@media (max-width: 600px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .card-top { flex-direction: column; }
  .card-actions { flex-wrap: wrap; }
}

/* Final after-sale maintenance pass */
:global(body .reminder-page.reminder-page) {
  max-width: 100%;
  padding: 0;
  color: #111827;
}

:global(body .reminder-page.reminder-page .page-header) {
  margin: 0 0 16px;
  padding: 18px 22px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 14px 38px rgba(17, 24, 39, 0.06);
}

:global(body .reminder-page.reminder-page .section-kicker) {
  display: block;
  margin-bottom: 7px;
  color: #9c6b35;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0;
}

:global(body .reminder-page.reminder-page .page-title) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 850;
  letter-spacing: 0;
}

:global(body .reminder-page.reminder-page .title-icon) {
  color: #9c6b35;
  font-size: 19px;
}

:global(body .reminder-page.reminder-page .page-subtitle) {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
}

:global(body .reminder-page.reminder-page .el-button) {
  min-height: 34px;
  border-radius: 4px;
  font-weight: 760;
  letter-spacing: 0;
}

:global(body .reminder-page.reminder-page .el-button span) {
  color: inherit;
}

:global(body .reminder-page.reminder-page .el-button--primary) {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

:global(body .reminder-page.reminder-page .el-button--primary:hover) {
  border-color: #273142;
  background: #273142;
}

:global(body .reminder-page.reminder-page .el-button--success.is-plain) {
  border-color: rgba(77, 124, 90, 0.35);
  background: #f4f8f2;
  color: #4d7c5a;
}

:global(body .reminder-page.reminder-page .el-button--success:not(.is-plain)) {
  border-color: #4d7c5a;
  background: #4d7c5a;
  color: #fff;
}

:global(body .reminder-page.reminder-page .el-button--danger.is-plain) {
  border-color: rgba(156, 79, 30, 0.34);
  background: #fff8ec;
  color: #9c4f1e;
}

:global(body .reminder-page.reminder-page .stat-cards) {
  gap: 12px;
  margin-bottom: 16px;
}

:global(body .reminder-page.reminder-page .stat-card) {
  padding: 16px 14px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.055);
  text-align: left;
}

:global(body .reminder-page.reminder-page .stat-num) {
  color: #111827;
  font-size: 28px;
  font-weight: 850;
}

:global(body .reminder-page.reminder-page .stat-label) {
  color: #6b7280;
  font-weight: 650;
}

:global(body .reminder-page.reminder-page .stat-card.warning .stat-num) {
  color: #9c6b35;
}

:global(body .reminder-page.reminder-page .stat-card.danger .stat-num) {
  color: #9c4f1e;
}

:global(body .reminder-page.reminder-page .stat-card.success .stat-num) {
  color: #4d7c5a;
}

:global(body .reminder-page.reminder-page .loading-box),
:global(body .reminder-page.reminder-page .el-empty) {
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 14px 38px rgba(17, 24, 39, 0.06);
}

:global(body .reminder-page.reminder-page .el-empty) {
  min-height: 340px;
}

:global(body .reminder-page.reminder-page .el-empty__description p) {
  color: #4b5563;
  font-weight: 650;
}

:global(body .reminder-page.reminder-page .reminder-list) {
  gap: 12px;
}

:global(body .reminder-page.reminder-page .reminder-card) {
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.055);
}

:global(body .reminder-page.reminder-page .reminder-card:hover) {
  border-color: rgba(156, 107, 53, 0.26);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.09);
}

:global(body .reminder-page.reminder-page .card-overdue) {
  border-color: rgba(156, 79, 30, 0.22);
  background: #fffaf5;
}

:global(body .reminder-page.reminder-page .card-urgent) {
  border-color: rgba(156, 107, 53, 0.24);
  background: #fff8ec;
}

:global(body .reminder-page.reminder-page .card-done) {
  border-color: rgba(17, 24, 39, 0.08);
  background: #f8f5ef;
  opacity: 1;
}

:global(body .reminder-page.reminder-page .card-status-bar) {
  width: 4px;
  border-radius: 7px 0 0 7px;
}

:global(body .reminder-page.reminder-page .bar-normal) {
  background: #111827;
}

:global(body .reminder-page.reminder-page .bar-urgent) {
  background: #9c6b35;
}

:global(body .reminder-page.reminder-page .bar-overdue) {
  background: #9c4f1e;
}

:global(body .reminder-page.reminder-page .bar-done) {
  background: #4d7c5a;
}

:global(body .reminder-page.reminder-page .card-body) {
  padding: 16px 18px 14px;
}

:global(body .reminder-page.reminder-page .card-title) {
  color: #111827;
  font-size: 16px;
  font-weight: 850;
  line-height: 1.5;
}

:global(body .reminder-page.reminder-page .title-done) {
  color: #6b7280;
  text-decoration-color: rgba(107, 114, 128, 0.6);
}

:global(body .reminder-page.reminder-page .done-icon) {
  color: #4d7c5a;
}

:global(body .reminder-page.reminder-page .card-product) {
  margin-top: 10px;
  color: #4b5563;
  font-weight: 650;
}

:global(body .reminder-page.reminder-page .card-footer) {
  gap: 18px;
  margin-top: 12px;
  color: #6b7280;
  font-weight: 650;
  flex-wrap: wrap;
}

:global(body .reminder-page.reminder-page .date-overdue) {
  color: #9c4f1e;
}

:global(body .reminder-page.reminder-page .date-urgent) {
  color: #8a5a22;
}

:global(body .reminder-page.reminder-page .done-time) {
  color: #4d7c5a;
}

:global(body .reminder-page.reminder-page .el-tag) {
  border-radius: 999px;
  font-weight: 760;
}

:global(body .reminder-page.reminder-page .el-tag--primary),
:global(body .reminder-page.reminder-page .el-tag--warning),
:global(body .reminder-page.reminder-page .el-tag--info) {
  border-color: rgba(156, 107, 53, 0.26);
  background: #fff8ec;
  color: #8a5a22;
}

:global(body .reminder-page.reminder-page .el-tag--success) {
  border-color: rgba(77, 124, 90, 0.28);
  background: #f4f8f2;
  color: #4d7c5a;
}

:global(body .reminder-page.reminder-page .el-tag--danger) {
  border-color: rgba(156, 79, 30, 0.28);
  background: #fff1e8;
  color: #9c4f1e;
}

:global(.maintenance-dialog .el-dialog),
:global(.maintenance-dialog.el-dialog),
:global(.maintenance-done-dialog .el-dialog),
:global(.maintenance-done-dialog.el-dialog) {
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 7px;
  background: #fffdfa;
  box-shadow: 0 28px 70px rgba(17, 24, 39, 0.22);
}

:global(.maintenance-dialog .el-dialog__header),
:global(.maintenance-dialog.el-dialog .el-dialog__header),
:global(.maintenance-done-dialog .el-dialog__header),
:global(.maintenance-done-dialog.el-dialog .el-dialog__header) {
  margin: 0;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  background: #f8f5ef;
}

:global(.maintenance-dialog .el-dialog__title),
:global(.maintenance-dialog.el-dialog .el-dialog__title),
:global(.maintenance-done-dialog .el-dialog__title),
:global(.maintenance-done-dialog.el-dialog .el-dialog__title) {
  color: #111827;
  font-size: 18px;
  font-weight: 850;
}

:global(.maintenance-dialog .el-dialog__body),
:global(.maintenance-dialog.el-dialog .el-dialog__body),
:global(.maintenance-done-dialog .el-dialog__body),
:global(.maintenance-done-dialog.el-dialog .el-dialog__body) {
  padding: 20px 22px;
}

:global(.maintenance-dialog .el-dialog__footer),
:global(.maintenance-dialog.el-dialog .el-dialog__footer),
:global(.maintenance-done-dialog .el-dialog__footer),
:global(.maintenance-done-dialog.el-dialog .el-dialog__footer) {
  padding: 0 22px 20px;
}

:global(.maintenance-dialog .el-form-item__label),
:global(.maintenance-dialog.el-dialog .el-form-item__label) {
  color: #111827;
  font-weight: 760;
}

:global(.maintenance-dialog .el-input__wrapper),
:global(.maintenance-dialog.el-dialog .el-input__wrapper),
:global(.maintenance-dialog .el-select__wrapper),
:global(.maintenance-dialog.el-dialog .el-select__wrapper),
:global(.maintenance-done-dialog .el-input__wrapper),
:global(.maintenance-done-dialog.el-dialog .el-input__wrapper) {
  min-height: 38px;
  border-radius: 5px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.14);
}

:global(.maintenance-dialog .el-input__inner),
:global(.maintenance-dialog.el-dialog .el-input__inner),
:global(.maintenance-done-dialog .el-input__inner),
:global(.maintenance-done-dialog.el-dialog .el-input__inner) {
  color: #111827;
  font-weight: 600;
}

:global(.maintenance-dialog .el-input__wrapper.is-focus),
:global(.maintenance-dialog.el-dialog .el-input__wrapper.is-focus),
:global(.maintenance-dialog .el-select__wrapper.is-focused),
:global(.maintenance-dialog.el-dialog .el-select__wrapper.is-focused),
:global(.maintenance-done-dialog .el-input__wrapper.is-focus),
:global(.maintenance-done-dialog.el-dialog .el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 1px #9c6b35, 0 0 0 3px rgba(156, 107, 53, 0.1);
}

:global(body .reminder-page.reminder-page .done-dialog-content) {
  color: #111827;
}

:global(body .reminder-page.reminder-page .done-tip) {
  color: #374151;
  line-height: 1.7;
}

:global(body .reminder-page.reminder-page .next-remind-section) {
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 7px;
  background: #f8f5ef;
}

:global(body .reminder-page.reminder-page .tip-text) {
  color: #9c6b35;
  font-weight: 700;
}

:global(body .maintenance-message-box.el-message-box) {
  width: 420px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 7px;
  box-shadow: 0 28px 70px rgba(17, 24, 39, 0.24);
}

:global(body .maintenance-message-box .el-message-box__header) {
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  background: #f8f5ef;
}

:global(body .maintenance-message-box .el-message-box__title) {
  color: #111827;
  font-size: 17px;
  font-weight: 800;
}

:global(body .maintenance-message-box .el-message-box__content) {
  padding: 18px 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
}

:global(body .maintenance-message-box .el-message-box__btns) {
  padding: 0 20px 18px;
}

:global(body .maintenance-message-confirm.el-button--primary) {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

:global(body .maintenance-message-cancel.el-button) {
  border-color: rgba(17, 24, 39, 0.16);
  background: #fff;
  color: #111827;
}

@media (max-width: 720px) {
  :global(body .reminder-page.reminder-page .page-header) {
    flex-direction: column;
    gap: 14px;
  }

  :global(body .reminder-page.reminder-page .stat-cards) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  :global(.maintenance-dialog .el-dialog),
  :global(.maintenance-dialog.el-dialog),
  :global(.maintenance-done-dialog .el-dialog),
  :global(.maintenance-done-dialog.el-dialog) {
    width: calc(100vw - 28px) !important;
  }
}
</style>
