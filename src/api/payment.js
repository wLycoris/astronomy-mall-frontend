import request from '@/utils/request'

/**
 * 创建支付订单
 */
export function createPayment(data) {
    return request({
        url: '/payment/create',
        method: 'post',
        data
    })
}

/**
 * 模拟支付成功
 */
export function simulatePayment(paymentId) {
    return request({
        url: `/payment/simulate/${paymentId}`,
        method: 'post'
    })
}

/**
 * 查询支付状态
 */
export function getPaymentStatus(paymentId) {
    return request({
        url: `/payment/status/${paymentId}`,
        method: 'get'
    })
}

/**
 * 根据订单ID查询支付记录
 */
export function getPaymentByOrderId(orderId) {
    return request({
        url: `/payment/order/${orderId}`,
        method: 'get'
    })
}

/**
 * 分页查询支付记录
 */
export function getPaymentList(params) {
    return request({
        url: '/payment/list',
        method: 'get',
        params
    })
}

/**
 * 申请退款
 */
export function applyRefund(data) {
    return request({
        url: '/payment/refund/apply',
        method: 'post',
        data
    })
}

/**
 * 查询退款详情
 */
export function getRefundDetail(refundId) {
    return request({
        url: `/payment/refund/detail/${refundId}`,
        method: 'get'
    })
}

/**
 * 根据订单ID查询退款记录
 */
export function getRefundByOrderId(orderId) {
    return request({
        url: `/payment/refund/order/${orderId}`,
        method: 'get'
    })
}

/**
 * 分页查询退款列表
 */
export function getRefundList(params) {
    return request({
        url: '/payment/refund/list',
        method: 'get',
        params
    })
}

/**
 * 取消退款申请
 */
export function cancelRefund(refundId) {
    return request({
        url: `/payment/refund/cancel/${refundId}`,
        method: 'post'
    })
}