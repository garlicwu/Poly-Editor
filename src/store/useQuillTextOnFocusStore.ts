import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

export interface TextQuillType {
  componentId?: string | number
}

export const useQuillTextOnFocusStore = defineStore('quillTextOnFocus', () => {
  const _textOnFocusState = ref<TextQuillType>({componentId: ''})
  const _focusInfo = ref<Record<string, unknown>>()
  const textOnFocusState = computed(() => {
    return _textOnFocusState.value
  })

  const firstTextFormat = computed(() => {
    return _focusInfo.value?.firstTextFormat
  })

  const hasTerm = computed(() => {
    return (_focusInfo.value?.formats as any)?.['term-custom-style']
  })

  const leafText = computed(() => {
    return _focusInfo.value?.leafText || ''
  })

  const range = computed(() => {
    return _focusInfo.value?.range || {}
  })
  const focusInfo = computed(() => {
    return _focusInfo.value || {}
  })

  function setOnFocusState(newValue: TextQuillType, focusInfo: Record<string, unknown>) {
    console.log('setOnFocusState', newValue, focusInfo)
    _textOnFocusState.value = newValue
    _focusInfo.value = focusInfo
  }

  function clearOnFocusState(newValue: TextQuillType) {
    if (newValue.componentId === _textOnFocusState.value.componentId) {
      _textOnFocusState.value = {componentId: ''}
      _focusInfo.value = {}
    }
  }

  return {
    textOnFocusState,
    setOnFocusState,
    clearOnFocusState,
    hasTerm,
    range,
    leafText,
    focusInfo,
    firstTextFormat,
  }
})
