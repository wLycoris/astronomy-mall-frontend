// src/api/forum.js
// 论坛社区模块 - 用户端 API
// 对应后端: PostController (module/forum/)
//
// 📌 7.2 帖子发布/编辑/删除 (3个方法)
//   POST   /api/post/publish    发布帖子
//   PUT    /api/post/{id}       编辑帖子（仅草稿/已拒绝可编辑）
//   DELETE /api/post/{id}       删除帖子（逻辑删除）

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
