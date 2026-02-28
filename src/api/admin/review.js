import request from '@/utils/request'

/**
 * 后台评价管理 API
 * 文件路径: src/api/admin/review.js
 */

/**
 * 获取评价列表（分页）
 * @param {Object} params
 * @param {number} params.pageNum    - 页码
 * @param {number} params.pageSize   - 每页数量
 * @param {number} [params.productId] - 商品ID筛选
 * @param {number} [params.rating]   - 评分筛选(1-5)
 * @param {number} [params.status]   - 状态(0已删除 1正常 2待审核)
 * @param {boolean} [params.isTop]   - 是否只看置顶
 * @param {string} [params.keyword]  - 关键词搜索
 * @param {string} [params.startTime] - 开始时间
 * @param {string} [params.endTime]   - 结束时间
 */
export function getReviewList(params) {
    return request({
        url: '/admin/review/list',
        method: 'get',
        params
    })
}

/**
 * 获取评价详情
 * @param {number} id - 评价ID
 */
export function getReviewDetail(id) {
    return request({
        url: `/admin/review/detail/${id}`,
        method: 'get'
    })
}

/**
 * 回复评价
 * @param {number} id   - 评价ID
 * @param {Object} data
 * @param {string} data.reply - 回复内容（必填，最多500字）
 */
export function replyReview(id, data) {
    return request({
        url: `/admin/review/reply/${id}`,
        method: 'post',
        data
    })
}

/**
 * 审核评价
 * @param {number} id   - 评价ID
 * @param {Object} data
 * @param {number} data.action  - 1=审核通过，0=审核拒绝
 * @param {string} [data.remark] - 审核备注
 */
export function auditReview(id, data) {
    return request({
        url: `/admin/review/audit/${id}`,
        method: 'post',
        data
    })
}

/**
 * 置顶/取消置顶评价（自动切换）
 * @param {number} id - 评价ID
 */
export function toggleTopReview(id) {
    return request({
        url: `/admin/review/top/${id}`,
        method: 'post'
    })
}

/**
 * 删除评价
 * @param {number} id - 评价ID
 */
export function deleteReview(id) {
    return request({
        url: `/admin/review/delete/${id}`,
        method: 'delete'
    })
}