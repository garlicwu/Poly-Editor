<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {EComponentType} from '@/view/editor/utils/common-modle'
import {ColorPicker} from 'vue3-colorpicker'

const emit = defineEmits(['confirmPageSize'])
const store = useEditorStore()
const {currentComponent} = storeToRefs(store)

const pickerColor = ref()
const opPageColorPicker = ref()
const currentType = ref('')
let customStyle = ref<Record<string, any>>({
  background: '#ccc',
  lineBg: '#ccc',
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: '#ccc',
  borderRadius: 0,
  lineInterval: 2,
})

onMounted(() => {
  initCustomStyle()
})

watch(
  () => currentComponent.value,
  () => {
    initCustomStyle()
  },
  {immediate: true},
)

function initCustomStyle() {
  if (currentComponent.value) {
    const oldStyle = currentComponent.value?.divStyle
    console.log('oldStyle', oldStyle)
    customStyle.value = {
      background: '#ccc',
      lineBg: '#ccc',
      borderWidth: 0,
      borderStyle: 'solid',
      borderColor: '#ccc',
      borderRadius: 0,
      lineInterval: 0,
    }
    switch (currentComponent.value.componentType) {
      case EComponentType.Background:
        customStyle.value.background = oldStyle?.['background'] ?? '#ccc'
        customStyle.value.borderWidth = oldStyle?.['borderWidth'] ?? 0
        customStyle.value.borderStyle = oldStyle?.['borderStyle'] ?? 'solid'
        customStyle.value.borderColor = oldStyle?.['borderColor'] ?? '#ccc'
        customStyle.value.borderRadius = oldStyle?.['borderRadius'] ?? 0
        break
      case EComponentType.Line:
      case EComponentType.DashedLine:
        customStyle.value.background = oldStyle?.['background'] ?? '#ccc'
        customStyle.value.lineBg = oldStyle?.['lineBg'] ?? '#ccc'
        customStyle.value.lineInterval = oldStyle?.['lineInterval'] ?? 0
        break
    }

    console.log('customStyle', customStyle.value)
  }
}

const customizeChange = (value: any) => {
  store.setSaveChange()
}

const toggleColorPicker = (event: Event, type: string) => {
  currentType.value = type
  if (currentType.value === 'bg') {
    pickerColor.value = customStyle.value.background
  } else if (currentType.value === 'line') {
    pickerColor.value = customStyle.value.lineBg
  } else if (currentType.value === 'bgBorder') {
    pickerColor.value = customStyle.value.borderColor
  }

  opPageColorPicker.value.toggle(event)
}

function hideColorPicker() {
  opPageColorPicker.value?.hide()
}

function pureColorChange(color: any) {
  if (currentType.value === 'bg') {
    customStyle.value.background = pickerColor.value
  } else if (currentType.value === 'line') {
    customStyle.value.lineBg = pickerColor.value
  } else if (currentType.value === 'bgBorder') {
    customStyle.value.borderColor = pickerColor.value
  }

  hideColorPicker()
  setCurrentComponentValue()
  store.setSaveChange()
  console.log('pureColorChange', color)
}

function setCurrentComponentValue() {
  setTimeout(() => {
    if (currentComponent.value) {
      const style = customStyle.value
      if (currentComponent.value.componentType === EComponentType.Background) {
        currentComponent.value.divStyle = {
          ...currentComponent.value.divStyle,
          ...style,
          border: `${style.borderWidth}px ${style.borderStyle} ${style.borderColor}`,
          'border-radius': style.borderRadius + 'px',
          borderRadius: style.borderRadius,
        }
      } else if (currentComponent.value.componentType === EComponentType.Line) {
        const newStyle = {
          ...currentComponent.value.divStyle,
          ...style,
        }
        newStyle.background = style.lineBg
        currentComponent.value.divStyle = newStyle
      } else if (currentComponent.value.componentType === EComponentType.DashedLine) {
        const currentStyleBg = currentComponent.value?.divStyle?.background
        const newStyle = {
          ...currentComponent.value.divStyle,
          ...style,
        }
        if (currentStyleBg.includes('repeating-linear-gradient')) {
          if (currentStyleBg.includes('right')) {
            newStyle.background = `repeating-linear-gradient(to right,${style.lineBg},${style.lineBg} ${style.lineInterval}px, transparent ${style.lineInterval}px,transparent ${style.lineInterval * 2}px )`
          } else {
            newStyle.background = `repeating-linear-gradient(to bottom,${style.lineBg},${style.lineBg} ${style.lineInterval}px, transparent ${style.lineInterval}px,transparent ${style.lineInterval * 2}px )`
          }
        } else {
          newStyle.background = style.lineBg
        }
        currentComponent.value.divStyle = newStyle
      }
    }
    console.log('setCurrentComponentValue', currentComponent.value?.divStyle)
  }, 100)
}

function hideComponentSettingOp() {
  emit('confirmPageSize')
}
</script>

