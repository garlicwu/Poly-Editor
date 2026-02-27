<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {QuillOlType} from '@/view/editor/tool/editor-util'

const props = defineProps({
  current: {type: String, default: ''},
  type: {type: String, default: ''},
})

interface ListSelectStyleType {
  name: string
  value: string
  type: QuillOlType
}

const emit = defineEmits(['onSelectedValue'])
const categories = ref<ListSelectStyleType[]>([])
const selectedValue = ref('')
onMounted(() => {})
watch(
  () => props.current,
  (value: any) => {
    if (props.type.includes('ordered')) {
      categories.value = [
        {name: '1.样式 间隔-1', value: '1', type: QuillOlType.default},
        {name: '1.样式 间隔-2', value: '2', type: QuillOlType.default},
        {name: '1.样式 间隔-3', value: '3', type: QuillOlType.default},
        {name: '①样式 间隔-1', value: 'circle-1', type: QuillOlType.olCircle},
        {name: '①样式 间隔-2', value: 'circle-2', type: QuillOlType.olCircle},
        {name: '①样式 间隔-3', value: 'circle-3', type: QuillOlType.olCircle},
        {name: '(1)样式 间隔-1', value: 'parentheses-1', type: QuillOlType.olParentheses},
        {name: '(1)样式 间隔-2', value: 'parentheses-2', type: QuillOlType.olParentheses},
        {name: '(1)样式 间隔-3', value: 'parentheses-3', type: QuillOlType.olParentheses},
      ]
    } else {
      categories.value = [
        {name: '·样式 间隔-1', value: '1', type: QuillOlType.default},
        {name: '·样式 间隔-2', value: '2', type: QuillOlType.default},
        {name: '·样式 间隔-3', value: '3', type: QuillOlType.default},
      ]
    }

    if (value instanceof Array) {
      selectedValue.value = ''
    } else {
      const splitValue = value?.split('-') ?? ''
      selectedValue.value = (splitValue[1] ?? '') + (splitValue[2] ? '-' + (splitValue[2] ?? '') : '')
    }
  },
  {immediate: true},
)

function onSelectedValue(value: string) {
  emit('onSelectedValue', value)
}

const contentName = (category: {value: string; name: string; type: QuillOlType}) => {
  let name = '间距：' + category.value
  switch (category.type) {
    case QuillOlType.default:
      name = props.type === 'ordered' ? '1.样式' : '·样式' + name
      break
    case QuillOlType.olCircle:
      name = '①样式' + name
      break
    case QuillOlType.olParentheses:
      name = '(1)样式' + name
      break
  }
  return name
}
</script>

<template>
  <div class="ol-size-container">
    <div class="ol-size-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" x2="21" y1="6" y2="6"/>
        <line x1="8" x2="21" y1="12" y2="12"/>
        <line x1="8" x2="21" y1="18" y2="18"/>
        <line x1="3" x2="3.01" y1="6" y2="6"/>
        <line x1="3" x2="3.01" y1="12" y2="12"/>
        <line x1="3" x2="3.01" y1="18" y2="18"/>
      </svg>
      <span class="header-title">列表样式</span>
    </div>

    <div class="ol-size-list">
      <div v-for="category of categories" :key="category.name" class="ol-size-item" :class="selectedValue === category.value ? 'selected' : ''" @click="onSelectedValue(category.value)">
        <span>{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.ol-size-container {
  @apply w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.ol-size-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.header-title {
  @apply text-xs font-semibold text-gray-800;
}

.ol-size-list {
  @apply max-h-64 overflow-y-auto;
}

.ol-size-item {
  @apply w-full h-9 px-3 text-[11px] text-gray-700 flex items-center cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:text-purple-700;

  &.selected {
    @apply bg-purple-100 text-purple-700 font-medium;
  }
}
</style>
