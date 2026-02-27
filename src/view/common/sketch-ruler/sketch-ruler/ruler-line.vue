<template>
  <div v-show="showLine" ref="lineRef" class="line" :style="combinedStyle" @click.stop @contextmenu="onLineContextMenu">
    <div class="action" :style="actionStyle">
      <span v-if="showLabel" class="value">{{ labelContent }}</span>
    </div>
    <div v-if="isInputVisible" class="action" :style="inputStyle">
      <InputText id="name" v-model="tempInputValue" size="small" autocomplete="off" style="width: 8rem" @input="handleInput" @blur="handleBlur" />
    </div>
    <div :style="combinedCancursorStyle" @mouseenter.stop="handleMouseenter" @mouseleave.stop="handleMouseLeave" @mousedown.stop="handleMouseDown"></div>
    <div :style="combinedNoCursorStyle"></div>
    <div style="flex: 1" :style="combinedEndCursorStyle" @mouseenter.stop="handleMouseenter" @mouseleave.stop="handleMouseLeave" @mousedown.stop="handleMouseDown"></div>
    <ContextMenu ref="menu" :model="items">
      <template #item="{item, props}">
        <a class="flex items-center" v-bind="props.action">
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <InputNumber
            v-if="item.label === '位置'"
            v-model="tempInputValue"
            placeholder="请输入"
            size="small"
            :max="vertical ? canvasHeight : canvasWidth"
            :min="1"
            class="w-30 my-input-style"
            @blur="handleBlur"
            @click.stop
            @keydown.enter="handleBlur" />
        </a>
      </template>
    </ContextMenu>
  </div>
</template>
<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import useLine from './useLine'
import {debounce} from '../canvas-ruler/utils'
import type {FinalPaletteType, LineType} from '../index-types'

interface Props {
  scale: number
  palette: FinalPaletteType
  index: number
  start: number
  vertical: boolean
  value: number
  physicalWidth?: number
  physicalHeight?: number
  canvasWidth: number
  canvasHeight: number
  lines: LineType
  isShowReferLine: boolean
  rate: number
  snapThreshold: number
  snapsObj: LineType
  lockLine: boolean
  elemInfo: any
  parentLeft?: number
  parentTop?: number
}

type PointerEvents = 'auto' | 'none'

const lineRef = ref()
const lineClient = ref({width: 0, height: 0, left: 0, top: 0})
const props = defineProps<Props>()
const isInscale = ref(false)

const {actionStyle, handleMouseDown, labelContent, startValue, canCursor, showLabel, handleMouseenter, handleMouseLeave, handleLineRelease, inputStyle} = useLine(props, props.vertical)
const showLine = computed(() => startValue.value >= props.start)

const $emit = defineEmits(['delete', 'applyLineInAllPage'])

const combinedStyle = computed(() => {
  // const {lineType, lockLineColor, lineColor} = props.palette
  // const borderColor = props.lockLine ? lockLineColor : (lineColor ?? 'black')
  // const pointerEvents: PointerEvents = props.lockLine || isInscale.value || !canCursor.value ? 'none' : 'auto'
  // const cursor = props.isShowReferLine && !props.lockLine && canCursor.value ? (props.vertical ? 'ns-resize' : 'ew-resize') : 'default'
  // const borderProperty = props.vertical ? 'borderTop' : 'borderLeft'
  const offsetPx = (startValue.value - props.start) * props.scale

  return {
    // [borderProperty]: `1px ${lineType} ${borderColor}`,
    pointerEvents: 'none',
    // cursor,
    [props.vertical ? 'top' : 'left']: `${offsetPx}px`,
    display: 'flex',
    flexDirection: props.vertical ? 'row' : 'column',
  } as any
})

const combinedCancursorStyle = computed(() => {
  const elementInfo = props.elemInfo || {width: 0, height: 0, top: 0, left: 0}
  const {lineType, lockLineColor, lineColor} = props.palette
  const borderColor = props.lockLine ? lockLineColor : (lineColor ?? 'black')
  const pointerEvents: PointerEvents = props.lockLine || isInscale.value ? 'none' : 'auto'
  const borderProperty = props.vertical ? 'borderTop' : 'borderLeft'
  const cursor = props.isShowReferLine && !props.lockLine ? (props.vertical ? 'ns-resize' : 'ew-resize') : 'default'
  // console.log('lineClient', lineClient.value)
  // console.log('parentLeft', props.parentLeft)

  return {
    width: props?.vertical ? elementInfo.left - (props.parentLeft ?? 0) + 'px' : '1px',
    [borderProperty]: `1px ${lineType} ${borderColor}`,
    height: !props?.vertical ? elementInfo.top - (props.parentTop ?? 0) + 'px' : '1px',
    pointerEvents: pointerEvents,
    cursor,
  }
})

