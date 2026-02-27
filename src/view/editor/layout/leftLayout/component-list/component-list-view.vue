<script setup lang="ts">
import {defaultSketchRulerWidth, useEditorStore} from '@/store/editorStore'
import {EComponentType, type IComponentAddTypeItem} from '@/view/editor/utils/common-modle'
import {useToast} from 'primevue/usetoast'
import {reactive, ref} from 'vue'
import {storeToRefs} from 'pinia'
import {VueDraggable} from 'vue-draggable-plus'
import Popover from 'primevue/popover'
import TableConfigView from '@/view/editor/component/popover/table-config/table-config-view.vue'
import SvgIcon from '@/view/common/svg-icon.vue'
import {gridTableDefaultHeight} from '@/view/editor/component/table/grid-table-util'

const editorStore = useEditorStore()
const {currentPage, post} = storeToRefs(editorStore)

const opTableConfigShow = ref()
const componentTypeList = ref<IComponentAddTypeItem[]>([
  {
    name: '表格',
    type: EComponentType.Table,
    width: 0,
    height: 0,
    notDrag: true,
    style: {
      width: '100%',
      height: '100%',
      background: '#ccc',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#ccc',
      borderRadius: 0,
    },
  } as IComponentAddTypeItem,
  {
    name: '直角线框',
    type: EComponentType.Background,
    width: 0,
    height: 0,
    style: {
      width: '100%',
      height: '100%',
      background: '#ccc',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#ccc',
      borderRadius: 0,
      'border-width': '1px',
      'border-style': 'solid',
      'border-color': '#ccc',
      'border-radius': '0px',
    },
  } as IComponentAddTypeItem,
  {
    name: '圆角线框',
    type: EComponentType.Background,
    width: 0,
    height: 0,
    style: {
      width: '100%',
      height: '100%',
      background: '#ccc',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#ccc',
      borderRadius: 24,
      'border-width': '1px',
      'border-style': 'solid',
      'border-color': '#ccc',
      'border-radius': '24px',
    },
  } as IComponentAddTypeItem,
  {
    name: '水平直线',
    type: EComponentType.Line,
    width: 0,
    height: 2,
    style: {
      width: '100%',
      background: '#ccc',
      height: '2px',
    },
  } as IComponentAddTypeItem,
  {
    name: '垂直直线',
    type: EComponentType.Line,
    width: 2,
    height: 0,
    style: {
      height: '100px',
      background: '#ccc',
      width: '2px',
    },
  } as IComponentAddTypeItem,
  {
    name: '水平虚线',
    type: EComponentType.DashedLine,
    width: 0,
    height: 2,
    style: {
      width: '100%',
      lineBg: '#ccc',
      lineInterval: 10,
      background: `repeating-linear-gradient(to right,#ccc,#ccc 10px, transparent 10px,transparent 20px )`,
      height: '2px',
    },
  } as IComponentAddTypeItem,
  {
    name: '垂直虚线',
    type: EComponentType.DashedLine,
    width: 0,
    height: 0,
    style: {
      height: '100px',
      lineBg: '#ccc',
      lineInterval: 10,
      background: `repeating-linear-gradient(to bottom,#ccc,#ccc 10px, transparent 10px,transparent 20px )`,
      width: '2px',
    },
  } as IComponentAddTypeItem,
])
// repeating-linear-gradient(
//   to right,
// #000,
// #000 5px, /* 实线部分长度 */
//   transparent 5px,
//   transparent 10px /* 总重复长度（实线+空白） */
// );
const toast = useToast()
const show = () => {
  toast.add({severity: 'warning', summary: '提示', detail: '当面页面为空，不能添加组件', life: 2000})
}

const toggleOpTableConfig = (event: Event) => {
  opTableConfigShow.value?.toggle(event)
}

