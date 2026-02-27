<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {useActions, useArea} from '@/view/editor/hooks'
import AreaView from '@/view/editor/component/area-view.vue'
import {EditorComponent} from '@/view/editor/component/editorComponentInit'
import type {DragData, MarklineData} from '@/view/common/drager/drager'
import Drager from '@/view/common/drager/es-drager.vue'
import LoadContent from '@/view/editor/component/common/content/loadContent.vue'
import {EOperationHistory, type IComponentInfo} from '@/view/editor/utils/common-modle'
import {useQuillTextOnFocusStore} from '@/store/useQuillTextOnFocusStore'
import {useConfirm} from 'primevue/useconfirm'
import ConfirmDialog from 'primevue/confirmdialog'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import {useAreaMoveStore} from '@/store/useAreaMoveStore'
import {cloneDeep} from 'lodash'
import {useViewDraggerStore} from '@/store/useViewDraggerStore'

const editorStore = useEditorStore()
const {setCurrentComponentSelected} = editorStore
const {currentPage, addComponentAction, currentComponent, currentComponentList, post, editorLang, groupSelect} = storeToRefs(editorStore)
const confirm = useConfirm()
const viewDraggerStore = useViewDraggerStore()
const {componentClickWithKeyDown} = storeToRefs(viewDraggerStore)
const keySelectedKeyDown = ref(false)
const keyDownList = ref<string[]>([])

const canvasStyle = computed(() => {
  return {
    width: `${post.value.canvasWidth}px`,
    height: `${post.value.canvasHeight}px`,
  }
})
// 每次拖拽移动的距离
const extraDragData = ref({
  startX: 0,
  startY: 0,
  disX: 0,
  disY: 0,
})

// 记录拖拽开始时所有选中组件的初始位置，用于避免累积误差
const initialComponentPositions = ref<Record<string, {left: number; top: number}>>({})

const itemReSizeIng = ref(false)

const areaStore = useAreaMoveStore()
const {dragViewSnap} = storeToRefs(areaStore)

const areaRef = ref()
const editorRef = ref<HTMLElement | null>(null)
const {areaSelected, onEditorMouseDown, onAreaMove, onAreaUp, areaMove} = useArea(currentPage, areaRef)

const markLineData = ref<MarklineData>({left: null, top: null})
const markLineBgColor = ref<Record<string, string>>({h: '#9333EA', v: '#9333EA'})

let copyElement: IComponentInfo | null

const {onContextmenu, onEditorContextMenu, onEditorContextClick, onEvent} = useActions(currentPage, editorRef, post)
// watch(() => currentComponentList.value, (value) => {
//   console.log('currentComponentListChange', value)
// }, {deep: true}

onEvent('removeElement', (data: any) => {
  if (data.noConfirm) {
    editorStore.deleteComponent(data.component)
    useQuillTextOnFocusStore().clearOnFocusState({componentId: data.component.componentId})
  } else {
    // confirmDelete(false, () => {
    const deleteItems = currentPage.value?.componentList.filter((item: IComponentInfo) => item.selected) ?? []
    if (deleteItems.length > 1) {
      // cache history
      deleteItems.forEach((item: IComponentInfo) => {
        useQuillTextOnFocusStore().clearOnFocusState({componentId: item.componentId})
      })
      editorStore.deleteComponentWithGroup(deleteItems)
    } else {
      editorStore.deleteComponent(deleteItems[0])
      useQuillTextOnFocusStore().clearOnFocusState({componentId: data.component.componentId})
    }
    // })
  }
})

onEvent('removeElementWithGroup', (data: any) => {
  console.log('removeElementWithGroup', data)
  if (data.noConfirm) {
    editorStore.deleteComponentWithGroup(data.components)
    data.components.forEach((item: IComponentInfo) => {
      useQuillTextOnFocusStore().clearOnFocusState({componentId: item.componentId})
    })
  } else {
    // confirmDelete(true, () => {
    const deleteItems = data.components
    if (deleteItems.length > 0) {
      // cache history
      deleteItems.forEach((item: IComponentInfo) => {
        useQuillTextOnFocusStore().clearOnFocusState({componentId: item.componentId})
      })
      editorStore.deleteComponentWithGroup(deleteItems)
    }
    // })
  }
})

onEvent('addElement', (data: any) => {
  currentComponentList.value.forEach((item: IComponentInfo) => {
    // 如果有选中的元素，取消选中
    if (item.selected) {
      item.selected = false
    }
  })
  editorStore.addNewComponent(data.component)
})

