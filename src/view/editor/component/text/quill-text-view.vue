<script setup lang="ts">
import {computed, markRaw, nextTick, onMounted, onUnmounted, type PropType, type Ref, ref, watch, getCurrentInstance} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import {cloneDeep, debounce} from 'lodash'
import type {QuillOptions} from 'quill/core/quill'
import {type IComponentInfo} from '@/view/editor/utils/common-modle'
import {actionList, type EditorTextAction, EditorTextActionType, type FontSizeInfoType, useTextEditorStore} from '@/store/textEdiotrSotre'
import {storeToRefs} from 'pinia'
import {initQuillRegister} from '@/view/editor/tool/editor-util'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import {useQuillTextOnFocusStore} from '@/store/useQuillTextOnFocusStore'
import {dealFontsizePt2Px} from '@/lib/font-face-list'
import type {MouseTouchEvent} from '@/view/common/drager/utils'
import {IS_DEV} from '@/lib/util'
import SvgIcon from '@/view/common/svg-icon.vue'

const textRef = ref<HTMLElement | null>()
const quill = ref<Quill | null>(null)
const textStore = useTextEditorStore()
const {curRange, allFontMap, quillActionValue, formatActionValue} = storeToRefs(textStore)
const props = defineProps({
  componentInfo: {type: Object as PropType<IComponentInfo>, required: true},
  lang: {type: String, default: 'cn'},
})
const emit = defineEmits(['focus', 'blur'])
const currentComponent: Ref<IComponentInfo | null> = ref(null)
const quillId = computed(() => {
  return 'quill-editor' + '-' + (props.componentInfo?.id || props.componentInfo?.componentId)
})

const _currentDefaultFontMap = ref<FontSizeInfoType>()

const lastRecordTime = ref(0)
const undoDelay = 1000

const showFormatCursor = ref(false)

// 编辑模式状态：双击进入编辑模式，可以选中文字；点击外部退出编辑模式
const isEditMode = ref(false)

const options: QuillOptions = {
  debug: 'error',
  modules: {
    toolbar: '#quill_toolbar',
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true,
    },
    keyboard: {
      bindings: {
        undo: {
          // 覆盖默认的撤销快捷键
          key: 'z',
          shortKey: true,
          handler: function () {
            // 此处写入自定义撤销逻辑
            console.log('Custom undo triggered')
            // 可选：调用原始撤销逻辑
            // quill.value?.history.undo()
          },
        },
        redo: {
          // 覆盖默认的撤销快捷键
          key: 'y',
          shortKey: true,
          handler: function () {
            // 此处写入自定义撤销逻辑
            console.log('Custom redo triggered')
            // 可选：调用原始撤销逻辑
            // quill.value?.history.undo()
          },
        },
      },
    },
  },
  placeholder: '请输入',
}

const clickRangeIndex = ref(0)

// 保存最后一次有效的选区（length > 0）
const lastValidRange = ref<{index: number, length: number} | null>(null)

const quillStyle = computed(() => {
  let style: any = {width: '100%', height: '100%'}
  if (props.componentInfo.divStyle && props.componentInfo.divStyle.textVerticalAlign) {
    if (props.componentInfo.divStyle.textVerticalAlign === 'center') {
      style['justify-content'] = 'center'
    } else if (props.componentInfo.divStyle.textVerticalAlign === 'bottom') {
      style['justify-content'] = 'end'
    }
  }
  return style
})

watch(
  () => props.componentInfo?.dragStatus,
  (value) => {
    if (value) {
      if (props.componentInfo?.selected) {
        quill.value?.blur()
      }
    }
  },
)

watch(
  () => textStore.inputFontsizeChange,
  (value) => {
    if (value) {
      quill.value?.blur()
    }
  },
)
watch(
  () => props.componentInfo?.resizeStatus,
  (value) => {
    console.log('resizeStatus', value, props.componentInfo?.selected)
    debounceResize()
  },
)

