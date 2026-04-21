<template>
  <div class="ns-page">
    <!-- 编辑级顶部 · 与首页 Home.vue 呼应 -->
    <div class="ns-hero">
      <div class="ns-hero__inner">
        <div class="kicker">— PREFERENCES</div>
        <h1 class="title">通知设置</h1>
        <p class="sub">Choose What Reaches You · 只接收你真正关心的消息</p>
      </div>
      <div class="ns-hero__rule"></div>
    </div>

    <!-- 主体 -->
    <div class="ns-main" v-loading="loading">
      <div
          v-for="(group, moduleName) in groupedSettings"
          :key="moduleName"
          class="mod-block"
      >
        <!-- 模块标题 -->
        <div class="mod-head">
          <div class="mod-head__icon" :class="`icon-${group[0].module}`">
            <el-icon><component :is="getModuleIcon(group[0].module)" /></el-icon>
          </div>
          <div class="mod-head__text">
            <div class="mod-head__name">{{ moduleName }}</div>
            <div class="mod-head__en">{{ moduleEn(group[0].module) }}</div>
          </div>
          <div class="mod-head__rule"></div>
          <div class="mod-head__count">
            <span class="c-num">{{ enabledCount(group) }}</span>
            <span class="c-sep">/</span>
            <span class="c-total">{{ group.length }}</span>
          </div>
        </div>

        <!-- 设置网格 -->
        <div class="mod-grid">
          <div
              v-for="setting in group"
              :key="`${setting.module}-${setting.type}`"
              class="s-cell"
              :class="{ 'is-on': setting.enabled === 1 }"
          >
            <div class="s-cell__label">{{ setting.typeName }}</div>
            <el-switch
                v-model="setting.enabled"
                :active-value="1"
                :inactive-value="0"
                @change="handleChange(setting)"
                class="s-switch"
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && Object.keys(groupedSettings).length === 0" class="ns-empty">
        <div class="empty-line">— 暂无可配置项 —</div>
        <div class="empty-sub">NOTHING TO TUNE</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ShoppingCart,
  ChatDotRound,
  Reading,
  Location,
  StarFilled,
  Cpu,
  Bell
} from '@element-plus/icons-vue'
import { getNotificationSettings, updateNotificationSettings } from '@/api/notification'

const loading = ref(false)
const settings = ref([])

const moduleIcons = {
  mall: markRaw(ShoppingCart),
  forum: markRaw(ChatDotRound),
  course: markRaw(Reading),
  location: markRaw(Location),
  recommend: markRaw(StarFilled),
  ai: markRaw(Cpu),
  system: markRaw(Bell)
}

const moduleEnMap = {
  mall: 'MALL / COMMERCE',
  forum: 'FORUM / COMMUNITY',
  course: 'COURSES / ACADEMY',
  location: 'OBSERVATORY / LOCATION',
  recommend: 'RECOMMEND / FOR YOU',
  ai: 'AI / VISION',
  system: 'SYSTEM / OFFICIAL'
}

const getModuleIcon = (module) => moduleIcons[module] || Bell
const moduleEn = (m) => moduleEnMap[m] || 'NOTICE'

const enabledCount = (group) =>
    group.filter(s => Number(s.enabled) === 1).length

const groupedSettings = computed(() => {
  const groups = {}
  settings.value.forEach(setting => {
    const moduleName = setting.moduleName
    if (!groups[moduleName]) groups[moduleName] = []
    groups[moduleName].push(setting)
  })
  return groups
})

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await getNotificationSettings()
    settings.value = res.data
  } catch (error) {
    ElMessage.error('获取通知设置失败')
  } finally {
    loading.value = false
  }
}

