<script setup lang="ts">
import SvgIcon from '@/view/common/svg-icon.vue'
import {onMounted, ref, watch} from 'vue'
import {useImage} from '@/view/editor/hooks/useImage'
import {fontFaceNameList, fontInitWithList, getConfigCommonData} from '@/lib/util'
import {dealFontsizePt2Px, dealFontsizePx2Pt, fontSizeWithPound} from '@/lib/font-face-list'
import {EditorTextActionType, useTextEditorStore} from '@/store/textEdiotrSotre'
import {storeToRefs} from 'pinia'
import 'vue3-colorpicker/style.css'
import {ColorPicker} from 'vue3-colorpicker'
import TextLineHeight from '@/view/editor/component/popover/text-lineheight/text-line-height.vue'
import TextLetterSpacing from '@/view/editor/component/popover/text-letter-spacing/text-letter-spacing.vue'
import InertEmoji from '@/view/editor/component/popover/insert-emoji/inert-emoji.vue'
import FontFitSelectView from '@/view/editor/component/popover/font-fit/font-fit-select-view.vue'
import QuillTextOlSizeSelectView from '@/view/editor/component/popover/quill-text-ol-size-select/quill-text-ol-size-select-view.vue'
import ComponentAlignView from '@/view/editor/component/popover/component-align/component-align-view.vue'
import {useEditorStore} from '@/store/editorStore'
import {useQuillTextOnFocusStore} from '@/store/useQuillTextOnFocusStore'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {debounce} from 'lodash'
import TextAfterLineHeight from '@/view/editor/component/popover/text-after-lineheight/text-after-line-height.vue'
import Popover from 'primevue/popover'

const {imageUrl} = useImage()

const svgUrl = (icon: string) => {
  return new URL(`../../../../assets/svg/${icon}.svg`, import.meta.url).href
}

const textFontNodes = ref<any[]>([])
const textFontSizeNodes = ref<any[]>([])
const textFontSizeOptions = ref<string[]>([])
const selectedFontFamilyValue = ref('')
const selectedFontsizeValue = ref<string>('')
const selectedInputFontsizeValue = ref<string>('')
const fontsizeInputHide = ref(true)
const selectedFontLineHeightValue = ref<string>('1')
const selectedAfterFontLineHeightValue = ref<string>('1')
const selectedLetterSpacingValue = ref<string>('')
const selectedDirectionValue = ref<string>('1')

const textStore = useTextEditorStore()
const quillTextEditorStore = useQuillTextOnFocusStore()
const {textAttributes, currentFontMap, quillActionValue} = storeToRefs(textStore)
const {firstTextFormat} = storeToRefs(quillTextEditorStore)
const opPageColorPicker = ref()
const opPageLineHeight = ref()
const opPageAfterLineHeight = ref()
const opPageLetterSpace = ref()
const opPageInsertEmoji = ref()
const opPageFontFit = ref()
const opPageComponentAlign = ref()
const opPageFontsize = ref()

const opPageOlSizeSelect = ref()
const opPageOlType = ref('')

const pickerColor = ref('')
const currentType = ref<EditorTextActionType>()
onMounted(() => {
  if (fontFaceNameList.length <= 0) {
    getConfigCommonData('font-server-list', 'csv').then((res: any) => {
      const list = res.data.split('\n').filter((item: string) => item.trim() !== '')
      textFontNodes.value = list.map((item: string) => {
        // 去掉 URL 编码，去掉文件扩展名，去掉所有空白字符（包括 \r \n）
        const decoded = decodeURIComponent(item.includes('.') ? item.split('.')[0] : item)
        return decoded.trim()
      })
    })
  } else {
    textFontNodes.value = fontFaceNameList.filter((item: string) => item.trim() !== '')
  }

  textFontSizeNodes.value = fontSizeWithPound.map((item: any) => {
    return {...item, pxNum: dealFontsizePt2Px(item.poundNum)}
  })
  textFontSizeOptions.value = textFontSizeNodes.value.map((item: any) => item.title.toString())
  // console.log('textFontSizeNodes', textFontSizeNodes.value)

  emitter.on(MittTypeEnum.REFRESH_DPI, () => {
    textFontSizeNodes.value = fontSizeWithPound.map((item: any) => {
      return {...item, pxNum: dealFontsizePt2Px(item.poundNum)}
    })
    textFontSizeOptions.value = textFontSizeNodes.value.map((item: any) => item.title.toString())
  })
})

