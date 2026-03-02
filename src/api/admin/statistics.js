import request from '@/utils/request'

/**
 * 后台数据统计 API
 *
 * 接口列表：
 *   getOverview         GET /api/admin/statistics/overview      - 数据概览
 *   getSalesTrend       GET /api/admin/statistics/sales-trend   - 销售趋势
 *   getOrderStatistics  GET /api/admin/statistics/order-status  - 订单统计
 *   getUserStatistics   GET /api/admin/statistics/user-trend    - 用户统计
 *   getReviewStatistics GET /api/admin/statistics/review        - 评价统计
 */

/** 数据概览 */
export function getOverview() {
    return request({
        url: '/admin/statistics/overview',
        method: 'get'
    })
}

/**
 * 销售趋势 + 商品排行 + 分类占比
 * @param {number} days - 7 | 30 | 90
 */
export function getSalesTrend(days = 7) {
    return request({
        url: '/admin/statistics/sales-trend',
        method: 'get',
        params: { days }
    })
}

/** 订单统计（状态分布 + 金额分布） */
export function getOrderStatistics() {
    return request({
        url: '/admin/statistics/order-status',
        method: 'get'
    })
}

/**
 * 用户统计（新增趋势 + 活跃度 + 地区 + 等级分布）
 * @param {number} days - 7 | 30
 */
export function getUserStatistics(days = 7) {
    return request({
        url: '/admin/statistics/user-trend',
        method: 'get',
        params: { days }
    })
}

/**
 * 评价统计（评分分布 + 好评率 + 评价趋势）
 * @param {number} days - 7 | 30
 */
export function getReviewStatistics(days = 7) {
    return request({
        url: '/admin/statistics/review',
        method: 'get',
        params: { days }
    })
}