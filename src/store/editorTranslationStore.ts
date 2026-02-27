import {defineStore} from 'pinia'
import {computed, reactive, ref} from 'vue'
import {type PanzoomOptions} from 'simple-panzoom'
import {EditorComponent} from '@/view/editor/component/editorComponentInit'
import {loaderComponent} from '@/view/editor/tool/editor-util'
import {
  Combine_Lang,
  EComponentType,
  EDirectoryType,
  EFooterTypeType,
  EPageType,
  type IComponentAddTypeItem,
  type IComponentInfo,
  type IEditorInfo,
  type IEditorPageInfo,
  type IPageSize,
  type ISelectLanguage,
} from '@/view/editor/utils/common-modle'
import {cloneDeep} from 'lodash'
import {LStorage, StorageKey} from '@/lib/storage'
import {type SketchRulerProps} from '@/view/common/sketch-ruler/index-types'
import {fontInitWithList} from '@/lib/util'
import {computeTextOverflow, configTextComponentAutoResize} from '@/view/editor/utils/quill-text-auto-resize-util'
import {type FontSizeInfoType, useTextEditorStore} from '@/store/textEdiotrSotre'
import {dealFontsizePt2Px} from '@/lib/font-face-list'
import {defaultSketchRulerWidth} from '@/store/editorStore'

