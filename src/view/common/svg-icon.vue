<template>
  <svg :class="svgClass" aria-hidden="true" :style="configStyle">
    <use :href="iconName"></use>
  </svg>
</template>

<script lang="ts" setup>
import {computed} from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: false,
    default: '',
  },
  customWidth: {
    type: Number,
    default: 0,
  },
  customHeight: {
    type: Number,
    default: 0,
  },
  customMarginLeft: {
    type: Number,
    default: 0,
  },
  customMarginRight: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 0,
  },
  fill: {
    type: String,
    default: '',
  },
  stroke: {
    type: String,
    default: '',
  },
})

const iconName = computed(() => {
  return `#icon-${props.name}`
})
const configStyle = computed(() => {
  let style: Record<any, any> = {}
  if (props.customWidth && props.customWidth > 0) {
    style['width'] = props.customWidth + 'rem'
    style['height'] = props.customWidth + 'rem'
  }
  if (props.customHeight && props.customHeight > 0) {
    style['height'] = props.customHeight + 'rem'
  }
  if (props.size && props.size > 0) {
    style['width'] = props.size + 'px'
    style['height'] = props.size + 'px'
  }
  if (props.customMarginLeft && props.customMarginLeft > 0) {
    style['marginLeft'] = props.customMarginLeft + 'rem'
  }
  if (props.customMarginRight && props.customMarginRight > 0) {
    style['marginRight'] = props.customMarginRight + 'rem'
  }
  if (props.color && props.color !== '') {
    style['color'] = props.color
  }
  if (props.stroke !== '') {
    style['stroke'] = props.stroke
  }
  if (props.fill !== '') {
    style['fill'] = props.fill
  }
  return style
})
const svgClass = computed(() => {
  if (props.className) {
    return 'svg-icon-custom ' + props.className
  } else {
    return 'svg-icon-custom'
  }
})
</script>

<style lang="less" scoped>
.svg-icon-custom {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
  overflow: hidden;
}
</style>
