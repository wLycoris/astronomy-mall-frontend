/**
 * 二手回收 API（用户端）
 * 文件路径: src/api/recycling.js
 */
import request from '@/utils/request'

/**
 * 1. 提交回收申请
 * @param {Object} data
 * @param {string} data.productName    - 器材名称（必填）
 * @param {string} data.brand          - 品牌（可选）
 * @param {string} data.model          - 型号（可选）
 * @param {string} data.conditionLevel - 成色等级 S/A/B/C（必填）
 * @param {string} data.description    - 器材描述（可选）
 */
export function submitRecycling(data) {
    return request({
        url: '/recycling/submit',
        method: 'post',
        data
    })
}

/**
 * 2. 我的申请列表（分页）
 * @param {Object} params
 * @param {number} params.pageNum  - 页码
 * @param {number} params.pageSize - 每页数量
 */
export function getMyRecyclingList(params) {
    return request({
        url: '/recycling/my/list',
        method: 'get',
        params
    })
}

/**
 * 3. 申请详情
 * @param {number} id - 申请ID
 */
export function getRecyclingDetail(id) {
    return request({
        url: `/recycling/detail/${id}`,
        method: 'get'
    })
}

/**
 * 4. 确认报价（已报价 → 用户确认）
 * @param {number} id - 申请ID
 */
export function confirmRecyclingQuote(id) {
    return request({
        url: `/recycling/confirm/${id}`,
        method: 'post'
    })
}

/**
 * 5. 拒绝报价（已报价 → 用户取消）
 * @param {number} id - 申请ID
 */
export function rejectRecyclingQuote(id) {
    return request({
        url: `/recycling/reject-quote/${id}`,
        method: 'post'
    })
}

/**
 * 6. 取消申请（仅待审核状态）
 * @param {number} id - 申请ID
 */
export function cancelRecycling(id) {
    return request({
        url: `/recycling/cancel/${id}`,
        method: 'post'
    })
}