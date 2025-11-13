import request from '@/utils/request'

/**
 * 分页查询商品列表
 */
export function getProductList(queryDTO) {
  return request({
    url: '/product/list',
    method: 'post',
    data: queryDTO
  })
}

/**
 * 获取商品详情
 */
export function getProductDetail(id) {
  return request({
    url: `/product/detail/${id}`,
    method: 'get'
  })
}

/**
 * 获取推荐商品
 */
export function getRecommendProducts(pageNum = 1, pageSize = 10) {
  return request({
    url: '/product/recommend',
    method: 'get',
    params: { pageNum, pageSize }
  })
}

/**
 * 获取热卖商品
 */
export function getHotProducts(pageNum = 1, pageSize = 10) {
  return request({
    url: '/product/hot',
    method: 'get',
    params: { pageNum, pageSize }
  })
}

/**
 * 获取新品列表
 */
export function getNewProducts(pageNum = 1, pageSize = 10) {
  return request({
    url: '/product/new',
    method: 'get',
    params: { pageNum, pageSize }
  })
}