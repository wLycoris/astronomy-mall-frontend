import request from '@/utils/request'

/**
 * 安装预约 API（用户端）
 * 文件路径: src/api/installation.js
 */

/**
 * 提交安装预约
 * @param {Object} data - { orderId, productId, expectedTime, userRemark }
 */
export const submitInstallation = (data) =>
    request({ url: '/installation/submit', method: 'post', data })

/**
 * 查询我的预约列表（分页）
 * @param {Object} params - { pageNum, pageSize }
 */
export const getMyInstallationList = (params) =>
    request({ url: '/installation/my/list', method: 'get', params })

/**
 * 取消安装预约（用户端）
 * @param {number} id - 预约ID
 */
export const cancelInstallation = (id) =>
    request({ url: `/installation/cancel/${id}`, method: 'post' })