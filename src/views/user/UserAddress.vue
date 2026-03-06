<template>
  <!--
    收货地址管理页
    文件路径: src/views/user/UserAddress.vue

    📌 当前状态: 占位页，2.4.2 节完整实现
    📌 功能规划:
      - 收货地址列表
      - 新增/编辑/删除地址
      - 设置默认地址
      - 最多5个地址限制
      - 改造 CheckoutPage 为"选地址"模式
  -->
  <div class="placeholder-page">
    <el-empty>
      <template #image>
        <el-icon style="font-size: 80px; color: #dcdfe6;"><Location /></el-icon>
      </template>
      <template #description>
        <p class="placeholder-title">收货地址</p>
        <p class="placeholder-sub">功能开发中，敬请期待</p>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { Location } from '@element-plus/icons-vue'
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