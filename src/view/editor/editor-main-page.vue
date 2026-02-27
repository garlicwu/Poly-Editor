<script setup lang="ts">
import TopLayout from '@/view/editor/layout/topLayout/top-main-layout.vue'
import LeftLayout from '@/view/editor/layout/leftLayout/left-menu-layout.vue'
import CenterLayout from '@/view/editor/layout/centerLayout/center-layout.vue'
import {onMounted, ref} from 'vue'
import SettingsPageView from '@/view/editor/component/popover/settings-page/settings-page-view.vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {useTextEditorStore} from '@/store/textEdiotrSotre'
import {fontInitWithList} from '@/lib/util'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {configFontSizeWithPound} from '@/lib/font-face-list'
import {LStorage} from '@/lib/storage'
import {dynamicInitQuillStyle} from '@/view/editor/utils'
import {useLocalSave} from '@/view/editor/hooks/useLocalSave'
import baseFontList from '@/assets/config/base-font-list.json'

const showAddPage = ref(false)
const showDataDialog = ref(false)
const exportData = ref('')
const {downloadAsJson} = useLocalSave()
const editor = useEditorStore()
const {loading, editorInfo, loadingText, pdfExportProgressValue, showPdfExportProgress} = storeToRefs(editor)

// 复制到剪贴板
const copyToClipboard = () => {
  navigator.clipboard.writeText(exportData.value).then(() => {
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'success',
      summary: '成功',
      detail: '已复制到剪贴板',
      life: 2000,
    })
  })
}

// 下载JSON文件
const downloadJson = () => {
  downloadAsJson()
}

onMounted(() => {
  configFontSizeWithPound()
  dynamicInitQuillStyle()
  editor.setLoading(true)
  fontInit()

  // 监听导出对话框事件
  emitter.on(MittTypeEnum.Show_Export_Dialog, (data: string) => {
    exportData.value = data
    showDataDialog.value = true
  })
})

const fontInit = async () => {
  editor.setLoadingText('初始化编辑器...')

  try {
    // 从本地配置文件加载字体列表
    await fontInitWithList(baseFontList as string[])
    await useTextEditorStore().configFontConfigList()
    await initAllData()
    emitter.emit(MittTypeEnum.Page_Preview_Refresh, {})
  } catch (e) {
    console.error('初始化失败:', e)
  } finally {
    finallyEvent()
  }
}

const finallyEvent = () => {
  editor.setLoadingText('')
  editor.setLoading(false)
}

const initAllData = () => {
  return new Promise((resolve) => {
    editor.setLoadingText('初始化编辑器...')

    // 从本地存储加载数据
    const savedData = LStorage.get('editor-data')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        useTextEditorStore().resetAllFontMap()
        editor.initLocalStorageEditorInfoWithNet(data)
      } catch (e) {
        console.error('加载本地数据失败:', e)
        editor.initEmptyEditor()
      }
    } else {
      // 初始化空白编辑器
      editor.initEmptyEditor()
    }

    if (editorInfo.value.pageList.length === 0) {
      showAddPage.value = true
    }

    resolve('')
  })
}
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden bg-white">
    <top-layout id="top-layout" class="border-b border-ppt-line"></top-layout>
    <div class="h-0 flex-1 w-full flex flex-row">
      <left-layout id="left-layout" />
      <div class="flex-1 h-full flex flex-row">
        <center-layout id="center-layout" class="h-full flex-1 w-0" />
      </div>
    </div>
  </div>
  <div v-if="loading || showPdfExportProgress" class="h-full w-full card flex flex-col justify-center items-center absolute top-0 bg-gray-400/60 z-50">
    <ProgressSpinner v-if="loading" class="h-20 w-20" stroke-width="5" fill="transparent" animation-duration="2s" aria-label="Loading" />
    <strong v-if="loading && loadingText !== ''" class="mt-2 text-ppt-text-purple">{{ loadingText }}</strong>
    <strong v-if="showPdfExportProgress" class="mt-2 text-ppt-text-purple">导出中...</strong>
    <ProgressBar v-if="showPdfExportProgress" class="mt-2 h-20 w-200" :value="pdfExportProgressValue" />
  </div>
  <Dialog v-model:visible="showAddPage" modal header="页面设置" class="w-fit p-4" :closable="false">
    <settings-page-view :add="true" @confirm-page-size="showAddPage = false" />
  </Dialog>

  <!-- 数据导出对话框 -->
  <Dialog v-model:visible="showDataDialog" modal header="编辑器数据" class="w-[800px] max-h-[600px]">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-gray-600">以下是当前编辑器的完整数据结构：</p>
      <Textarea v-model="exportData" rows="20" class="font-mono text-xs" readonly />
      <div class="flex gap-2 justify-end">
        <Button label="复制" icon="pi pi-copy" @click="copyToClipboard" />
        <Button label="下载JSON" icon="pi pi-download" @click="downloadJson" />
      </div>
    </div>
  </Dialog>

  <Toast />
</template>

<style>
.p-toast-message {
  padding: 0.75rem;
}
</style>
