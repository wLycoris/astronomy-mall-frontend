// src/api/location.js
// 地理位置模块 - 用户端 API 封装
// 对应后端: LocationController (module/location/)
//
// 接口清单（8个）:
//   6.1: listSpots / getSpotDetail / rateSpot
//   6.2: getWeather / getTonight
//   6.3: checkin / listMyCheckins
//   6.4: updateUserLocation（见 api/user.js，此处不重复）

import request from '@/utils/request'

// ==================== 6.1 观测点 ====================

/**
 * 获取观测点列表（地图+列表展示）
 * 白名单，无需登录
 *
 * @param {Object} params
 * @param {string} [params.province]          省份筛选（可选）
 * @param {string} [params.city]              城市筛选（可选）
 * @param {number} [params.maxLightPollution] 最大Bortle等级（可选，1-9）
 * @returns {Promise<Array>} 观测点VO列表
 */
export const listSpots = (params = {}) => {
    return request({
        url: '/location/spots',
        method: 'get',
        params
    })
}

/**
 * 获取观测点详情
 * 白名单，无需登录；登录状态下会额外返回 myScore 和 todayCheckedIn
 *
 * @param {number} spotId 观测点ID
 * @returns {Promise<Object>} SpotDetailVO
 */
export const getSpotDetail = (spotId) => {
    return request({
        url: `/location/spot/${spotId}`,
        method: 'get'
    })
}

/**
 * 提交观测点评分（需要登录）
 * 每人每观测点只能评一次，重复提交返回错误提示
 *
 * @param {number} spotId       观测点ID
 * @param {number} score        评分（1-5）
 * @returns {Promise<void>}
 */
export const rateSpot = (spotId, score) => {
    return request({
        url: `/location/spot/${spotId}/rating`,
        method: 'post',
        data: { score }
    })
}

// ==================== 6.2 天气+今晚观测条件 ====================

/**
 * 获取实况天气（高德API后端代理）
 * 白名单，无需登录
 *
 * @param {string} city 城市名（如"北京"）或高德adcode（如"110000"）
 * @returns {Promise<Object>} WeatherVO
 */
export const getWeather = (city) => {
    return request({
        url: '/location/weather',
        method: 'get',
        params: { city }
    })
}

/**
 * 获取今晚观测条件综合评分
 * 白名单，无需登录
 * 后端计算: 天气(50分) + 月相(30分) + 温度(20分) = 综合分
 *
 * @param {string} city 城市名或高德adcode
 * @returns {Promise<Object>} TonightVO { score, scoreLevel, moonPhaseName, moonIllumination, weather, suggestion }
 */
export const getTonight = (city) => {
    return request({
        url: '/location/tonight',
        method: 'get',
        params: { city }
    })
}

// ==================== 6.3 用户签到（需要登录）====================

/**
 * 签到到观测点
 * 需要登录，每日每观测点限一次
 *
 * @param {Object} data
 * @param {number} data.spotId        观测点ID（必填）
 * @param {number} [data.longitude]   当前GPS经度（可选，高德GCJ-02）
 * @param {number} [data.latitude]    当前GPS纬度（可选）
 * @returns {Promise<Object>} CheckinVO（含签到时间、天气快照、今日签到人数等）
 */
export const checkin = (data) => {
    return request({
        url: '/location/checkin',
        method: 'post',
        data
    })
}

/**
 * 获取我的签到足迹（分页）
 * 需要登录
 *
 * @param {number} [pageNum=1]   页码
 * @param {number} [pageSize=10] 每页数量
 * @returns {Promise<Array>} CheckinVO列表（含观测点名称、省市、天气快照、月相快照）
 */
export const listMyCheckins = (pageNum = 1, pageSize = 10) => {
    return request({
        url: '/location/checkin/my',
        method: 'get',
        params: { pageNum, pageSize }
    })
}