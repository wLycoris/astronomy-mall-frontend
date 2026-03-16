import request from '@/utils/request'

/**
 * AI星图识别 API
 *
 * 接口列表:
 *   submitRecognition      POST /recognition/submit          提交识别任务（4.1）
 *   getRecognitionStatus   GET  /recognition/status/{id}     查询识别状态（4.1，等待页）
 *   getRecognitionDetail   GET  /recognition/{id}            识别详情（4.2，基础版）
 *   getRecognitionHistory  GET  /recognition/history         用户历史记录（4.2）
 *   getRecognitionResult   GET  /recognition/result/{id}     完整识别结果（4.3⭐新增）
 *   getRecognitionRecommend  GET  /recognition/recommend/{id}  推荐器材（4.4⭐）
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
 * 获取识别详情（基础版，不含格式化坐标和中英文天体名称）
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

/**
 * 获取完整识别结果 ⭐ 4.3新增
 *
 * 比 getRecognitionDetail 额外返回:
 *   - celestialObjects: [{ en: string, zh: string, type: string }]
 *       中英文天体名称对照，type 取值: nebula/galaxy/cluster/constellation/unknown
 *   - raFormatted:          "05h 35m 17.3s"    赤经时分秒格式
 *   - decFormatted:         "-05° 23' 28.0\""  赤纬度分秒格式
 *   - orientationFormatted: "178.50°"           方向角
 *   - radiusFormatted:      "1.230°" 或 "27.0'" 视野半径
 *
 * RecognitionResult.vue 使用此接口（代替原来的 getRecognitionDetail）
 *
 * @param {number} recognitionId 识别记录 ID
 * @returns {Promise<RecognitionVO>}
 */
export function getRecognitionResult(recognitionId) {
    return request({
        url: `/recognition/result/${recognitionId}`,
        method: 'get'
    })
}

/**
 * 获取识别关联推荐器材 ⭐ 4.4新增
 *
 * 返回 List<RecognitionProductVO>:
 *   [{ id, productName, mainImage, price, reason }]
 * 最多6个，无匹配时兜底返回热销商品
 *
 * @param {number} recognitionId 识别记录ID
 */
export function getRecognitionRecommend(recognitionId) {
    return request({ url: `/recognition/recommend/${recognitionId}`, method: 'get' })
}