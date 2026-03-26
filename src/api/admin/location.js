// src/api/admin/location.js
// 地理位置模块 - 管理员端 API 封装
// 对应后端: AdminLocationController (/api/admin/location)
//
// 接口清单（5个，6.5实现）:
//   getAdminSpotList  GET    /admin/location/spot/list       观测点分页列表
//   addSpot           POST   /admin/location/spot/add        新增观测点
//   updateSpot        PUT    /admin/location/spot/{id}       编辑观测点
//   deleteSpot        DELETE /admin/location/spot/{id}       删除观测点
//   getSpotStats      GET    /admin/location/spot/{id}/stats 签到统计

import request from '@/utils/request'

/**
 * 观测点分页列表（管理员）
 *
 * @param {Object} params
 * @param {number} [params.pageNum=1]    页码
 * @param {number} [params.pageSize=10]  每页条数
 * @param {string} [params.province]     省份筛选
 * @param {string} [params.city]         城市筛选
 * @param {string} [params.keyword]      关键词搜索（观测点名称）
 * @returns {Promise<Object>} 分页结果 { records, total }
 */
export const getAdminSpotList = (params) => {
    return request({
        url: '/admin/location/spot/list',
        method: 'get',
        params
    })
}

/**
 * 新增观测点（管理员）
 *
 * @param {Object} data
 * @param {string} data.spotName              观测点名称（必填）
 * @param {number} data.longitude             经度（必填）
 * @param {number} data.latitude              纬度（必填）
 * @param {string} [data.province]            省份
 * @param {string} [data.city]                城市
 * @param {string} [data.address]             详细地址
 * @param {number} [data.altitude]            海拔(米)
 * @param {number} [data.lightPollutionLevel] Bortle等级(1-9)
 * @param {string} [data.description]         描述
 * @param {string} [data.images]              图片JSON数组
 * @returns {Promise<void>}
 */
export const addSpot = (data) => {
    return request({
        url: '/admin/location/spot/add',
        method: 'post',
        data
    })
}

/**
 * 编辑观测点（管理员）
 *
 * @param {number} id   观测点ID
 * @param {Object} data 同 addSpot 参数（所有字段可选）
 * @returns {Promise<void>}
 */
export const updateSpot = (id, data) => {
    return request({
        url: `/admin/location/spot/${id}`,
        method: 'put',
        data
    })
}

/**
 * 删除观测点（逻辑删除，管理员）
 *
 * @param {number} id 观测点ID
 * @returns {Promise<void>}
 */
export const deleteSpot = (id) => {
    return request({
        url: `/admin/location/spot/${id}`,
        method: 'delete'
    })
}

/**
 * 观测点签到统计（管理员）
 * 返回: totalCount(总次数), last7Days(近7日), last30Days(近30日), topUsers(TOP5用户)
 *
 * @param {number} id 观测点ID
 * @returns {Promise<Object>} { totalCount, last7Days, last30Days, topUsers }
 */
export const getSpotStats = (id) => {
    return request({
        url: `/admin/location/spot/${id}/stats`,
        method: 'get'
    })
}
