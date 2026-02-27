import {Combine_Lang, EComponentType, EPageType, type IComponentInfo, type IEditorPageInfo, type IPageSize} from '@/view/editor/utils/common-modle'
import {EditorComponent} from '@/view/editor/component/editorComponentInit'
import {defaultSketchRulerWidth} from '@/store/editorStore'
import {netTranslateText} from '@/net/editorNet'
import {LStorage} from '@/lib/storage'

export async function updateCombineDirectory(pageList: IEditorPageInfo[], editorLang: string, editorId: string, allFontMap: Record<string, any>) {
  if (pageList.length <= 0) {
    return []
  }
  if (editorLang === Combine_Lang && pageList.length > 0) {
    const topPageList = pageList.filter((page) => page.type === EPageType.Cover || page.type === EPageType.MultilingualDirectory)
    const directoryMap: Record<string, any> = {}

    pageList
      .filter((item) => !item.type || (item.type as EPageType) === EPageType.Default)
      .forEach((page) => {
        if (page.lang) {
          if (directoryMap[page.lang ?? 'en']) {
            directoryMap[page.lang ?? 'en'].push(page)
          } else {
            directoryMap[page.lang ?? 'en'] = [page]
          }
        }
      })

    const multilPageIndex = []
    const keys = Object.keys(directoryMap)
    if (keys.length > 0) {
      for (const key of keys) {
        if (!directoryMap[key] || directoryMap[key].length === 0) {
          break
        }
        const directoryList: Record<string, any>[] = configDirectoryList(directoryMap[key])
        const directoryPageList: IEditorPageInfo[] = []
        const nowTime = new Date().getTime()
        await addDirectory(directoryList, nowTime, true, directoryPageList, key, editorId, pageList[0]!.pageSize!, allFontMap)
        const startDirectoryIndex = topPageList.length
        topPageList.push(...directoryPageList, ...directoryMap[key])
        resetDirectoryPage(directoryPageList, startDirectoryIndex)
        multilPageIndex.push([startDirectoryIndex, topPageList.length - 1])
      }
      return topPageList
    } else {
      return pageList
    }
  } else {
    return []
  }
}

export async function updateSingleDirectory(pageList: IEditorPageInfo[], editorLang: string, editorId: string, allFontMap: Record<string, any>) {
  if (pageList.length <= 0) {
    return []
  }

  const contentList = pageList.filter((item) => !item.type || (item.type as EPageType) === EPageType.Default || item.type === EPageType.ManualDirectory)
  const directoryList: Record<string, any>[] = configDirectoryList(contentList)
  const nowTime = new Date().getTime()
  const directoryPageList: IEditorPageInfo[] = []
  await addDirectory(directoryList, nowTime, true, directoryPageList, editorLang, editorId, pageList[0]!.pageSize!, allFontMap)
  return directoryPageList
}

export function resetDirectoryPage(pageList: IEditorPageInfo[], startDirectoryIndex: number) {
  pageList.forEach((pageInfo) => {
    if (pageInfo.type === EPageType.Directory) {
      pageInfo.componentList.forEach((component) => {
        if (component.componentType === EComponentType.PageIndexNumber && component.deltaOps[0] && component.deltaOps[0].insert) {
          const index = Number(component.deltaOps[0].insert)
          component.deltaOps[0].insert = (index + startDirectoryIndex).toString()
        }
      })
    }
  })
}

