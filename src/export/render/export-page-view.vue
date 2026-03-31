<script setup lang="ts">
import {computed, type PropType} from 'vue'
import type {FontSizeInfoType} from '@/store/textEdiotrSotre'
import type {IComponentInfo, IEditorPageInfo} from '@/view/editor/utils/common-modle'
import ExportChildView from '@/export/render/export-child-view.vue'

const props = defineProps({
  pageInfo: {type: Object as PropType<IEditorPageInfo>, required: true},
  lang: {
    type: String,
    default: 'cn',
  },
  fontMap: {
    type: Object as PropType<Record<string, Record<string, FontSizeInfoType>>>,
    required: true,
  },
  hiddenTextComponentIds: {
    type: Array as PropType<Array<string | number>>,
    default: () => [],
  },
  backgroundColor: {
    type: String,
    default: '#ffffff',
  },
})

const hiddenComponentIdSet = computed(() => {
  return new Set(props.hiddenTextComponentIds.map((item) => String(item)))
})

const pageStyle = computed(() => {
  return {
    width: (props.pageInfo.pageSize?.pixelWidth ?? 1080) + 'px',
    height: (props.pageInfo.pageSize?.pixelHeight ?? 1920) + 'px',
    position: 'relative',
    overflow: 'hidden',
    background: props.backgroundColor || 'transparent',
  }
})

const configCurrentFontMap = (component: IComponentInfo) => {
  return (
    props.fontMap[component.lang ?? props.lang ?? 'cn']?.[component.textType ?? 'Yaber姝ｆ枃'] ?? {
      type: 'Yaber姝ｆ枃',
      lang: '涓枃',
      size: 7,
      font: 'OPlusSans3-Regular',
      pxSize: 29,
    }
  )
}

const getTextVisible = (component: IComponentInfo) => {
  return !hiddenComponentIdSet.value.has(String(component.componentId ?? ''))
}
</script>

<template>
  <div :id="'hybridExportPageId-' + pageInfo.pageId" :style="pageStyle">
    <export-child-view v-for="component in pageInfo.componentList" :key="component.componentId ?? component.id" :component="component" :font-size-info-type="configCurrentFontMap(component)" :text-visible="getTextVisible(component)" />
  </div>
</template>

<style scoped></style>
