// src/api/course.js
import request from '@/utils/request'

/**
 * 天文课程 用户端 API
 * 对应后端: CourseController (module/course/)
 *
 * 接口列表:
 *   getCourseList          GET    /course/list                  课程列表(分页+筛选)
 *   getCourseDetail        GET    /course/{id}                  课程详情(含章节目录)
 *   getCourseChapter       GET    /course/chapter/{chId}        章节内容(自动记录进度)
 *   toggleCourseFavorite   POST   /course/favorite/toggle/{id}  收藏/取消(幂等)
 *   getCourseFavoriteList  GET    /course/favorite/list         我的收藏列表
 *   getCourseHistory       GET    /course/history               学习历史
 *   getCourseReviews       GET    /course/{id}/reviews          评价列表(占位)
 *
 * 📌 多标签AND筛选说明:
 * tags 参数传选中标签数组，前端调用前 join(',') 处理
 * 示例: ['深空摄影', '望远镜使用'] → tags='深空摄影,望远镜使用'
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
 * 课程评价列表（本期占位，后端返回空列表）
 * @param {number} id 课程ID
 */
export function getCourseReviews(id) {
    return request({ url: `/course/${id}/reviews`, method: 'get' })
}