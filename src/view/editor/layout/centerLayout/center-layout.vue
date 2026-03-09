<script setup lang="ts">
import SketchRulerView from '@/view/common/sketch-ruler'
import {nextTick, onMounted, ref, watch} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import DrageListView from '@/view/editor/layout/centerLayout/drage-list-view.vue'
import {useImage} from '@/view/editor/hooks/useImage'

import Popover from 'primevue/popover'
import ScaleListView from '@/view/editor/component/popover/scale-list/scale-list-view.vue'
import TopTextDesignView from '@/view/editor/layout/topLayout/top-text-design-view.vue'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import {debounce} from 'lodash'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {useAreaMoveStore} from '@/store/useAreaMoveStore'

defineProps({})

const editorStore = useEditorStore()
const editorTranslationStore = useEditorTranslationStore()
const {post, panzoomOption, autoTextResize, refreshCenterLayoutStatus, scaleByUser, cpuScale, currentPage, editorLang, hasSelectedComponent, isTextComponent} = storeToRefs(editorStore)
const {currentTranslationPage, editorTranslationInfo} = storeToRefs(editorTranslationStore)
const initCanvas = ref(false)
const dragViewKey = ref(0)

const sketchruleRef = ref()
const dragListViewRef = ref()
const opScale = ref()
const scaleBody = ref<HTMLElement>()

const {imageUrl} = useImage()

const svgUrl = (icon: string) => {
  return new URL(`../../../../assets/svg/${icon}.svg`, import.meta.url).href
}

// 悬浮文字操作栏
const textToolbarRef = ref<HTMLElement>()

let containerRectLeft = 0
let containerRectTop = 0
const areaStore = useAreaMoveStore()
const {dragViewSnap} = storeToRefs(areaStore)
const debounceRefreshView = debounce(
  () => {
    dragViewKey.value++
    console.log('currentPageChange', dragViewKey.value)
    // const panzoomInstance = sketchruleRef.value.panzoomInstance
    // panzoomInstance?.reset()
    sketchruleRef.value?.reset()
  },
  500,
  {trailing: true},
)

onMounted(() => {
  console.log('onMounted', 'center')
  initCenterContainer()
  emitter.on(MittTypeEnum.Window_ReSize, () => {
    setTimeout(() => {
      editorStore.resetPagePost()
      initCenterContainer()
      debounceRefreshView()
    }, 400)
  })
})
watch(
  () => dragViewSnap.value,
  () => {
    debounceRefreshView()
  },
)
watch(
  () => editorTranslationInfo.value,
  (value) => {
    setTimeout(() => {
      editorStore.resetPagePost()
      initCenterContainer()
      initCanvas.value = false
      initCanvas.value = true
      debounceRefreshView()
    }, 400)
    // sketchruleRef.value?.reset()
  },
)

watch(
  () => scaleByUser.value,
  (value) => {
    const panzoomInstance = sketchruleRef.value.panzoomInstance
    const clientX = (post.value.width ?? 1080) / 2 + containerRectLeft
    const clientY = (post.value.height ?? 1920) / 2 + containerRectTop
    panzoomInstance.zoomToPoint(post.value.scale, {
      clientX: clientX,
      clientY: clientY,
    })
  },
)

watch(
  () => currentPage.value,
  (value, oldValue) => {
    // reset
    if (currentPage.value && currentPage.value.pageId !== '') {
      let delayTime = 200
      if (!initCanvas.value) {
        delayTime = 400
        initCanvas.value = true
        console.log('initCanvas', 0)
      }
      console.log('initCanvas', 1)
      setTimeout(() => {
        // debounceRefreshView()
        dragViewKey.value++
        const panzoomInstance = sketchruleRef.value.panzoomInstance
        if (currentPage.value?.zoomData) {
          console.log('currentPageChange1', dragViewKey.value)
          panzoomInstance?.pan(currentPage.value?.zoomData.x, currentPage.value?.zoomData.y)
          panzoomInstance?.zoom(currentPage.value?.zoomData.scale)
        } else {
          console.log('currentPageChange2', dragViewKey.value)
          sketchruleRef.value?.reset()
        }
      }, delayTime)
    }
  },
  {deep: false, immediate: true},
)

watch(
  () => post.value.lines,
  (value) => {
    console.log('lineschange', value)
    if (currentPage.value) {
      currentPage.value!.lines = value
      editorStore.setSaveChange()
    }
  },
  {immediate: true, deep: true},
)

watch(
  () => refreshCenterLayoutStatus.value,
  (value) => {
    if (value > 0) {
      debounceRefreshView()
    }
  },
)

function initCenterContainer() {
  const container = document.getElementById('center-wrapper') as HTMLElement
  const elRect = container?.getBoundingClientRect()
  containerRectLeft = elRect.left
  containerRectTop = elRect.top
  console.log('panzoomOption', panzoomOption.value)
  post.value = {
    ...post.value,
    height: container.clientHeight,
    width: container.clientWidth,
    parentLeft: containerRectLeft,
    parentTop: containerRectTop,
    scale: 0.5,
    panzoomOption: panzoomOption.value,
  }
}

