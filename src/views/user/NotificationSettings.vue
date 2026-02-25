<template>
  <div class="notification-settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知设置</span>
          <el-tag type="info" size="small">自定义接收哪些通知</el-tag>
        </div>
      </template>

      <div v-loading="loading">
        <!-- 按模块分组 -->
        <div v-for="(group, moduleName) in groupedSettings" :key="moduleName" class="module-group">
          <div class="module-title">
            <el-icon class="module-icon" :class="`icon-${group[0].module}`">
              <component :is="getModuleIcon(group[0].module)" />
            </el-icon>
            <span>{{ moduleName }}</span>
            <el-divider direction="horizontal" />
          </div>

          <el-row :gutter="20">
            <el-col
                v-for="setting in group"
                :key="`${setting.module}-${setting.type}`"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
            >
              <div class="setting-item">
                <div class="setting-label">
                  {{ setting.typeName }}
                </div>
                <el-switch
                    v-model="setting.enabled"
                    :active-value="1"
                    :inactive-value="0"
                    @change="handleChange(setting)"
                />
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ShoppingCart,
  ChatDotRound,
  Reading,
  Location,
  StarFilled,
  Cpu,
  Bell
} from '@element-plus/icons-vue'
import { getNotificationSettings, updateNotificationSettings } from '@/api/notification'

const loading = ref(false)
const settings = ref([])

// 模块图标映射
const moduleIcons = {
  mall: markRaw(ShoppingCart),
  forum: markRaw(ChatDotRound),
  course: markRaw(Reading),
  location: markRaw(Location),
  recommend: markRaw(StarFilled),
  ai: markRaw(Cpu),
  system: markRaw(Bell)
}

// 获取模块图标
const getModuleIcon = (module) => {
  return moduleIcons[module] || Bell
}

// 按模块分组
const groupedSettings = computed(() => {
  const groups = {}
  settings.value.forEach(setting => {
    const moduleName = setting.moduleName
    if (!groups[moduleName]) {
      groups[moduleName] = []
    }
    groups[moduleName].push(setting)
  })
  return groups
})

// 获取设置
const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await getNotificationSettings()
    settings.value = res.data
  } catch (error) {
    ElMessage.error('获取通知设置失败')
  } finally {
    loading.value = false
  }
}

// 更新设置
const handleChange = async (setting) => {
  try {
    await updateNotificationSettings({
      module: setting.module,
      type: setting.type,
      enabled: setting.enabled
    })
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
    // 恢复原状态
    setting.enabled = setting.enabled === 1 ? 0 : 1
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.notification-settings {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-group {
  margin-bottom: 30px;
}

.module-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.module-icon {
  font-size: 20px;
  margin-right: 8px;
}

.icon-mall { color: #409eff; }
.icon-forum { color: #67c23a; }
.icon-course { color: #f56c6c; }
.icon-location { color: #909399; }
.icon-recommend { color: #e6a23c; }
.icon-ai { color: #909399; }
.icon-system { color: #e6a23c; }

.module-title .el-divider {
  flex: 1;
  margin: 0 0 0 15px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  background: #f5f7fa;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.setting-item:hover {
  background: #e8f4ff;
}

.setting-label {
  font-size: 14px;
  color: #606266;
}
</style>