import request from '@/utils/request'

/**
 * 后台用户管理 API
 *
 * 接口列表：
 *   getUserList      GET  /api/admin/user/list          - 用户列表（分页）
 *   getUserDetail    GET  /api/admin/user/detail/:id    - 用户详情
 *   updateUserStatus POST /api/admin/user/status/:id    - 修改用户状态
 *   updateUserRole   PUT  /api/admin/user/role/:id      - 设置用户角色
 */

/**
 * 获取用户列表（分页）
 *
 * @param {Object} params - 查询参数
 * @param {string}  [params.keyword]          - 关键词（用户名/昵称/手机/邮箱）
 * @param {number}  [params.role]             - 角色（0-普通用户 1-管理员）
 * @param {number}  [params.status]           - 状态（0-禁用 1-启用）
 * @param {number}  [params.observationLevel] - 观测等级（1~5）
 * @param {string}  [params.startTime]        - 注册开始日期（yyyy-MM-dd）
 * @param {string}  [params.endTime]          - 注册结束日期（yyyy-MM-dd）
 * @param {number}  [params.page=1]           - 当前页
 * @param {number}  [params.size=10]          - 每页条数
 * @returns {Promise}
 */
export function getUserList(params) {
    return request({
        url: '/admin/user/list',
        method: 'get',
        params
    })
}

/**
 * 获取用户详情
 *
 * @param {number} id - 用户ID
 * @returns {Promise} AdminUserDetailVO（基本信息 + 消费统计 + 近期订单 + 登录日志）
 */
export function getUserDetail(id) {
    return request({
        url: `/admin/user/detail/${id}`,
        method: 'get'
    })
}

/**
 * 修改用户状态（禁用 / 启用）
 *
 * @param {number} id   - 用户ID
 * @param {Object} data
 * @param {number} data.status - 目标状态（0-禁用 1-启用）
 * @param {string} [data.reason] - 操作原因（选填）
 * @returns {Promise}
 */
export function updateUserStatus(id, data) {
    return request({
        url: `/admin/user/status/${id}`,
        method: 'post',
        data
    })
}

/**
 * 设置用户角色
 *
 * @param {number} id   - 用户ID
 * @param {Object} data
 * @param {number} data.role - 目标角色（0-普通用户 1-管理员）
 * @returns {Promise}
 */
export function updateUserRole(id, data) {
    return request({
        url: `/admin/user/role/${id}`,
        method: 'put',
        data
    })
}