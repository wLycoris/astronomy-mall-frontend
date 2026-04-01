<template>
  <!-- 瀑布流容器（CSS columns，小红书web风格5/4/3/2列）-->
  <div class="waterfall-container">
    <PostCard
      v-for="post in posts"
      :key="post.id"
      :post="post"
      @click="$emit('card-click', post)"
    />
  </div>
</template>

<script setup>
import PostCard from './PostCard.vue'

defineProps({
  posts: {
    type: Array,
    default: () => []
  }
})

defineEmits(['card-click'])
</script>

<style lang="scss" scoped>
/* 瀑布流容器 — CSS columns实现 */
.waterfall-container {
  columns: 5;
  column-gap: 12px;
}

/* 响应式列数 */
@media (max-width: 1600px) { .waterfall-container { columns: 4; } }
@media (max-width: 1200px) { .waterfall-container { columns: 3; } }
@media (max-width: 768px)  { .waterfall-container { columns: 2; } }
</style>
