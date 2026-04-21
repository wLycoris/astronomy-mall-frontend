<template>
  <div class="home-container">

    <!-- ── Header (dark, transparent) ────────────────────── -->
    <header class="header" :class="{ 'header-scrolled': scrolled }">
      <div class="header-content">
        <div class="logo" @click="router.push('/home')">
          <span class="logo-icon">◎</span>
          <span class="logo-text">{{ mallName }}</span>
        </div>

        <nav class="nav-menu">
          <router-link to="/home"        class="nav-item">首页</router-link>
          <router-link to="/products"    class="nav-item">商品</router-link>
          <router-link to="/course"      class="nav-item">课程</router-link>
          <router-link to="/recognition" class="nav-item">AI识别</router-link>
          <router-link to="/location"    class="nav-item">观测点</router-link>
          <router-link to="/forum"       class="nav-item">论坛</router-link>
        </nav>

        <div class="header-right">
          <transition name="fade" mode="out-in">
            <div v-if="isLoggedIn" key="in" class="logged-in">
              <el-button v-if="isAdmin" size="small" class="admin-btn" @click="goToAdmin">
                后台管理
              </el-button>
              <NotificationBell />
              <el-dropdown @command="handleCommand" trigger="click" popper-class="home-user-menu">
                <div class="user-info">
                  <el-avatar :src="userAvatar" :size="30" />
                  <span class="username">{{ userName }}</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="isAdmin" command="admin" divided>
                      <el-icon><Setting /></el-icon>后台管理
                    </el-dropdown-item>
                    <el-dropdown-item command="profile">
                      <el-icon><User /></el-icon>个人中心
                    </el-dropdown-item>
                    <el-dropdown-item command="cart">
                      <el-icon><ShoppingCart /></el-icon>
                      我的购物车
                      <span v-if="cartCount > 0" class="menu-badge">{{ cartCount }}</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="orders">
                      <el-icon><List /></el-icon>我的订单
                    </el-dropdown-item>
                    <el-dropdown-item command="reviews">
                      <el-icon><ChatDotRound /></el-icon>我的评价
                    </el-dropdown-item>
                    <el-dropdown-item command="notification-settings">
                      <el-icon><Bell /></el-icon>通知设置
                    </el-dropdown-item>
                    <el-dropdown-item command="logout" divided>
                      <el-icon><SwitchButton /></el-icon>退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div v-else key="out" class="auth-buttons">
              <button class="ghost-btn" @click="goToLogin">登录</button>
              <button class="bracket-btn bracket-btn-sm" @click="goToRegister">
                <span>[&nbsp;注册&nbsp;]</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <!-- ── HERO: editorial full-screen ─────────────────────── -->
    <section class="hero">
      <div class="hero-bg">
        <el-carousel :interval="7000" arrow="never" indicator-position="none" class="hero-carousel-comp">
          <el-carousel-item v-for="(b, i) in banners" :key="i">
            <div class="hbg" :style="{backgroundImage:`url(${b.image})`}"></div>
          </el-carousel-item>
        </el-carousel>
      </div>
      <div class="hero-mask"></div>
      <div class="hero-vignette"></div>

      <div class="hero-frame-top">
        <span class="frame-left">◉ AN ASTRONOMY UNIVERSE</span>
        <span class="frame-right">EST. 2026 / NIGHT·Ⅰ</span>
      </div>

      <div class="hero-content">
        <div class="hero-kicker">— FOR THOSE WHO LOOK UP —</div>
        <h1 class="hero-title">
          <span class="line">仰望星河</span>
          <span class="line line-italic">万物皆有光</span>
        </h1>
        <p class="hero-sub">
          专业望远镜 · AI 星图识别 · 天文课堂 · 全国观星地图<br/>
          为每一位仰望者，打造一方私属星空
        </p>
        <div class="hero-ctas">
          <button class="bracket-btn" @click="goToProducts">
            <span>[&nbsp;开启探索&nbsp;]</span>
          </button>
          <button class="ghost-btn ghost-btn-light" @click="scrollToNext">
            向下浏览 ↓
          </button>
        </div>
      </div>

      <div class="hero-frame-bottom">
        <span>SCROLL TO DISCOVER</span>
        <span class="scroll-line"></span>
      </div>
    </section>

    <!-- ── SCROLL EDITORIAL (full-viewport sticky + varied compositions) ── -->
    <section class="scroll-ed" ref="nextSection">
      <!-- Full-viewport sticky canvas — images come from different angles per stage -->
      <div class="se-pinned">
        <div class="se-starfield"></div>

        <!-- Per-stage image frames, each with its own shape/position via variant class -->
        <div
          v-for="(s, idx) in stages"
          :key="'img-' + idx"
          class="se-img-wrap"
          :class="[`variant-${s.variant}`]"
          :style="{ opacity: imageOpacity(idx) }"
        >
          <div
            class="se-img"
            :style="{
              transform: `scale(${imageScale(idx)})`,
              backgroundImage: `url(${s.image})`
            }"
          ></div>
          <div class="se-img-overlay" :class="[`overlay-${s.variant}`]"></div>
        </div>

        <!-- Ghost watermark — repositions per active stage -->
        <transition name="ghost">
          <div
            class="se-ghost"
            :class="[`ghost-${stages[activeStage].ghostPos}`]"
            :key="'ghost-' + activeStage"
          >
            {{ stages[activeStage].ghost }}
          </div>
        </transition>

        <div class="se-badge">◎ 0{{ activeStage + 1 }} / 04</div>

        <div class="se-progress">
          <span
            v-for="(s, idx) in stages"
            :key="'p-' + idx"
            :class="{ active: activeStage === idx, passed: activeStage > idx }"
          ></span>
        </div>
      </div>

      <!-- Text layer — scrolls over the sticky canvas; text position varies per stage -->
      <div class="se-text-layer">
        <div
          v-for="(s, idx) in stages"
          :key="'stage-' + idx"
          class="se-stage"
          :class="[`text-${s.textPos}`]"
          :data-idx="idx"
          ref="stageEls"
        >
          <div class="se-content">
            <div class="se-kicker">{{ s.kicker }}</div>
            <h2 class="se-title" v-html="s.title"></h2>
            <p class="se-body" v-html="s.body"></p>
            <button class="bracket-btn" @click="s.action">
              <span>{{ s.cta }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── INTERLUDE chapter-break between brand editorial & commerce ── -->
    <section class="interlude">
      <div class="interlude-inner">
        <span class="interlude-line"></span>
        <span class="interlude-text">INTERLUDE</span>
        <span class="interlude-line"></span>
      </div>
      <p class="interlude-sub">—— THE COLLECTION ——</p>
      <p class="interlude-desc">品牌之后 · 选物自此而始</p>
    </section>

    <!-- ── FEATURED: 本季星选 (editorial magazine style) ───── -->
    <section class="dark-section">
      <div class="container">
        <div class="sec-header">
          <div>
            <div class="sec-kicker">— THE COLLECTION</div>
            <h2 class="sec-title">本季星选</h2>
            <p class="sec-sub">每一件 · 都经得住仰望</p>
          </div>
          <button class="link-more" @click="goToProducts">VIEW ALL &nbsp;→</button>
        </div>
        <div v-loading="loading" element-loading-background="rgba(0,0,0,0.6)" class="grid-4">
          <div
            v-for="(product, idx) in recommendProducts"
            :key="product.id"
            class="p-card p-card-featured"
            @click="goToProductDetail(product.id)"
          >
            <div class="p-index">№ {{ String(idx + 1).padStart(2, '0') }}</div>
            <div class="p-img">
              <img :src="product.mainImage" :alt="product.productName">
              <div class="p-tags">
                <span v-if="product.isHot" class="p-tag p-tag-hot">HOT</span>
                <span v-if="product.isNew" class="p-tag p-tag-new">NEW</span>
              </div>
              <div class="p-overlay">
                <span>[&nbsp;查看详情&nbsp;]</span>
              </div>
            </div>
            <div class="p-body">
              <h4>{{ product.productName }}</h4>
              <p class="p-sub">{{ product.subTitle }}</p>
              <div class="p-foot">
                <span class="p-price">¥ {{ product.price }}</span>
                <span class="p-meta">№ {{ String(product.id).padStart(4, '0') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 为你而选 (personalized recommendation) ───────── -->
    <section class="dark-section section-deeper" v-if="guessLikeProducts.length > 0">
      <div class="container">
        <div class="sec-header">
          <div>
            <div class="sec-kicker">— FOR YOU</div>
            <h2 class="sec-title">
              <span v-if="isLoggedIn">为你而选</span>
              <span v-else>众人之选</span>
            </h2>
            <p class="sec-sub" v-if="isLoggedIn">基于你的浏览与收藏</p>
            <p class="sec-sub" v-else>热门商品 · 众人正在看</p>
          </div>
        </div>
        <div class="grid-5">
          <div
            v-for="item in guessLikeProducts"
            :key="'gl-' + item.id"
            class="p-card p-card-sm"
            @click="handleGuessClick(item)"
          >
            <div class="p-img p-img-sm">
              <img :src="item.mainImage" :alt="item.productName">
              <span class="reason-tag">
                <span class="reason-dot"></span>{{ item.reason || '推荐' }}
              </span>
            </div>
            <div class="p-body">
              <h4>{{ item.productName }}</h4>
              <div class="p-foot">
                <span class="p-price">¥ {{ item.price }}</span>
                <span v-if="item.originalPrice && item.originalPrice > item.price" class="p-orig">¥{{ item.originalPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── NASA APOD ─────────────────────────────────────── -->
    <section class="dark-section apod-section">
      <div class="container container-md">
        <div class="sec-header sec-header-center">
          <div>
            <div class="sec-kicker">— NASA APOD</div>
            <h2 class="sec-title">每日一宇宙</h2>
          </div>
        </div>
        <ApodCard />
      </div>
    </section>

    <!-- ── Footer (minimal dark) ─────────────────────────── -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="f-logo">◎ {{ mallName }}</span>
            <p class="f-tag">FOR THOSE WHO LOOK UP · 仰望者的理想站</p>
          </div>
          <div class="footer-cols">
            <router-link to="/products"    class="f-link">商品</router-link>
            <router-link to="/course"      class="f-link">课程</router-link>
            <router-link to="/recognition" class="f-link">AI识别</router-link>
            <router-link to="/location"    class="f-link">观测点</router-link>
            <router-link to="/forum"       class="f-link">论坛</router-link>
          </div>
        </div>
        <div class="footer-bottom">
          <span class="footer-copy">{{ copyright }}</span>
          <span class="footer-meta">MADE UNDER THE STARS</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { getToken } from '@/utils/auth'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRecommendProducts } from '@/api/product'
import { getCartList } from '@/api/cart'
import { getBasicSetting } from '@/api/admin/setting'
import { getHomeRecommend, recordRecommendClick } from '@/api/recommend'
import ApodCard from '@/components/ApodCard.vue'
import {
  ShoppingCart, List, User, SwitchButton, Setting, Bell, ChatDotRound
} from '@element-plus/icons-vue'
import NotificationBell from '@/components/NotificationBell.vue'

const isAdmin = computed(() => userStore.userInfo?.role === 1)
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const recommendProducts = ref([])
const guessLikeProducts = ref([])
const cartCount = ref(0)
const mallName = ref('天文器材商城')
const copyright = ref('© 2026 天文器材商城')
const scrolled = ref(false)
const nextSection = ref(null)

// Hero carousel — dramatic deep-space imagery (standard Unsplash URL pattern)
const banners = [
  { image: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1920&q=80' },
  { image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1920&q=80' },
  { image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1920&q=80' }
]

// 4 stages — each with its OWN composition variant (image position + text position)
// Mirrors the GUILDED MIND video: image appears from different angles across stages.
const stages = [
  {
    kicker: '— 01 / 商城',
    ghost: 'TELESCOPE',
    title: '器以载道<br/><span class="italic">望遇星辰</span>',
    body: '精选全球顶级天文器材，从入门望远镜到专业赤道仪。<br/>好的装备，让每一次仰望都有回响。',
    cta: '[\u00a0进入商城\u00a0]',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
    variant: 'right',       // image on the right, ~58% wide
    textPos: 'left',        // text block on the left, centered vertically
    ghostPos: 'br',         // watermark: bottom-right
    action: () => router.push('/products')
  },
  {
    kicker: '— 02 / AI 识别',
    ghost: 'VISION',
    title: '让每颗星<br/><span class="italic">都有名字</span>',
    body: '上传夜空照片，云端 AI 自动解算赤经赤纬，<br/>标注每一颗恒星、每一处深空天体。',
    cta: '[\u00a0立即识别\u00a0]',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80',
    variant: 'circle',      // image as centered circular portrait
    textPos: 'bottom',      // text block below the circle, centered
    ghostPos: 'tl',         // watermark: top-left negative space
    action: () => router.push('/recognition')
  },
  {
    kicker: '— 03 / 课堂',
    ghost: 'ACADEMY',
    title: '从看见<br/><span class="italic">到看懂</span>',
    body: '专业天文讲师主讲系列课程，<br/>从观测入门到天体物理，建立完整的宇宙认知。',
    cta: '[\u00a0开始学习\u00a0]',
    image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1600&q=80',
    variant: 'left',        // image on the left, ~58% wide (inverted from 01)
    textPos: 'right',       // text block on the right, centered vertically
    ghostPos: 'bl',         // watermark: bottom-left
    action: () => router.push('/course')
  },
  {
    kicker: '— 04 / 观星地图',
    ghost: 'OBSERVATORY',
    title: '寻一处<br/><span class="italic">最暗的夜</span>',
    body: '全国观测点地图，按光污染等级筛选。<br/>城市之外，另有一片更真的天。',
    cta: '[\u00a0查看地图\u00a0]',
    image: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1600&q=80',
    variant: 'fullbleed',   // image covers full viewport as cinematic backdrop
    textPos: 'bottom-right',// text anchored bottom-right corner
    ghostPos: 'tr',         // watermark: top-right
    action: () => router.push('/location')
  }
]

// Continuous scroll progress across the scroll-ed section: 0 → (stages.length - 1)
// Drives both image opacity blending AND discrete UI (ghost, badge, progress bar) via Math.round.
const scrollPos = ref(0)
const stageEls = ref([])
const activeStage = computed(() => {
  const rounded = Math.round(scrollPos.value)
  return Math.max(0, Math.min(stages.length - 1, rounded))
})

// Continuous opacity: full at own index, fades linearly to 0 at ±1 away
const imageOpacity = (idx) => {
  const d = Math.abs(scrollPos.value - idx)
  return Math.max(0, 1 - d)
}
// Subtle parallax zoom — image scales up 5% as it becomes active then back
const imageScale = (idx) => {
  const d = Math.abs(scrollPos.value - idx)
  return 1 + 0.05 * Math.max(0, 1 - d)
}

const isLoggedIn = computed(() => !!getToken() && userStore.isLoggedIn)
const userName   = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户')
const userAvatar = computed(() => userStore.userInfo?.avatar || '/images/default_avatar.png')

const loadCartCount = async () => {
  if (!getToken()) return
  try { cartCount.value = (await getCartList()).data?.length || 0 }
  catch { cartCount.value = 0 }
}
const loadRecommendProducts = async () => {
  loading.value = true
  // Editorial layout wants 4 large cards, not an 8-item grid
  try { recommendProducts.value = (await getRecommendProducts(1, 4)).data.records }
  catch (e) { console.error('推荐加载失败', e) }
  finally { loading.value = false }
}
const loadBasicSetting = async () => {
  try {
    const res = await getBasicSetting()
    if (res.data.mallName)  mallName.value  = res.data.mallName
    if (res.data.copyright) copyright.value = res.data.copyright
  } catch {}
}
const loadGuessLike = async () => {
  try { guessLikeProducts.value = (await getHomeRecommend({ limit: 10 })).data || [] }
  catch { guessLikeProducts.value = [] }
}
const handleGuessClick = async (item) => {
  try { if (isLoggedIn.value) recordRecommendClick({ recommendType: 'product', targetId: item.id }) } catch {}
  router.push(`/product/${item.id}`)
}

const goToProducts      = () => router.push('/products')
const goToProductDetail = (id) => router.push(`/product/${id}`)
const goToCart = () => {
  if (!isLoggedIn.value) { ElMessage.warning('请先登录'); router.push('/login'); return }
  router.push('/cart')
}
const goToAdmin  = () => router.push('/admin/statistics')
const goToOrders = () => {
  if (!isLoggedIn.value) { ElMessage.warning('请先登录'); router.push('/login'); return }
  router.push('/order/list')
}
const goToMyReviews = () => {
  if (!isLoggedIn.value) { ElMessage.warning('请先登录'); router.push('/login'); return }
  router.push('/review/my')
}
const goToLogin    = () => router.push('/login')
const goToRegister = () => router.push('/register')
const scrollToNext = () => {
  nextSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const handleCommand = (cmd) => {
  const map = {
    admin: goToAdmin,
    profile: () => router.push('/user/overview'),
    cart: goToCart,
    orders: goToOrders,
    reviews: goToMyReviews,
    'notification-settings': () => router.push('/notification/settings'),
    logout: handleLogout
  }
  map[cmd]?.()
}
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    cartCount.value = 0
    await userStore.logout()
    ElMessage.success('已退出登录')
  } catch {}
}

// Scroll listener — drives BOTH header-scrolled state AND scroll-ed section progress
let rafId = null
const updateScrollState = () => {
  scrolled.value = window.scrollY > 80

  // Compute progress across scroll-ed: 0 when top edge reaches top of viewport,
  // (N-1) when bottom edge reaches bottom of viewport. Smooth & continuous.
  const el = nextSection.value
  if (el) {
    const rect = el.getBoundingClientRect()
    const viewH = window.innerHeight
    const travelable = rect.height - viewH   // total scroll distance while section is pinned
    const scrolledIn = -rect.top              // how far into the section we are
    if (travelable > 0) {
      const p = Math.max(0, Math.min(1, scrolledIn / travelable))
      scrollPos.value = p * (stages.length - 1)
    } else {
      scrollPos.value = rect.top > 0 ? 0 : (stages.length - 1)
    }
  }
  rafId = null
}
const handleScroll = () => {
  if (rafId !== null) return
  rafId = requestAnimationFrame(updateScrollState)
}

watch(() => userStore.isLoggedIn, (v) => { if (v) loadCartCount(); else cartCount.value = 0 }, { immediate: true })

onMounted(async () => {
  await userStore.restoreLogin()
  if (isLoggedIn.value) loadCartCount()
  loadRecommendProducts()
  loadBasicSetting()
  loadGuessLike()

  // 🔥 进入首页前确保滚动容器是 window，而非某些后台/布局残留的 body 滚动容器
  //   （AdminLayout 等页面曾注入过 html,body { overflow-y:auto }，若未清理会让
  //    window scroll 事件不再触发，导致滚动图片切换失效）
  document.documentElement.classList.remove('admin-active')
  document.body.classList.remove('admin-active')

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })
  await nextTick()
  // Initial position calculation
  updateScrollState()
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<style scoped lang="scss">
// ═══════════════════════════════════════════════════════════
// GUILDED MIND editorial dark style · 天文器材商城 Home v5
// ═══════════════════════════════════════════════════════════

// Tokens
$bg-0:   #000;
$bg-1:   #070709;
$bg-2:   #0e0e12;
$bg-3:   #14141a;
$line:   rgba(255,255,255,0.10);
$line-2: rgba(255,255,255,0.18);
$tx-1:   #f4f4f4;
$tx-2:   rgba(255,255,255,0.72);
$tx-3:   rgba(255,255,255,0.45);
$tx-4:   rgba(255,255,255,0.25);
$accent: #c7a572;
$danger: #ef4444;
$max:    1280px;

$serif: 'Cormorant Garamond', 'Playfair Display', 'Noto Serif SC', 'Source Han Serif CN',
        'Songti SC', SimSun, '宋体', Georgia, serif;
$sans:  -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC',
        'Microsoft YaHei', sans-serif;
$mono:  'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;

// ── Base ───────────────────────────────────────────────────
.home-container {
  background: $bg-0;
  min-height: 100vh;
  color: $tx-1;
  font-family: $sans;
}

// ── Bracket button (signature CTA) ────────────────────────
.bracket-btn {
  background: transparent;
  border: none;
  color: $tx-1;
  font-family: $mono;
  font-size: 13px;
  letter-spacing: 3px;
  font-weight: 500;
  padding: 14px 28px;
  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;

  &::before, &::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border: 1px solid $tx-1;
    transition: all 0.3s ease;
  }
  &::before {
    top: 0; left: 0;
    border-right: none;
    border-bottom: none;
  }
  &::after {
    bottom: 0; right: 0;
    border-left: none;
    border-top: none;
  }
  &:hover {
    color: $accent;
    letter-spacing: 4px;
    &::before, &::after {
      border-color: $accent;
      width: 18px; height: 18px;
    }
  }

  &.bracket-btn-sm {
    padding: 8px 16px;
    font-size: 12px;
    letter-spacing: 2px;
    &::before, &::after { width: 8px; height: 8px; }
  }
}

.ghost-btn {
  background: transparent;
  border: 1px solid $line-2;
  color: $tx-2;
  font-family: $mono;
  font-size: 12px;
  letter-spacing: 2px;
  padding: 8px 18px;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover {
    border-color: $tx-1;
    color: $tx-1;
    background: rgba(255,255,255,0.04);
  }
  &.ghost-btn-light {
    border-color: rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.8);
    &:hover { border-color: #fff; color: #fff; }
  }
}

// ── Header ────────────────────────────────────────────────
.header {
  background: transparent;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  transition: background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease;
  border-bottom: 1px solid transparent;

  &.header-scrolled {
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid $line;
  }

  .header-content {
    max-width: $max;
    margin: 0 auto;
    padding: 0 40px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    .logo-icon {
      font-size: 22px;
      color: $accent;
      transition: transform 0.4s ease;
    }
    .logo-text {
      font-family: $serif;
      font-size: 19px;
      font-weight: 600;
      color: $tx-1;
      letter-spacing: 2px;
    }
    &:hover .logo-icon { transform: rotate(90deg); }
  }

  .nav-menu {
    display: flex;
    gap: 36px;
    .nav-item {
      color: $tx-3;
      text-decoration: none;
      font-size: 13px;
      letter-spacing: 1.5px;
      position: relative;
      padding: 4px 0;
      transition: color 0.2s;
      &:hover { color: $tx-1; }
      &.router-link-active {
        color: $tx-1;
        &::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 50%;
          width: 4px; height: 4px;
          background: $accent;
          border-radius: 50%;
          transform: translateX(-50%);
        }
      }
    }
  }

  .header-right {
    display: flex;
    justify-content: flex-end;
    min-width: 180px;

    .logged-in {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .admin-btn {
      background: transparent;
      border: 1px solid $line-2;
      color: $tx-2;
      font-family: $mono;
      font-size: 11px;
      letter-spacing: 1.5px;
      &:hover { border-color: $accent; color: $accent; background: transparent; }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 12px 4px 4px;
      border-radius: 20px;
      transition: background 0.2s;
      &:hover { background: rgba(255,255,255,0.06); }
      .username {
        font-size: 13px;
        color: $tx-2;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .auth-buttons {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-badge {
  margin-left: auto;
  background: $danger;
  color: white;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  line-height: 1.4;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

// ── HERO ──────────────────────────────────────────────────
.hero {
  position: relative;
  height: 100vh;
  min-height: 680px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at top, #0d1025 0%, #000 70%),
    #000;

  .hero-bg {
    position: absolute;
    inset: 0;

    :deep(.hero-carousel-comp),
    :deep(.hero-carousel-comp .el-carousel__container) {
      height: 100% !important;
    }

    .hbg {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-color: #050514;
      filter: saturate(0.9) brightness(0.55) contrast(1.05);
      animation: heroZoom 18s ease-in-out infinite alternate;
    }
  }

  .hero-mask {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%),
      radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 85%);
  }

  .hero-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%);
    pointer-events: none;
  }

  .hero-frame-top,
  .hero-frame-bottom {
    position: absolute;
    left: 40px;
    right: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 3;
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 2px;
    color: $tx-3;
  }
  .hero-frame-top    { top: 96px; }
  .hero-frame-bottom {
    bottom: 32px;
    justify-content: center;
    gap: 14px;
    .scroll-line {
      width: 60px;
      height: 1px;
      background: linear-gradient(to right, transparent, $tx-3, transparent);
      animation: scrollHint 2s ease-in-out infinite;
    }
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: $max;
    height: 100%;
    margin: 0 auto;
    padding: 0 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    .hero-kicker {
      font-family: $mono;
      font-size: 12px;
      letter-spacing: 5px;
      color: $tx-3;
      margin-bottom: 28px;
    }

    .hero-title {
      font-family: $serif;
      font-size: clamp(56px, 9vw, 128px);
      font-weight: 500;
      color: $tx-1;
      margin: 0 0 32px;
      line-height: 0.95;
      letter-spacing: 6px;
      text-shadow: 0 2px 40px rgba(0,0,0,0.6);

      .line {
        display: block;
        &.line-italic {
          font-style: italic;
          font-weight: 400;
          color: rgba(255,255,255,0.92);
          letter-spacing: 12px;
          margin-top: 6px;
        }
      }
    }

    .hero-sub {
      font-size: 14px;
      color: $tx-2;
      margin: 0 0 42px;
      letter-spacing: 1.5px;
      line-height: 1.9;
      max-width: 600px;
    }

    .hero-ctas {
      display: flex;
      gap: 18px;
      align-items: center;
    }
  }
}

@keyframes heroZoom {
  from { transform: scale(1); }
  to   { transform: scale(1.08); }
}
@keyframes scrollHint {
  0%,100% { opacity: 0.3; }
  50%     { opacity: 1; }
}
@keyframes starfieldDrift {
  from { background-position: 0% 0%; }
  to   { background-position: 100% 100%; }
}

// ═══════════════════════════════════════════════════════════
// SCROLL EDITORIAL — full-viewport sticky + 4 layout variants
// ═══════════════════════════════════════════════════════════
.scroll-ed {
  position: relative;
  background: $bg-0;
  border-top: 1px solid $line;
}

// ── Sticky canvas spans full viewport width ──────────────
.se-pinned {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a16 0%, #15151f 50%, #05050a 100%);
}

// CSS starfield — always renders
.se-starfield {
  position: absolute;
  inset: 0;
  background-color: #05050a;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.9), transparent 50%),
    radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.8), transparent 50%),
    radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.85), transparent 50%),
    radial-gradient(2px 2px at 40% 80%, rgba(199,165,114,0.5), transparent 50%),
    radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.7), transparent 50%),
    radial-gradient(1px 1px at 15% 65%, rgba(255,255,255,0.8), transparent 50%),
    radial-gradient(1px 1px at 35% 15%, rgba(255,255,255,0.6), transparent 50%),
    radial-gradient(2px 2px at 70% 40%, rgba(180,200,255,0.4), transparent 50%),
    radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.9), transparent 50%),
    radial-gradient(ellipse at 30% 40%, rgba(100,60,160,0.18), transparent 60%),
    radial-gradient(ellipse at 75% 75%, rgba(199,165,114,0.1), transparent 55%);
  animation: starfieldDrift 60s linear infinite;
  z-index: 0;
}

