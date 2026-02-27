<script setup lang="ts">
import {useImage} from '@/view/editor/hooks/useImage'
import {ref, watch, onMounted} from 'vue'
import SettingsPageView from '@/view/editor/component/popover/settings-page/settings-page-view.vue'
import SettingsComponentView from '@/view/editor/component/popover/settings-component/settings-component-view.vue'
import {replaceContentDeltaOps} from '@/view/editor/tool/editor-util'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {useEditorStore} from '@/store/editorStore'
import {EComponentType} from '@/view/editor/utils/common-modle'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import {useTranslation} from '../../hooks/useTranslation'
import {storeToRefs} from 'pinia'
import {netMultiLanguageConfig} from '@/net/editorNet'
import {type ISelectLanguage} from '@/view/editor/utils/common-modle'
import {useToast} from 'primevue/usetoast'
import {nextTick, type Ref} from 'vue'
import PickList from 'primevue/picklist'

const {imageUrl} = useImage()
const opPageSettingRef = ref()
const opComponentSettingRef = ref()

// 小语种翻译相关
const editorStore = useEditorStore()
const editorTranslationStore = useEditorTranslationStore()
const {editorLang, disableEdit} = storeToRefs(editorStore)
const {translateOtherLanguage} = useTranslation()
const translateToMultilingualVisible = ref(false)
const selectLanguageList = ref<ISelectLanguage[]>([])
const allLanguageList = ref<ISelectLanguage[]>([])
const LanguageList: Ref<ISelectLanguage[][]> = ref([[], []])

const toast = useToast()

const initPickListData = () => {
  LanguageList.value = [[...allLanguageList.value], [...selectLanguageList.value]]
}

const toggleSelectLanguage = (visible: boolean) => {
  if (disableEdit.value) {
    return
  }
  if (visible) {
    if (allLanguageList.value.length === 0) {
      netMultiLanguageConfig()
        .then((res: any) => {
          allLanguageList.value = (res.records as ISelectLanguage[]).filter((item) => item.code !== 'en')
          editorTranslationStore.setAllLanguageList(allLanguageList.value)

          if (selectLanguageList.value.length > 0) {
            selectLanguageList.value = allLanguageList.value.filter((lang) => selectLanguageList.value.some((selected) => selected.code === lang.code))
          }

          initPickListData()
          translateToMultilingualVisible.value = true
        })
        .catch((e) => {
          console.error(e)
        })
    } else {
      initPickListData()
      translateToMultilingualVisible.value = true
    }
  } else {
    translateToMultilingualVisible.value = false
  }
}

const translateToMultilingual = async () => {
  selectLanguageList.value = [...LanguageList.value[1]]

  if (selectLanguageList.value.length === 0) {
    toast.add({severity: 'warning', summary: '提示', detail: '请选择至少一个语种', life: 2000})
    return
  }

  toggleSelectLanguage(false)
  editorTranslationStore.setSelectLanguageList(selectLanguageList.value.map((item) => item.code))
  await translateOtherLanguage(false)
}

const customEmptyMessage = '未选择翻译语言'

const updateEmptyMessage = () => {
  nextTick(() => {
    const elements = document.querySelectorAll('.p-listbox-empty-message')
    elements.forEach((el) => {
      el.textContent = customEmptyMessage
    })
  })
}

const setButtonTitles = () => {
  nextTick(() => {
    const buttons = document.querySelectorAll('.p-button')
    buttons.forEach((btn) => {
      const ariaLabel = btn.getAttribute('aria-label')
      if (!ariaLabel) return

      let title = ''
      switch (ariaLabel) {
        case 'Move to Target':
          title = '向右移动'
          break
        case 'Move All to Target':
          title = '全部向右移动'
          break
        case 'Move to Source':
          title = '向左移动'
          break
        case 'Move All to Source':
          title = '全部向左移动'
          break
      }

      if (title) {
        btn.setAttribute('title', title)
      }
    })
  })
}

watch(
  LanguageList,
  () => {
    updateEmptyMessage()
    setButtonTitles()
  },
  {deep: true},
)

onMounted(() => {
  emitter.on(MittTypeEnum.CLEAR_TRANSLATE_SELECT_LIST, () => {
    selectLanguageList.value = []
    editorTranslationStore.setSelectLanguageList([])
    initPickListData()
  })
})

