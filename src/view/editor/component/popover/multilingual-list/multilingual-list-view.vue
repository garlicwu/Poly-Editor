<script setup lang="ts">
import {ref, watch} from 'vue'
import {storeToRefs} from 'pinia'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import type {ISelectLanguage} from '@/view/editor/utils/common-modle'
import {cloneDeep} from 'lodash'

const emit = defineEmits(['selectChange'])
const storeEn = useEditorTranslationStore()
const {allLanguageList} = storeToRefs(storeEn)

const showLanguageList = ref<ISelectLanguage[]>([])
const checkLanguageList = ref<string[]>([])
// const clickLanguage = (clickItem: ISelectLanguage) => {
//   storeEn.selectMultilingual(clickItem)
//   emit('selectChange', clickItem)
// }
watch(
  () => allLanguageList.value,
  (value) => {
    showLanguageList.value = cloneDeep(value)
    checkLanguageList.value = showLanguageList.value.filter((item) => item.selected).map((item) => item.code)
  },
  {immediate: true,deep: true},
)

const checkLanguageChange = (value: any, selectedIndex: number) => {
  console.log('checkLanguage', checkLanguageList.value, selectedIndex)
  showLanguageList.value.forEach((item) => {
    item.selected = checkLanguageList.value.includes(item.code)
  })
  storeEn.setAllLanguageList(showLanguageList.value)
}
</script>

<template>
  <div class="w-45 max-h-120 rounded shadow p-2 overflow-auto">
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