watch(
  () => formatActionValue.value,
  (actionNew: EditorTextAction | undefined) => {
    switch (actionNew?.action) {
      case EditorTextActionType.FormatPainter:
        {
          if (actionNew.actionValue && Object.keys(actionNew.actionValue).length > 0) {
            showFormatCursor.value = true
          }
        }
        break
      case EditorTextActionType.FormatPainterClear:
        {
          showFormatCursor.value = false
        }
        break
      default:
        showFormatCursor.value = false
        break
    }
  },
)

watch(
  () => textStore.quillAction,
  (actionNew: EditorTextAction | undefined) => {
    if (props.componentInfo?.selected && actionNew && actionNew.action) {
      // 执行操作前先启用 Quill
      quill.value?.enable(true)
      console.log('quillActionNew' + props.componentInfo?.componentId, actionNew)
      showFormatCursor.value = false
      switch (actionNew.action) {
        case EditorTextActionType.Back:
          quill.value?.history?.undo()
          break
        case EditorTextActionType.Next:
          quill.value?.history?.redo()
          break
        case EditorTextActionType.FormatPainter: {
          // if (actionNew.actionDone) {
          //   return
          // }
          if (!actionNew.actionValue || Object.keys(actionNew.actionValue).length === 0) {
            // copy format
            if (curRange.value.length > 0) {
              const formats = quill.value?.getFormat(curRange.value.index, curRange.value.length) || {}
              // console.log('formats', formats)
              const fontConfig = _currentDefaultFontMap.value

              if (!formats?.size && fontConfig?.pxSize) {
                formats.size = (fontConfig?.pxSize ? fontConfig.pxSize : 17) + 'px'
              }

              if (!formats?.font && fontConfig?.font) {
                formats.font = fontConfig.font ? fontConfig.font : `'OPlusSans3-Regular', sans-serif`
              }
              if (formats && Object.keys(formats).length > 0) {
                textStore.setQuillAction({
                  action: EditorTextActionType.FormatPainter,
                  actionValue: formats,
                  actionDone: false,
                })
              } else {
                textStore.setQuillAction({
                  action: EditorTextActionType.FormatPainterClear,
                  actionValue: null,
                  actionDone: false,
                })
              }
            }
          } else {
            // format text
            // console.log('formats', actionNew.actionValue)
            // quill.value?.formatText(curRange.value.index, curRange.value.length, actionNew.actionValue, 'user')
            // quill.value?.setSelection(curRange.value.index + curRange.value.length)
            // textStore.setQuillAction({
            //   action: EditorTextActionType.FormatPainter,
            //   actionValue: null,
            //   actionDone: true,
            // })
          }
          break
        }
        case EditorTextActionType.FormatRemove:
          quill.value?.removeFormat(curRange.value.index, curRange.value.length, 'user')
          break
      }
      // 操作完成后，如果不在编辑模式，恢复禁用状态
      if (!isEditMode.value) {
        quill.value?.enable(false)
      }
    }
    debounceSave()
  },
)

