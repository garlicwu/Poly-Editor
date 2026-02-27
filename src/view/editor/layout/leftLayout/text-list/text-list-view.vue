<script setup lang="ts">
import {useEditorStore} from '@/store/editorStore'
import {Combine_Lang, EComponentType, type IComponentAddTypeItem, type IComponentInfo} from '@/view/editor/utils/common-modle'
import {useToast} from 'primevue/usetoast'
import {reactive, ref, watch} from 'vue'
import {type FontSizeInfoType, useTextEditorStore} from '@/store/textEdiotrSotre'
import {storeToRefs} from 'pinia'
import {type DraggableEvent, VueDraggable} from 'vue-draggable-plus'

const editorStore = useEditorStore()
const {editorLang, currentPage, post} = storeToRefs(editorStore)
// const {onEnd,onStart} = useViewDraggerHook()
const textEditorStore = useTextEditorStore()
const {allFontMap} = storeToRefs(textEditorStore)

const textListRef = ref()
const textTypeList = ref<IComponentAddTypeItem[]>([])

const fixedTextComponents = [
  { name: 'Yaber目录标题', displayName: '目录标题' },
  { name: 'Yaber目录', displayName: '目录' },
  { name: 'Yaber一级标题', displayName: '一级标题' },
  { name: 'Yaber二级标题', displayName: '二级标题' },
  { name: 'Yaber三级标题', displayName: '三级标题' },
  { name: 'Yaber正文', displayName: '正文' },
  { name: 'Yaber备注文字', displayName: '备注文字' },
]

watch(
  () => allFontMap.value,
  (value) => {
    textTypeList.value = []
    let currentTextComponents: Record<string, FontSizeInfoType> | undefined

    if (editorLang.value === Combine_Lang) {
      currentTextComponents = allFontMap.value['cn'] as Record<string, FontSizeInfoType>
      if (!currentTextComponents) {
        const firstLangKey = Object.keys(allFontMap.value)[0]
        currentTextComponents = allFontMap.value[firstLangKey] as Record<string, FontSizeInfoType>
      }
    } else {
      currentTextComponents = allFontMap.value[editorLang.value] as Record<string, FontSizeInfoType>
    }

    if (currentTextComponents) {
      fixedTextComponents.forEach((item) => {
        const componentConfig = currentTextComponents[item.name]
        if (componentConfig) {
          textTypeList.value.push({
            name: item.name,
            displayName: item.displayName,
            style: {
              fontSize: Math.max(componentConfig.size / 12, 0.75) + 'rem',
              fontFamily: componentConfig.font,
              fontWeight: item.name.includes('标题') ? 'bold' : '500',
            },
            width: 0,
            height: 0,
            type: EComponentType.Text,
          })
        }
      })
    }
  },
  {
    immediate: true,
  },
)
const toast = useToast()
const show = () => {
  toast.add({severity: 'warning', summary: '提示', detail: '当面页面为空，不能添加组件', life: 2000})
}

const clickTextItem = (textType: IComponentAddTypeItem) => {
  if (editorStore.currentPage) {
    editorStore.clickCurrentPageComponentAction(textType)
  } else {
    show()
  }
}

const dblclickItem = (textType: IComponentAddTypeItem) => {
  // 双击，自动添加
  if (editorStore.currentPage) {
    const addTextType = {...textType, autoAdd: true}
    const {pixelHeight, pixelWidth} = currentPage.value?.pageSize || {}
    if (textType.name.includes('标题')) {
      addTextType.height = (pixelHeight ?? 1920) / 12
    } else {
      addTextType.height = (pixelHeight ?? 1920) / 8
    }
    addTextType.width = (pixelWidth ?? 1080) - 240
    console.log('dblclickItem', addTextType)
    editorStore.clickCurrentPageComponentAction(addTextType)
  } else {
    show()
  }
}

const dragRectMouseGap = reactive({x: 0, y: 0})

