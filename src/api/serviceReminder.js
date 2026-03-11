/**
 * 器材保养提醒 API
 *
 * 📌 接口列表（共4个）：
 *   getMyReminderList  - GET  /api/service-reminder/list        查询我的提醒列表
 *   addReminder        - POST /api/service-reminder/add         新增
 *   updateReminder     - PUT  /api/service-reminder/update/:id  编辑（含标记完成）
 *   deleteReminder     - DEL  /api/service-reminder/delete/:id  删除
 *
 * 📌 文件路径: src/api/serviceReminder.js
 */

import request from '@/utils/request'

/**
 * 获取我的保养提醒列表
 * 排序: 未完成优先 → 到期日期升序
 * @returns {Promise} List<ServiceReminderVO>
 */
export const getMyReminderList = () =>
    request({
        url: '/service-reminder/list',
        method: 'get'
    })

/**
 * 新增保养提醒
 * @param {Object} data
 * @param {string} data.productName  器材名称（必填）
 * @param {string} data.remindTitle  提醒标题（必填）
 * @param {string} data.remindDate   提醒日期 yyyy-MM-dd（必填）
 * @param {string} [data.remindType] 保养类型 clean/calibrate/check/custom（可选，默认 custom）
 */
export const addReminder = (data) =>
    request({
        url: '/service-reminder/add',
        method: 'post',
        data
    })

/**
 * 编辑保养提醒（也用于"标记已完成"和"设置下次提醒"）
 *
 * 📌 普通编辑: 传需要修改的字段（不传 isDone）
 * 📌 标记完成: 传 { isDone: 1 }，可同时传 remindDate（下次提醒日期）
 * 📌 重新激活: 传 { isDone: 0 }
 *
 * @param {number} id   提醒ID
 * @param {Object} data 更新数据（只传需要变更的字段）
 */
export const updateReminder = (id, data) =>
    request({
        url: `/service-reminder/update/${id}`,
        method: 'put',
        data
    })

/**
 * 删除保养提醒（物理删除）
 * @param {number} id 提醒ID
 */
export const deleteReminder = (id) =>
    request({
        url: `/service-reminder/delete/${id}`,
        method: 'delete'
    })