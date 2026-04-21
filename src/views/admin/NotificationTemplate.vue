<template>
  <div class="page-container">
    <section class="admin-page-hero tone-violet">
      <div class="admin-page-copy">
        <span class="admin-page-kicker">MESSAGE TEMPLATE</span>
        <h2>通知模板</h2>
        <p>维护订单、课程、论坛等模块的系统通知文案，让自动推送保持清晰一致。</p>
      </div>
      <div class="admin-page-metrics">
        <div class="admin-metric-card">
          <span>模板总数</span>
          <strong>{{ templateTotal }}</strong>
        </div>
        <div class="admin-metric-card success">
          <span>已启用</span>
          <strong>{{ templateEnabledCount }}</strong>
        </div>
        <div class="admin-metric-card warning">
          <span>覆盖模块</span>
          <strong>{{ templateModuleCount }}</strong>
        </div>
      </div>
    </section>

    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else>
      <div
          v-for="(templates, moduleLabel) in groupedTemplates"
          :key="moduleLabel"
          style="margin-bottom:24px"
      >
        <!-- 模块标题 -->
        <div class="module-hd">
          <span class="mod-icon">{{ moduleLabel.slice(0, 1) }}</span>
          <span class="mod-name">{{ moduleLabel }}</span>
          <el-tag size="small" type="info" style="margin-left:8px">{{ templates.length }} 个模板</el-tag>
          <span class="mod-stat">
            已启用 {{ templates.filter(t => t.enabled === 1).length }} /
            共 {{ templates.length }}
          </span>
        </div>

        <!-- 模板卡片网格 -->
        <el-row :gutter="14">
          <el-col
              v-for="tmpl in templates"
              :key="tmpl.id"
              :xs="24" :sm="24" :md="12" :lg="12" :xl="8"
              style="margin-bottom:14px"
          >
            <el-card
                shadow="hover"
                :class="['tmpl-card', { 'is-disabled': tmpl.enabled === 0 }]"
            >
              <!-- 头部 -->
              <div class="tc-head">
                <span class="tc-code">{{ tmpl.code }}</span>
                <el-tag
                    :type="tmpl.enabled === 1 ? 'success' : 'info'"
                    size="small"
                    effect="plain"
                >{{ tmpl.enabled === 1 ? '启用' : '禁用' }}</el-tag>
              </div>
              <div class="tc-type">类型：{{ tmpl.type }}</div>

              <!-- 内容字段 -->
              <div class="tc-row">
                <span class="tc-lbl">标题模板</span>
                <span class="tc-val">{{ tmpl.titleTemplate }}</span>
              </div>
              <div class="tc-row">
                <span class="tc-lbl">内容模板</span>
                <span class="tc-val tc-gray">{{ tmpl.contentTemplate }}</span>
              </div>
              <div v-if="tmpl.jumpUrlTemplate" class="tc-row">
                <span class="tc-lbl">跳转链接</span>
                <span class="tc-val tc-url">{{ tmpl.jumpUrlTemplate }}</span>
              </div>

              <!-- 变量标签 -->
              <div v-if="tmpl.variables" class="tc-vars">
                <el-tag
                    v-for="(desc, key) in parseVars(tmpl.variables)"
                    :key="key"
                    size="small"
                    type="warning"
                    effect="plain"
                    style="margin:2px;font-family:monospace"
                >{{ '{' + key + '}' }}</el-tag>
              </div>

              <!-- 备注 -->
              <div v-if="tmpl.remark" class="tc-remark">{{ tmpl.remark }}</div>

              <!-- 操作 -->
              <div class="tc-actions">
                <el-button type="primary" link size="small" @click="openEdit(tmpl)">编辑</el-button>
                <el-divider direction="vertical" />
                <el-button
                    :type="tmpl.enabled === 1 ? 'warning' : 'success'"
                    link size="small"
                    @click="toggleStatus(tmpl)"
                >{{ tmpl.enabled === 1 ? '禁用' : '启用' }}</el-button>
                <el-divider direction="vertical" />
                <el-button type="info" link size="small" @click="openPreview(tmpl)">预览</el-button>
                <el-divider direction="vertical" />
                <el-button type="danger" link size="small" @click="doReset(tmpl)">恢复默认</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-empty v-if="Object.keys(groupedTemplates).length === 0" description="暂无通知模板" />
    </template>

    <!-- ===== 编辑对话框 ===== -->
    <el-dialog v-model="editVisible" title="编辑通知模板" width="580px" :close-on-click-modal="false">
      <el-form ref="editRef" :model="editForm" :rules="editRules" label-width="90px">
        <el-form-item label="模板编码">
          <el-input :value="editForm.code" disabled />
        </el-form-item>
        <el-form-item label="标题模板" prop="titleTemplate">
          <el-input v-model="editForm.titleTemplate" placeholder="支持 {变量名} 占位符" />
        </el-form-item>
        <el-form-item label="内容模板" prop="contentTemplate">
          <el-input v-model="editForm.contentTemplate" type="textarea" :rows="3" placeholder="支持 {变量名} 占位符" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="editForm.jumpUrlTemplate" placeholder="如 /order/detail?id={orderId}" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" />
        </el-form-item>
        <el-form-item v-if="editForm.variables" label="可用变量">
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            <el-tag
                v-for="(desc, key) in parseVars(editForm.variables)"
                :key="key"
                size="small"
                type="warning"
                effect="plain"
                style="cursor:pointer;font-family:monospace"
                @click="copyVar(key)"
            >{{ '{' + key + '}' }} · {{ desc }}</el-tag>
          </div>
          <div style="font-size:11px;color:#c0c4cc;margin-top:6px">点击标签可复制变量名</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 预览对话框 ===== -->
    <el-dialog v-model="previewVisible" title="模板预览" width="480px">
      <div v-if="previewVarRows.length" style="margin-bottom:16px">
        <div style="font-weight:600;margin-bottom:10px;font-size:13px">填写示例变量值：</div>
        <div v-for="row in previewVarRows" :key="row.key" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="width:130px;flex-shrink:0;font-family:monospace;font-size:12px;color:#E6A23C">
            {{ '{' + row.key + '}' }}
          </span>
          <el-input v-model="row.value" size="small" :placeholder="row.desc" style="flex:1" @input="calcPreview" />
        </div>
      </div>
      <el-card shadow="never" style="background:#f5f7fa">
        <div style="font-size:15px;font-weight:600;margin-bottom:6px">{{ previewTitle }}</div>
        <div style="font-size:13px;color:#606266;line-height:1.6;margin-bottom:6px">{{ previewContent }}</div>
        <div v-if="previewUrl" style="font-size:12px;color:#409EFF;font-family:monospace">🔗 {{ previewUrl }}</div>
      </el-card>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTemplateList, updateTemplate, updateTemplateStatus, resetTemplate } from '@/api/admin/notification'

