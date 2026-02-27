<script setup lang="ts">
import {ref} from 'vue'

const categories = ref([
  {name: '水平方向', icon: '一级标题锁定'},
  {name: '垂直方向从左往右', icon: '一级标题锁定'},
  {name: '垂直方向从左往右', icon: '一级标题锁定'},
  {name: '所有文字顺时针旋转90º', icon: '一级标题锁定'},
  {name: '所有文字逆时针旋转90º', icon: '一级标题锁定'},
  {name: '中文字符逆时针旋转90º', icon: '一级标题锁定'},
])
const selectedCategories = ref('水平方向')
</script>

<template>
  <div class="text-direction-container">
    <div class="text-direction-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" x2="12" y1="22.08" y2="12"/>
      </svg>
      <span class="header-title">文字方向</span>
    </div>

    <div class="text-direction-list">
      <div v-for="category of categories" :key="category.name" class="text-direction-item" :class="selectedCategories === category.name ? 'selected' : ''" @click="selectedCategories = category.name">
        <span>{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.text-direction-container {
  @apply w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.text-direction-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.header-title {
  @apply text-xs font-semibold text-gray-800;
}

.text-direction-list {
  @apply max-h-64 overflow-y-auto;
}

.text-direction-item {
  @apply w-full h-9 px-3 text-[11px] text-gray-700 flex items-center cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:text-purple-700;

  &.selected {
    @apply bg-purple-100 text-purple-700 font-medium;
  }
}
</style>
