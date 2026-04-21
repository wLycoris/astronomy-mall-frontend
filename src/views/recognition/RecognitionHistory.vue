<template>
  <div class="rh" :class="{ 'rh--embedded': isEmbedded }">
    <!-- painterly sky + stars + paper grain -->
    <template v-if="!isEmbedded">
      <div class="sky"></div>
      <div class="stars"></div>
      <div class="grain"></div>
    </template>

    <!-- topbar -->
    <header v-if="!isEmbedded" class="topbar">
      <div class="crumbs">
        <span class="crumb" @click="$router.push('/home')">首页</span>
        <span class="sep">·</span>
        <span class="crumb" @click="$router.push('/recognition')">星图识别</span>
        <span class="sep">·</span>
        <span class="crumb crumb--on">历史</span>
      </div>
      <button class="quiet-btn" @click="$router.push('/recognition')">
        <span class="qb-mark">✦</span>
        <span>识别新星图</span>
      </button>
    </header>

    <!-- hero header -->
    <section class="hero">
      <div class="hero__kicker"><em>A quiet ledger of moonlit skies</em></div>
      <h1 class="hero__title">识别 · 历史</h1>
      <p class="hero__desc">
        你在月光下留下的每一帧星空，都在这里静静归档——可重查、可追溯、可分享。
      </p>
      <button v-if="isEmbedded" class="quiet-btn hero__action" @click="$router.push('/recognition')">
        <span class="qb-mark">✦</span>
        <span>识别新星图</span>
      </button>
      <div class="hero__rule">
        <span class="dot"></span>
        <span class="line"></span>
        <span class="glyph">☾</span>
        <span class="line"></span>
        <span class="dot"></span>
      </div>
    </section>

    <main class="main">
      <!-- stats -->
      <section class="stats" v-loading="statsLoading">
        <div class="stat">
          <div class="stat__k">总识别次数</div>
          <div class="stat__v">{{ stats.total ?? '--' }}</div>
          <div class="stat__en"><em>total</em></div>
        </div>
        <div class="stat">
          <div class="stat__k">识别成功</div>
          <div class="stat__v">{{ stats.successCount ?? '--' }}</div>
          <div class="stat__en"><em>resolved</em></div>
        </div>
        <div class="stat">
          <div class="stat__k">成功率</div>
          <div class="stat__v">{{ stats.total > 0 ? stats.successRate + '%' : '--' }}</div>
          <div class="stat__en"><em>rate</em></div>
        </div>
        <div class="stat">
          <div class="stat__k">识别中</div>
          <div class="stat__v">{{ stats.pendingCount ?? '--' }}</div>
          <div class="stat__en"><em>in&nbsp;progress</em></div>
        </div>
      </section>

      <!-- tabs -->
      <section class="tabs">
        <div
            v-for="tab in statusTabs"
            :key="tab.value === null ? 'all' : tab.value"
            class="tab"
            :class="{ 'tab--on': activeStatus === tab.value }"
            @click="handleTabChange(tab.value)"
        >
          <span class="tab__label">{{ tab.label }}</span>
          <span class="tab__count">{{ tab.count }}</span>
        </div>
      </section>

      <!-- list -->
      <section v-loading="listLoading" class="list">
        <!-- empty -->
        <div v-if="!listLoading && records.length === 0" class="empty">
          <div class="empty__orb">
            <div class="empty__halo"></div>
            <div class="empty__disc"></div>
          </div>
          <div class="empty__title">
            {{ activeStatus === null ? '月亮还很寂静' : '这个分类暂无记录' }}
          </div>
          <div class="empty__desc">
            {{ activeStatus === null
                ? '上传一张你的星空照片，月光会带你找到它的坐标。'
                : '切换其他筛选条件试试。' }}
          </div>
          <button
              v-if="activeStatus === null"
              class="submit"
              @click="$router.push('/recognition')"
          >
            <span class="submit__en"><em>upload · first · plate</em></span>
            <span class="submit__cn">识别第一张星图</span>
          </button>
        </div>

        <template v-else>
          <div v-for="item in records" :key="item.id" class="row" :class="'row--' + item.status">
            <!-- orb thumb -->
            <div class="row__orb">
              <div class="ro-halo"></div>
              <div class="ro-disc"></div>
              <div v-if="item.status === 0" class="ro-ring">
                <svg viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="22" fill="none"
                          stroke="rgba(247,236,210,0.85)"
                          stroke-width="1.4"
                          stroke-dasharray="12 140"
                          stroke-linecap="round"/>
                </svg>
              </div>
              <div v-else-if="item.status === 1" class="ro-tick">✓</div>
              <div v-else-if="item.status === 2" class="ro-cross">×</div>
              <div class="ro-id">#{{ String(item.id).padStart(4, '0') }}</div>
            </div>

            <!-- body -->
            <div class="row__body">
              <div class="row__meta">
                <span class="pill" :class="'pill--' + item.status">
                  <span class="pill__dot"></span>
                  {{ getStatusText(item.status) }}
                </span>
                <span class="row__time"><em>{{ item.createTime }}</em></span>
              </div>

              <div class="row__desc">
                <template v-if="item.status === 1 && item.mainObjects && item.mainObjects.length > 0">
                  <span
                      v-for="(obj, idx) in item.mainObjects.slice(0, 3)"
                      :key="idx"
                      class="obj"
                  >{{ obj }}</span>
                  <span v-if="item.mainObjects.length > 3" class="obj-more">
                    +{{ item.mainObjects.length - 3 }} 个天体
                  </span>
                </template>
                <template v-else-if="item.status === 2">
                  <span class="fail-txt">{{ item.failReason || '这张星图没能解算出来，换一张试试？' }}</span>
                </template>
                <template v-else>
                  <span class="pending-txt">
                    <span class="pulse"></span>
                    月光正在阅读你的星图
                  </span>
                </template>
              </div>

              <div class="row__foot">
                <span class="rf-k">编号</span>
                <span class="rf-v">#{{ String(item.id).padStart(4, '0') }}</span>
                <span class="rf-sep">·</span>
                <span class="rf-k">状态</span>
                <span class="rf-v" :class="'rf-v--' + item.status">
                  {{ ({0: '识别中', 1: '已完成', 2: '已失败'})[item.status] }}
                </span>
              </div>
            </div>

            <!-- actions -->
            <div class="row__act">
              <span
                  v-if="item.status === 1"
                  class="link link--on"
                  @click="viewResult(item.id)"
              >查看档案 →</span>
              <span
                  v-else-if="item.status === 0"
                  class="link"
                  @click="viewWaiting(item.id)"
              >查看进度 →</span>
              <span
                  v-else-if="item.status === 2"
                  class="link"
                  @click="$router.push('/recognition')"
              >重新识别 →</span>

              <span class="link link--danger" @click="handleDelete(item)">删除</span>
            </div>
          </div>

          <!-- pagination -->
          <div class="pagi">
            <el-pagination
                v-model:current-page="pageNum"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 30]"
                layout="total, sizes, prev, pager, next"
                background
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
            />
          </div>
        </template>
      </section>
    </main>

    <!-- delete confirm -->
    <el-dialog
        v-model="deleteVisible"
        width="440px"
        :close-on-click-modal="false"
        class="rh-dialog"
        :show-close="false"
    >
      <template #header>
        <div class="dlg-h">
          <div class="dlg-h__en"><em>confirm · deletion</em></div>
          <div class="dlg-h__cn">删除这份档案</div>
        </div>
      </template>
      <div class="dlg-b">
        <p>确定要删除这条识别记录吗？</p>
        <p class="dlg-sub">此操作不可恢复，月亮也找不回它了。</p>
      </div>
      <template #footer>
        <span class="link" @click="deleteVisible = false">取消</span>
        <span class="link link--danger" :class="{ 'is-loading': deleteLoading }" @click="confirmDelete">
          确认删除
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getRecognitionHistory,
  getRecognitionStats,
  deleteRecognition
} from '@/api/recognition.js'

