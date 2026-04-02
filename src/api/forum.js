// src/api/forum.js
// 论坛社区模块 - 用户端 API
// 对应后端: PostController (module/forum/)
//
// 📌 7.2 帖子发布/编辑/删除 (3个方法)
//   POST   /api/post/publish    发布帖子
//   PUT    /api/post/{id}       编辑帖子（仅草稿/已拒绝可编辑）
//   DELETE /api/post/{id}       删除帖子（逻辑删除）
//
// 📌 7.3 帖子列表+详情 (2个方法)
//   GET    /api/post/list       帖子列表（tab分流+分页，可选认证）
//   GET    /api/post/{id}       帖子详情（含互动状态，可选认证）
//
// 📌 7.4 评论+互动 (6个方法)
//   GET    /api/post/comment/list      评论列表（两级结构，公开）
//   POST   /api/post/comment           发布评论/回复
//   DELETE /api/post/comment/{id}      删除评论
//   POST   /api/post/comment/like/{id} 评论点赞/取消
//   POST   /api/post/like/{id}         帖子点赞/取消
//   POST   /api/post/collect/{id}      帖子收藏/取消

import request from '@/utils/request'

// ============================================================
// ① 发布帖子（7.2 ✅）
// ============================================================
// 入参:
//   title        - 帖子标题（必填，最长200字符）
//   content      - 帖子正文（必填）
//   images       - base64 JSON数组字符串（最多9张，Canvas压缩后）
//   tags         - JSON数组字符串，如 '["深空摄影","望远镜"]'
//   recognitionId - AI识别结果关联ID（可选）
//
// 返回: postId（帖子ID）
export function publishPost(data) {
  return request({
    url: '/post/publish',
    method: 'post',
    data
  })
}

// ============================================================
// ② 编辑帖子（7.2 ✅）
// ============================================================
// 仅 status=0(草稿) / status=3(已拒绝) 的帖子可编辑
// 编辑后根据 auto-approve 配置重新走审核或直接发布
export function updatePost(id, data) {
  return request({
    url: `/post/${id}`,
    method: 'put',
    data
  })
}

// ============================================================
// ③ 删除帖子（7.2 ✅）
// ============================================================
// @TableLogic 逻辑删除，deleted置为1
export function deletePost(id) {
  return request({
    url: `/post/${id}`,
    method: 'delete'
  })
}

// ============================================================
// ④ 帖子列表（7.3 ✅）
// ============================================================
// 参数:
//   tab      - 标签: all(推荐)/follow(关注)/hot(热门)，默认all
//   tag      - 分类标签筛选（如 "深空摄影"），可选
//   pageNum  - 页码，默认1
//   pageSize - 每页条数，默认20
//
// 可选认证: 游客可浏览，登录后follow模式生效
// 返回: { list: PostVO[], total, pageNum, pageSize }
export function getPostList(params) {
  return request({
    url: '/post/list',
    method: 'get',
    params
  })
}

// ============================================================
// ⑤ 帖子详情（7.3 ✅）
// ============================================================
// 可选认证: 游客可查看，登录后返回 isLiked/isCollected/isFollowed
// 浏览量自动+1
export function getPostDetail(id) {
  return request({
    url: `/post/${id}`,
    method: 'get'
  })
}

// ============================================================
// ⑥ 评论列表（7.4 ✅）
// ============================================================
// 两级结构: 顶级评论分页，每条顶级评论下挂子回复
// 可选认证: 游客可查看评论，无需登录
// 参数: postId, pageNum, pageSize
// 返回: { list: PostCommentVO[], total, pageNum, pageSize }
export function getCommentList(params) {
  return request({
    url: '/post/comment/list',
    method: 'get',
    params
  })
}

// ============================================================
// ⑦ 发布评论/回复（7.4 ✅）
// ============================================================
// 入参:
//   postId       - 帖子ID（必填）
//   parentId     - 父评论ID: 0=顶级评论, >0=回复(始终指向顶级评论ID)
//   replyToUserId - 被回复用户ID（回复时传入）
//   content      - 评论内容（必填）
//
// 返回: commentId
export function addComment(data) {
  return request({
    url: '/post/comment',
    method: 'post',
    data
  })
}

// ============================================================
// ⑧ 删除评论（7.4 ✅）
// ============================================================
// 仅评论作者可删除，@TableLogic 逻辑删除
export function deleteComment(id) {
  return request({
    url: `/post/comment/${id}`,
    method: 'delete'
  })
}

// ============================================================
// ⑨ 评论点赞/取消（7.4 ✅）
// ============================================================
// 幂等切换: 已点赞→取消, 未点赞→点赞
export function likeComment(id) {
  return request({
    url: `/post/comment/like/${id}`,
    method: 'post'
  })
}

// ============================================================
// ⑩ 帖子点赞/取消（7.4 ✅）
// ============================================================
// 幂等切换: 已点赞→取消, 未点赞→点赞
// 返回: true=已点赞, false=已取消
export function likePost(id) {
  return request({
    url: `/post/like/${id}`,
    method: 'post'
  })
}

// ============================================================
// ⑪ 帖子收藏/取消（7.4 ✅）
// ============================================================
// 幂等切换: 已收藏→取消, 未收藏→收藏
// 返回: true=已收藏, false=已取消
export function collectPost(id) {
  return request({
    url: `/post/collect/${id}`,
    method: 'post'
  })
}