function initPanzoomInstance() {
  // 需要定制化布局的按钮才需要
  const panzoomInstance = sketchruleRef.value.panzoomInstance
  const parentDom = document.getElementsByClassName('canvasedit-parent')
  if (parentDom[0]) {
    const parent = parentDom[0] as HTMLElement
    if (parent) {
      parent.addEventListener('wheel', (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          panzoomInstance.zoomWithWheel(e)
        }
      })
    }

    // 让按下鼠标中键才能移动画布,千万不能用mousedown, 否则会出现缩放bug, 因为panzoom内部对pointerId有判断,而mousedown里面并没有pointerId
    document.addEventListener('pointerdown', function (e) {
      if (e.button === 1) {
        sketchruleRef.value.cursorClass = 'grabCursor'
        panzoomInstance.bind()
        panzoomInstance.handleDown(e)
        e.preventDefault()
      }
    })

    document.addEventListener('pointerup', function (e) {
      if (e.button === 1) {
        panzoomInstance.destroy()
        console.log('放开了')
        sketchruleRef.value.cursorClass = 'defaultCursor'
      }
    })
  }
}

const extraLines = (targetRect: DOMRect) => {
  // 可以返回dom元素列表
  return Array.from(document.querySelectorAll('.sketch-ruler .lines .line'))
}

function zoomChange(zoomData: any) {
  // {dimsOut:{elem: {}, parent: {}},originalEvent:{},scale,x,y}
  console.log('zoomChange', dragViewKey.value, zoomData)
  editorStore.setZoomData(zoomData)
}

function clickSketchRule() {
  console.log('clickSketchRule')
}

function clickChangeScale(type: number) {
  const changeScale = (post.value?.scale || 1) + (1 === type ? 0.1 : -0.1)
  editorStore.setScale(changeScale)
  editorTranslationStore.setScale(changeScale)
}

const selectScale = (event: Event) => {
  console.log(event)
  opScale.value.toggle(event, scaleBody.value)
}

const clickRefresh = () => {
  editorTranslationStore.addCanvasState()
  debounceRefreshView()
}

const applyLineInAllPage = (lineInfo: any) => {
  if (post.value.lines && lineInfo) {
    editorStore.applyLineInAllPage(lineInfo)
  }
}

const deleteLine = (lineInfo: any) => {
  console.log('deleteLine', lineInfo)
  if (post.value.lines) {
    if (lineInfo.vertical) {
      post.value.lines.h = post.value.lines.h.filter((line) => line !== lineInfo.value)
    } else {
      post.value.lines.v = post.value.lines.v.filter((line) => line !== lineInfo.value)
    }
  }
}

const onEditorMouseDown = (e: MouseEvent) => {
  dragListViewRef.value.onEditorMouseDown(e)
}
</script>

<template>
  <div class="flex relative">
    <div id="center-wrapper" class="relative w-full h-full bg-zinc-100 overflow-auto wrapper">
      <!-- 悬浮文字操作栏 -->
      <div
        v-show="isTextComponent"
        ref="textToolbarRef"
        class="absolute z-20 bg-white rounded-lg shadow-md border border-ppt-line transition-all duration-300 max-w-[calc(100%-40px)] overflow-x-auto"
        style="left: 50%; top: 20px; transform: translateX(-50%)">
        <div class="p-2 min-w-max">
          <top-text-design-view />
        </div>
      </div>

      <SketchRulerView
        v-if="initCanvas"
        ref="sketchruleRef"
        v-bind="post"
        v-model:scale="post.scale"
        :self-handle="false"
        :width="post.width"
        :height="post.height"
        :physical-height="post.physicalHeight"
        :physical-width="post.physicalWidth"
        @zoomchange="zoomChange"
        @click="clickSketchRule"
        @apply-line-in-all-page="applyLineInAllPage"
        @delete-line="deleteLine">
        <template #default>
          <drage-list-view :key="dragViewKey" ref="dragListViewRef" />
        </template>
      </SketchRulerView>
    </div>
    <div class="absolute z-10 bottom-5 right-5 h-8 w-fit flex flex-row rounded bg-white shadow items-center">
      <div ref="scaleBody" class="w-22 flex flex-row h-8 items-center">
        <span class="text-sm text-ppt-text-dark ml-2.5 flex-1 w-0">{{ cpuScale + '%' }}</span>
        <img :src="imageUrl('ic-top-font-select')" alt="" class="cursor-pointer w-3.5 h-3.5 ml-2.5 mr-1.5" @click="selectScale" />
      </div>

      <div class="h-full w-[1px] bg-ppt-line"></div>
      <div class="ml-2 mr-2 w-6 h-full cursor-pointer flex items-center" @click="clickChangeScale(1)">
        <img :src="svgUrl('ic-design-bottom-canvas-bigger')" alt="" class="w-5 h-5" />
      </div>
      <div class="w-6 h-full cursor-pointer flex items-center" @click="clickChangeScale(0)">
        <img :src="svgUrl('ic-design-bottom-canvas-smaller')" alt="" class="w-5 h-5" />
      </div>

      <div class="w-6 h-full cursor-pointer flex items-center ml-2" @click="clickRefresh">
        <img :src="svgUrl('ic-design-bottom-zoom-refresh')" alt="" class="w-3.5 h-3.5" />
      </div>
    </div>

    <Popover ref="opScale">
      <scale-list-view @hide="opScale?.hide" @adaptive="clickRefresh" />
    </Popover>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.cursor-move {
  cursor: grabbing !important;
}

.cursor-move * {
  cursor: grabbing !important;
}
</style>
