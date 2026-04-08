import request from '@/utils/request'

/**
 * 后台论坛管理 API（7.7）
 * 文件路径: src/api/admin/forum.js
 *
 * 接口前缀: /api/admin/post
 * 后端: AdminPostController.java（module/admin/controller/）
 *
 * 📌 8 个方法对应后端 8 个端点:
 *   1. getPostList         - 帖子列表（分页+状态+关键词筛选）
 *   2. auditPost           - 审核帖子（approve/reject）
 *   3. toggleTopPost       - 加入/取消推荐（is_top 字段已重新定位为推荐信号）
 *   4. deletePost          - 删除帖子（status=4）
 *   5. getCommentList      - 评论列表
 *   6. deleteComment       - 删除评论
 *   7. getForumStats       - 论坛数据统计
 *   8. getPendingCount     - 待审核数量（侧栏角标）
 */

/**
 * 1. 获取帖子列表（管理员视角）
 * @param {Object} params
 * @param {number} [params.status]   - 状态(0草稿/1审核中/2已发布/3已拒绝/4管理员删除)，留空=全部
 * @param {string} [params.keyword]  - 关键词（标题/内容/作者昵称）
 * @param {number} params.pageNum    - 页码
 * @param {number} params.pageSize   - 每页条数
 */
export function getPostList(params) {
    return request({
        url: '/admin/post/list',
        method: 'get',
        params
    })
}

/**
 * 2. 审核帖子
 * @param {number} id - 帖子ID
 * @param {Object} data
 * @param {string} data.action - "approve"=通过 / "reject"=拒绝
 * @param {string} [data.reason] - 拒绝原因（reject 时必填）
 */
export function auditPost(id, data) {
    return request({
        url: `/admin/post/audit/${id}`,
        method: 'post',
        data
    })
}

/**
 * 3. 加入/取消"管理员推荐"（幂等切换）
 *
 * 📌 7.7 重新定位:
 *   原"置顶/取消置顶"功能因小红书风格瀑布流无视觉效果而废弃。
 *   底层 DB 字段 is_top 复用为"管理员推荐信号"：
 *   - 用户端列表/卡片不感知此字段
 *   - 8.x 推荐算法读取作为 hot_score 加权因子
 *   - URL 仍保留 /admin/post/top/{id} 以减小迁移成本
 *
 * @param {number} id - 帖子ID
 */
export function toggleTopPost(id) {
    return request({
        url: `/admin/post/top/${id}`,
        method: 'post'
    })
}

/**
 * 4. 删除帖子（status=4，作者仍可见"已被管理员删除"提示）
 * @param {number} id - 帖子ID
 */
export function deletePost(id) {
    return request({
        url: `/admin/post/${id}`,
        method: 'delete'
    })
}

/**
 * 5. 获取评论列表（可按帖子筛选）
 * @param {Object} params
 * @param {number} [params.postId]   - 帖子ID（可选）
 * @param {string} [params.keyword]  - 评论内容关键词
 * @param {number} params.pageNum
 * @param {number} params.pageSize
 */
export function getCommentList(params) {
    return request({
        url: '/admin/post/comment/list',
        method: 'get',
        params
    })
}

/**
 * 6. 删除评论
 * @param {number} id - 评论ID
 */
export function deleteComment(id) {
    return request({
        url: `/admin/post/comment/${id}`,
        method: 'delete'
    })
}

/**
 * 7. 获取论坛数据统计
 * 返回 ForumStatsVO: { todayPostCount, todayCommentCount, todayActiveUsers,
 *                     totalPostCount, totalCommentCount, totalUserCount,
 *                     pendingCount, statusDistribution[], last7DaysTrend[] }
 */
export function getForumStats() {
    return request({
        url: '/admin/post/stats',
        method: 'get'
    })
}

/**
 * 8. 获取待审核帖子数量（用于侧边栏角标）
 */
export function getPendingCount() {
    return request({
        url: '/admin/post/pending/count',
        method: 'get'
    })
}
