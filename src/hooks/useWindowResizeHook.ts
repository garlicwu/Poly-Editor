import {onMounted, onUnmounted} from 'vue'
import emitter, {MittTypeEnum} from '@/lib/mitt'

type EventHandler = (data: any) => void
export default function useWindowResizeHook() {
  const eventHandlers = new Map<string, EventHandler[]>()

  const resize = () => {
    emitter.emit(MittTypeEnum.Window_ReSize, {})
  }

  onMounted(() => {
    windowResize()
  })

  onUnmounted(() => {
    unWindowResize()
    eventHandlers?.clear()
  })

  const windowResize = () => {
    window.addEventListener('resize', resize)
  }

  const unWindowResize = () => {
    window.removeEventListener('resize', resize)
  }

  const onEvent = (event: string, handler: EventHandler) => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, [])
    }
    eventHandlers.get(event)?.push(handler)
  }

  const offEvent = (event: string, handler?: EventHandler) => {
    if (!handler) {
      eventHandlers.delete(event)
      return
    }

    const handlers = eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  const emit = (event: string, data: any) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  return {
    windowResize,
    unWindowResize,
    onEvent,
    emit,
  }
}
