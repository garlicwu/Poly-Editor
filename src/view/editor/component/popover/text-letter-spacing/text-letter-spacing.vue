<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {fontLetterSpaceList} from '@/lib/font-face-list'

const prop = defineProps({currentSelectLetterSpacing: {type: String, default: ''}})
const emit = defineEmits(['onSelectedValue'])
const categories = ref([{name: '1', value: ''}])
const selectedValue = ref('')
onMounted(() => {
  categories.value = fontLetterSpaceList.map((item) => {
    return {
      name: item,
      icon: '',
      value: item,
    }
  })
})
watch(
  () => prop.currentSelectLetterSpacing,
  (value: string) => {
    console.log('currentSelectLetterSpacing', value)
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
  <div class="letter-spacing-container">
    <div class="letter-spacing-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 7V4h16v3"/>
        <path d="M9 20h6"/>
        <path d="M12 4v16"/>
      </svg>
      <span class="header-title">字间距</span>
    </div>

    <div class="letter-spacing-list">
      <div v-for="category of categories" :key="category.name" class="letter-spacing-item" :class="selectedValue === category.value ? 'selected' : ''" @click="onSelectedValue(category.value)">
        <span>{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.letter-spacing-container {
  @apply w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.letter-spacing-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.header-title {
  @apply text-xs font-semibold text-gray-800;
}

.letter-spacing-list {
  @apply max-h-64 overflow-y-auto;
}

.letter-spacing-item {
  @apply w-full h-9 px-3 text-[11px] text-gray-700 flex items-center cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:text-purple-700;

  &.selected {
    @apply bg-purple-100 text-purple-700 font-medium;
  }
}
</style>