onEvent('addElementWithGroup', (data: any) => {
  currentComponentList.value.forEach((item: IComponentInfo) => {
    // 如果有选中的元素，取消选中
    if (item.selected) {
      item.selected = false
    }
  })
  editorStore.addNewComponentWithGroup(data.components)
})

onEvent('topElement', (data: any) => {
  editorStore.topComponent(data.index)
})

onEvent('bottomElement', (data: any) => {
  editorStore.bottomComponent(data.index)
})
onEvent('swapElement', (data: any) => {
  editorStore.swapComponent(data.i, data.j)
})

onEvent('alignLeft', (data: any) => {
  editorStore.alignComponentWithList('left', true)
})

onEvent('alignCenter', (data: any) => {
  editorStore.alignComponentWithList('center', true)
})

onEvent('alignRight', (data: any) => {
  editorStore.alignComponentWithList('right', true)
})

onEvent('alignCanvasLeft', (data: any) => {
  editorStore.alignComponentWithList('canvas_left', true)
})

onEvent('alignVerticalCenter', (data: any) => {
  editorStore.alignComponentWithList('vertical_center', true)
})

onEvent('alignCanvasRight', (data: any) => {
  editorStore.alignComponentWithList('canvas_right', true)
})

onEvent('appliedToAll', (data: any) => {
  editorStore.appliedToAllPage(data)
})

onEvent('undo', (data: any) => {
  editorStore.undoOperationWithType()
})
onEvent('redo', (data: any) => {
  editorStore.redoOperationWithType()
})
onEvent('switchMarkLine', (data: any) => {
  console.log('switchMarkLine', data)
  editorStore.switchMarkLine()
  useEditorTranslationStore().switchMarkLine()
})

onEvent('deleteAllMarkLine', (data: any) => {
  console.log('deleteAllMarkLine', data)
  editorStore.deleteAllMarkLine()
  useEditorTranslationStore().deleteAllMarkLine()
})

onEvent('deleteAllPageMarkLine', (data: any) => {
  console.log('deleteAllPageMarkLine', data)
  editorStore.deleteAllPageMarkLine()
  useEditorTranslationStore().deleteAllPageMarkLine()
})

onEvent('cancelTerm', (data: any) => {
  const range = data.range || {}
  if (range.index && data.componentId && data.leafText && data.leafText !== '') {
    editorStore.removeTermWithComponentId(data)
  }
})

onEvent('verticalIsometric', () => {
  editorStore.isometricComponentWithGroup('verticalIsometric')
})
onEvent('horizontalIsometric', () => {
  editorStore.isometricComponentWithGroup('horizontalIsometric')
})
onEvent('editGroup', () => {
  editorStore.editGroupOrUngroup()
})
onEvent('editUngroup', () => {
  editorStore.editGroupOrUngroup()
})

onMounted(() => {
  // console.log('editorComponentModule', editorComponentModule)
  nextTick(() => {
    initKeyDownEvent(true)
  })
})

onUnmounted(() => {
  console.log('onUnmounted', onUnmounted)
  keyDownList.value = []
  keySelectedKeyDown.value = false
  initKeyDownEvent(false)
})

watch(
  () => addComponentAction.value,
  (newVal) => {
    // 检测
    if (newVal && addComponentAction.value?.autoAdd) {
      editorStore.addComponentActionAuto(newVal)
      editorStore.clearComponentAction()
    } else if (newVal && addComponentAction.value?.dragAdd) {
      if (editorRef.value) {
        const editorRect = editorRef.value!.getBoundingClientRect()
        let left = addComponentAction.value.left ?? 0
        let top = addComponentAction.value.top ?? 0
        if (left < editorRect.left || top < editorRect.top) {
          editorStore.clearComponentAction()
          return
        }
        left = Number(((left - editorRect.left - (addComponentAction.value.dragMouseX ?? 0)) / (post.value.scale ?? 1)).toFixed(5))
        top = Number(((top - editorRect.top - (addComponentAction.value.dragMouseY ?? 0)) / (post.value.scale ?? 1)).toFixed(5))
        editorStore.addNewComponentByArea({
          width: addComponentAction.value.width,
          height: addComponentAction.value.height,
          top: top,
          left: left,
          lang: editorLang.value,
          componentType: addComponentAction.value.type,
          imageSrc: addComponentAction.value.imgSrc,
          divStyle: addComponentAction.value.style,
        } as IComponentInfo)
        editorStore.clearComponentAction()
      }
    }
  },
)

