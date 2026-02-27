<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'

interface TableItem {
  x: number
  y: number
  num: number
  selected: boolean
}

const tableCells = ref<TableItem[]>([])
const $emit = defineEmits(['confirmInsertTable'])

const tableSize = ref({x: 5, y: 2})
const mouseDownPoint = ref({x: 0, y: 0})
const tableSelectedDesc = computed(() => {
  return mouseDownPoint.value.x > 0 || mouseDownPoint.value.y > 0 ? `${mouseDownPoint.value.y}行 ${mouseDownPoint.value.x}列  表格` : '插入表格'
})

function confirmCustomtableStyle() {
  $emit('confirmInsertTable', tableSize.value)
}

function clickTableCell(cell: TableItem) {
  $emit('confirmInsertTable', cell)
}

function moveCellEnter(event: MouseEvent, cell: TableItem) {
  mouseDownPoint.value.x = cell.x
  mouseDownPoint.value.y = cell.y
}

function moveTableParentOut() {
  console.log('moveTableParentOut')
  mouseDownPoint.value.x = 0
  mouseDownPoint.value.y = 0
}

onMounted(() => {
  // 24x8
  tableCells.value = []
  const allNum = 8 * 12
  for (let i = 1; i <= allNum; i++) {
    tableCells.value?.push({x: i % 12 === 0 ? 12 : i % 12, y: Math.ceil(i / 12), num: i + 1, selected: false})
  }
})
</script>

<template>
  <div class="table-config-container">
    <div class="config-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <line x1="3" x2="21" y1="9" y2="9"/>
        <line x1="3" x2="21" y1="15" y2="15"/>
        <line x1="3" x2="21" y1="21" y2="21"/>
      </svg>
      <span class="config-title">{{ tableSelectedDesc }}</span>
    </div>

    <div class="config-content">
      <div class="table-grid" @mouseleave="moveTableParentOut">
        <div v-for="cell in tableCells" :key="cell.num" class="table-cell" :class="mouseDownPoint.x >= cell.x && mouseDownPoint.y >= cell.y ? 'selected' : ''" @click="clickTableCell(cell)" @mouseenter="moveCellEnter($event, cell)"></div>
      </div>

      <div class="custom-section">
        <div class="section-header">
          <span class="section-title">自定义</span>
        </div>
        <div class="custom-inputs">
          <div class="custom-input-item">
            <span class="input-label">列数</span>
            <InputNumber v-model="tableSize.x" size="small" class="my-input-style" />
          </div>
          <div class="custom-input-item">
            <span class="input-label">行数</span>
            <InputNumber v-model="tableSize.y" size="small" class="my-input-style" />
          </div>
        </div>
      </div>
    </div>

    <div class="config-footer">
      <button class="confirm-button" @click="confirmCustomtableStyle">
        <span>确定</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.table-config-container {
  @apply w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.config-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.config-title {
  @apply text-xs font-semibold text-gray-800;
}

.config-content {
  @apply px-3 py-2.5 space-y-2.5;
}

.table-grid {
  @apply grid grid-cols-12 gap-1;
}

.table-cell {
  @apply size-[16px] border border-gray-200 bg-white rounded-sm cursor-pointer transition-all duration-200 hover:border-purple-300;

  &.selected {
    @apply bg-purple-500 border-purple-500;
  }
}

.custom-section {
  @apply space-y-1.5;
}

.section-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-[11px] font-medium text-gray-600;
}

.custom-inputs {
  @apply grid grid-cols-2 gap-1.5;
}

.custom-input-item {
  @apply flex items-center justify-between p-1.5 rounded-lg border border-gray-100 bg-white;
}

.input-label {
  @apply text-[11px] font-medium text-gray-700 min-w-[40px];
}

.config-footer {
  @apply px-3 py-2.5 bg-gray-50/50 border-t border-gray-100;
}

.confirm-button {
  @apply w-full h-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[11px] font-medium rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center;
}

.confirm-button:active {
  @apply transform scale-[0.98];
}

.my-input-style :deep(.p-inputtext) {
  @apply w-full border-none bg-transparent text-[11px] text-gray-700 placeholder-gray-400;
}

.my-input-style :deep(.p-inputtext:focus) {
  @apply outline-none;
}
</style>
