import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

export const useAreaMoveStore = defineStore('useAreaMoveStore', () => {
  const _areaMoveState = ref(false)
  const _dragViewSnap = ref(false)

  const _dragerItemReSizeIng = ref(false)
  const areaMoveState = computed(() => {
    return _areaMoveState.value
  })
  const dragViewSnap = computed(() => {
    return _dragViewSnap.value
  })

  const dragerItemReSizeIng = computed(() => {
    return _dragerItemReSizeIng.value
  })

  function setAreaMoveState(newValue: boolean) {
    _areaMoveState.value = newValue
  }

  function setDragerItemReSizeIng(newValue: boolean) {
    _dragerItemReSizeIng.value = newValue
  }

  function setDragViewSnap(newValue: boolean) {
    console.log('setDragViewSnap', newValue)
    _dragViewSnap.value = newValue
  }

  return {
    areaMoveState,
    setAreaMoveState,
    dragViewSnap,
    setDragViewSnap,
    dragerItemReSizeIng,
  }
})