watch(
  () => textAttributes.value,
  (value) => {
    const realPxValue = textAttributes.value[EditorTextActionType.Size]?.toString()?.replace('px', '')
    if (realPxValue) {
      const findIndex = textFontSizeNodes.value.findIndex((item) => item.pxNum.toString() === realPxValue)
      if (findIndex > -1) {
        selectedFontsizeValue.value = textFontSizeNodes.value[findIndex].title
      } else {
        if (currentFontMap.value) {
          selectedFontsizeValue.value = currentFontMap.value.size.toString()
        } else {
          selectedFontsizeValue.value = dealFontsizePx2Pt(Number(realPxValue))?.toString() ?? ''
        }
      }
    } else if (textAttributes.value[EditorTextActionType.Header]) {
      switch (textAttributes.value[EditorTextActionType.Header]) {
        case 1:
          selectedFontsizeValue.value = realPxValue ?? '14'
          break
        case 2:
          selectedFontsizeValue.value = realPxValue ?? '10'
          break
      }
    } else {
      selectedFontsizeValue.value = ''
    }
    if (textAttributes.value[EditorTextActionType.Font]) {
      selectedFontFamilyValue.value = textAttributes.value[EditorTextActionType.Font]
    } else if (textAttributes.value[EditorTextActionType.Header]) {
      selectedFontFamilyValue.value = 'OPlusSans3-Bold'
    } else {
      selectedFontFamilyValue.value = ''
    }

    console.log('textAttributes', textAttributes.value)
  },
  {immediate: true, deep: true},
)

const clickItem = (type: EditorTextActionType, value?: any) => {
  if (type === EditorTextActionType.List) {
    let changeValue = ''
    if (!value.includes(textAttributes.value[type]) && textAttributes.value[type] !== value) {
      changeValue = value
    }
    textStore.clickItem(type, changeValue)
  } else {
    textStore.clickItem(type, value !== undefined ? value : !textAttributes.value[type])
  }
}

const clickQuillItem = (type: EditorTextActionType) => {
  if (type === EditorTextActionType.Back) {
    useEditorStore().undoOperationWithType()
  } else if (type === EditorTextActionType.Next) {
    useEditorStore().redoOperationWithType()
  } else if (type === EditorTextActionType.FormatPainter) {
    if (quillActionValue.value?.actionValue && Object.keys(quillActionValue.value.actionValue).length > 0) {
      textStore.clickQuillActionItem(EditorTextActionType.FormatPainterClear)
    } else {
      textStore.clickQuillActionItem(type)
    }
  } else {
    textStore.clickQuillActionItem(type)
  }
}

const selectTextFontsize = (value: any) => {
  console.log('selectTextFontsize', selectedFontsizeValue.value)
  const findItem = textFontSizeNodes.value.find((item) => item.title === value)
  if (findItem) {
    textStore.clickItem(EditorTextActionType.Size, findItem)
  }
}

const toggleFontsizeDropdown = (event: Event) => {
  opPageFontsize.value.toggle(event)
}

const selectFontsizeFromDropdown = (option: string) => {
  selectedFontsizeValue.value = option
  const findItem = textFontSizeNodes.value.find((item) => item.title === option)
  if (findItem) {
    textStore.clickItem(EditorTextActionType.Size, findItem)
  }
  opPageFontsize.value?.hide()
}

const showFontsizeInput = () => {
  fontsizeInputHide.value = false
  selectedInputFontsizeValue.value = selectedFontsizeValue.value
}

