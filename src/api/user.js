import request from '@/utils/request'

/**
 * 用户注册
 */
export function register(data) {
    return request({
        url: '/user/register',
        method: 'post',
        data
    })
}

/**
 * 用户登录
 */
export function login(data) {
    return request({
        url: '/user/login',
        method: 'post',
        data
    })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
    return request({
        url: '/user/info',
        method: 'get'
    })
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data) {
    return request({
        url: '/user/info',
        method: 'put',
        data
    })
}

/**
 * 修改密码 (旧接口，保留兼容)
 */
export function changePassword(oldPassword, newPassword) {
    return request({
        url: '/user/password',
        method: 'put',
        params: { oldPassword, newPassword }
    })
}

/**
 * 修改密码 (新接口 v7.7)
 * POST /api/user/change-password
 * @param {Object} data - { oldPassword, newPassword, confirmPassword }
 */
export function changePasswordSecure(data) {
    return request({
        url: '/user/change-password',
        method: 'post',
        data
    })
}

/**
 * 用户登出
 */
export function logout() {
    return request({
        url: '/user/logout',
        method: 'post'
    })
}