export function configDirectoryList(pageList: IEditorPageInfo[]) {
  const directoryList: Record<string, any>[] = []
  pageList.forEach((page, index) => {
    // const firstTitleIndex = page.componentList?.findIndex((component) => component.componentType === EComponentType.Text && component.textType?.includes('一级标题'))
    // const secondTitleComponents = page.componentList?.filter((component) => component.componentType === EComponentType.Text && component.textType?.includes('二级标题'))
    // const thirdTitleComponents = page.componentList?.filter((component) => component.componentType === EComponentType.Text && component.textType?.includes('三级标题'))
    // if (firstTitleIndex > -1) {
    //   const firstItem = page.componentList[firstTitleIndex]
    //   directoryList.push({text: firstItem.text, index: index, titleLevel: 0})
    // }
    page.componentList.forEach((component) => {
      if (component.componentType === EComponentType.Text && component.textType?.includes('标题')) {
        let titleLevel = 2
        if (component.textType?.includes('一级标题')) {
          titleLevel = 0
        } else if (component.textType?.includes('二级标题')) {
          titleLevel = 1
        } else if (component.textType?.includes('三级标题')) {
          titleLevel = 2
        }
        const addItem = {text: component.text, index: index, titleLevel: titleLevel, prefixIndex: '', children: []}
        if (titleLevel === 0) {
          directoryList.push(addItem)
        } else if (titleLevel === 1) {
          const lastDirectory = directoryList[directoryList.length - 1]
          if (lastDirectory) {
            addItem.prefixIndex = lastDirectory.children.length + 1 + ''
            lastDirectory.children.push(addItem)
          } else {
            directoryList.push({
              text: '',
              prefixIndex: '1',
              index: index,
              titleLevel: 0,
              children: [addItem],
            })
          }
        } else if (titleLevel === 2) {
          const lastDirectory = directoryList[directoryList.length - 1]
          if (lastDirectory) {
            const lastSecondDirectory = lastDirectory.children[lastDirectory.length - 1]
            if (lastSecondDirectory) {
              addItem.prefixIndex = lastSecondDirectory.prefixIndex + '.' + lastSecondDirectory.children.length + 1
              lastSecondDirectory.children.push(addItem)
            } else {
              lastDirectory.children.push({
                text: '',
                prefixIndex: '1.1',
                index: index,
                titleLevel: 1,
                children: [addItem],
              })
            }
          } else {
            directoryList.push({
              text: '',
              prefixIndex: '1',
              index: index,
              titleLevel: 0,
              children: [
                {
                  text: '',
                  prefixIndex: '1.1',
                  index: index,
                  titleLevel: 1,
                  children: [addItem],
                },
              ],
            })
          }
        }
      }
    })
  })

  // let firstPageIndex = 0
  const directoryNewList: Record<string, any>[] = []
  console.log('directoryList', directoryList)
  directoryList.forEach((directory, index) => {
    directoryNewList.push(directory)
    if (directory.children.length > 0) {
      directory.children.forEach((secondItem: any) => {
        directoryNewList.push(secondItem)
        if (secondItem.children.length > 0) {
          secondItem.children.forEach((thirdItem: any) => {
            directoryNewList.push(thirdItem)
          })
        }
      })
    }
  })
  return directoryNewList
}

