/**
 * 钱包相关 API
 *
 * 文件路径: src/api/wallet.js
 *
 * 接口说明：
 *   getWallet()          - GET /api/user/wallet              查询余额+近20条流水
 *   getBalanceLogList()  - GET /api/user/balance-log/list    完整流水分页
 *   recharge()           - POST /api/user/wallet/recharge    模拟充值
 *   withdraw()           - POST /api/user/wallet/withdraw    模拟提现
 */

import request from '@/utils/request'

/**
 * 获取钱包首页数据（余额 + 近20条流水）
 * @returns {{ balance: number, logs: Array }}
 */
export const getWallet = () => {
    return request.get('/user/wallet')
}

/**
 * 获取完整余额流水（分页）
 * @param {number} pageNum  页码，从1开始
 * @param {number} pageSize 每页条数，默认10
 */
export const getBalanceLogList = (pageNum = 1, pageSize = 10) => {
    return request.get('/user/balance-log/list', {
        params: { pageNum, pageSize }
    })
}

/**
 * 模拟充值
 * @param {number} amount 充值金额（0.01 ~ 99999.99）
 */
export const recharge = (amount) => {
    return request.post('/user/wallet/recharge', { amount })
}

/**
 * 模拟提现
 * @param {number} amount 提现金额（0.01 ~ 99999.99，且 <= 当前余额）
 */
export const withdraw = (amount) => {
    return request.post('/user/wallet/withdraw', { amount })
}