import type {DraggableEvent, SortableEvent} from 'vue-draggable-plus'
import {reactive} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'

export function useViewDraggerHook() {
  const mouseXY = reactive({
    x: 0,
    y: 0,
  })

  function mouseMove(e: MouseEvent) {
    mouseXY.x = e.clientX
    mouseXY.y = e.clientY
  }

  function onStart(event: SortableEvent) {
    console.log('start drag')
  }

  function onEnd(event: DraggableEvent) {
    console.log('end drag', event)
    const data = event.clonedData
    const {x, y} = (event as any).originalEvent
    const addTextType = {...data, autoAdd: true}
    console.log('dragItem', addTextType)
    // useEditorStore().clickCurrentPageComponentAction(addTextType)
  }

  return {
    mouseXY,
    mouseMove,
    onStart,
    onEnd,
  }
}
