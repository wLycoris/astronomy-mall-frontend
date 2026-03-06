/**
 * 个人中心 - 概览接口
 * 文件路径: src/api/user/overview.js
 *
 * 📌 接口说明:
 *   GET /api/user/overview - 聚合查询，一次返回概览页所有数据
 */

import request from '@/utils/request'

/**
 * 获取个人中心概览数据
 * 返回: 用户信息 + 各状态订单数 + 余额 + 最近一笔流水
 *
 * @returns {Promise} 包含 UserOverviewVO 的响应
 */
export function getUserOverview() {
    return request({
        url: '/user/overview',
        method: 'get'
    })
}