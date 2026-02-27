import {defineStore} from 'pinia'
import {computed, reactive, ref} from 'vue'
import {type SketchRulerProps} from '@/view/common/sketch-ruler/index-types'
import {type PanzoomOptions} from 'simple-panzoom'
import {EditorComponent} from '@/view/editor/component/editorComponentInit'
import {
  Combine_Lang,
  configPixel,
  defaultDpi,
  EComponentType,
  EDirectoryType,
  EFooterTypeType,
  EOperationHistory,
  EPageType,
  type IComponentAddTypeItem,
  type IComponentInfo,
  type IEditorInfo,
  type IEditorPageInfo,
  type IOperationHistory,
  type IPageSize,
  type IProjectInfo,
} from '@/view/editor/utils/common-modle'
import {cloneDeep, isEqual, uniqueId} from 'lodash'
import {LStorage, StorageKey} from '@/lib/storage'
import {fontInitWithList} from '@/lib/util'
import {configTextComponentAutoResize} from '@/view/editor/utils/quill-text-auto-resize-util'
import {useTextEditorStore} from '@/store/textEdiotrSotre'
import {dealFontsizePt2Px} from '@/lib/font-face-list'
import type {DragData} from '@/view/common/drager/drager'
import {gridTableDefaultHeight} from '@/view/editor/component/table/grid-table-util'