// ── Image wrapper: positioning/shape via variant, opacity via inline ───
.se-img-wrap {
  position: absolute;
  overflow: hidden;
  transition: opacity 0.1s linear;
  will-change: opacity;
  z-index: 1;

  .se-img {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: saturate(0.85) brightness(0.7) contrast(1.1);
    transition: transform 0.15s ease-out;
    will-change: transform;
  }

  .se-img-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  // ── Variant: RIGHT — image occupies right 58%, feathered left edge ──
  &.variant-right {
    top: 0; bottom: 0; right: 0;
    width: 58%;
    .se-img-overlay {
      background:
        linear-gradient(to left,
          rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.85) 100%),
        radial-gradient(ellipse at 70% 50%, transparent 40%, rgba(0,0,0,0.45) 100%);
    }
  }

  // ── Variant: LEFT — image occupies left 58%, feathered right edge ──
  &.variant-left {
    top: 0; bottom: 0; left: 0;
    width: 58%;
    .se-img-overlay {
      background:
        linear-gradient(to right,
          rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.85) 100%),
        radial-gradient(ellipse at 30% 50%, transparent 40%, rgba(0,0,0,0.45) 100%);
    }
  }

  // ── Variant: CIRCLE — centered circular portrait (hero-y) ──
  &.variant-circle {
    top: 50%;
    left: 50%;
    width: min(72vh, 58vw);
    height: min(72vh, 58vw);
    margin-top: calc(min(-36vh, -29vw));
    margin-left: calc(min(-36vh, -29vw));
    border-radius: 50%;
    box-shadow:
      0 0 0 1px rgba(199,165,114,0.25),
      0 0 120px rgba(199,165,114,0.12),
      inset 0 0 80px rgba(0,0,0,0.4);
    .se-img-overlay {
      background: radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.35) 100%);
      border-radius: 50%;
    }
  }

  // ── Variant: FULLBLEED — covers entire viewport ──
  &.variant-fullbleed {
    inset: 0;
    .se-img-overlay {
      background:
        linear-gradient(to top,
          rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.5) 100%),
        linear-gradient(to right,
          rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%);
    }
  }
}