const updateFontsizeWithInput = () => {
  console.log('handleSizeChange')
  const findItem = textFontSizeNodes.value.find((item) => item.title === selectedFontsizeValue.value)
  if (findItem) {
    textStore.clickItem(EditorTextActionType.Size, findItem)
  } else {
    const poundNum = Number(selectedFontsizeValue.value)
    if (poundNum > 0) {
      textFontSizeNodes.value.push({
        title: selectedFontsizeValue.value,
        poundNum: poundNum,
        pxNum: dealFontsizePt2Px(poundNum),
      })
      textStore.clickItem(EditorTextActionType.ComponentSize, {
        title: selectedFontsizeValue.value,
        poundNum: poundNum,
        pxNum: dealFontsizePt2Px(poundNum),
      })
      selectedFontsizeValue.value = poundNum.toString()
    }
  }
}

const debounceUpdateFontsizeWithInput = debounce(updateFontsizeWithInput, 300, {trailing: true})

const handleSizeChange = (e: FocusEvent) => {
  debounceUpdateFontsizeWithInput()
  e.preventDefault()
}

const fontsizeInputFocus = () => {
  console.log('fontsizeInputFocus', selectedFontsizeValue.value)
  textStore.setInputFontsizeChange()
}

const selectTextFont = (value: any) => {
  console.log('selectTextFont called with value:', value)
  console.log('selectedFontFamilyValue:', selectedFontFamilyValue.value)
  fontInitWithList([value])
    .then((res) => {})
    .catch((err) => {
      console.error(err)
    })
  console.log('Calling clickItem with Font action and value:', selectedFontFamilyValue.value)
  textStore.clickItem(EditorTextActionType.Font, selectedFontFamilyValue.value)
}

const toggleColorPicker = (event: Event, type: EditorTextActionType) => {
  currentType.value = type
  pickerColor.value = textAttributes.value[type] ?? 'transparent'
  opPageColorPicker.value.toggle(event)
}

function hideColorPicker() {
  opPageColorPicker.value?.hide()
}

function pureColorChange(color: any) {
  if (currentType.value) {
    textStore.clickItem(currentType.value, pickerColor.value)
  }
  hideColorPicker()
  console.log('pureColorChange', color)
}

function textSizeChange(type: 'big' | 'small') {
  if (!selectedFontsizeValue.value) {
    return
  }
  let changeSize = selectedFontsizeValue.value
  let changePoundNum = textFontSizeNodes.value.find((item) => item.title === changeSize)?.poundNum ?? -1
  if (changePoundNum < 0) {
    changePoundNum = Number(changeSize)
  }
  changePoundNum = changePoundNum + (type === 'big' ? 0.5 : -0.5)
  // const fontList = textFontSizeNodes.value as any[]
  // const fontSort = Array.from(new Set(fontList.map((font) => font.poundNum)) as Set<number>).sort((n1: number, n2: number) => n1 - n2)
  // console.log('fontSort', fontSort)
  // const sizeIndex = fontSort.findIndex((fontSize) => fontSize === changePoundNum)
  // if (type === 'big') {
  //   changePoundNum = fontSort[Math.min(sizeIndex + 1, fontSort.length - 1)]
  // } else {
  //   changePoundNum = fontSort[Math.max(sizeIndex - 1, 0)]
  // }
  // changeSize = fontList.find((font) => font.poundNum === changePoundNum)
  textStore.clickItem(EditorTextActionType.Size, {
    title: changePoundNum,
    poundNum: changePoundNum,
    pxNum: dealFontsizePt2Px(changePoundNum),
  })
}

const toggleLineHeightSetting = (event: Event) => {
  selectedFontLineHeightValue.value = textAttributes.value[EditorTextActionType.LineHeight] ?? ''
  opPageLineHeight.value.toggle(event)
}

function onSelectedValue(value: string) {
  selectedFontLineHeightValue.value = value
  clickItem(EditorTextActionType.LineHeight, value)
  opPageLineHeight.value?.hide()
}

const toggleAfterLineHeightSetting = (event: Event) => {
  selectedAfterFontLineHeightValue.value = textAttributes.value[EditorTextActionType.AfterLineHeight] ?? ''
  opPageAfterLineHeight.value.toggle(event)
}

