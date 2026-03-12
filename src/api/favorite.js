import request from '@/utils/request'

/**
 * 商品收藏 API
 *
 * 📌 路径: src/api/favorite.js
 * 📌 基础路径: /api/favorite
 * 📌 所有接口需要登录
 *
 * 包含4个方法:
 *   1. toggleFavorite   - 收藏/取消收藏（幂等切换）
 *   2. getFavoriteList  - 我的收藏列表（分页）
 *   3. checkFavorite    - 查询是否已收藏
 *   4. removeFavorite   - 取消收藏
 */

/**
 * 1. 收藏 / 取消收藏（幂等切换）
 *
 * @param {number} productId - 商品ID
 * @returns {{ isFavorite: boolean, message: string }}
 *   isFavorite = true  → 刚刚收藏（当前状态：已收藏）
 *   isFavorite = false → 刚刚取消（当前状态：未收藏）
 *
 * 使用示例:
 *   const res = await toggleFavorite(123)
 *   isFavorited.value = res.data.isFavorite
 */
export function toggleFavorite(productId) {
    return request({
        url: `/favorite/toggle/${productId}`,
        method: 'post'
    })
}

/**
 * 2. 获取我的收藏列表（分页）
 *
 * @param {Object} params
 * @param {number} [params.pageNum=1]   - 页码
 * @param {number} [params.pageSize=12] - 每页数量
 * @returns {Object} 分页对象 { records: FavoriteVO[], total, pages, current }
 *
 * FavoriteVO 字段:
 *   id            - 收藏记录ID
 *   productId     - 商品ID
 *   productImage  - 商品图片
 *   productName   - 商品名称
 *   currentPrice  - 当前价格（下架则为 null）
 *   favoritePrice - 收藏时价格
 *   isOffShelf    - 是否下架 (true/false)
 *   isPriceDown   - 是否降价 (true/false)
 *   createTime    - 收藏时间
 */
export function getFavoriteList(params = {}) {
    return request({
        url: '/favorite/list',
        method: 'get',
        params: {
            pageNum: params.pageNum || 1,
            pageSize: params.pageSize || 12
        }
    })
}

/**
 * 3. 查询是否已收藏某商品（商品详情页用）
 *
 * @param {number} productId - 商品ID
 * @returns {{ isFavorite: boolean }}
 *
 * 使用示例（商品详情页 onMounted 中）:
 *   const res = await checkFavorite(productId)
 *   isFavorited.value = res.data.isFavorite
 */
export function checkFavorite(productId) {
    return request({
        url: `/favorite/check/${productId}`,
        method: 'get'
    })
}

/**
 * 4. 取消收藏（收藏列表页用）
 *
 * @param {number} productId - 商品ID
 * @returns {void}
 *
 * 注意: 与 toggleFavorite 的区别是语义更明确，
 *       只能取消，不会误触发收藏。
 *       收藏列表页的"取消收藏"按钮推荐用此接口。
 */
export function removeFavorite(productId) {
    return request({
        url: `/favorite/${productId}`,
        method: 'delete'
    })
}