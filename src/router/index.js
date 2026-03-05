import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    // ============================================
    // 用户相关页面 (不需要登录)
    // ============================================
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { title: '登录' }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/Register.vue'),
        meta: { title: '注册' }
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
    },

    // ============================================
    // 商品相关页面 (不需要登录)
    // ============================================
    {
        path: '/products',
        name: 'ProductList',
        component: () => import('@/views/product/ProductList.vue'),
        meta: { title: '商品列表' }
    },
    {
        path: '/product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/product/ProductDetail.vue'),
        meta: { title: '商品详情' }
    },
    {
        path: '/category/:categoryId',
        name: 'CategoryProducts',
        component: () => import('@/views/product/ProductList.vue'),
        meta: { title: '分类商品' }
    },

    // ============================================
    // 评价相关页面 (需要登录)
    // ============================================
    {
        path: '/review/publish',
        name: 'PublishReview',
        component: () => import('@/views/review/PublishReview.vue'),
        meta: { title: '发布评价', requiresAuth: true }
    },
    {
        path: '/review/my',
        name: 'MyReviews',
        component: () => import('@/views/review/MyReviews.vue'),
        meta: { title: '我的评价', requiresAuth: true }
    },

    // ============================================
    // 🔔 通知相关页面 (需要登录)
    // ============================================
    {
        path: '/notification/settings',
        name: 'NotificationSettings',
        component: () => import('@/components/NotificationSettings.vue'),
        meta: { title: '通知设置', requiresAuth: true }
    },

    // ============================================
    // 购物车相关页面 (需要登录)
    // ============================================
    {
        path: '/cart',
        name: 'Cart',
        component: () => import('@/views/cart/CartPage.vue'),
        meta: { title: '购物车', requiresAuth: true }
    },

    // ============================================
    // 订单相关页面 (需要登录)
    // ============================================
    {
        path: '/order/checkout',
        name: 'OrderCheckout',
        component: () => import('@/views/order/CheckoutPage.vue'),
        meta: { title: '订单结算', requiresAuth: true }
    },
    {
        path: '/order/list',
        name: 'OrderList',
        component: () => import('@/views/order/OrderList.vue'),
        meta: { title: '我的订单', requiresAuth: true }
    },
    {
        path: '/order/detail/:id?',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
    },

    // ============================================
    // 支付相关页面 (需要登录)
    // ============================================
    {
        path: '/payment',
        name: 'Payment',
        component: () => import('@/views/payment/PaymentPage.vue'),
        meta: { title: '支付订单', requiresAuth: true }
    },
    {
        path: '/payment/refund',
        name: 'Refund',
        component: () => import('@/views/payment/RefundPage.vue'),
        meta: { title: '申请退款', requiresAuth: true }
    },

    // ============================================
    // 🆕 后台管理路由
    // ============================================
    {
        path: '/admin',
        component: () => import('@/views/admin/AdminLayout.vue'),
        redirect: '/admin/statistics',
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
            {
                path: 'statistics',
                name: 'AdminStatistics',
                component: () => import('@/views/admin/Statistics.vue'),
                meta: { title: '数据统计', requiresAdmin: true }
            },
            {
                path: 'product',
                name: 'AdminProduct',
                component: () => import('@/views/admin/ProductManage.vue'),
                meta: { title: '商品管理', requiresAdmin: true }
            },
            {
                path: 'order',
                name: 'AdminOrder',
                component: () => import('@/views/admin/OrderManage.vue'),
                meta: { title: '订单管理', requiresAdmin: true }
            },
            {
                path: 'refund',
                name: 'AdminRefund',
                component: () => import('@/views/admin/RefundManage.vue'),
                meta: { title: '退款审核', requiresAdmin: true }
            },
            {
                path: 'review',
                name: 'AdminReview',
                component: () => import('@/views/admin/ReviewManage.vue'),
                meta: { title: '评价管理', requiresAdmin: true }
            },
            {
                path: 'user',
                name: 'AdminUser',
                component: () => import('@/views/admin/UserManage.vue'),
                meta: { title: '用户管理', requiresAdmin: true }
            },
            {
                path: 'stock-warning',
                name: 'StockWarning',
                component: () => import('@/views/admin/StockWarning.vue'),
                meta: { title: '库存预警', requiresAdmin: true }
            },
            {
                path: 'category',
                name: 'AdminCategory',
                component: () => import('@/views/admin/CategoryManage.vue'),
                meta: { title: '分类管理', requiresAdmin: true }
            },
            {
                path: 'log',
                name: 'AdminLog',
                component: () => import('@/views/admin/LogManage.vue'),
                meta: { title: '操作日志', requiresAdmin: true }
            },
            // 🆕 系统设置
            {
                path: 'setting',
                name: 'SystemSetting',
                component: () => import('@/views/admin/SystemSetting.vue'),
                meta: { title: '系统设置', requiresAdmin: true }
            }
        ]
    },

    // ============================================
    // 404页面
    // ============================================
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: '页面不存在' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
    // 设置页面标题
    document.title = to.meta.title || '天文器材商城'

    const token = getToken()
    const isLoggedIn = !!token

    // 1. 如果访问的是登录或注册页
    if (to.path === '/login' || to.path === '/register') {
        if (isLoggedIn) {
            next('/home')
        } else {
            next()
        }
        return
    }

    // 2. 如果访问后台管理页面 (需要管理员权限)
    if (to.meta.requiresAdmin) {
        if (!isLoggedIn) {
            ElMessage.warning('请先登录')
            next('/login')
            return
        }

        const userStore = useUserStore()
        if (!userStore.userInfo) {
            await userStore.fetchUserInfo()
        }

        if (userStore.userInfo?.role !== 1) {
            ElMessage.error('您不是管理员,无权访问后台')
            next('/home')
            return
        }

        next()
        return
    }

    // 3. 如果页面需要登录
    if (to.meta.requiresAuth && !isLoggedIn) {
        next({
            path: '/login',
            query: { redirect: to.fullPath }
        })
        return
    }

    // 4. 其他情况正常放行
    next()
})

export default router