const combinedNoCursorStyle = computed(() => {
  const elementInfo = props.elemInfo || {width: 0, height: 0}
  const {lineType, lockLineColor, lineColor} = props.palette
  const borderColor = props.lockLine ? lockLineColor : (lineColor ?? 'black')
  const borderProperty = props.vertical ? 'borderTop' : 'borderLeft'
  return {
    width: props?.vertical ? elementInfo.width + 'px' : '1px',
    [borderProperty]: `1px ${lineType} ${borderColor}`,
    height: !props?.vertical ? elementInfo.height + 'px' : '1px',
    pointerEvents: 'none',
  } as any
})

const combinedEndCursorStyle = computed(() => {
  const {lineType, lockLineColor, lineColor} = props.palette
  const borderColor = props.lockLine ? lockLineColor : (lineColor ?? 'black')
  const pointerEvents: PointerEvents = props.lockLine || isInscale.value ? 'none' : 'auto'
  const borderProperty = props.vertical ? 'borderTop' : 'borderLeft'
  const cursor = props.isShowReferLine && !props.lockLine ? (props.vertical ? 'ns-resize' : 'ew-resize') : 'default'
  return {
    width: props?.vertical ? '0' : '1px',
    [borderProperty]: `1px ${lineType} black`,
    height: !props?.vertical ? '0' : '1px',
    [borderProperty]: `1px ${lineType} ${borderColor}`,
    pointerEvents: pointerEvents,
    cursor,
  }
})

watch(
  () => props.parentLeft,
  (value) => {
    console.log('line-prop', props.parentLeft)
  },
)

watch(
  () => props.parentTop,
  (value) => {
    console.log('line-prop', props.parentTop)
  },
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  startValue.value = props.value ?? 0
  nextTick(() => {
    lineClient.value = {
      width: lineRef.value?.clientWidth,
      height: lineRef.value?.clientHeight,
      left: Number(lineRef.value.style.left.replace('px', '')),
      top: Number(lineRef.value.style.top.replace('px', '')),
    }
    console.log('lineClient', lineClient.value)
  })
})

// 使用防抖函数
const deactivateAfterDelay = debounce(() => {
  isInscale.value = false
}, 1000)
watch([() => props.scale], () => {
  isInscale.value = true
  deactivateAfterDelay()
})

const isInputVisible = ref(false)
const tempInputValue = ref<any>(startValue.value * props.rate)

const handleLineClick = () => {
  isInputVisible.value = true
  tempInputValue.value = startValue.value * props.rate
  // 延迟聚焦输入框
  setTimeout(() => {
    const input = document.getElementById('name')
    input?.focus()
  }, 0)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // 限制只能输入数字
  if (!/^\d*$/.test(target.value)) {
    target.value = target.value.replace(/[^0-9]/g, '')
    tempInputValue.value = parseInt(target.value) || 0
  }
}

const handleBlur = () => {
  // 将输入的值转换为原始值
  const newValue = tempInputValue.value / props.rate
  // 触发上层更新
  handleLineRelease(newValue, props.index)
  // 隐藏输入框
  isInputVisible.value = false
}

// 处理点击外部区域关闭输入框
const handleClickOutside = (event: MouseEvent) => {
  const inputElement = document.getElementById('name')
  if (inputElement && !inputElement.contains(event.target as Node)) {
    handleBlur()
  }
}
const menu = ref()
const items = ref<any[]>([
  {label: '位置', icon: 'pi pi-compass', command: null},
  {
    label: '应用到全部',
    icon: 'pi pi-globe',
    command: () => {
      applyLineInAllPage()
    },
  },
  {
    label: '删除',
    icon: 'pi pi-trash',
    command: () => {
      deleteLine()
    },
  },
])

const applyLineInAllPage = () => {
  $emit('applyLineInAllPage', {vertical: props.vertical, value: props.value})
}
const deleteLine = () => {
  $emit('delete', {vertical: props.vertical, value: props.value})
}
const onLineContextMenu = (event: MouseEvent) => {
  tempInputValue.value = startValue.value * props.rate
  menu.value.show(event)
}
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