// ── Ghost watermark — repositions per stage ──────────────
.se-ghost {
  position: absolute;
  font-family: $serif;
  font-style: italic;
  font-size: clamp(56px, 7vw, 120px);
  font-weight: 500;
  color: rgba(255,255,255,0.07);
  letter-spacing: 6px;
  pointer-events: none;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 1;
  z-index: 2;

  &.ghost-tl { top: 120px;   left: 48px; }
  &.ghost-tr { top: 120px;   right: 48px; }
  &.ghost-bl { bottom: 60px; left: 48px; }
  &.ghost-br { bottom: 60px; right: 48px; }
}

.ghost-enter-active, .ghost-leave-active {
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.ghost-enter-from { opacity: 0; transform: translateY(20px); }
.ghost-leave-to   { opacity: 0; transform: translateY(-20px); }

// ── Badge + progress (global overlay chrome) ─────────────
.se-badge {
  position: absolute;
  top: 100px;
  right: 40px;
  font-family: $mono;
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 6px 14px;
  background: rgba(0,0,0,0.25);
  backdrop-filter: blur(4px);
  z-index: 4;
}

.se-progress {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 4;

  span {
    width: 1px;
    height: 36px;
    background: rgba(255,255,255,0.2);
    transition: all 0.4s ease;

    &.passed { background: rgba(199,165,114,0.5); }
    &.active {
      background: $accent;
      width: 2px;
      box-shadow: 0 0 12px rgba(199,165,114,0.7);
    }
  }
}

// ── Text layer — scrolls OVER the sticky canvas ──────────
.se-text-layer {
  position: relative;
  margin-top: -100vh;   // pull up to overlap sticky canvas
  z-index: 3;
  pointer-events: none;
}

.se-stage {
  min-height: 100vh;
  padding: 90px 80px;
  display: flex;
  pointer-events: none;

  .se-content {
    pointer-events: auto;
    max-width: 460px;
    // subtle backdrop behind text for legibility over imagery
    padding: 8px 0;
  }

  .se-kicker {
    font-family: $mono;
    font-size: 12px;
    letter-spacing: 4px;
    color: $accent;
    margin-bottom: 28px;
    text-shadow: 0 1px 20px rgba(0,0,0,0.8);
  }

  .se-title {
    font-family: $serif;
    font-size: clamp(44px, 5.2vw, 80px);
    font-weight: 500;
    color: $tx-1;
    margin: 0 0 32px;
    line-height: 1.05;
    letter-spacing: 3px;
    text-shadow: 0 2px 30px rgba(0,0,0,0.75);

    :deep(.italic) {
      font-style: italic;
      font-weight: 400;
      color: rgba(255,255,255,0.9);
    }
  }

  .se-body {
    font-size: 14px;
    color: $tx-2;
    line-height: 2;
    letter-spacing: 1px;
    margin: 0 0 40px;
    text-shadow: 0 1px 14px rgba(0,0,0,0.85);
  }

  // ── Text position variants ───────────────────────────
  &.text-left {
    justify-content: flex-start;
    align-items: center;
    // Keep text away from right-edge image (variant-right)
    .se-content { max-width: 460px; margin-left: 4%; }
  }
  &.text-right {
    justify-content: flex-end;
    align-items: center;
    .se-content { max-width: 460px; margin-right: 4%; text-align: left; }
  }
  &.text-bottom {
    justify-content: center;
    align-items: flex-end;
    padding-bottom: 14vh;
    text-align: center;
    .se-content { max-width: 640px; text-align: center; }
  }
  &.text-bottom-right {
    justify-content: flex-end;
    align-items: flex-end;
    padding: 0 6% 14vh;
    .se-content { max-width: 480px; text-align: left; }
  }
  &.text-center {
    justify-content: center;
    align-items: center;
    text-align: center;
    .se-content { max-width: 640px; text-align: center; }
  }
}

// ═══════════════════════════════════════════════════════════
// INTERLUDE — chapter break between brand editorial & commerce
// ═══════════════════════════════════════════════════════════
.interlude {
  background: $bg-0;
  padding: 110px 0 90px;
  text-align: center;
  border-top: 1px solid $line;

  .interlude-inner {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
    margin-bottom: 28px;
  }
  .interlude-line {
    width: 80px;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(199,165,114,0.5), transparent);
  }
  .interlude-text {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 6px;
    color: $accent;
  }
  .interlude-sub {
    font-family: $serif;
    font-style: italic;
    font-size: clamp(22px, 2.6vw, 34px);
    font-weight: 400;
    color: rgba(255,255,255,0.85);
    margin: 0 0 10px;
    letter-spacing: 4px;
  }
  .interlude-desc {
    font-family: $mono;
    font-size: 11px;
    letter-spacing: 3px;
    color: $tx-3;
    margin: 0;
  }
}