export const useEditorTranslationStore = defineStore('editorTranslation', () => {
  // 多语言翻译主体 list
  const _multilingualTranslationList = ref<IEditorInfo[]>([])

  // 当前展示的编译主体
  const _editorTranslationInfo = ref<IEditorInfo>({projectId: '', description: '', id: '', name: '', pageList: []})

  // 当前页面的主体
  const _currentTranslationPage = ref<IEditorPageInfo>({id: '', pageId: '', componentList: []})

  // 选中组件主题
  const _currentTranslationComponent = ref<IComponentInfo>()

  // 当前页面内所有组件 list
  const currentTranslationComponentList = computed<IComponentInfo[]>(() => _currentTranslationPage.value?.componentList || [])

  const editorTranslationInfo = computed<IEditorInfo>(() => _editorTranslationInfo.value)

  const currentTranslationPage = computed<IEditorPageInfo>(() => _currentTranslationPage.value as IEditorPageInfo)

  const multilingualTranslationList = computed<IEditorInfo[]>(() => _multilingualTranslationList.value)

  const pageTranslationList = computed<IEditorPageInfo[]>(() => _editorTranslationInfo.value.pageList)

  const showTranslationSetting = computed(() => {
    return _editorTranslationInfo.value.pageList.length > 0
  })

  const autoTextResize = ref(0)

  const editorLang = computed(() => _editorTranslationInfo.value.translationType ?? 'en')
  const refreshState = ref(0)
  const scaleByUser = ref(0)

  // 多语种
  const allLanguageList = ref<ISelectLanguage[]>([])
  const selectLanguageList = ref<string[]>([])
  // 已翻译语言列表
  const translatedLanguageList = ref<ISelectLanguage[]>([])

  // 选中的翻译语言，单翻译模式
  const selectedTranslatedLang = ref('')

  const mainChangeBeforeTranslate = ref(false)
  const currentPageIndex = ref(1)
  const canPageDown = computed(() => {
    return (
      translatedLanguageList.value.length > 0 &&
      !(translatedLanguageList.value[translatedLanguageList.value.length - 1]?.code === _editorTranslationInfo.value.translationType && currentPageIndex.value === _editorTranslationInfo.value.pageList.length - 1)
    )
  })
  const canPageUp = computed(() => {
    return translatedLanguageList.value.length > 0 && !(translatedLanguageList.value[0]?.code === _editorTranslationInfo.value.translationType && currentPageIndex.value === 0)
  })

  const translateDoneNextSelectPage = ref<number>(0)

  const currentTranslationComponent = computed({
    get: () => _currentTranslationComponent.value,
    set: (val) => {
      _currentTranslationComponent.value = val
    },
  })

  // 多翻译下，单例语言翻译，方便对照
  const isSingleTranslation = computed(() => translatedLanguageList.value.length > 0)
  const noPageAction = computed(() => translatedLanguageList.value.some((item) => item.selected))

  function setMultilingualTranslationList(list: Record<string, any>[]) {
    clearEditorInfo()
    _multilingualTranslationList.value = list as IEditorInfo[]
    console.log('_multilingualTranslationList', _multilingualTranslationList.value)
    _multilingualTranslationList.value.forEach((transalte) => {
      transalte.pageList.forEach((page) => {
        page.componentList.forEach(async (component) => {
          component.top = Number(component.top.toFixed(4))
          component.width = Number(component.width.toFixed(4))
          component.height = Number(component.height.toFixed(4))
          component.left = Number(component.left.toFixed(4))
          component.lang = transalte.translationType
          if (component.componentType === EComponentType.Text) {
            if (!component.zindex) {
              component.zindex = 2
            }
            const fontMap = useTextEditorStore().allFontMap[component.lang ?? transalte.translationType ?? 'en']?.[component.textType ?? 'Yaber正文'] ?? {
              type: 'Yaber正文',
              lang: '英文',
              size: 7,
              font: 'OPlusSans3-Regular',
              pxSize: dealFontsizePt2Px(7),
            }
            component.fontName = fontMap.font
            component.fontSize = fontMap.pxSize
            // const changeData: any = await configTextComponentAutoResize(component, transalte.fontList ?? [], page.lang ?? 'en')
            // if (changeData.change) {
            //   transalte.hasChange = true
            //   component.hasChange = (component.hasChange ?? 0) + 1
            //   console.log('autoSizeChange', component.text)
            //   autoTextResize.value++
            // }
          }
        })
      })
    })
    initMultilingualTranslationList(_multilingualTranslationList.value)

    // if (_multilingualTranslationList.value.length > 0) {
    //   setEditorInfo(_multilingualTranslationList.value[0])
    // }
  }

  function setEditorInfo(info: Record<string, any>, currentPage: number = 0, justEn: boolean = false) {
    _editorTranslationInfo.value = cloneDeep(info as IEditorInfo)
    // if (allLanguageList.value.length > 0 && _editorTranslationInfo.value.translationType) {
    //   allLanguageList.value.forEach((item) => {
    //     item.selected = _editorTranslationInfo.value.translationType === item.code
    //   })
    // }
    // if (_editorTranslationInfo.value.directoryType === EDirectoryType.Auto && _editorTranslationInfo.value.translationType === Combine_Lang) {
    //   if (_editorTranslationInfo.value.translationType === Combine_Lang && editorTranslationInfo.value.pageList.length > 0) {
    //     const topPageList = updateCombineDirectory(editorTranslationInfo.value.pageList, _editorTranslationInfo.value.translationType, _editorTranslationInfo.value.id, useTextEditorStore().allFontMap)
    //     resetPageList(topPageList)
    //   }
    // } else {
    //   configAllPageFooter()
    // }
    if (_editorTranslationInfo.value.translationType === Combine_Lang) {
      configAllPageFooter()
    }
    _editorTranslationInfo.value.pageList.forEach((page) => {
      page.componentList.forEach(async (component) => {
        component.top = Number(component.top.toFixed(4))
        component.width = Number(component.width.toFixed(4))
        component.height = Number(component.height.toFixed(4))
        component.left = Number(component.left.toFixed(4))
        if (!component.lang || component.lang === '') {
          component.lang = page.lang ?? editorLang.value
        }
        if (!component.zindex) {
          component.zindex = 2
        }
        const fontMap = useTextEditorStore().allFontMap[component.lang ?? _editorTranslationInfo.value.translationType ?? 'en']?.[component.textType ?? 'Yaber正文'] ?? {
          type: 'Yaber正文',
          lang: '英文',
          size: 7,
          font: 'OPlusSans3-Regular',
          pxSize: dealFontsizePt2Px(7),
        }
        component.fontName = fontMap.font
        component.fontSize = fontMap.pxSize
        // const changeData: any = await configTextComponentAutoResize(component, _editorTranslationInfo.value.fontList ?? [], page.lang ?? 'en')
        // if (changeData.change) {
        //   _editorTranslationInfo.value.hasChange = true
        //   component.hasChange = (component.hasChange ?? 0) + 1
        //   console.log('autoSizeChange', component.deltaOps)
        //   autoTextResize.value++
        // }
      })
    })
    if (_editorTranslationInfo.value.pageList?.length > 0) {
      selectCurrentPage(currentPage)
    }

    console.log('_editorTranslationInfo', _editorTranslationInfo.value)
    if (justEn) {
      autoSave()
    }
  }

  async function resizeAutoText() {
    if (editorLang.value === 'cn') {
      return ''
    }
    try {
      autoTextResize.value = 0
      const lastPage = _editorTranslationInfo.value.pageList[_editorTranslationInfo.value.pageList.length - 1]
      let lastComponentId: string = ''
      if (lastPage && lastPage.componentList.length > 0) {
        lastComponentId = lastPage.componentList[lastPage.componentList.length - 1].componentId?.toString() || ''
      }
      const fontList = cloneDeep(_editorTranslationInfo.value.fontList as string[])
      for (const page of _editorTranslationInfo.value.pageList) {
        for (const component of page.componentList) {
          const doneComponentId = await resizeAutoTextSingle(component, fontList, page.lang, page.pageId.toString())
          if (doneComponentId === lastComponentId) {
            return doneComponentId
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function resizeAutoSingleLangPageText() {
    if (editorLang.value === 'cn') {
      return ''
    }
    try {
      autoTextResize.value = 0
      const lastPage = _editorTranslationInfo.value.pageList[_editorTranslationInfo.value.pageList.length - 1]
      let lastComponentId: string = ''
      if (lastPage && lastPage.componentList.length > 0) {
        lastComponentId = lastPage.componentList[lastPage.componentList.length - 1].componentId?.toString() || ''
      }
      const fontList = cloneDeep(_editorTranslationInfo.value.fontList as string[])
      for (const page of _editorTranslationInfo.value.pageList) {
        if (page.lang === selectedTranslatedLang.value) {
          for (const component of page.componentList) {
            const doneComponentId = await resizeAutoTextSingle(component, fontList, page.lang, page.pageId.toString())
            if (doneComponentId === lastComponentId) {
              return doneComponentId
            }
          }
        }
      }
      if (_editorTranslationInfo.value.hasChange) {
        editorInfoChange()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function resizeAutoCurrentPageText() {
    if (editorLang.value === 'cn') {
      return ''
    }
    try {
      const lastComponentId = currentTranslationPage.value.componentList?.[currentTranslationPage.value.componentList.length - 1]?.componentId?.toString() || ''
      const fontList = cloneDeep(_editorTranslationInfo.value.fontList as string[])
      for (const component of currentTranslationPage.value.componentList) {
        const doneComponentId = await resizeAutoTextSingle(component, fontList, currentTranslationPage.value?.lang, currentTranslationPage.value?.pageId.toString())
        console.log('autoSizeChange' + component.lang, doneComponentId, component.textType + '' + component.componentId)
        if (doneComponentId === lastComponentId) {
          break
        }
      }
      if (_editorTranslationInfo.value.hasChange) {
        editorInfoChange()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function resizeAutoTextSingle(component: IComponentInfo, fontList: string[], lang?: string, pageId?: string) {
    component.top = Number(component.top.toFixed(5))
    component.width = Number(component.width.toFixed(5))
    component.height = Number(component.height.toFixed(5))
    component.left = Number(component.left.toFixed(5))
    if (!component.lang || component.lang === '') {
      component.lang = lang ?? _editorTranslationInfo.value.translationType
    }
    if (!component.zindex) {
      component.zindex = 2
    }
    if (component.lang !== 'cn' && component.componentType === EComponentType.Text) {
      const changeData: any = await configTextComponentAutoResize(component, fontList, component.lang ?? lang ?? 'en')
      console.log('autoSizeChange' + component.lang, changeData, component.textType + '' + component.componentId)
      if (changeData.change) {
        component.hasChange = (component.hasChange ?? 1) + 1
        _editorTranslationInfo.value.hasChange = true
        // console.log('autoSizeChange', component.text)
        if (_currentTranslationPage.value?.pageId.toString() === pageId) {
          autoTextResize.value++
        }
      }
    }

    return component.componentId
  }

  function clearEditorInfo(justEn: boolean = false) {
    _multilingualTranslationList.value = []
    _editorTranslationInfo.value = {projectId: '', description: '', id: '', name: '', pageList: []}
    _currentTranslationPage.value = {id: '', pageId: '', componentList: []}
    selectedTranslatedLang.value = ''
    if (justEn) {
      allLanguageList.value = []
      translatedLanguageList.value = []
    }
  }

  function closeEditorEnInfo() {
    _multilingualTranslationList.value = []
    _editorTranslationInfo.value = {projectId: '', description: '', id: '', name: '', pageList: []}
    _currentTranslationPage.value = {id: '', pageId: '', componentList: []}
    selectedTranslatedLang.value = ''
    // LStorage.set(StorageKey.EditorEnInfo, '')
    // LStorage.set(StorageKey.MultilingualTranslation, '')
  }

  function setEditorInfoWithIndex(index: number) {
    if (_multilingualTranslationList.value.length > 0) {
      setEditorInfo(_multilingualTranslationList.value[index])
    }
  }

  const cpuPalette = computed(() => {
    return {
      bgColor: 'transparent',
      lineColor: '#51d6a9',
    }
  })
  // 更多配置,参见 https://github.com/timmywil/panzoom
  const panzoomOption = reactive<PanzoomOptions>({
    maxScale: 3,
    minScale: 0.1,
    disablePan: false,
    disableZoom: false,
    overflow: 'true',
    contain: undefined, // 'inside' | 'outside' | undefined
    handleStartEvent: (event: Event) => {
      // PanzoomEvent['panzoomstart']
      event.preventDefault()
      console.log('handleStartEvent', event)
    },
  })
  const _post = ref<SketchRulerProps|any>({
    canvasId: 'translationCanvasId',
    scale: 0.5,
    thick: 20,
    width: 1080,
    height: 1280,
    canvasWidth: 1080,
    canvasHeight: 1280,
    showRuler: true,
    isShowReferLine: true,
    paddingRatio: 0.12,
    palette: {
      bgColor: '#F1F2F2',
      lineColor: '#51d6a9',
      lineType: 'dashed',
    },
    snapsObj: {h: [], v: []},
    // shadow: {
    //   x: 0,
    //   y: 0,
    //   width: 0,
    //   height: 0,
    // },
    lines: {
      h: [],
      v: [],
    },
    panzoomOption: panzoomOption,
    gridRatio: 1,
  })

  const post = computed<SketchRulerProps>({
    get: () => _post.value,
    set: (val) => {
      _post.value = val
    },
  })

  const cpuScale = computed(() => Number((_post.value?.scale || 1) * 100).toFixed(0))

  function addNewPageInfoBySize(pageSize: IPageSize) {
    const pageInfo: IEditorPageInfo = {
      pageSize: pageSize,
      componentList: [],
      pageId: new Date().getTime().toString(),
      id: undefined,
    }
    _editorTranslationInfo.value.pageList.push(pageInfo)
    _post.value.canvasWidth = pageSize.pixelWidth
    _post.value.canvasHeight = pageSize.pixelHeight
    selectCurrentPage(_editorTranslationInfo.value.pageList.length - 1)
    // _currentTranslationPage.value = _editorTranslationInfo.value.pageList[_editorTranslationInfo.value.pageList.length - 1]
    console.log('addNewPageInfoBySize', _currentTranslationPage.value)
  }

  function setCurrentPageSize(pageSize: IPageSize) {
    if (_currentTranslationPage.value) {
      _currentTranslationPage.value.pageSize = cloneDeep(pageSize)
      _editorTranslationInfo.value.pageList.forEach((page) => {
        page.pageSize = cloneDeep(pageSize)
      })
      _post.value.canvasWidth = pageSize.pixelWidth
      _post.value.canvasHeight = pageSize.pixelHeight
    }
  }

  function selectCurrentPage(index: number) {
    if (index < 0 || index >= _editorTranslationInfo.value.pageList.length) {
      return
    }
    currentPageIndex.value = index
    const selectPage = _editorTranslationInfo.value.pageList[index]
    if (!selectPage.id || selectPage.id === '') {
      selectPage.id = new Date().getTime().toString()
    }
    if (!selectPage.pageId || selectPage.pageId === '') {
      selectPage.pageId = new Date().getTime().toString() + '-local'
    }
    _post.value.canvasWidth = selectPage.pageSize?.pixelWidth
    _post.value.canvasHeight = selectPage.pageSize?.pixelHeight
    if (selectPage.lines) {
      _post.value.lines = selectPage.lines
    } else {
      _post.value.lines = {h: [], v: []}
    }

    if (selectPage.zoomData) {
      if (_post.value.panzoomOption) {
        _post.value.panzoomOption.startX = selectPage.zoomData.x
        _post.value.panzoomOption.startY = selectPage.zoomData.y
        _post.value.scale = selectPage.zoomData.scale
      }
    } else {
      // _post.value.scale = 0.5
      _post.value.panzoomOption = panzoomOption
    }
    _currentTranslationPage.value = selectPage
  }

  function addNewComponent(component: IComponentInfo) {
    console.log('addNewComponent', component)
    component.componentId = new Date().getTime().toString()
    component.id = new Date().getTime().toString()
    if (_currentTranslationPage.value) {
      _currentTranslationPage.value?.componentList.push(component)
      // console.log('componentList', _currentPage.value?.componentList)
      _currentTranslationComponent.value = _currentTranslationPage.value.componentList[_currentTranslationPage.value.componentList.length - 1]
      autoSave()
    }
  }

  function addTextComponent(component: IComponentInfo) {
    const addTextAction = currentTranslationPage.value?.addComponentAction
    component.component = EditorComponent.QUILL_TEXT
    component.componentType = addTextAction?.type ?? EComponentType.Text
    component.textType = addTextAction?.name ?? 'Yaber正文'
    component.text = ''
    const displayName = addTextAction?.displayName || addTextAction?.name || '请输入'
    const isChinese = component.lang === 'cn'
    const textMap: Record<string, { cn: string; en: string }> = {
      '目录标题': { cn: '目录标题', en: 'TOC Title' },
      '目录': { cn: '目录', en: 'TOC' },
      '一级标题': { cn: '一级标题', en: 'Heading 1' },
      '二级标题': { cn: '二级标题', en: 'Heading 2' },
      '三级标题': { cn: '三级标题', en: 'Heading 3' },
      '正文': { cn: '正文', en: 'Body' },
      '备注文字': { cn: '备注文字', en: 'Caption' },
    }
    const displayText = textMap[displayName]?.[isChinese ? 'cn' : 'en'] || displayName
    component.deltaOps = [
      {
        insert: displayText,
      },
    ]
    component.zindex = 2
    component.componentView = loaderComponent(component.component)
    if (_currentTranslationPage.value) {
      _currentTranslationPage.value.addComponentAction = null
      addNewComponent(component)
    }
  }

  function updateCurrentComponentText(componentId: any, delta: any[], text: string, semanticHTML: string, textOverflow: boolean = false) {
    if (_currentTranslationPage.value) {
      const index = _currentTranslationPage.value.componentList?.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        _currentTranslationPage.value.componentList[index].deltaOps = delta
        _currentTranslationPage.value.componentList[index].textOverflow = textOverflow
        // _currentTranslationPage.value.componentList[index].text = text
        // _currentTranslationPage.value.componentList[index].semanticHTML = semanticHTML
      }
      editorInfoChange()
      autoSave()
    }
  }

  function updateCurrentComponentStyle(componentId: any, divStyle: any) {
    if (_currentTranslationPage.value) {
      const index = _currentTranslationPage.value.componentList?.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        _currentTranslationPage.value.componentList[index].divStyle = divStyle
      }
      editorInfoChange()
      autoSave()
    }
  }

  function updateCurrentTextOverflowState(componentId: any, overflow: boolean) {
    if (_currentTranslationPage.value) {
      console.log('updateCurrentTextOverflowState', componentId, overflow)
      const index = _currentTranslationPage.value.componentList?.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        _currentTranslationPage.value.componentList[index].textOverflow = overflow
      }
    }
  }

  function updateCurrentComponentWithResize(updateItem: IComponentInfo) {
    updateCurrentComponent(updateItem, true)
  }

  function updateCurrentComponent(updateItem: IComponentInfo, resize: boolean = false) {
    if (_currentTranslationPage.value) {
      const index = _currentTranslationPage.value.componentList?.findIndex((item) => item.componentId === updateItem.component)
      if (index > -1) {
        if (resize) {
          updateItem.resizeStatus = !updateItem.resizeStatus ? 1 : updateItem.resizeStatus + 1
        }
        _currentTranslationPage.value.componentList[index] = cloneDeep(updateItem)
      }
      editorInfoChange()
      autoSave()
    }
  }

  function setCurrentComponentSelected(componentId?: string | number | any, selected: boolean = true) {
    if (_currentTranslationPage.value && componentId) {
      _currentTranslationPage.value.componentList.forEach((item: IComponentInfo) => {
        if (item.componentId === componentId) {
          item.selected = selected
          _currentTranslationComponent.value = item
        } else {
          item.selected = false
        }
      })
      // console.log('setCurrentComponentSelected', currentTranslationComponentList)
    }
  }

  function setScale(scale: number) {
    _post.value.scale = scale
    scaleByUser.value++
  }

  function setZoomData(zoomData: any) {
    if (_currentTranslationPage.value) {
      _currentTranslationPage.value.zoomData = zoomData
    }
  }

  function deleteComponent(componentId: string) {
    if (_currentTranslationPage.value) {
      _currentTranslationPage.value.componentList.filter((item) => item.componentId !== componentId)
      autoSave()
    }
  }

  function deletePageInfo(index: number) {
    _editorTranslationInfo.value.pageList = _editorTranslationInfo.value.pageList.splice(index, 1)
    autoSave()
  }

  function autoSave() {
    const allFontMap = useTextEditorStore().allFontMap

    if (_multilingualTranslationList.value.length > 0) {
      // const saveMultilingualTranslationList = JSON.stringify(_multilingualTranslationList.value)
      _multilingualTranslationList.value.forEach((item) => {
        const fontList: string[] = []
        item.pageList.forEach((page) => {
          page.componentList.forEach((component, index) => {
            if (component.componentType === EComponentType.Text) {
              component.deltaOps.forEach((deltaOp) => {
                fontList.push(allFontMap[component.lang ?? item.translationType ?? 'en']?.[component.textType ?? 'Yaber正文']?.font ?? '')
                if (deltaOp['attributes'] && deltaOp['attributes']['font']) {
                  fontList.push(deltaOp['attributes']['font'])
                }
              })
            }
          })
        })
        item.fontList = Array.from(new Set(fontList))
      })
      // LStorage.set(StorageKey.MultilingualTranslation, saveMultilingualTranslationList)
      // LStorage.set(StorageKey.AllLanguageList, JSON.stringify(allLanguageList.value))
      return
    }
    const fontList: string[] = []
    _editorTranslationInfo.value.pageList.forEach((page) => {
      page.componentList.forEach((component, index) => {
        if (component.componentType === EComponentType.Text) {
          component.deltaOps.forEach((deltaOp) => {
            fontList.push(allFontMap[component.lang ?? _editorTranslationInfo.value.translationType ?? 'en']?.[component.textType ?? 'Yaber正文']?.font ?? '')
            if (deltaOp['attributes'] && deltaOp['attributes']['font']) {
              fontList.push(deltaOp['attributes']['font'])
            }
          })
        }
      })
    })
    _editorTranslationInfo.value.fontList = Array.from(new Set(fontList))
    // const saveString = JSON.stringify(_editorTranslationInfo.value)
    // LStorage.set(StorageKey.EditorEnInfo, saveString)
  }

  function initMultilingualTranslationList(multilingualTranslationList: IEditorInfo[]) {
    if (multilingualTranslationList.length > 0) {
      translatedLanguageList.value = cloneDeep(allLanguageList.value).filter((item) => item.selected)
      translatedLanguageList.value.forEach((item) => {
        item.selected = false
      })
      const pageList: IEditorPageInfo[] = []
      let fontList: string[] = []
      multilingualTranslationList.forEach((item: IEditorInfo) => {
        fontList = fontList.concat(item.fontList ?? [])
      })
      fontList = Array.from(new Set(fontList))
      fontInitWithList(fontList).then((data) => {})
      const editorLength = multilingualTranslationList.length
      for (let j = 0; j < editorLength; j++) {
        pageList.push(...multilingualTranslationList[j].pageList)
      }
      const longEditorInfo = cloneDeep(multilingualTranslationList[0])
      longEditorInfo.translationType = Combine_Lang
      longEditorInfo.fontList = fontList
      longEditorInfo.pageList = pageList
      if (!longEditorInfo.directoryType) {
        longEditorInfo.directoryType = EDirectoryType.Auto
      }
      if (!longEditorInfo.footerType) {
        longEditorInfo.footerType = EFooterTypeType.Auto
      }
      // 本地保存
      autoSave()
      setEditorInfo(longEditorInfo)
      translateDoneNextSelectPage.value++
    }
  }

  function initLocalStorageEditorInfo() {
    const editorEnStr = LStorage.get<string>(StorageKey.EditorEnInfo) || ''
    const editorEnStrList = LStorage.get<string>(StorageKey.MultilingualTranslation) || ''
    const AllLanguageListStr = LStorage.get<string>(StorageKey.AllLanguageList) || ''

    if (editorEnStrList && editorEnStrList !== '' && editorEnStrList.startsWith('[')) {
      _multilingualTranslationList.value = JSON.parse(editorEnStrList)
      if (AllLanguageListStr && AllLanguageListStr !== '' && AllLanguageListStr.startsWith('[')) {
        allLanguageList.value = JSON.parse(AllLanguageListStr)
      }
      if (_multilingualTranslationList.value.length > 0) {
        // setEditorInfoWithIndex(0)
        initMultilingualTranslationList(_multilingualTranslationList.value)
        return
      }
    }
    if (editorEnStr && editorEnStr !== '' && editorEnStr.startsWith('{')) {
      _editorTranslationInfo.value = JSON.parse(editorEnStr)
      const fontList = _editorTranslationInfo.value.fontList as string[]
      fontInitWithList(fontList).then((data) => {})
      if (_editorTranslationInfo.value.pageList.length > 0) {
        selectCurrentPage(0)
      }
    }
  }

  function clickCurrentPageComponentAction(item: IComponentAddTypeItem) {
    if (_currentTranslationPage.value) {
      _currentTranslationPage.value.addComponentAction = item
    }
  }

  function addCanvasState() {
    refreshState.value++
  }

  // function selectMultilingual(codes: string[]) {
  //   const selectMultilingualList = _multilingualTranslationList.value.filter((item) => codes.includes(item?.translationType ?? ''))
  //   initMultilingualTranslationList(selectMultilingualList)
  // multilingualList.value.forEach((item: ISelectLanguage) => {
  //   item.selected = clickItem.name === item.name
  // })
  // const index = _multilingualTranslationList.value.findIndex((item) => item.translationType === clickItem.code)
  // if (index > -1) {
  //   setEditorInfoWithIndex(index)
  // }
  // }

  function setSelectLanguageList(codes: string[]) {
    selectLanguageList.value = codes
    allLanguageList.value.forEach((item) => {
      item.selected = codes.includes(item.code)
    })
  }

  function clickPageAction(type: string) {
    const currentIndex = _editorTranslationInfo.value.pageList?.findIndex((item) => item.pageId === currentTranslationPage.value.pageId)
    if (type === 'up') {
      if (currentIndex > 0) {
        selectCurrentPage(currentIndex - 1)
      } else {
        const findCodeIndex = translatedLanguageList.value.findIndex((item) => item.code === _editorTranslationInfo.value.translationType)
        if (findCodeIndex > 0) {
          const nextTranslate = _multilingualTranslationList.value.find((item) => item.translationType === translatedLanguageList.value[findCodeIndex - 1].code)
          if (nextTranslate) {
            selectTranslatedLanguage(translatedLanguageList.value[findCodeIndex - 1].code, nextTranslate.pageList.length - 1)
            selectCurrentPage(nextTranslate?.pageList.length - 1)
          }
        }
      }
    } else {
      if (currentIndex < _editorTranslationInfo.value.pageList.length - 1) {
        selectCurrentPage(currentIndex + 1)
      } else {
        const findCodeIndex = translatedLanguageList.value.findIndex((item) => item.code === _editorTranslationInfo.value.translationType)
        if (findCodeIndex < translatedLanguageList.value.length - 1) {
          selectTranslatedLanguage(translatedLanguageList.value[findCodeIndex + 1].code, 0)
          selectCurrentPage(0)
        }
      }
    }
  }

  function setAllLanguageList(value: ISelectLanguage[]) {
    allLanguageList.value = value
    // translatedLanguageList.value = allLanguageList.value.filter((item) => item.selected)
    // translatedLanguageList.value.forEach((item) => {
    //   item.selected = false
    // })
  }

  function selectTranslatedLanguage(value: string, currentPage: number = 0) {
    translatedLanguageList.value.forEach((item) => {
      item.selected = item.code === value
    })
    selectedTranslatedLang.value = value
    if (value === '') {
      // 回到多语言翻页逻辑
      _editorTranslationInfo.value = {projectId: '', description: '', id: '', name: '', pageList: []}
      _currentTranslationPage.value = {id: '', pageId: '', componentList: []}
      initMultilingualTranslationList(_multilingualTranslationList.value)
    } else {
      // 实现对照逻辑
      // clearEditorInfo()
      const longEditorInfo = cloneDeep(_multilingualTranslationList.value.find((item) => item.translationType === value))
      if (longEditorInfo) {
        _editorTranslationInfo.value = {projectId: '', description: '', id: '', name: '', pageList: []}
        _currentTranslationPage.value = {id: '', pageId: '', componentList: []}
        setEditorInfo(longEditorInfo, currentPage)
      }
    }
  }

  function clearLocalChangeStatus(code: string) {
    if (_editorTranslationInfo.value.translationType === code) {
      _editorTranslationInfo.value.hasChange = false
    } else {
      _multilingualTranslationList.value.forEach((item) => {
        if (item.hasChange && item.translationType === code) {
          item.hasChange = false
        }
      })
    }
  }

  function editorInfoChange() {
    _editorTranslationInfo.value.hasChange = true
    if (_multilingualTranslationList.value.length > 0) {
      _multilingualTranslationList.value.forEach((item) => {
        const findPageIndex = item.pageList.findIndex((findPage) => findPage.pageId === _currentTranslationPage.value.pageId)
        if (findPageIndex > -1) {
          item.hasChange = true
          item.pageList[findPageIndex] = {..._currentTranslationPage.value}
        }
      })
    }
  }

  function saveSuccess(lang: string, single: boolean = false) {
    if (single) {
      _editorTranslationInfo.value.hasChange = false
    } else {
      _multilingualTranslationList.value.forEach((item) => {
        if (item.hasChange && lang === item.translationType) {
          item.hasChange = false
        }
      })
    }
    autoSave()
  }

  function configAllPageFooter() {
    if (_editorTranslationInfo.value.footerType !== EFooterTypeType.Auto) {
      return
    }
    const directoryIndex = 0
    // if (editorLang.value !== 'combine') {
    //   directoryIndex = _editorTranslationInfo.value.pageList?.findIndex((page) => page.type === EPageType.Directory)
    //   if (directoryIndex >= 0) {
    //     const directoryLength = _editorTranslationInfo.value.pageList.filter((page) => page.type === EPageType.Directory).length
    //     directoryIndex += directoryIndex + directoryLength
    //   } else {
    //     directoryIndex = 0
    //   }
    // }
    const coverNum = _editorTranslationInfo.value.pageList.filter((page) => page.type === EPageType.Cover).length
    let nowTime = new Date().getTime()

    const textType = useTextEditorStore().allFontMap[editorLang.value]?.['Yaber正文'] ?? {
      type: 'Yaber正文',
      lang: '中文',
      size: 7,
      font: 'OPlusSans3-Regular',
      pxSize: dealFontsizePt2Px(7),
    }
    _editorTranslationInfo.value.pageList?.forEach((page, index) => {
      const fonderIndex = page.componentList.findIndex((component) => component.componentType === EComponentType.PageFooter)
      if ((page.type as EPageType) !== EPageType.Cover && page.type !== EPageType.MultilingualDirectory) {
        if (fonderIndex > -1) {
          page.pageFooterNum = index - directoryIndex + 1 - coverNum
          // page.componentList[fonderIndex].width = 120
          // page.componentList[fonderIndex].height = 80
          // page.componentList[fonderIndex].top = page.pageSize!.pixelHeight! - 100
          // page.componentList[fonderIndex].left = page.pageSize!.pixelWidth! - 120 - 120
          page.componentList[fonderIndex].deltaOps = [
            {insert: page.pageFooterNum.toString()},
            {
              attributes: {
                align: 'right',
              },
              insert: '\n',
            },
          ]
        } else {
          nowTime += 100
          page.pageFooterNum = index - directoryIndex + 1 - coverNum
          page.componentList.push({
            id: page.pageId + 'C' + nowTime.toString(),
            componentId: page.pageId + 'C' + nowTime.toString(),
            componentType: EComponentType.PageFooter,
            component: EditorComponent.QUILL_TEXT,
            width: 120,
            height: 80,
            top: page.pageSize!.pixelHeight! - 100,
            left: page.pageSize!.pixelWidth! - 120 - 120,
            textType: 'Yaber正文',
            deltaOps: [
              {
                insert: page.pageFooterNum?.toString(),
              },
              {
                attributes: {
                  align: 'right',
                },
                insert: '\n',
              },
            ],
            zindex: 2,
            fontName: textType.font,
            fontSize: textType.pxSize,
          } as IComponentInfo)
        }
        console.log('page.pageFooterNum', page.pageFooterNum)
      } else {
        if (fonderIndex > -1) {
          page.componentList.splice(fonderIndex, 1)
        }
      }
    })
  }

  function resetPageList(pageList: IEditorPageInfo[]) {
    _editorTranslationInfo.value.pageList = pageList
    resetDirectoryPage()
    configAllPageFooter()
    selectCurrentPage(0)
  }

  function resetDirectoryPage() {
    const directoryList = _editorTranslationInfo.value.pageList.filter((item) => item.type === EPageType.Directory)
    if (directoryList.length > 0) {
      const firstLang = directoryList[0].lang
      const firstDirectoryIndex = directoryList.filter((item) => item.lang === firstLang).length
      _editorTranslationInfo.value.pageList.forEach((pageInfo) => {
        if (pageInfo.type === EPageType.Directory) {
          pageInfo.componentList.forEach((component) => {
            if (component.componentType === EComponentType.PageIndexNumber && component.deltaOps[0] && component.deltaOps[0].insert) {
              const index = Number(component.deltaOps[0].insert)
              component.deltaOps[0].insert = (index + firstDirectoryIndex).toString()
            }
          })
        }
      })
    }
  }

  function setMainChangeBeforeTranslate(value: boolean) {
    mainChangeBeforeTranslate.value = value
  }

  function switchMarkLine() {
    _post.value.isShowReferLine = !_post.value.isShowReferLine
  }

  function deleteAllMarkLine() {
    _post.value.lines = {h: [], v: []}
  }

  function deleteAllPageMarkLine() {
    _post.value.lines = {h: [], v: []}
    editorTranslationInfo.value.pageList.forEach((page) => {
      page.lines = {h: [], v: []}
    })
  }

  function resetPagePost() {
    _editorTranslationInfo.value.pageList.forEach((page) => {
      page.zoomData = undefined
    })
  }

  function translateCurrentPage(res: any, translateIndex: number, translateCode?: string) {
    const result = res?.page
    if (result && translateIndex < _editorTranslationInfo.value.pageList.length) {
      _editorTranslationInfo.value.pageList[translateIndex] = cloneDeep(result) as IEditorPageInfo
      selectCurrentPage(translateIndex)
      if (_multilingualTranslationList.value.length > 0) {
        _multilingualTranslationList.value.forEach((info:any) => {
          if (info.lang === translateCode) {
            if (info.pageList.length > translateIndex) info.pageList[translateIndex] = cloneDeep(result) as IEditorPageInfo
          }
        })
      }
    }
  }

  return {
    editorTranslationInfo,
    currentTranslationPage,
    currentTranslationComponent,
    currentTranslationComponentList,
    cpuScale,
    pageTranslationList,
    post,
    setMultilingualTranslationList,
    addNewComponent,
    deleteComponent,
    deletePageInfo,
    updateCurrentComponentText,
    updateCurrentComponent,
    setScale,
    setZoomData,
    setCurrentComponentSelected,
    setCurrentPageSize,
    addNewPageInfoBySize,
    selectCurrentPage,
    initLocalStorageEditorInfo,
    clickCurrentPageComponentAction,
    setEditorInfo,
    addCanvasState,
    refreshState,
    scaleByUser,
    clearEditorInfo,
    setSelectLanguageList,
    allLanguageList,
    selectLanguageList,
    editorLang,
    showTranslationSetting,
    multilingualTranslationList,
    clickPageAction,
    setAllLanguageList,
    closeEditorEnInfo,
    canPageUp,
    canPageDown,
    translatedLanguageList,
    selectTranslatedLanguage,
    isSingleTranslation,
    noPageAction,
    clearLocalChangeStatus,
    editorInfoChange,
    saveSuccess,
    autoTextResize,
    resetPageList,
    mainChangeBeforeTranslate,
    setMainChangeBeforeTranslate,
    updateCurrentComponentStyle,
    updateCurrentComponentWithResize,
    resizeAutoText,
    selectedTranslatedLang,
    resizeAutoSingleLangPageText,
    resizeAutoCurrentPageText,
    switchMarkLine,
    deleteAllMarkLine,
    deleteAllPageMarkLine,
    resetPagePost,
    updateCurrentTextOverflowState,
    translateDoneNextSelectPage,
    currentPageIndex,
    translateCurrentPage,
  }
})
