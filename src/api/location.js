// src/api/location.js
// 地理位置模块 - 用户端 API（7个方法）
// 对应后端: LocationController (module/location/)
//
// 接口鉴权说明:
//   ✅ 公开（无需登录）: getNearbySpots / getSpotDetail / getWeather / getTonightCondition
//   🔒 需要登录: submitRating / checkin / getCheckinHistory
//
// WebMvcConfig 白名单（6.0已配置）:
//   /api/location/spots      ← 公开
//   /api/location/spot/**    ← 详情公开，但 rating 子路径仍需登录（Controller层判断）
//   /api/location/weather    ← 公开
//   /api/location/tonight    ← 公开

import request from '@/utils/request'

// ============================================================
// ① 附近观测点列表（6.1 ✅）
// ============================================================
// 参数说明:
//   longitude / latitude     - 浏览器定位坐标或城市中心坐标（定位拒绝时降级）
//   radius                   - 搜索半径 km（默认100）
//   limit                    - 返回条数（默认20）
//   province / city          - 省市筛选（手动切换省市时传入）
//   maxLightPollution        - Bortle等级上限（1-9，筛选暗天等级）
//
// 响应体: List<ObservationSpotVO>（含 distance / myScore 字段）
export function getNearbySpots(longitude, latitude, radius = 100, limit = 20, province, city, maxLightPollution) {
    return request({
        url: '/location/spots',
        method: 'get',
        params: {
            longitude,
            latitude,
            radius,
            limit,
            // 省市为空字符串时不传（后端接受 null 表示不筛选）
            ...(province ? { province } : {}),
            ...(city ? { city } : {}),
            ...(maxLightPollution != null ? { maxLightPollution } : {})
        }
    })
}

// ============================================================
// ② 观测点详情（6.1 ✅）
// ============================================================
// 响应体: SpotDetailVO（含 fullDescription / images[] / todayCheckinCount / myScore）
export function getSpotDetail(id) {
    return request({
        url: `/location/spot/${id}`,
        method: 'get'
    })
}

// ============================================================
// ③ 提交评分（6.1 ✅，需登录）
// ============================================================
// score: 1-5 整数
// 响应体: { newRating: number, ratingCount: number }
// 错误场景: 已评过分 → 后端返回业务错误，前端 catch 处理提示
export function submitRating(id, score) {
    return request({
        url: `/location/spot/${id}/rating`,
        method: 'post',
        data: { score }
    })
}

// ============================================================
// ④ 天气 + 观测适宜度（6.2 TODO，接口已占位）
// ============================================================
// 响应体: WeatherVO（含天气描述/温度/云量/风力/适宜度评分）
export function getWeather(longitude, latitude) {
    return request({
        url: '/location/weather',
        method: 'get',
        params: { longitude, latitude }
    })
}

// ============================================================
// ⑤ 今晚综合观测评估（6.2 TODO，接口已占位）
// ============================================================
// 算法: 天气×0.6 + 月相×0.4
// 响应体: TonightVO（含综合评分0-100 / 月相照明度% / 天气等级 / 建议文字）
export function getTonightCondition(longitude, latitude) {
    return request({
        url: '/location/tonight',
        method: 'get',
        params: { longitude, latitude }
    })
}

// ============================================================
// ⑥ 观测点签到（6.3 TODO，需登录）
// ============================================================
// 规则: 距离≤5km + 每日每点只签一次
// data: { spotId, longitude, latitude }
// 响应体: CheckinResultVO（含签到成功提示/今日签到人数）
export function checkin(spotId, longitude, latitude) {
    return request({
        url: '/location/checkin',
        method: 'post',
        data: { spotId, longitude, latitude }
    })
}

// ============================================================
// ⑦ 我的签到历史（6.3 TODO，需登录）
// ============================================================
// 响应体: 分页结构 { list, total, pageNum, pageSize }
// list 项: UserCheckinVO（含观测点名称/签到时间/天气快照/月相快照）
export function getCheckinHistory(pageNum = 1, pageSize = 10) {
    return request({
        url: '/location/checkin/my',
        method: 'get',
        params: { pageNum, pageSize }
    })
}