watch(
  () => textStore.textAction,
  (actionNew: EditorTextAction | undefined) => {
    showFormatCursor.value = false
    console.log('textAction watch triggered, actionNew:', actionNew, 'selected:', props.componentInfo?.selected, 'isEditMode:', isEditMode.value)
    // 修改条件：在编辑模式下也允许应用格式
    if ((props.componentInfo?.selected || isEditMode.value) && actionNew && actionNew.action) {
      // 执行操作前先启用 Quill
      quill.value?.enable(true)
      console.log('textActionNew' + props.componentInfo?.componentId, actionNew)

      // 获取当前选区：优先从 Quill 直接获取，其次使用 lastValidRange，最后使用 curRange
      let rangeToUse = quill.value?.getSelection()
      if (!rangeToUse || rangeToUse.length === 0) {
        rangeToUse = lastValidRange.value && lastValidRange.value.length > 0
          ? lastValidRange.value
          : (curRange.value && curRange.value.length > 0 ? curRange.value : null)
      }

      if (rangeToUse && rangeToUse.length > 0) {
        quill.value?.setSelection(rangeToUse.index, rangeToUse.length, 'silent')
      }

      if (actionList.indexOf(actionNew.action) === -1) {
        // 行级格式（block format）需要使用 format() 方法
        const blockFormats = [
          EditorTextActionType.Align,
          EditorTextActionType.Indent,
          EditorTextActionType.LineHeight,
        ]
        const isBlockFormat = blockFormats.includes(actionNew.action)

        let formatDelta
        if (isBlockFormat) {
          // 行级格式：先设置选区位置，然后使用 format()
          if (rangeToUse && rangeToUse.length > 0) {
            quill.value?.setSelection(rangeToUse.index, rangeToUse.length, 'silent')
          } else {
            // 没有选区时，选中整个文本
            quill.value?.setSelection(0, quill.value?.getLength(), 'silent')
          }
          formatDelta = quill.value?.format(actionNew.action, actionNew.actionValue, 'user')
        } else if (rangeToUse && rangeToUse.length > 0) {
          // 有选区时，应用到选区
          console.log('Applying format to selection:', actionNew.action, actionNew.actionValue, 'range:', rangeToUse)
          formatDelta = quill.value?.formatText(rangeToUse.index, rangeToUse.length, actionNew.action, actionNew.actionValue, 'user')
          console.log('Format applied, delta:', formatDelta)
          // 验证格式是否应用成功
          const appliedFormat = quill.value?.getFormat(rangeToUse.index, rangeToUse.length)
          console.log('Applied format verification:', appliedFormat)
        } else {
          // 没有选区时，应用到整个文本
          console.log('Applying format to entire text:', actionNew.action, actionNew.actionValue)
          formatDelta = quill.value?.formatText(
            {
              index: 0,
              length: quill.value?.getLength(),
            },
            actionNew.action,
            actionNew.actionValue,
            'user',
          )
          console.log('Format applied to entire text, delta:', formatDelta)
        }
        console.log('rangeToUse', rangeToUse)
        console.log('textActionFormatDelta', formatDelta)
        if ([EditorTextActionType.Color, EditorTextActionType.BackgroundColor].includes(actionNew.action)) {
          if (rangeToUse) {
            quill.value?.setSelection(rangeToUse.index + rangeToUse.length)
          }
        }
        // 字体大小改变时，更新列表项的 class
        if (actionNew.action === EditorTextActionType.Size) {
          console.log('Size changed, calling updateListItemClass')
          nextTick(() => {
            updateListItemClass()
          })
        }
        debounceSave()
      } else if (actionNew.action === EditorTextActionType.ComponentSize) {
        const allTextLength = quill.value?.getLength() || 0
        const formatDelta = quill.value?.formatText(0, allTextLength, EditorTextActionType.Size, actionNew.actionValue, 'user')
        console.log('textActionFormatDelta', formatDelta)
        textStore.textSelectionChange(currentComponent.value?.componentId ?? '', {}, {...getTextVerticalAlign(), ...(quill.value?.getFormat(0, allTextLength) ?? {})}, _currentDefaultFontMap.value)
        nextTick(() => {
          updateListItemClass()
        })
        debounceSave()
      } else if (actionNew.action === EditorTextActionType.TextVerticalAlign) {
        const nowTime = new Date().getTime()
        useEditorTranslationStore().updateCurrentComponentStyle(props.componentInfo?.componentId, configTextVerticalAlign(actionNew.actionValue?.toString()))
        useEditorStore().updateCurrentComponentStyle(props.componentInfo?.componentId, configTextVerticalAlign(actionNew.actionValue?.toString()), nowTime - lastRecordTime.value > undoDelay)
        lastRecordTime.value = nowTime
      } else if (actionNew.action === EditorTextActionType.InsertEmoji) {
        console.log('curRange', curRange.value)
        if (actionNew.actionValue && curRange.value) {
          quill.value?.insertText(curRange.value.index, actionNew.actionValue?.toString(), 'user')
          quill.value?.setSelection(curRange.value.index + 1)
          debounceSave()
        }
      } else if (actionNew.action === EditorTextActionType.List) {
        console.log('realOrderValues', actionNew.actionValue)
        quill.value?.format(actionNew.action, '', 'user')
        const formatDelta = quill.value?.format(actionNew.action, actionNew.actionValue, 'user')
        console.log('formatDelta', formatDelta)
        debounceSave()
      } else if (actionNew.action === EditorTextActionType.AfterLineHeight) {
        if (actionNew.actionValue) {
          // 段后距是行级格式，需要先设置选区
          if (rangeToUse && rangeToUse.length > 0) {
            quill.value?.setSelection(rangeToUse.index, rangeToUse.length, 'silent')
          } else {
            // 没有选区时，选中整个文本
            quill.value?.setSelection(0, quill.value?.getLength(), 'silent')
          }
          let formatDelta = quill.value?.format('ql-after-line-height', actionNew.actionValue, 'user')
          console.log('textActionFormatDelta', formatDelta)
          debounceSave()
        }
      }
      // 操作完成后，如果不在编辑模式，恢复禁用状态
      if (!isEditMode.value) {
        quill.value?.enable(false)
      }
    }
  },
  {deep: true},
)