// ═══════════════════════════════════════════════════════════
// Dark section (products, APOD)
// ═══════════════════════════════════════════════════════════
.dark-section {
  background: $bg-0;
  padding: 120px 0;
  border-top: 1px solid $line;

  &.section-deeper { background: $bg-1; }

  .container {
    max-width: $max;
    margin: 0 auto;
    padding: 0 40px;

    &.container-md { max-width: 1000px; }
  }
}

.sec-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 52px;
  gap: 20px;

  &.sec-header-center {
    justify-content: center;
    text-align: center;
  }

  .sec-kicker {
    font-family: $mono;
    font-size: 12px;
    letter-spacing: 4px;
    color: $accent;
    margin-bottom: 14px;
  }

  .sec-title {
    font-family: $serif;
    font-size: clamp(36px, 4vw, 56px);
    font-weight: 500;
    color: $tx-1;
    margin: 0;
    letter-spacing: 3px;
    line-height: 1;
  }

  .sec-sub {
    font-family: $serif;
    font-style: italic;
    font-size: 15px;
    color: rgba(255,255,255,0.6);
    margin: 14px 0 0;
    letter-spacing: 2px;
    font-weight: 400;
  }

  .sec-hint {
    font-family: $mono;
    font-size: 11px;
    color: $tx-3;
    letter-spacing: 2px;
  }

  .link-more {
    background: none;
    border: none;
    color: $tx-2;
    font-family: $mono;
    font-size: 12px;
    letter-spacing: 3px;
    cursor: pointer;
    padding: 8px 0;
    transition: color 0.25s, letter-spacing 0.25s;
    &:hover {
      color: $accent;
      letter-spacing: 4px;
    }
  }
}

