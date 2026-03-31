<script setup lang="ts">
import {computed, markRaw, nextTick, onMounted, type PropType, ref, watch} from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import {cloneDeep} from 'lodash'
import type {QuillOptions} from 'quill/core/quill'
import type {IComponentInfo} from '@/view/editor/utils/common-modle'
import type {FontSizeInfoType} from '@/store/textEdiotrSotre'
import {initQuillRegister} from '@/view/editor/tool/editor-util'

const textRef = ref<HTMLElement | null>(null)
const quill = ref<Quill | null>(null)

const props = defineProps({
  componentInfo: {type: Object as PropType<IComponentInfo>, required: true},
  fontSizeInfoType: {
    type: Object as PropType<FontSizeInfoType>,
    required: true,
  },
  vNodeId: {
    type: String,
    default: 'export',
  },
  textVisible: {
    type: Boolean,
    default: true,
  },
})

const quillId = computed(() => {
  return 'export-quill-' + props.vNodeId + '-' + (props.componentInfo?.id || props.componentInfo?.componentId)
})

const options: QuillOptions = {
  readOnly: true,
}

const cleanDivStyle = (divStyle: Record<string, any> | undefined | null) => {
  if (!divStyle) {
    return null
  }

  const cleaned: Record<string, any> = {}
  for (const key in divStyle) {
    if (!isNaN(Number(key))) {
      continue
    }
    cleaned[key] = divStyle[key]
  }

  return cleaned
}

const quillStyle = computed(() => {
  const style: Record<string, any> = {}
  const divStyle = cleanDivStyle(props.componentInfo.divStyle)
  if (divStyle?.textVerticalAlign === 'center') {
    style['justify-content'] = 'center'
  } else if (divStyle?.textVerticalAlign === 'bottom') {
    style['justify-content'] = 'end'
  }

  return style
})

const applyContents = () => {
  if (!textRef.value || !quill.value) {
    return
  }

  const currentComponent = cloneDeep(props.componentInfo) as IComponentInfo
  quill.value.setContents(currentComponent.deltaOps ?? [])
  const quillEditor = textRef.value.querySelector('.ql-editor') as HTMLElement | null
  if (quillEditor) {
    const fontConfig = props.fontSizeInfoType
    quillEditor.style.fontSize = (fontConfig?.pxSize ?? 29) + 'px'
    quillEditor.style.fontFamily = fontConfig?.font ? fontConfig.font : `'OPlusSans3-Regular', sans-serif`
  }
}

const initQuillOrReset = () => {
  initQuillRegister()
  if (!textRef.value) {
    return
  }

  quill.value = markRaw(new Quill(textRef.value, options))
  applyContents()
}

watch(
  () => props.componentInfo,
  () => {
    applyContents()
  },
  {immediate: true, deep: true},
)

onMounted(() => {
  nextTick(() => {
    initQuillOrReset()
  })
})
</script>

<template>
  <div :id="quillId" ref="textRef" :style="quillStyle" class="export-quill-root w-full flex h-full flex-col text-black overflow-visible" :class="!textVisible && 'hybrid-export-text-hidden'" />
</template>

<style scoped lang="less">
@import '../../view/editor/component/text/quill-common-style.css';

.export-quill-root {
  overflow: visible;
}

.export-quill-root :deep(.ql-container),
.export-quill-root :deep(.ql-editor) {
  overflow: visible !important;
}

.hybrid-export-text-hidden {
  :deep(.ql-editor),
  :deep(.ql-editor *) {
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
    caret-color: transparent !important;
  }
}
</style>
