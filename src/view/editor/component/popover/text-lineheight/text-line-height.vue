<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {fontLineHeightList} from '@/lib/font-face-list'

const prop = defineProps({currentSelectLineHeight: {type: String, default: ''}})
const emit = defineEmits(['onSelectedValue'])
const categories = ref([{name: '1.0', icon: '一级标题锁定', value: ''}])
const selectedValue = ref('1.0')
onMounted(() => {
  categories.value = fontLineHeightList.map((item) => {
    return {
      name: item.replace('-', '.'),
      icon: '',
      value: item,
    }
  })
})
watch(
  () => prop.currentSelectLineHeight,
  (value: string) => {
    console.log('currentSelectLineHeight', value)
    selectedValue.value = value
  },
  {immediate: true},
)

function onSelectedValue(value: string) {
  if (selectedValue.value !== value) {
    selectedValue.value = value
    emit('onSelectedValue', selectedValue.value)
  }
}
</script>

<template>
  <div class="line-height-container">
    <div class="line-height-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" x2="20" y1="6" y2="6"/>
        <line x1="4" x2="20" y1="12" y2="12"/>
        <line x1="4" x2="20" y1="18" y2="18"/>
      </svg>
      <span class="header-title">行高</span>
    </div>

    <div class="line-height-list">
      <div v-for="category of categories" :key="category.name" class="line-height-item" :class="selectedValue === category.value ? 'selected' : ''" @click="onSelectedValue(category.value)">
        <span>{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.line-height-container {
  @apply w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.line-height-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.header-title {
  @apply text-xs font-semibold text-gray-800;
}

.line-height-list {
  @apply max-h-64 overflow-y-auto;
}

.line-height-item {
  @apply w-full h-9 px-3 text-[11px] text-gray-700 flex items-center cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:text-purple-700;

  &.selected {
    @apply bg-purple-100 text-purple-700 font-medium;
  }
}
</style>
