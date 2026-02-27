<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'

const editorStore = useEditorStore()
const translationEditorStore = useEditorTranslationStore()

const {editorLang, selectedTranslatedLang, editorTranslationInfo} = storeToRefs(translationEditorStore)
const emit = defineEmits(['onSelectedValue'])
const categories = ref([{name: '主体全部自适应'}, {name: '主体当页自适应'}])
const selectedValue = ref('1.0')
onMounted(() => {
  categories.value = [{name: '主体全部自适应'}, {name: '主体当页自适应'}]
  if (editorTranslationInfo.value.id !== '') {
    if (selectedTranslatedLang.value !== '') {
      categories.value.push({name: '翻译单语言自适应'})
    }
    categories.value.push({name: '翻译当页自适应'})
  }
})

function onSelectedValue(value: string) {
  emit('onSelectedValue', selectedValue.value)
  editorStore.setLoading(true)
  switch (value) {
    case '主体全部自适应':
      editorStore.resizeAutoText().finally(() => finallyEvent())
      break
    case '主体当页自适应':
      editorStore.setLoadingText('自适应主体当页字体中...')
      editorStore.resizeAutoCurrentPageText().finally(() => finallyEvent())
      break
    case '翻译单语言自适应':
      editorStore.setLoadingText('自适应翻译单语言字体中...')
      translationEditorStore.resizeAutoSingleLangPageText().finally(() => finallyEvent())
      break
    case '翻译当页自适应':
      editorStore.setLoadingText('自适应翻译当页字体中...')
      translationEditorStore.resizeAutoCurrentPageText().finally(() => finallyEvent())
      break
    default:
      finallyEvent()
      break
  }
}

const finallyEvent = () => {
  console.log('setLoading')
  editorStore.setLoadingText('')
  editorStore.setLoading(false)
}
</script>

<template>
  <div class="font-fit-container">
    <div class="font-fit-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 7V4h16v3"/>
        <path d="M9 20h6"/>
        <path d="M12 4v16"/>
      </svg>
      <span class="header-title">字体自适应</span>
    </div>

    <div class="font-fit-list">
      <div v-for="category of categories" :key="category.name" class="font-fit-item" @click="onSelectedValue(category.name)">
        <span>{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.font-fit-container {
  @apply w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.font-fit-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.header-title {
  @apply text-xs font-semibold text-gray-800;
}

.font-fit-list {
  @apply max-h-64 overflow-y-auto;
}

.font-fit-item {
  @apply w-full h-9 px-3 text-[11px] text-gray-700 flex items-center cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:text-purple-700;
}
</style>
