<template>
  <div class="review-list">
    <!-- 排序和筛选 -->
    <div class="review-filters">
      <el-radio-group v-model="localSortType" @change="handleSortChange">
        <el-radio-button :value="1">最新评价</el-radio-button>
        <el-radio-button :value="2">点赞最多</el-radio-button>
        <el-radio-button :value="3">评分最高</el-radio-button>
        <el-radio-button :value="4">评分最低</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 评价列表 -->
    <div v-loading="loading" class="review-items">
      <div
          v-for="review in reviews"
          :key="review.id"
          class="review-item"
      >
        <!-- 用户信息 -->
        <div class="review-user">
          <el-avatar :src="review.avatar" :size="48">
            {{ review.nickname?.charAt(0) }}
          </el-avatar>
          <div class="user-info">
            <div class="user-name">{{ review.nickname }}</div>
            <el-rate
                :model-value="review.rating"
                disabled
                show-score
                text-color="#ff9900"
                :score-template="`${review.rating}分`"
            />
          </div>
          <div class="review-time">{{ formatTime(review.createTime) }}</div>
        </div>

        <!-- 评价内容 -->
        <div class="review-content">
          <p>{{ review.content }}</p>

          <!-- 评价图片 -->
          <div v-if="review.images && review.images.length > 0" class="review-images">
            <el-image
                v-for="(img, index) in review.images"
                :key="index"
                :src="img"
                :preview-src-list="review.images"
                :initial-index="index"
                fit="cover"
                class="review-image"
                lazy
            />
          </div>
        </div>

        <!-- 商家回复 -->
        <div v-if="review.replyContent" class="merchant-reply">
          <div class="reply-label">
            <el-icon><ChatDotRound /></el-icon>
            商家回复:
          </div>
          <div class="reply-content">{{ review.replyContent }}</div>
          <div class="reply-time">{{ formatTime(review.replyTime) }}</div>
        </div>

        <!-- 评价操作 -->
        <div class="review-actions">
          <!-- ✅ 点赞按钮 - 正确显示点赞状态 -->
          <el-button
              :type="review.isLiked ? 'primary' : 'default'"
              :icon="review.isLiked ? StarFilled : Star"
              size="small"
              @click="handleLike(review)"
          >
            {{ review.isLiked ? '已赞' : '点赞' }}
            <span v-if="review.likeCount > 0">({{ review.likeCount }})</span>
          </el-button>

          <!-- 删除按钮(仅自己的评价) -->
          <el-button
              v-if="showDelete && review.userId === currentUserId"
              type="danger"
              size="small"
              plain
              @click="handleDelete(review)"
          >
            删除
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && reviews.length === 0" description="暂无评价" />
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="review-pagination">
      <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StarFilled, Star, ChatDotRound } from '@element-plus/icons-vue'
import { toggleLike, deleteReview } from '@/api/review'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const props = defineProps({
  reviews: {
    type: Array,
    required: true,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['refresh', 'page-change', 'size-change', 'sort-change'])

const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

const localSortType = ref(1) // 排序方式

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// ✅ 点赞/取消点赞
const handleLike = async (review) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    await toggleLike(review.id)
    ElMessage.success(review.isLiked ? '取消点赞成功' : '点赞成功')
    emit('refresh')
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 删除评价
const handleDelete = async (review) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteReview(review.id)
    ElMessage.success('删除成功')
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 排序改变
const handleSortChange = () => {
  emit('sort-change', localSortType.value)
}

// 页码改变
const handlePageChange = (page) => {
  emit('page-change', page)
}

// 每页数量改变
const handleSizeChange = (size) => {
  emit('size-change', size)
}
</script>

<style scoped lang="scss">
.review-list {
  padding: 20px 0;
}

.review-filters {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.review-items {
  min-height: 200px;
}

.review-item {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .review-user {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .user-info {
      flex: 1;

      .user-name {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-bottom: 4px;
      }
    }

    .review-time {
      font-size: 14px;
      color: #999;
    }
  }

  .review-content {
    margin-bottom: 16px;

    p {
      font-size: 15px;
      line-height: 1.6;
      color: #666;
      margin-bottom: 12px;
      word-break: break-word;
    }

    .review-images {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .review-image {
        width: 100px;
        height: 100px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }

  .merchant-reply {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 16px;

    .reply-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;

      .el-icon {
        font-size: 16px;
      }
    }

    .reply-content {
      font-size: 14px;
      line-height: 1.6;
      color: #666;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .reply-time {
      font-size: 12px;
      color: #999;
      text-align: right;
    }
  }

  .review-actions {
    display: flex;
    gap: 12px;
  }
}

.review-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .review-item {
    padding: 15px;

    .review-user {
      flex-wrap: wrap;

      .review-time {
        width: 100%;
        margin-top: 8px;
        text-align: left;
      }
    }

    .review-content .review-images .review-image {
      width: 80px;
      height: 80px;
    }
  }
}
</style>