import {type Ref, onMounted, ref, type ExtractPropTypes, nextTick, watch, onBeforeUnmount} from 'vue'
import type {DragerProps, DragData} from './drager'
import {setupMove, type MouseTouchEvent, calcGrid, getXY, checkCollision, getBoundingClientRectByScale} from './utils'
import {useMarkline, useKeyEvent} from './hooks'
import {useAreaMoveStore} from '@/store/useAreaMoveStore'
import {useViewDraggerStore} from '@/store/useViewDraggerStore'

export function useDrager(targetRef: Ref<HTMLElement | null>, props: ExtractPropTypes<typeof DragerProps>, emit: Function) {
  const isMousedown = ref(false)
  const selected = ref(false)
  const dragData = ref<DragData>({
    width: props.width,
    height: props.height,
    left: props.left,
    top: props.top,
    angle: props.angle,
  })
  const {marklineEmit} = useMarkline(targetRef, props)
  // 限制多个鼠标键按下的情况
  const mouseSet = new Set()

  const getBoundary = () => {
    let minX = 0,
      minY = 0
    const {left, top, height, width, angle} = dragData.value
    const parentEl = targetRef.value!.offsetParent || document.body
    const parentElRect = getBoundingClientRectByScale(parentEl!, props.scaleRatio)

    if (angle) {
      const rect = getBoundingClientRectByScale(targetRef.value!, props.scaleRatio)
      minX = rect.left - Math.floor(left - (rect.width - width) + parentElRect.left)
      minY = rect.top - Math.floor(top - (rect.height - height) + parentElRect.top)
    }

    // 最大x
    const maxX = parentElRect.width - width
    // 最大y
    const maxY = parentElRect.height - height
    return [minX, maxX - minX, minY, maxY - minY, parentElRect.width, parentElRect.height]
  }
  /**
   * @param moveX 移动的X
   * @param moveY 移动的Y
   * @param maxX 最大移动X距离
   * @param maxY 最大移动Y距离
   */
  const fixBoundary = (moveX: number, moveY: number, minX: number, maxX: number, minY: number, maxY: number) => {
    // 判断x最小最大边界
    moveX = moveX < minX ? minX : moveX
    moveX = moveX > maxX ? maxX : moveX

    // 判断y最小最大边界
    moveY = moveY < minY ? minY : moveY
    moveY = moveY > maxY ? maxY : moveY
    return [moveX, moveY]
  }
  const checkDragerCollision = () => {
    const parentEl = targetRef.value!.offsetParent || document.body
    const broList = Array.from(parentEl.children).filter((item) => {
      return item !== targetRef.value! && item.classList.contains('es-drager')
    })
    for (let i = 0; i < broList.length; i++) {
      const item = broList[i]
      const flag = checkCollision(targetRef.value!, item, props.scaleRatio)
      if (flag) return true
    }
  }

  // 键盘事件
  const {onKeydown, onKeyup} = useKeyEvent(props, dragData, selected, {
    getBoundary,
    fixBoundary,
    checkDragerCollision,
    emit,
    marklineEmit,
  })

  function onMousedown(e: MouseTouchEvent) {
    mouseSet.add((e as MouseEvent).button)
    if (props.disabled) return

    // 检查是否点击在缩放点上，如果是则不执行拖拽
    const target = e.target as HTMLElement
    if (target.closest('.es-drager-dot') || target.closest('.es-drager-borderCustom')) {
      return
    }

    // 文本组件编辑模式下，按住 Ctrl 可以选择文字，不执行拖拽
    if ((e as MouseEvent).ctrlKey && target.closest('.edit-mode')) {
      return
    }

    // 文本组件编辑模式下，点击允许改变光标位置，不执行拖拽
    if (target.closest('.edit-mode')) {
      return
    }

    // 阻止浏览器默认的拖拽行为，防止产生复制效果
    e.preventDefault()

    const {clientX, clientY} = getXY(e)
    const downX = clientX
    const downY = clientY
    console.log('getXY', {clientX, clientY})
    
    // 标记为已点击，但不是立即开始拖拽
    useViewDraggerStore().setComponentClickWithKeyDown(true)
    selected.value = true
    setTimeout(() => {
      useViewDraggerStore().setComponentClickWithKeyDown(false)
    }, 200)
    
    const {left, top} = dragData.value
    let minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0
    if (props.boundary) {
      ;[minX, maxX, minY, maxY] = getBoundary()
    }
    
    // 拖拽阈值，小于这个距离认为是点击，不是拖拽
    const DRAG_THRESHOLD = 5
    let isDragging = false
    
    const onMousemove = (e: MouseTouchEvent) => {
      // 不是一个按键不执行移动
      if (mouseSet.size > 1) return
      const {clientX, clientY} = getXY(e)
      
      // 计算移动距离
      const deltaX = Math.abs(clientX - downX)
      const deltaY = Math.abs(clientY - downY)
      
      // 如果移动距离超过阈值，才认为是拖拽操作
      if (!isDragging && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
        isDragging = true
        isMousedown.value = true
        // 开始拖拽，触发吸附
        marklineEmit('drag-start')
        emit && emit('drag-start', dragData.value)
      }
      
      // 只有真正拖拽时才执行移动逻辑
      if (isDragging) {
        let moveX = (clientX - downX) / props.scaleRatio + left
        let moveY = (clientY - downY) / props.scaleRatio + top

        // 是否开启网格对齐
        if (props.snapToGrid) {
          // 当前位置
          let {left: curX, top: curY} = dragData.value
          // 移动距离
          const diffX = moveX - curX
          const diffY = moveY - curY

          // 计算网格移动距离
          moveX = curX + calcGrid(diffX, props.gridX)
          moveY = curY + calcGrid(diffY, props.gridY)
        }

        if (props.boundary) {
          ;[moveX, moveY] = fixBoundary(moveX, moveY, minX, maxX, minY, maxY)
        }

        dragData.value.left = moveX
        dragData.value.top = moveY

        emit && emit('drag', dragData.value)

        nextTick(() => {
          const markLine = marklineEmit('drag')!
          // 是否开启吸附
          if (props.snap) {
            if (markLine.diffX) {
              dragData.value.left += markLine.diffX
            }

            if (markLine.diffY) {
              dragData.value.top += markLine.diffY
            }
          }
        }).then(() => {})
      }
    }

    setupMove(onMousemove, (e: MouseTouchEvent) => {
      // 只有真正拖拽时才执行拖拽结束逻辑
      if (isDragging) {
        if (props.checkCollision) {
          const isCollision = checkDragerCollision()
          if (isCollision) {
            dragData.value.top = top
            dragData.value.left = left
          }
        }
        marklineEmit('drag-end')
        emit && emit('drag-end', dragData.value)
      }
      
      mouseSet.clear()
      isMousedown.value = false
    })
  }

  const clickOutsize = () => {
    console.log('clickOutsize')
    if (useAreaMoveStore().areaMoveState === true) return
    selected.value = false
  }

  watch(selected, (val) => {
    // 聚焦/失焦
    if (val) {
      console.log('focus_in', val)
      emit('focus', val)
      // 点击其它区域
      document.getElementById('editorDragId')?.addEventListener('click', clickOutsize, {once: true})
    } else {
      console.log('blur_in', val)
      emit('blur', val)
    }

    if (props.disabledKeyEvent) return
    // 每次选中注册键盘事件
    if (val) {
      document.addEventListener('keydown', onKeydown)
      document.addEventListener('keyup', onKeyup)
    } else {
      // 不是选中移除
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('keyup', onKeyup)
    }
  })

  onMounted(() => {
    if (!targetRef.value) return
    // 没传宽高使用元素默认

    if (!dragData.value.width && !dragData.value.height) {
      const {width, height} = getBoundingClientRectByScale(targetRef.value, props.scaleRatio)
      // 获取默认宽高
      dragData.value = {
        ...dragData.value,
        width: width + 2,
        height: height + 2,
      }
    }

    targetRef.value.addEventListener('mousedown', onMousedown)
    targetRef.value.addEventListener('touchstart', onMousedown, {
      passive: true,
    })

    if (props.type === 'text') {
      const style = window.getComputedStyle(targetRef.value)
      dragData.value.height = parseInt(style.fontSize)
    }
  })

  onBeforeUnmount(() => {
    document.getElementById('editorDragId')?.removeEventListener('click', clickOutsize)
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('keyup', onKeyup)
  })
  return {
    isMousedown,
    selected,
    dragData,
    getBoundary,
    checkDragerCollision,
    marklineEmit,
  }
}
