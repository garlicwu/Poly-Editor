<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useImage} from '@/view/editor/hooks/useImage'
import {configPixel, defaultDpi, EDirectoryType, EPageSizeType, getPageSizeTypeList, type IPageSize} from '@/view/editor/utils/common-modle'
import Select from 'primevue/select'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {useAreaMoveStore} from '@/store/useAreaMoveStore'
import {cloneDeep, isEqual} from 'lodash'
import {useTranslation} from '@/view/editor/hooks/useTranslation'

const props = defineProps({add: {type: Boolean, default: false}})
const emit = defineEmits(['confirmPageSize'])
const store = useEditorStore()
const {currentPage, editorInfo} = storeToRefs(store)
const {imageUrl} = useImage()
const {userAutoSave} = useTranslation()
const areaStore = useAreaMoveStore()
const {dragViewSnap} = storeToRefs(areaStore)
const dragViewSnapCheck = ref(false)
const recommendSelect = ref(['A4'])
const categories = ref([
  {
    name: 'A4',
    des: '210 x 297 毫米',
    value: {sizeName: 'A4', width: 210, height: 297, type: EPageSizeType.Millimetre, isCustomize: false},
  },
  {
    name: 'A3',
    des: '420 x 297 毫米',
    value: {sizeName: 'A3', width: 420, height: 297, type: EPageSizeType.Millimetre, isCustomize: false},
  },
  {
    name: 'A5',
    des: '210 x 148 毫米',
    value: {sizeName: 'A5', width: 210, height: 148, type: EPageSizeType.Millimetre, isCustomize: false},
  },
  {
    name: '传单',
    des: '210 x 297 毫米',
    value: {sizeName: '传单', width: 210, height: 297, type: EPageSizeType.Millimetre, isCustomize: false},
  },
])

const editorBaseConfig = ref<{
  directoryType?: string
  footerType?: string
}>({
  directoryType: 'auto',
  footerType: 'auto',
})

const selectedPageSize = ref<IPageSize>({
  sizeName: 'A4',
  width: 210,
  height: 297,
  type: EPageSizeType.Millimetre,
  isCustomize: false,
  dpi: defaultDpi,
  pixelWidth: 210,
  pixelHeight: 297,
})

const selectedCustomizeType = ref<Record<string, any>>({
  name: '毫米',
  value: EPageSizeType.Millimetre,
  isCustomize: true,
})

const pageSizeTypes = ref<any[]>([])

onMounted(() => {
  pageSizeTypes.value = getPageSizeTypeList()
  if (!props.add) {
    if (currentPage.value) {
      selectedPageSize.value = cloneDeep(currentPage.value?.pageSize as IPageSize)
      recommendSelect.value = [selectedPageSize.value.sizeName]
    } else {
      selectedPageSize.value.dpi = Number(editorInfo.value.dpi ?? defaultDpi)
    }
  } else {
    selectedPageSize.value.dpi = Number(editorInfo.value.dpi ?? defaultDpi)
  }
  console.log('pageSizeTypes', selectedPageSize.value)
})
watch(
  () => editorInfo.value.directoryType,
  (value) => {
    editorBaseConfig.value.directoryType = value
  },
  {immediate: true},
)
watch(
  () => editorInfo.value.footerType,
  (value) => {
    editorBaseConfig.value.footerType = value
  },
  {immediate: true},
)

watch(
  () => currentPage.value,
  (value) => {
    if (currentPage.value) {
      selectedPageSize.value = currentPage.value?.pageSize as IPageSize
      recommendSelect.value = [selectedPageSize.value.sizeName]
    }
  },
)

watch(
  () => dragViewSnap.value,
  (value) => {
    dragViewSnapCheck.value = value
  },
  {
    immediate: true,
    deep: true,
  },
)

const confirm = () => {
  store.setEditorConfig(editorBaseConfig.value)
  if (!isEqual(currentPage.value?.pageSize, selectedPageSize.value)) {
    console.log('selectedCustomizeChange', selectedPageSize.value)
    if (props.add) {
      store.addNewPageInfoBySize(configPixel(selectedPageSize.value))
    } else {
      store.setCurrentPageSize(configPixel(selectedPageSize.value))
    }
  }

  areaStore.setDragViewSnap(dragViewSnapCheck.value)
  emit('confirmPageSize')
}

