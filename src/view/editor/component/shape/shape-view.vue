<script setup lang="ts">
import {computed, onMounted, type PropType} from 'vue'
import type {IComponentInfo} from '@/view/editor/utils/common-modle'

const props = defineProps({
  componentInfo: {type: Object as PropType<IComponentInfo>, required: true},
  preview: {type: Boolean, default: false},
})

// 清理被污染的 divStyle（过滤掉数字索引和非CSS属性）
const validStyle = computed(() => {
  if (!props.componentInfo.divStyle) return {}
  const style: Record<string, any> = {}
  const invalidKeys = ['textVerticalAlign']
  for (const key in props.componentInfo.divStyle) {
    // 跳过数字索引（被字符串展开污染的数据）
    if (!isNaN(Number(key))) continue
    // 跳过非CSS属性
    if (invalidKeys.includes(key)) continue
    style[key] = props.componentInfo.divStyle[key]
  }
  return style
})

onMounted(() => {
  console.log('dragShape', props.componentInfo)
})
</script>

<template>
  <div :id="'dragShape-' + (preview ? 'preview-' : '') + componentInfo.componentId" class="w-full h-full box-border" :style="validStyle">
    <!--    <div class="w-full h-full box-border" :style="componentInfo.style"></div>-->
  </div>
</template>

<style scoped></style>
