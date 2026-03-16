import request from '@/utils/request'

/**
 * AI星图识别 API
 *
 * 接口列表:
 *   submitRecognition      POST /recognition/submit        提交识别任务（4.1）
 *   getRecognitionStatus   GET  /recognition/status/{id}   查询识别状态（4.1，等待页）
 *   getRecognitionDetail   GET  /recognition/{id}          识别详情（4.2，结果页）
 *   getRecognitionHistory  GET  /recognition/history       用户历史记录（4.2）
 */

/**
 * 提交星图识别任务
 *
 * @param {string} imageData 纯 base64 字符串（不含 data:image/...;base64, 前缀）
 * @returns {Promise<{ id: number, status: 0 }>}
 */
export function submitRecognition(imageData) {
    return request({
        url: '/recognition/submit',
        method: 'post',
        data: { imageData },
        // 图片体积可能较大，设置 30 秒超时
        timeout: 30000
    })
}

/**
 * 查询识别状态（等待页面轮询用）
 *
 * 返回 status:
 *   0 → 识别中，继续轮询
 *   1 → 识别成功，可跳结果页
 *   2 → 识别失败，展示 failReason
 *
 * @param {number} recognitionId 识别记录 ID
 * @returns {Promise<RecognitionVO>}
 */
export function getRecognitionStatus(recognitionId) {
    return request({
        url: `/recognition/status/${recognitionId}`,
        method: 'get'
    })
}

/**
 * 获取识别详情（结果页使用）
 *
 * 返回完整识别结果: 坐标、天体列表、机器标签、标注图片 URL、推荐商品 ID 列表
 *
 * @param {number} recognitionId 识别记录 ID
 * @returns {Promise<RecognitionVO>}
 */
export function getRecognitionDetail(recognitionId) {
    return request({
        url: `/recognition/${recognitionId}`,
        method: 'get'
    })
}

/**
 * 查询用户历史识别记录（分页）
 *
 * @param {number} pageNum  页码（默认 1）
 * @param {number} pageSize 每页数量（默认 10，最大 50）
 * @returns {Promise<{ list: RecognitionVO[], total: number, pageNum: number, pageSize: number }>}
 */
export function getRecognitionHistory(pageNum = 1, pageSize = 10) {
    return request({
        url: '/recognition/history',
        method: 'get',
        params: { pageNum, pageSize }
    })
}