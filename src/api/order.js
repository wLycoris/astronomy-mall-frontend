import request from '@/utils/request'

/**
 * 创建订单
 */
export function createOrder(data) {
  return request({
    url: '/order/create',
    method: 'post',
    data
  })
}

/**
 * 查询订单列表
 */
export function getOrderList(params) {
  return request({
    url: '/order/list',
    method: 'get',
    params
  })
}

/**
 * 查询订单详情（增加参数校验，避免 orderId 为 undefined 时请求报错）
 */
export function getOrderDetail(orderId) {
    if (!orderId) { // null / undefined / '' 都会拦截
        console.warn('getOrderDetail 被非法调用，orderId:', orderId)
        console.trace() // 打印调用栈帮助定位
        return Promise.reject(new Error('orderId is required'))
    }

    return request({
        url: `/order/detail/${orderId}`,
        method: 'get'
    })
}

/**
 * 取消订单
 */
export function cancelOrder(orderId, reason) {
  return request({
    url: `/order/cancel/${orderId}`,
    method: 'put',
    params: { reason }
  })
}

/**
 * 确认收货
 */
export function confirmReceipt(orderId) {
  return request({
    url: `/order/confirmReceipt/${orderId}`,
    method: 'put'
  })
}

/**
 * 删除订单
 */
export function deleteOrder(orderId) {
  return request({
    url: `/order/delete/${orderId}`,
    method: 'delete'
  })
}