import {type ExtractPropTypes, type Ref} from 'vue'
import type {DragData, DragerProps} from '../drager'
import {useQuillTextOnFocusStore} from '@/store/useQuillTextOnFocusStore'
import {storeToRefs} from 'pinia'
import {useViewDraggerStore} from '@/store/useViewDraggerStore'

type UtilFN = {
  getBoundary: Function
  fixBoundary: Function
  checkDragerCollision: Function
  emit: Function
  marklineEmit: Function
}

export function useKeyEvent(props: ExtractPropTypes<typeof DragerProps>, dragData: Ref<DragData>, selected: Ref<boolean>, {getBoundary, fixBoundary, checkDragerCollision, emit, marklineEmit}: UtilFN) {
  let oldLeft = 0
  let oldTop = 0

  const useQuillTextOnFocus = useQuillTextOnFocusStore()
  const {textOnFocusState} = storeToRefs(useQuillTextOnFocus)

  // 键盘事件
  const onKeydown = (e: KeyboardEvent) => {
    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      let {left: moveX, top: moveY} = dragData.value
      if (!oldLeft) oldLeft = moveX
      if (!oldTop) oldTop = moveY
      if (['ArrowRight', 'ArrowLeft'].includes(e.key)) {
        // 左右键修改left
        const isRight = e.key === 'ArrowRight'
        // 默认移动1像素距离
        let diff = isRight ? 1 : -1
        // 如果开启网格，移动gridX距离
        if (props.snapToGrid) {
          diff = isRight ? props.gridX : -props.gridX
        }
        moveX = moveX + diff
      } else if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        // 左右键修改top
        const isDown = e.key === 'ArrowDown'
        // 默认移动1像素距离
        let diff = isDown ? 1 : -1
        // 如果开启网格，移动gridY距离
        if (props.snapToGrid) {
          diff = isDown ? props.gridY : -props.gridY
        }

        moveY = moveY + diff
      }

      // 边界判断
      if (props.boundary) {
        const [minX, maxX, minY, maxY] = getBoundary()
        ;[moveX, moveY] = fixBoundary(moveX, moveY, minX, maxX, minY, maxY)
      }

      if (textOnFocusState.value.componentId && textOnFocusState.value.componentId !== '') {
        return
      }
      // 一次只会有一个会变
      dragData.value.left = moveX
      dragData.value.top = moveY
      marklineEmit('drag-end')
      emit('drag-end', dragData.value)
    }
  }
  const onKeyup = (e: KeyboardEvent) => {
    if (e.key === 'Delete') {
      // if (textOnFocusState.value.componentId && textOnFocusState.value.componentId !== '') {
      //   // text 编辑状态不走删除逻辑
      //   console.log('user-key', textOnFocusState.value.componentId)
      //   return
      // }
      // emit('drag-delete')
    } else if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      // 检测碰撞
      if (props.checkCollision) {
        if (checkDragerCollision()) {
          dragData.value.left = oldLeft
          dragData.value.top = oldTop
          marklineEmit('drag-end')
          emit('drag-end', dragData.value)
        }
      }
      oldLeft = 0
      oldTop = 0
    } else {
      e.preventDefault()
    }
  }

  return {
    onKeydown,
    onKeyup,
  }
}
