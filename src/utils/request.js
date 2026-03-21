import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
import router from '@/router'

const request = axios.create({
    baseURL: '/api',
    timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        const token = getToken() // ✅ 从 Cookies 读取

        console.log('=== 请求拦截器 ===')
        console.log('请求URL:', config.url)
        console.log('Token:', token ? '存在' : '不存在')

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
            console.log('已添加Authorization头')
        }

        return config
    },
    error => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
// ⭐⭐⭐ 关键：如果是文件流，直接返回
        if (response.config.responseType === 'blob') {
            return response.data
        }
        const res = response.data

        console.log('=== 响应拦截器 ===')
        console.log('响应code:', res.code)

        if (res.code !== 200) {
            if (res.code === 401) {
                removeToken() // ✅ 清除 Cookies
                // ✅ 只有当前路由需要登录时才跳转，否则静默忽略
                // 适用场景：首页/课程列表/课程详情等支持游客访问的页面
                // 即使接口返回401，也不应该把用户踢到登录页
                if (router.currentRoute.value.meta.requiresAuth) {
                    ElMessage.error('登录已过期,请重新登录')
                    router.push('/login')
                }
                return Promise.reject(new Error('未登录'))
            }

            ElMessage.error(res.message || '请求失败')
            return Promise.reject(new Error(res.message || '请求失败'))
        }

        return res
    },
    error => {
        console.error('响应错误:', error)

        if (error.response?.status === 401) {
            removeToken()
            // ✅ 同上，只有需要登录的页面才跳转
            if (router.currentRoute.value.meta.requiresAuth) {
                ElMessage.error('未登录或登录已过期')
                router.push('/login')
            }
        } else {
            ElMessage.error(error.message || '网络错误')
        }

        return Promise.reject(error)
    }
)

export default request