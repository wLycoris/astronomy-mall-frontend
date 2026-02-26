// 文件路径: src/api/admin/refund.js

import request from '@/utils/request'

/**
 * 退款管理 API
 */

/**
 * 退款列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} [params.pageNum=1]
 * @param {number} [params.pageSize=10]
 * @param {number} [params.status] - 0待审核 1审核通过 2审核拒绝 3退款成功 4退款失败
 * @param {string} [params.orderNo]
 * @param {string} [params.refundNo]
 * @param {string} [params.startTime]
 * @param {string} [params.endTime]
 */
export function getRefundList(params) {
    return request({
        url: '/admin/refund/list',
        method: 'get',
        params
    })
}

/**
 * 退款详情
 * @param {number} id - 退款ID
 */
export function getRefundDetail(id) {
    return request({
        url: `/admin/refund/detail/${id}`,
        method: 'get'
    })
}

/**
 * 审核通过
 * @param {number} id - 退款ID
 * @param {Object} data
 * @param {string} [data.adminRemark] - 审核备注
 */
export function approveRefund(id, data) {
    return request({
        url: `/admin/refund/approve/${id}`,
        method: 'post',
        data
    })
}

/**
 * 审核拒绝
 * @param {number} id - 退款ID
 * @param {Object} data
 * @param {string} data.adminRemark - 拒绝原因
 */
export function rejectRefund(id, data) {
    return request({
        url: `/admin/refund/reject/${id}`,
        method: 'post',
        data
    })
}

/**
 * 处理退款（手动重试）
 * @param {number} id - 退款ID
 */
export function processRefund(id) {
    return request({
        url: `/admin/refund/process/${id}`,
        method: 'post'
    })
}