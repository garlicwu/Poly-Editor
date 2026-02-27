<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'

const props = defineProps({current: {type: String, default: ''}})

const editorStore = useEditorStore()
const {currentComponentList} = storeToRefs(editorStore)
const emit = defineEmits(['onSelectedValue'])
const categories = ref([
  {name: '左对齐', value: 'alignLeft'},
  {name: '居中水平对齐', value: 'alignCenter'},
  {name: '居中垂直对齐', value: 'alignVerticalCenter'},
  {
    name: '右对齐',
    value: 'alignRight',
  },
  {
    name: '画布左对齐',
    value: 'alignCanvasLeft',
  },
  {
    name: '画布右对齐',
    value: 'alignCanvasRight',
  },
])
const selectedValue = ref('')
onMounted(() => {
  if (currentComponentList.value.filter((item) => item.selected).length > 2) {
    categories.value.push({name: '垂直等距', value: 'verticalIsometric'})
    categories.value.push({name: '水平等距', value: 'horizontalIsometric'})
  }
})
watch(
  () => props.current,
  (value: string) => {
    selectedValue.value = value
  },
  {immediate: true},
)

function onSelectedValue(value: string) {
  switch (value) {
    case 'alignLeft':
      editorStore.alignComponentWithList('left')
      break
    case 'alignCenter':
      editorStore.alignComponentWithList('center')
      break
    case 'alignRight':
      editorStore.alignComponentWithList('right')
      break
    case 'alignCanvasLeft':
      editorStore.alignComponentWithList('canvas_left')
      break
    case 'alignCanvasRight':
      editorStore.alignComponentWithList('canvas_right')
      break
    case 'alignVerticalCenter':
      editorStore.alignComponentWithList('vertical_center')
      break
    case 'verticalIsometric':
      editorStore.isometricComponentWithGroup('verticalIsometric')
      break
    case 'horizontalIsometric':
      editorStore.isometricComponentWithGroup('horizontalIsometric')
      break
  }
  emit('onSelectedValue', value)
}
</script>

<template>
  <div class="component-align-container">
    <div class="component-align-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="21" x2="3" y1="6" y2="6"/>
        <line x1="21" x2="3" y1="12" y2="12"/>
        <line x1="21" x2="3" y1="18" y2="18"/>
      </svg>
      <span class="header-title">对齐方式</span>
    </div>

    <div class="component-align-list">
      <div v-for="category of categories" :key="category.name" class="component-align-item" :class="selectedValue === category.value ? 'selected' : ''" @click="onSelectedValue(category.value)">
        <span>{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.component-align-container {
  @apply w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.component-align-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.header-title {
  @apply text-xs font-semibold text-gray-800;
}

.component-align-list {
  @apply max-h-64 overflow-y-auto;
}

.component-align-item {
  @apply w-full h-9 px-3 text-[11px] text-gray-700 flex items-center cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:text-purple-700;

  &.selected {
    @apply bg-purple-100 text-purple-700 font-medium;
  }
}
</style>
