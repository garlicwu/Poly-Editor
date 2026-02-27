import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {dealFontsizePt2Px} from '@/lib/font-face-list'
import langFontListConfig from '@/assets/config/lang-font-list.json'
import {cloneDeep} from 'lodash'

export interface EditorTextAction {
  action: EditorTextActionType
  actionValue: number | string | boolean | Record<string, any> | null
  actionDone?: boolean
}

export enum EditorTextActionType {
  Back = 'back',
  Next = 'next',
  FormatPainter = 'formatPainter',
  FormatPainterClear = 'formatPainterClear',
  FormatPainterSwipe = 'formatPainterSwipe',
  FormatRemove = 'formatRemove',
  Size = 'size',
  ComponentSize = 'componentSize',
  Bold = 'bold',
  Font = 'font',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strike',
  Color = 'color',
  BackgroundColor = 'background',
  Header = 'header',
  Indent = 'indent',
  List = 'list',
  // CodeBlock = 'code-block',
  Script = 'script',
  LineHeight = 'line-height',
  AfterLineHeight = 'after-line-height',
  LetterSpacing = 'letter-spacing',
  InsertEmoji = 'insertEmoji',
  Align = 'align',
  Direction = 'direction',
  TextVerticalAlign = 'textVerticalAlign',
}

export const actionList = [
  EditorTextActionType.List,
  EditorTextActionType.Back,
  EditorTextActionType.Next,
  EditorTextActionType.FormatRemove,
  EditorTextActionType.FormatPainter,
  EditorTextActionType.TextVerticalAlign,
  EditorTextActionType.InsertEmoji,
  EditorTextActionType.ComponentSize,
  EditorTextActionType.AfterLineHeight,
]

export const defaultEditorTextActionType: Record<EditorTextActionType, any> = {
  back: undefined,
  bold: undefined,
  font: undefined,
  formatRemove: undefined,
  formatPainter: undefined,
  italic: undefined,
  next: undefined,
  size: undefined,
  underline: undefined,
  header: undefined,
  background: undefined,
  color: undefined,
  align: undefined,
  script: undefined,
  list: undefined,
  'line-height': undefined,
  'letter-spacing': undefined,
  indent: undefined,
  direction: undefined,
  textVerticalAlign: undefined,
  insertEmoji: undefined,
} as Record<EditorTextActionType, any>

export interface FontSizeInfoType {
  type: string
  size: number
  font: string
  lang: string
  pxSize: number
}

export const useTextEditorStore = defineStore('text-editor', () => {
  // { index: number, length: number }
  const curRange = ref<Record<any, any>>({index: 0, length: 0})

  const _textAttributes = ref<Record<EditorTextActionType, any>>(defaultEditorTextActionType)
  const textAttributes = computed(() => _textAttributes.value)

  // const _fontConfigList = ref<FontSizeInfoType[]>([])
  // const fontConfigList = computed(() => _fontConfigList.value)

  const _AllFontMap = ref<Record<string, Record<string, FontSizeInfoType>>>({})
  const allFontMap = computed(() => _AllFontMap.value)

  const _currentFontMap = ref<FontSizeInfoType>()
  const currentFontMap = computed(() => _currentFontMap.value)

  const textAction = ref<EditorTextAction>()
  const quillAction = ref<EditorTextAction>()
  const quillActionValue = computed(() => quillAction.value)

  const formatActionValue = ref<EditorTextAction>()

  const componentIdList = ref<any>({})

  const inputFontsizeChange = ref(0)

  function removeTextSelection(componentId: string | number) {
    if (Object.prototype.hasOwnProperty.call(componentIdList.value, componentId)) {
      delete componentIdList.value[componentId]
    }
  }

  function textSelectionChange(componentId: string | number, range: Record<string, any>, formats: Record<string, unknown>, currentFontMapCopy?: FontSizeInfoType) {
    curRange.value = range
    componentIdList.value[componentId] = {
      range,
      formats,
    }
    _textAttributes.value = cloneDeep(defaultEditorTextActionType)
    _currentFontMap.value = currentFontMapCopy
    Object.keys(formats).forEach((key: any) => {
      // const indexOfS = Object.values(EditorTextActionType).indexOf(key as unknown as EditorTextActionType)
      // console.log('textActionKey', Object.keys(EditorTextActionType)[indexOfS])
      _textAttributes.value[key as unknown as EditorTextActionType] = formats[key]
    })

    // console.log('formats', formats)
    if (currentFontMapCopy) {
      if (!_textAttributes.value[EditorTextActionType.Size]) {
        _textAttributes.value[EditorTextActionType.Size] = currentFontMapCopy.pxSize + 'px'
      }
      // if (!_textAttributes.value[EditorTextActionType.Bold] && currentFontMapCopy.type.includes('标题')) {
      //   _textAttributes.value[EditorTextActionType.Bold] = 'bold'
      // }
      if (!_textAttributes.value[EditorTextActionType.Font]) {
        _textAttributes.value[EditorTextActionType.Font] = currentFontMapCopy.font
      }
    }

    console.log('_textAttributes1', componentId, _textAttributes.value)
    // console.log('_currentFontMap', currentFontMapCopy)
  }

  function setQuillAction(value: EditorTextAction) {
    quillAction.value = value
    if (value.action === EditorTextActionType.FormatPainter) {
      formatActionValue.value = value
    } else if (value.action === EditorTextActionType.FormatPainterClear) {
      formatActionValue.value = value
    }
  }

  const clickItem = (type: EditorTextActionType, value: string | number | any) => {
    console.log('_textAttributes0', _textAttributes.value)
    if (type === EditorTextActionType.Size) {
      textAction.value = {action: type, actionValue: value.pxNum + 'px'}
      _textAttributes.value[type] = value.pxNum
      return
    }
    _textAttributes.value[type] = value
    if (type === EditorTextActionType.ComponentSize) {
      textAction.value = {action: type, actionValue: value.pxNum + 'px'}
      return
    }

    textAction.value = {action: type, actionValue: value}
  }

  const clickQuillActionItem = (type: EditorTextActionType) => {
    quillAction.value = {action: type, actionValue: quillAction.value?.actionValue ?? {}}
  }

  const configFontConfigList = () => {
    return new Promise((resolve) => {
      // 从本地配置文件加载
      _AllFontMap.value = langFontListConfig as Record<string, Record<string, FontSizeInfoType>>
      console.log('从本地配置加载字体列表')
      resolve(null)
    })
  }

  const resetAllFontMap = () => {
    Object.keys(allFontMap.value).forEach((key) => {
      const fontMap = _AllFontMap.value[key]
      Object.keys(fontMap).forEach((key) => {
        fontMap[key] = {...fontMap[key], pxSize: dealFontsizePt2Px(fontMap[key].size)}
      })
    })
  }

  function setInputFontsizeChange() {
    inputFontsizeChange.value++
  }

  return {
    clickItem,
    textSelectionChange,
    textAction,
    quillAction,
    textAttributes,
    curRange,
    configFontConfigList,
    quillActionValue,
    allFontMap,
    currentFontMap,
    setQuillAction,
    clickQuillActionItem,
    resetAllFontMap,
    formatActionValue,
    componentIdList,
    removeTextSelection,
    setInputFontsizeChange,
    inputFontsizeChange,
  }
})