export async function addDirectory(data: Record<string, any>[], nowTime: number, startNew: boolean = false, directoryPageList: IEditorPageInfo[], lang: string, editorId: string, pageSize: IPageSize, allFontMap: Record<string, any>) {
  let newNowTime = nowTime + 100
  const pageInfo: IEditorPageInfo = {
    id: editorId + 'P' + nowTime.toString(),
    pageId: editorId + 'P' + nowTime.toString(),
    pageSize: pageSize,
    type: EPageType.Directory,
    lang: lang,
    componentList: [],
  }

  const fontSizeMap = allFontMap[lang ?? 'cn'] ?? allFontMap['en']
  const fontTitleType = fontSizeMap['Yaber目录标题'] ?? {
    type: 'Yaber目录标题',
    lang: '中文',
    size: 18,
    font: 'OPlusSans3-Regular',
    pxSize: 63,
  }

  let fontType = fontSizeMap['Yaber目录'] ?? {
    type: 'Yaber目录',
    lang: '中文',
    size: 10,
    font: 'OPlusSans3-Regular',
    pxSize: 35,
  }

  const fontIndexType = fontSizeMap['Yaber目录二级'] ?? {
    type: 'Yaber目录二级',
    lang: '中文',
    size: 8,
    font: 'OPlusSans3-Regular',
    pxSize: 35,
  }
  newNowTime += 100
  let prePositionEnd = 0
  if (startNew) {
    let catalogDes = lang === 'cn' ? '目录' : lang === 'en' ? 'Catalog' : ''
    if (!['cn', 'en'].includes(lang)) {
      catalogDes = LStorage.get<string>('catalog-' + lang) ?? 'Catalog'
    }
    pageInfo.componentList.push({
      id: pageInfo.pageId + 'C' + newNowTime.toString(),
      componentId: pageInfo.pageId + 'C' + newNowTime.toString(),
      componentType: EComponentType.Text,
      component: EditorComponent.QUILL_TEXT,
      width: pageSize!.pixelWidth! - defaultSketchRulerWidth * 2,
      height: Math.ceil(fontTitleType.pxSize * 1.75) + 12,
      top: Number(defaultSketchRulerWidth),
      left: defaultSketchRulerWidth,
      textType: 'Yaber目录标题',
      lang: lang,
      deltaOps: [
        {
          insert: catalogDes,
        },
      ],
      zindex: 2,
      fontName: fontTitleType.font,
      fontSize: fontTitleType.pxSize,
    } as IComponentInfo)
    prePositionEnd = Math.ceil(fontTitleType.pxSize * 1.75) + 70 + 12
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as any
    if (item.text && item.text !== '') {
      if (prePositionEnd >= pageInfo.pageSize!.pixelHeight! - defaultSketchRulerWidth * 2) {
        // next page
        newNowTime += 100
        directoryPageList.push(pageInfo)
        await addDirectory(data.slice(i, data.length), newNowTime, false, directoryPageList, lang, editorId, pageSize, allFontMap)
        break
      }
      newNowTime += 100
      let textLeft = defaultSketchRulerWidth
      if (item['titleLevel'] === 0) {
        fontType = fontSizeMap['Yaber目录'] ?? {
          type: 'Yaber目录',
          lang: '中文',
          size: 10,
          font: 'OPlusSans3-Regular',
          pxSize: 35,
        }
      } else if (item['titleLevel'] === 1) {
        fontType = fontSizeMap['Yaber目录二级'] ?? {
          type: 'Yaber目录二级',
          lang: '中文',
          size: 8,
          font: 'OPlusSans3-Regular',
          pxSize: 35,
        }
        textLeft = textLeft + 40
      } else if (item['titleLevel'] === 2) {
        fontType = fontSizeMap['Yaber目录三级'] ?? {
          type: 'Yaber目录三级',
          lang: '中文',
          size: 6,
          font: 'OPlusSans3-Regular',
          pxSize: 35,
        }
        textLeft = textLeft + 80
      }
      prePositionEnd += i === 0 ? fontType.pxSize : 0
      pageInfo.componentList.push({
        id: pageInfo.pageId + 'C' + newNowTime.toString(),
        componentId: pageInfo.pageId + 'C' + newNowTime.toString(),
        componentType: EComponentType.Text,
        component: EditorComponent.QUILL_TEXT,
        width: pageSize!.pixelWidth! - defaultSketchRulerWidth * 2 - (item['titleLevel'] == 0 ? 100 : item['titleLevel'] == 1 ? 60 : 20),
        height: Math.ceil(fontType.pxSize * 1.25) + 32,
        top: prePositionEnd,
        left: textLeft,
        lang: lang,
        textType: fontType.type,
        deltaOps: [
          {
            // insert: item.prefixIndex ? `${item.prefixIndex}.${item.text}` : item.text,
            insert: item.text,
          },
        ],
        zindex: 2,
        fontName: fontType.font,
        fontSize: fontType.pxSize,
      } as IComponentInfo)
      newNowTime += 100
      pageInfo.componentList.push({
        id: pageInfo.pageId + 'C' + newNowTime.toString(),
        componentId: pageInfo.pageId + 'C' + newNowTime.toString(),
        componentType: EComponentType.PageIndexNumber,
        component: EditorComponent.QUILL_TEXT,
        lang: lang,
        width: 100,
        height: Math.ceil(fontIndexType.pxSize * 1.25) + 32,
        top: prePositionEnd + (item['titleLevel'] == 0 ? 8 : item['titleLevel'] == 1 ? 6 : 4),
        left: pageSize!.pixelWidth! - 100 - defaultSketchRulerWidth,
        textType: fontIndexType.type,
        deltaOps: [
          {
            insert: (item.index + 1).toString(),
          },
          {
            attributes: {
              align: 'right',
            },
            insert: '\n',
          },
        ],
        zindex: 2,
        fontName: fontIndexType.font,
        fontSize: fontIndexType.pxSize,
      } as IComponentInfo)
      prePositionEnd += Math.ceil(fontType.pxSize * 1.42)
    }
  }
  console.log('addDirectory', pageInfo)
  // directoryNum++
  directoryPageList.push(pageInfo)
  // store.addDirectoryPage(pageInfo, startNew)
}

export function getCatalogByLang(lang: string) {
  netTranslateText('en', 'Catalog', lang).then((res) => {
    if (res.data) {
      LStorage.set('catalog-' + lang, res.data)
    }
  })
}
