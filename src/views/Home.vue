<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="router.push('/home')">
          <span class="logo-icon">🌌</span>
          <span class="logo-text">天文器材商城</span>
        </div>
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item active">首页</router-link>
          <router-link to="/products" class="nav-item">商品中心</router-link>
          <router-link to="/courses" class="nav-item">课程学习</router-link>
          <router-link to="/ai-recognition" class="nav-item">AI识别</router-link>
          <router-link to="/forum" class="nav-item">天文论坛</router-link>
          <!-- ✅ 新增: 我的评价 (仅登录后显示) -->
          <router-link v-if="isLoggedIn" to="/review/my" class="nav-item">我的评价</router-link>
        </nav>

        <!-- 右侧区域 -->
        <div class="header-right">
          <transition name="fade-slide" mode="out-in">
            <!-- 登录状态 -->
            <div v-if="isLoggedIn" key="logged-in" class="logged-in-section">
              <!-- 🆕 管理员入口按钮 -->
              <el-button
                  v-if="isAdmin"
                  type="warning"
                  @click="goToAdmin"
                  title="进入后台管理"
              >
                <el-icon><Setting /></el-icon>
                <span>后台管理</span>
              </el-button>

              <!-- 🔔 新增: 通知铃铛组件 -->
              <NotificationBell />

              <el-badge :value="cartCount" :hidden="cartCount === 0" class="cart-badge">
                <el-button
                    icon="ShoppingCart"
                    circle
                    @click="goToCart"
                    title="购物车"
                />
              </el-badge>

              <el-button
                  icon="List"
                  circle
                  @click="goToOrders"
                  title="我的订单"
              />

              <el-dropdown @command="handleCommand" trigger="click">
                <div class="user-info">
                  <el-avatar :src="userAvatar" />
                  <span class="username">{{ userName }}</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 🆕 管理员菜单项 -->
                    <el-dropdown-item v-if="isAdmin" command="admin" divided>
                      <el-icon><Setting /></el-icon>
                      后台管理
                    </el-dropdown-item>
                    <el-dropdown-item command="profile">
                      <el-icon><User /></el-icon>
                      个人中心
                    </el-dropdown-item>
                    <el-dropdown-item command="cart">
                      <el-icon><ShoppingCart /></el-icon>
                      我的购物车
                    </el-dropdown-item>
                    <el-dropdown-item command="orders">
                      <el-icon><List /></el-icon>
                      我的订单
                    </el-dropdown-item>
                    <!-- ✅ 新增: 我的评价 -->
                    <el-dropdown-item command="reviews">
                      <el-icon><ChatDotRound /></el-icon>
                      我的评价
                    </el-dropdown-item>
                    <!-- 🔔 新增: 通知设置 -->
                    <el-dropdown-item command="notification-settings">
                      <el-icon><Bell /></el-icon>
                      通知设置
                    </el-dropdown-item>
                    <el-dropdown-item command="logout" divided>
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 未登录状态 -->
            <div v-else key="logged-out" class="auth-buttons">
              <el-button @click="goToLogin">登录</el-button>
              <el-button type="primary" @click="goToRegister">注册</el-button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <!-- 主轮播图 -->
    <div class="banner-section">
      <el-carousel height="500px" indicator-position="outside">
        <el-carousel-item v-for="(banner, index) in banners" :key="index">
          <div class="banner-item" :style="{ backgroundImage: `url(${banner.image})` }">
            <div class="banner-content">
              <h1>{{ banner.title }}</h1>
              <p>{{ banner.subtitle }}</p>
              <el-button type="primary" size="large" @click="goToProducts">
                立即选购
              </el-button>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-entry">
      <div class="entry-item" @click="goToProducts">
        <el-icon :size="40" color="#409EFF"><Grid /></el-icon>
        <h3>商品中心</h3>
        <p>选购天文器材</p>
      </div>
      <div class="entry-item" @click="goToAI">
        <el-icon :size="40" color="#67C23A"><Picture /></el-icon>
        <h3>AI识别</h3>
        <p>星图智能识别</p>
      </div>
      <div class="entry-item" @click="goToCourses">
        <el-icon :size="40" color="#E6A23C"><Reading /></el-icon>
        <h3>课程学习</h3>
        <p>天文知识课程</p>
      </div>
      <div class="entry-item" @click="goToForum">
        <el-icon :size="40" color="#F56C6C"><ChatDotRound /></el-icon>
        <h3>天文论坛</h3>
        <p>交流观测心得</p>
      </div>
    </div>

    <!-- ✅ 新增: 用户中心快捷入口 (仅登录后显示) -->
    <div v-if="isLoggedIn" class="user-center">
      <div class="section-header">
        <h2>🎯 我的中心</h2>
      </div>
      <div class="user-entry">
        <div class="user-entry-item" @click="goToOrders">
          <el-icon :size="32" color="#fff"><List /></el-icon>
          <h4>我的订单</h4>
          <p>查看订单状态</p>
        </div>
        <div class="user-entry-item" @click="goToCart">
          <el-icon :size="32" color="#fff"><ShoppingCart /></el-icon>
          <h4>购物车</h4>
          <p>{{ cartCount }}件商品</p>
        </div>
        <!-- ✅ 我的评价 -->
        <div class="user-entry-item" @click="goToMyReviews">
          <el-icon :size="32" color="#fff"><ChatDotRound /></el-icon>
          <h4>我的评价</h4>
          <p>查看评价记录</p>
        </div>
        <div class="user-entry-item" @click="router.push('/profile')">
          <el-icon :size="32" color="#fff"><User /></el-icon>
          <h4>个人中心</h4>
          <p>管理个人信息</p>
        </div>
      </div>
    </div>

    <!-- 推荐商品 -->
    <div class="recommend-section">
      <div class="section-header">
        <h2>🌟 推荐商品</h2>
        <el-button text @click="goToProducts">查看更多 →</el-button>
      </div>
      <div v-loading="loading" class="product-grid">
        <div
            v-for="product in recommendProducts"
            :key="product.id"
            class="product-card"
            @click="goToProductDetail(product.id)"
        >
          <div class="product-image">
            <img :src="product.mainImage" :alt="product.productName">
            <div class="tags">
              <el-tag v-if="product.isHot" type="danger" size="small">热卖</el-tag>
              <el-tag v-if="product.isNew" type="success" size="small">新品</el-tag>
            </div>
          </div>
          <div class="product-info">
            <h4>{{ product.productName }}</h4>
            <p class="subtitle">{{ product.subTitle }}</p>
            <div class="price-section">
              <span class="price">¥{{ product.price }}</span>
              <span class="sales">已售{{ product.sales }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <footer class="footer">
      <p>© 2025 天文器材商城 - 探索宇宙的起点</p>
    </footer>
  </div>
</template>

<script setup>
import { getToken } from '@/utils/auth'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRecommendProducts } from '@/api/product'
import { getCartList } from '@/api/cart'
import {
  Grid, Picture, Reading, ChatDotRound, ShoppingCart,
  List, User, SwitchButton, Setting, Bell  // 🔔 添加 Bell 图标
} from '@element-plus/icons-vue'