watch(
  () => props.componentInfo,
  (value) => {
    // console.log('quillUpdate', props.componentInfo.componentId, props.componentInfo?.deltaOps)
    if (textRef.value && quill.value) {
      initQuillOrReset()
      currentComponent.value = cloneDeep(props.componentInfo) as IComponentInfo
      quill.value?.setContents(currentComponent.value?.deltaOps)
      initEvent()
      // if (props.componentInfo?.selected) {
      // quill.value?.focus()
      // if (clickRangeIndex.value) {
      //   console.log('clickRangeIndex', clickRangeIndex.value)
      //   quill.value.setSelection(clickRangeIndex.value)
      // }
      // }
    }
  },
  {immediate: true},
)

watch(
  () => props.componentInfo?.hasChange,
  (value) => {
    if (value) {
      quill.value?.setContents(props.componentInfo?.deltaOps ?? [])
      // debounceSave()
    }
  },
)

watch(
  () => props.componentInfo?.selected,
  (value) => {
    if (!value) {
      textStore.removeTextSelection(props.componentInfo?.componentId ?? '')
      // 组件取消选中时退出编辑模式
      if (isEditMode.value) {
        exitEditMode()
      }
    }
  },
)

onMounted(() => {
  // console.log('quillonMounted', props.componentInfo.componentId, props.componentInfo?.textOverflow)
  configCurrentFontMap()
  nextTick(() => {
    initQuill()
  })
})

function initQuill() {
  if (textRef.value) {
    initQuillOrReset()
    currentComponent.value = cloneDeep(props.componentInfo) as IComponentInfo
    // console.log('componentInfo', props.componentInfo)
    quill.value?.setContents(currentComponent.value?.deltaOps)
    // 不再自动聚焦，需要双击进入编辑模式
    quill.value?.history.clear()
    // console.log('onMountedQuill', quill.value.getContents())
    initEvent()
    debounceSave()
  }
}

const initQuillOrReset = () => {
  initQuillRegister()
  configCurrentFontMap()
  if (textRef.value) {
    const quillContainer = textRef.value as HTMLElement
    quill.value = null
    quill.value = markRaw(new Quill(textRef.value, options))
    // 默认禁用 Quill 编辑，双击进入编辑模式后才启用
    quill.value?.enable(false)
    quill.value.keyboard.addBinding({
      key: 'Delete',
      shortKey: null,
      handler: function (range, context) {},
    })
    // quill.value.keyboard.addBinding({key: ['z', 'Control'], shortKey: true}, (range: any) => {
    //   console.log('ctrl+z', range)
    // })
    const quillEditor = quillContainer.querySelector('.ql-editor') as HTMLElement
    if (quillEditor && _currentDefaultFontMap.value) {
      const fontConfig = _currentDefaultFontMap.value
      if (fontConfig) {
        quillEditor['style'].fontSize = (fontConfig.pxSize ? fontConfig.pxSize : 29) + 'px'
        quillEditor['style'].fontFamily = fontConfig.font ? fontConfig.font : `'OPlusSans3-Regular', sans-serif`
        // if (fontConfig.type.includes('标题')) {
        //   quillEditor['style'].fontWeight = 'bold'
        // }
      }
    }
  }
}