const clickTextItem = (event: Event, component: IComponentAddTypeItem) => {
  if (editorStore.currentPage) {
    if (component.type === EComponentType.Table) {
      toggleOpTableConfig(event)
    } else {
      const addComponentType = {...component, autoAdd: false, angle: 0}
      delete addComponentType.style.width
      delete addComponentType.style.height
      editorStore.clickCurrentPageComponentAction(addComponentType)
    }
  } else {
    show()
  }
}

const dblclickItem = (component: IComponentAddTypeItem) => {
  if (component?.notDrag) {
    return
  }
  // 双击，自动添加
  if (editorStore.currentPage) {
    const addTextType = {...component, autoAdd: true, angle: 0}
    const {pixelHeight, pixelWidth} = currentPage.value?.pageSize || {}
    switch (component.name) {
      case '直角线框':
      case '圆角线框':
        addTextType.height = (pixelHeight ?? 1920) / 12
        addTextType.width = (pixelWidth ?? 1080) - defaultSketchRulerWidth * 2
        break
      case '水平直线':
      case '水平虚线':
        addTextType.height = 2
        addTextType.width = (pixelWidth ?? 1080) - defaultSketchRulerWidth * 2
        break
      case '垂直直线':
      case '垂直虚线':
        addTextType.height = (pixelHeight ?? 1920) / 2
        addTextType.width = 2
        break
    }
    delete addTextType.style.width
    delete addTextType.style.height
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
  console.log('textDragHtmlElement', document.getElementsByClassName('component-drag-item-layout'))
  const textDragHtmlElement = document.getElementsByClassName('component-drag-item-layout')?.[0] as HTMLElement
  textDragHtmlElement?.style.setProperty('width', dragWidth + 'px')
  textDragHtmlElement?.style.setProperty('height', dragHeight + 'px')
  const dragHtmlElementRect = textDragHtmlElement?.getBoundingClientRect()
  dragRectMouseGap.x = event.originalEvent.x - dragHtmlElementRect?.left
  dragRectMouseGap.y = event.originalEvent.y - dragHtmlElementRect?.top
  console.log('dragRectMouseGap', dragRectMouseGap)
}

function onEnd(event: any) {
  // console.log('end drag', event)
  const component = event.clonedData as IComponentAddTypeItem

  const {dragWidth, dragHeight} = configDragWidth(event.clonedData, true)
  if (editorStore.currentPage) {
    const addComponentType = {...component, dragAdd: true, angle: 0}

    delete addComponentType.style.width
    delete addComponentType.style.height

    addComponentType.height = dragHeight
    addComponentType.width = dragWidth
    addComponentType.left = event.originalEvent.x
    addComponentType.top = event.originalEvent.y
    addComponentType.dragMouseX = dragRectMouseGap.x
    addComponentType.dragMouseY = dragRectMouseGap.y

    // console.log('dragEnd', addComponentType)
    editorStore.clickCurrentPageComponentAction(addComponentType)
  }
  dragRectMouseGap.x = 0
  dragRectMouseGap.y = 0
}

function configDragWidth(data: any, end: boolean = false) {
  let dragWidth = Number(data.width ?? 300) as any
  let dragHeight = Number(data.height ?? 300) as any
  if (editorStore.currentPage) {
    const scale = !end ? (post.value.scale ?? 1) : 1
    const {pixelHeight, pixelWidth} = currentPage.value?.pageSize || {}
    switch (data.name) {
      case '直角线框':
      case '圆角线框':
        dragHeight = ((pixelHeight ?? 1920) / 12) * scale
        dragWidth = ((pixelWidth ?? 1080) - defaultSketchRulerWidth * 2) * scale
        break
      case '水平直线':
      case '水平虚线':
        dragHeight = 2
        dragWidth = ((pixelWidth ?? 1080) - defaultSketchRulerWidth * 2) * scale
        break
      case '垂直直线':
      case '垂直虚线':
        dragHeight = ((pixelHeight ?? 1920) / 2) * scale
        dragWidth = 2
        break
    }
  }

  return {dragWidth, dragHeight}
}

function confirmInsertTable(cell: Record<string, any>) {
  if (editorStore.currentPage) {
    const {pixelWidth} = currentPage.value?.pageSize || {}
    const height = gridTableDefaultHeight * cell.y + 4
    const width = (pixelWidth ?? 1080) - defaultSketchRulerWidth * 2
    const addComponentType = {
      name: '表格',
      type: EComponentType.Table,
      width: width,
      height: height,
      dragAdd: false,
      angle: 0,
      rowNum: cell.y,
      colNum: cell.x,
      style: {},
      autoAdd: true,
    } as IComponentAddTypeItem
    editorStore.clickCurrentPageComponentAction(addComponentType)
  }
  opTableConfigShow.value?.hide()
}
</script>

<template>
  <div class="component-list-container">
    <VueDraggable
      v-model="componentTypeList"
      :sort="false"
      :scroll="true"
      :force-fallback="true"
      :fallback-on-body="true"
      :filter="'.undraggable'"
      :prevent-on-filter="false"
      class="component-grid"
      fallback-class="component-drag-item-layout"
      @start="onStart"
      @end="onEnd">
      <div
        v-for="component in componentTypeList"
        :key="component.name"
        class="component-card"
        :class="currentPage?.addComponentAction?.name === component.name ? 'selected' : component?.notDrag ? 'undraggable' : ''"
        @click="clickTextItem($event, component)"
        @dblclick="dblclickItem(component)">
        <div class="component-icon">
          <svg v-if="component.type === EComponentType.Table" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <line x1="3" x2="21" y1="9" y2="9"/>
            <line x1="3" x2="21" y1="15" y2="15"/>
            <line x1="3" x2="21" y1="21" y2="21"/>
          </svg>
          <svg v-else-if="component.name === '直角线框'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="0" ry="0"/>
          </svg>
          <svg v-else-if="component.name === '圆角线框'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="6" ry="6"/>
          </svg>
          <svg v-else-if="component.name === '水平直线'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="12" y2="12"/>
          </svg>
          <svg v-else-if="component.name === '垂直直线'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" x2="12" y1="4" y2="20"/>
          </svg>
          <svg v-else-if="component.name === '水平虚线'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" stroke-dasharray="4 4"/>
          </svg>
          <svg v-else-if="component.name === '垂直虚线'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" x2="12" y1="4" y2="20" stroke-dasharray="4 4"/>
          </svg>
        </div>
        <div class="component-preview" :style="component.style"></div>
        <div class="component-name">{{ component.name }}</div>
      </div>
    </VueDraggable>
  </div>
  <Popover ref="opTableConfigShow">
    <table-config-view @confirm-insert-table="confirmInsertTable" />
  </Popover>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.component-list-container {
  @apply w-full h-full overflow-auto p-3;
}

.component-grid {
  @apply grid grid-cols-2 gap-3;
}

.component-card {
  @apply flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-200 hover:bg-purple-50/50;
}

.component-card.selected {
  @apply border-purple-500 bg-purple-50 shadow-md;
}

.component-card.selected .component-icon {
  @apply text-purple-600;
}

.component-card.selected .component-name {
  @apply text-purple-600;
}

.component-icon {
  @apply w-10 h-10 flex items-center justify-center text-gray-400 mb-2 transition-colors duration-200;
}

.component-card:hover .component-icon {
  @apply text-purple-500;
}

.component-preview {
  @apply w-full h-12 mb-2 rounded border border-gray-200 bg-gray-50;
}

.component-name {
  @apply text-xs text-gray-600 font-medium transition-colors duration-200;
}

.component-card:hover .component-name {
  @apply text-purple-600;
}

.undraggable {
}
</style>

<style>
.component-drag-item-layout {
  background: rgba(147, 51, 234, 0.1);
  border: 2px dashed #9333ea;
  color: #9333ea;
  border-radius: 12px;
  padding: 12px;
}
</style>