function onStart(event: any) {
  console.log('start drag', event)
  const {dragWidth, dragHeight} = configDragWidth(event.clonedData)
  const textDragHtmlElement = document.getElementsByClassName('text-drag-item-layout')?.[0] as HTMLElement
  
  if (textDragHtmlElement) {
    textDragHtmlElement.style.setProperty('width', dragWidth + 'px')
    textDragHtmlElement.style.setProperty('height', dragHeight + 'px')
    textDragHtmlElement.style.setProperty('transition', 'none')
    
    const originalElement = event.originalEvent.target.closest('.text-card-item')
    if (originalElement) {
      const originalRect = originalElement.getBoundingClientRect()
      const mouseX = event.originalEvent.x
      const mouseY = event.originalEvent.y
      const offsetX = mouseX - originalRect.left
      const offsetY = mouseY - originalRect.top
      
      dragRectMouseGap.x = offsetX
      dragRectMouseGap.y = offsetY
      
      const left = mouseX - offsetX
      const top = mouseY - offsetY
      textDragHtmlElement.style.setProperty('left', left + 'px')
      textDragHtmlElement.style.setProperty('top', top + 'px')
      textDragHtmlElement.style.setProperty('transform', 'translate3d(0, 0, 0)')
    }
    
    requestAnimationFrame(() => {
      textDragHtmlElement.style.setProperty('transition', 'box-shadow 0.15s ease-out')
    })
  }
}

function onEnd(event: any) {
  console.log('end drag', event)
  const data = event.clonedData

  const {dragWidth, dragHeight} = configDragWidth(event.clonedData, true)
  if (editorStore.currentPage) {
    const addTextType = {...data, dragAdd: true} as IComponentAddTypeItem
    addTextType.height = dragHeight
    addTextType.width = dragWidth
    addTextType.left = event.originalEvent.x
    addTextType.top = event.originalEvent.y
    addTextType.dragMouseX = dragRectMouseGap.x
    addTextType.dragMouseY = dragRectMouseGap.y
    console.log('dragEnd', addTextType)
    editorStore.clickCurrentPageComponentAction(addTextType)
  }
  dragRectMouseGap.x = 0
  dragRectMouseGap.y = 0
}

function configDragWidth(data: any, end: boolean = false) {
  let dragWidth = 400
  let dragHeight = 200
  if (editorStore.currentPage) {
    const scale = !end ? (post.value.scale ?? 1) : 1
    const {pixelHeight, pixelWidth} = currentPage.value?.pageSize || {}
    if (data.name.includes('标题')) {
      dragHeight = Number((((pixelHeight ?? 1920) / 12) * scale).toFixed(5))
    } else {
      dragHeight = Number((((pixelHeight ?? 1920) / 8) * scale).toFixed(5))
    }
    dragWidth = Number((((pixelWidth ?? 1080) - 240) * scale).toFixed(5))
  }

  return {dragWidth, dragHeight}
}

function getComponentLabel(name: string): string {
  const labelMap: Record<string, string> = {
    'Yaber目录标题': 'TOC Title',
    'Yaber目录': 'TOC',
    'Yaber一级标题': 'H1',
    'Yaber二级标题': 'H2',
    'Yaber三级标题': 'H3',
    'Yaber正文': 'Body',
    'Yaber备注文字': 'Caption',
  }
  return labelMap[name] || ''
}

function getBentoClass(name: string): string {
  const bentoMap: Record<string, string> = {
    'Yaber目录标题': 'bento-large',
    'Yaber目录': 'bento-wide',
    'Yaber一级标题': 'bento-tall',
    'Yaber二级标题': 'bento-medium',
    'Yaber三级标题': 'bento-medium',
    'Yaber正文': 'bento-wide',
    'Yaber备注文字': 'bento-small',
  }
  return bentoMap[name] || 'bento-medium'
}
</script>

