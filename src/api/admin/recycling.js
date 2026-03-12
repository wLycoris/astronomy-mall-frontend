/**
 * 管理员端 - 二手回收管理 API
 * 文件路径: src/api/admin/recycling.js
 */
import request from '@/utils/request'

/**
 * 1. 回收申请列表（分页+筛选）
 * @param {Object} params
 * @param {number} params.pageNum     - 页码
 * @param {number} params.pageSize    - 每页数量
 * @param {number} [params.status]    - 状态筛选（0-6，为空查全部）
 * @param {string} [params.productName] - 器材名称模糊搜索
 * @param {string} [params.recycleNo]   - 回收单号精确搜索
 * @param {string} [params.startTime]   - 开始时间
 * @param {string} [params.endTime]     - 结束时间
 */
export function getRecyclingList(params) {
    return request({
        url: '/admin/recycling/list',
        method: 'get',
        params
    })
}

/**
 * 2. 申请详情
 * @param {number} id - 申请ID
 */
export function getRecyclingDetail(id) {
    return request({
        url: `/admin/recycling/detail/${id}`,
        method: 'get'
    })
}

/**
 * 3. 提交报价（待审核 → 已报价）
 * @param {number} id   - 申请ID
 * @param {Object} data
 * @param {number} data.assessedPrice - 报价金额（必填）
 * @param {string} data.adminRemark   - 报价备注（可选）
 */
export function submitQuote(id, data) {
    return request({
        url: `/admin/recycling/quote/${id}`,
        method: 'post',
        data
    })
}

/**
 * 4. 拒绝申请（待审核 → 已拒绝）
 * @param {number} id   - 申请ID
 * @param {Object} data
 * @param {string} data.adminRemark - 拒绝原因（必填）
 */
export function rejectRecycling(id, data) {
    return request({
        url: `/admin/recycling/reject/${id}`,
        method: 'post',
        data
    })
}

/**
 * 5. 安排取件（用户确认 → 待取件）
 * @param {number} id   - 申请ID
 * @param {Object} data
 * @param {string} data.logisticsCompany - 快递公司（必填）
 * @param {string} data.trackingNumber   - 快递单号（必填）
 */
export function arrangePickup(id, data) {
    return request({
        url: `/admin/recycling/arrange/${id}`,
        method: 'post',
        data
    })
}

/**
 * 6. 标记已回收 → 自动发放余额到用户钱包
 * @param {number} id - 申请ID
 *
 * ⚠️ 注意: 此操作不可逆，将触发余额发放，请二次确认后调用
 */
export function completeRecycling(id) {
    return request({
        url: `/admin/recycling/complete/${id}`,
        method: 'post'
    })
}