import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { getMaintenanceSetting } from '@/api/admin/setting'

const routes = [
    {
        path: '/',
        redirect: '/home'
    },

    // ============================================
    // 维护模式页面（不需要登录，任何人都能看到）
    // ============================================
    {
        path: '/maintenance',
        name: 'Maintenance',
        component: () => import('@/views/MaintenancePage.vue'),
        meta: { title: '系统维护中' }
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
    // 天文课程模块 ← 5.1 新增
    // requiresAuth: false，游客可浏览，登录后有进度/收藏
    // ============================================
    {
        path: '/course',
        name: 'CourseList',
        component: () => import('@/views/course/CourseList.vue'),
        meta: { title: '天文课程', requiresAuth: false }
    },
    {
        path: '/course/:id',
        name: 'CourseDetail',
        component: () => import('@/views/course/CourseDetail.vue'),
        meta: { title: '课程详情', requiresAuth: false }
    },

    // ============================================
    // 天文观测点地图 ← 6.1 新增
    // requiresAuth: false，未登录可浏览；评分/签到在页面内部判断登录态
    // ============================================
    {
        path: '/location',
        name: 'ObservationMap',
        component: () => import('@/views/location/ObservationMap.vue'),
        meta: { title: '天文观测点', requiresAuth: false }
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
    // 通知相关页面 (需要登录)
    // ============================================
    {
        path: '/notification/settings',
        name: 'NotificationSettings',
        component: () => import('@/components/NotificationSettings.vue'),
        meta: { title: '通知设置', requiresAuth: true }
    },
    {
        path: '/notice/detail',
        name: 'NoticeDetail',
        component: () => import('@/views/notice/NoticeDetail.vue'),
        meta: { title: '公告详情', requiresAuth: true }
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
    // 售后服务独立页面 (需要登录)
    // ============================================
    {
        path: '/after-sale/installation',
        name: 'InstallationList',
        component: () => import('@/views/afterSale/InstallationList.vue'),
        meta: { title: '安装预约', requiresAuth: true }
    },
    {
        path: '/after-sale/recycling',
        name: 'RecyclingList',
        component: () => import('@/views/afterSale/RecyclingList.vue'),
        meta: { title: '二手回收', requiresAuth: true }
    },

    // ============================================
    // AI 星图识别模块 ← 4.1 / 4.2 新增
    // ============================================
    {
        path: '/recognition',
        name: 'StarRecognition',
        component: () => import('@/views/recognition/StarRecognition.vue'),
        meta: { title: 'AI星图识别', requiresAuth: true }
    },
    {
        // ⚠️ 必须放在 /recognition/:id 之前
        path: '/recognition/waiting',
        name: 'RecognitionWaiting',
        component: () => import('@/views/recognition/RecognitionWaiting.vue'),
        meta: { title: '识别等待中', requiresAuth: true }
    },
    {
        // ⚠️ 同上，需在 /recognition/:id 之前
        path: '/recognition/result',
        name: 'RecognitionResult',
        component: () => import('@/views/recognition/RecognitionResult.vue'),
        meta: { title: '识别结果', requiresAuth: true }
    },
    {
        path: '/recognition/history',
        name: 'RecognitionHistory',
        component: () => import('@/views/recognition/RecognitionHistory.vue'),
        meta: { title: '识别历史', requiresAuth: true }
    },

    // ============================================
    // 后台管理路由
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
            {
                path: 'setting',
                name: 'SystemSetting',
                component: () => import('@/views/admin/SystemSetting.vue'),
                meta: { title: '系统设置', requiresAdmin: true }
            },
            {
                path: 'installation',
                name: 'AdminInstallation',
                component: () => import('@/views/admin/InstallationManage.vue'),
                meta: { title: '安装预约管理', requiresAdmin: true }
            },
            {
                path: 'recycling',
                name: 'AdminRecycling',
                component: () => import('@/views/admin/RecyclingManage.vue'),
                meta: { title: '二手回收管理', requiresAdmin: true }
            },
            {
                path: 'announcement',
                name: 'AdminAnnouncement',
                component: () => import('@/views/admin/AnnouncementManage.vue'),
                meta: { title: '系统公告', requiresAdmin: true }
            },
            {
                path: 'notification-record',
                name: 'NotificationRecord',
                component: () => import('@/views/admin/NotificationRecord.vue'),
                meta: { title: '通知记录', requiresAdmin: true }
            },
            {
                path: 'notification-template',
                name: 'NotificationTemplate',
                component: () => import('@/views/admin/NotificationTemplate.vue'),
                meta: { title: '通知模板', requiresAdmin: true }
            },
            // ── 课程管理 ← 5.5 已启用 ──────────────────────────
            {
                path: 'course',
                name: 'AdminCourse',
                component: () => import('@/views/admin/CourseManage.vue'),
                meta: { title: '课程管理', requiresAdmin: true }
            },
            // ── 课程评价管理 ← 5.6 新增 ─────────────────────────
            {
                path: 'course-review',
                name: 'AdminCourseReview',
                component: () => import('@/views/admin/AdminCourseReview.vue'),
                meta: { title: '课程评价管理', requiresAdmin: true }
            }
            // ── 观测点管理 ← 6.5 完成 ─────────────────────────
            ,{
                path: 'location',
                name: 'AdminLocation',
                component: () => import('@/views/admin/ObservationSpotManage.vue'),
                meta: { title: '观测点管理', requiresAdmin: true }
            }
        ]
    },

    // ============================================
    // 个人中心路由
    // ============================================
    {
        path: '/user',
        component: () => import('@/views/user/UserLayout.vue'),
        redirect: '/user/overview',
        meta: { requiresAuth: true },
        children: [
            {
                path: 'overview',
                name: 'UserOverview',
                component: () => import('@/views/user/UserOverview.vue'),
                meta: { title: '个人概览', requiresAuth: true }
            },
            {
                path: 'orders',
                name: 'UserOrders',
                component: () => import('@/views/order/OrderList.vue'),
                meta: { title: '我的订单', requiresAuth: true }
            },
            {
                path: 'address',
                name: 'UserAddress',
                component: () => import('@/views/user/UserAddress.vue'),
                meta: { title: '收货地址', requiresAuth: true }
            },
            {
                path: 'reviews',
                name: 'UserReviews',
                component: () => import('@/views/review/MyReviews.vue'),
                meta: { title: '我的评价', requiresAuth: true }
            },
            {
                path: 'wallet',
                name: 'UserWallet',
                component: () => import('@/views/user/Wallet.vue'),
                meta: { title: '我的钱包', requiresAuth: true }
            },
            {
                path: 'settings',
                name: 'UserSettings',
                component: () => import('@/views/user/AccountSettings.vue'),
                meta: { title: '账号设置', requiresAuth: true }
            },
            {
                path: 'installation',
                name: 'UserInstallation',
                component: () => import('@/views/afterSale/InstallationList.vue'),
                meta: { title: '安装预约', requiresAuth: true }
            },
            {
                path: 'service-reminder',
                name: 'ServiceReminderList',
                component: () => import('@/views/afterSale/ServiceReminderList.vue'),
                meta: { title: '器材保养提醒', requiresAuth: true }
            },
            {
                path: 'recycling',
                name: 'UserRecycling',
                component: () => import('@/views/afterSale/RecyclingList.vue'),
                meta: { title: '二手回收', requiresAuth: true }
            },
            {
                path: 'favorites',
                name: 'UserFavorites',
                component: () => import('@/views/user/UserFavorite.vue'),
                meta: { title: '我的收藏', requiresAuth: true }
            },
            {
                path: 'recognition',
                name: 'UserRecognition',
                component: () => import('@/views/recognition/RecognitionHistory.vue'),
                meta: { title: '识别历史', requiresAuth: true }
            },
            // ── 课程收藏 / 学习历史 ← 5.3 新增 ──────────────
            {
                path: 'course-favorite',
                name: 'CourseFavorite',
                component: () => import('@/views/user/CourseFavorite.vue'),
                meta: { title: '课程收藏', requiresAuth: true }
            },
            {
                path: 'course-history',
                name: 'CourseHistory',
                component: () => import('@/views/user/CourseHistory.vue'),
                meta: { title: '学习历史', requiresAuth: true }
            },
            // ── 课程评价 ← 5.6 新增 ──────────────────────────
            {
                path: 'course-reviews',
                name: 'MyCourseReviews',
                component: () => import('@/views/user/MyCourseReviews.vue'),
                meta: { title: '我的课程评价', requiresAuth: true }
            }
            // ── 签到历史 ← 6.3 新增 ──────────────────────────
            ,{
                path: 'checkin-history',
                name: 'CheckinHistory',
                component: () => import('@/views/location/CheckinHistory.vue'),
                meta: { title: '我的足迹', requiresAuth: true }
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

// 维护模式缓存（60秒TTL，避免每次路由跳转都请求接口）
let maintenanceCache = null
let maintenanceCacheTime = 0
const CACHE_TTL = 60 * 1000

const checkMaintenance = async () => {
    const now = Date.now()
    if (maintenanceCache !== null && now - maintenanceCacheTime < CACHE_TTL) {
        return maintenanceCache
    }
    try {
        const res = await getMaintenanceSetting()
        const mode = res.data.maintenanceMode === true || res.data.maintenanceMode === 'true'
        maintenanceCache = mode
        maintenanceCacheTime = now
        return mode
    } catch (e) {
        return false
    }
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
    document.title = to.meta.title || '天文器材商城'

    const token = getToken()
    const isLoggedIn = !!token

    // 1. 维护模式判断（管理员、登录注册页跳过）
    if (to.path !== '/maintenance' && !to.path.startsWith('/admin')
        && to.path !== '/login' && to.path !== '/register') {
        let isAdmin = false
        if (isLoggedIn) {
            const userStore = useUserStore()
            if (!userStore.userInfo) {
                try { await userStore.fetchUserInfo() } catch (e) {}
            }
            isAdmin = userStore.userInfo?.role === 1
        }
        if (!isAdmin) {
            const inMaintenance = await checkMaintenance()
            if (inMaintenance) {
                next('/maintenance')
                return
            }
        }
    }

    // 2. 登录/注册页：已登录则跳首页
    if (to.path === '/login' || to.path === '/register') {
        if (isLoggedIn) {
            next('/home')
        } else {
            next()
        }
        return
    }

    // 3. 后台管理页面：必须是管理员
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
            ElMessage.error('您不是管理员，无权访问后台')
            next('/home')
            return
        }

        next()
        return
    }

    // 4. 需要登录的页面
    if (to.meta.requiresAuth && !isLoggedIn) {
        next({
            path: '/login',
            query: { redirect: to.fullPath }
        })
        return
    }

    // 5. 其他正常放行
    next()
})

export default router