const debounceSave = debounce(saveCurComponent, 500, {trailing: true})

const debounceResize = debounce(
  () => {
    const textOverFlow = computeTextOverflowInQuill()
    useEditorTranslationStore().updateCurrentTextOverflowState(props.componentInfo?.componentId, textOverFlow)
    useEditorStore().updateCurrentTextOverflowState(props.componentInfo?.componentId, textOverFlow)
  },
  500,
  {trailing: true},
)

const configCurrentFontMap = () => {
  // console.log('props.componentInfo.lang', props.componentInfo.lang + props.componentInfo.textType)
  _currentDefaultFontMap.value = allFontMap.value[props.componentInfo.lang ?? props.lang]?.[props.componentInfo.textType ?? 'Yaber正文'] ?? {
    type: 'Yaber正文',
    lang: '中文',
    size: 7,
    font: 'OPlusSans3-Regular',
    pxSize: dealFontsizePt2Px(7),
  }
  // console.log('lang', props.componentInfo.lang)
  // console.log('configCurrentFontMap', _currentDefaultFontMap.value)
}

function saveCurComponent() {
  // console.log('saveQuill')
  const textOverflow = computeTextOverflowInQuill()
  const nowTime = new Date().getTime()
  useEditorTranslationStore().updateCurrentComponentText(props.componentInfo?.componentId, quill.value?.getContents()?.ops ?? [], quill.value?.getText() || '', quill.value?.getSemanticHTML() ?? '', textOverflow)
  useEditorStore().updateCurrentComponentText(props.componentInfo?.componentId, quill.value?.getContents()?.ops ?? [], quill.value?.getText() || '', quill.value?.getSemanticHTML() ?? '', true, textOverflow)
  lastRecordTime.value = nowTime
}

function computeTextOverflowInQuill() {
  const container = (textRef.value as HTMLElement)?.firstElementChild as HTMLElement
  if (!container) {
    // console.log('computeTextOverflowInQuill', 0)
    return false
  }

  const difference = container.scrollHeight - container.clientHeight
  // console.log('computeTextOverflowInQuill', difference)
  return difference > 10
}

function onTextChange(delta: any, oldDelta: any, source: string) {
  // if (source == 'api') {
  // console.log('An API call triggered this change.', delta, oldDelta);
  // } else if (source == 'user') {
  // console.log('A user action triggered this change.', delta, oldDelta);
  // }
  // console.log('text-change', source, delta, oldDelta)
  // currentComponent.value?.text = quill.value?.getText()
  // currentComponent.value?.deltaOps = quill.value?.getContents().ops
  const range = quill.value?.getSelection()
  if (range) {
    const leafText = (quill.value?.getLeaf(range.index)?.[0] as any)?.text
    let firstTextFormat: Record<string, any> = {}
    firstTextFormat = quill.value?.getFormat(range.index, 1) || {}
    if (!firstTextFormat.size) {
      const fontConfig = _currentDefaultFontMap.value
      if (fontConfig?.pxSize) {
        firstTextFormat.size = (fontConfig?.pxSize ? fontConfig.pxSize : 17) + 'px'
      }

      if (!firstTextFormat?.font && fontConfig?.font) {
        firstTextFormat.font = fontConfig.font ? fontConfig.font : `'OPlusSans3-Regular', sans-serif`
      }
    }
    console.log('firstTextFormat', firstTextFormat)
    useQuillTextOnFocusStore().setOnFocusState(
      {componentId: props.componentInfo.componentId},
      {
        formats: quill.value?.getFormat(range.index, range.length) ?? {},
        range,
        leafText,
        firstTextFormat,
      },
    )
    textStore.textSelectionChange(currentComponent.value?.componentId ?? '', range, {...getTextVerticalAlign(), ...(quill.value?.getFormat(range.index, range.length) ?? {})}, _currentDefaultFontMap.value)
  }
  debounceSave()
}