export const defaultSketchRulerWidth: number = 120
export const useEditorStore = defineStore('editor', () => {
  const projectInfo = ref<IProjectInfo>()
  const _editorInfo = ref<IEditorInfo>({projectId: '', description: '', id: '', name: '', pageList: []})
  const _currentPage = ref<IEditorPageInfo>()
  const _currentComponent = ref<IComponentInfo>()
  const currentComponentList = computed<IComponentInfo[]>(() => {
    return _currentPage.value?.componentList || []
  })

  const loading = ref(false)
  const showPdfExportProgress = ref(false)
  const loadingText = ref('等待中...')
  const pdfExportProgressValue = ref(0)
  const exportStatus = ref(false)
  const scaleByUser = ref(0)

  const refreshCenterLayoutStatus = ref(0)
  const history = ref<{undo: IOperationHistory[]; redo: IOperationHistory[]}>({undo: [], redo: []})

  const currentPage = computed(() => {
    return _currentPage.value
  })

  const currentPageIndex = computed(() => {
    return _editorInfo.value?.pageList.findIndex((item) => item.pageId === _currentPage.value?.pageId)
  })

  const disableEdit = computed(() => _editorInfo.value?.disableEdit)

  const editorLang = computed(() => _editorInfo.value?.translationType ?? 'cn')

  const addComponentAction = computed(() => {
    return _currentPage.value?.addComponentAction
  })

  const groupSelect = ref(false)

  // 更多配置,参见 https://github.com/timmywil/panzoom
  const panzoomOption = reactive<PanzoomOptions>({
    maxScale: 3,
    minScale: 0.1,
    disablePan: false,
    disableZoom: false,
    contain: undefined, // 'inside' | 'outside' | undefined
    handleStartEvent: (event: Event) => {
      // PanzoomEvent['panzoomstart']
      event.preventDefault()
      console.log('handleStartEvent', event)
    },
  })
  const _post = ref<SketchRulerProps>({
    canvasId: 'editorCanvasId',
    scale: 0.5,
    thick: 20,
    width: 1080,
    height: 1280,
    physicalWidth: 1080,
    physicalHeight: 1280,
    canvasWidth: 1080,
    canvasHeight: 1280,
    showRuler: true,
    snapThreshold: 5,
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

  const editorInfo = computed<IEditorInfo>(() => _editorInfo.value)
  const post = computed<SketchRulerProps>({
    get: () => _post.value,
    set: (val) => {
      _post.value = val
    },
  })
  const currentComponent = computed({
    get: () => _currentComponent.value,
    set: (val) => {
      _currentComponent.value = val
    },
  })
  const pageList = computed<IEditorPageInfo[]>(() => {
    return _editorInfo.value.pageList
  })
  // const currentPage = computed<EditorPageInfo>({
  //     get: () => _currentPage.value,
  //     set: (val) => {
  //         _currentPage.value = val
  //     },
  // })

  const cpuScale = computed(() => Number((_post.value?.scale || 1) * 100).toFixed(0))

  const autoTextResize = ref(0)

  const hasSelectedComponent = computed(() => {
    return currentComponentList.value.some((item) => item.selected)
  })

  function addNewPageInfoBySize(pageSize: IPageSize, type: string = '', pushIndex: number = -1) {
    const pageInfo: IEditorPageInfo = {
      pageSize: pageSize,
      componentList: [],
      pageId: editorInfo.value.id + 'P' + new Date().getTime().toString() + '-local',
      id: undefined,
      lang: editorLang.value,
      lines: {
        h: [],
        v: [],
      },
    }
    switch (type) {
      case 'insert':
        _editorInfo.value.pageList.splice(pushIndex, 0, pageInfo)
        break
      case EPageType.Directory:
        _editorInfo.value.pageList.splice(pushIndex, 0, pageInfo)
        pageInfo.type = EPageType.Directory
        break
      case EPageType.MultilingualDirectory:
        _editorInfo.value.pageList.splice(pushIndex, 0, pageInfo)
        pageInfo.type = EPageType.MultilingualDirectory
        break
      case EPageType.Cover:
        _editorInfo.value.pageList.splice(pushIndex, 0, pageInfo)
        pageInfo.type = EPageType.Cover
        break
      default:
        _editorInfo.value.pageList.push(pageInfo)
        break
    }
    refreshPostInfo(pageSize)
    // emitter.emit(MittTypeEnum.Page_Preview_Refresh, {})
    configAllPageFooter()
    selectCurrentPage(_editorInfo.value.pageList.length - 1)
    // _currentPage.value = _editorInfo.value.pageList[_editorInfo.value.pageList.length - 1]
    _editorInfo.value.hasChange = true
    console.log('addNewPageInfoBySize', _currentPage.value)
  }

  function setCurrentPageSize(pageSize: IPageSize) {
    if (_currentPage.value) {
      _currentPage.value.pageSize = cloneDeep(pageSize)
      _editorInfo.value.pageList.forEach((page) => {
        page.componentList = page.componentList.filter((item) => item.componentType !== EComponentType.PageFooter)
        page.zoomData = undefined
        page.pageSize = cloneDeep(pageSize)
      })
      refreshPostInfo(pageSize)
      // _post.value.panzoomOption = panzoomOption
      configAllPageFooter()
      refreshCenterLayoutStatus.value++
    }
  }

  function selectCurrentPage(index: number) {
    if (index >= _editorInfo.value.pageList.length) {
      return
    }

    const selectPage = _editorInfo.value.pageList[index]

    if (selectPage.pageId !== _currentPage.value?.pageId) {
      if (selectPage.pageSize) {
        refreshPostInfo(selectPage.pageSize)
      }
      if (selectPage.lines) {
        _post.value.lines = selectPage.lines
      } else {
        _post.value.lines = {h: [], v: []}
      }
      history.value = {undo: [], redo: []}
      _currentPage.value = selectPage
      _currentPage.value.addComponentAction = null
      console.log('selectCurrentPage', _currentPage.value)
    }
  }

  function refreshPostInfo(pageSize: IPageSize) {
    _post.value.dpi = pageSize?.dpi
    _post.value.canvasWidth = pageSize?.pixelWidth ?? 1920
    _post.value.canvasHeight = pageSize?.pixelHeight ?? 1080
    _post.value.physicalWidth = pageSize?.width ?? 1080
    _post.value.physicalHeight = pageSize?.height ?? 1080
  }

  function addNewComponent(component: IComponentInfo, delaySelected: boolean = true) {
    console.log('addNewComponent', component)
    component.componentId = currentPage.value?.pageId + 'C' + new Date().getTime().toString()
    component.id = component.componentId
    component.lang = currentComponent.value?.lang ?? editorLang.value
    if (!component.zindex) {
      // 默认2
      component.zindex = 2
    }
    // component.id = new Date().getTime().toString()
    if (_currentPage.value) {
      _currentPage.value?.componentList.push(component)
      // console.log('componentList', _currentPage.value?.componentList)
      if (delaySelected) {
        _currentComponent.value = _currentPage.value.componentList[_currentPage.value.componentList.length - 1]
        setTimeout(() => {
          setCurrentComponentSelected(component.componentId)
        }, 200)
      }
      history.value.undo.push({
        id: uniqueId('cache_operation'),
        type: EOperationHistory.ADD_COMPONENT,
        component: cloneDeep(component),
        pageId: currentPage.value?.pageId,
      })
      history.value.redo = []
      limitOperationList()
      autoSave()
    }
  }

  function addNewComponentWithGroup(components: IComponentInfo[], userDo: boolean = true, insertHistory: boolean = true, needRedo: boolean = false) {
    console.log('addNewComponent', components)
    let nowTime = new Date().getTime()
    components.forEach((component) => {
      nowTime += 1000
      component.componentId = currentPage.value?.pageId + 'C' + nowTime.toString()
      component.id = component.componentId
      component.lang = currentComponent.value?.lang ?? editorLang.value
      component.selected = true
      _currentPage.value?.componentList.push(component)
    })

    if (insertHistory) {
      history.value.undo.push({
        id: uniqueId('cache_operation'),
        type: EOperationHistory.ADD_GROUP_COMPONENT,
        components: cloneDeep(components),
        pageId: currentPage.value?.pageId,
      })
      limitOperationList()
    }

    if (needRedo) {
      history.value.redo.push({
        id: uniqueId('cache_operation'),
        type: EOperationHistory.ADD_GROUP_COMPONENT,
        components: cloneDeep(components),
        pageId: currentPage.value?.pageId,
      })
    }
    if (userDo) {
      history.value.redo = []
    }

    autoSave()
  }

  function addNewComponentByArea(component: IComponentInfo) {
    const addTextAction = currentPage.value?.addComponentAction
    component.lang = currentComponent.value?.lang ?? editorLang.value
    if (!component.componentType) {
      component.componentType = addTextAction?.type as EComponentType
    }
    if (!component.angle) {
      component.angle = 0
    }

    switch (addTextAction?.type) {
      case EComponentType.Text: {
        component.component = EditorComponent.QUILL_TEXT
        component.textType = addTextAction?.name
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
            insert: '这里输入' + displayText,
          },
          {
            insert: '\n',
          },
        ]
        if (addTextAction?.name.includes('标题')) {
          component.deltaOps[0].attributes = {bold: true}
        } else {
          component.deltaOps = [
            {
              insert: '这里输入' + displayText + '\n',
            },
          ]
        }
        const fontMap = useTextEditorStore().allFontMap[component.lang ?? editorLang]?.[component.textType ?? 'Yaber正文'] ?? {
          type: 'Yaber正文',
          lang: '中文',
          size: 7,
          font: 'OPlusSans3-Regular',
          pxSize: dealFontsizePt2Px(7),
        }
        component.fontName = fontMap.font
        component.fontSize = fontMap.pxSize
        break
      }
      case EComponentType.Image:
      case EComponentType.Icon:
        component.component = EditorComponent.IMAGE
        component.imageSrc = addTextAction?.imgSrc ?? ''
        break
      case EComponentType.Line:
      case EComponentType.DashedLine:
      case EComponentType.Background:
        component.component = EditorComponent.Shape
        component.divStyle = addTextAction?.style ?? {}
        break
      case EComponentType.Table:
        component.component = EditorComponent.Table
        break
      default:
        component.component = 'div'
        break
    }

    if (!component.zindex) {
      // 默认2
      component.zindex = 2
    }
    // component.componentView = loaderComponent(component.component)
    if (_currentPage.value) {
      _currentPage.value.addComponentAction = null
      console.log('addNewComponent', component)
      addNewComponent(component)
    }
  }

  function addComponentActionAuto(addItem: IComponentAddTypeItem) {
    // 自动添加到画布
    let autoTop: number = 0
    const heightList = currentComponentList.value
      .filter((item) => item.componentType !== EComponentType.PageFooter)
      .map((item) => item.height + item.top)
      .sort((a, b) => b - a)
    if (heightList.length > 0) {
      autoTop = heightList[0]
    }
    let left = defaultSketchRulerWidth
    let lastWidth = addItem.width
    let lastHeight = addItem.height
    if ([EComponentType.Image, EComponentType.Icon, EComponentType.Table].includes(addComponentAction.value?.type ?? addItem.type)) {
      left = (_currentPage.value?.pageSize?.pixelWidth || 1080) / 2 - lastWidth / 2
      if (left < defaultSketchRulerWidth) {
        left = defaultSketchRulerWidth
        lastWidth = (_currentPage.value?.pageSize?.pixelWidth || 1080) - defaultSketchRulerWidth * 2
        lastHeight = lastHeight * (lastWidth / addItem.width)
      }
    }

    if (autoTop > (_currentPage.value?.pageSize?.pixelHeight || 1080) - (addItem?.height ?? 0)) {
      // 没有位置了就自动居中叠加展示
      autoTop = (_currentPage.value?.pageSize?.pixelHeight || 1080) / 2 - addItem.height / 2
      const autoTopItem = currentComponentList.value.find((i) => i.top === autoTop)
      if (autoTopItem) {
        // 自动往下叠加
        autoTop = autoTopItem.top + defaultSketchRulerWidth
      }
    }
    if (autoTop === 0) {
      autoTop += Number(defaultSketchRulerWidth)
    }
    const addInfo = {
      width: lastWidth,
      height: lastHeight,
      top: autoTop,
      left: left,
      lang: editorLang.value,
      componentType: addItem.type,
      imageSrc: addItem.imgSrc,
      divStyle: addItem.style,
    } as IComponentInfo
    if (addComponentAction.value?.type === EComponentType.Table) {
      const columns = [] as any[]
      const rowData = [] as any[]
      const rowHeights = {} as Record<number, any>
      for (let i = 0; i < (addItem?.colNum ?? 4); i++) {
        columns.push({field: 'field' + i, headerName: 'name' + i, flex: 1})
      }

      for (let j = 0; j < (addItem?.rowNum ?? 4); j++) {
        const rowSingleValue: any = {}
        for (let i = 0; i < (addItem?.colNum ?? 4); i++) {
          rowSingleValue['field' + i] = `value-${i}-${j}`
        }
        rowData.push(rowSingleValue)
        rowHeights[j] = gridTableDefaultHeight
      }
      addInfo.tableStyle = {
        rowNum: addItem.rowNum,
        colNum: addItem.colNum,
        columns: columns,
        rowData: rowData,
        rowHeights: rowHeights,
      }
    }
    addNewComponentByArea(addInfo)
  }

  function updateCurrentComponentText(componentId: any, delta: any[], text: string, semanticHTML: string, insertHistory: boolean = false, textOverflow: boolean = false) {
    if (_currentPage.value) {
      // console.log(componentId + 'update', delta)
      const index = _currentPage.value.componentList.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        if (insertHistory) {
          const oldDeltaOps = _currentPage.value.componentList[index].deltaOps
          oldDeltaOps.forEach((oldDelta) => {
            Object.keys(oldDelta).forEach((key) => {
              if (!oldDelta[key]) {
                delete oldDelta[key]
              }
            })
          })
          const equalDelta = cloneDeep(delta)
          // if (equalDelta.length > 0) {
          //   if (isEqual(delta[delta.length - 1], {insert: '\n'})) {
          //     equalDelta.pop()
          //   }
          // }
          const equalOldDelta = cloneDeep(oldDeltaOps)
          // if (equalOldDelta.length > 0) {
          //   if (isEqual(equalOldDelta[equalOldDelta.length - 1], {insert: '\n'})) {
          //     equalOldDelta.pop()
          //   }
          // }

          if (!isEqual(equalDelta, equalOldDelta)) {
            // console.log('delta', JSON.stringify(equalDelta))
            // console.log('delta1', JSON.stringify(oldDeltaOps))
            history.value.undo.push({
              id: uniqueId('cache_operation'),
              type: EOperationHistory.UPDATE_COMPONENT_TEXT,
              componentId: componentId,
              deltaOps: oldDeltaOps,
              pageId: currentPage.value?.pageId,
            })
            limitOperationList()
            history.value.redo = []
          }
        }
        _currentPage.value.componentList[index].deltaOps = delta
        _currentPage.value.componentList[index].text = text.substring(0, 40)
        _currentPage.value.componentList[index].textOverflow = textOverflow
        // _currentPage.value.componentList[index].hasChange = false
        // _currentPage.value.componentList[index].semanticHTML = semanticHTML
      }
      autoSave()
    }
  }

  function updateCurrentTextOverflowState(componentId: any, overflow: boolean) {
    if (_currentPage.value) {
      console.log('updateCurrentTextOverflowState', componentId, overflow)
      const index = _currentPage.value.componentList?.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        _currentPage.value.componentList[index].textOverflow = overflow
      }
    }
  }

  function updateCurrentComponentStyle(componentId: any, divStyle: any, insertHistory: boolean = false) {
    if (_currentPage.value) {
      const index = _currentPage.value.componentList?.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        if (insertHistory) {
          const oldDivStyle = _currentPage.value.componentList[index].divStyle
          if (!isEqual(divStyle, oldDivStyle)) {
            history.value.undo.push({
              id: uniqueId('cache_operation'),
              type: EOperationHistory.UPDATE_COMPONENT_TEXT,
              componentId: componentId,
              divStyle: oldDivStyle,
              pageId: currentPage.value?.pageId,
            })
            history.value.redo = []
          }
        }
        _currentPage.value.componentList[index].divStyle = divStyle
      }
      _editorInfo.value.hasChange = true
      autoSave()
    }
  }

  function updateCurrentTable(updateItem: IComponentInfo, userDo: boolean = true, insertHistory: boolean = true, needRedo: boolean = true) {
    updateCurrentComponent(updateItem, userDo, insertHistory, needRedo, false)
  }

  function updateCurrentComponentWithResize(updateItem: IComponentInfo) {
    updateCurrentComponent(updateItem, true, false, false, true)
  }

  function updateCurrentComponent(updateItem: IComponentInfo, userDo: boolean = true, insertHistory: boolean = false, needRedo: boolean = false, resize: boolean = false) {
    if (_currentPage.value) {
      const index = _currentPage.value.componentList.findIndex((item) => item.componentId === updateItem.componentId)
      if (index > -1) {
        if (insertHistory) {
          history.value.undo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.UPDATE_COMPONENT,
            component: cloneDeep(_currentPage.value.componentList[index]),
            pageId: currentPage.value?.pageId,
          })
          limitOperationList()
        }
        if (needRedo) {
          history.value.redo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.UPDATE_COMPONENT,
            component: cloneDeep(_currentPage.value.componentList[index]),
            pageId: currentPage.value?.pageId,
          })
        }
        if (userDo) {
          history.value.redo = []
        }
        if (resize) {
          updateItem.resizeStatus = !updateItem.resizeStatus ? 1 : updateItem.resizeStatus + 1
        }
        _currentPage.value.componentList[index] = cloneDeep(updateItem)
      }
      autoSave()
    }
  }

  function updateCurrentComponentJustText(componentId: string | number | any, deltaOps: any, userDo: boolean = true, insertHistory: boolean = false, needRedo: boolean = false) {
    if (_currentPage.value) {
      const index = _currentPage.value.componentList.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        if (insertHistory) {
          history.value.undo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.UPDATE_COMPONENT_TEXT,
            componentId: componentId,
            deltaOps: cloneDeep(_currentPage.value.componentList[index].deltaOps),
            pageId: currentPage.value?.pageId,
          })
          limitOperationList()
        }
        if (needRedo) {
          history.value.redo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.UPDATE_COMPONENT_TEXT,
            componentId: componentId,
            deltaOps: cloneDeep(_currentPage.value.componentList[index].deltaOps),
            pageId: currentPage.value?.pageId,
          })
        }
        _currentPage.value.componentList[index].deltaOps = deltaOps
        if (!_currentPage.value.componentList[index].hasChange) {
          _currentPage.value.componentList[index].hasChange = 1
        } else {
          _currentPage.value.componentList[index].hasChange++
        }
      }
      autoSave()
    }
  }

  function updateCurrentComponentJustStyle(componentId: string | number | any, divStyle: any, userDo: boolean = true, insertHistory: boolean = false, needRedo: boolean = false) {
    if (_currentPage.value) {
      const index = _currentPage.value.componentList.findIndex((item) => item.componentId === componentId)
      if (index > -1) {
        if (insertHistory) {
          history.value.undo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.UPDATE_COMPONENT_STYLE,
            componentId: componentId,
            divStyle: cloneDeep(_currentPage.value.componentList[index].divStyle),
            pageId: currentPage.value?.pageId,
          })
          limitOperationList()
        }
        if (needRedo) {
          history.value.redo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.UPDATE_COMPONENT_STYLE,
            componentId: componentId,
            divStyle: cloneDeep(_currentPage.value.componentList[index].divStyle),
            pageId: currentPage.value?.pageId,
          })
        }
        if (userDo) {
          history.value.redo = []
        }
        // _currentPage.value.componentList[index].divStyle = divStyle
        // if (!_currentPage.value.componentList[index].hasChange) {
        //   _currentPage.value.componentList[index].hasChange = 0
        // } else {
        //   _currentPage.value.componentList[index].hasChange++
        // }
      }
      autoSave()
    }
  }

  function setCurrentComponentSelected(componentId?: string | number | any, selected: boolean = true, groupId?: string | number | undefined) {
    if (_currentPage.value && componentId) {
      _currentPage.value.componentList.forEach((item: IComponentInfo) => {
        if (item.componentId === componentId) {
          item.selected = selected
          _currentComponent.value = item
        }
        if (groupId) {
          if (item.groupId === groupId) {
            item.selected = selected
          }
        }
      })
    }
  }

  function setScale(scale: number) {
    _post.value.scale = scale
    scaleByUser.value++
  }

  function setZoomData(zoomData: any) {
    if (_currentPage.value) {
      _currentPage.value.zoomData = cloneDeep(zoomData)
    }
  }

  function deleteComponent(deleteItem: IComponentInfo, userDo: boolean = true, insertHistory: boolean = true, needRedo: boolean = false) {
    if (_currentPage.value && deleteItem) {
      const index = _currentPage.value.componentList.findIndex((item) => item.componentId === deleteItem.componentId)
      if (index > -1) _currentPage.value.componentList.splice(index, 1)
      if (insertHistory) {
        history.value.undo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.DELETE_COMPONENT,
          component: cloneDeep(deleteItem),
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }

      if (needRedo) {
        history.value.redo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.DELETE_COMPONENT,
          component: cloneDeep(deleteItem),
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }

      if (userDo) {
        history.value.redo = []
      }
      autoSave()
    }
  }

  function deleteComponentWithGroup(deleteItems: IComponentInfo[], userDo: boolean = true, insertHistory: boolean = true, needRedo: boolean = false) {
    if (_currentPage.value && deleteItems.length > 0) {
      deleteItems.forEach((deleteItem: IComponentInfo) => {
        const index = _currentPage.value!.componentList.findIndex((item) => item.componentId === deleteItem.componentId)
        if (index > -1) _currentPage.value!.componentList.splice(index, 1)
      })

      if (insertHistory) {
        history.value.undo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.DELETE_GROUP_COMPONENT,
          components: cloneDeep(deleteItems),
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }

      if (needRedo) {
        history.value.redo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.DELETE_GROUP_COMPONENT,
          components: cloneDeep(deleteItems),
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }
      if (userDo) {
        history.value.redo = []
      }
      autoSave()
    }
  }

  function swapComponent(i: number, j: number, userDo: boolean = true, insertHistory: boolean = true, needRedo: boolean = false) {
    if (_currentPage.value && i >= 0 && j >= 0 && i != j) {
      ;[_currentPage.value.componentList[i], _currentPage.value.componentList[j]] = [_currentPage.value.componentList[j], _currentPage.value.componentList[i]]
      if (insertHistory) {
        history.value.undo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.SWAP_COMPONENT,
          swapPositions: [i, j],
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }
      if (needRedo) {
        history.value.redo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.SWAP_COMPONENT,
          swapPositions: [i, j],
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }
      if (userDo) {
        history.value.redo = []
      }

      autoSave()
    }
  }

  function topComponent(index: number, userDo: boolean = true, insertHistory: boolean = true, needRedo: boolean = false) {
    const [topElement] = _currentPage.value?.componentList.splice(index, 1) ?? []
    // 添加到开头
    if (topElement) {
      if (insertHistory) {
        history.value.undo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.TOP_COMPONENT,
          swapPositions: [index, 0],
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }
      if (needRedo) {
        history.value.redo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.TOP_COMPONENT,
          swapPositions: [index, 0],
          pageId: currentPage.value?.pageId,
        })
      }
      if (userDo) {
        history.value.redo = []
      }

      _currentPage.value?.componentList!.unshift(topElement)
    }
  }

  function bottomComponent(index: number, userDo: boolean = true, insertHistory: boolean = true, needRedo: boolean = false) {
    const [topElement] = _currentPage.value?.componentList.splice(index, 1) ?? []
    // 添加到末尾
    if (topElement) {
      if (insertHistory) {
        history.value.undo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.BOTTOM_COMPONENT,
          swapPositions: [index, _currentPage.value?.componentList.length ?? 1 - 1],
          pageId: currentPage.value?.pageId,
        })
        limitOperationList()
      }
      if (needRedo) {
        history.value.redo.push({
          id: uniqueId('cache_operation'),
          type: EOperationHistory.BOTTOM_COMPONENT,
          swapPositions: [index, _currentPage.value?.componentList.length ?? 1 - 1],
          pageId: currentPage.value?.pageId,
        })
      }
      if (userDo) {
        history.value.redo = []
      }
      _currentPage.value?.componentList.push(topElement)
    }
  }

  function alignComponentWithList(type: string, needCacheAgain: boolean) {
    const list = currentComponentList.value.filter((i) => i.selected)
    if (!['canvas_right', 'canvas_left'].includes(type) && list.length <= 1) {
      return
    }

    // cache 2
    if (needCacheAgain) {
      cacheOperationHistoryWithGroup()
    }
    cacheOperationHistoryWithGroup()
    switch (type) {
      case 'left': {
        let left = list[0].left
        list.forEach((item) => {
          left = Math.min(left, item.left)
        })
        currentComponentList.value.forEach((item) => {
          if (item.selected) {
            item.left = left
          }
        })
        break
      }
      case 'right': {
        let right = list[0].left + list[0].width
        list.forEach((item) => {
          right = Math.max(right, item.left + item.width)
        })
        currentComponentList.value.forEach((item) => {
          if (item.selected) {
            item.left = right - item.width
          }
        })
        break
      }
      case 'center': {
        let center = 0
        let minX = 0
        let maxX = 0
        list.forEach((item) => {
          // center = Math.max(center, item.left + item.width / 2)
          if (minX === 0) {
            minX = item.left
          }
          minX = Math.min(minX, item.left)
          maxX = Math.max(maxX, item.left + item.width)
        })
        center = minX + (maxX - minX) / 2
        currentComponentList.value.forEach((item) => {
          if (item.selected) {
            item.left = center - item.width / 2
          }
        })
        break
      }
      case 'vertical_center': {
        let vCenter = 0
        let minY = 0
        let maxY = 0
        list.forEach((item) => {
          // vCenter = Math.max(vCenter, item.top + item.height / 2)
          if (minY === 0) {
            minY = item.top
          }
          minY = Math.min(minY, item.top)
          maxY = Math.max(maxY, item.top + item.height)
        })
        vCenter = minY + (maxY - minY) / 2
        currentComponentList.value.forEach((item) => {
          if (item.selected) {
            item.top = vCenter - item.height / 2
          }
        })
        break
      }
      case 'canvas_left':
        currentComponentList.value.forEach((item) => {
          if (item.selected) {
            item.left = 0
          }
        })
        break
      case 'canvas_right':
        currentComponentList.value.forEach((item) => {
          if (item.selected) {
            item.left = (currentPage.value?.pageSize?.pixelWidth ?? 1080) - item.width
          }
        })
        break
    }
    setSaveChange()
  }

  function deletePageInfo(index: number) {
    if (currentPageIndex.value === index) {
      selectCurrentPage(Math.max(0, index - 1))
    }
    _editorInfo.value.pageList = _editorInfo.value.pageList.filter((_, selectIndex) => index !== selectIndex)
    console.log(editorInfo.value.pageList)
    configAllPageFooter()
    selectCurrentPage(Math.max(0, index - 1))
    autoSave()
  }

  function swapPage(i: number, j: number) {
    if (i >= 0 && j >= 0 && i != j) {
      ;[_editorInfo.value.pageList[i], _editorInfo.value.pageList[j]] = [_editorInfo.value.pageList[j], _editorInfo.value.pageList[i]]
      configAllPageFooter()
      autoSave()
    }
  }

  function topPage(index: number) {
    const [topPage] = _editorInfo.value.pageList.splice(index, 1) ?? []
    // 添加到末尾
    if (topPage) {
      _editorInfo.value.pageList!.unshift(topPage)
      configAllPageFooter()
    }
  }

  function bottomPage(index: number) {
    const [topPage] = _editorInfo.value.pageList.splice(index, 1) ?? []
    // 添加到开头
    if (topPage) {
      _editorInfo.value.pageList.push(topPage)
      configAllPageFooter()
    }
  }

  function autoSave() {
    const fontList: string[] = []
    const allFontMap = useTextEditorStore().allFontMap
    _editorInfo.value.pageList.forEach((page) => {
      page.componentList.forEach((component, index) => {
        if (component.componentType === EComponentType.Text) {
          component.deltaOps.forEach((deltaOp) => {
            fontList.push(allFontMap[component.lang ?? _editorInfo.value.translationType ?? 'cn']?.[component.textType ?? 'Yaber正文']?.font ?? '')
            if (deltaOp['attributes'] && deltaOp['attributes']['font']) {
              fontList.push(deltaOp['attributes']['font'])
            }
          })
        }
      })
      // page.componentList = page.componentList.filter((component) => component.componentType && component.component)
    })
    _editorInfo.value.fontList = Array.from(new Set(fontList))
    // console.log('autoSave', _editorInfo.value.fontList)
    _editorInfo.value.hasChange = true
    // const saveString = JSON.stringify(_editorInfo.value)
    // LStorage.set(StorageKey.EditorInfo, saveString)
  }

  function initLocalStorageEditorInfo() {
    const editorStr = LStorage.get<string>(StorageKey.EditorInfo) || ''
    if (editorStr && editorStr !== '' && editorStr.startsWith('{')) {
      _editorInfo.value = JSON.parse(editorStr)

      // Clean up external image URLs from old data
      _editorInfo.value.pageList.forEach((page) => {
        page.componentList.forEach((component) => {
          if (component.imgUrl && (component.imgUrl.includes('via.placeholder.com') || component.imgUrl.includes('picsum.photos'))) {
            // Replace with local placeholder
            component.imgUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E'
          }
        })
      })

      const fontList = _editorInfo.value.fontList as string[]
      fontInitWithList(fontList)
        .then((data) => {})
        .finally(() => {
          if (_editorInfo.value.pageList.length > 0) {
            selectCurrentPage(0)
          }
        })
    }
    configAllPageFooter()

    if (!_editorInfo.value.id || _editorInfo.value.id === '') {
      _editorInfo.value.id = (projectInfo.value?.id ?? '') + editorLang.value.toUpperCase()
    }
  }

  function initLocalStorageEditorInfoWithNet(editor: Record<string, any>) {
    const editorNet = editor as IEditorInfo
    if (!editorNet.directoryType) {
      editorNet.directoryType = EDirectoryType.Auto
    }
    if (!editorNet.footerType) {
      editorNet.footerType = EFooterTypeType.Auto
    }
    if (!editorNet.dpi) {
      editorNet.dpi = defaultDpi
    }
    _editorInfo.value = cloneDeep(editorNet)
    const newFontList = _editorInfo.value.fontList as string[]
    console.log('newFontList', new Set(newFontList))
    _editorInfo.value.fontList = Array.from(new Set(newFontList))
    console.log('newFontList', new Set(newFontList))

    const fontList = _editorInfo.value.fontList as string[]
    fontInitWithList(fontList)
      .then((data) => {})
      .finally(() => {
        if (_editorInfo.value.pageList.length > 0) {
          selectCurrentPage(0)
        }
      })
    _editorInfo.value.pageList.forEach((page) => {
      if (page.pageSize && !page.pageSize.dpi) {
        page.pageSize.dpi = Number(editorNet.dpi)
        page.pageSize = configPixel(page.pageSize)
      }
      page.componentList = page.componentList.filter((component) => component.componentType && component.component)
      page.componentList.forEach((component, index) => {
        if ([EComponentType.Text, EComponentType.PageFooter, EComponentType.PageIndexNumber, EComponentType.SelfPageFooter].includes(component.componentType)) {
          const fontMap = useTextEditorStore().allFontMap[component.lang ?? editorLang.value]?.[component.textType ?? 'Yaber正文'] ?? {
            type: 'Yaber正文',
            lang: '英文',
            size: 7,
            font: 'OPlusSans3-Regular',
            pxSize: dealFontsizePt2Px(7),
          }
          component.fontName = fontMap.font
          component.fontSize = fontMap.pxSize
        }
      })
    })
    console.log('initLocalStorageEditorInfoWithNet', JSON.parse(JSON.stringify(_editorInfo.value)))
    configAllPageFooter()

    if (_editorInfo.value.pageList.length > 0) {
      selectCurrentPage(0)
    }
    if (!_editorInfo.value.id || _editorInfo.value.id === '') {
      _editorInfo.value.id = (projectInfo.value?.id ?? '') + editorLang.value.toUpperCase()
    }
  }

  function initEmptyEditor() {
    // 初始化一个空白编辑器
    _editorInfo.value = {
      projectId: 'local-project',
      description: '本地编辑器',
      id: 'local-editor',
      name: '新建项目',
      pageList: [],
      translationType: 'cn',
      directoryType: EDirectoryType.Auto,
      footerType: EFooterTypeType.Auto,
      dpi: defaultDpi,
      autoSaveTiming: 0,
      fontList: ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia']
    }
    console.log('initEmptyEditor', JSON.parse(JSON.stringify(_editorInfo.value)))
  }

  async function resizeAutoText() {
    try {
      setLoadingText('自适应字体中...')
      const lastPage = _editorInfo.value.pageList[_editorInfo.value.pageList.length - 1]
      let lastComponentId: string = ''
      if (lastPage && lastPage.componentList.length > 0) {
        lastComponentId = lastPage.componentList[lastPage.componentList.length - 1].componentId?.toString() || ''
      }
      const fontList = cloneDeep(_editorInfo.value.fontList as string[])
      for (const page of _editorInfo.value.pageList) {
        for (const component of page.componentList) {
          const doneComponentId = await resizeAutoTextSingle(component, fontList, page.lang, page.pageId.toString())
          console.log('autoSizeChange' + component.lang, doneComponentId, component.textType + '' + component.componentId)
          if (doneComponentId === lastComponentId) {
            break
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function resizeAutoCurrentPageText() {
    if (currentComponentList.value.length === 0) {
      return ''
    }
    try {
      setLoadingText('自适应字体中...')
      const lastComponentId = currentComponentList.value?.[currentComponentList.value.length - 1]?.componentId?.toString() || ''
      const fontList = cloneDeep(_editorInfo.value.fontList as string[])
      for (const component of currentComponentList.value) {
        const doneComponentId = await resizeAutoTextSingle(component, fontList, currentPage.value?.lang, currentPage.value?.pageId.toString())
        console.log('autoSizeChange' + component.lang, doneComponentId, component.textType + '' + component.componentId)
        if (doneComponentId === lastComponentId) {
          break
        }
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
      component.lang = lang ?? _editorInfo.value.translationType
    }
    if (!component.zindex) {
      component.zindex = 2
    }
    if (component.lang !== 'cn' && component.componentType === EComponentType.Text) {
      const changeData: any = await configTextComponentAutoResize(component, fontList, lang ?? 'en')
      // console.log('autoSizeChange' + component.lang, changeData, component.textType + '' + component.componentId)
      if (changeData.change) {
        component.hasChange = (component.hasChange ?? 0) + 1
        _editorInfo.value.hasChange = true
        // console.log('autoSizeChange', component.text)
        if (_currentPage.value?.pageId.toString() === pageId) {
          autoTextResize.value++
        }
      }
    }

    return component.componentId
  }

  function clickCurrentPageComponentAction(item?: IComponentAddTypeItem) {
    if (_currentPage.value) {
      _currentPage.value.addComponentAction = item
    }
  }

  function clearComponentAction() {
    if (_currentPage.value) {
      _currentPage.value.addComponentAction = null
    }
  }

  function setLoading(show: boolean) {
    loading.value = show
  }

  function setLoadingText(text: string) {
    loadingText.value = text
  }

  function setShowPdfProgressValue(value: boolean) {
    pdfExportProgressValue.value = 0
    showPdfExportProgress.value = value
  }

  function setPdfProgressValue(value: number) {
    pdfExportProgressValue.value = Math.min(100, value)
  }

  function setProjectId(value: string | undefined) {
    if (!projectInfo.value) {
      projectInfo.value = {}
    }
    projectInfo.value.id = value
  }

  function setProjectName(value: string) {
    if (!projectInfo.value) {
      projectInfo.value = {}
    }
    projectInfo.value.name = value
  }

  function saveSuccess() {
    _editorInfo.value.hasChange = false
  }

  function setSaveChange() {
    _editorInfo.value.hasChange = true
  }

  function setExportStatus(show: boolean) {
    exportStatus.value = show
  }

  function addPageWithTemplate(pageInfoForm: IEditorPageInfo) {
    const pageSize = pageList.value?.[0].pageSize ?? pageInfoForm.pageSize
    let nowTime = new Date().getTime()
    const pageInfo: IEditorPageInfo = {
      pageSize: pageSize,
      componentList: [],
      pageId: editorInfo.value.id + 'P' + nowTime.toString(),
      id: undefined,
      lang: editorLang.value,
      lines: {
        h: [],
        v: [],
      },
    }
    pageInfoForm.componentList.forEach((component) => {
      nowTime += 100
      component.componentId = pageInfo?.pageId + 'C' + nowTime.toString()
      component.id = component.componentId
      pageInfo.componentList.push(component)
    })
    _editorInfo.value.pageList.push(pageInfo)
    if (pageSize) {
      refreshPostInfo(pageSize)
    }
    configAllPageFooter()
    selectCurrentPage(_editorInfo.value.pageList.length - 1)
    // _currentPage.value = _editorInfo.value.pageList[_editorInfo.value.pageList.length - 1]
  }

  function setPageToAction(index: number, toAction: boolean, action: EPageType) {
    if (_editorInfo.value.pageList.length > 0) {
      _editorInfo.value.pageList[index].type = toAction ? action : EPageType.Default
      const coverPages = _editorInfo.value.pageList.filter((page) => page.type === EPageType.Cover)
      const directoryPages = _editorInfo.value.pageList.filter((page) => page.type === EPageType.Directory)
      if (coverPages.length > -1 || directoryPages.length > -1) {
        _editorInfo.value.pageList = _editorInfo.value.pageList.filter((page) => !page.type || (page.type as EPageType) === EPageType.Default)
        if (directoryPages.length > -1) {
          _editorInfo.value.pageList.unshift(...directoryPages)
        }
        if (coverPages.length > -1) {
          _editorInfo.value.pageList.unshift(...coverPages)
        }
      }
      configAllPageFooter()
    }
  }

  function addDirectoryPage(pageInfos: IEditorPageInfo[]) {
    const directoryIndex = _editorInfo.value.pageList.findIndex((page) => page.type === EPageType.Directory)

    if (directoryIndex >= 0) {
      const directoryLength = _editorInfo.value.pageList.filter((page) => page.type === EPageType.Directory).length
      _editorInfo.value.pageList.splice(directoryIndex, directoryLength, ...pageInfos)
    } else {
      const coverIndex = _editorInfo.value.pageList.findIndex((page) => page.type === EPageType.Cover)
      const coverLength = _editorInfo.value.pageList.filter((page) => page.type === EPageType.Cover).length
      const muitlDirectoryIndex = _editorInfo.value.pageList.findIndex((page) => page.type === EPageType.MultilingualDirectory)
      const muitlDirectoryLength = _editorInfo.value.pageList.filter((page) => page.type === EPageType.MultilingualDirectory).length
      let startIndex = coverIndex + coverLength
      if (muitlDirectoryIndex > -1) {
        startIndex = muitlDirectoryIndex + muitlDirectoryLength
      }
      if (startIndex < 0) {
        startIndex = 0
      }
      _editorInfo.value.pageList.splice(startIndex, 0, ...pageInfos)
    }
    _editorInfo.value.hasChange = true
    selectCurrentPage(Math.max(currentPageIndex.value, 0))
    configAllPageFooter()
  }

  function resetDirectoryPage(directoryNum: number) {
    _editorInfo.value.pageList.forEach((pageInfo) => {
      if (pageInfo.type === EPageType.Directory) {
        pageInfo.componentList.forEach((component) => {
          if (component.componentType === EComponentType.PageIndexNumber && component.deltaOps[0] && component.deltaOps[0].insert) {
            const index = Number(component.deltaOps[0].insert)
            component.deltaOps[0].insert = (index + directoryNum).toString()
          }
        })
      }
    })
  }

  function configAllPageFooter() {
    if (_editorInfo.value.footerType !== EFooterTypeType.Auto) {
      return
    }

    // if(editorLang.value !== 'combine'){
    //
    // }else {
    //
    // }
    const directoryIndex = 0
    // let directoryIndex = _editorInfo.value.pageList.findIndex((page) => page.type === EPageType.Directory)
    // if (directoryIndex >= 0) {
    //   const directoryLength = _editorInfo.value.pageList.filter((page) => page.type === EPageType.Directory).length
    //   directoryIndex = directoryIndex + directoryLength
    // } else {
    //   directoryIndex = 0
    // }

    const coverNum = _editorInfo.value.pageList.filter((page) => page.type === EPageType.Cover).length
    let nowTime = new Date().getTime()
    const textType = useTextEditorStore().allFontMap[editorLang.value]?.['Yaber正文'] ?? {
      type: 'Yaber正文',
      lang: '中文',
      size: 7,
      font: 'OPlusSans3-Regular',
      pxSize: dealFontsizePt2Px(7),
    }
    _editorInfo.value.pageList.forEach((page, index) => {
      const fonderIndex = page.componentList.findIndex((component) => component.componentType === EComponentType.PageFooter)
      if (page.type !== EPageType.Cover && page.type !== EPageType.MultilingualDirectory) {
        if (fonderIndex > -1) {
          page.pageFooterNum = index - directoryIndex + 1 - coverNum
          const footer = page.componentList[fonderIndex]
          // footer.width = defaultSketchRulerWidth
          // footer.height = 80
          // footer.top = page.pageSize!.pixelHeight! - 100
          // footer.left = page.pageSize!.pixelWidth! - defaultSketchRulerWidth*2
          footer.deltaOps = [
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
            width: defaultSketchRulerWidth,
            height: 80,
            lang: page.lang ?? editorLang.value,
            top: page.pageSize!.pixelHeight! - 100,
            left: page.pageSize!.pixelWidth! - defaultSketchRulerWidth * 2,
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
      } else {
        if (fonderIndex > -1) {
          page.componentList.splice(fonderIndex, 1)
        }
      }
    })
  }

  function setEditorConfig(config: Record<string, any>) {
    if (_editorInfo.value) {
      _editorInfo.value.directoryType = config.directoryType
      _editorInfo.value.footerType = config.footerType
    }
  }

  function resetPageList(pageList: IEditorPageInfo[]) {
    _editorInfo.value.pageList = pageList
    if (_editorInfo.value.translationType === Combine_Lang) {
      resetDirectoryPageWithIndex()
    }
    configAllPageFooter()
    selectCurrentPage(Math.max(currentPageIndex.value, 0))
  }

  function resetDirectoryPageWithIndex() {
    const directoryList = _editorInfo.value.pageList.filter((item) => item.type === EPageType.Directory)
    if (directoryList.length > 0) {
      const firstLang = directoryList[0].lang
      const firstDirectoryIndex = directoryList.filter((item) => item.lang === firstLang).length
      resetDirectoryPage(firstDirectoryIndex)
    }
  }

  function limitOperationList() {
    if (history.value && history.value.undo.length > 30) {
      history.value.undo.splice(0, history.value.undo.length - 30)
    }
    console.log('limitOperationList', history.value)
  }

  function undoOperationWithType() {
    console.log('undoOperationWithType', new Date().getTime(), cloneDeep(history.value))
    if (!currentPage.value || history.value.undo.length === 0) {
      return
    }
    const lastUndo = history.value.undo.pop() as IOperationHistory
    console.log('undoOperationWithType1', new Date().getTime(), cloneDeep(history.value))
    switch (lastUndo.type) {
      case EOperationHistory.ADD_COMPONENT:
        if (lastUndo.component) {
          deleteComponent(lastUndo.component, false, false, true)
        }
        break
      case EOperationHistory.ADD_GROUP_COMPONENT:
        if (lastUndo.components) {
          deleteComponentWithGroup(lastUndo.components, false, false, true)
        }
        break
      case EOperationHistory.UPDATE_COMPONENT:
        if (lastUndo.component) {
          updateCurrentComponent(lastUndo.component, false, false, true)
        }
        break
      case EOperationHistory.UPDATE_COMPONENT_TEXT:
        if (lastUndo.componentId) {
          updateCurrentComponentJustText(lastUndo.componentId, lastUndo.deltaOps, false, false, true)
        }
        break
      case EOperationHistory.UPDATE_COMPONENT_STYLE:
        if (lastUndo.componentId) {
          updateCurrentComponentJustStyle(lastUndo.componentId, lastUndo.divStyle, false, false, true)
        }
        break
      case EOperationHistory.DELETE_COMPONENT:
        if (lastUndo.component) {
          _currentPage.value?.componentList.push(lastUndo.component)
          history.value.redo.push({...lastUndo, type: EOperationHistory.ADD_COMPONENT})
        }
        break
      case EOperationHistory.DELETE_GROUP_COMPONENT:
        if (lastUndo.components) {
          addNewComponentWithGroup(lastUndo.components, false, false, true)
        }
        break
      case EOperationHistory.SWAP_COMPONENT:
        if (lastUndo.swapPositions && lastUndo.swapPositions.length > 1) {
          swapComponent(lastUndo.swapPositions[1], lastUndo.swapPositions[0], false, false, true)
        }
        break
      case EOperationHistory.TOP_COMPONENT:
      case EOperationHistory.BOTTOM_COMPONENT:
        if (lastUndo.swapPositions) {
          swapComponent(lastUndo.swapPositions[1], lastUndo.swapPositions[0], false, false, true)
        }
        break
      case EOperationHistory.UPDATE_GROUP_COMPONENT:
        if (lastUndo.components && lastUndo.components?.length > 0) {
          const redoComponents: IComponentInfo[] = []
          lastUndo.components.forEach((component: IComponentInfo) => {
            const changeIndex = _currentPage.value?.componentList.findIndex((item) => item.componentId === component.componentId) ?? -1
            if (changeIndex > -1 && _currentPage.value?.componentList[changeIndex]) {
              redoComponents.push(_currentPage.value.componentList[changeIndex])
              _currentPage.value.componentList[changeIndex] = cloneDeep(component)
            }
          })
          history.value.redo.push({...lastUndo, components: cloneDeep(redoComponents)})
        }
        break
    }
    console.log('limitOperationList', history.value)
  }

  function redoOperationWithType() {
    console.log('redoOperationWithType', cloneDeep(history.value))
    if (!currentPage.value || history.value.redo.length === 0) {
      return
    }

    const lastRedo = history.value.redo.pop() as IOperationHistory
    console.log('redoOperationWithType1', cloneDeep(history.value))
    switch (lastRedo.type) {
      case EOperationHistory.ADD_COMPONENT:
        if (lastRedo.component) {
          deleteComponent(lastRedo.component, false, true)
        }
        break
      case EOperationHistory.ADD_GROUP_COMPONENT:
        if (lastRedo.components) {
          deleteComponentWithGroup(lastRedo.components, false, true)
        }
        break
      case EOperationHistory.UPDATE_COMPONENT:
        if (lastRedo.component) {
          updateCurrentComponent(lastRedo.component, false, true)
        }
        break
      case EOperationHistory.UPDATE_COMPONENT_TEXT:
        if (lastRedo.componentId) {
          updateCurrentComponentJustText(lastRedo.componentId, lastRedo.deltaOps, false, true)
        }
        break
      case EOperationHistory.UPDATE_COMPONENT_STYLE:
        if (lastRedo.componentId) {
          updateCurrentComponentJustStyle(lastRedo.componentId, lastRedo.divStyle, false, true)
        }
        break
      case EOperationHistory.DELETE_COMPONENT:
        if (lastRedo.component) {
          _currentPage.value?.componentList.push(lastRedo.component)
          history.value.undo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.ADD_COMPONENT,
            component: cloneDeep(lastRedo.component),
            pageId: currentPage.value?.pageId,
          })
          limitOperationList()
        }
        break
      case EOperationHistory.DELETE_GROUP_COMPONENT:
        if (lastRedo.components) {
          addNewComponentWithGroup(lastRedo.components, false, true)
        }
        break
      case EOperationHistory.SWAP_COMPONENT:
        if (lastRedo.swapPositions && lastRedo.swapPositions.length > 1) {
          swapComponent(lastRedo.swapPositions[1], lastRedo.swapPositions[0], false, true)
        }
        break
      case EOperationHistory.TOP_COMPONENT:
      case EOperationHistory.BOTTOM_COMPONENT:
        if (lastRedo.swapPositions) {
          swapComponent(lastRedo.swapPositions[1], lastRedo.swapPositions[0], false, true)
        }
        break
      case EOperationHistory.UPDATE_GROUP_COMPONENT:
        if (lastRedo.components && lastRedo.components?.length > 0) {
          const undoComponents: IComponentInfo[] = []
          lastRedo.components.forEach((component: IComponentInfo) => {
            const changeIndex = _currentPage.value?.componentList.findIndex((item) => item.componentId === component.componentId) ?? -1
            if (changeIndex > -1 && _currentPage.value?.componentList[changeIndex]) {
              undoComponents.push(_currentPage.value.componentList[changeIndex])
              _currentPage.value.componentList[changeIndex] = cloneDeep(component)
            }
          })
          history.value.undo.push({
            id: uniqueId('cache_operation'),
            type: EOperationHistory.UPDATE_GROUP_COMPONENT,
            components: cloneDeep(undoComponents),
            pageId: currentPage.value?.pageId,
          })
        }
        break
    }
  }

  function cacheOperationHistoryWithGroup(type: EOperationHistory = EOperationHistory.UPDATE_GROUP_COMPONENT, component?: IComponentInfo) {
    if (type === EOperationHistory.UPDATE_GROUP_COMPONENT) {
      history.value.undo.push({
        id: uniqueId('cache_operation'),
        type: type,
        components: cloneDeep(currentComponentList.value.filter((i) => i.selected)),
        pageId: currentPage.value?.pageId,
      })
      history.value.redo = []
    } else if (component && type === EOperationHistory.UPDATE_COMPONENT) {
      history.value.undo.push({
        id: uniqueId('cache_operation'),
        type: type,
        component: cloneDeep(component),
        pageId: currentPage.value?.pageId,
      })
      history.value.redo = []
    }
    console.log('cacheOperationHistoryWithGroup ', new Date().getTime(), cloneDeep(history.value))
    limitOperationList()
  }

  function clearOperationHistoryWithGroup(type: EOperationHistory = EOperationHistory.UPDATE_GROUP_COMPONENT, dragData: DragData, component: IComponentInfo, changeType: string) {
    const groupList = history.value.undo.filter((item) => item.type === type)
    if (groupList.length > 0) {
      const lastUpdatedGroup = groupList[groupList.length - 1] as any
      const lastUpdatedItem = lastUpdatedGroup.components?.find((item: any) => item.componentId === component.componentId) ?? lastUpdatedGroup.component
      switch (changeType) {
        case 'drag':
          if (lastUpdatedItem && lastUpdatedItem.left === dragData.left && lastUpdatedItem.top === dragData.top) {
            // delete
            history.value.undo = history.value.undo.filter((item) => item.id !== lastUpdatedGroup.id)
          }
          break
        case 'resize':
          if (lastUpdatedItem && lastUpdatedItem.width === dragData.width && lastUpdatedItem.height === dragData.height) {
            history.value.undo = history.value.undo.filter((item) => item.id !== lastUpdatedGroup.id)
          }
          break
        case 'rotate':
          if (lastUpdatedItem && lastUpdatedItem.angle === dragData.angle) {
            history.value.undo = history.value.undo.filter((item) => item.id !== lastUpdatedGroup.id)
          }
          break
      }
    }
    console.log('clearOperationHistoryWithGroup ', new Date().getTime(), history.value)
  }

  function isometricComponentWithGroup(type: string) {
    if (!currentPage.value) {
      return
    }

    cacheOperationHistoryWithGroup(EOperationHistory.UPDATE_GROUP_COMPONENT)
    let selectComponent = [] as IComponentInfo[]
    if (type === 'verticalIsometric') {
      console.log('selectComponent', cloneDeep(currentComponentList.value.filter((item) => item.selected)))
      selectComponent = cloneDeep(cloneDeep(currentComponentList.value.filter((item) => item.selected))).sort((a: IComponentInfo, b: IComponentInfo) => {
        return a.top - b.top
      })
      console.log('selectComponent', cloneDeep(selectComponent))
      const maxBottomComponent = selectComponent[selectComponent.length - 1]
      const minTopComponent = selectComponent[0]
      let sunLength = maxBottomComponent.top + maxBottomComponent.height - minTopComponent.top
      selectComponent.forEach((item) => {
        sunLength -= item.height
      })
      const numReduce = Number((sunLength / (selectComponent.length - 1)).toFixed(3))
      selectComponent.forEach((item, index) => {
        if (index > 0 && index < selectComponent.length - 1) {
          item.top = selectComponent[index - 1].top + selectComponent[index - 1].height + numReduce
        }
      })
      console.log('numReduce', numReduce)
      console.log('selectComponent', selectComponent)
    } else {
      selectComponent = cloneDeep(
        cloneDeep(currentComponentList.value.filter((item) => item.selected)).sort((a: IComponentInfo, b: IComponentInfo) => {
          return a.left - b.left
        }),
      )
      const maxRightComponent = selectComponent[selectComponent.length - 1]
      const minLeftComponent = selectComponent[0]

      let sunLength = maxRightComponent.left + maxRightComponent.width - minLeftComponent.left
      selectComponent.forEach((item) => {
        sunLength -= item.width
      })
      const numReduce = Number((sunLength / (selectComponent.length - 1)).toFixed(3))
      selectComponent.forEach((item, index) => {
        if (index > 0 && index < selectComponent.length - 1) {
          item.left = selectComponent[index - 1].left + selectComponent[index - 1].width + numReduce
        }
      })
      console.log('selectComponent', selectComponent)
    }
    currentComponentList.value.forEach((item, index) => {
      if (item.selected) {
        const findItem = selectComponent.find((select: any) => select.componentId === item.componentId)
        if (findItem) {
          item.top = findItem.top
          item.left = findItem.left
        }
      }
    })
  }

  function appliedToAllPage(element: IComponentInfo) {
    const copyElement = cloneDeep(element)
    let newComponentIdTime = new Date().getTime()
    _editorInfo.value.pageList.forEach((page) => {
      if (page.pageId !== currentPage.value?.pageId) {
        newComponentIdTime += 100
        const newComponentId = page?.pageId + 'C' + newComponentIdTime.toString()
        page.componentList.push({
          ...copyElement,
          componentId: newComponentId,
          id: newComponentId,
          lang: page.lang ?? editorLang.value,
        })
      }
    })
  }

  function topListPage(pageIds: any[]) {
    const selectPageId = currentPage.value?.pageId || ''
    const topPageList = _editorInfo.value.pageList.filter((item) => pageIds.includes(item.pageId ?? ''))
    _editorInfo.value.pageList = _editorInfo.value.pageList.filter((item) => !pageIds.includes(item.pageId ?? ''))
    _editorInfo.value.pageList.splice(0, 0, ...topPageList)
    configAllPageFooter()
    selectCurrentPage(_editorInfo.value.pageList.findIndex((page) => page.pageId === selectPageId))
  }

  function bottomListPage(pageIds: any[]) {
    const selectPageId = currentPage.value?.pageId || ''
    const bottomPageList = _editorInfo.value.pageList.filter((item) => pageIds.includes(item.pageId ?? ''))
    _editorInfo.value.pageList = _editorInfo.value.pageList.filter((item) => !pageIds.includes(item.pageId ?? ''))
    _editorInfo.value.pageList.push(...bottomPageList)
    configAllPageFooter()
    selectCurrentPage(_editorInfo.value.pageList.findIndex((page) => page.pageId === selectPageId))
  }

  function moveListPage(pageIds: any[], pageIndexs: number[], type: string, index: number = 0) {
    const selectPageId = currentPage.value?.pageId || ''
    const topPageList = _editorInfo.value.pageList.filter((item) => pageIds.includes(item.pageId ?? ''))
    let firstIndex = Math.max(Math.min(...pageIndexs) - 1, 0)
    _editorInfo.value.pageList = _editorInfo.value.pageList.filter((item) => !pageIds.includes(item.pageId ?? ''))
    if (type === 'list-moveDown') {
      firstIndex = Math.min(Math.min(...pageIndexs) + 1, _editorInfo.value.pageList.length - 1)
    }
    if (type === 'insert-list' && index > 0) {
      firstIndex = Math.min(Math.max(index - 1, 0), _editorInfo.value.pageList.length - 1)
    }
    _editorInfo.value.pageList.splice(firstIndex, 0, ...topPageList)
    configAllPageFooter()
    selectCurrentPage(_editorInfo.value.pageList.findIndex((page) => page.pageId === selectPageId))
  }

  function applyLineInAllPage({vertical, value}: {vertical: boolean; value: number}) {
    _editorInfo.value.pageList.forEach((page) => {
      if (page.pageId !== currentPage.value?.pageId) {
        if (!page.lines) {
          page.lines = {h: [], v: []}
        }
        if (vertical) {
          page.lines.h.push(value)
        } else {
          page.lines.v.push(value)
        }
      }
    })
  }

  function switchMarkLine() {
    _post.value.isShowReferLine = !_post.value.isShowReferLine
  }

  function deleteAllMarkLine() {
    _post.value.lines = {h: [], v: []}
  }

  function deleteAllPageMarkLine() {
    _post.value.lines = {h: [], v: []}
    editorInfo.value.pageList.forEach((page) => {
      page.lines = {h: [], v: []}
    })
  }

  function removeTermWithComponentId({componentId, leafText, formats, range}: any) {
    const findItem = _currentPage.value?.componentList.find((item) => item.componentId === componentId) as IComponentInfo
    if (!findItem) {
      return
    }

    let allIndex = 0
    findItem.deltaOps.forEach((delta) => {
      const preIndex = allIndex
      allIndex += delta.insert?.length || 0
      if (delta.insert === leafText && range.index >= preIndex && range.index <= allIndex) {
        // const findIndexFirst = findItem.text?.indexOf(leafText[0])
        // const findIndexEnd = findItem.text?.indexOf(leafText.toString()[leafText.length - 1])
        // console.log('findIndex', findIndexFirst, findIndexEnd)
        if (delta.attributes && Object.prototype.hasOwnProperty.call(delta.attributes, 'term-custom-style')) {
          delete delta.attributes['term-custom-style']
        }
      }
    })
    findItem.hasChange = (findItem.hasChange ?? 0) + 1
    autoSave()
  }

  function editGroupOrUngroup() {
    const groupId = currentComponent.value?.groupId
    if (groupId) {
      currentComponentList.value.forEach((item) => {
        if (item.groupId === groupId) {
          item.groupId = undefined
          item.groupName = undefined
        }
      })
    } else {
      const groupId = currentPage.value?.pageId + 'G' + new Date().getTime().toString()
      currentComponentList.value.forEach((item) => {
        if (item.selected) {
          item.groupId = groupId
          item.groupName = undefined
        }
      })
    }
  }

  function resetCurrentComponentGroupName(groupId?: string | number | undefined, groupName?: string) {
    if (_currentPage.value && groupId) {
      _currentPage.value.componentList.forEach((item: IComponentInfo) => {
        if (item.groupId === groupId) {
          item.groupName = groupName
        }
      })
    }
  }

  function resetPagePost() {
    _editorInfo.value.pageList.forEach((page) => {
      page.zoomData = undefined
    })
  }

  function setAutoSaveTiming(newValue: number) {
    console.log('setAutoSaveTiming', newValue)
    _editorInfo.value.autoSaveTiming = newValue
  }

  return {
    editorInfo,
    addNewComponent,
    addNewComponentByArea,
    deleteComponent,
    deletePageInfo,
    updateCurrentComponentText,
    updateCurrentComponent,
    disableEdit,
    groupSelect,
    post,
    currentComponent,
    currentComponentList,
    currentPage,
    cpuScale,
    pageList,
    setScale,
    setZoomData,
    setCurrentComponentSelected,
    setCurrentPageSize,
    addNewPageInfoBySize,
    selectCurrentPage,
    initLocalStorageEditorInfo,
    clickCurrentPageComponentAction,
    clearComponentAction,
    loading,
    setLoading,
    loadingText,
    setLoadingText,
    pdfExportProgressValue,
    setPdfProgressValue,
    setShowPdfProgressValue,
    showPdfExportProgress,
    scaleByUser,
    editorLang,
    addComponentAction,
    addComponentActionAuto,
    setProjectId,
    setProjectName,
    projectInfo,
    currentPageIndex,
    initLocalStorageEditorInfoWithNet,
    initEmptyEditor,
    saveSuccess,
    exportStatus,
    setExportStatus,
    addPageWithTemplate,
    bottomComponent,
    topComponent,
    swapComponent,
    topPage,
    bottomPage,
    swapPage,
    setPageToAction,
    addDirectoryPage,
    configAllPageFooter,
    resetDirectoryPage,
    setEditorConfig,
    resetPageList,
    autoTextResize,
    setSaveChange,
    resizeAutoText,
    alignComponentWithList,
    undoOperationWithType,
    redoOperationWithType,
    cacheOperationHistoryWithGroup,
    appliedToAllPage,
    topListPage,
    bottomListPage,
    moveListPage,
    applyLineInAllPage,
    updateCurrentComponentStyle,
    clearOperationHistoryWithGroup,
    updateCurrentComponentWithResize,
    refreshCenterLayoutStatus,
    addNewComponentWithGroup,
    deleteComponentWithGroup,
    resizeAutoCurrentPageText,
    switchMarkLine,
    deleteAllMarkLine,
    deleteAllPageMarkLine,
    removeTermWithComponentId,
    isometricComponentWithGroup,
    editGroupOrUngroup,
    resetCurrentComponentGroupName,
    panzoomOption,
    resetPagePost,
    updateCurrentTextOverflowState,
    updateCurrentTable,
    setAutoSaveTiming,
    hasSelectedComponent,
  }
})
