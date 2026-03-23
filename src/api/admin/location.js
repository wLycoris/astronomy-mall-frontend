// src/api/admin/location.js
// 地理位置模块 - 管理员端 API 封装
// 对应后端: AdminLocationController (module/admin/controller/)
//
// 接口清单（5个，6.5节实现）:
//   listSpotsAdmin  GET  /admin/location/spots     观测点分页列表
//   addSpot         POST /admin/location/spot      新增观测点
//   updateSpot      PUT  /admin/location/spot/{id} 编辑观测点
//   deleteSpot      DELETE /admin/location/spot/{id} 删除观测点
//   listCheckins    GET  /admin/location/checkins  签到记录查询

import request from '@/utils/request'

/**
 * 观测点分页列表（管理员）
 *
 * @param {Object} params
 * @param {number} [params.pageNum=1]
 * @param {number} [params.pageSize=10]
 * @param {string} [params.province]    省份筛选
 * @param {string} [params.city]        城市筛选
 * @param {string} [params.keyword]     关键词搜索（观测点名称）
 * @returns {Promise<Object>} 分页结果 { records, total }
 *
 * TODO 6.5: 后端接口实现后解除注释
 */
export const listSpotsAdmin = (params) => {
    return request({
        url: '/admin/location/spots',
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
 *
 * TODO 6.5: 后端接口实现后解除注释
 */
export const addSpot = (data) => {
    return request({
        url: '/admin/location/spot',
        method: 'post',
        data
    })
}

/**
 * 编辑观测点（管理员）
 *
 * @param {number} id   观测点ID
 * @param {Object} data 同 addSpot 参数
 * @returns {Promise<void>}
 *
 * TODO 6.5: 后端接口实现后解除注释
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
 *
 * TODO 6.5: 后端接口实现后解除注释
 */
export const deleteSpot = (id) => {
    return request({
        url: `/admin/location/spot/${id}`,
        method: 'delete'
    })
}

/**
 * 签到记录分页查询（管理员）
 *
 * @param {Object} params
 * @param {number} [params.pageNum=1]
 * @param {number} [params.pageSize=10]
 * @param {number} [params.spotId]   按观测点筛选
 * @param {string} [params.date]     按签到日期筛选 (yyyy-MM-dd)
 * @returns {Promise<Object>} 分页结果
 *
 * TODO 6.5: 后端接口实现后解除注释
 */
export const listCheckins = (params) => {
    return request({
        url: '/admin/location/checkins',
        method: 'get',
        params
    })
}