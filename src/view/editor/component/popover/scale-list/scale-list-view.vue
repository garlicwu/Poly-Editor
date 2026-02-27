<script setup lang="ts">
import {ref} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'

const emit = defineEmits(['hide', 'adaptive'])
const store = useEditorStore()
const storeEn = useEditorTranslationStore()
const {cpuScale} = storeToRefs(store)
const scaleList = ref<any[]>(['自适应', 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 130, 140, 150, 200])
const clickScale = (scale: any) => {
  if (scale === '自适应') {
    emit('adaptive')
    emit('hide')
  } else {
    store.setScale(scale / 100)
    storeEn.setScale(scale / 100)
    emit('hide')
  }
}
</script>

<template>
  <div class="w-22 h-fit rounded shadow p-2">
    <ul v-if="scaleList.length > 0">
      <li v-for="(term, index) in scaleList" :key="term + '_' + index" class="scale-item-layout" :class="cpuScale === term ? 'selected' : ''" @click="clickScale(term)">
        <span class="w-full">{{ term === '自适应' ? term : term + '%' }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.scale-item-layout {
  @apply w-full content-center text-ppt-text-dark text-sm cursor-pointer hover:bg-ppt-bg-orange py-1 px-1;

  &.selected {
    @apply bg-ppt-bg-orange text-white;
  }
}
</style>