function onDragstart(dragData: DragData, element: IComponentInfo) {
  console.log('onDragstart', dragData)
  currentComponent.value = element
  if (!areaSelected.value && !keySelectedKeyDown.value) {
    const selectedItems = currentComponentList.value.filter((item) => item.selected)
    if (selectedItems.length === 1) {
      // 将上一次移动元素变为非选
      currentComponentList.value.forEach((item) => (item.selected = false))
    }
  }

  // 选中当前元素
  currentComponent.value.selected = true
  if (!areaSelected.value && keyDownList.value && (keyDownList.value.includes('b') || keyDownList.value.includes('B'))) {
    const selectedItems = currentComponentList.value.filter((item) => item.selected)
    if (selectedItems.length === 1) {
      copyElement = cloneDeep(selectedItems[0])
      copyElement.selected = false
    }
  }
  if (!currentComponent.value.dragStatus) {
    currentComponent.value.dragStatus = 0
  }
  currentComponent.value.dragStatus++
  // cache history
  editorStore.cacheOperationHistoryWithGroup()

  // 记录所有选中组件的初始位置，用于避免累积误差
  initialComponentPositions.value = {}
  currentComponentList.value.forEach((item: IComponentInfo) => {
    if (item.selected) {
      initialComponentPositions.value[item.componentId ?? ''] = {
        left: item.left ?? 0,
        top: item.top ?? 0,
      }
    }
  })

  extraDragData.value.startX = currentComponent.value.left!
  extraDragData.value.startY = currentComponent.value.top!
}

function updateComponentInfo(dragData: DragData, item: IComponentInfo) {
  Object.keys(dragData).forEach((key) => {
    ;(item as Record<any, any>)[key] = dragData[key as keyof DragData]
  })
  editorStore.updateCurrentComponentWithResize(item)
}

function onDragend(dragData: DragData, item: IComponentInfo) {
  console.log('onDragend', dragData, item.componentId)
  // updateComponentInfo(dragData, item)
  editorStore.clearOperationHistoryWithGroup(EOperationHistory.UPDATE_GROUP_COMPONENT, dragData, item, 'drag')
  editorStore.setSaveChange()

  // 清除初始位置记录，避免状态污染
  initialComponentPositions.value = {}
}

const onResizeStart = (dragData: any, item: IComponentInfo) => {
  console.log('onResizeStart', dragData, item)
  // useAreaMoveStore().setDragViewSnap(true)
  editorStore.cacheOperationHistoryWithGroup(EOperationHistory.UPDATE_COMPONENT, item)
  // updateComponentInfo(dragData, item)
}

const onResize = (dragData: any, item: IComponentInfo) => {
  console.log('onResizeEnd', dragData, item)
  editorStore.clearOperationHistoryWithGroup(EOperationHistory.UPDATE_COMPONENT, dragData, item, 'resize')
  updateComponentInfo(dragData, item)
  // useAreaMoveStore().setDragViewSnap(false)
}

const onRotateStart = (dragData: any, item: IComponentInfo) => {
  console.log('onRotateStart', dragData, item)
  editorStore.cacheOperationHistoryWithGroup(EOperationHistory.UPDATE_COMPONENT, item)
}

const onRotateEnd = (dragData: any, item: IComponentInfo) => {
  console.log('onRotateEnd', dragData, item)
  editorStore.clearOperationHistoryWithGroup(EOperationHistory.UPDATE_COMPONENT, dragData, item, 'rotate')
  updateComponentInfo(dragData, item)
}

function onDrag(dragData: DragData) {
  // 使用主组件的初始位置计算位移，保持基准一致
  const primaryInitialPos = initialComponentPositions.value[currentComponent.value?.componentId ?? '']
  const disX = primaryInitialPos ? dragData.left - primaryInitialPos.left : 0
  const disY = primaryInitialPos ? dragData.top - primaryInitialPos.top : 0

  // 如果选中了多个，直接使用主组件的位移更新其他组件
  if (initialComponentPositions.value && Object.keys(initialComponentPositions.value).length > 0) {
    // 使用绝对值检查位移阈值，支持所有方向
    if (Math.abs(disX) > 1 || Math.abs(disY) > 1) {
      currentComponentList.value.forEach((item: IComponentInfo) => {
        if (item.selected) {
          const initialPos = initialComponentPositions.value[item?.componentId ?? '']
          if (initialPos) {
            // 使用主组件的位移，避免累加误差，确保所有组件同步
            item.left = initialPos.left + disX
            item.top = initialPos.top + disY
          }
        }
      })
    }
  }
  // 复制组件时也使用绝对值检查，支持所有方向
  if (copyElement && (Math.abs(disX) > 20 || Math.abs(disY) > 20)) {
    editorStore.addNewComponent(copyElement, false)
    copyElement = null
  }
  // 不再更新 startX/Y，保持基于 drag-start 的基准，避免位移累积
}

