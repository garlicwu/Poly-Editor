<script setup lang="ts">
import LeftLayerListView from '@/view/editor/layout/leftLayout/preview-list/left-layer-list-view.vue'
import LeftPageListView from '@/view/editor/layout/leftLayout/preview-list/left-page-list-view.vue'

</script>

<template>
  <div class="w-full h-full overflow-auto flex flex-col">
    <left-page-list-view class="border-b border-ppt-line" />
    <left-layer-list-view />
  </div>
</template>

<style scoped></style>