// ── Product grids ─────────────────────────────────────────
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
  min-height: 200px;
}
.grid-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

// ── Product card ──────────────────────────────────────────
.p-card {
  background: $bg-2;
  border: 1px solid $line;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: rgba(199,165,114,0.5);
    transform: translateY(-6px);
    box-shadow: 0 20px 60px -20px rgba(199,165,114,0.25), 0 0 0 1px rgba(199,165,114,0.15);

    .p-img img { transform: scale(1.08); filter: brightness(0.95); }
    .p-overlay { opacity: 1; }
    .p-body h4 { color: $accent; }
    .p-index { color: $accent; }
  }

  // Magazine-style № index (featured cards only)
  .p-index {
    position: absolute;
    top: 14px;
    right: 16px;
    font-family: $serif;
    font-style: italic;
    font-size: 22px;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    letter-spacing: 1px;
    z-index: 3;
    transition: color 0.25s;
    mix-blend-mode: difference;
  }

  .p-img {
    position: relative;
    width: 100%;
    height: 260px;
    overflow: hidden;
    background: $bg-3;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.5s;
      filter: brightness(0.82);
    }
    &.p-img-sm { height: 200px; }

    // Editorial tags (replace Element danger red with restrained mono pill)
    .p-tags {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      gap: 6px;
    }
    .p-tag {
      font-family: $mono;
      font-size: 10px;
      letter-spacing: 2px;
      padding: 3px 8px;
      border: 1px solid rgba(255,255,255,0.35);
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      color: rgba(255,255,255,0.9);
      line-height: 1.4;

      &.p-tag-hot {
        border-color: rgba(199,165,114,0.7);
        color: $accent;
      }
      &.p-tag-new {
        border-color: rgba(180,200,255,0.7);
        color: rgba(180,200,255,0.95);
      }
    }

    // Recommendation-reason tag (editorial pill with leading dot)
    .reason-tag {
      position: absolute;
      bottom: 10px;
      left: 10px;
      font-family: $mono;
      font-size: 10px;
      letter-spacing: 1.5px;
      padding: 4px 10px 4px 8px;
      border: 1px solid rgba(199,165,114,0.5);
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(4px);
      color: $accent;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      .reason-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: $accent;
        box-shadow: 0 0 6px rgba(199,165,114,0.8);
      }
    }

    .p-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.35);
      color: #fff;
      font-family: $mono;
      font-size: 12px;
      letter-spacing: 3px;
      opacity: 0;
      transition: opacity 0.3s;
    }
  }

  .p-body {
    padding: 20px 22px 22px;

    h4 {
      font-family: $serif;
      font-size: 17px;
      font-weight: 500;
      color: $tx-1;
      margin: 0 0 6px;
      letter-spacing: 1px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      min-height: 48px;
      line-height: 1.4;
      transition: color 0.25s;
    }

    .p-sub {
      font-size: 12px;
      color: $tx-3;
      margin: 0 0 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      letter-spacing: 0.5px;
    }

    .p-foot {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
      border-top: 1px solid $line;
      padding-top: 12px;

      .p-price {
        font-family: $serif;
        font-size: 22px;
        font-weight: 600;
        color: $accent;
        letter-spacing: 1px;
      }
      .p-orig {
        font-size: 12px;
        color: $tx-4;
        text-decoration: line-through;
      }
      // № 0001 style catalog number replacing 销量
      .p-meta {
        font-family: $mono;
        font-size: 10px;
        color: $tx-4;
        margin-left: auto;
        letter-spacing: 1.5px;
      }
    }
  }

  // Featured variant — larger image, subtler tag
  &.p-card-featured {
    .p-img { height: 320px; }
  }

  &.p-card-sm {
    .p-body {
      padding: 14px 16px 16px;
      h4 {
        font-size: 14px;
        min-height: 40px;
        -webkit-line-clamp: 2;
      }
      .p-foot .p-price { font-size: 17px; }
    }
  }
}