const onChange = (dragData: DragData, item: IComponentInfo) => {
  // console.log('onChange', dragData, item)
  // Object.keys(dragData).forEach((key) => {
  //   ;(item as Record<any, any>)[key] = dragData[key as keyof DragData]
  // })
}

const onFocus = (selectedInfo: any, item: IComponentInfo) => {
  // console.log('onFocus1', selectedInfo, item, componentClickWithKeyDown.value)
  if ((keyDownList.value.includes('a') && keyDownList.value.includes('Control')) || areaMove.value) {
    // select all
  } else if ((!groupSelect.value && !keySelectedKeyDown.value && !areaMove.value) || (!item.groupId && !componentClickWithKeyDown.value)) {
    // console.log('keyShiftDown', keySelectedKeyDown.value)
    currentComponentList.value.forEach((item: IComponentInfo) => {
      if (item.selected) {
        item.selected = false
      }
    })
  }

  // item.selected = true
  setCurrentComponentSelected(item.componentId, true, componentClickWithKeyDown.value ? item.groupId : undefined)
  console.log(
    'onFocus',
    currentComponentList.value.filter((item: any) => item.selected),
  )
}

const onBlur = (selected: any, item: IComponentInfo) => {
  // console.log('onBlur', selected, item, componentClickWithKeyDown.value)
  if (!keySelectedKeyDown.value && !componentClickWithKeyDown.value) {
    item.selected = false
    setCurrentComponentSelected(item.componentId, false)
    // console.log('onBlur', selected, item)
    useQuillTextOnFocusStore().clearOnFocusState({componentId: item.componentId})
  }
}

const onDelete = (item: IComponentInfo) => {
  confirmDelete(false, () => {
    editorStore.deleteComponent(item)
  })
}

function clickParent(event: MouseEvent) {
  // console.log('clickParent')
  onEditorContextClick(event)
}

function onChildFocus(event: Event, item: IComponentInfo) {
  // console.log('onChildFocus', event)
  item.selected = true
  useViewDraggerStore().setComponentClickWithKeyDown(true)
  setCurrentComponentSelected(item.componentId, true, componentClickWithKeyDown.value ? item.groupId : undefined)
  setTimeout(() => {
    useViewDraggerStore().setComponentClickWithKeyDown(false)
  }, 200)
}

function onMarkline(data: MarklineData) {
  markLineData.value = data
  if (editorRef.value) {
    const editorRect = editorRef.value!.getBoundingClientRect()
    markLineBgColor.value = {h: '#9333EA', v: '#9333EA'}
    if (Math.abs(editorRect.width / (post.value!.scale ?? 1) / 2 - Math.abs(data!.left ?? 0)) < 4) {
      markLineBgColor.value.v = '#DD2476'
    }
    if (Math.abs(editorRect.height / (post.value!.scale ?? 1) / 2 - Math.abs(data!.top ?? 0)) < 4) {
      console.log('markLineData1', data)
      markLineBgColor.value.h = '#DD2476'
    }
  }
}

// 添加其它对齐线
function extraLines(targetRect: DOMRect) {
  // 可以是dom元素列表，这里只有中心点
  return [document.querySelector('.editor-line-center')!, ...Array.from(document.querySelectorAll('.sketch-ruler .lines .line'))]

  // 也可以是计算好的位置，以editor的中心点为例
  // const editorRect = document.querySelector('.es-editor')!.getBoundingClientRect()
  // const centerY = editorRect.height / 2 + editorRect.top
  // const centerX = editorRect.width / 2 + editorRect.left
  // return [
  //   { showTop: centerY, top: centerY }, // 顶
  //   { showTop: centerY, top: centerY - targetRect.height / 2 }, // 中
  //   { showTop: centerY, top: centerY - targetRect.height }, // 底

  //   { showLeft: centerX, left: centerX }, // 左
  //   { showLeft: centerX, left: centerX - targetRect.width / 2 }, // 中
  //   { showLeft: centerX, left: centerX - targetRect.width }, // 右
  // ]
}

