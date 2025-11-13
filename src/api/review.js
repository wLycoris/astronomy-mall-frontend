import request from '@/utils/request'

/**
 * 获取商品评价列表
 */
export function getProductReviews(productId, pageNum = 1, pageSize = 10) {
  return request({
    url: `/review/list/${productId}`,
    method: 'get',
    params: { pageNum, pageSize }
  })
}

/**
 * 获取商品评价统计
 */
export function getReviewStatistics(productId) {
  return request({
    url: `/review/statistics/${productId}`,
    method: 'get'
  })
}