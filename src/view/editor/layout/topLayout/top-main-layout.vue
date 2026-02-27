<script setup lang="ts">
import {useEditorStore} from '@/store/editorStore'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import TopMainDesignView from '@/view/editor/layout/topLayout/top-main-design-view.vue'
import TopMainPageSettingView from '@/view/editor/layout/topLayout/top-main-page-setting-view.vue'
import TopMainRightSetting from '@/view/editor/layout/topLayout/top-main-right-setting-view.vue'
import TopPageTranslationSettingView from '@/view/editor/layout/topLayout/top-page-translation-setting-view.vue'
import TopTextDesignView from '@/view/editor/layout/topLayout/top-text-design-view.vue'
import TopTitleView from '@/view/editor/layout/topLayout/top-title-view.vue'
import {storeToRefs} from 'pinia'
import {useImage} from '../../hooks/useImage'
import {useTranslation} from '../../hooks/useTranslation'
import {useLocalSave} from '@/view/editor/hooks/useLocalSave'
import {useToast} from 'primevue/usetoast'
import {userStore} from '@/store/user'
import {Combine_Lang} from '@/view/editor/utils/common-modle'

const {imageUrl} = useImage()

const emit = defineEmits(['onForceUpdateCombineLang'])
const editorStore = useEditorStore()
const {editorLang, disableEdit} = storeToRefs(editorStore)
const editorEnStore = useEditorTranslationStore()
const {showTranslationSetting} = storeToRefs(editorEnStore)
const user = userStore()
const {hasAllModelAuth} = storeToRefs(user)

const {CnTranslationToEn, userSave} = useTranslation()
const {saveToLocal, exportDataToDialog} = useLocalSave()

// 保存并导出数据
const handleSave = async () => {
  await saveToLocal()
  exportDataToDialog()
}

const onForceUpdateCombineLang = async () => {
  if (disableEdit.value) {
    return
  }
  emit('onForceUpdateCombineLang')
}
</script>

<template>
  <div class="w-full h-16 px-4 py-2 flex flex-row bg-white items-center border-b border-ppt-line shadow-sm">
    <top-title-view class="flex-1" />
    <div class="h-12 w-[1px] mx-3 bg-ppt-line"></div>
    <top-main-design-view @save="handleSave" class="flex items-center" />
    <div class="h-12 w-[1px] mx-3 bg-ppt-line"></div>
    <top-main-page-setting-view class="flex items-center" />
    <div class="h-12 w-[1px] mx-3 bg-ppt-line"></div>
    <top-main-right-setting @save="handleSave" class="flex items-center" />
  </div>
</template>

<style scoped></style>
