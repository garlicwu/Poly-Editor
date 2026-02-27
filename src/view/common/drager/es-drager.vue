<template>
  <component :is="tag" :ref="setRef" :class="['es-drager', `es-drager-${props.type}`, {disabled, dragging: isMousedown, selected, border}]" :style="dragStyle" @click.stop @mousedown.stop>
    <slot />

    <template v-if="showResize">
      <div v-for="(item, index) in dots" :key="index" class="es-drager-dot" :data-side="item.side" :style="{...item}" @mousedown="onDotMousedown(item, $event)" @touchstart.passive="onDotMousedown(item, $event)">
        <slot name="resize" v-bind="{side: item.side}">
          <div class="es-drager-dot-handle"></div>
        </slot>
      </div>
      <div v-for="(item, index) in borderResizes" :key="'borderResize' + index" class="es-drager-borderCustom" :data-border="item.side" @mousedown="onDotMousedown(item, $event)" @touchstart.passive="onDotMousedown(item, $event)"></div>
    </template>
    <Rotate v-if="showRotate" v-model="dragData.angle" :element="dragRef" @rotate="emitFn('rotate', dragData)" @rotate-start="emitFn('rotate-start', dragData)" @rotate-end="handleRotateEnd">
      <slot name="rotate" />
    </Rotate>

    <Skew v-if="showSkew" v-model="dragData.skew" :element="dragRef" @skew="emitFn('skew', dragData)" @skew-start="emitFn('skew-start', dragData)" @skew-end="emitFn('skew-end', dragData)">
      <slot name="skew" />
    </Skew>
  </component>
</template>

<script setup lang="ts">
import {type ComponentPublicInstance, computed, type CSSProperties, ref, watch, nextTick} from 'vue'
import {DragerProps, type EventType} from './drager'
import {useDrager} from './use-drager'
import {calcGrid, centerToTL, degToRadian, formatData, getDotList, getLength, getNewStyle, getXY, type MouseTouchEvent, setupMove, withUnit} from './utils'
import Rotate from './components/rotate.vue'
import Skew from './components/skew.vue'

const props = defineProps(DragerProps)
const emit = defineEmits(['change', 'drag', 'drag-start', 'drag-end', 'resize', 'resize-start', 'resize-end', 'rotate', 'rotate-start', 'rotate-end', 'skew', 'skew-start', 'skew-end', 'focus', 'blur', 'drag-delete'])
const emitFn = (type: EventType, ...args: any) => {
  emit(type, ...args)
}
const dragRef = ref<HTMLElement | null>(null)
const {selected, dragData, isMousedown, getBoundary, checkDragerCollision, marklineEmit} = useDrager(dragRef, props, emitFn)

const dotList = ref(getDotList(0, props.resizeList))
const showResize = computed(() => props.resizable && !props.disabled)
const showRotate = computed(() => props.rotatable && !props.disabled && selected.value)
const showSkew = computed(() => props.skewable && !props.disabled && selected.value)

const dots = computed(() => {
  return props.type != 'text' ? dotList.value : dotList.value.filter((d) => !['top', 'bottom'].includes(d.side))
})

const borderResizes = computed(() => {
  // console.log(dotList.value)
  // console.log(dotList.value.filter((d) => ['top', 'bottom', 'left', 'right'].includes(d.side)))
  return dotList.value.filter((d) => ['top', 'bottom', 'left', 'right'].includes(d.side))
})

const dragStyle = computed(() => {
  const {width, height, left, top, angle, skew} = dragData.value
  const style: CSSProperties = {}

  if (width) style.width = withUnit(width)
  if (height) {
    if (props.type === 'text') {
      style.fontSize = height + 'px'
    } else {
      style.height = withUnit(height)
    }
  }
  let transform: string[] = [`translateX(${withUnit(left)})`, `translateY(${withUnit(top)})`, `rotate(${angle ?? 0}deg)`]
  if (skew && skew.length) {
    let skewStr = `skewX(${skew[0]}deg)`
    if (skew[1]) {
      skewStr += ` skewY(${skew[1]}deg)`
    }

    transform.push(skewStr)
  }

  return {
    ...style,
    // left: withUnit(left),
    // top: withUnit(top),
    zIndex: selected.value ? 9999 : props.zindex,
    transform: transform.join(' '),
    '--es-drager-color': props.color,
  }
})

function setRef(el: ComponentPublicInstance | HTMLElement) {
  if (dragRef.value) return
  dragRef.value = (el as ComponentPublicInstance).$el || el
}

function handleRotateEnd(angle: number) {
  dotList.value = getDotList(angle, props.resizeList)
  emitFn('rotate-end', dragData.value)
}

/**
 * 缩放
 * @param dotInfo
 * @param e
 */
