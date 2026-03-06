<template>
  <!--
    账号设置页
    文件路径: src/views/user/UserSettings.vue

    📌 当前状态: 占位页，2.4.5 节完整实现
    📌 功能规划:
      - 修改密码（旧密码验证 → 设置新密码）
      - 修改昵称/头像/城市/兴趣标签
      - 安全通知配置
  -->
  <div class="placeholder-page">
    <el-empty>
      <template #image>
        <el-icon style="font-size: 80px; color: #dcdfe6;"><Setting /></el-icon>
      </template>
      <template #description>
        <p class="placeholder-title">账号设置</p>
        <p class="placeholder-sub">功能开发中，敬请期待</p>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { Setting } from '@element-plus/icons-vue'
</script>

<style scoped>
.placeholder-page {
  background: #fff;
  border-radius: 8px;
  padding: 60px 24px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 8px 0 4px;
}
.placeholder-sub {
  color: #999;
  font-size: 14px;
}
</style>