function onSelectionChange(range: any, oldRange: any, source: string) {
  if (range) {
    // 如果有选中文字，保存为最后有效选区
    if (range.length > 0) {
      lastValidRange.value = {index: range.index, length: range.length}
    }

    if (IS_DEV) {
      if (range.length == 0) {
        console.log('User cursor is on', range.index)
      } else {
        const text = quill.value?.getText(range.index, range.length)
        console.log('User has highlighted', text)
      }
    }

    const leafText = (quill.value?.getLeaf(range.index)?.[0] as any)?.text
    console.log('leafText', quill.value?.getText(range.index, range.length), quill.value?.getLeaf(range.index))
    let firstTextFormat: Record<string, any> = {}
    firstTextFormat = quill.value?.getFormat(range.index, 1) || {}
    if (!firstTextFormat.size) {
      const fontConfig = _currentDefaultFontMap.value
      if (fontConfig?.pxSize) {
        firstTextFormat.size = (fontConfig?.pxSize ? fontConfig.pxSize : 17) + 'px'
      }

      if (!firstTextFormat?.font && fontConfig?.font) {
        firstTextFormat.font = fontConfig.font ? fontConfig.font : `'OPlusSans3-Regular', sans-serif`
      }
    }
    console.log('firstTextFormat', firstTextFormat)
    useQuillTextOnFocusStore().setOnFocusState(
      {componentId: props.componentInfo.componentId},
      {
        formats: quill.value?.getFormat(range.index, range.length) ?? {},
        range,
        leafText,
        firstTextFormat,
      },
    )
    clickRangeIndex.value = range.index
    textStore.textSelectionChange(currentComponent.value?.componentId ?? '', range, {...getTextVerticalAlign(), ...(quill.value?.getFormat(range.index, range.length) ?? {})}, _currentDefaultFontMap.value)
    if (range.index >= 0 && range.length > 0 && showFormatCursor.value && formatActionValue.value?.actionValue) {
      debounceFormatText(range)
    }
  } else {
    // 选区丢失时（如点击工具栏），保存之前的选区
    if (oldRange && oldRange.length > 0) {
      lastValidRange.value = {index: oldRange.index, length: oldRange.length}
      textStore.textSelectionChange(currentComponent.value?.componentId ?? '', oldRange, {...getTextVerticalAlign(), ...(quill.value?.getFormat(oldRange.index, oldRange.length) ?? {})}, _currentDefaultFontMap.value)
    }
    useQuillTextOnFocusStore().clearOnFocusState({componentId: props.componentInfo.componentId})
    console.log('Cursor not in the editor', range)
  }
}

const debounceFormatText = debounce(
  (range: any) => {
    // console.log('showFormatCursor', range)
    // console.log('showFormatCursor', formatActionValue.value)
    if (formatActionValue.value) {
      quill.value?.formatText(range.index, range.length, formatActionValue.value?.actionValue, 'user')
      quill.value?.setSelection(range.index + range.length)
      textStore.setQuillAction({
        action: EditorTextActionType.FormatPainterClear,
        actionValue: null,
        actionDone: true,
      })
    }
  },
  1000,
  {trailing: true},
)

const getTextVerticalAlign = () => {
  let style: any = {textVerticalAlign: null}
  if (props.componentInfo.divStyle && props.componentInfo.divStyle.textVerticalAlign) {
    if (props.componentInfo.divStyle.textVerticalAlign === 'center') {
      style.textVerticalAlign = 'center'
    } else if (props.componentInfo.divStyle.textVerticalAlign === 'bottom') {
      style.textVerticalAlign = 'end'
    }
  }

  return style
}