const pageSetting = (event: Event) => {
  opPageSettingRef.value.toggle(event)
}

function hidePageSettingOp() {
  opPageSettingRef.value?.hide()
}

const componentSetting = (event: Event) => {
  opComponentSettingRef.value.toggle(event)
}

function hideComponentSettingOp() {
  opComponentSettingRef.value?.hide()
}

// 内容替换弹窗相关状态
const opReplace = ref()
const originalContent = ref('')
const replaceContent = ref('')

// 切换内容替换弹窗
const toggleReplaceDialog = (event: Event) => {
  opReplace.value.toggle(event)
  if (opReplace.value.visible) {
    originalContent.value = ''
    replaceContent.value = ''
  }
}

// 全部替换逻辑
const handleReplaceAll = () => {
  const original = originalContent.value.trim()
  const replace = replaceContent.value.trim()
  if (!original) {
    // alert('请输入原始内容')
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'warn',
      summary: '提示',
      detail: '请输入内容',
      life: 1500,
    })
    return
  }

  let replacedCount = 0
  editorStore.editorInfo.pageList.forEach((page) => {
    page.componentList.forEach((component) => {
      if (component.componentType === EComponentType.Text) {
        const {newOps, count} = replaceContentDeltaOps(component.deltaOps, original, replace)
        replacedCount += count
        if (count > 0) {
          component.deltaOps = newOps
          component.hasChange = (component.hasChange ?? 0) + 1
        }
      }
    })
  })

  if (replacedCount > 0) {
    editorStore.setSaveChange()
    // alert(`共替换 ${replacedCount} 处`)
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'info',
      summary: '提示',
      detail: `共替换${replacedCount}条内容`,
      life: 1500,
    })
  } else {
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'warn',
      summary: '提示',
      detail: '未找到匹配内容',
      life: 1500,
    })
  }
}
</script>