const handleChange = async (setting) => {
  try {
    await updateNotificationSettings({
      module: setting.module,
      type: setting.type,
      enabled: setting.enabled
    })
    ElMessage.success('已保存')
  } catch (error) {
    ElMessage.error('保存失败')
    setting.enabled = setting.enabled === 1 ? 0 : 1
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style lang="scss" scoped>
$bg-0:#000;
$bg-1:#070709;
$bg-2:#0e0e12;
$bg-3:#14141a;
$line:rgba(255,255,255,0.10);
$line-2:rgba(255,255,255,0.18);
$tx-1:#f4f4f4;
$tx-2:rgba(255,255,255,0.72);
$tx-3:rgba(255,255,255,0.45);
$tx-4:rgba(255,255,255,0.25);
$accent:#c7a572;
$serif:'Cormorant Garamond','Playfair Display','Noto Serif SC','Songti SC','宋体',serif;
$mono:'SF Mono','JetBrains Mono','Menlo',monospace;

.ns-page {
  min-height: 100vh;
  background: $bg-0;
  color: $tx-1;
  padding: 0 0 120px;
}

// ── Hero ───────────────────────────────────────────
.ns-hero {
  position: relative;
  padding: 110px 40px 40px;
  max-width: 1240px;
  margin: 0 auto;

  &__inner {
    max-width: 820px;
    .kicker {
      font-family: $mono;
      font-size: 11px;
      letter-spacing: 3px;
      color: $accent;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .title {
      font-family: $serif;
      font-weight: 500;
      font-size: 56px;
      letter-spacing: 6px;
      color: $tx-1;
      margin: 0 0 16px;
      line-height: 1.05;
    }
    .sub {
      font-family: $serif;
      font-style: italic;
      font-size: 17px;
      letter-spacing: 1.2px;
      color: $tx-3;
      margin: 0;
    }
  }
  &__rule {
    margin-top: 36px;
    width: 72px;
    height: 1px;
    background: $accent;
  }
}

// ── 主体 ───────────────────────────────────────────
.ns-main {
  max-width: 1240px;
  margin: 0 auto;
  padding: 20px 40px 0;
}

.mod-block {
  margin-top: 56px;
  &:first-child { margin-top: 12px; }
}

// 模块头
.mod-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;

  &__icon {
    width: 44px; height: 44px;
    border: 1px solid $line-2;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: $tx-2;
    font-size: 18px;
    background: $bg-1;
    flex-shrink: 0;
  }
  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__name {
    font-family: $serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: $tx-1;
    font-weight: 500;
  }
  &__en {
    font-family: $mono;
    font-size: 10.5px;
    letter-spacing: 2px;
    color: $tx-4;
    text-transform: uppercase;
  }
  &__rule {
    flex: 1;
    height: 1px;
    background: $line;
  }
  &__count {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    font-family: $mono;
    font-size: 13px;
    letter-spacing: 1px;
    color: $tx-3;
    .c-num   { color: $accent; font-size: 16px; font-weight: 600; }
    .c-sep   { color: $tx-4; }
    .c-total { color: $tx-3; }
  }
}

// 模块分类 accent 着色
.icon-mall      { color: #9cc4ff !important; border-color: rgba(156,196,255,0.3) !important; }
.icon-forum     { color: #a4e2b8 !important; border-color: rgba(164,226,184,0.3) !important; }
.icon-course    { color: #ffb3b3 !important; border-color: rgba(255,179,179,0.3) !important; }
.icon-location  { color: $tx-2 !important; }
.icon-recommend { color: $accent !important; border-color: rgba(199,165,114,0.35) !important; }
.icon-ai        { color: #c6a8ff !important; border-color: rgba(198,168,255,0.3) !important; }
.icon-system    { color: $accent !important; border-color: rgba(199,165,114,0.35) !important; }

// 设置网格
.mod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.s-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  background: $bg-1;
  border: 1px solid $line;
  transition: all 0.25s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: transparent;
    transition: background 0.25s ease;
  }
  &:hover {
    background: $bg-2;
    border-color: $line-2;
  }
  &.is-on {
    &::before { background: $accent; }
  }

  &__label {
    font-family: $serif;
    font-size: 15px;
    letter-spacing: 0.8px;
    color: $tx-1;
  }
}

// Switch 视觉 —— 关 = 灰线；开 = 金色
:deep(.s-switch) {
  --el-switch-on-color: #{$accent};
  --el-switch-off-color: rgba(255,255,255,0.16);
  .el-switch__core {
    border-color: transparent;
    height: 20px;
  }
}

// 空状态
.ns-empty {
  padding: 120px 40px;
  text-align: center;
  .empty-line {
    font-family: $serif;
    font-style: italic;
    font-size: 22px;
    letter-spacing: 3px;
    color: $tx-3;
    margin-bottom: 10px;
  }
  .empty-sub {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 2px;
    color: $tx-4;
  }
}

// ── 响应式 ─────────────────────────────────────────
@media (max-width: 768px) {
  .ns-hero {
    padding: 90px 24px 24px;
    &__inner .title { font-size: 40px; letter-spacing: 4px; }
  }
  .ns-main { padding: 16px 24px 0; }
  .mod-grid { grid-template-columns: 1fr; }
  .mod-head__en { display: none; }
}
</style>