const customizeChange = (value: any) => {
  console.log('customizeChange', value)
  if (!value) {
    selectedPageSize.value = {...categories.value.find((item) => recommendSelect.value[0] === item.name)?.value} as IPageSize
  }
}

const editorConfigChange = (value: any) => {}

const recommendChange = (value: any, selectedIndex: number) => {
  console.log('recommendChange', value, selectedIndex)
  recommendSelect.value = [categories.value[selectedIndex].name]
  selectedPageSize.value = {...categories.value[selectedIndex].value}
}

const selectSizeOption = (name: string, index: number) => {
  if (!selectedPageSize.value.isCustomize) {
    recommendSelect.value = [name]
    selectedPageSize.value = {...categories.value[index].value}
  }
}

const selectedCustomizeChange = (value: any) => {
  console.log('selectedCustomizeChange', value)
  selectedPageSize.value.type = selectedCustomizeType.value.type
}
</script>

<template>
  <div class="page-settings-container">
    <div class="settings-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <line x1="3" x2="21" y1="9" y2="9"/>
        <path d="m9 16 3-3 3 3"/>
      </svg>
      <span class="settings-title">页面设置</span>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <div class="section-header">
          <span class="section-title">自定义尺寸</span>
          <Checkbox v-model="selectedPageSize.isCustomize" class="my-custom-checkbox-style" name="自定义" :value="selectedPageSize.isCustomize" binary @value-change="customizeChange" />
        </div>
        <div class="custom-size-inputs" :class="{disabled: !selectedPageSize.isCustomize}">
          <div class="size-input-group">
            <InputNumber v-model="selectedPageSize.width" class="my-input-style" placeholder="210" size="small" :disabled="!selectedPageSize.isCustomize" />
            <span class="size-label">W</span>
          </div>
          <div class="size-lock-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="size-input-group">
            <InputNumber v-model="selectedPageSize.height" class="my-input-style" placeholder="297" size="small" :disabled="!selectedPageSize.isCustomize" />
            <span class="size-label">H</span>
          </div>
          <Select
            v-model="selectedCustomizeType"
            :options="pageSizeTypes"
            option-label="name"
            value="name"
            :disabled="!selectedPageSize.isCustomize"
            class="unit-select"
            @value-change="selectedCustomizeChange">
            <template #value="slotProps">
              <div v-if="slotProps.value" class="select-value">
                {{ slotProps.value.name }}
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="slotProps">
              <div class="select-option">
                {{ slotProps.option.name }}
              </div>
            </template>
          </Select>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-header">
          <span class="section-title">推荐尺寸</span>
        </div>
        <div class="size-options-grid">
          <div
            v-for="(category, index) of categories"
            :key="category.name"
            class="size-option-card"
            :class="{active: recommendSelect[0] === category.name}"
            @click="selectSizeOption(category.name, index)">
            <div class="option-radio">
              <div v-if="recommendSelect[0] === category.name" class="radio-dot"></div>
            </div>
            <div class="option-info">
              <span class="option-name">{{ category.name }}</span>
              <span class="option-des">{{ category.des }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-header">
          <span class="section-title">页面选项</span>
        </div>
        <div class="options-grid">
          <div class="option-item">
            <Checkbox
              v-model="editorBaseConfig.directoryType"
              class="my-custom-checkbox-style"
              name="自定义目录"
              :value="editorBaseConfig.directoryType"
              :true-value="EDirectoryType.Custom"
              :false-value="EDirectoryType.Auto"
              binary
              @value-change="editorConfigChange" />
            <span class="option-label">自定义目录</span>
          </div>
          <div class="option-item">
            <Checkbox
              v-model="editorBaseConfig.footerType"
              class="my-custom-checkbox-style"
              name="自定义页码"
              :value="editorBaseConfig.footerType"
              :true-value="EDirectoryType.Custom"
              :false-value="EDirectoryType.Auto"
              binary
              @value-change="editorConfigChange" />
            <span class="option-label">自定义页码</span>
          </div>
          <div class="option-item">
            <Checkbox v-model="dragViewSnapCheck" class="my-custom-checkbox-style" name="开启吸附" :value="dragViewSnapCheck" :true-value="true" :false-value="false" binary @value-change="editorConfigChange" />
            <span class="option-label">开启吸附</span>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      <button class="confirm-button" @click="confirm">
        <span>确定</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.page-settings-container {
  @apply w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
}

.settings-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.settings-title {
  @apply text-xs font-semibold text-gray-800;
}

.settings-content {
  @apply px-3 py-2.5 space-y-2.5;
}

.settings-section {
  @apply space-y-1.5;
}

.settings-section.disabled {
  @apply opacity-50 pointer-events-none;
}

.section-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-[11px] font-medium text-gray-600;
}