function onAfterLineHeightSelectedValue(value: string) {
  selectedFontLineHeightValue.value = value
  clickItem(EditorTextActionType.AfterLineHeight, value)
  opPageAfterLineHeight.value?.hide()
}

const toggleLetterSpaceSetting = (event: Event) => {
  selectedFontLineHeightValue.value = textAttributes.value[EditorTextActionType.LetterSpacing] ?? ''
  opPageLetterSpace.value.toggle(event)
}

function onLetterSpacingSelectedValue(value: string) {
  selectedFontLineHeightValue.value = value
  clickItem(EditorTextActionType.LetterSpacing, value)
  opPageLetterSpace.value?.hide()
}

const toggleInsertEmojiSetting = (event: Event) => {
  opPageInsertEmoji.value.toggle(event)
}

function onInsertEmojiSelectedValue(value: string) {
  clickItem(EditorTextActionType.InsertEmoji, value)
  opPageInsertEmoji.value?.hide()
}

const toggleFontFitSetting = (event: Event) => {
  opPageFontFit.value.toggle(event)
}

function onFontFitSelectedValue(value: string) {
  opPageFontFit.value?.hide()
}

const togglePageOlSizeSelect = (event: Event, type: string) => {
  opPageOlType.value = type
  opPageOlSizeSelect.value.toggle(event)
}

function onPageOlSizeSelect(value: string) {
  opPageOlSizeSelect.value?.hide()
  console.log('onPageOlSizeSelect', firstTextFormat.value)
  let firstFontSize = (firstTextFormat.value as any)?.size?.replace('px', '') || undefined
  let changValue = opPageOlType.value + '-' + value
  if (firstFontSize) {
    changValue += '-' + firstFontSize
  }
  clickItem(EditorTextActionType.List, changValue)
  opPageOlType.value = ''
}

const toggleComponentAlign = (event: Event) => {
  opPageComponentAlign.value.toggle(event)
}

function onComponentAlignChange(value: string) {
  opPageComponentAlign.value?.hide()
}
</script>