<template>
  <div ref="textListRef" class="flex flex-col w-full h-full overflow-auto px-3 py-2">
    <VueDraggable v-model="textTypeList" :sort="false" :force-fallback="true" :fallback-on-body="true" :fallback-tolerance="5" :delay="0" :distance="3" fallback-class="text-drag-item-layout" @start="onStart" @end="onEnd">
      <div
        v-for="(textType, index) in textTypeList"
        :id="'text-list-' + index"
        :key="textType.name"
        class="text-card-item"
        :class="[
          currentPage?.addComponentAction?.name === textType.name ? 'selected' : '',
          getBentoClass(textType.name)
        ]"
        @click="clickTextItem(textType)"
        @dblclick="dblclickItem(textType)">
        <div class="text-card-gradient"></div>
        <div class="text-card-content">
          <div class="text-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7V4h16v3"/>
              <path d="M9 20h6"/>
              <path d="M12 4v16"/>
            </svg>
          </div>
          <div class="text-card-info">
            <div class="text-card-preview" :style="textType.style">{{ textType.displayName || textType.name }}</div>
            <div class="text-card-label">{{ getComponentLabel(textType.name) }}</div>
          </div>
        </div>
      </div>
    </VueDraggable>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.text-card-item {
  @apply relative flex items-center gap-3 w-full min-h-14 px-4 py-3 mb-3 rounded-2xl border border-gray-200 bg-white cursor-pointer transition-all duration-300 overflow-hidden;

  &:hover {
    @apply border-gray-300 shadow-md transform scale-[1.02];
  }

  &.selected {
    @apply border-purple-500 shadow-lg transform scale-[1.02];
  }

  &.sortable-ghost {
    @apply opacity-40 bg-purple-50 border-purple-200;
  }

  &.sortable-drag {
    @apply opacity-100 shadow-2xl;
  }
}

.text-card-gradient {
  @apply absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(167, 139, 250, 0.02) 100%);
}

.text-card-item:hover .text-card-gradient {
  @apply opacity-100;
}

.text-card-item.selected .text-card-gradient {
  @apply opacity-100;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%);
}

.bento-large {
  @apply min-h-24 py-3 px-3 bg-gradient-to-br from-purple-50 to-white;
}

.bento-wide {
  @apply min-h-16 bg-gradient-to-r from-violet-50 to-white;
}

.bento-tall {
  @apply min-h-18 bg-gradient-to-b from-fuchsia-50 to-white;
}

.bento-medium {
  @apply min-h-14 bg-gradient-to-br from-indigo-50 to-white;
}

.bento-small {
  @apply min-h-12 bg-gradient-to-r from-slate-50 to-white;
}

.text-card-content {
  @apply flex items-center gap-3 flex-1 min-w-0 relative z-10;
}

.text-card-icon {
  @apply flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-500 transition-all duration-300 shadow-sm;
}

.text-card-item:hover .text-card-icon {
  @apply bg-gradient-to-br from-purple-100 to-purple-50 text-purple-500 shadow-md transform scale-110;
}

.text-card-item.selected .text-card-icon {
  @apply bg-gradient-to-br from-purple-500 to-purple-400 text-white shadow-lg transform scale-110;
}

.text-card-info {
  @apply flex flex-col flex-1 min-w-0 overflow-visible;
}

.text-card-preview {
  @apply text-sm font-semibold text-gray-800 transition-colors duration-300 whitespace-nowrap;
}

.text-card-label {
  @apply text-xs text-gray-400 mt-0.5 transition-colors duration-300;
}

.text-card-item:hover .text-card-preview {
  @apply text-gray-900;
}

.text-card-item:hover .text-card-label {
  @apply text-gray-500;
}

.text-card-item.selected .text-card-preview {
  @apply text-purple-600;
}

.text-card-item.selected .text-card-label {
  @apply text-purple-400;
}
</style>

<style scoped lang="less">
.text-drag-item-layout {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.95) 0%, rgba(167, 139, 250, 0.9) 100%);
  border: 2px dashed rgba(255, 255, 255, 0.6);
  color: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(147, 51, 234, 0.4), 0 8px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  transform: translate3d(0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  padding: 16px 20px;
  min-width: 140px;
  min-height: 56px;
  cursor: grabbing;
  will-change: transform, left, top;
  transition: box-shadow 0.15s ease-out;
}

.text-drag-item-layout::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent 50%);
  border-radius: 12px;
  pointer-events: none;
}

.text-drag-item-layout::after {
  content: '拖拽添加';
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 10px;
  opacity: 0.7;
  font-weight: 400;
}
</style>
