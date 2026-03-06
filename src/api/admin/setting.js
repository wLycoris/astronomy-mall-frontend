/**
 * 系统设置 API 封装
 * 文件路径: src/api/admin/setting.js
 *
 * 📌 接口列表 (12个):
 *   基础设置: getBasicSetting / updateBasicSetting
 *   运费设置: getFreightSetting / updateFreightSetting
 *   支付设置: getPaymentSetting / updatePaymentSetting
 *   SEO设置:  getSeoSetting / updateSeoSetting
 *   注册设置: getRegisterSetting / updateRegisterSetting
 *   维护模式: getMaintenanceSetting / updateMaintenanceSetting
 */

import request from '@/utils/request'

// ============================================================
//  基础设置
// ============================================================

/**
 * 获取基础设置
 * @returns {Promise} { mallName, mallLogo, mallDesc, contactPhone, contactEmail, contactQq, icpNumber, copyright }
 */
export function getBasicSetting() {
    return request({
        url: '/admin/setting/basic',
        method: 'get'
    })
}

/**
 * 更新基础设置
 * @param {Object} data
 * @param {string} data.mallName      - 商城名称(必填)
 * @param {string} [data.mallLogo]    - 商城Logo URL
 * @param {string} [data.mallDesc]    - 商城简介
 * @param {string} [data.contactPhone]- 客服电话
 * @param {string} [data.contactEmail]- 客服邮箱
 * @param {string} [data.contactQq]   - 客服QQ
 * @param {string} [data.icpNumber]   - ICP备案号
 * @param {string} [data.copyright]   - 版权信息
 */
export function updateBasicSetting(data) {
    return request({
        url: '/admin/setting/basic',
        method: 'put',
        data
    })
}

// ============================================================
//  运费设置
// ============================================================

/**
 * 获取运费设置
 * @returns {Promise} { defaultFreight, freeFreightEnabled, freeFreightAmount }
 */
export function getFreightSetting() {
    return request({
        url: '/admin/setting/freight',
        method: 'get'
    })
}

/**
 * 更新运费设置
 * @param {Object} data
 * @param {number}  data.defaultFreight      - 默认运费(元, ≥0)
 * @param {boolean} data.freeFreightEnabled  - 是否开启包邮
 * @param {number}  [data.freeFreightAmount] - 满额包邮金额(元)
 */
export function updateFreightSetting(data) {
    return request({
        url: '/admin/setting/freight',
        method: 'put',
        data
    })
}

// ============================================================
//  支付设置
// ============================================================

/**
 * 获取支付设置
 * @returns {Promise} { alipayEnabled, wechatEnabled, balanceEnabled, payTimeoutMinutes, autoConfirmDays, autoCloseDays }
 */
export function getPaymentSetting() {
    return request({
        url: '/admin/setting/payment',
        method: 'get'
    })
}

/**
 * 更新支付设置
 * @param {Object}  data
 * @param {boolean} data.alipayEnabled       - 支付宝开关
 * @param {boolean} data.wechatEnabled       - 微信支付开关
 * @param {boolean} data.balanceEnabled      - 余额支付开关
 * @param {number}  data.payTimeoutMinutes   - 支付超时时间(分钟, ≥5)
 * @param {number}  data.autoConfirmDays     - 自动确认收货天数
 * @param {number}  data.autoCloseDays       - 超时自动关闭天数
 */
export function updatePaymentSetting(data) {
    return request({
        url: '/admin/setting/payment',
        method: 'put',
        data
    })
}

// ============================================================
//  SEO 设置
// ============================================================

/**
 * 获取 SEO 设置
 * @returns {Promise} { seoTitle, seoKeywords, seoDescription }
 */
export function getSeoSetting() {
    return request({
        url: '/admin/setting/seo',
        method: 'get'
    })
}

/**
 * 更新 SEO 设置
 * @param {Object} data
 * @param {string} data.seoTitle       - 网站标题(必填)
 * @param {string} [data.seoKeywords]  - 关键词(逗号分隔)
 * @param {string} [data.seoDescription] - 网站描述
 */
export function updateSeoSetting(data) {
    return request({
        url: '/admin/setting/seo',
        method: 'put',
        data
    })
}

// ============================================================
//  注册设置
// ============================================================

/**
 * 获取注册设置
 * @returns {Promise} { registerEnabled, emailVerifyEnabled, inviteOnly, defaultAvatar }
 */
export function getRegisterSetting() {
    return request({
        url: '/admin/setting/register',
        method: 'get'
    })
}

/**
 * 更新注册设置
 * @param {Object}  data
 * @param {boolean} data.registerEnabled     - 是否开放注册
 * @param {boolean} data.emailVerifyEnabled  - 是否开启邮箱验证
 * @param {boolean} data.inviteOnly          - 是否仅限邀请
 * @param {string}  [data.defaultAvatar]     - 新用户默认头像 URL
 */
export function updateRegisterSetting(data) {
    return request({
        url: '/admin/setting/register',
        method: 'put',
        data
    })
}

// ============================================================
//  维护模式
// ============================================================

/**
 * 获取维护模式设置
 * @returns {Promise} { maintenanceMode, maintenanceMessage, maintenanceEndTime }
 */
export function getMaintenanceSetting() {
    return request({
        url: '/admin/setting/maintenance',
        method: 'get'
    })
}

/**
 * 更新维护模式设置
 * ⚠️ maintenanceMode=true 时，用户端将显示维护页面
 * @param {Object}  data
 * @param {boolean} data.maintenanceMode     - 是否开启维护模式
 * @param {string}  [data.maintenanceMessage]- 维护提示语
 * @param {string}  [data.maintenanceEndTime]- 预计恢复时间(如 "2026-03-05 08:00")
 */
export function updateMaintenanceSetting(data) {
    return request({
        url: '/admin/setting/maintenance',
        method: 'put',
        data
    })
}