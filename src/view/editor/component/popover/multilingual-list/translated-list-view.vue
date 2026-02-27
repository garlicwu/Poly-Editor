<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {storeToRefs} from 'pinia'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import type {ISelectLanguage} from '@/view/editor/utils/common-modle'
import {cloneDeep} from 'lodash'

const emit = defineEmits(['selectChange'])
const storeEn = useEditorTranslationStore()
const {translatedLanguageList} = storeToRefs(storeEn)

const showLanguageList = ref<ISelectLanguage[]>([])
const checkLanguageList = ref()

watch(
  () => translatedLanguageList.value,
  (value) => {
    showLanguageList.value = cloneDeep(translatedLanguageList.value)
    checkLanguageList.value = showLanguageList.value.filter((item) => item.selected).map((item) => item.code)
  },
  {immediate: true, deep: true},
)
const checkLanguageChange = (value: any, selectedIndex: number) => {
  console.log('checkLanguage', checkLanguageList.value, selectedIndex)
  // if (checkLanguageList.value.length > 0) {
  checkLanguageList.value = [showLanguageList.value[selectedIndex].code]
  emit('selectChange', showLanguageList.value[selectedIndex].code)
  // }
  showLanguageList.value.forEach((item) => {
    item.selected = checkLanguageList.value.includes(item.code)
  })
}
</script>

<template>
  <div class="w-45 h-fit rounded shadow p-2">
    <ul v-if="showLanguageList.length > 0">
      <li v-for="(term, index) in showLanguageList" :key="term + '_' + index" class="scale-item-layout">
        <Checkbox v-model="checkLanguageList" :input-id="term.code" :name="term.name" :value="term.code" class="my-custom-checkbox-style" @value-change="checkLanguageChange($event, index)" />
        <span class="ml-2">{{ term.name }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.scale-item-layout {
  @apply w-full content-center text-ppt-text-dark text-sm cursor-pointer hover:bg-ppt-bg-orange py-1 px-1 flex flex-row;

  &.selected {
  }
}
</style>
