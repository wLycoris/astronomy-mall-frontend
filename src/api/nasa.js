// src/api/nasa.js
import request from '@/utils/request'

/**
 * NASA API 封装
 *
 * 📌 对应后端: NasaController (module/nasa/)
 * 📌 所有接口均为公开接口（无需登录），已在 WebMvcConfig 白名单中排除 JWT 拦截
 * 📌 使用方: ApodCard.vue（商城首页）、APODSyncScheduler（后端定时任务，不经过此 js）
 */

/**
 * 获取今日 NASA 每日天文图片 (APOD)
 *
 * 📌 后端带当日内存缓存，前端可放心频繁调用
 * 📌 返回数据结构：
 * {
 *   date: "2024-03-15",       // 日期
 *   title: "...",             // 标题（英文）
 *   explanation: "...",       // 详细说明（英文长文）
 *   url: "...",               // 标清图片/视频 URL
 *   hdurl: "...",             // 高清图片 URL（video 类型为 null）
 *   mediaType: "image",       // "image" 或 "video"
 *   copyright: "..."          // 版权（可为 null）
 * }
 * 📌 失败处理：接口返回 data=null 时，ApodCard.vue 设置 loadFailed=true 静默隐藏
 *
 * @returns {Promise}
 */
export const getTodayApod = () => {
    return request({
        url: '/nasa/apod',
        method: 'get'
    })
}