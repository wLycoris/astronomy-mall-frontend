<template>
  <!--
    我的钱包页
    文件路径: src/views/user/UserWallet.vue

    📌 当前状态: 占位页，2.4.4 节完整实现
    📌 功能规划:
      - 余额展示
      - 充值入口
      - 提现入口
      - 余额流水列表（按类型筛选）
      - 与 BalanceService 对接
  -->
  <div class="placeholder-page">
    <el-empty>
      <template #image>
        <el-icon style="font-size: 80px; color: #dcdfe6;"><Wallet /></el-icon>
      </template>
      <template #description>
        <p class="placeholder-title">我的钱包</p>
        <p class="placeholder-sub">功能开发中，敬请期待</p>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { Wallet } from '@element-plus/icons-vue'
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