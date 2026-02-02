import request from '@/utils/request'

/**
 * 订单管理API
 */

// 订单列表
export function getOrderList(params) {
    return request({
        url: '/admin/order/list',
        method: 'get',
        params
    })
}

// 订单详情
export function getOrderDetail(id) {
    return request({
        url: `/admin/order/detail/${id}`,
        method: 'get'
    })
}

// 订单发货
export function shipOrder(data) {
    return request({
        url: '/admin/order/ship',
        method: 'post',
        data
    })
}

// 取消订单
export function cancelOrder(data) {
    return request({
        url: '/admin/order/cancel',
        method: 'post',
        data
    })
}

// 添加备注
export function addRemark(data) {
    return request({
        url: '/admin/order/remark',
        method: 'post',
        data
    })
}

// 导出订单
export function exportOrders(params) {
    return request({
        url: '/admin/order/export',
        method: 'get',
        params,
        responseType: 'blob'
    })
}

/**
 * 订单派送
 */
export function deliverOrder(orderId) {
    return request({
        url: '/admin/order/deliver',
        method: 'post',
        data: { orderId }
    })
}