import request from '@/utils/request'
import axios from 'axios'
import { getToken } from '@/utils/auth'

/**
 * 后台操作日志 API
 *
 * ⚠️ 重要说明:
 * exportLog 单独使用原生 axios 实例，不复用全局 request。
 * 原因：responseType:'blob' 在某些 axios 版本下会污染全局实例，
 * 导致后续所有请求响应都变成 blob，页面数据全部无法解析。
 */

/** 获取操作日志列表（分页） */
export function getLogList(params) {
    return request({
        url: '/admin/log/list',
        method: 'get',
        params
    })
}

/** 获取日志详情 */
export function getLogDetail(id) {
    return request({
        url: `/admin/log/detail/${id}`,
        method: 'get'
    })
}

/**
 * 导出操作日志（Excel）
 * 使用独立 axios 实例，不经过全局 request 拦截器
 */
export function exportLog(params) {
    const token = getToken()
    return axios({
        url: '/api/admin/log/export',
        method: 'get',
        params,
        responseType: 'blob',
        timeout: 30000,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(res => res.data)
}