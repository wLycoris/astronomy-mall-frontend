import request from '@/utils/request'

/**
 * 收货地址相关 API
 *
 * 📌 接口清单 (5个):
 * getAddressList   - GET    /api/address/list          获取地址列表
 * addAddress       - POST   /api/address/add           新增地址
 * updateAddress    - PUT    /api/address/update/:id    编辑地址
 * deleteAddress    - DELETE /api/address/delete/:id    删除地址
 * setDefaultAddress - POST  /api/address/default/:id   设为默认地址
 */

/**
 * 获取我的收货地址列表
 * 默认地址排在最前面
 * @returns {Promise} AddressVO[]
 */
export const getAddressList = () => {
    return request({
        url: '/address/list',
        method: 'get'
    })
}

/**
 * 新增收货地址
 * @param {Object} data
 * @param {string} data.receiverName   收货人姓名
 * @param {string} data.receiverPhone  收货人手机号
 * @param {string} data.province       省份
 * @param {string} data.city           城市
 * @param {string} data.district       区县
 * @param {string} data.detail         详细地址
 * @param {number} [data.isDefault]    是否设为默认地址 0-否 1-是
 */
export const addAddress = (data) => {
    return request({
        url: '/address/add',
        method: 'post',
        data
    })
}

/**
 * 编辑收货地址
 * @param {number|string} id  地址ID
 * @param {Object} data       同 addAddress 参数
 */
export const updateAddress = (id, data) => {
    return request({
        url: `/address/update/${id}`,
        method: 'put',
        data
    })
}

/**
 * 删除收货地址
 * 删除后不影响历史订单（订单里已有地址快照）
 * @param {number|string} id  地址ID
 */
export const deleteAddress = (id) => {
    return request({
        url: `/address/delete/${id}`,
        method: 'delete'
    })
}

/**
 * 设为默认收货地址
 * @param {number|string} id  地址ID
 */
export const setDefaultAddress = (id) => {
    return request({
        url: `/address/default/${id}`,
        method: 'post'
    })
}