import request from '@/utils/request'

/**
 * 分页查询通知列表
 */
export function getNotificationList(params) {
    return request({
        url: '/notification/list',
        method: 'get',
        params
    })
}

/**
 * 获取未读数量统计
 */
export function getUnreadCount() {
    return request({
        url: '/notification/unread-count',
        method: 'get'
    })
}

/**
 * 标记为已读
 */
export function markAsRead(data) {
    return request({
        url: '/notification/mark-read',
        method: 'post',
        data
    })
}

/**
 * 全部标记为已读
 */
export function markAllAsRead(module) {
    return request({
        url: '/notification/mark-all-read',
        method: 'post',
        params: { module }
    })
}

/**
 * 删除通知
 */
export function deleteNotification(id) {
    return request({
        url: `/notification/${id}`,
        method: 'delete'
    })
}

/**
 * 获取通知设置
 */
export function getNotificationSettings() {
    return request({
        url: '/notification/settings',
        method: 'get'
    })
}

/**
 * 更新通知设置
 */
export function updateNotificationSettings(data) {
    return request({
        url: '/notification/settings',
        method: 'post',
        data
    })
}