// ── APOD section wrapping ─────────────────────────────────
.apod-section {
  :deep(.apod-card) {
    background: $bg-2 !important;
    border: 1px solid $line;
    color: $tx-1;
  }
}

// ── Footer ────────────────────────────────────────────────
.footer {
  background: $bg-0;
  border-top: 1px solid $line;
  padding: 72px 0 36px;

  .footer-inner {
    max-width: $max;
    margin: 0 auto;
    padding: 0 40px;
  }

  .footer-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 40px;
    border-bottom: 1px solid $line;
    gap: 40px;
    flex-wrap: wrap;
  }

  .footer-brand {
    .f-logo {
      font-family: $serif;
      font-size: 22px;
      font-weight: 600;
      color: $tx-1;
      letter-spacing: 3px;
    }
    .f-tag {
      margin: 12px 0 0;
      font-family: $mono;
      font-size: 11px;
      color: $tx-3;
      letter-spacing: 2px;
    }
  }

  .footer-cols {
    display: flex;
    gap: 28px;
    flex-wrap: wrap;

    .f-link {
      color: $tx-3;
      text-decoration: none;
      font-size: 12px;
      letter-spacing: 2px;
      transition: color 0.2s;
      &:hover { color: $tx-1; }
    }
  }

  .footer-bottom {
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;

    .footer-copy,
    .footer-meta {
      font-family: $mono;
      font-size: 11px;
      color: $tx-4;
      letter-spacing: 2px;
    }
  }
}