<template>
  <div class="flex flex-row items-center space-x-3">
    <div class="px-3 py-1.5 rounded text-sm text-ppt-text-normal hover:bg-ppt-bg-purple/30 transition-colors duration-200 cursor-pointer" @click="pageSetting">
      页面设置
    </div>
    <div class="px-3 py-1.5 rounded text-sm text-ppt-text-normal hover:bg-ppt-bg-purple/30 transition-colors duration-200 cursor-pointer" @click="componentSetting">
      组件设置
    </div>
    <div v-if="editorLang === 'en'" class="px-3 py-1.5 rounded text-sm text-ppt-text-normal hover:bg-ppt-bg-purple/30 transition-colors duration-200 cursor-pointer" @click="toggleSelectLanguage(true)">
      小语种翻译
    </div>
    <!--    <div class="flex flex-col ml-3 items-center">-->
    <!--      <div class="flex flex-row items-center">-->
    <!--        <img :src="imageUrl('ic-top-page-text-direction')" alt="" class="w-8 h-8" />-->
    <!--        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3.5 h-3.5" />-->
    <!--      </div>-->
    <!--      <span class="text-ppt-text-normal mt-2 text-[0.625rem]">文字方向</span>-->
    <!--    </div>-->
    
  </div>
  <!-- 内容替换弹窗 -->
  <Popover ref="opReplace">
    <div class="p-4 w-64 bg-white rounded shadow">
      <label for="originalContent" class="block mb-1 text-sm">内容</label>
      <InputText id="originalContent" v-model="originalContent" placeholder="输入原始内容" class="w-full mb-3" />

      <label for="replaceContent" class="block mb-1 text-sm">替换为</label>
      <InputText id="replaceContent" v-model="replaceContent" placeholder="输入替换后的内容" class="w-full mb-3" />

      <Button label="全部替换" class="w-full" @click="handleReplaceAll" />
    </div>
  </Popover>
  <Popover ref="opPageSettingRef">
    <settings-page-view @confirm-page-size="hidePageSettingOp" />
  </Popover>
  <Popover ref="opComponentSettingRef">
    <settings-component-view @confirm-page-size="hideComponentSettingOp" />
  </Popover>
  <Dialog v-model:visible="translateToMultilingualVisible" modal header="选择语种" class="language-select-dialog" :style="{width: '640px'}" :show-close-icon="true" :pt="{
    root: 'bg-white rounded-xl shadow-lg border border-gray-100',
    header: 'px-6 py-4 border-b border-gray-100',
    title: 'text-lg font-semibold text-gray-800',
    content: 'px-6 py-5',
    footer: 'px-6 py-4 border-t border-gray-100 bg-gray-50/50'
  }">
    <div class="picklist-wrapper">
      <PickList v-model="LanguageList" data-key="code" :show-source-controls="false" :pt="{
        root: 'flex gap-4',
        sourceWrapper: 'flex-1',
        targetWrapper: 'flex-1',
        sourceHeader: 'px-4 py-3 bg-gray-50 rounded-t-lg border border-gray-200 border-b-0',
        targetHeader: 'px-4 py-3 bg-purple-50/50 rounded-t-lg border border-purple-100 border-b-0',
        sourceList: 'border border-gray-200 rounded-b-lg bg-white max-h-80 overflow-y-auto',
        targetList: 'border border-purple-100 rounded-b-lg bg-white max-h-80 overflow-y-auto',
        item: 'px-4 py-2.5 cursor-pointer transition-all duration-200 hover:bg-purple-50/50 rounded-md my-1 mx-2',
        buttons: 'flex flex-col gap-2 self-center',
        button: 'w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-purple-500 hover:border-purple-500 hover:text-white transition-all duration-200 shadow-sm'
      }">
        <template #sourceheader>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700">可选语种</span>
            <span class="ml-auto text-xs text-gray-400">{{ LanguageList[0].length }}</span>
          </div>
        </template>
        <template #targetheader>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-sm font-medium text-purple-700">已选语种</span>
            <span class="ml-auto text-xs text-purple-400">{{ LanguageList[1].length }}</span>
          </div>
        </template>
        <template #option="{option}">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-700">{{ option.name }}</span>
          </div>
        </template>
      </PickList>
    </div>

    <div class="flex justify-end gap-3 mt-6">
      <Button type="button" label="取 消" class="px-8 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200" severity="secondary" size="small" @click="toggleSelectLanguage(false)" />
      <Button type="button" label="确 认" class="px-8 py-2.5 rounded-lg bg-purple-500 text-white hover:bg-purple-600 shadow-md hover:shadow-lg transition-all duration-200" size="small" @click="translateToMultilingual" />
    </div>
  </Dialog>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.editor-setting-item {
  @apply cursor-pointer rounded hover:bg-ppt-bg-normal p-2;
}

.language-select-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-100;
}

.language-select-dialog :deep(.p-dialog-content) {
  @apply p-0;
}

.picklist-wrapper :deep(.p-picklist-list-wrapper) {
  @apply bg-white rounded-lg border border-gray-200;
}

.picklist-wrapper :deep(.p-picklist-list) {
  @apply max-h-80 overflow-y-auto;
}

.picklist-wrapper :deep(.p-picklist-item) {
  @apply px-4 py-2.5 cursor-pointer transition-all duration-200 hover:bg-purple-50/50 rounded-md my-1 mx-2 text-sm text-gray-700;
}

.picklist-wrapper :deep(.p-picklist-item.p-highlight) {
  @apply bg-purple-100 text-purple-700;
}

.picklist-wrapper :deep(.p-picklist-item:hover) {
  @apply bg-purple-50/50;
}

.picklist-wrapper :deep(.p-picklist-buttons) {
  @apply flex flex-col gap-2 self-center;
}

.picklist-wrapper :deep(.p-picklist-button) {
  @apply w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-purple-500 hover:border-purple-500 hover:text-white transition-all duration-200 shadow-sm;
}

.picklist-wrapper :deep(.p-picklist-button:hover) {
  @apply shadow-md;
}

.picklist-wrapper :deep(.p-picklist-button:active) {
  @apply scale-95;
}

.picklist-wrapper :deep(.p-picklist-button.p-disabled) {
  @apply opacity-40 cursor-not-allowed hover:bg-white hover:border-gray-200 hover:text-gray-600;
}

.picklist-wrapper :deep(.p-picklist-button.p-disabled:hover) {
  @apply shadow-sm;
}
</style>
