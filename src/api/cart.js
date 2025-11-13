import request from '@/utils/request'

/**
 * 添加商品到购物车
 */
export function addToCart(data) {
  return request({
    url: '/cart/add',
    method: 'post',
    params: data
  })
}

/**
 * 查询购物车列表
 */
export function getCartList() {
  return request({
    url: '/cart/list',
    method: 'get'
  })
}

/**
 * 更新购物车商品数量
 */
export function updateQuantity(cartId, quantity) {
  return request({
    url: '/cart/updateQuantity',
    method: 'put',
    params: { cartId, quantity }
  })
}

/**
 * 切换购物车项选中状态
 */
export function toggleSelected(cartId, selected) {
  return request({
    url: '/cart/toggleSelected',
    method: 'put',
    params: { cartId, selected }
  })
}

/**
 * 全选/取消全选
 */
export function selectAll(selected) {
  return request({
    url: '/cart/selectAll',
    method: 'put',
    params: { selected }
  })
}

/**
 * 删除购物车项
 */
export function removeCartItem(cartId) {
  return request({
    url: `/cart/remove/${cartId}`,
    method: 'delete'
  })
}

/**
 * 批量删除购物车项
 */
export function batchRemove(cartIds) {
  return request({
    url: '/cart/batchRemove',
    method: 'delete',
    data: cartIds
  })
}

/**
 * 清空购物车
 */
export function clearCart() {
  return request({
    url: '/cart/clear',
    method: 'delete'
  })
}