function onDotMousedown(dotInfo: any, e: MouseTouchEvent) {
  if (props.disabled) return
  e.stopPropagation()
  // 获取鼠标按下的坐标
  const {clientX, clientY} = getXY(e)
  const downX = clientX
  const downY = clientY
  const {width, height, left, top} = dragData.value

  // 中心点
  const centerX = left + width / 2
  const centerY = top + height / 2

  const rect = {
    width,
    height,
    centerX,
    centerY,
    rotateAngle: dragData.value.angle,
  }
  const type = dotInfo.side

  let {minWidth, minHeight, aspectRatio, equalProportion} = props

  // 拖拽阈值，小于这个距离认为是点击，不是调整大小
  const DRAG_THRESHOLD = 5
  let isResizing = false

  // 存储初始值，用于碰撞检测
  const initialWidth = width
  const initialHeight = height
  const initialLeft = left
  const initialTop = top

  const onMousemove = (e: MouseTouchEvent) => {
    const {clientX, clientY} = getXY(e)

    // 计算移动距离
    const deltaX = Math.abs(clientX - downX)
    const deltaY = Math.abs(clientY - downY)

    // 如果移动距离超过阈值，才认为是调整大小操作
    if (!isResizing && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
      isResizing = true
      emitFn('resize-start', dragData.value, type)
      marklineEmit('drag-start')
    }

    // 只有真正调整大小时才执行逻辑
    if (isResizing) {
      // 距离
      let deltaX = (clientX - downX) / props.scaleRatio
      let deltaY = (clientY - downY) / props.scaleRatio

      // 开启网格缩放
      if (props.snapToGrid) {
        deltaX = calcGrid(deltaX, props.gridX)
        deltaY = calcGrid(deltaY, props.gridY)
      }

      const alpha = Math.atan2(deltaY, deltaX)
      const deltaL = getLength(deltaX, deltaY)
      const isShiftKey = e.shiftKey

      const beta = alpha - degToRadian(rect.rotateAngle)
      const deltaW = deltaL * Math.cos(beta)
      const deltaH = deltaL * Math.sin(beta)

      const ratio = (equalProportion || isShiftKey) && !aspectRatio ? rect.width / rect.height : aspectRatio

      const {
        position: {centerX, centerY},
        size: {width, height},
      } = getNewStyle(type, {...rect, rotateAngle: rect.rotateAngle}, deltaW, deltaH, ratio, minWidth, minHeight)

      const pData = centerToTL({
        centerX,
        centerY,
        width,
        height,
        angle: dragData.value.angle,
      })

      let d = {
        ...dragData.value,
        ...formatData(pData, centerX, centerY),
      }

      // 最大宽高限制
      if (props.maxWidth > 0) {
        d.width = Math.min(d.width, props.maxWidth)
      }
      if (props.maxHeight > 0) {
        d.height = Math.min(d.height, props.maxHeight)
      }

      dragData.value = d
      emitFn('resize', dragData.value, type)

      // 应用吸附效果
      nextTick(() => {
        const markLine = marklineEmit('drag')!
        // 是否开启吸附
        if (props.snap) {
          const type = dotInfo.side

          // 获取当前元素信息
          const currentLeft = dragData.value.left
          const currentTop = dragData.value.top
          const currentWidth = dragData.value.width
          const currentHeight = dragData.value.height

          // 根据调整方向应用不同的吸附逻辑
          switch (type) {
            // 调整右边缘
            case 'right':
              // 右边缘吸附：调整width
              if (markLine.diffX) {
                dragData.value.width += markLine.diffX
              }
              break

            // 调整下边缘
            case 'bottom':
              // 下边缘吸附：调整height
              if (markLine.diffY) {
                dragData.value.height += markLine.diffY
              }
              break

            // 调整左边缘
            case 'left':
              // 左边缘吸附：调整left和width
              if (markLine.diffX) {
                dragData.value.left += markLine.diffX
                dragData.value.width -= markLine.diffX
              }
              break

            // 调整上边缘
            case 'top':
              // 上边缘吸附：调整top和height
              if (markLine.diffY) {
                dragData.value.top += markLine.diffY
                dragData.value.height -= markLine.diffY
              }
              break

            // 调整右上角
            case 'top-right':
              // 右上角吸附：调整top和width
              if (markLine.diffY) {
                dragData.value.top += markLine.diffY
                dragData.value.height -= markLine.diffY
              }
              if (markLine.diffX) {
                dragData.value.width += markLine.diffX
              }
              break

            // 调整右下角
            case 'bottom-right':
              // 右下角吸附：调整width和height
              if (markLine.diffX) {
                dragData.value.width += markLine.diffX
              }
              if (markLine.diffY) {
                dragData.value.height += markLine.diffY
              }
              break

            // 调整左下角
            case 'bottom-left':
              // 左下角吸附：调整left、width和height
              if (markLine.diffX) {
                dragData.value.left += markLine.diffX
                dragData.value.width -= markLine.diffX
              }
              if (markLine.diffY) {
                dragData.value.height += markLine.diffY
              }
              break

            // 调整左上角
            case 'top-left':
              // 左上角吸附：调整left、width、top和height
              if (markLine.diffX) {
                dragData.value.left += markLine.diffX
                dragData.value.width -= markLine.diffX
              }
              if (markLine.diffY) {
                dragData.value.top += markLine.diffY
                dragData.value.height -= markLine.diffY
              }
              break
          }
        }
      }).then(() => {})
    }
  }

  setupMove(onMousemove, () => {
    // 只有真正调整大小时才执行结束逻辑
    if (isResizing) {
      // 碰撞检测
      if (props.checkCollision && checkDragerCollision()) {
        // 发生碰撞回到原来位置
        dragData.value = {...dragData.value, width: initialWidth, height: initialHeight, left: initialLeft, top: initialTop}
      }
      marklineEmit('drag-end')
      emitFn('resize-end', dragData.value, type)
    }
  })
}

watch(
  () => [props.width, props.height, props.left, props.top, props.angle],
  ([width, height, left, top, angle], [oldWidth, oldHeight, oldLeft, oldTop, oldAngle]) => {
    if (width !== oldWidth) {
      dragData.value.width = width
    }
    if (height !== oldHeight) {
      dragData.value.height = height
    }
    if (!isMousedown.value) {
      if (left !== oldLeft) {
        dragData.value.left = left
      }
      if (top !== oldTop) {
        dragData.value.top = top
      }
    }
    if (angle !== oldAngle) {
      dragData.value.angle = angle
    }
  },
)

watch(
  () => dragData.value,
  (val) => {
    emit('change', {...val})
  },
  {deep: true},
)

watch(
  () => props.selected,
  (val) => {
    selected.value = val
  },
  {immediate: true},
)
</script>

<style lang="less">
@import 'style';
</style>