// 键盘事件
const onKeydown = (e: KeyboardEvent) => {
  // console.log('keyDown', e.key)
  if (!keyDownList.value.includes(e.key)) {
    keyDownList.value.push(e.key)
  }
  if (e.key === 'Shift' || e.key === 'Control') {
    // console.log('keyDown', true)
    keySelectedKeyDown.value = true
  }
}

const onKeyup = (e: KeyboardEvent) => {
  keyDownList.value = keyDownList.value.filter((item: any) => item !== e.key)
  console.log('keyDown', e.key)
  if (e.key === 'Shift' || e.key === 'Control') {
    // console.log('keyDown', false)
    keySelectedKeyDown.value = false
  }
}

function initKeyDownEvent(val: boolean) {
  if (val) {
    document?.addEventListener('keydown', onKeydown)
    document?.addEventListener('keyup', onKeyup)
  } else {
    // 不是选中移除
    document?.removeEventListener('keydown', onKeydown)
    document?.removeEventListener('keyup', onKeyup)
  }
}

function confirmDelete(isGroup: boolean, callback: any) {
  confirm.require({
    message: `确定删除${isGroup ? '所有组件' : ''}么？`,
    header: '提醒',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '删除',
    },
    accept: () => {
      callback()
    },
    reject: () => {},
  })
}

// 处理拖拽进入画布区域的事件
function onEditorDragover(event: DragEvent) {
  event.preventDefault() // 阻止默认行为，允许放置
  event.dataTransfer!.dropEffect = 'copy' // 设置放置效果为复制
}

// 处理拖拽放置到画布区域的事件
function onEditorDrop(event: DragEvent) {
  event.preventDefault() // 阻止默认行为
  // 这里可以处理拖拽放置的逻辑
  // 但由于我们已经在VueDraggable的onEnd事件中处理了组件添加，这里可以留空
}

defineExpose({
  onEditorMouseDown,
})
</script>

<template>
  <div id="editorDragId" ref="editorRef" class="bg-white shadow-2xl wrapper relative" :style="canvasStyle" @contextmenu.stop="onEditorContextMenu($event)" @click.stop="clickParent($event)" @mousedown="onEditorMouseDown" @dragover="onEditorDragover($event)" @drop="onEditorDrop($event)">
    <Drager
      v-for="(item, index) in currentComponentList"
      :id="'drager-editor-main-child' + item.componentId"
      :key="index"
      v-bind="item"
      :width="item.width"
      :height="item.height"
      :top="item.top"
      :left="item.left"
      :scale-ratio="post.scale"
      :snap="dragViewSnap"
      :markline="onMarkline"
      :extra-lines="extraLines"
      :rotatable="[EditorComponent.Shape.toString()].includes(item.component ?? '')"
      @drag-start="onDragstart($event, item)"
      @drag-end="onDragend($event, item)"
      @drag="onDrag"
      @change="onChange($event, item)"
      @focus="onFocus($event, item)"
      @blur="onBlur($event, item)"
      @resize-end="onResize($event, item)"
      @resize-start="onResizeStart($event, item)"
      @rotate-start="onRotateStart($event, item)"
      @rotate-end="onRotateEnd($event, item)"
      @contextmenu.stop="onContextmenu($event, item)">
      <loadContent :component-info="item" :lang="editorLang" @focus="onChildFocus($event, item)" @custom-contextmenu="onContextmenu($event, item)"></loadContent>
    </Drager>
    <div v-show="markLineData.left" class="es-editor-markline-left" :style="{left: markLineData.left + 'px', 'background-color': markLineBgColor.v}"></div>
    <div v-show="markLineData.top" class="es-editor-markline-top" :style="{top: markLineData.top + 'px', width: `${post.canvasWidth}px`, 'background-color': markLineBgColor.h}"></div>
    <div class="editor-line-center"></div>
  </div>
  <area-view ref="areaRef" @move="onAreaMove" @up="onAreaUp" />
  <ConfirmDialog class="w-100"></ConfirmDialog>
</template>

<style scoped>
.wrapper {
  background-size:
    21px 21px,
    21px 21px;
  background-image: linear-gradient(white 20px, transparent 0), linear-gradient(90deg, transparent 20px, #373739 0);
}

.es-editor-markline-left {
  position: absolute;
  z-index: 9999;
  background-color: var(--color-ppt-text-orange);
  height: 100%;
  width: 2px;
  top: 0;
}

.es-editor-markline-top {
  position: absolute;
  z-index: 9999;
  background-color: var(--color-ppt-text-orange);
  width: 100%;
  height: 2px;
  left: 0;
}

.editor-line-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--color-ppt-text-orange);
}
</style>