// 🔔 新增: 导入通知铃铛组件
import NotificationBell from '@/components/NotificationBell.vue'

// ========================================
const isAdmin = computed(() => {
  return userStore.userInfo?.role === 1
})
const router = useRouter()
const userStore = useUserStore()

// ========================================
// 响应式数据
// ========================================
const loading = ref(false)
const recommendProducts = ref([])
const cartCount = ref(0)

const banners = [
  { title: '探索星空的利器', subtitle: '专业天文望远镜 | 高清成像 | 精准追踪', image: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1200' },
  { title: 'AI智能识别', subtitle: '上传星图 | 自动识别 | 器材推荐', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200' },
  { title: '天文课程学习', subtitle: 'NASA每日图片 | 观测指南 | 专业课程', image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200' }
]

// ========================================
// 计算属性
// ========================================
const isLoggedIn = computed(() => {
  const token = getToken()
  return !!token && userStore.isLoggedIn
})
const userName = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户')
const userAvatar = computed(() => userStore.userInfo?.avatar || '/images/default_avatar.png')

// ========================================
// 方法
// ========================================
const loadCartCount = async () => {
  const token = getToken()
  if (!token) return

  try {
    const res = await getCartList()
    cartCount.value = res.data?.length || 0
  } catch (error) {
    console.error('加载购物车数量失败:', error)
    cartCount.value = 0
  }
}

const loadRecommendProducts = async () => {
  loading.value = true
  try {
    const res = await getRecommendProducts(1, 8)
    recommendProducts.value = res.data.records
  } catch (error) {
    console.error('加载推荐商品失败', error)
  } finally {
    loading.value = false
  }
}

// 跳转方法
const goToProducts = () => router.push('/products')
const goToProductDetail = (id) => router.push(`/product/${id}`)
const goToCart = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push('/cart')
}
const goToAdmin = () => {
  router.push('/admin/statistics')
}
const goToOrders = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push('/order/list')
}

// ✅ 新增: 跳转到我的评价
const goToMyReviews = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push('/review/my')
}

const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')
const goToAI = () => ElMessage.info('AI识别功能开发中...')
const goToCourses = () => ElMessage.info('课程学习功能开发中...')
const goToForum = () => ElMessage.info('论坛功能开发中...')

