<script setup lang="ts">
import type {PropType} from 'vue'
import type {IComponentInfo} from '@/view/editor/utils/common-modle'

defineProps({componentInfo: {type: Object as PropType<IComponentInfo>, required: true}})
</script>

<template>
  <div :id="'dragImage-' + componentInfo.componentId" class="w-full h-full">
    <img alt="" :src="componentInfo.imageSrc" class="w-full h-full object-contain" draggable="false" />
  </div>
</template>

<style scoped>
img {
  -webkit-user-drag: none;
}
</style>