const configTextVerticalAlign = (value: any) => {
  let style: any = {textVerticalAlign: value}
  if (props.componentInfo.divStyle) {
    style = {...props.componentInfo.divStyle, ...style}
  }

  return style
}

// 更新列表项的格式，使序号字体大小跟随文字变化
function updateListItemClass() {
  if (!quill.value) return

  const length = quill.value.getLength()
  let index = 0

  // 遍历所有行
  while (index < length) {
    const [line] = quill.value.getLine(index)
    if (!line) break

    const lineLength = line.length()
    const format = quill.value.getFormat(index, 1)

    // 检查是否是列表行
    if (format.list) {
      const listValue = format.list as string
      const parts = listValue.split('-')

      let listType: string
      let spacing: string

      if (parts[0] === 'bullet') {
        listType = 'bullet'
        spacing = parts[1] || '1'
      } else if (parts[1] === 'circle' || parts[1] === 'parentheses') {
        listType = `ordered-${parts[1]}`
        spacing = parts[2] || '1'
      } else {
        listType = 'ordered'
        spacing = parts[1] || '1'
      }

      // 获取该行文字的字体大小
      let fontSize = 17
      if (format.size) {
        const match = (format.size as string).match(/(\d+)/)
        if (match) {
          fontSize = parseInt(match[1])
        }
      }

      // 构建新的列表格式值
      const newListValue = `${listType}-${spacing}-${fontSize}`

      // 如果格式值有变化，更新它
      if (newListValue !== listValue) {
        console.log('updateListItemClass: changing from', listValue, 'to', newListValue)
        // 先清除列表格式，再重新设置，强制 Quill 重新创建列表项
        quill.value.formatLine(index, 1, 'list', false, 'api')
        quill.value.formatLine(index, 1, 'list', newListValue, 'api')
      }
    }

    index += lineLength
  }
}

const quillMousedown = (event: MouseTouchEvent) => {
  console.log('quillMousedown', event)
  // 不再阻止事件冒泡，让 Drager 能够接收 mousedown 事件进行拖拽
}

function initEvent() {
  quill.value?.on('text-change', onTextChange)
  quill.value?.on('selection-change', onSelectionChange)
  const qlEditorElements = document.getElementById(quillId.value)?.getElementsByClassName('ql-editor')
  // console.log('initEvent', qlEditorElements)
  ;(qlEditorElements?.[0] as HTMLElement)?.addEventListener('mousedown', quillMousedown)
  // 注意：这是最终兜底方案，可能干扰Quill的正常操作
  quill.value?.root.addEventListener(
    'keydown',
    function (event) {
      if (event.keyCode === 32 || event.key === ' ') {
        // 注意：此处不能直接使用quill.insertText，会破坏undo栈
        quill.value?.insertText(curRange.value.index, ' ', 'user')
        quill.value?.setSelection(curRange.value.index + 1)
        event.preventDefault() // 如果阻止默认行为，需非常小心
      }
    },
    true,
  )
}

const quillBlur = () => {
  useQuillTextOnFocusStore().clearOnFocusState({componentId: props.componentInfo.componentId})
  console.log('quillBlur')
}

// 进入编辑模式
const enterEditMode = (e?: MouseEvent) => {
  isEditMode.value = true
  // 启用 Quill 编辑
  quill.value?.enable(true)
  nextTick(() => {
    quill.value?.focus()
    // 如果有点击事件，根据点击位置设置光标
    if (e) {
      const selection = document.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const index = quill.value?.getIndex(range.startContainer as any)
        if (index !== undefined && index >= 0) {
          quill.value?.setSelection(index + range.startOffset, 0)
        }
      }
    }
    // 监听点击外部区域退出编辑模式
    document.addEventListener('mousedown', handleClickOutside)
  })
}