:deep(.el-carousel__container) { background: $bg-0; }

// ── Responsive ────────────────────────────────────────────
@media (max-width: 1100px) {
  .grid-4 { grid-template-columns: repeat(3, 1fr); }
  .grid-5 { grid-template-columns: repeat(3, 1fr); }

  .se-stage { padding: 90px 50px; }
}

@media (max-width: 880px) {
  .header .nav-menu { display: none; }
  .header .header-content { padding: 0 24px; }

  .hero {
    min-height: 560px;
    .hero-frame-top, .hero-frame-bottom {
      left: 24px; right: 24px;
      font-size: 10px;
      letter-spacing: 1.5px;
    }
    .hero-frame-top { top: 88px; }
    .hero-content {
      padding: 0 24px;
      .hero-title { letter-spacing: 3px; .line-italic { letter-spacing: 8px; } }
      .hero-sub { font-size: 13px; }
      .hero-ctas { flex-direction: column; gap: 12px; }
    }
  }

  // scroll-ed — on mobile collapse all variants to fullbleed-ish behind text
  .se-pinned { .se-progress { display: none; } }
  .se-img-wrap {
    &.variant-right,
    &.variant-left,
    &.variant-circle,
    &.variant-fullbleed {
      inset: 0;
      width: 100%;
      height: 100%;
      border-radius: 0;
      margin: 0;
      box-shadow: none;
      .se-img-overlay {
        background: linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.75) 100%);
        border-radius: 0;
      }
    }
  }
  .se-ghost {
    font-size: clamp(40px, 10vw, 70px);
    letter-spacing: 3px;
    &.ghost-tl, &.ghost-tr { top: 90px; }
    &.ghost-bl, &.ghost-br { bottom: 40px; }
    &.ghost-tl, &.ghost-bl { left: 24px; right: auto; }
    &.ghost-tr, &.ghost-br { right: 24px; left: auto; }
  }
  .se-badge { top: 88px; right: 24px; }
  .se-stage {
    padding: 80px 28px;
    &.text-left, &.text-right, &.text-bottom-right {
      justify-content: flex-start;
      align-items: center;
      .se-content { max-width: 100%; margin: 0; text-align: left; }
    }
    &.text-bottom { padding-bottom: 10vh; }
  }

  .dark-section { padding: 72px 0; }
  .dark-section .container { padding: 0 24px; }

  .interlude {
    padding: 64px 20px 56px;
    .interlude-line { width: 40px; }
    .interlude-text { letter-spacing: 4px; }
    .interlude-sub { letter-spacing: 2px; }
  }

  .sec-header .sec-sub { font-size: 13px; letter-spacing: 1.5px; }
  .p-card-featured .p-img { height: 240px; }
  .p-card .p-index { font-size: 18px; top: 10px; right: 12px; }

  .grid-4, .grid-5 { grid-template-columns: repeat(2, 1fr); gap: 16px; }

  .p-card .p-img { height: 200px; }

  .sec-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    &.sec-header-center { align-items: center; }
  }

  .footer {
    padding: 48px 0 28px;
    .footer-top { flex-direction: column; gap: 28px; }
    .footer-bottom { flex-direction: column; text-align: center; }
  }
}

