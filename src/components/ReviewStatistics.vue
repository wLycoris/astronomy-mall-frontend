<template>
  <div class="review-statistics">
    <!-- 总体评分 -->
    <div class="statistics-summary">
      <div class="avg-rating">
        <div class="rating-score">{{ statistics.avgRating?.toFixed(1) || '0.0' }}</div>
        <el-rate
            :model-value="statistics.avgRating || 0"
            disabled
            show-score
            text-color="#ff9900"
            :score-template="`${(statistics.avgRating || 0).toFixed(1)}`"
        />
        <div class="review-count">{{ statistics.reviewCount || 0 }}条评价</div>
      </div>

      <!-- 好评率 -->
      <div class="good-rate">
        <div class="rate-label">好评率</div>
        <div class="rate-value">{{ (statistics.goodRate || 0).toFixed(1) }}%</div>
      </div>

      <!-- 总点赞数 -->
      <div class="total-likes">
        <el-icon><StarFilled /></el-icon>
        <span>{{ statistics.totalLikes || 0 }}个点赞</span>
      </div>
    </div>

    <!-- 星级分布 -->
    <div class="rating-distribution">
      <!-- ✅ 全部评价选项 -->
      <div
          class="rating-bar"
          :class="{ active: activeRating === 0 }"
          @click="handleRatingClick(0)"
      >
        <div class="rating-label">
          全部评价
        </div>
        <div class="rating-progress">
          <el-progress
              :percentage="100"
              color="#409eff"
              :show-text="false"
          />
        </div>
        <div class="rating-count">{{ statistics.reviewCount || 0 }}</div>
      </div>

      <!-- ✅ 星级筛选 -->
      <div
          v-for="star in [5, 4, 3, 2, 1]"
          :key="star"
          class="rating-bar"
          :class="{ active: activeRating === star }"
          @click="handleRatingClick(star)"
      >
        <div class="rating-label">
          {{ star }}星
          <el-icon><Star /></el-icon>
        </div>
        <div class="rating-progress">
          <el-progress
              :percentage="getRatingPercentage(star)"
              :color="getProgressColor(star)"
              :show-text="false"
          />
        </div>
        <div class="rating-count">{{ getRatingCount(star) }}</div>
      </div>
    </div>

    <!-- 有图评价筛选 -->
    <div
        class="has-images-filter"
        :class="{ active: hasImagesActive }"
        @click="handleHasImagesClick"
    >
      <el-icon><Picture /></el-icon>
      <span>有图评价({{ statistics.hasImagesCount || 0 }})</span>
      <el-icon v-if="hasImagesActive" class="check-icon"><Check /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { StarFilled, Star, Picture, Check } from '@element-plus/icons-vue'

const props = defineProps({
  statistics: {
    type: Object,
    required: true,
    default: () => ({
      reviewCount: 0,
      avgRating: 0,
      goodRate: 0,
      totalLikes: 0,
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
      hasImagesCount: 0
    })
  }
})

const emit = defineEmits(['rating-click', 'has-images-click'])

// ✅ 当前选中的筛选条件
const activeRating = ref(0) // 0表示全部
const hasImagesActive = ref(false)

// 获取星级数量
const getRatingCount = (star) => {
  const key = ['oneStar', 'twoStar', 'threeStar', 'fourStar', 'fiveStar'][star - 1]
  return props.statistics[key] || 0
}

// 获取星级百分比
const getRatingPercentage = (star) => {
  const count = getRatingCount(star)
  const total = props.statistics.reviewCount || 0
  return total > 0 ? Math.round((count / total) * 100) : 0
}

// 获取进度条颜色
const getProgressColor = (star) => {
  if (star >= 4) return '#67c23a'
  if (star === 3) return '#e6a23c'
  return '#f56c6c'
}

// ✅ 点击星级筛选
const handleRatingClick = (star) => {
  if (activeRating.value === star) {
    // 取消选中
    activeRating.value = 0
    emit('rating-click', 0)
  } else {
    // 选中新星级
    activeRating.value = star
    hasImagesActive.value = false // 取消有图筛选
    emit('rating-click', star)
  }
}

// ✅ 点击有图筛选
const handleHasImagesClick = () => {
  hasImagesActive.value = !hasImagesActive.value
  if (hasImagesActive.value) {
    activeRating.value = 0 // 取消星级筛选
  }
  emit('has-images-click')
}

// ✅ 监听统计数据变化,重置筛选状态
watch(() => props.statistics, () => {
  activeRating.value = 0
  hasImagesActive.value = false
}, { deep: true })
</script>

<style scoped lang="scss">
.review-statistics {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.statistics-summary {
  display: flex;
  align-items: center;
  gap: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;

  .avg-rating {
    text-align: center;

    .rating-score {
      font-size: 48px;
      font-weight: bold;
      color: #ff9900;
      line-height: 1;
      margin-bottom: 8px;
    }

    .review-count {
      margin-top: 8px;
      font-size: 14px;
      color: #999;
    }
  }

  .good-rate {
    text-align: center;

    .rate-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .rate-value {
      font-size: 32px;
      font-weight: bold;
      color: #67c23a;
    }
  }

  .total-likes {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: #666;

    .el-icon {
      font-size: 20px;
      color: #ff9900;
    }
  }
}

.rating-distribution {
  margin-top: 20px;

  .rating-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;

    &:hover {
      background: #f5f7fa;
    }

    &.active {
      background: #ecf5ff;
      border-color: #409eff;

      .rating-label {
        color: #409eff;
        font-weight: bold;
      }
    }

    .rating-label {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100px;
      font-size: 14px;
      color: #666;
      transition: all 0.3s;

      .el-icon {
        font-size: 16px;
        color: #ff9900;
      }
    }

    .rating-progress {
      flex: 1;
    }

    .rating-count {
      width: 50px;
      text-align: right;
      font-size: 14px;
      color: #999;
    }
  }
}

.has-images-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    background: #e6e8eb;
  }

  &.active {
    background: #ecf5ff;
    border-color: #409eff;

    span {
      color: #409eff;
      font-weight: bold;
    }

    .check-icon {
      color: #67c23a;
    }
  }

  .el-icon:first-child {
    font-size: 18px;
    color: #409eff;
  }

  span {
    flex: 1;
    font-size: 14px;
    color: #666;
    transition: all 0.3s;
  }

  .check-icon {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .statistics-summary {
    flex-direction: column;
    gap: 20px;
  }

  .rating-bar .rating-label {
    width: 80px;
  }
}
</style>