const loading          = ref(false)
const groupedTemplates = ref({})

const templateTotal = computed(() => Object.values(groupedTemplates.value).reduce((sum, templates) => sum + templates.length, 0))
const templateEnabledCount = computed(() => Object.values(groupedTemplates.value).reduce((sum, templates) => {
  return sum + templates.filter(t => t.enabled === 1).length
}, 0))
const templateModuleCount = computed(() => Object.keys(groupedTemplates.value).length)

// 编辑
const editVisible = ref(false)
const saving      = ref(false)
const editRef     = ref(null)
const editForm    = reactive({
  id: null, code: '', module: '', moduleLabel: '',
  titleTemplate: '', contentTemplate: '', jumpUrlTemplate: '', remark: '', variables: ''
})
const editRules = {
  titleTemplate:   [{ required: true, message: '标题模板不能为空', trigger: 'blur' }],
  contentTemplate: [{ required: true, message: '内容模板不能为空', trigger: 'blur' }]
}

// 预览
const previewVisible  = ref(false)
const previewTemplate = ref({})
const previewVarRows  = ref([])
const previewTitle    = ref('')
const previewContent  = ref('')
const previewUrl      = ref('')

onMounted(fetchTemplates)

async function fetchTemplates() {
  loading.value = true
  try { groupedTemplates.value = (await getTemplateList()).data || {} }
  catch { ElMessage.error('获取模板列表失败') }
  finally { loading.value = false }
}

function openEdit(tmpl) {
  Object.assign(editForm, {
    id: tmpl.id, code: tmpl.code, module: tmpl.module, moduleLabel: tmpl.moduleLabel,
    titleTemplate: tmpl.titleTemplate, contentTemplate: tmpl.contentTemplate,
    jumpUrlTemplate: tmpl.jumpUrlTemplate || '', remark: tmpl.remark || '', variables: tmpl.variables
  })
  editVisible.value = true
}

