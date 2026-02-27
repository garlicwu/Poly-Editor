import {ref} from 'vue'
import {defineStore} from 'pinia'
import type {IComponentAddTypeItem} from '@/view/editor/utils/common-modle'

export const useViewDraggerStore = defineStore('view-dragger', () => {
  const dragEndInfo = ref<IComponentAddTypeItem | null>()
  const componentClickWithKeyDown = ref(false)

  function setDragEndInfo(info: IComponentAddTypeItem) {
    dragEndInfo.value = info
  }

  function clearDragEndInfo() {
    dragEndInfo.value = null
  }

  function setComponentClickWithKeyDown(key: boolean) {
    componentClickWithKeyDown.value = key
  }

  return {
    dragEndInfo,
    setDragEndInfo,
    clearDragEndInfo,
    setComponentClickWithKeyDown,
    componentClickWithKeyDown,
  }
})