<template>
  <div id="quill_toolbar" class="flex flex-row items-center gap-2 px-3 py-2" @click.stop="null">
    <div class="flex flex-row items-center gap-1 flex-shrink-0">
      <div v-tooltip.bottom="'撤销'" class="text-editor-item-layout" @click="clickQuillItem(EditorTextActionType.Back)">
        <img :src="imageUrl('ic-top-text-design-back')" alt="" class="w-4 h-4" />
      </div>
      <div v-tooltip.bottom="'恢复'" class="text-editor-item-layout" @click="clickQuillItem(EditorTextActionType.Next)">
        <img :src="svgUrl('ic-top-text-design-next')" alt="" class="w-4 h-4" />
      </div>
      <div v-tooltip.bottom="'格式刷'" class="text-editor-item-layout" :class="quillActionValue?.action === EditorTextActionType.FormatPainter && quillActionValue.actionValue ? 'selected' : ''" @click="clickQuillItem(EditorTextActionType.FormatPainter)">
        <img :src="svgUrl('ic-top-text-design-format-painter')" alt="" class="w-4 h-4" />
      </div>
      <div v-tooltip.bottom="'格式清除'" class="text-editor-item-layout" @click="clickQuillItem(EditorTextActionType.FormatRemove)">
        <img :src="svgUrl('ic-top-text-design-format-clear')" alt="" class="w-4 h-4" />
      </div>
    </div>
    <div class="h-8 w-[1px] bg-ppt-line flex-shrink-0"></div>
    <div class="flex flex-row items-center gap-2 flex-shrink-0">
      <Select v-model="selectedFontFamilyValue" :options="textFontNodes" fluid size="small" placeholder="" class="w-28 text-ppt-text-dark border border-ppt-line rounded shadow-sm hover:shadow transition-shadow duration-200" @value-change="selectTextFont">
        <template #value="slotProps">
          <div v-if="slotProps.value" class="text-xs ml-1 w-20 h-full flex items-center">
            <div :style="{'font-family': slotProps.value}">{{ slotProps.value }}</div>
          </div>
        </template>
        <template #option="slotProps">
          <div class="text-sm flex items-center mt-1 ml-1">
            <div :style="{'font-family': slotProps.option}">{{ slotProps.option }}</div>
          </div>
        </template>
        <template #dropdownicon>
          <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3 align" />
        </template>
      </Select>
      <div class="relative w-16 flex-shrink-0">
        <div class="flex items-center">
          <InputText 
            v-model="selectedFontsizeValue" 
            size="small" 
            class="text-xs !w-16 text-ppt-text-dark border border-ppt-line rounded shadow-sm hover:shadow transition-shadow duration-200"
            @keydown.enter="handleSizeChange"
            @blur="handleSizeChange"
            @focus="fontsizeInputFocus"
          />
          <div class="absolute right-0 top-0 h-full flex items-center pr-2 cursor-pointer z-10" @click="toggleFontsizeDropdown">
            <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3" />
          </div>
        </div>
        <Popover ref="opPageFontsize" append-to="body" class="font-size-popover">
          <div class="bg-white border border-ppt-line rounded shadow-lg max-h-60 overflow-y-auto">
            <div 
              v-for="option in textFontSizeOptions" 
              :key="option"
              class="px-3 py-2 text-xs hover:bg-ppt-bg cursor-pointer"
              :class="selectedFontsizeValue === option ? 'bg-ppt-bg' : ''"
              @click="selectFontsizeFromDropdown(option)"
            >
              {{ option }}
            </div>
          </div>
        </Popover>
      </div>
      <img v-tooltip.bottom="'字体变大'" :src="imageUrl('ic-top-fontsize-bigger')" alt="" class="text-editor-item-layout" @click="textSizeChange('big')" />
      <img v-tooltip.bottom="'字体变小'" :src="imageUrl('ic-top-fontsize-smaller')" alt="" class="text-editor-item-layout" @click="textSizeChange('small')" />
    </div>
    
    <div class="flex flex-row items-center gap-1 flex-shrink-0">
      <img v-tooltip.bottom="'加粗'" :src="imageUrl('ic-top-font-bold')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Bold] ? 'selected' : ''" @click="clickItem(EditorTextActionType.Bold)" />
      <img v-tooltip.bottom="'斜体'" :src="imageUrl('ic-top-font-italic')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Italic] ? 'selected' : ''" @click="clickItem(EditorTextActionType.Italic)" />
      <img v-tooltip.bottom="'下划线'" :src="imageUrl('ic-top-font-underline')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Underline] ? 'selected' : ''" @click="clickItem(EditorTextActionType.Underline)" />
      <img v-tooltip.bottom="'删除线'" :src="imageUrl('ic-top-font-strikethrough')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Strikethrough] ? 'selected' : ''" @click="clickItem(EditorTextActionType.Strikethrough)" />
      <img v-tooltip.bottom="'上标'" :src="imageUrl('ic-top-font-superscript')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Script] === 'super' ? 'selected' : ''" @click="clickItem(EditorTextActionType.Script, 'super')" />
      <img v-tooltip.bottom="'下标'" :src="imageUrl('ic-top-font-subscript')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Script] === 'sub' ? 'selected' : ''" @click="clickItem(EditorTextActionType.Script, 'sub')" />
    </div>
    
    <div class="flex flex-row items-center gap-2 flex-shrink-0">
      <div class="flex flex-row items-center">
        <div v-tooltip.bottom="'背景色'" class="flex flex-col items-center w-5 h-5 mr-1">
          <img :src="imageUrl('ic-top-font-bg-color')" alt="" class="w-3 h-3" />
          <div class="h-[2px] w-3 bg-ppt-text-normal mt-[1px]" :style="{background: textAttributes[EditorTextActionType.BackgroundColor] ?? 'black'}"></div>
        </div>
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3 cursor-pointer" @click="toggleColorPicker($event, EditorTextActionType.BackgroundColor)" />
      </div>
      <div class="flex flex-row items-center">
        <div v-tooltip.bottom="'字体颜色'" class="flex flex-col items-center w-5 h-5 mr-1">
          <img :src="imageUrl('ic-top-font-color')" alt="" class="w-3 h-3" />
          <div class="h-[2px] w-3 bg-ppt-text-normal mt-[1px]" :style="{background: textAttributes[EditorTextActionType.Color] ?? 'black'}"></div>
        </div>
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3 cursor-pointer" @click="toggleColorPicker($event, EditorTextActionType.Color)" />
      </div>
      <div class="flex flex-row items-center">
        <div v-tooltip.bottom="'emoji'" class="flex flex-col items-center w-5 h-5 mr-1">
          <img :src="imageUrl('ic-top-text-add-emoji')" alt="" class="w-3.5 h-3.5" />
        </div>
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3 cursor-pointer" @click="toggleInsertEmojiSetting($event)" />
      </div>
    </div>

    <div class="h-8 w-[1px] bg-ppt-line flex-shrink-0"></div>
    <div class="flex flex-row items-center gap-1 flex-shrink-0">
      <img v-tooltip.bottom="'有序列表'" :src="imageUrl('ic-top-text-ll')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.List]?.includes('ordered') ? 'selected' : ''" @click="togglePageOlSizeSelect($event, 'ordered')" />
      <img v-tooltip.bottom="'无序列表'" :src="imageUrl('ic-top-text-ul')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.List]?.includes('bullet') ? 'selected' : ''" @click="togglePageOlSizeSelect($event, 'bullet')" />
      <img v-tooltip.bottom="'缩进'" :src="imageUrl('ic-top-text-reduce-indentation')" alt="" class="text-editor-item-layout" @click="clickItem(EditorTextActionType.Indent, '-1')" />
      <img v-tooltip.bottom="'缩退'" :src="imageUrl('ic-top-text-add-indentation')" alt="" class="text-editor-item-layout" @click="clickItem(EditorTextActionType.Indent, '+1')" />
      <div class="flex flex-row items-center">
        <img v-tooltip.bottom="'字间距'" :src="imageUrl('ic-top-text-line-height')" alt="" class="w-4 h-4 rotate-90" />
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3" @click="toggleLetterSpaceSetting" />
      </div>
      <div class="flex flex-row items-center">
        <img v-tooltip.bottom="'行间距'" :src="imageUrl('ic-top-text-line-height')" alt="" class="w-4 h-4" />
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3" @click="toggleLineHeightSetting" />
      </div>
      <div class="flex flex-row items-center">
        <img v-tooltip.bottom="'段后距'" :src="imageUrl('ic-top-text-after-line-height')" alt="" class="w-3.5 h-3.5" />
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3" @click="toggleAfterLineHeightSetting" />
      </div>
    </div>
    
    <div class="flex flex-row items-center gap-1 flex-shrink-0">
      <img v-tooltip.bottom="'左对齐'" :src="imageUrl('ic-top-text-align-left')" alt="" class="text-editor-item-layout" :class="!textAttributes[EditorTextActionType.Align] || textAttributes[EditorTextActionType.Align] === '' ? 'selected' : ''" @click="clickItem(EditorTextActionType.Align, '')" />
      <img v-tooltip.bottom="'中间对齐'" :src="imageUrl('ic-top-text-align-center')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Align] === 'center' ? 'selected' : ''" @click="clickItem(EditorTextActionType.Align, 'center')" />
      <img v-tooltip.bottom="'右对齐'" :src="imageUrl('ic-top-text-align-right')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Align] === 'right' ? 'selected' : ''" @click="clickItem(EditorTextActionType.Align, 'right')" />
      <img v-tooltip.bottom="'两边对齐'" :src="imageUrl('ic-top-text-align-justify')" alt="" class="text-editor-item-layout" :class="textAttributes[EditorTextActionType.Align] === 'justify' ? 'selected' : ''" @click="clickItem(EditorTextActionType.Align, 'justify')" />
      <img v-tooltip.bottom="'垂直居顶'" :src="imageUrl('ic-top-text-align-left')" alt="" class="text-editor-item-layout rotate-90" :class="!textAttributes[EditorTextActionType.TextVerticalAlign] || textAttributes[EditorTextActionType.TextVerticalAlign] === '' || textAttributes[EditorTextActionType.TextVerticalAlign] === 'top' ? 'selected' : ''" @click="clickItem(EditorTextActionType.TextVerticalAlign, 'top')" />
      <img v-tooltip.bottom="'垂直居中'" :src="imageUrl('ic-top-text-align-center')" alt="" class="text-editor-item-layout rotate-90" :class="textAttributes[EditorTextActionType.TextVerticalAlign] === 'center' ? 'selected' : ''" @click="clickItem(EditorTextActionType.TextVerticalAlign, 'center')" />
      <img v-tooltip.bottom="'垂直居底'" :src="imageUrl('ic-top-text-align-right')" alt="" class="text-editor-item-layout rotate-90" :class="textAttributes[EditorTextActionType.TextVerticalAlign] === 'bottom' ? 'selected' : ''" @click="clickItem(EditorTextActionType.TextVerticalAlign, 'bottom')" />
      <div class="flex flex-row items-center">
        <img v-tooltip.bottom="'字体自适应'" :src="imageUrl('ic-top-font-fit-select')" alt="" class="w-3.5 h-3.5" />
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3" @click="toggleFontFitSetting" />
      </div>
      <div class="flex flex-row items-center">
        <img v-tooltip.bottom="'组件对齐'" :src="imageUrl('ic-top-component-align')" alt="" class="w-4 h-4" />
        <img :src="imageUrl('ic-top-font-select')" alt="" class="w-3 h-3" @click="toggleComponentAlign" />
      </div>
    </div>
  </div>
  <Popover ref="opPageColorPicker">
    <color-picker v-model:pure-color="pickerColor" :format="'hex'" :is-widget="true" use-type="fk" @pure-color-change="pureColorChange" />
  </Popover>
  <Popover ref="opPageLineHeight">
    <text-line-height :current-select-line-height="selectedFontLineHeightValue" @on-selected-value="onSelectedValue" />
  </Popover>

  <Popover ref="opPageAfterLineHeight">
    <text-after-line-height :current-select-line-height="selectedAfterFontLineHeightValue" @on-selected-value="onAfterLineHeightSelectedValue" />
  </Popover>
  <Popover ref="opPageLetterSpace">
    <text-letter-spacing :current-select-line-height="selectedLetterSpacingValue" @on-selected-value="onLetterSpacingSelectedValue" />
  </Popover>
  <Popover ref="opPageInsertEmoji">
    <InertEmoji @on-selected-value="onInsertEmojiSelectedValue" />
  </Popover>
  <Popover ref="opPageFontFit">
    <FontFitSelectView @on-selected-value="onFontFitSelectedValue" />
  </Popover>

  <Popover ref="opPageOlSizeSelect">
    <QuillTextOlSizeSelectView :current="textAttributes[EditorTextActionType.List]" :type="opPageOlType" @on-selected-value="onPageOlSizeSelect" />
  </Popover>

  <Popover ref="opPageComponentAlign">
    <ComponentAlignView @on-selected-value="onComponentAlignChange" />
  </Popover>

  <Popover ref="opPageFontsizeList">
    <ComponentAlignView @on-selected-value="onComponentAlignChange" />
  </Popover>
</template>
<style>
.no-border-input-style {
  border: 0 !important;
  box-shadow: none !important;
  font-size: 0.75rem !important;

  .p-inputtext {
    box-shadow: none;
    border: 0 !important;
    margin-left: 0 !important;
    padding: 0 !important;
    font-size: 0.75rem !important;
  }

  .p-inputtext:disabled {
    background-color: transparent;
  }
}
</style>
<style scoped>
@reference "@/style/tailwind.css";

.text-editor-item-layout {
  @apply w-5 h-5 cursor-pointer rounded hover:bg-ppt-bg-purple/30 transition-all duration-200 flex items-center justify-center;

  &.selected {
    @apply rounded bg-ppt-btn-bg text-ppt-text-purple;
  }
}

.quill-action-class {
  @apply cursor-pointer w-5 h-5 flex items-center justify-center;

  &.selected {
    @apply rounded bg-ppt-btn-bg text-ppt-text-purple;
  }
}
</style>