@media (max-width: 520px) {
  .grid-4, .grid-5 { grid-template-columns: 1fr; }
}
</style>

<!-- ── Global: user dropdown menu (editorial dark) ── -->
<style lang="scss">
$hm-bg-1: #0e0e12;
$hm-bg-2: #14141a;
$hm-line: rgba(255,255,255,0.10);
$hm-line-2: rgba(255,255,255,0.18);
$hm-tx-1: #f4f4f4;
$hm-tx-2: rgba(255,255,255,0.72);
$hm-tx-3: rgba(255,255,255,0.45);
$hm-tx-4: rgba(255,255,255,0.25);
$hm-accent: #c7a572;
$hm-serif: 'Cormorant Garamond','Playfair Display','Noto Serif SC','Songti SC','宋体',serif;
$hm-mono: 'SF Mono','JetBrains Mono','Menlo',monospace;

.home-user-menu.el-popper {
  background: $hm-bg-1 !important;
  border: 1px solid $hm-line-2 !important;
  border-radius: 0 !important;
  box-shadow: 0 18px 40px rgba(0,0,0,0.65) !important;
  padding: 6px 0 !important;

  .el-popper__arrow::before {
    background: $hm-bg-1 !important;
    border-color: $hm-line-2 !important;
  }

  .el-dropdown-menu {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    min-width: 200px;
  }

  .el-dropdown-menu__item {
    display: flex !important;
    align-items: center;
    gap: 10px;
    padding: 11px 20px !important;
    margin: 0 !important;
    font-family: $hm-serif;
    font-size: 14.5px;
    letter-spacing: 1.2px;
    color: $hm-tx-2 !important;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    line-height: 1.4;
    position: relative;
    transition: color 0.2s ease, background 0.2s ease, padding-left 0.2s ease;

    .el-icon {
      color: $hm-tx-3;
      font-size: 15px;
      transition: color 0.2s ease;
    }

    &::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 2px;
      background: transparent;
      transition: background 0.2s ease;
    }

    &:hover,
    &:focus,
    &:not(.is-disabled):focus {
      background: $hm-bg-2 !important;
      color: $hm-accent !important;
      padding-left: 24px !important;

      .el-icon { color: $hm-accent; }

      &::before { background: $hm-accent; }
    }

    &.is-disabled {
      color: $hm-tx-4 !important;
    }

    .menu-badge {
      margin-left: auto;
      background: transparent;
      color: $hm-accent;
      border: 1px solid $hm-accent;
      font-family: $hm-mono;
      font-size: 10.5px;
      letter-spacing: 1px;
      padding: 1px 7px;
      border-radius: 0;
      line-height: 1.4;
    }
  }

  .el-dropdown-menu__item--divided {
    margin-top: 6px !important;

    &::before {
      display: none;
    }

    &:not(:first-child) {
      border-top: 1px solid $hm-line !important;
    }
  }
}
</style>