const router = useRouter()
const route = useRoute()
const isEmbedded = computed(() => route.path.startsWith('/user/'))

const stats = ref({ total: 0, successCount: 0, failCount: 0, pendingCount: 0, successRate: 0 })
const statsLoading = ref(false)

const fetchStats = async () => {
  try {
    statsLoading.value = true
    const res = await getRecognitionStats()
    if (res.code === 200 && res.data) stats.value = res.data
  } catch (e) {
    console.error('[RecognitionHistory] 获取统计失败', e)
  } finally {
    statsLoading.value = false
  }
}

const activeStatus = ref(null)
const statusTabs = computed(() => [
  { label: '全部',     value: null, count: stats.value.total },
  { label: '识别中',   value: 0,    count: stats.value.pendingCount },
  { label: '识别成功', value: 1,    count: stats.value.successCount },
  { label: '识别失败', value: 2,    count: stats.value.failCount }
])

const handleTabChange = (status) => {
  activeStatus.value = status
  pageNum.value = 1
  fetchHistory()
}

const records = ref([])
const listLoading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchHistory = async () => {
  try {
    listLoading.value = true
    const res = await getRecognitionHistory(pageNum.value, pageSize.value, activeStatus.value)
    if (res.code === 200 && res.data) {
      records.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    console.error('[RecognitionHistory] 获取历史列表失败', e)
    ElMessage.error('加载历史记录失败')
  } finally {
    listLoading.value = false
  }
}

const handleSizeChange = () => { pageNum.value = 1; fetchHistory() }
const handlePageChange = () => { fetchHistory() }

const viewResult = (id) => router.push(`/recognition/result?id=${id}`)
const viewWaiting = (id) => router.push(`/recognition/waiting?id=${id}`)

const deleteVisible = ref(false)
const deleteLoading = ref(false)
const deleteTarget = ref(null)

const handleDelete = (item) => {
  deleteTarget.value = item
  deleteVisible.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  try {
    deleteLoading.value = true
    const res = await deleteRecognition(deleteTarget.value.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      deleteVisible.value = false
      deleteTarget.value = null
      await Promise.all([fetchHistory(), fetchStats()])
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    console.error('[RecognitionHistory] 删除失败', e)
    ElMessage.error('删除失败，请重试')
  } finally {
    deleteLoading.value = false
  }
}

const getStatusText = (status) => ({ 0: '识别中', 1: '识别成功', 2: '识别失败' }[status] ?? '未知')

onMounted(() => {
  fetchStats()
  fetchHistory()
})
</script>

<style lang="scss" scoped>
/* ── palette (shared with StarRecognition/Waiting) ─────────────────── */
$moon:      #f7ecd2;
$moon-soft: #ede2c3;
$cream:     #f3e9cf;
$cream-dim: rgba(243,233,207,0.72);
$cream-low: rgba(243,233,207,0.42);
$cream-xlow:rgba(243,233,207,0.22);

$sky-top: #1a2547;
$sky-mid: #0e1731;
$sky-bot: #070b1d;

$violet:  #9a86d1;
$rose:    #d99db4;
$bloom:   #6b8ed6;
$petal:   #f2e4c7;

$ok:   #a6dcbc;
$warn: #e9b7b7;
$mid:  #b9c8e8;

$sans:  'Inter','PingFang SC','Microsoft YaHei','Hiragino Sans GB','Helvetica Neue',Arial,sans-serif;
$serif: 'Cormorant Garamond','Playfair Display',Georgia,'Songti SC',serif;

/* ── page base ─────────────────────────────────────────────────────── */
.rh {
  min-height: 100vh;
  position: relative;
  color: $cream;
  font-family: $sans;
  overflow-x: hidden;
  padding-bottom: 120px;
  background: $sky-bot;
}

/* painterly sky */
.sky {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(154,134,209,0.18), transparent 60%),
    radial-gradient(900px 520px at 85% 10%, rgba(217,157,180,0.10), transparent 60%),
    radial-gradient(1400px 900px at 50% 110%, rgba(107,142,214,0.14), transparent 70%),
    linear-gradient(180deg, $sky-top 0%, $sky-mid 45%, $sky-bot 100%);
}

.stars {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    radial-gradient(1.2px 1.2px at 18% 22%, rgba(255,255,255,0.85), transparent 55%),
    radial-gradient(1px 1px at 72% 18%, rgba(247,236,210,0.75), transparent 55%),
    radial-gradient(1px 1px at 34% 68%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(1.4px 1.4px at 88% 54%, rgba(185,200,232,0.7), transparent 55%),
    radial-gradient(1px 1px at 9% 82%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(1px 1px at 57% 88%, rgba(217,157,180,0.55), transparent 55%),
    radial-gradient(1.2px 1.2px at 44% 36%, rgba(255,255,255,0.4), transparent 55%),
    radial-gradient(1px 1px at 95% 86%, rgba(247,236,210,0.55), transparent 55%);
  background-size: 720px 720px, 940px 940px, 620px 620px, 1100px 1100px,
                   820px 820px, 1020px 1020px, 520px 520px, 1220px 1220px;
  opacity: .85;
  animation: twinkle 6.5s ease-in-out infinite alternate;
}
@keyframes twinkle {
  0%   { opacity: .55; }
  100% { opacity: .95; }
}

.grain {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  mix-blend-mode: overlay;
  opacity: .22;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.82  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

/* ── topbar ───────────────────────────────────────────────────────── */
.topbar {
  position: relative; z-index: 3;
  max-width: 1240px;
  margin: 0 auto;
  padding: 26px 40px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.crumbs {
  display: flex; align-items: center; gap: 10px;
  font-family: $serif;
  font-size: 14px;
  font-style: italic;
  letter-spacing: .6px;
  color: $cream-dim;
}
.crumb { cursor: pointer; transition: color .2s; &:hover { color: $moon; } }
.crumb--on { color: $moon; font-style: normal; font-weight: 500; }
.sep { color: $cream-xlow; }

.quiet-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid $cream-xlow;
  color: $cream-dim;
  font-family: $sans;
  font-size: 12.5px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .25s;
  border-radius: 999px;

  .qb-mark { color: $moon; font-size: 11px; }
  &:hover {
    color: $moon;
    border-color: $cream-low;
    background: rgba(247,236,210,0.04);
  }
}

/* ── hero ─────────────────────────────────────────────────────────── */
.hero {
  position: relative; z-index: 2;
  max-width: 1240px;
  margin: 0 auto;
  padding: 70px 40px 60px;
  text-align: center;

  &__kicker {
    font-family: $serif;
    font-style: italic;
    font-size: 15px;
    letter-spacing: 1.5px;
    color: $cream-dim;
    margin-bottom: 18px;
  }
  &__title {
    font-family: $serif;
    font-weight: 500;
    font-size: 74px;
    letter-spacing: 10px;
    color: $moon;
    margin: 0 0 22px;
    line-height: 1;
    text-shadow: 0 2px 30px rgba(247,236,210,0.2);
  }
  &__desc {
    font-family: $sans;
    font-size: 14px;
    letter-spacing: .8px;
    color: $cream-dim;
    margin: 0 auto;
    max-width: 620px;
    line-height: 1.8;
  }
  &__rule {
    margin-top: 36px;
    display: flex; align-items: center; justify-content: center;
    gap: 14px;
    .dot { width: 4px; height: 4px; border-radius: 50%; background: $cream-low; }
    .line { width: 80px; height: 1px; background: linear-gradient(90deg, transparent, $cream-xlow, transparent); }
    .glyph { font-family: $serif; font-size: 18px; color: $moon; }
  }
}

/* ── main ─────────────────────────────────────────────────────────── */
.main {
  position: relative; z-index: 2;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 40px;
}

/* stats */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-bottom: 52px;
  border-top: 1px solid $cream-xlow;
  border-bottom: 1px solid $cream-xlow;
}
.stat {
  position: relative;
  padding: 28px 32px 26px;
  border-right: 1px solid $cream-xlow;
  &:last-child { border-right: none; }

  &__k {
    font-family: $sans;
    font-size: 12px;
    letter-spacing: 2.2px;
    color: $cream-dim;
    margin-bottom: 16px;
  }
  &__v {
    font-family: $serif;
    font-weight: 500;
    font-size: 52px;
    line-height: 1;
    color: $moon;
    letter-spacing: 1px;
  }
  &__en {
    margin-top: 8px;
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    color: $cream-low;
    letter-spacing: 1px;
  }
}

/* tabs */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  border-bottom: 1px solid $cream-xlow;
}
.tab {
  position: relative;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 22px 14px 4px;
  margin-right: 18px;
  cursor: pointer;
  transition: all .2s;

  &__label {
    font-family: $serif;
    font-size: 18px;
    color: $cream-dim;
    letter-spacing: 1px;
  }
  &__count {
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    color: $cream-low;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0; right: 22px; bottom: -1px;
    height: 1px;
    background: transparent;
    transition: background .2s;
  }
  &:hover .tab__label { color: $moon; }

  &--on {
    .tab__label { color: $moon; }
    .tab__count { color: $moon-soft; }
    &::after { background: $moon; }
  }
}

/* list */
.list { min-height: 200px; }

/* empty */
.empty {
  text-align: center;
  padding: 100px 40px 80px;

  &__orb {
    position: relative;
    width: 120px; height: 120px;
    margin: 0 auto 28px;
  }
  &__halo {
    position: absolute; inset: -16px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(247,236,210,0.22), transparent 70%);
    animation: breath 5s ease-in-out infinite alternate;
  }
  &__disc {
    position: absolute; inset: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 32%, #fff7e0, $moon 55%, $moon-soft 100%);
    box-shadow: 0 0 30px rgba(247,236,210,0.25);
    opacity: .75;
  }

  &__title {
    font-family: $serif;
    font-size: 26px;
    letter-spacing: 4px;
    color: $moon;
    margin-bottom: 12px;
  }
  &__desc {
    font-family: $sans;
    font-size: 13.5px;
    color: $cream-dim;
    letter-spacing: .8px;
    margin-bottom: 28px;
  }
}
@keyframes breath {
  0%   { opacity: .55; transform: scale(.96); }
  100% { opacity: .95; transform: scale(1.04); }
}

/* rows */
.row {
  display: flex; align-items: center; gap: 26px;
  padding: 22px 4px;
  border-bottom: 1px solid $cream-xlow;
  transition: background .25s;

  &:hover { background: rgba(247,236,210,0.03); }

  &__orb {
    position: relative;
    width: 78px; height: 78px;
    flex-shrink: 0;
  }
  .ro-halo {
    position: absolute; inset: -6px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(247,236,210,0.18), transparent 70%);
  }
  .ro-disc {
    position: absolute; inset: 8px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 32%, #fff7e0, $moon 55%, $moon-soft 100%);
    box-shadow: 0 0 18px rgba(247,236,210,0.2);
  }
  .ro-ring {
    position: absolute; inset: 0;
    animation: spin 1.6s linear infinite;
    svg { width: 100%; height: 100%; }
  }
  .ro-tick, .ro-cross {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: $serif;
    font-size: 34px;
    color: $sky-mid;
    font-weight: 500;
    text-shadow: 0 0 6px rgba(247,236,210,0.3);
  }
  .ro-cross { color: #6b1f2e; }
  .ro-id {
    position: absolute; left: 0; right: 0; bottom: -18px;
    text-align: center;
    font-family: $serif;
    font-style: italic;
    font-size: 11px;
    color: $cream-low;
    letter-spacing: 1px;
  }

  &--2 .ro-disc { opacity: .55; filter: grayscale(.5); }

  &__body { flex: 1; min-width: 0; }

  &__meta {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 10px;
  }
  &__time {
    font-family: $serif;
    font-style: italic;
    font-size: 13px;
    color: $cream-low;
    letter-spacing: .5px;
  }

  &__desc {
    display: flex; flex-wrap: wrap; align-items: center;
    gap: 8px; min-height: 24px; margin-bottom: 10px;
  }

  &__foot {
    display: flex; align-items: center; gap: 6px;
    font-family: $serif; font-style: italic;
    font-size: 12px;
    letter-spacing: .5px;
    .rf-k { color: $cream-low; }
    .rf-v { color: $cream-dim; font-style: normal; }
    .rf-sep { color: $cream-xlow; margin: 0 6px; }
    .rf-v--0 { color: $mid; }
    .rf-v--1 { color: $ok; }
    .rf-v--2 { color: $warn; }
  }

  &__act {
    display: flex; flex-direction: column; gap: 8px;
    align-items: flex-end; flex-shrink: 0;
  }
}
@keyframes spin { to { transform: rotate(360deg); } }

/* status pill */
.pill {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: $sans;
  font-size: 11.5px;
  letter-spacing: 1.5px;
  padding: 4px 11px;
  border: 1px solid;
  border-radius: 999px;

  &__dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: currentColor;
  }
  &--0 {
    color: $mid;
    border-color: rgba(185,200,232,0.4);
    .pill__dot { animation: pulse 1.4s ease infinite; }
  }
  &--1 {
    color: $ok;
    border-color: rgba(166,220,188,0.4);
  }
  &--2 {
    color: $warn;
    border-color: rgba(233,183,183,0.4);
  }
}
@keyframes pulse {
  0%,100% { opacity: .4; transform: scale(.8); }
  50%     { opacity: 1;  transform: scale(1.15); }
}

