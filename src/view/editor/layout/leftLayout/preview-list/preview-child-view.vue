<script setup lang="ts">
import {EComponentType, type IComponentInfo} from '@/view/editor/utils/common-modle'
import {computed, type CSSProperties, onMounted, type PropType} from 'vue'
import {withUnit} from '@/view/common/drager/utils'
import {type FontSizeInfoType} from '@/store/textEdiotrSotre'
import QuillTextDisplayView from '@/view/editor/component/text/quill-text-display-view.vue'
import ShapeView from '@/view/editor/component/shape/shape-view.vue'
import GridTableDisplay from '@/view/editor/component/table/grid-table-display.vue'

const props = defineProps({
  component: {type: Object as PropType<IComponentInfo>, required: true},
  fontSizeInfoType: {
    type: Object as PropType<FontSizeInfoType>,
    required: true,
  },
  needTranslate: {type: Boolean, default: true},
  optTextHtml: {type: Boolean, default: false},
})

const componentStyle = computed(() => {
  const {width, height, left, top, angle, skew} = props.component
  const style: CSSProperties = {}

  if (width) style.width = withUnit(width)
  if (height) {
    style.height = withUnit(height)
  }

  // console.log('dragStyle', transform.join(''))
  style.position = 'absolute'
  style.zIndex = props.component.zindex
  if (props.needTranslate) {
    let transform: string[] = [`translateX(${withUnit(left)})`, `translateY(${withUnit(top)})`, `rotate(${angle ?? 0}deg)`]
    if (skew && skew.length) {
      let skewStr = `skewX(${skew[0]}deg)`
      if (skew[1]) {
        skewStr += ` skewY(${skew[1]}deg)`
      }

      transform.push(skewStr)
    }
    style.transform = transform.join(' ')
  }
  // style.left = withUnit(left)
  // style.top = withUnit(top)
  return style
  // return {
  //   ...style,
  //   position: 'absolute',
  //   // left: withUnit(left),
  //   // top: withUnit(top),
  //   zIndex: props.component.zindex,
  //   transform: transform.join(' '),
  // } as CSSProperties
})

const textStyle = computed(() => {
  const style = {
    fontSize: '16px',
    fontFamily: `'OPlusSans3-Regular', sans-serif`,
    fontWeight: 'normal',
    direction: 'ltr',
  }
  const fontConfig = props.fontSizeInfoType
  style.fontSize = (fontConfig && fontConfig.pxSize ? fontConfig.pxSize : 29) + 'px'
  style.fontFamily = (fontConfig && fontConfig.font ? fontConfig.font : 'OPlusSans3-Regular') + `, sans-serif`
  // if (fontConfig.type.includes('标题')) {
  //   style.fontWeight = 'bold'
  // }
  return style as CSSProperties
})

const previewId = computed(() => {
  return 'previewChildId-' + (props.optTextHtml ? 'optHtml-' : props.needTranslate ? 'translate-' : 'pdf-') + props.component.componentId
})
onMounted(() => {
  // Array.from(document.styleSheets).forEach((style: any) => {
  //   ;Array.from(style.cssRules as []).forEach((rule: any) => {
  //     if (rule.type === 5) {
  //       console.log('styleSheets', rule)
  //     }
  //   })
  // })
})
</script>

<template>
  <div :id="previewId" :style="componentStyle">
    <quill-text-display-view
      v-if="[EComponentType.Text, EComponentType.PageFooter, EComponentType.PageIndexNumber].includes(component.componentType)"
      :font-size-info-type="fontSizeInfoType"
      :component-info="component"
      :v-node-id="optTextHtml ? 'optHtml' : 'normal'"
      :style="{
        width: '100%',
        height: '100%',
      }" />
    <!--    <div-->
    <!--      v-if="component.componentType === EComponentType.Text"-->
    <!--      :style="textStyle"-->
    <!--      style="-->
    <!--        box-sizing: border-box;-->
    <!--        color: black;-->
    <!--        line-height: 1.42;-->
    <!--        height: 100%;-->
    <!--        width: 100%;-->
    <!--        outline: none;-->
    <!--        overflow-y: auto;-->
    <!--        padding: 12px 15px;-->
    <!--        text-align: left;-->
    <!--        white-space: normal;-->
    <!--        word-spacing: normal;-->
    <!--        overflow-wrap: break-word;-->
    <!--        word-wrap: break-word;-->
    <!--        word-break: normal;-->
    <!--      "-->
    <!--      v-html="component.semanticHTML" />-->
    <div v-else-if="[EComponentType.Image, EComponentType.Icon].includes(component.componentType) && component.imageSrc !== ''" style="height: 100%; width: 100%">
      <img :src="component.imageSrc" alt="" style="height: 100%; width: 100%; object-fit: contain" draggable="false" />
    </div>
    <grid-table-display
      v-if="component.componentType === EComponentType.Table"
      :component-info="component"
      :style="{
        width: '100%',
        height: '100%',
      }" />
    <div v-else-if="component.divStyle" style="height: 100%; width: 100%">
      <shape-view :component-info="component" />
    </div>
  </div>
</template>

<style scoped lang="less">
@import '../../../component/text/quill-common-style.css';
</style>
