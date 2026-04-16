// src/api/recommend.js
// 推荐系统模块 - 用户端 API
// 对应后端: RecommendController (module/recommend/)
//
// 📌 8.0 基础建设 (10个接口)
//   POST   /api/recommend/browse                 商品浏览埋点
//   POST   /api/recommend/post/browse            帖子浏览埋点
//   GET    /api/recommend/home                   首页个性化推荐
//   GET    /api/recommend/similar/{productId}    相似商品推荐
//   GET    /api/recommend/cart                   购物车推荐
//   GET    /api/recommend/recognition/{id}/courses  AI识别→课程推荐
//   GET    /api/recommend/course/{id}/next       完课→下一门课程
//   GET    /api/recommend/spot/{id}/equipment    签到→器材推荐
//   GET    /api/recommend/post/recommend         帖子个性化推荐
//   POST   /api/recommend/click                  推荐点击回写

import request from '@/utils/request'

// ============================================================
// ① 商品浏览埋点（8.0 ✅）
// ============================================================
// 在 ProductDetail 页面调用，Redis 30分钟去重
export function logProductBrowse(data) {
  return request({
    url: '/recommend/browse',
    method: 'post',
    data
  })
}

// ============================================================
// ② 帖子浏览埋点（8.0 ✅）
// ============================================================
// 在 ForumDetail 打开时调用，Redis 30分钟去重
export function logPostBrowse(data) {
  return request({
    url: '/recommend/post/browse',
    method: 'post',
    data
  })
}

// ============================================================
// ③ 首页个性化推荐（8.0 ✅）
// ============================================================
// 未登录返回热门商品，登录返回 content×0.6 + cf×0.3 + coldstart×0.1
export function getHomeRecommend(params) {
  return request({
    url: '/recommend/home',
    method: 'get',
    params
  })
}

// ============================================================
// ④ 相似商品推荐（8.0 ✅）
// ============================================================
// 商品详情页下方，基于 tags + category + price 内容相似度
export function getSimilarProducts(productId, params) {
  return request({
    url: `/recommend/similar/${productId}`,
    method: 'get',
    params
  })
}

// ============================================================
// ⑤ 购物车推荐（8.0 ✅）
// ============================================================
// 购物车页面底部，根据购物车商品 tags 推荐互补商品
export function getCartRecommend(params) {
  return request({
    url: '/recommend/cart',
    method: 'get',
    params
  })
}

// ============================================================
// ⑥ AI识别→推荐相关课程（8.0 ✅）
// ============================================================
// RecognitionResult 页面，基于 machine_tags 匹配课程
export function getRecognitionCourseRecommend(recognitionId, params) {
  return request({
    url: `/recommend/recognition/${recognitionId}/courses`,
    method: 'get',
    params
  })
}

// ============================================================
// ⑦ 完课→推荐下一门课程（8.0 ✅）
// ============================================================
// CourseDetail 页面完课后展示
export function getNextCourseRecommend(courseId, params) {
  return request({
    url: `/recommend/course/${courseId}/next`,
    method: 'get',
    params
  })
}

// ============================================================
// ⑧ 签到→推荐适合器材（8.0 ✅）
// ============================================================
// ObservationMap 观测点详情中，基于海拔/光污染推荐
export function getSpotEquipmentRecommend(spotId, params) {
  return request({
    url: `/recommend/spot/${spotId}/equipment`,
    method: 'get',
    params
  })
}

// ============================================================
// ⑨ 帖子个性化推荐（8.3 ✅ 升级为分页排序版）
// ============================================================
// ForumList "推荐" Tab：召回所有候选 → 综合分排序 → 分页切片
// 入参: { pageNum, pageSize }（默认 1 / 50）
// 返回: { list, total, pageNum, pageSize }
export function getPostRecommend(params) {
  return request({
    url: '/recommend/post/recommend',
    method: 'get',
    params
  })
}

// ============================================================
// ⑩ 推荐点击回写（8.0 ✅）
// ============================================================
// 前端点击推荐卡片时调用，回写 is_clicked + click_time
// 用于答辩展示点击率数据
export function recordRecommendClick(data) {
  return request({
    url: '/recommend/click',
    method: 'post',
    data
  })
}
