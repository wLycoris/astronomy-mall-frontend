<template>
  <div class="setting-page">

    <!-- 顶部标题 -->
    <div class="page-hero">
      <div class="hero-left">
        <div class="hero-icon">⚙️</div>
        <div>
          <h1 class="hero-title">系统设置</h1>
          <p class="hero-sub">管理商城基础配置、运费、支付、SEO 等系统参数</p>
        </div>
      </div>
      <div class="hero-badge" v-if="maintenanceForm.maintenanceMode">
        <span class="badge-dot"></span>维护模式运行中
      </div>
    </div>

    <div class="setting-body">

      <!-- 左侧菜单 -->
      <aside class="setting-nav">
        <div
            v-for="item in menuItems" :key="item.key"
            class="nav-item" :class="{ active: activeTab === item.key }"
            @click="handleMenuSelect(item.key)"
        >
          <span class="nav-icon">{{ navIcons[item.key] }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.key === 'maintenance' && maintenanceForm.maintenanceMode" class="nav-danger-dot"></span>
        </div>
      </aside>

      <!-- 右侧内容 -->
      <main class="setting-main" v-loading="loading">

        <!-- 基础设置 -->
        <div v-show="activeTab === 'basic'" class="setting-panel">
          <div class="panel-header">
            <div class="ph-icon">🏪</div>
            <div><h2>基础设置</h2><p>商城名称、联系方式与法律信息</p></div>
          </div>
          <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-position="top" class="s-form">
            <div class="field-section">商城信息</div>
            <div class="form-row-2">
              <el-form-item label="商城名称" prop="mallName">
                <el-input v-model="basicForm.mallName" placeholder="请输入商城名称" maxlength="50" show-word-limit />
              </el-form-item>
              <el-form-item label="商城 Logo URL">
                <el-input v-model="basicForm.mallLogo" placeholder="https://..." />
              </el-form-item>
            </div>
            <el-form-item label="商城简介">
              <el-input v-model="basicForm.mallDesc" type="textarea" :rows="3" placeholder="请输入商城简介" maxlength="200" show-word-limit />
            </el-form-item>
            <div v-if="basicForm.mallLogo" class="logo-preview">
              <img :src="basicForm.mallLogo" alt="Logo预览" @error="onLogoError" /><span>Logo 预览</span>
            </div>
            <div class="field-section">联系方式</div>
            <div class="form-row-3">
              <el-form-item label="客服电话"><el-input v-model="basicForm.contactPhone" placeholder="400-888-8888" /></el-form-item>
              <el-form-item label="客服邮箱"><el-input v-model="basicForm.contactEmail" placeholder="service@example.com" /></el-form-item>
              <el-form-item label="客服 QQ"><el-input v-model="basicForm.contactQq" placeholder="QQ号码" /></el-form-item>
            </div>
            <div class="field-section">法律信息</div>
            <div class="form-row-2">
              <el-form-item label="ICP 备案号"><el-input v-model="basicForm.icpNumber" placeholder="粤ICP备XXXXXXXX号" /></el-form-item>
              <el-form-item label="版权信息"><el-input v-model="basicForm.copyright" placeholder="© 2026 商城 All Rights Reserved" /></el-form-item>
            </div>
            <div class="form-footer">
              <el-button type="primary" :loading="saving" @click="saveBasicSetting" class="save-btn">保存基础设置</el-button>
            </div>
          </el-form>
        </div>

        <!-- 运费设置 -->
        <div v-show="activeTab === 'freight'" class="setting-panel">
          <div class="panel-header">
            <div class="ph-icon">🚚</div>
            <div><h2>运费设置</h2><p>默认运费规则与包邮条件</p></div>
          </div>
          <el-form ref="freightFormRef" :model="freightForm" :rules="freightRules" label-position="top" class="s-form">
            <div class="form-row-2">
              <el-form-item label="默认运费" prop="defaultFreight">
                <el-input-number v-model="freightForm.defaultFreight" :min="0" :precision="2" :step="1" style="width:100%" />
                <div class="tip">设为 0 表示全场免运费</div>
              </el-form-item>
              <el-form-item label="满额包邮">
                <div class="toggle-row">
                  <div>
                    <div class="toggle-name">{{ freightForm.freeFreightEnabled ? '已开启' : '未开启' }}</div>
                    <div class="toggle-desc">开启后订单达到门槛金额免运费</div>
                  </div>
                  <el-switch v-model="freightForm.freeFreightEnabled" />
                </div>
              </el-form-item>
            </div>
            <el-form-item v-if="freightForm.freeFreightEnabled" label="包邮门槛金额" prop="freeFreightAmount">
              <div class="input-with-unit">
                <el-input-number v-model="freightForm.freeFreightAmount" :min="0" :precision="2" :step="10" style="width:220px" />
                <span class="unit-tag">元</span>
              </div>
              <div class="tip">订单实付金额 ≥ 此值时免运费，0 表示全部免运费</div>
            </el-form-item>
            <div class="form-footer">
              <el-button type="primary" :loading="saving" @click="saveFreightSetting" class="save-btn">保存运费设置</el-button>
            </div>
          </el-form>
        </div>

        <!-- 支付设置 -->
        <div v-show="activeTab === 'payment'" class="setting-panel">
          <div class="panel-header">
            <div class="ph-icon">💳</div>
            <div><h2>支付设置</h2><p>支付方式开关与超时策略</p></div>
          </div>
          <el-form ref="paymentFormRef" :model="paymentForm" :rules="paymentRules" label-position="top" class="s-form">
            <div class="field-section">支付方式</div>
            <div class="pay-grid">
              <div class="pay-card" :class="{ on: paymentForm.alipayEnabled }">
                <div class="pay-icon ali">支</div>
                <div class="pay-info"><div class="pay-name">支付宝</div><div class="pay-state">{{ paymentForm.alipayEnabled ? '已启用' : '已停用' }}</div></div>
                <el-switch v-model="paymentForm.alipayEnabled" />
              </div>
              <div class="pay-card" :class="{ on: paymentForm.wechatEnabled }">
                <div class="pay-icon wx">微</div>
                <div class="pay-info"><div class="pay-name">微信支付</div><div class="pay-state">{{ paymentForm.wechatEnabled ? '已启用' : '已停用' }}</div></div>
                <el-switch v-model="paymentForm.wechatEnabled" />
              </div>
              <div class="pay-card" :class="{ on: paymentForm.balanceEnabled }">
                <div class="pay-icon bal">余</div>
                <div class="pay-info"><div class="pay-name">余额支付</div><div class="pay-state">{{ paymentForm.balanceEnabled ? '已启用' : '已停用' }}</div></div>
                <el-switch v-model="paymentForm.balanceEnabled" />
              </div>
            </div>
            <div v-if="!anyPaymentEnabled" class="alert-bar">⚠️ 至少需要开启一种支付方式</div>
            <div class="field-section">超时策略</div>
            <div class="form-row-3">
              <el-form-item label="支付超时时间" prop="payTimeoutMinutes">
                <el-input-number v-model="paymentForm.payTimeoutMinutes" :min="5" :max="60" :step="5" style="width:100%" />
                <div class="tip">前端倒计时，最小 5 分钟</div>
              </el-form-item>
              <el-form-item label="自动确认收货" prop="autoConfirmDays">
                <el-input-number v-model="paymentForm.autoConfirmDays" :min="1" :max="30" :step="1" style="width:100%" />
                <div class="tip">发货后超时自动完成（天）</div>
              </el-form-item>
              <el-form-item label="自动关闭订单" prop="autoCloseDays">
                <el-input-number v-model="paymentForm.autoCloseDays" :min="1" :max="30" :step="1" style="width:100%" />
                <div class="tip">后端定时任务关单（天）</div>
              </el-form-item>
            </div>
            <div class="form-footer">
              <el-button type="primary" :loading="saving" :disabled="!anyPaymentEnabled" @click="savePaymentSetting" class="save-btn">保存支付设置</el-button>
            </div>
          </el-form>
        </div>

        <!-- SEO设置 -->
        <div v-show="activeTab === 'seo'" class="setting-panel">
          <div class="panel-header">
            <div class="ph-icon">🔍</div>
            <div><h2>SEO 设置</h2><p>影响搜索引擎收录，建议认真填写</p></div>
          </div>
          <el-form ref="seoFormRef" :model="seoForm" :rules="seoRules" label-position="top" class="s-form">
            <el-form-item label="网站标题" prop="seoTitle">
              <el-input v-model="seoForm.seoTitle" placeholder="如: 天文器材商城-专业天文设备购买平台" maxlength="60" show-word-limit />
              <div class="tip">建议 50~60 个字符，包含核心关键词</div>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="seoForm.seoKeywords" type="textarea" :rows="2"
                        placeholder="多个关键词用英文逗号分隔，如: 天文望远镜,天文器材,星图识别" maxlength="200" show-word-limit />
            </el-form-item>
            <el-form-item label="网站描述">
              <el-input v-model="seoForm.seoDescription" type="textarea" :rows="3"
                        placeholder="简洁描述网站核心功能，建议 100~150 字符" maxlength="200" show-word-limit />
            </el-form-item>
            <div class="form-footer">
              <el-button type="primary" :loading="saving" @click="saveSeoSetting" class="save-btn">保存 SEO 设置</el-button>
            </div>
          </el-form>
        </div>

        <!-- 注册设置 -->
        <div v-show="activeTab === 'register'" class="setting-panel">
          <div class="panel-header">
            <div class="ph-icon">👤</div>
            <div><h2>注册设置</h2><p>控制用户注册方式与默认信息</p></div>
          </div>
          <el-form label-position="top" class="s-form">
            <div class="toggle-list">
              <div class="toggle-item">
                <div class="tl-left">
                  <div class="tl-title">开放用户注册</div>
                  <div class="tl-desc">关闭后仅管理员可创建账号</div>
                </div>
                <el-switch v-model="registerForm.registerEnabled" />
              </div>
              <template v-if="registerForm.registerEnabled">
                <div class="toggle-item">
                  <div class="tl-left">
                    <div class="tl-title">邮箱验证</div>
                    <div class="tl-desc">开启后注册需验证邮箱（需配置邮件服务）</div>
                  </div>
                  <el-switch v-model="registerForm.emailVerifyEnabled" />
                </div>
                <div class="toggle-item">
                  <div class="tl-left">
                    <div class="tl-title">仅限邀请注册</div>
                    <div class="tl-desc">开启后需要邀请码才能注册</div>
                  </div>
                  <el-switch v-model="registerForm.inviteOnly" />
                </div>
              </template>
            </div>
            <el-form-item label="新用户默认头像" style="margin-top:24px">
              <el-input v-model="registerForm.defaultAvatar" placeholder="默认头像图片 URL" />
              <div v-if="registerForm.defaultAvatar" class="avatar-preview">
                <img :src="registerForm.defaultAvatar" alt="头像预览" />
              </div>
            </el-form-item>
            <div class="form-footer">
              <el-button type="primary" :loading="saving" @click="saveRegisterSetting" class="save-btn">保存注册设置</el-button>
            </div>
          </el-form>
        </div>

        <!-- 维护模式 -->
        <div v-show="activeTab === 'maintenance'" class="setting-panel">
          <div class="panel-header">
            <div class="ph-icon">🛠️</div>
            <div><h2>维护模式</h2><p>开启后普通用户将看到维护提示页面</p></div>
          </div>
          <div class="status-card" :class="maintenanceForm.maintenanceMode ? 'status-on' : 'status-off'">
            <div class="sc-left">
              <div class="sc-dot"></div>
              <div>
                <div class="sc-title">{{ maintenanceForm.maintenanceMode ? '维护模式已开启' : '商城运行正常' }}</div>
                <div class="sc-desc">{{ maintenanceForm.maintenanceMode ? '普通用户访问前台将看到维护提示，管理员不受影响' : '所有用户可以正常访问商城前台' }}</div>
              </div>
            </div>
            <el-switch v-model="maintenanceForm.maintenanceMode" :active-color="'#ef4444'" />
          </div>
          <template v-if="maintenanceForm.maintenanceMode">
            <el-form label-position="top" class="s-form" style="margin-top:20px">
              <el-form-item label="维护提示语">
                <el-input v-model="maintenanceForm.maintenanceMessage" type="textarea" :rows="3"
                          placeholder="显示给用户的维护提示内容" maxlength="200" show-word-limit />
              </el-form-item>
              <el-form-item label="预计恢复时间">
                <el-input v-model="maintenanceForm.maintenanceEndTime" placeholder="如: 2026-03-10 08:00（可选）" style="width:300px" />
              </el-form-item>
            </el-form>
          </template>
          <div class="form-footer" style="margin-top:24px">
            <el-button :type="maintenanceForm.maintenanceMode ? 'danger' : 'primary'"
                       :loading="saving" @click="saveMaintenanceSetting" class="save-btn">
              {{ maintenanceForm.maintenanceMode ? '确认开启维护模式' : '保存维护设置' }}
            </el-button>
          </div>
        </div>

      </main>
    </div>

    <!-- 二次确认弹窗 -->
    <el-dialog v-model="maintenanceConfirmVisible" title="确认开启维护模式" width="420px" align-center append-to-body>
      <div class="confirm-wrap">
        <div class="confirm-emoji">⚠️</div>
        <p>开启后普通用户将<strong>无法浏览商品、下单和支付</strong>，管理员后台不受影响。</p>
        <p style="color:#9ca3af">请确认已提前通知用户，是否继续？</p>
      </div>
      <template #footer>
        <el-button @click="maintenanceConfirmVisible = false">取消</el-button>
        <el-button type="danger" :loading="saving" @click="confirmEnableMaintenance">确认开启</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import {
  getBasicSetting,       updateBasicSetting,
  getFreightSetting,     updateFreightSetting,
  getPaymentSetting,     updatePaymentSetting,
  getSeoSetting,         updateSeoSetting,
  getRegisterSetting,    updateRegisterSetting,
  getMaintenanceSetting, updateMaintenanceSetting
} from '@/api/admin/setting'

const activeTab  = ref('basic')
const loading    = ref(false)
const menuItems  = [
  { key: 'basic',       label: '基础设置' },
  { key: 'freight',     label: '运费设置' },
  { key: 'payment',     label: '支付设置' },
  { key: 'seo',         label: 'SEO 设置' },
  { key: 'register',    label: '注册设置' },
  { key: 'maintenance', label: '维护模式'  },
]
const navIcons = { basic:'🏪', freight:'🚚', payment:'💳', seo:'🔍', register:'👤', maintenance:'🛠️' }
const saving    = ref(false)
const maintenanceConfirmVisible = ref(false)
const basicFormRef   = ref(null)
const freightFormRef = ref(null)
const paymentFormRef = ref(null)
const seoFormRef     = ref(null)

const basicForm       = reactive({ mallName:'', mallLogo:'', mallDesc:'', contactPhone:'', contactEmail:'', contactQq:'', icpNumber:'', copyright:'' })
const freightForm     = reactive({ defaultFreight:10, freeFreightEnabled:true, freeFreightAmount:99 })
const paymentForm     = reactive({ alipayEnabled:true, wechatEnabled:true, balanceEnabled:true, payTimeoutMinutes:15, autoConfirmDays:7, autoCloseDays:3 })
const seoForm         = reactive({ seoTitle:'', seoKeywords:'', seoDescription:'' })
const registerForm    = reactive({ registerEnabled:true, emailVerifyEnabled:false, inviteOnly:false, defaultAvatar:'' })
const maintenanceForm = reactive({ maintenanceMode:false, maintenanceMessage:'系统维护中，请稍后再访问...', maintenanceEndTime:'' })

const basicRules    = { mallName: [{ required:true, message:'商城名称不能为空', trigger:'blur' }] }
const freightRules  = { defaultFreight: [{ required:true, message:'请填写默认运费', trigger:'blur' }] }
const paymentRules  = {
  payTimeoutMinutes: [{ required:true, message:'请填写支付超时时间', trigger:'blur' }],
  autoConfirmDays:   [{ required:true, message:'请填写自动确认天数', trigger:'blur' }],
  autoCloseDays:     [{ required:true, message:'请填写自动关闭天数', trigger:'blur' }]
}
const seoRules = { seoTitle: [{ required:true, message:'网站标题不能为空', trigger:'blur' }] }

const anyPaymentEnabled = computed(() => paymentForm.alipayEnabled || paymentForm.wechatEnabled || paymentForm.balanceEnabled)

const handleMenuSelect = (key) => { activeTab.value = key; loadCurrentTab(key) }

onMounted(() => loadCurrentTab('basic'))

const loadCurrentTab = async (tab) => {
  loading.value = true
  try {
    switch (tab) {
      case 'basic':       { const r = await getBasicSetting();       Object.assign(basicForm, r.data);       break }
      case 'freight':     { const r = await getFreightSetting();     Object.assign(freightForm, r.data);     break }
      case 'payment':     { const r = await getPaymentSetting();     Object.assign(paymentForm, r.data);     break }
      case 'seo':         { const r = await getSeoSetting();         Object.assign(seoForm, r.data);         break }
      case 'register':    { const r = await getRegisterSetting();    Object.assign(registerForm, r.data);    break }
      case 'maintenance': { const r = await getMaintenanceSetting(); Object.assign(maintenanceForm, r.data); break }
    }
  } catch { ElMessage.error('加载设置失败，请刷新重试') }
  finally  { loading.value = false }
}

const saveBasicSetting = async () => {
  await basicFormRef.value.validate(); saving.value = true
  try { await updateBasicSetting({ ...basicForm }); ElMessage.success('基础设置保存成功') }
  catch (e) { ElMessage.error(e.message || '保存失败') } finally { saving.value = false }
}
const saveFreightSetting = async () => {
  await freightFormRef.value.validate(); saving.value = true
  try { await updateFreightSetting({ ...freightForm }); ElMessage.success('运费设置保存成功') }
  catch (e) { ElMessage.error(e.message || '保存失败') } finally { saving.value = false }
}
const savePaymentSetting = async () => {
  if (!anyPaymentEnabled.value) { ElMessage.warning('至少需要开启一种支付方式'); return }
  await paymentFormRef.value.validate(); saving.value = true
  try { await updatePaymentSetting({ ...paymentForm }); ElMessage.success('支付设置保存成功') }
  catch (e) { ElMessage.error(e.message || '保存失败') } finally { saving.value = false }
}
const saveSeoSetting = async () => {
  await seoFormRef.value.validate(); saving.value = true
  try { await updateSeoSetting({ ...seoForm }); ElMessage.success('SEO 设置保存成功') }
  catch (e) { ElMessage.error(e.message || '保存失败') } finally { saving.value = false }
}
const saveRegisterSetting = async () => {
  saving.value = true
  try { await updateRegisterSetting({ ...registerForm }); ElMessage.success('注册设置保存成功') }
  catch (e) { ElMessage.error(e.message || '保存失败') } finally { saving.value = false }
}
const saveMaintenanceSetting = () => { maintenanceForm.maintenanceMode ? (maintenanceConfirmVisible.value = true) : doSaveMaintenance() }
const confirmEnableMaintenance = async () => { maintenanceConfirmVisible.value = false; await doSaveMaintenance() }
const doSaveMaintenance = async () => {
  saving.value = true
  try { await updateMaintenanceSetting({ ...maintenanceForm }); ElMessage.success(maintenanceForm.maintenanceMode ? '维护模式已开启' : '维护模式已关闭') }
  catch (e) { ElMessage.error(e.message || '保存失败') } finally { saving.value = false }
}
const onLogoError = (e) => { e.target.src = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' }
</script>

<style scoped>
/* ── 页面 ── */
.setting-page { padding: 28px 30px; min-height: 100%; background: #f4f6f9; }

/* ── 顶部 ── */
.page-hero { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.hero-left  { display:flex; align-items:center; gap:14px; }
.hero-icon  {
  width:48px; height:48px; border-radius:13px; display:flex; align-items:center; justify-content:center;
  font-size:24px; background:linear-gradient(135deg,#3b5bdb,#7950f2);
  box-shadow:0 4px 12px rgba(99,102,241,.4);
}
.hero-title { margin:0 0 3px; font-size:20px; font-weight:700; color:#1e293b; }
.hero-sub   { margin:0; font-size:13px; color:#64748b; }
.hero-badge {
  display:flex; align-items:center; gap:7px; padding:6px 14px;
  background:#fff1f2; border:1px solid #fecdd3; border-radius:20px;
  font-size:12px; font-weight:600; color:#e11d48;
}
.badge-dot { width:7px; height:7px; border-radius:50%; background:#f43f5e; animation:blink 1.2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ── 布局 ── */
.setting-body { display:flex; gap:20px; align-items:flex-start; }

/* ── 左侧菜单 ── */
.setting-nav {
  width:190px; flex-shrink:0; background:#fff;
  border-radius:14px; padding:10px 8px;
  box-shadow:0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.04);
}
.nav-item {
  display:flex; align-items:center; gap:9px;
  padding:10px 11px; border-radius:9px;
  cursor:pointer; transition:all .15s;
  font-size:13.5px; color:#475569; user-select:none;
  position:relative;
}
.nav-item:hover { background:#f8fafc; color:#1e293b; }
.nav-item.active { background:#eef2ff; color:#3b5bdb; font-weight:600; }
.nav-item.active::before {
  content:''; position:absolute; left:0; top:50%;
  transform:translateY(-50%); width:3px; height:18px;
  background:#3b5bdb; border-radius:0 3px 3px 0;
}
.nav-icon  { font-size:16px; width:22px; text-align:center; }
.nav-label { flex:1; }
.nav-danger-dot {
  width:7px; height:7px; border-radius:50%;
  background:#f43f5e; animation:blink 1.2s infinite;
}

/* ── 右侧面板 ── */
.setting-main { flex:1; min-width:0; }
.setting-panel {
  background:#fff; border-radius:14px; padding:28px 32px;
  box-shadow:0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.04);
}

/* ── 面板标题 ── */
.panel-header {
  display:flex; align-items:center; gap:14px;
  padding-bottom:18px; margin-bottom:24px;
  border-bottom:1.5px solid #f1f5f9;
}
.ph-icon {
  width:42px; height:42px; border-radius:11px; background:#f0f4ff;
  display:flex; align-items:center; justify-content:center;
  font-size:20px; flex-shrink:0;
}
.panel-header h2 { margin:0 0 3px; font-size:17px; font-weight:700; color:#1e293b; }
.panel-header p  { margin:0; font-size:13px; color:#94a3b8; }

/* ── 字段分组标题 ── */
.field-section {
  font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:.1em; color:#94a3b8;
  margin:22px 0 14px; padding-bottom:8px;
  border-bottom:1px dashed #e2e8f0;
}

/* ── 栅格行 ── */
.form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:0 22px; }
.form-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0 18px; }

/* ── 表单基础 ── */
.s-form :deep(.el-form-item__label) { font-size:13px; font-weight:600; color:#334155; padding-bottom:5px; }
.s-form :deep(.el-input__wrapper),
.s-form :deep(.el-textarea__inner)  { border-radius:8px; box-shadow:0 0 0 1.5px #e2e8f0; transition:box-shadow .15s; background:#fafbfc; }
.s-form :deep(.el-input__wrapper:hover),
.s-form :deep(.el-textarea__inner:hover)   { box-shadow:0 0 0 1.5px #a5b4fc; }
.s-form :deep(.el-input__wrapper.is-focus),
.s-form :deep(.el-textarea__inner:focus)   { box-shadow:0 0 0 2px #3b5bdb !important; background:#fff; }

.tip { font-size:12px; color:#94a3b8; margin-top:4px; line-height:1.5; }
.input-with-unit { display:flex; align-items:center; gap:8px; }
.unit-tag { font-size:13px; color:#64748b; white-space:nowrap; }

/* ── Logo / 头像预览 ── */
.logo-preview {
  display:flex; align-items:center; gap:12px;
  padding:10px 14px; background:#f8fafc; border-radius:8px;
  margin-bottom:2px; border:1px solid #e2e8f0;
}
.logo-preview img { height:36px; max-width:140px; object-fit:contain; border-radius:4px; }
.logo-preview span { font-size:12px; color:#94a3b8; }
.avatar-preview { margin-top:10px; }
.avatar-preview img { width:60px; height:60px; border-radius:50%; object-fit:cover; border:3px solid #e2e8f0; }

/* ── 运费 toggle-row ── */
.toggle-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:13px 15px; border-radius:9px;
  border:1.5px solid #e2e8f0; background:#fafbfc;
  transition:border-color .15s, background .15s;
}
.toggle-name { font-size:14px; font-weight:600; color:#1e293b; }
.toggle-desc { font-size:12px; color:#94a3b8; margin-top:2px; }

/* ── 支付方式卡片 ── */
.pay-grid { display:flex; gap:12px; margin-bottom:6px; }
.pay-card {
  flex:1; display:flex; align-items:center; gap:12px;
  padding:15px 16px; border-radius:11px;
  border:1.5px solid #e2e8f0; background:#fafbfc;
  transition:all .15s;
}
.pay-card.on { border-color:#c7d2fe; background:#f0f4ff; }
.pay-icon {
  width:36px; height:36px; border-radius:9px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:800; color:#fff;
}
.pay-icon.ali  { background:linear-gradient(135deg,#1677ff,#38bdf8); }
.pay-icon.wx   { background:linear-gradient(135deg,#07c160,#34d399); }
.pay-icon.bal  { background:linear-gradient(135deg,#f59e0b,#fb923c); }
.pay-info { flex:1; }
.pay-name  { font-size:13.5px; font-weight:600; color:#1e293b; }
.pay-state { font-size:12px; color:#94a3b8; margin-top:2px; }

.alert-bar {
  padding:9px 14px; background:#fff1f2; border:1px solid #fecdd3;
  border-radius:8px; font-size:13px; color:#e11d48; margin-bottom:6px;
}

/* ── 注册设置 toggle 列表 ── */
.toggle-list { border:1.5px solid #e2e8f0; border-radius:11px; overflow:hidden; }
.toggle-item {
  display:flex; align-items:center; justify-content:space-between;
  padding:15px 18px; background:#fff; border-bottom:1px solid #f1f5f9;
  transition:background .12s;
}
.toggle-item:last-child { border-bottom:none; }
.toggle-item:hover { background:#f8fafc; }
.tl-title { font-size:14px; font-weight:600; color:#1e293b; }
.tl-desc  { font-size:12px; color:#94a3b8; margin-top:3px; }

/* ── 维护模式状态卡 ── */
.status-card {
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 22px; border-radius:11px; border:1.5px solid; transition:all .25s;
}
.status-off { background:#f0fdf4; border-color:#86efac; }
.status-on  { background:#fff1f2; border-color:#fecdd3; }
.sc-left { display:flex; align-items:center; gap:13px; }
.sc-dot  { width:11px; height:11px; border-radius:50%; flex-shrink:0; }
.status-off .sc-dot { background:#22c55e; }
.status-on  .sc-dot { background:#f43f5e; animation:blink 1.2s infinite; }
.sc-title { font-size:14px; font-weight:700; color:#1e293b; }
.sc-desc  { font-size:12px; color:#64748b; margin-top:3px; }

/* ── 保存按钮区 ── */
.form-footer {
  padding-top:22px; margin-top:6px;
  border-top:1.5px solid #f1f5f9;
}
.save-btn {
  padding:9px 26px; border-radius:8px;
  font-weight:600; font-size:13.5px; letter-spacing:.01em;
}

/* ── 弹窗确认 ── */
.confirm-wrap { text-align:center; padding:6px 0 2px; }
.confirm-emoji { font-size:36px; margin-bottom:10px; }
.confirm-wrap p { margin:6px 0; font-size:14px; color:#475569; line-height:1.7; }

/* ── 响应式 ── */
@media (max-width:860px) {
  .form-row-2, .form-row-3 { grid-template-columns:1fr; }
  .pay-grid { flex-direction:column; }
}
</style>