// 退出编辑模式
const exitEditMode = () => {
  isEditMode.value = false
  quill.value?.blur()
  // 禁用 Quill 编辑
  quill.value?.enable(false)
  document.removeEventListener('mousedown', handleClickOutside)
}

// 点击外部区域处理
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  // 检查点击是否在当前文本组件内
  if (textRef.value && !textRef.value.contains(target)) {
    // 检查是否点击了工具栏区域，如果是则不退出编辑模式
    const toolbar = document.getElementById('quill_toolbar')
    const popover = document.querySelector('.p-popover')
    if (toolbar?.contains(target) || popover?.contains(target)) {
      return
    }
    exitEditMode()
  }
}

const clickText = (e: MouseEvent) => {
  // 双击进入编辑模式
  enterEditMode(e)
  if (quill.value?.hasFocus()) {
    // if (currentComponent.value?.componentId !== props.componentInfo?.componentId) {
    //   const range = quill.value?.getSelection()
    //   const index = range?.index || 0
    //   if (index > 0) {
    //     quill.value?.setSelection(index)
    //   }
    // }
    const range = quill.value?.getSelection() ?? {index: 0, length: 0}
    // const index = range?.index || 0
    // if (index > 0) {
    //   quill.value?.setSelection(index)
    // }
    const leafText = (quill.value?.getLeaf(range.index)?.[0] as any)?.text
    let firstTextFormat: Record<string, any> = {}
    firstTextFormat = quill.value?.getFormat(range.index, 1) || {}
    if (!firstTextFormat.size) {
      const fontConfig = _currentDefaultFontMap.value
      if (fontConfig?.pxSize) {
        firstTextFormat.size = (fontConfig?.pxSize ? fontConfig.pxSize : 17) + 'px'
      }

      if (!firstTextFormat?.font && fontConfig?.font) {
        firstTextFormat.font = fontConfig.font ? fontConfig.font : `'OPlusSans3-Regular', sans-serif`
      }
    }
    useQuillTextOnFocusStore().setOnFocusState(
      {componentId: props.componentInfo.componentId},
      {
        formats: quill.value?.getFormat(range.index, range.length) ?? {},
        range,
        leafText,
        firstTextFormat,
      },
    )
  } else {
    quillBlur()
  }
  emit('focus', {componentId: props.componentInfo?.componentId})
}

onUnmounted(() => {
  quill.value?.off('text-change', onTextChange)
  quill.value?.off('selection-change', onSelectionChange)
  console.log('onUnmountedQuill')
  ;(document.getElementById(quillId.value)?.getElementsByClassName('ql-editor')?.[0] as HTMLElement)?.removeEventListener('mousedown', quillMousedown)
  // 清理编辑模式的事件监听
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div :id="quillId" ref="textRef" :style="quillStyle" class="w-full flex h-full flex-col text-black overflow-auto text-base" :class="[showFormatCursor ? 'custom-cursor-format-painter' : '', isEditMode ? 'edit-mode' : '']" @dblclick.stop="clickText($event)"></div>
  <div v-if="props.componentInfo?.textOverflow" class="absolute top-0.5 right-0.5">
    <svg-icon name="ic-quill-text-overflow" :custom-width="2" />
  </div>
  <!--    <input :value="component.text" @click.stop @mousedown.stop/>-->
</template>
<style lang="less">
@import 'quill-common-style.css';

.custom-cursor-format-painter {
  p {
    cursor: url('../../assets/ic-format-swipe-the-cursor-1.svg'), text !important;
  }

  ol {
    cursor: url('../../assets/ic-format-swipe-the-cursor-1.svg'), text !important;
  }

  ul {
    cursor: url('../../assets/ic-format-swipe-the-cursor-1.svg'), text !important;
  }
}

// 编辑模式下显示文本光标
.edit-mode {
  cursor: text !important;

  * {
    cursor: text !important;
  }
}
</style>
// .ql-editor br { // content: ''; /* Optional pseudo-element */ // display: block; // font-size: 58px; // margin-top: 10px; /* Add space after
<!--<br />-->
