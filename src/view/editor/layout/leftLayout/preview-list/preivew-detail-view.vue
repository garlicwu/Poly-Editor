<script setup lang="ts">
import type {IComponentInfo, IEditorPageInfo} from '@/view/editor/utils/common-modle'
import {nextTick, onMounted, type PropType, ref, watch} from 'vue'
import PreviewChildView from '@/view/editor/layout/leftLayout/preview-list/preview-child-view.vue'
import {useTextEditorStore} from '@/store/textEdiotrSotre'
import {storeToRefs} from 'pinia'

const props = defineProps({pageInfo: {type: Object as PropType<IEditorPageInfo>, required: true}, lang: String})
const styleDynamic = ref<any>({})
const previewDetailRef = ref()
const textStore = useTextEditorStore()
const {allFontMap} = storeToRefs(textStore)

watch(
  () => props.pageInfo.pageSize,
  (value) => {
    if (previewDetailRef.value) {
      initPageScale()
    }
  },
  {immediate: true, deep: true},
)
onMounted(() => {
  nextTick(() => {
    initPageScale()
  })
})

const initPageScale = () => {
  const width = previewDetailRef.value.clientWidth
  const scaleValue = Number((width / (props.pageInfo.pageSize?.pixelWidth ?? 1080)).toFixed(5))

  if (props.pageInfo.pageSize) {
    styleDynamic.value = {
      width: props.pageInfo.pageSize?.pixelWidth + 'px',
      height: props.pageInfo.pageSize?.pixelHeight + 'px',
      transform: `scale(${scaleValue})`,
      'transform-origin': 'top left',
    }
    // console.log('pageSize', props.pageInfo.pageSize)
    // console.log('styleDynamic', styleDynamic.value)
  }
}

const configCurrentFontMap = (component: IComponentInfo) => {
  return (
    allFontMap.value[component.lang ?? props.lang ?? 'cn']?.[component.textType ?? 'Yaber正文'] ?? {
      type: 'Yaber正文',
      lang: '中文',
      size: 7,
      font: 'OPlusSans3-Regular',
      pxSize: 29,
    }
  )
}
</script>

<template>
  <div :id="'previewPageId-' + props.pageInfo?.pageId" ref="previewDetailRef" style="width: 100%; height: 100%; position: relative">
    <div :style="styleDynamic" style="position: absolute">
      <preview-child-view v-for="component in props.pageInfo.componentList" :key="component.componentId" :component="component" :font-size-info-type="configCurrentFontMap(component)" />
    </div>
  </div>
</template>

<style scoped></style>