async function saveEdit() {
  await editRef.value.validate()
  saving.value = true
  try {
    await updateTemplate(editForm.id, {
      titleTemplate: editForm.titleTemplate, contentTemplate: editForm.contentTemplate,
      jumpUrlTemplate: editForm.jumpUrlTemplate || null, remark: editForm.remark || null
    })
    ElMessage.success('保存成功')
    editVisible.value = false
    // 同步本地缓存
    for (const label in groupedTemplates.value) {
      const i = groupedTemplates.value[label].findIndex(t => t.id === editForm.id)
      if (i !== -1) {
        Object.assign(groupedTemplates.value[label][i], {
          titleTemplate: editForm.titleTemplate, contentTemplate: editForm.contentTemplate,
          jumpUrlTemplate: editForm.jumpUrlTemplate, remark: editForm.remark
        })
        break
      }
    }
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

async function toggleStatus(tmpl) {
  const target = tmpl.enabled === 1 ? 0 : 1
  const label  = target === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定${label}模板「${tmpl.code}」？`, `${label}确认`, { type: 'warning' })
  try { await updateTemplateStatus({ id: tmpl.id, enabled: target }); ElMessage.success(`${label}成功`); tmpl.enabled = target }
  catch { ElMessage.error(`${label}失败`) }
}

async function doReset(tmpl) {
  await ElMessageBox.confirm(
      `确定恢复「${tmpl.code}」的默认内容吗？将覆盖当前自定义内容并重新启用模板。`,
      '恢复默认', { type: 'warning' }
  )
  try { await resetTemplate(tmpl.id); ElMessage.success('已恢复默认'); fetchTemplates() }
  catch (e) { ElMessage.error(e.message || '恢复失败') }
}

function openPreview(tmpl) {
  previewTemplate.value = tmpl
  const vars = parseVars(tmpl.variables)
  previewVarRows.value  = Object.entries(vars).map(([key, desc]) => ({ key, desc, value: exampleVal(key) }))
  calcPreview()
  previewVisible.value = true
}

function calcPreview() {
  const t = previewTemplate.value
  const v = {}
  previewVarRows.value.forEach(r => { v[r.key] = r.value || `{${r.key}}` })
  const fill = s => (s || '').replace(/\{(\w+)\}/g, (_, k) => v[k] || `{${k}}`)
  previewTitle.value   = fill(t.titleTemplate)
  previewContent.value = fill(t.contentTemplate)
  previewUrl.value     = t.jumpUrlTemplate ? fill(t.jumpUrlTemplate) : ''
}

function parseVars(v) {
  if (!v) return {}
  try { return typeof v === 'string' ? JSON.parse(v) : v } catch { return {} }
}

async function copyVar(key) {
  try { await navigator.clipboard.writeText(`{${key}}`); ElMessage.success(`已复制 {${key}}`) }
  catch { ElMessage.info(`{${key}}`) }
}

function exampleVal(key) {
  return ({
    orderNo: 'ORD202403160001', amount: '299.00', orderId: '10086',
    logisticsCompany: '顺丰速运', trackingNumber: 'SF1234567890',
    reason: '商品质量问题', productName: '天文望远镜Pro', productId: '1001',
    price: '899.00', title: '系统维护公告', noticeId: '5',
    message: '您的账号在新设备登录', version: '2.1.0', description: '修复已知问题',
    activityId: '3', engineerName: '张工', confirmedTime: '03月20日 14:00',
    engineerPhone: '18800001234', recycleNo: 'REC202403160001'
  })[key] || ''
}

function getModuleIcon(label) {
  return ({ '商城模块': '🛒', '系统模块': '⚙️', '论坛模块': '💬',
    '课程模块': '📚', '地理位置模块': '🗺️', '推荐系统': '✨', 'AI识别模块': '🤖' })[label] || '📌'
}
</script>

<style scoped>
.page-container { padding: 0; }

/* 模块标题 */
.module-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 14px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.module-hd :deep(.el-tag) {
  border-color: rgba(250, 204, 21, 0.28);
  background: rgba(250, 204, 21, 0.1);
  color: #fde68a;
}
.mod-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgba(125, 211, 252, 0.12);
  color: #7dd3fc;
  font-size: 13px;
  font-weight: 900;
}
.mod-name { font-size: 15px; font-weight: 800; color: #f8fafc; }
.mod-stat { margin-left: auto; font-size: 12px; color: #dbeafe; font-weight: 700; }

/* 模板卡片 */
.tmpl-card { height: 100%; transition: opacity .2s; }
.tmpl-card.is-disabled { opacity: 0.55; }
.tmpl-card :deep(.el-card__body) { padding: 16px; }

.tc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.tc-code {
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  color: #409EFF;
}
.tc-type {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.tc-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.5;
}
.tc-lbl  { flex-shrink: 0; width: 56px; font-size: 11px; color: #c0c4cc; padding-top: 1px; }
.tc-val  { color: #303133; word-break: break-all; }
.tc-gray { color: #606266; }
.tc-url  { font-family: monospace; font-size: 12px; color: #E6A23C; }

.tc-vars   { margin: 8px 0 4px; }
.tc-remark { font-size: 11px; color: #909399; margin-top: 4px; }

.tc-actions {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
</style>