// 用户菜单操作
const handleCommand = (command) => {
  switch (command) {
    case 'admin':
      goToAdmin()
      break
    case 'profile':
      router.push('/profile')
      break
    case 'cart':
      goToCart()
      break
    case 'orders':
      goToOrders()
      break
    case 'reviews':
      goToMyReviews()
      break
    case 'notification-settings':  // 🔔 新增: 通知设置
      router.push('/notification/settings')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    cartCount.value = 0
    await userStore.logout()
    ElMessage.success('已退出登录')
  } catch (error) {
    console.log('取消退出')
  }
}

// ========================================
// 监听器
// ========================================
watch(() => userStore.isLoggedIn, (newVal) => {
  if (newVal) loadCartCount()
  else cartCount.value = 0
}, { immediate: true })

// ========================================
// 生命周期
// ========================================
onMounted(async () => {
  await userStore.restoreLogin()
  if (isLoggedIn.value) loadCartCount()
  loadRecommendProducts()
})
</script>

<style scoped lang="scss">
.home-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    font-weight: bold;
    color: #409EFF;
    cursor: pointer;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.05);
    }

    .logo-icon {
      font-size: 30px;
    }
  }

  .nav-menu {
    display: flex;
    gap: 30px;

    .nav-item {
      color: #606266;
      text-decoration: none;
      font-size: 16px;
      transition: color 0.3s;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 0;
        height: 2px;
        background: #409EFF;
        transition: width 0.3s;
      }

      &:hover,
      &.active {
        color: #409EFF;

        &::after {
          width: 100%;
        }
      }
    }
  }

  .header-right {
    min-width: 250px;
    display: flex;
    justify-content: flex-end;

    .logged-in-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .cart-badge {
      :deep(.el-badge__content) {
        background-color: #f56c6c;
        border: none;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 5px 15px;
      border-radius: 20px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .username {
        font-size: 14px;
        color: #606266;
        max-width: 100px;
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

// 下拉菜单图标样式
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

// 过渡动画
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.banner-section {
  margin-bottom: 40px;

  .banner-item {
    width: 100%;
    height: 500px;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
    }

    .banner-content {
      position: relative;
      text-align: center;
      color: #fff;

      h1 {
        font-size: 48px;
        margin-bottom: 20px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }

      p {
        font-size: 24px;
        margin-bottom: 30px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      }
    }
  }
}

.quick-entry {
  max-width: 1400px;
  margin: 0 auto 60px;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;

  .entry-item {
    background: #fff;
    padding: 40px 20px;
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    &:hover {
      transform: translateY(-10px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    h3 {
      margin: 15px 0 10px;
      font-size: 20px;
    }

    p {
      color: #909399;
      font-size: 14px;
    }
  }
}

// ✅ 新增: 用户中心区域样式
.user-center {
  max-width: 1400px;
  margin: 0 auto 60px;
  padding: 0 20px;

  .section-header {
    margin-bottom: 30px;

    h2 {
      font-size: 28px;
      color: #303133;
    }
  }

  .user-entry {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;

    .user-entry-item {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      color: #fff;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
      }

      &:nth-child(1) {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &:nth-child(2) {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &:nth-child(3) {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &:nth-child(4) {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }

      h4 {
        margin: 12px 0 8px;
        font-size: 18px;
        font-weight: bold;
      }

      p {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }
}

.recommend-section {
  max-width: 1400px;
  margin: 0 auto 60px;
  padding: 0 20px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    h2 {
      font-size: 28px;
      color: #303133;
    }
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    min-height: 200px;

    .product-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      &:hover {
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        transform: translateY(-5px);
      }

      .product-image {
        position: relative;
        width: 100%;
        height: 250px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        &:hover img {
          transform: scale(1.1);
        }

        .tags {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          gap: 5px;
        }
      }

      .product-info {
        padding: 15px;

        h4 {
          font-size: 16px;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          min-height: 44px;
        }

        .subtitle {
          font-size: 12px;
          color: #909399;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-section {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .price {
            font-size: 22px;
            color: #f56c6c;
            font-weight: bold;
          }

          .sales {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }
}

.footer {
  background: #303133;
  color: #fff;
  text-align: center;
  padding: 40px 20px;
  margin-top: 60px;
}

@media (max-width: 1200px) {
  .quick-entry,
  .user-center .user-entry,
  .recommend-section .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .header {
    .nav-menu {
      display: none;
    }
  }

  .banner-section .banner-item {
    height: 350px;

    .banner-content {
      h1 {
        font-size: 32px;
      }

      p {
        font-size: 16px;
      }
    }
  }

  .quick-entry,
  .user-center .user-entry,
  .recommend-section .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>