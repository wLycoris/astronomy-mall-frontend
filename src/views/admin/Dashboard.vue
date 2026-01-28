<!-- ============================================ -->
<!-- Dashboard.vue - 数据概览页(占位) -->
<!-- 路径: src/views/admin/Dashboard.vue -->
<!-- ============================================ -->
<template>
  <div class="dashboard">
    <el-alert
        title="数据概览页面"
        type="info"
        description="Day 5 开发数据统计功能时会完善此页面"
        :closable="false"
        show-icon
    />

    <div style="margin-top: 20px;">
      <el-card>
        <h3>快速导航</h3>
        <el-space wrap>
          <el-button type="primary" @click="$router.push('/admin/product')">
            商品管理
          </el-button>
          <el-button type="success" @click="$router.push('/admin/order')">
            订单管理
          </el-button>
          <el-button type="warning" @click="$router.push('/admin/refund')">
            退款审核
          </el-button>
        </el-space>
      </el-card>
    </div>
  </div>
</template>

<script setup>
// 占位页面,Day 5 开发
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
</style>