/* object tags + texts */
.obj {
  font-family: $serif;
  font-size: 14.5px;
  color: $moon-soft;
  padding: 2px 12px;
  border: 1px solid $cream-xlow;
  border-radius: 999px;
  letter-spacing: .6px;
  background: rgba(247,236,210,0.04);
}
.obj-more {
  font-family: $serif;
  font-style: italic;
  font-size: 13px;
  color: $cream-low;
}
.fail-txt {
  font-family: $sans;
  font-size: 13.5px;
  color: $warn;
  letter-spacing: .3px;
}
.pending-txt {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: $sans;
  font-size: 13.5px;
  color: $mid;
}
.pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: currentColor;
  animation: pulse 1.2s ease infinite;
}

/* link buttons */
.link {
  font-family: $sans;
  font-size: 12.5px;
  letter-spacing: 1.2px;
  color: $cream-dim;
  cursor: pointer;
  padding: 6px 2px;
  transition: color .2s;
  user-select: none;
  white-space: nowrap;
  border-bottom: 1px solid transparent;

  &:hover { color: $moon; border-bottom-color: $cream-low; }
  &--on   { color: $moon; }
  &--danger { color: $warn; &:hover { color: #ffb8b8; border-bottom-color: rgba(233,183,183,0.4); } }
  &.is-loading { opacity: .6; pointer-events: none; }
}

/* submit button (painted gold) */
.submit {
  display: inline-flex; flex-direction: column; align-items: center;
  gap: 4px;
  padding: 16px 48px;
  background:
    linear-gradient(180deg, rgba(247,236,210,0.12), rgba(247,236,210,0.04));
  border: 1px solid $cream-low;
  border-radius: 999px;
  cursor: pointer;
  transition: all .3s;
  color: $moon;
  font-family: $sans;

  &__en {
    font-family: $serif; font-style: italic;
    font-size: 12px; letter-spacing: 2px;
    color: $cream-dim;
  }
  &__cn {
    font-size: 15px; letter-spacing: 4px;
  }

  &:hover {
    background:
      linear-gradient(180deg, rgba(247,236,210,0.22), rgba(247,236,210,0.08));
    box-shadow: 0 0 40px rgba(247,236,210,0.18);
    transform: translateY(-1px);
  }
}

/* pagination */
.pagi {
  display: flex; justify-content: center;
  padding: 40px 0 0;
}
:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: #{$cream-dim};
  --el-pagination-button-color: #{$cream-dim};
  --el-pagination-button-bg-color: transparent;
  --el-pagination-hover-color: #{$moon};
  .btn-prev, .btn-next, .el-pager li {
    background: transparent !important;
    color: $cream-dim !important;
    border: 1px solid $cream-xlow;
    border-radius: 4px;
    &:hover { color: $moon !important; border-color: $cream-low; }
  }
  .el-pager li.is-active {
    background: rgba(247,236,210,0.15) !important;
    color: $moon !important;
    border-color: $cream-low;
  }
  .el-pagination__total,
  .el-pagination__sizes .el-select .el-input__inner {
    color: $cream-dim !important;
  }
  .el-select .el-input__wrapper {
    background: transparent;
    box-shadow: 0 0 0 1px $cream-xlow inset !important;
  }
  .el-select .el-input__inner { color: $cream; }
}

/* dialog */
:deep(.rh-dialog) {
  background: linear-gradient(180deg, $sky-mid, $sky-bot);
  border: 1px solid $cream-xlow;
  border-radius: 8px;
  .el-dialog__header { padding: 22px 26px 16px; border-bottom: 1px solid $cream-xlow; margin: 0; }
  .el-dialog__body { padding: 22px 26px; }
  .el-dialog__footer {
    padding: 16px 26px 20px;
    border-top: 1px solid $cream-xlow;
    display: flex; gap: 18px; justify-content: flex-end;
  }
}
.dlg-h {
  &__en {
    font-family: $serif; font-style: italic;
    font-size: 12px; letter-spacing: 2px;
    color: $warn; margin-bottom: 6px;
  }
  &__cn {
    font-family: $serif;
    font-size: 22px; letter-spacing: 3px;
    color: $moon;
  }
}
.dlg-b {
  p {
    margin: 0 0 8px;
    font-family: $sans;
    font-size: 14px;
    color: $cream-dim;
    line-height: 1.7;
  }
  .dlg-sub {
    font-size: 12.5px !important;
    color: $cream-low !important;
    font-style: italic;
    font-family: $serif;
  }
}

:deep(.el-loading-mask) {
  background-color: rgba(7,11,29,0.65);
  .el-loading-spinner .path { stroke: $moon; }
}

/* embedded in user center */
.rh--embedded {
  min-height: auto;
  padding: 0;
  overflow: hidden;
  isolation: isolate;
  background: transparent;
  border: 1px solid rgba(243,233,207,0.18);
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(13, 18, 33, 0.14);

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  &::before {
    background:
      radial-gradient(720px 280px at 16% 0%, rgba(154,134,209,0.18), transparent 62%),
      radial-gradient(520px 260px at 92% 8%, rgba(217,157,180,0.10), transparent 58%),
      linear-gradient(180deg, rgba(26,37,71,0.98) 0%, rgba(14,23,49,0.98) 42%, rgba(7,11,29,0.99) 100%);
  }

  &::after {
    opacity: .42;
    background-image:
      radial-gradient(1px 1px at 18% 24%, rgba(255,255,255,0.8), transparent 56%),
      radial-gradient(1px 1px at 74% 18%, rgba(247,236,210,0.68), transparent 56%),
      radial-gradient(1px 1px at 88% 58%, rgba(185,200,232,0.66), transparent 56%),
      radial-gradient(1px 1px at 36% 76%, rgba(255,255,255,0.52), transparent 56%),
      radial-gradient(1px 1px at 58% 90%, rgba(217,157,180,0.50), transparent 56%);
    background-size: 520px 520px, 680px 680px, 760px 760px, 580px 580px, 720px 720px;
  }

  .hero {
    max-width: none;
    margin: 0;
    padding: 28px 30px 24px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 18px 28px;
    text-align: left;
    border-bottom: 1px solid rgba(243,233,207,0.16);
  }

  .hero__kicker {
    grid-column: 1;
    margin-bottom: 9px;
    font-size: 12px;
    letter-spacing: 1.4px;
  }

  .hero__title {
    grid-column: 1;
    font-size: 34px;
    letter-spacing: 3px;
    margin-bottom: 10px;
    text-shadow: 0 2px 18px rgba(247,236,210,0.16);
  }

  .hero__desc {
    grid-column: 1;
    max-width: 620px;
    margin: 0;
    font-size: 13px;
    letter-spacing: .4px;
    line-height: 1.8;
  }

  .hero__action {
    grid-column: 2;
    grid-row: 1 / span 3;
    align-self: center;
    border-radius: 4px;
    background: rgba(247,236,210,0.08);
  }

  .hero__rule {
    display: none;
  }

  .main {
    max-width: none;
    margin: 0;
    padding: 24px 30px 30px;
  }

  .stats {
    margin-bottom: 24px;
    border: 1px solid rgba(243,233,207,0.14);
    border-radius: 7px;
    overflow: hidden;
    background: rgba(7,11,29,0.32);
  }

  .stat {
    padding: 20px 22px 18px;
    border-color: rgba(243,233,207,0.12);

    &__k {
      margin-bottom: 10px;
      font-size: 11px;
      letter-spacing: 1.6px;
    }

    &__v {
      font-size: 38px;
    }

    &__en {
      font-size: 12px;
    }
  }

  .tabs {
    margin-bottom: 16px;
    border-color: rgba(243,233,207,0.14);
  }

  .tab {
    padding: 12px 18px 12px 0;
    margin-right: 16px;

    &__label {
      font-size: 16px;
      letter-spacing: .6px;
    }
  }

  .list {
    min-height: 190px;
    overflow: hidden;
    border: 1px solid rgba(243,233,207,0.14);
    border-radius: 7px;
    background: rgba(7,11,29,0.24);
  }

  .row {
    padding: 22px 24px;
    border-color: rgba(243,233,207,0.12);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba(247,236,210,0.045);
    }
  }

  .row__desc,
  .row__foot,
  .row__time,
  .link,
  .empty__desc {
    text-shadow: 0 1px 1px rgba(0,0,0,0.16);
  }

  .empty {
    padding: 72px 30px 66px;
  }

  .empty__title {
    font-size: 24px;
    letter-spacing: 3px;
  }

  .pagi {
    padding: 28px 0;
    border-top: 1px solid rgba(243,233,207,0.10);
  }
}

/* responsive */
@media (max-width: 1000px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .stat:nth-child(2) { border-right: none; }
  .stat:nth-child(1), .stat:nth-child(2) { border-bottom: 1px solid $cream-xlow; }
}
@media (max-width: 768px) {
  .topbar { padding: 20px 22px 14px; flex-wrap: wrap; gap: 12px; }
  .hero { padding: 40px 22px 40px; }
  .hero__title { font-size: 46px; letter-spacing: 5px; }
  .main { padding: 0 22px; }
  .row { flex-wrap: wrap;
    &__act { flex-direction: row; width: 100%; justify-content: flex-end; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .stars, .empty__halo, .ro-ring, .pill__dot, .pulse { animation: none !important; }
}
</style>
