<script setup lang="ts">
import {computed, type CSSProperties, type PropType} from 'vue'
import {withUnit} from '@/view/common/drager/utils'
import {pickStyle} from '@/view/editor/utils'
import {EComponentType, type IComponentInfo} from '@/view/editor/utils/common-modle'
import type {FontSizeInfoType} from '@/store/textEdiotrSotre'
import ExportQuillTextView from '@/export/render/export-quill-text-view.vue'
import ShapeView from '@/view/editor/component/shape/shape-view.vue'
import GridTableDisplay from '@/view/editor/component/table/grid-table-display.vue'

const props = defineProps({
  component: {type: Object as PropType<IComponentInfo>, required: true},
  fontSizeInfoType: {
    type: Object as PropType<FontSizeInfoType>,
    required: true,
  },
  textVisible: {
    type: Boolean,
    default: true,
  },
})

const componentStyle = computed(() => {
  const {width, height, left, top, angle, skew} = props.component
  const style: CSSProperties = {
    position: 'absolute',
    zIndex: props.component.zindex,
  }

  if (width) style.width = withUnit(width)
  if (height) style.height = withUnit(height)

  const transform: string[] = [`translateX(${withUnit(left)})`, `translateY(${withUnit(top)})`, `rotate(${angle ?? 0}deg)`]
  if (skew?.length) {
    let skewString = `skewX(${skew[0]}deg)`
    if (skew[1]) {
      skewString += ` skewY(${skew[1]}deg)`
    }
    transform.push(skewString)
  }
  style.transform = transform.join(' ')

  return style
})

const componentContentStyle = computed(() => {
  return {
    ...pickStyle(props.component.style, false),
    width: '100%',
    height: '100%',
  } as CSSProperties
})

const previewId = computed(() => {
  return 'hybridExportChildId-' + (props.component.componentId ?? props.component.id)
})
</script>

<template>
  <div :id="previewId" :style="componentStyle" :data-component-id="String(component.componentId ?? component.id ?? '')" :data-component-type="component.componentType">
    <export-quill-text-view
      v-if="[EComponentType.Text, EComponentType.PageFooter, EComponentType.PageIndexNumber].includes(component.componentType)"
      v-node-id="hybrid"
      :font-size-info-type="fontSizeInfoType"
      :component-info="component"
      :text-visible="textVisible"
      :style="componentContentStyle" />
    <div v-else-if="[EComponentType.Image, EComponentType.Icon].includes(component.componentType) && component.imageSrc !== ''" :style="componentContentStyle">
      <img :src="component.imageSrc" alt="" style="height: 100%; width: 100%; object-fit: contain" draggable="false" />
    </div>
    <grid-table-display v-else-if="component.componentType === EComponentType.Table" :component-info="component" :style="componentContentStyle" />
    <div v-else-if="component.divStyle" :style="componentContentStyle">
      <shape-view :component-info="component" />
    </div>
  </div>
</template>

<style scoped lang="less">
@import '../../view/editor/component/text/quill-common-style.css';
</style>