.custom-size-inputs {
  @apply flex items-center gap-1 transition-all duration-200;
}

.custom-size-inputs.disabled {
  @apply opacity-50;
}

.size-input-group {
  @apply relative flex items-center h-7 px-2 bg-white border border-gray-200 rounded-lg shadow-sm w-32;
}

.size-input-group:hover {
  @apply border-gray-300;
}

.size-label {
  @apply ml-1 text-[9px] text-gray-400 font-medium;
}

.size-lock-icon {
  @apply flex items-center justify-center w-4 h-4 text-gray-400;
}

.unit-select {
  @apply w-36 h-7 border border-gray-200 rounded-lg shadow-sm text-[11px];
}

.unit-select :deep(.p-select-label) {
  @apply text-gray-700;
}

.size-options-grid {
  @apply grid grid-cols-2 gap-1.5;
}

.size-option-card {
  @apply flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-100 bg-white cursor-pointer transition-all duration-200 hover:border-purple-200 hover:bg-purple-50/30;
}

.size-option-card.active {
  @apply border-purple-400 bg-purple-50/50 ring-1 ring-purple-400/20;
}

.option-radio {
  @apply w-3 h-3 rounded-full border-2 border-gray-300 flex items-center justify-center transition-all duration-200;
}

.size-option-card.active .option-radio {
  @apply border-purple-500;
}

.radio-dot {
  @apply w-1.5 h-1.5 rounded-full bg-purple-500;
}

.option-info {
  @apply flex flex-col;
}

.option-name {
  @apply text-[11px] font-medium text-gray-800;
}

.option-des {
  @apply text-[9px] text-gray-400 mt-0.5;
}

.options-grid {
  @apply grid grid-cols-2 gap-1.5;
}

.option-item {
  @apply flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-all duration-200;
}

.option-label {
  @apply text-[11px] font-medium text-gray-700;
}

.auto-save-input {
  @apply flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-100 bg-white;
}

.input-label {
  @apply text-[11px] text-gray-700 min-w-[45px];
}

.input-wrapper {
  @apply flex items-center h-7 px-2 bg-white border border-gray-200 rounded-lg shadow-sm flex-1;
}

.input-unit {
  @apply ml-1 text-[9px] text-gray-400 font-medium;
}

.settings-footer {
  @apply px-3 py-2.5 bg-gray-50/50 border-t border-gray-100;
}

.confirm-button {
  @apply w-full h-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[11px] font-medium rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center;
}

.confirm-button:active {
  @apply transform scale-[0.98];
}

.my-input-style :deep(.p-inputtext) {
  @apply w-full border-none bg-transparent text-[11px] text-gray-700 placeholder-gray-400;
}

.my-input-style :deep(.p-inputtext:disabled) {
  @apply bg-transparent text-gray-400;
}

.my-input-style :deep(.p-inputtext:focus) {
  @apply outline-none;
}

.my-custom-checkbox-style :deep(.p-checkbox-box) {
  @apply w-3 h-3 rounded border-2 border-gray-300 transition-all duration-200;
}

.my-custom-checkbox-style :deep(.p-checkbox-box:hover) {
  @apply border-gray-400;
}

.my-custom-checkbox-style :deep(.p-checkbox-checked .p-checkbox-box) {
  @apply bg-purple-500 border-purple-500;
}

.my-custom-checkbox-style :deep(.p-checkbox-checked .p-checkbox-box .p-checkbox-icon) {
  @apply text-white;
}
</style>
