/**
 * 后台-通知记录管理 & 通知模板管理 API
 * 文件路径: src/api/admin/notification.js
 *
 * 通知记录接口 (3个):
 *   getNotificationList   GET    /admin/notification/record/list
 *   getNotificationStats  GET    /admin/notification/record/stats
 *   batchDeleteRecord     DELETE /admin/notification/record/batch
 *
 * 通知模板接口 (5个):
 *   getTemplateList       GET  /admin/notification/template/list
 *   getTemplateDetail     GET  /admin/notification/template/:id
 *   updateTemplate        PUT  /admin/notification/template/:id
 *   updateTemplateStatus  POST /admin/notification/template/status
 *   resetTemplate         POST /admin/notification/template/reset/:id
 */

import request from '@/utils/request'

// ============================================================
// 通知记录管理 (3个接口)
// ============================================================

/**
 * 通知记录列表（分页 + 多条件筛选）
 *
 * @param {Object} params
 * @param {number}  [params.pageNum=1]
 * @param {number}  [params.pageSize=20]
 * @param {number}  [params.userId]      - 按用户ID筛选
 * @param {string}  [params.module]      - 按模块筛选（mall/system/forum/course）
 * @param {string}  [params.type]        - 按通知类型筛选（order_paid 等）
 * @param {number}  [params.isRead]      - 已读状态（0-未读 1-已读）
 * @param {string}  [params.keyword]     - 标题/内容关键词
 * @param {number}  [params.priority]    - 优先级（0-普通 1-重要 2-紧急）
 * @param {string}  [params.startTime]   - 创建时间起始（yyyy-MM-dd HH:mm:ss）
 * @param {string}  [params.endTime]     - 创建时间结束（yyyy-MM-dd HH:mm:ss）
 * @returns {Promise} 分页结果 { records, total, pages, current, size }
 */
export function getNotificationList(params) {
    return request({
        url: '/admin/notification/record/list',
        method: 'get',
        params
    })
}

/**
 * 通知记录统计分析
 *
 * @returns {Promise} NotificationStatsVO:
 *   {
 *     totalCount, readCount, unreadCount, todayCount, monthCount,
 *     moduleStats: [{ module, moduleLabel, count, percentage }],
 *     dateStats:   [{ date, count }],
 *     typeStats:   [{ type, typeLabel, count }]
 *   }
 */
export function getNotificationStats() {
    return request({
        url: '/admin/notification/record/stats',
        method: 'get'
    })
}

/**
 * 批量逻辑删除通知记录
 *
 * @param {Array<number>} ids - 通知ID数组（最多500条）
 * @returns {Promise}
 */
export function batchDeleteRecord(ids) {
    return request({
        url: '/admin/notification/record/batch',
        method: 'delete',
        data: ids
    })
}

// ============================================================
// 通知模板管理 (5个接口)
// ============================================================

/**
 * 通知模板列表（按模块分组）
 *
 * @returns {Promise} Map<moduleLabel, Array<TemplateVO>>
 *   {
 *     "商城模块": [{ id, code, module, moduleLabel, type, titleTemplate, contentTemplate, ... }],
 *     "系统模块": [...]
 *   }
 */
export function getTemplateList() {
    return request({
        url: '/admin/notification/template/list',
        method: 'get'
    })
}

/**
 * 通知模板详情（编辑对话框回显用）
 *
 * @param {number} id - 模板ID
 * @returns {Promise} NotificationTemplateVO
 */
export function getTemplateDetail(id) {
    return request({
        url: `/admin/notification/template/${id}`,
        method: 'get'
    })
}

/**
 * 编辑通知模板
 *
 * @param {number} id - 模板ID
 * @param {Object} data - TemplateUpdateDTO
 * @param {string} data.titleTemplate   - 标题模板（必填）
 * @param {string} data.contentTemplate - 内容模板（必填）
 * @param {string} [data.jumpUrlTemplate] - 跳转链接模板（选填）
 * @param {string} [data.remark]        - 备注（选填）
 * @returns {Promise}
 */
export function updateTemplate(id, data) {
    return request({
        url: `/admin/notification/template/${id}`,
        method: 'put',
        data
    })
}

/**
 * 启用/禁用通知模板
 *
 * @param {Object} data - TemplateStatusDTO
 * @param {number} data.id      - 模板ID
 * @param {number} data.enabled - 目标状态（0-禁用 1-启用）
 * @returns {Promise}
 */
export function updateTemplateStatus(data) {
    return request({
        url: '/admin/notification/template/status',
        method: 'post',
        data
    })
}

/**
 * 恢复模板默认内容
 *
 * @param {number} id - 模板ID
 * @returns {Promise}
 */
export function resetTemplate(id) {
    return request({
        url: `/admin/notification/template/reset/${id}`,
        method: 'post'
    })
}