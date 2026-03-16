/**
 * 系统公告管理 API（管理员后台）
 *
 * 📌 接口说明:
 *   createAnnouncement  - 创建并发送公告（批量写 tb_notification）
 *   getAnnouncementList - 公告列表（分页+关键词搜索）
 *   getAnnouncementDetail - 公告详情（含已读率统计）
 *   deleteAnnouncement  - 删除公告（软删除）
 *
 * 文件路径: src/api/admin/announcement.js
 */
import request from '@/utils/request'

/**
 * 创建并发送系统公告
 * 后端会批量写入 tb_notification（每个用户一条）
 *
 * @param {Object} data
 * @param {string} data.title    - 公告标题（必填，最多100字）
 * @param {string} data.content  - 公告内容（必填，最多5000字）
 * @param {number} data.priority - 优先级（0-普通 1-重要 2-紧急，默认0）
 * @returns {Promise} 返回 AnnouncementVO（含 announcementId、sendCount 等）
 */
export function createAnnouncement(data) {
    return request({
        url: '/admin/announcement',
        method: 'post',
        data
    })
}

/**
 * 查询公告列表（分页）
 *
 * @param {Object} params
 * @param {number} params.pageNum   - 页码（默认1）
 * @param {number} params.pageSize  - 每页数量（默认10）
 * @param {string} [params.keyword] - 关键词（搜索标题，可选）
 * @param {string} [params.startTime] - 开始时间，格式 yyyy-MM-dd HH:mm:ss（可选）
 * @param {string} [params.endTime]   - 结束时间，格式 yyyy-MM-dd HH:mm:ss（可选）
 * @returns {Promise} 返回 Page<AnnouncementVO>（标准 records/total 结构）
 */
export function getAnnouncementList(params) {
    return request({
        url: '/admin/announcement/list',
        method: 'get',
        params
    })
}

/**
 * 查询公告详情
 *
 * @param {number|string} id - 公告ID（即 tb_notification.related_id）
 * @returns {Promise} 返回 AnnouncementVO（含 sendCount、readCount、readRate）
 */
export function getAnnouncementDetail(id) {
    return request({
        url: `/admin/announcement/${id}`,
        method: 'get'
    })
}

/**
 * 删除公告（软删除）
 * 将该公告对应的所有 tb_notification 记录的 deleted 设为 1
 *
 * @param {number|string} id - 公告ID（即 tb_notification.related_id）
 * @returns {Promise}
 */
export function deleteAnnouncement(id) {
    return request({
        url: `/admin/announcement/${id}`,
        method: 'delete'
    })
}