<script setup lang="ts">
import {computed, markRaw, nextTick, onMounted, onUnmounted, type PropType, type Ref, ref, watch} from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import {cloneDeep} from 'lodash'
import type {QuillOptions} from 'quill/core/quill'
import {type IComponentInfo} from '@/view/editor/utils/common-modle'
import {type FontSizeInfoType} from '@/store/textEdiotrSotre'
import {initQuillRegister} from '@/view/editor/tool/editor-util'

const textRef = ref<HTMLElement | null>()
const quill = ref<Quill | null>(null)
const props = defineProps({
  componentInfo: {type: Object as PropType<IComponentInfo>, required: true},
  fontSizeInfoType: {
    type: Object as PropType<FontSizeInfoType>,
    required: true,
  },
  vNodeId: {
    type: String,
    default: 'normal',
  },
})
const currentComponent: Ref<IComponentInfo | null> = ref(null)
const quillId = computed(() => {
  return 'quill-' + props.vNodeId + '-' + (props.componentInfo?.id || props.componentInfo?.componentId)
})

const options: QuillOptions = {
  readOnly: true,
}

// 清理被污染的 divStyle（过滤掉数字索引属性）
const cleanDivStyle = (divStyle: any) => {
  if (!divStyle) return null
  const cleaned: any = {}
  for (const key in divStyle) {
    // 跳过数字索引（被字符串展开污染的数据）
    if (!isNaN(Number(key))) continue
    cleaned[key] = divStyle[key]
  }
  return cleaned
}

const quillStyle = computed(() => {
  let style: any = {}
  const divStyle = cleanDivStyle(props.componentInfo.divStyle)
  if (divStyle && divStyle.textVerticalAlign) {
    if (divStyle.textVerticalAlign === 'center') {
      style['justify-content'] = 'center'
    } else if (divStyle.textVerticalAlign === 'bottom') {
      style['justify-content'] = 'end'
    }
  }
  return style
})

watch(
  () => props.componentInfo,
  (value) => {
    if (textRef.value && quill.value) {
      initQuillOrReset()
      currentComponent.value = cloneDeep(props.componentInfo) as IComponentInfo
      quill.value?.setContents(currentComponent.value?.deltaOps)
    }
  },
  {immediate: true, deep: true},
)
onMounted(() => {
  nextTick(() => {
    if (textRef.value) {
      initQuillOrReset()
      currentComponent.value = cloneDeep(props.componentInfo) as IComponentInfo
      quill.value?.setContents(currentComponent.value?.deltaOps)
    }
  })
})

onUnmounted(() => {})

const initQuillOrReset = () => {
  initQuillRegister()
  if (textRef.value) {
    const quillContainer = textRef.value as HTMLElement
    quill.value = markRaw(new Quill(textRef.value, options))
    const quillEditor = quillContainer.querySelector('.ql-editor') as HTMLElement
    if (quillEditor) {
      const fontConfig = props.fontSizeInfoType
      if (fontConfig) {
        quillEditor['style'].fontSize = (fontConfig.pxSize ? fontConfig.pxSize : 29) + 'px'
        quillEditor['style'].fontFamily = fontConfig.font ? fontConfig.font : `'OPlusSans3-Regular', sans-serif`
        // if (fontConfig.type?.includes('标题')) {
        //   quillEditor['style'].fontWeight = 'bold'
        // }
      }
    }
  }
}
</script>

<template>
  <div :id="quillId" ref="textRef" :style="quillStyle" class="w-full flex h-full flex-col text-black overflow-auto"  />
</template>
<style lang="less" scoped>
@import 'quill-common-style.css';
</style>