<template>
  <div class="component-settings-container">
    <div class="settings-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" x2="12" y1="22.08" y2="12" />
      </svg>
      <span class="settings-title">组件设置</span>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <div class="section-header">
          <span class="section-title">组件位置</span>
        </div>
        <div class="position-inputs">
          <div class="position-input-group">
            <InputNumber v-model="currentComponent!.left" class="my-input-style" placeholder="210" size="small" @blur="customizeChange" />
            <span class="position-label">X</span>
          </div>
          <div class="position-separator">×</div>
          <div class="position-input-group">
            <InputNumber v-model="currentComponent!.top" class="my-input-style" placeholder="210" size="small" @blur="customizeChange" />
            <span class="position-label">Y</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-header">
          <span class="section-title">组件尺寸</span>
        </div>
        <div class="position-inputs">
          <div class="position-input-group">
            <InputNumber v-model="currentComponent!.width" class="my-input-style" placeholder="210" size="small" @blur="customizeChange" />
            <span class="position-label">W</span>
          </div>
          <div class="position-separator">×</div>
          <div class="position-input-group">
            <InputNumber v-model="currentComponent!.height" class="my-input-style" placeholder="210" size="small" @blur="customizeChange" />
            <span class="position-label">H</span>
          </div>
        </div>
      </div>

      <div v-if="[EComponentType.Line, EComponentType.DashedLine, EComponentType.Background].includes(currentComponent?.componentType as EComponentType)" class="settings-section">
        <div class="section-header">
          <span class="section-title">旋转角度</span>
        </div>
        <div class="angle-input">
          <InputNumber v-model="currentComponent!.angle" class="my-input-style" placeholder="0" size="small" :max="360" :min="-360" @blur.self="setCurrentComponentValue" @keydown.enter="setCurrentComponentValue" />
          <span class="angle-unit">°</span>
        </div>
      </div>

      <div v-if="currentComponent?.componentType === EComponentType.Background" class="settings-section">
        <div class="section-header">
          <span class="section-title">背景样式</span>
        </div>
        <div class="style-options">
          <div class="style-option">
            <span class="style-label">背景色</span>
            <div class="color-picker-trigger" :style="{background: customStyle.background}" @click="toggleColorPicker($event, 'bg')"></div>
          </div>
          <div class="style-option">
            <span class="style-label">边框色</span>
            <div class="color-picker-trigger" :style="{background: customStyle.borderColor}" @click="toggleColorPicker($event, 'bgBorder')"></div>
          </div>
          <div class="style-option">
            <span class="style-label">边框宽</span>
            <InputNumber v-model="customStyle.borderWidth" class="my-input-style" placeholder="0" size="small" @blur.self="setCurrentComponentValue" @keydown.enter="setCurrentComponentValue" />
          </div>
          <div class="style-option">
            <span class="style-label">圆角</span>
            <InputNumber v-model="customStyle.borderRadius" class="my-input-style" placeholder="0" size="small" @blur.self="setCurrentComponentValue" @keydown.enter="setCurrentComponentValue" />
          </div>
        </div>
      </div>

      <div v-else-if="[EComponentType.Line, EComponentType.DashedLine].includes(currentComponent?.componentType as EComponentType)" class="settings-section">
        <div class="section-header">
          <span class="section-title">线条样式</span>
        </div>
        <div class="style-options">
          <div class="style-option">
            <span class="style-label">线条色</span>
            <div class="color-picker-trigger" :style="{background: customStyle.lineBg}" @click="toggleColorPicker($event, 'line')"></div>
          </div>
          <div v-if="currentComponent?.componentType === EComponentType.DashedLine" class="style-option">
            <span class="style-label">虚线间隔</span>
            <InputNumber v-model="customStyle.lineInterval" class="my-input-style" placeholder="0" size="small" @blur.self="setCurrentComponentValue" @keydown.enter="setCurrentComponentValue" />
          </div>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      <button class="confirm-button" @click="hideComponentSettingOp">
        <span>确定</span>
      </button>
    </div>
  </div>
  <Popover ref="opPageColorPicker">
    <color-picker v-model:pure-color="pickerColor" :format="'hex8'" :is-widget="true" use-type="fk" @pure-color-change="pureColorChange" />
  </Popover>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.component-settings-container {
  @apply w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden;
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

.section-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-[11px] font-medium text-gray-600;
}

.position-inputs {
  @apply flex items-center gap-1.5;
}

.position-input-group {
  @apply relative flex items-center h-7 px-2 bg-white border border-gray-200 rounded-lg shadow-sm flex-1;
}

.position-input-group:hover {
  @apply border-gray-300;
}

.position-label {
  @apply ml-1 text-[9px] text-gray-400 font-medium;
}

.position-separator {
  @apply text-gray-400 text-[10px];
}

.angle-input {
  @apply relative flex items-center h-7 px-2 bg-white border border-gray-200 rounded-lg shadow-sm w-full;
}

.angle-input:hover {
  @apply border-gray-300;
}

.angle-unit {
  @apply ml-1 text-[9px] text-gray-400 font-medium;
}

.style-options {
  @apply grid grid-cols-2 gap-1.5;
}

.style-option {
  @apply flex items-center justify-between p-1.5 rounded-lg border border-gray-100 bg-white;
}

.style-label {
  @apply text-[11px] font-medium text-gray-700 min-w-[50px];
}

.color-picker-trigger {
  @apply w-6 h-6 rounded border border-gray-200 cursor-pointer transition-all duration-200 hover:border-purple-300 hover:shadow-sm;
}

.color-picker-trigger:hover {
  @apply transform scale-105;
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
</style>
