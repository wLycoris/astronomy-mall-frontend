import request from '@/utils/request'

/**
 * 安装预约管理 API（管理员端）
 * 文件路径: src/api/admin/installation.js
 */

/**
 * 查询安装预约列表（分页）
 * @param {Object} params - { pageNum, pageSize, status, startTime, endTime }
 */
export const getInstallationList = (params) =>
    request({ url: '/admin/installation/list', method: 'get', params })

/**
 * 确认安装预约（填写工程师信息）
 * @param {number} id   - 预约ID
 * @param {Object} data - { confirmedTime, engineerName, engineerPhone }
 */
export const confirmInstallation = (id, data) =>
    request({ url: `/admin/installation/confirm/${id}`, method: 'post', data })

/**
 * 取消安装预约（管理员端）
 * @param {number} id   - 预约ID
 * @param {Object} data - { adminRemark }
 */
export const cancelInstallationAdmin = (id, data) =>
    request({ url: `/admin/installation/cancel/${id}`, method: 'post', data })