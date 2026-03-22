// src/api/course.js
import request from '@/utils/request'

/**
 * 天文课程 用户端 API
 * 文件路径: src/api/course.js
 *
 * v8.26 更新:
 *   - 5.6 新增 submitReview / getMyReview（评价功能）
 *   - getCourseReviews 从「占位空返回」升级为真实分页接口
 *
 * 接口列表:
 *   getCourseList          GET    /course/list                  课程列表(分页+筛选)
 *   getCourseDetail        GET    /course/{id}                  课程详情(含章节列表)
 *   getCourseChapter       GET    /course/chapter/{chId}        章节内容(同时记录进度)
 *   toggleCourseFavorite   POST   /course/favorite/toggle/{id}  收藏/取消(幂等)
 *   getCourseFavoriteList  GET    /course/favorite/list         我的收藏列表
 *   getCourseHistory       GET    /course/history               学习历史(按最近时间倒序)
 *   getRecommendCourses    GET    /course/recommend             推荐课程(基于购买商品标签，热门兜底)
 *   getCourseReviews       GET    /course/{id}/reviews          评价列表(分页) ✅5.6真实接口
 *   submitReview           POST   /course/{id}/review           提交评价       ✅5.6新增
 *   getMyReview            GET    /course/{id}/review/my        查询我的评价   ✅5.6新增
 */

/**
 * 获取课程列表
 * @param {Object} params 查询参数
 * @param {number} params.pageNum   页码（默认1）
 * @param {number} params.pageSize  每页条数（默认12）
 * @param {number} [params.type]    课程类型（0-视频课 1-书本课）
 * @param {number} [params.difficulty] 难度（1-入门 2-进阶 3-高级）
 * @param {string} [params.keyword] 关键词搜索
 * @param {string} [params.tags]    多标签AND筛选（逗号分隔）
 */
export function getCourseList(params) {
    return request({ url: '/course/list', method: 'get', params })
}

/**
 * 获取课程详情（含章节目录，不含正文）
 * @param {number} id 课程ID
 */
export function getCourseDetail(id) {
    return request({ url: `/course/${id}`, method: 'get' })
}

/**
 * 获取章节完整内容（含 videoUrl 或 content 正文）
 * 副作用：登录用户自动记录学习进度，检测完课
 * @param {number} chapterId 章节ID
 */
export function getCourseChapter(chapterId) {
    return request({ url: `/course/chapter/${chapterId}`, method: 'get' })
}

/**
 * 收藏/取消收藏课程（幂等）
 * @param {number} id 课程ID
 * @returns {{ isFavorite: boolean, message: string }}
 */
export function toggleCourseFavorite(id) {
    return request({ url: `/course/favorite/toggle/${id}`, method: 'post' })
}

/**
 * 我的课程收藏列表
 * @param {number} pageNum  页码（默认1）
 * @param {number} pageSize 每页条数（默认12）
 */
export function getCourseFavoriteList(pageNum = 1, pageSize = 12) {
    return request({ url: '/course/favorite/list', method: 'get', params: { pageNum, pageSize } })
}

/**
 * 我的学习历史（按最近时间倒序）
 * @param {number} pageNum  页码（默认1）
 * @param {number} pageSize 每页条数（默认10）
 */
export function getCourseHistory(pageNum = 1, pageSize = 10) {
    return request({ url: '/course/history', method: 'get', params: { pageNum, pageSize } })
}

/**
 * 推荐课程（基于用户近3个月购买商品tags，无购买时返回热门）
 */
export function getRecommendCourses() {
    return request({ url: '/course/recommend', method: 'get' })
}

/**
 * 课程评价列表（分页，status=1 正常评价，按时间倒序）✅5.6真实接口
 * @param {number} courseId 课程ID
 * @param {number} pageNum  页码（默认1）
 * @param {number} pageSize 每页条数（默认10）
 */
export function getCourseReviews(courseId, pageNum = 1, pageSize = 10) {
    return request({
        url: `/course/${courseId}/reviews`,
        method: 'get',
        params: { pageNum, pageSize }
    })
}

/**
 * 提交课程评价（需登录，每课每人只能评一次）✅5.6新增
 * @param {number} courseId 课程ID
 * @param {Object} data
 * @param {number} data.rating   评分(1-5星)
 * @param {string} [data.content] 评价内容（可选）
 */
export function submitReview(courseId, data) {
    return request({
        url: `/course/${courseId}/review`,
        method: 'post',
        data
    })
}

/**
 * 查询当前用户对该课程的评价 ✅5.6新增
 * 未评时 res.data = null；已评时返回评价对象
 * @param {number} courseId 课程ID
 */
export function getMyReview(courseId) {
    return request({
        url: `/course/${courseId}/review/my`,
        method: 'get'
    })
}


// 我的课程评价列表
export function getMyCourseReviews(pageNum = 1, pageSize = 10) {
    return request({ url: '/course/review/my/list', method: 'get', params: { pageNum, pageSize } })
}

// 编辑课程评价
export function updateCourseReview(courseId, data) {
    return request({ url: `/course/${courseId}/review`, method: 'put', data })
}
