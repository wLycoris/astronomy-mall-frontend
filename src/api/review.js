import request from '@/utils/request'

/**
 * 评价相关API
 */

// ============================================
// 基础版接口(保留兼容性)
// ============================================

/**
 * 获取商品评价列表(基础版)
 * @param {Object} params - { productId, pageNum, pageSize }
 */
export function getProductReviews(params) {
    return request({
        url: `/review/list/${params.productId}`,
        method: 'get',
        params: {
            pageNum: params.pageNum || 1,
            pageSize: params.pageSize || 10
        }
    })
}

/**
 * 获取商品评价统计
 * @param {Number} productId - 商品ID
 */
export function getReviewStatistics(productId) {
    return request({
        url: `/review/statistics/${productId}`,
        method: 'get'
    })
}

// ============================================
// 高级版接口(新增)
// ============================================

/**
 * 获取评价列表(高级版 - 支持筛选和排序)
 * @param {Object} params - 查询参数
 * @param {Number} params.productId - 商品ID(必填)
 * @param {Number} params.rating - 星级筛选(0=全部,1-5=对应星级)
 * @param {Number} params.hasImages - 是否有图(0=全部,1=仅看有图)
 * @param {Number} params.sortType - 排序方式(1=最新,2=点赞最多,3=评分最高,4=评分最低)
 * @param {Number} params.page - 页码
 * @param {Number} params.pageSize - 每页数量
 */
export function getReviewListAdvanced(params) {
    return request({
        url: '/review/list/advanced',
        method: 'get',
        params: {
            productId: params.productId,
            rating: params.rating || 0,
            hasImages: params.hasImages || 0,
            sortType: params.sortType || 1,
            page: params.page || 1,
            pageSize: params.pageSize || 10
        }
    })
}

/**
 * 发布评价
 * @param {Object} data - 评价信息
 * @param {Number} data.orderId - 订单ID
 * @param {Number} data.productId - 商品ID
 * @param {Number} data.rating - 评分(1-5星)
 * @param {String} data.content - 评价内容
 * @param {Array} data.images - 图片列表(最多9张)
 * @param {Boolean} data.isAnonymous - 是否匿名
 */
export function publishReview(data) {
    return request({
        url: '/review/publish',
        method: 'post',
        data
    })
}

/**
 * 点赞/取消点赞
 * @param {Number} reviewId - 评价ID
 */
export function toggleLike(reviewId) {
    return request({
        url: `/review/like/${reviewId}`,
        method: 'post'
    })
}

/**
 * 商家回复评价(需要管理员权限)
 * @param {Object} data - 回复信息
 * @param {Number} data.reviewId - 评价ID
 * @param {String} data.replyContent - 回复内容
 */
export function replyReview(data) {
    return request({
        url: '/review/reply',
        method: 'post',
        data
    })
}

/**
 * 删除评价
 * @param {Number} reviewId - 评价ID
 */
export function deleteReview(reviewId) {
    return request({
        url: `/review/${reviewId}`,
        method: 'delete'
    })
}

/**
 * 获取我的评价列表
 * @param {Object} params - { pageNum, pageSize }
 */
export function getMyReviews(params) {
    return request({
        url: '/review/my/list',
        method: 'get',
        params: {
            pageNum: params.pageNum || 1,
            pageSize: params.pageSize || 10
        }
    })
}
export function updateReview(reviewId, data) {
    return request({ url: `/review/${reviewId}`, method: 'put', data })
}
// ============================================
// 举报评价
// 举报次数达到3次，评价自动从商品页隐藏，进入管理端审核队列
// ============================================

/**
 * 举报评价
 * @param {number} reviewId - 评价ID
 * @param {string} reason   - 举报原因（可选）
 */
export function reportReview(reviewId, reason = '') {
    return request({
        url: `/review/report/${reviewId}`,
        method: 'post',
        params: { reason }
    })
}