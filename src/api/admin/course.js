/**
 * 天文课程 管理员端 API
 * 文件路径: src/api/admin/course.js
 *
 * v8.26 更新:
 *   - 5.6 新增 getAdminCourseReviews / deleteCourseReview / getCourseReviewStats
 *
 * 接口列表:
 *   getAdminCourseList      GET    /admin/course/list              课程列表
 *   addCourse               POST   /admin/course/add               新增课程
 *   updateCourse            PUT    /admin/course/update/{id}       编辑课程
 *   deleteCourse            DELETE /admin/course/delete/{id}       删除课程
 *   updateCourseStatus      POST   /admin/course/status/{id}       发布/下架
 *   getCourseChapters       GET    /admin/course/{id}/chapters     章节列表
 *   addChapter              POST   /admin/course/chapter/add       新增章节
 *   updateChapter           PUT    /admin/course/chapter/{id}      编辑章节
 *   deleteChapter           DELETE /admin/course/chapter/{id}      删除章节
 *   sortChapters            POST   /admin/course/chapter/sort      章节排序
 *   syncApod                POST   /admin/course/apod/sync         手动触发APOD同步
 *   getAdminCourseReviews   GET    /admin/course/reviews           评价列表  ✅5.6新增
 *   deleteCourseReview      DELETE /admin/course/review/{id}       删除评价  ✅5.6新增
 *   getCourseReviewStats    GET    /admin/course/review/stats      评价统计  ✅5.6新增
 */
import request from '@/utils/request'

// ============================================================
// =================== 课程管理接口（5个）=====================
// ============================================================

/**
 * 1. 获取课程列表（分页 + 关键词 + type + status 筛选）
 * @param {Object} params
 * @param {number} params.pageNum    - 页码（默认1）
 * @param {number} params.pageSize   - 每页条数（默认10）
 * @param {string} [params.keyword]  - 标题关键词搜索
 * @param {number} [params.type]     - 课程类型：0-视频课 1-书本课
 * @param {number} [params.status]   - 状态：0-草稿 1-已发布
 */
export function getCourseList(params) {
    return request({
        url: '/admin/course/list',
        method: 'get',
        params
    })
}

/**
 * 2. 新增课程
 * @param {Object} data
 * @param {string} data.title        - 课程标题（必填）
 * @param {string} [data.subtitle]   - 副标题
 * @param {string} [data.cover]      - 封面图URL
 * @param {number} data.type         - 课程类型：0-视频课 1-书本课（必填）
 * @param {number} [data.difficulty] - 难度：1-入门 2-进阶 3-高级
 * @param {string[]} [data.tags]     - 标签数组，如 ["深空摄影", "望远镜"]
 * @param {number} [data.sort]       - 排序值（越大越靠前）
 */
export function addCourse(data) {
    return request({
        url: '/admin/course/add',
        method: 'post',
        data
    })
}

/**
 * 3. 编辑课程基本信息
 * @param {number} id    - 课程ID
 * @param {Object} data  - 同 addCourse 参数，只传需要修改的字段
 */
export function updateCourse(id, data) {
    return request({
        url: `/admin/course/update/${id}`,
        method: 'put',
        data
    })
}

/**
 * 4. 删除课程（逻辑删除，deleted=1）
 * @param {number} id - 课程ID
 */
export function deleteCourse(id) {
    return request({
        url: `/admin/course/delete/${id}`,
        method: 'delete'
    })
}

/**
 * 5. 发布 / 下架课程
 * @param {number} id     - 课程ID
 * @param {number} status - 目标状态：0-下架（草稿）1-发布
 */
export function updateCourseStatus(id, status) {
    return request({
        url: `/admin/course/status/${id}`,
        method: 'post',
        params: { status }
    })
}

// ============================================================
// =================== 章节管理接口（5个）=====================
// ============================================================

/**
 * 6. 获取课程章节列表
 * @param {number} courseId - 课程ID
 */
export function getChapterList(courseId) {
    return request({
        url: `/admin/course/${courseId}/chapters`,
        method: 'get'
    })
}

/**
 * 7. 新增章节
 * @param {Object} data
 * @param {number} data.courseId     - 所属课程ID（必填）
 * @param {string} data.title        - 章节标题（必填）
 * @param {number} data.type         - 内容类型：0-视频 1-图文（必填）
 * @param {string} [data.videoUrl]   - 视频嵌入URL（type=0时必填，已是完整embed URL）
 * @param {string} [data.content]    - 富文本内容（type=1时有值，TinyMCE HTML）
 * @param {number} [data.duration]   - 预计学习时长（分钟）
 * @param {number} [data.sort]       - 排序值（不传则自动追加到末尾）
 */
export function addChapter(data) {
    return request({
        url: '/admin/course/chapter/add',
        method: 'post',
        data
    })
}

/**
 * 8. 编辑章节
 * @param {number} id    - 章节ID
 * @param {Object} data  - 同 addChapter 参数，只传需要修改的字段
 */
export function updateChapter(id, data) {
    return request({
        url: `/admin/course/chapter/${id}`,
        method: 'put',
        data
    })
}

/**
 * 9. 删除章节
 * @param {number} id - 章节ID
 */
export function deleteChapter(id) {
    return request({
        url: `/admin/course/chapter/${id}`,
        method: 'delete'
    })
}

/**
 * 10. 批量更新章节排序（拖拽排序）
 * @param {Array} sortList - 排序列表，格式: [{id: 1, sort: 0}, {id: 2, sort: 1}, ...]
 */
export function sortChapters(sortList) {
    return request({
        url: '/admin/course/chapter/sort',
        method: 'post',
        data: sortList
    })
}

// ============================================================
// =================== APOD 批量同步接口（1个）================
// ============================================================

/**
 * 11. 手动触发 APOD 历史数据批量同步
 * 逐日拉取 NASA APOD API，已存在日期自动跳过（幂等）
 * 单次同步范围建议 ≤ 30 天，服务端限制 ≤ 60 天
 *
 * @param {Object} data
 * @param {string} data.startDate - 开始日期（含），格式: "yyyy-MM-dd"，APOD最早 1995-06-16
 * @param {string} data.endDate   - 结束日期（含），格式: "yyyy-MM-dd"，不能晚于今天
 * @returns {{ newCount: number }} - 本次新增章节数量
 */
export function syncApod(data) {
    return request({
        url: '/admin/course/apod/sync',
        method: 'post',
        data
    })
}

// ✅ 5.6 新增：课程评价列表（分页 + 多条件筛选）
// params: pageNum / pageSize / courseId(可选) / rating(0-5，可选) / keyword(可选)
export function getAdminCourseReviews(params) {
    return request({ url: '/admin/course/reviews', method: 'get', params })
}

// ✅ 5.6 新增：逻辑删除课程评价（status=0，需二次确认）
export function deleteCourseReview(id) {
    return request({ url: `/admin/course/review/${id}`, method: 'delete' })
}

// ✅ 5.6 新增：课程评价统计（顶部3个统计卡片）
// 返回: { total, thisWeek, avgRating }
export function getCourseReviewStats() {
    return request({ url: '/admin/course/review/stats', method: 'get' })
}