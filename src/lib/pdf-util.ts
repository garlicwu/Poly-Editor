import {EComponentType, type IComponentInfo, type IEditorInfo, type IEditorPageInfo} from '@/view/editor/utils/common-modle'
import jsPDF, {type HTMLFontFace} from 'jspdf'
import {type FontSizeInfoType} from '@/store/textEdiotrSotre'
import axios from 'axios'
import util, {fontFaceNameListWithFileSuffix, isOverThreshold, resolveFontFileCandidates} from '@/lib/util'
import {cloneDeep} from 'lodash'
import domToImage from 'dom-to-image'
import {createVNode, nextTick, render, type VNode} from 'vue'
import PreviewChildView from '@/view/editor/layout/leftLayout/preview-list/preview-child-view.vue'
import {useEditorStore} from '@/store/editorStore'
import html2canvas from 'html2canvas'

export const fontFaceList: HTMLFontFace[] = []
export const pdfAdjustDpi = 10
export const hasLoadFontList: string[] = []
export const basicPdfExportRenderScale = 2

const base64ResourceCache = new Map<string, Promise<string>>()
let exportRenderHost: HTMLElement | null = null

function getExportRenderHost() {
  if (exportRenderHost && document.body.contains(exportRenderHost)) {
    return exportRenderHost
  }

  exportRenderHost = document.createElement('div')
  exportRenderHost.id = 'pdf-export-render-host'
  exportRenderHost.style.position = 'absolute'
  exportRenderHost.style.left = '-100000px'
  exportRenderHost.style.top = '0'
  exportRenderHost.style.width = '0'
  exportRenderHost.style.height = '0'
  exportRenderHost.style.overflow = 'hidden'
  exportRenderHost.style.pointerEvents = 'none'
  exportRenderHost.style.zIndex = '-1'
  document.body.appendChild(exportRenderHost)

  return exportRenderHost
}

function removeExportRenderNode(node?: HTMLElement | null) {
  if (!node) {
    return
  }

  render(null, node)
  node.remove()
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
      return
    }

    setTimeout(() => resolve(), 16)
  })
}

async function waitForRenderFrames(frameCount: number = 2) {
  await nextTick()
  for (let i = 0; i < frameCount; i++) {
    await waitForAnimationFrame()
  }
}

export async function getHtmlToImage(page: IEditorPageInfo, editorFontList: string[], lang: string, allFontMap: Record<string, Record<string, FontSizeInfoType>>) {
  let fontList: string[] = editorFontList ?? []
  page.componentList.forEach((component) => {
    if (component.componentType === EComponentType.Text) {
      fontList.push(allFontMap[component.lang ?? lang ?? 'cn']?.[component.textType ?? 'Yaber正文'].font)
    }
  })
  fontList = Array.from(new Set(fontList))
  await loadFontListWithBufferInStyleSheets(fontList)

  const customElement = document.getElementById('previewPageId-' + page.pageId) as HTMLElement
  if (!customElement) {
    return ''
  }
  await sleep(300)
  const domImageData = await domToImageHelper(customElement, Number(customElement.offsetWidth), Number(customElement.offsetHeight))
  if (domImageData) {
    return domImageData
  } else {
    return ''
  }
}

export async function optTextHtml(text: IComponentInfo, editorFontList: string[], lang: string, textFontInfo: FontSizeInfoType, loadTime: number) {
  if (text.componentType !== EComponentType.Text) {
    return {difference: 0}
  }
  let fontList: string[] = editorFontList || []
  fontList.push(textFontInfo?.font)
  fontList = Array.from(new Set(fontList))
  console.log('clientHeight-' + text.lang + '-' + text.componentId, 'start')

  await loadFontListWithBufferInStyleSheets(fontList)

  const component = cloneDeep(text)
  const appendChild = document.createElement('div') as HTMLElement

  let vm: VNode | null = null
  // appendChild.classList.add('preview-pdf-container')
  // appendChild.id = 'preview-container-pdf' + component.componentId
  appendChild.style.left = '-' + (component.width ?? 1000) + 'px'
  appendChild.style.width = component.width + 'px'
  appendChild.style.height = component.height + 'px'
  appendChild.style.position = 'absolute'
  appendChild.style.color = 'black'
  appendChild.style.zIndex = '100'
  // appendChild.style.transform = `scale(${0.3})`
  // appendChild.style.transformOrigin = 'top left'

  vm = createVNode(PreviewChildView, {
    component: component,
    fontSizeInfoType: textFontInfo,
    needTranslate: false,
    optTextHtml: true,
  })
  // 将组件渲染成真实节点
  render(vm, appendChild)
  document.body.appendChild(appendChild)

  // const hasScroll = quillTextElement.scrollHeight > quillTextElement.clientHeight
  // console.log('hasScroll' + text.componentId, hasScroll)
  await sleep(loadTime)
  // await sleep( 400)
  // console.log('quill-preview-optHtml-', 'quill-preview-' + component.componentId)
  // const quillTextElement = document.getElementById('quill-optHtml-' + component.componentId) as HTMLElement
  if (!appendChild.firstElementChild) {
    document.body.removeChild(appendChild)
    return {difference: 0}
  }
  const container = appendChild.firstElementChild?.firstElementChild?.firstElementChild as HTMLElement
  if (!container) {
    document.body.removeChild(appendChild)
    return {difference: 0}
  }

  // console.log('childrenHeight' + text.componentId, container)
  const difference = container.scrollHeight - container.clientHeight
  console.log('clientHeight-' + text.lang + '-' + text.componentId, container.scrollHeight + '----' + container.clientHeight)
  document.body.removeChild(appendChild)
  vm = null
  if (difference > 0) {
    console.log('hasScroll' + text.componentId)
  }
  return {difference: difference}
}

export async function htmlToPdf(editor: IEditorInfo, allFontMap: Record<string, Record<string, FontSizeInfoType>>, fileName: string) {
  const pageSize = editor.pageList[0].pageSize
  const pdf = new jsPDF({
    unit: 'mm',
    format: [Math.ceil((pageSize?.pixelWidth ?? 1080) / pdfAdjustDpi), Math.ceil((pageSize?.pixelHeight ?? 1920) / pdfAdjustDpi)],
    orientation: (pageSize?.pixelWidth ?? 1080) > (pageSize?.pixelHeight ?? 1920) ? 'l' : 'p', // 页面方向，portrait: 纵向，landscape: 横向
    putOnlyUsedFonts: true, // 只包含使用的字体
    compress: true, // 压缩文档
    precision: 16, // 浮点数的精度,
  })
  pdf.setDisplayMode(2)
  pdf.context2d.scale(0.1, 0.1)
  let fontList: string[] = editor.fontList ?? []
  let pdfProgressValue = 0
  let componentListLength = 0
  useEditorStore().setPdfProgressValue(pdfProgressValue)
  editor.pageList.forEach((page, pageIndex) => {
    page.componentList.forEach((component, index) => {
      componentListLength++
      if (component.componentType === EComponentType.Text) {
        fontList.push(allFontMap[component.lang ?? editor.translationType ?? 'cn']?.[component.textType ?? 'Yaber正文']?.font ?? '')
      }
    })
  })
  const pdfProgressNumerator = 10000 / componentListLength

  fontList = Array.from(new Set(fontList))
  await loadFontListWithBufferInStyleSheets(fontList)

  for (let i = 0; i < editor.pageList.length; i++) {
    const page = editor.pageList[i]
    if (i > 0) {
      addPage(page, pdf)
    }
    for (const component of page.componentList) {
      await addComponentWithRender(
        component,
        pdf,
        allFontMap[component.lang ?? editor.translationType ?? 'cn']?.[component.textType ?? 'Yaber正文'] ?? {
          type: 'Yaber正文',
          lang: '中文',
          size: 7,
          font: 'OPlusSans3-Regular',
          pxSize: 29,
        },
      )
      pdfProgressValue += Math.round(pdfProgressNumerator / 100)
      console.log('pdfProgressValue', pdfProgressValue)
      useEditorStore().setPdfProgressValue(pdfProgressValue)
    }
  }
  console.log('save', true)
  pdf.save(fileName + '.pdf')
}

function addPage(page: IEditorPageInfo, pdf: jsPDF) {
  pdf.addPage([Math.ceil((page.pageSize?.pixelWidth ?? 1080) / pdfAdjustDpi), Math.ceil((page.pageSize?.pixelHeight ?? 1920) / pdfAdjustDpi)], (page.pageSize?.pixelWidth ?? 1080) > (page.pageSize?.pixelHeight ?? 1920) ? 'l' : 'p')
}

async function addText(text: IComponentInfo, pdf: jsPDF, fontInfo: FontSizeInfoType) {
  const component = cloneDeep(text)
  // pdf.setFont(fontInfo.font ?? 'OPlusSans3-Regular')

  // pdf.text(text.text, text.left, text.top, {
  //   maxWidth: text.width,
  // })

  // const outHtml = `<div style="font-variant:normal !important;background:transparent;color:black;overflow:hidden;font-family: '${fontInfo.font}';width: ${text.width}px; height: ${text.height}px;"><div style="font-size: ${fontInfo.pxSize}px; font-family: '${fontInfo.font}'; font-weight: ${text.textType?.includes('标题') ? 'bold' : 'normal'}; direction: ltr;">${text.semanticHTML}</div></div>`
  // console.log('outHtml', outHtml)
  // const fontString = `${util.fontUrl}/${realFileName}`
  // if (fontFaceList.findIndex((item) => item.family === fontInfo.font) < 0) {
  //   const fontString = await loadFontWithBufferSingle(fontInfo.font)
  //   if (fontString) {
  //     fontFaceList.push({
  //       family: fontInfo.font,
  //       src: [{url: fontString.toString(), format: 'truetype'}],
  //     })
  // fontFaceList.push({
  //   family: fontInfo.font,
  //   src: [{url: fontString.toString(), format: 'truetype'}],
  // })
  // }
  // console.log('fontFaceList', fontFaceList)
  // }
  // console.log('fontNext', fontFaceList)
  // const canvas = await html2canvas(element)
  // if (canvas) {
  //   const imageBase64 = canvas.toDataURL('image/png')
  //   pdf.addImage(imageBase64, '', text.left, text.top, text.width, text.height)
  // }
  const customElement = document.getElementById('previewChildId-translate-' + text.componentId) as HTMLElement
  if (!customElement) {
    return
  }
  // const appendChild = document.createElement('div') as HTMLElement
  //
  // let vm: VNode | null = null
  // appendChild.classList.add('preview-pdf-container')
  // appendChild.id = 'preview-container-' + component.componentId
  // appendChild.style.left = '-10000px'
  // appendChild.style.width = component.width + 'px'
  // appendChild.style.height = component.height + 'px'
  // appendChild.style.position = 'absolute'
  // appendChild.style.letterSpacing = '10px !important'
  // appendChild.style.zIndex = '10'
  // // appendChild.style.transform = `scale(${1})`
  // // appendChild.style.transformOrigin = 'top left'
  // if (component.imageSrc && component.imageSrc !== '') {
  //   const imageBase64 = await getBase64FromUrl(component.imageSrc)
  //   component.imageSrc = imageBase64
  // }
  // vm = createVNode(PreviewChildView, {component: component, fontSizeInfoType: fontInfo, needTranslate: false})
  // // 将组件渲染成真实节点
  // render(vm, appendChild)
  // // appendChild.innerHTML = outHtml
  // document.body.appendChild(appendChild)

  // console.log('childHtml', appendChild)
  // console.log('childHtml', component.componentId)
  // await sleep(300)
  // console.log('childHtmlSleep', component.componentId)
  const cacheTransform = customElement.style.transform
  const {left, top} = customElement.style
  customElement.style.transform = ''
  await sleep(300)
  const domImageData = await domToImageHelper(customElement, text.width, text.height, basicPdfExportRenderScale)
  if (domImageData) {
    pdf.addImage(
      domImageData,
      'png',
      Number((component.left / pdfAdjustDpi).toFixed(5)),
      Number((component.top / pdfAdjustDpi).toFixed(5)),
      Number((component.width / pdfAdjustDpi).toFixed(5)),
      Number((component.height / pdfAdjustDpi).toFixed(5)),
    )
  }
  customElement.style.left = left
  customElement.style.top = top
  customElement.style.transform = cacheTransform

  // await sleep(1000)
  // const canvas = await html2canvas(appendChild, {
  //   width: component.width, //宽
  //   height: component.height, //高
  //   logging: true,
  //   removeContainer: true,
  //   backgroundColor: 'transparent',
  // })
  // document.body.removeChild(appendChild)
  // if (canvas) {
  //   const dataURL = canvas.toDataURL('image/png')
  //   // const dataURL = canvas
  //   pdf.addImage(dataURL, 'png', Math.ceil(component.left / pdfAdjustDpi), Math.ceil(component.top / pdfAdjustDpi), Math.ceil(component.width / pdfAdjustDpi), Math.ceil(component.height / pdfAdjustDpi))
  // }
}

async function addComponentWithRender(text: IComponentInfo, pdf: jsPDF, fontInfo: FontSizeInfoType) {
  if (!text.componentType) {
    return
  }
  const component = cloneDeep(text)
  const appendChild: any = document.createElement('div') as HTMLElement
  let vm: VNode | null = null
  // appendChild.classList.add('preview-pdf-container')
  appendChild.id = 'preview-container-pdf' + component.componentId
  appendChild.style.left = '-' + component.width + 'px'
  appendChild.style.width = component.width + 'px'
  appendChild.style.height = component.height + 'px'
  appendChild.style.position = 'absolute'
  appendChild.style.color = 'black'
  appendChild.style.zIndex = '10'
  appendChild.style.transform = `scale(${0.3})`
  appendChild.style.transformOrigin = 'top left'
  appendChild.style.overflow = 'hidden'
  appendChild.style.scrollbarWidth = 'none' // Firefox
  appendChild.style.msOverflowStyle = 'none' // IE/Edge

  // 或者直接设置CSS变量
  appendChild.style.cssText += `
  overflow: auto;
  scrollbar-width: none;
  scrollbar-height: none;
  -ms-overflow-style: none;
`
  // 添加Webkit浏览器的隐藏（需要添加伪元素）
  const style = document.createElement('style')
  style.textContent = `
  #myElement::-webkit-scrollbar {
    display: none;
  }
`
  if (component.imageSrc && component.imageSrc !== '') {
    const imageBase64 = await getBase64FromUrl(component.imageSrc)
    component.imageSrc = imageBase64
  }
  vm = createVNode(PreviewChildView, {component: component, fontSizeInfoType: fontInfo, needTranslate: false})
  // 将组件渲染成真实节点
  render(vm, appendChild)
  // appendChild.innerHTML = outHtml
  document.body.appendChild(appendChild)

  // console.log('childHtml', appendChild)
  // console.log('childHtml', component.componentId)
  // await sleep(300)
  // console.log('childHtmlSleep', component.componentId)
  await sleep(300)
  // const customElement = document.getElementById('previewChildId-pdf-' + component.componentId) as HTMLElement
  if (appendChild.firstElementChild) {
    const domImageData = await domToImageHelper(appendChild.firstElementChild as HTMLElement, component.width, component.height, basicPdfExportRenderScale)
    // console.log(component.componentId, domImageData)
    document.body.removeChild(appendChild)
    if (domImageData) {
      pdf.addImage(
        domImageData,
        'png',
        Number((component.left / pdfAdjustDpi).toFixed(5)),
        Number((component.top / pdfAdjustDpi).toFixed(5)),
        Number((component.width / pdfAdjustDpi).toFixed(5)),
        Number((component.height / pdfAdjustDpi).toFixed(5)),
      )
    } else {
      console.log('addComponentWithRender-f', component.componentId)
    }
  }
}

function domToImageHelper(element: HTMLElement, width: number, height: number, renderScale: number = 1): Promise<string | null> {
  const exportWidth = Math.max(1, Math.round(width * renderScale))
  const exportHeight = Math.max(1, Math.round(height * renderScale))

  return new Promise((resolve, reject) => {
    domToImage
      .toPng(element, {
        bgcolor: 'transparent',
        width: exportWidth,
        height: exportHeight,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${renderScale})`,
          transformOrigin: 'top left',
        },
      })
      .then((res) => {
        // console.log(res)
        resolve(res)
      })
      .catch((err) => {
        console.error(err)
        resolve(null)
      })
  })
}

function domToSvgelper(element: HTMLElement, width: number, height: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    domToImage
      .toSvg(element, {
        quality: 1,
        bgcolor: 'transparent',
        width: width,
        height: height,
      })
      .then((res) => {
        // console.log(res)
        resolve(res)
      })
      .catch((err) => {
        console.error(err)
        resolve(null)
      })
  })
}

function domToImageHelperToBase64(element: HTMLElement, width: number, height: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    domToImage
      .toPixelData(element, {
        quality: 4,
        bgcolor: 'transparent',
        width: width,
        height: height,
        style: {
          'white-space': 'normal',
          'letter-spacing': '10px',
          'word-spacing': 'normal',
          'word-wrap': 'break-word',
          'word-break': 'break-all',
        },
      })
      .then((res: any) => {
        // console.log(res)
        resolve(res)
      })
      .catch((err) => {
        console.error(err)
        resolve(null)
      })
  })
}

async function addImage(image: IComponentInfo, pdf: jsPDF) {
  if (!image.imageSrc || image.imageSrc === '') {
    return
  }
  const imageBase64 = await getBase64FromUrl(image.imageSrc)
  pdf.addImage(
    imageBase64,
    image.imageSrc.split('.')[1],
    Number((image.left / pdfAdjustDpi).toFixed(5)),
    Number((image.top / pdfAdjustDpi).toFixed(5)),
    Number((image.width / pdfAdjustDpi).toFixed(5)),
    Number((image.height / pdfAdjustDpi).toFixed(5)),
  )
}

async function loadFontWithBuffer(fontList: string[], pdf: jsPDF) {
  try {
    for (const font of fontList) {
      const realFileName = fontFaceNameListWithFileSuffix.find((itemSuffix) => itemSuffix.includes(encodeURIComponent(font) + '.'))
      if (realFileName) {
        const url = `${util.fontUrl}/${realFileName}`
        let myFont = await getBase64FromUrl(url)
        if (myFont && myFont.length > 0) {
          // 将字体添加到 jsPDF
          // if (myFont.includes('data:font/ttf;base64,')) {
          //   myFont = myFont.replace('data:font/ttf;base64,', '').toString()
          // } else if (myFont.includes('data:font/otf;base64,')) {
          //   myFont = myFont.replace('data:font/otf;base64,', '').toString()
          // }
          myFont = myFont.substring(myFont.indexOf('base64,') + 7)
          pdf.addFileToVFS(realFileName.toString(), myFont)
          // pdf.addFont(encodeURIComponent(realFileName), font, '', 'normal')
          // pdf.addFont(encodeURIComponent(realFileName), font, '', 'bold')
          pdf.addFont(realFileName.toString(), font, '')
          pdf.addFont(realFileName.toString(), font, '', 'bold')
          pdf.addFont(realFileName.toString(), font, '', 'normal')
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

export async function loadFontWithBufferSingle(font: string, debugContext?: string) {
  if (!util.fontUrl) {
    if (debugContext) {
      console.info(`[${debugContext}] skip remote font fetch for ${font}: VITE_FONT_URL is empty`)
    }
    return null
  }

  const candidateFiles = resolveFontFileCandidates(font)
  const failedRequests: string[] = []

  if (candidateFiles.length === 0) {
    if (debugContext) {
      console.warn(`[${debugContext}] no candidate font files for ${font}`)
    }
    return null
  }

  for (const candidateFile of candidateFiles) {
    const url = `${util.fontUrl}/${candidateFile}`
    try {
      const myFont = await getBase64FromUrl(url)
      if (myFont && myFont.length > 0) {
        if (debugContext) {
          console.info(`[${debugContext}] loaded font bytes for ${font} from ${url}`)
        }
        return myFont
      }

      failedRequests.push(`${url} (empty response)`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      failedRequests.push(`${url} (${errorMessage})`)
    }
  }

  if (debugContext) {
    console.warn(`[${debugContext}] failed to fetch font bytes for ${font}`, {
      candidateFiles,
      failedRequests,
    })
  }

  return null
}
export function getBase64FromUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) {
    return Promise.resolve(url)
  }

  const cacheValue = base64ResourceCache.get(url)
  if (cacheValue) {
    return cacheValue
  }

  const request = new Promise<string>((resolve, reject) => {
    axios
      .get(url, {responseType: 'blob'})
      .then((response) => {
        const reader = new FileReader()
        reader.readAsDataURL(response.data)
        reader.onload = function () {
          const imageData = (reader.result ?? '').toString()
          resolve(imageData)
        }
        reader.onerror = function () {
          reject(reader.error)
        }
      })
      .catch((error) => {
        reject(error)
      })
  }).catch((error) => {
    base64ResourceCache.delete(url)
    return Promise.reject(error)
  })

  base64ResourceCache.set(url, request)
  return request
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function loadFontListWithBuffer(fontList: string[]) {
  if (!util.fontUrl) {
    return ''
  }

  // console.log('fontFaceList', fontFaceList)
  for (const font of fontList) {
    if (!font || font === '') {
      continue
    }

    if (fontFaceList.findIndex((item) => item.family === font) > -1) {
      continue
    }

    const realFileName = fontFaceNameListWithFileSuffix.find((itemSuffix) => itemSuffix.includes(encodeURIComponent(font) + '.'))
    if (!realFileName) {
      continue
    }

    fontFaceList.push({
      family: font,
      weight: 'normal',
      src: [{url: `${util.fontUrl}/${realFileName}`, format: 'truetype'}],
    })
  }
  return ''
}

export async function loadFontListWithBufferInStyleSheets(fontList: string[]) {
  // console.log('fontFaceList', fontFaceList)
  for (const font of fontList) {
    if (!font || hasLoadFontList.includes(font) || document.styleSheets.length === 0) {
      continue
    }

    const fontString = await loadFontWithBufferSingle(font)
    if (!fontString) {
      continue
    }

    const fontCss = `@font-face {
              font-family: ${font};
              src: url(${fontString}) format('truetype');
              }`
    hasLoadFontList.push(font)
    if (!isOverThreshold(fontString, 500 * 1024)) {
      document.styleSheets[document.styleSheets.length - 1].insertRule(fontCss)
    }
  }
  return ''
}

export async function buildComponentWithRender(text: IComponentInfo, fontInfo?: FontSizeInfoType, renderScale: number = basicPdfExportRenderScale): Promise<string | null> {
  if (!text.componentType || text.componentType === EComponentType.Image) {
    return null
  }
  const component = cloneDeep(text)
  let appendChild: HTMLElement | null = null
  try {
    appendChild = document.createElement('div') as HTMLElement
    const vm: VNode = createVNode(PreviewChildView, {component: component, fontSizeInfoType: fontInfo, needTranslate: false})
    // appendChild.classList.add('preview-pdf-container')
    appendChild.id = 'preview-' + component.componentId
    appendChild.style.left = '-' + component.width + 'px'
    appendChild.style.width = component.width + 'px'
    appendChild.style.height = component.height + 'px'
    appendChild.style.position = 'absolute'
    appendChild.style.color = 'black'
    appendChild.style.background = 'transparent'
    appendChild.style.zIndex = '10'
    // appendChild.style.transform = `scale(${1})`
    appendChild.style.transformOrigin = 'top left'
    appendChild.style.overflow = 'hidden'
    appendChild.style.scrollbarWidth = 'none' // Firefox
    appendChild.style.msOverflowStyle = 'none' // IE/Edge
    appendChild.style.cssText += `
    overflow: auto;
    scrollbar-width: none;
    scrollbar-height: none;
    -ms-overflow-style: none;
  `
    // appendChild.textContent = `
    //   #myElement::-webkit-scrollbar {
    //     display: none;
    //   }
    // `
    // allTextGenerateStyle.forEach((element) => {
    //   appendChild.classList.add(element)
    // })

    // if (component.componentType === EComponentType.Image && component.imageSrc && component.imageSrc !== '') {
    //   const imageBase64 = await getBase64FromUrl(component.imageSrc)
    //   component.imageSrc = imageBase64
    // }
    // 将组件渲染成真实节点
    render(vm, appendChild)
    getExportRenderHost().appendChild(appendChild)
    await waitForRenderFrames()
    // return ''
    // const customElement = document.getElementById('previewChildId-pdf-' + component.componentId) as HTMLElement
    if (appendChild.firstElementChild) {
      let hasSpecialStyle = false
      if (component.componentType === EComponentType.Text) {
        let allDeltaOps: any = JSON.stringify(component.deltaOps)
        if (allDeltaOps.includes('ordered-')) {
          hasSpecialStyle = true
        }

        allDeltaOps = null
      }
      let imageBase64
      if (component.componentType === EComponentType.Table || (component.componentType === EComponentType.Text && hasSpecialStyle)) {
        // fontList = Array.from(new Set(fontList))
        // await loadFontListWithBufferInStyleSheets(fontList)
        if (component.componentType === EComponentType.Text) {
          appendChild.style.height = component.height + 45 + 'px'
          appendChild.style['padding-top'] = '-45px !important'
          await waitForRenderFrames(1)
        }
        const canvas = await html2canvas(appendChild, {
          removeContainer: true,
          backgroundColor: 'transparent',
          scale: renderScale, // 按导出倍数做超采样
          useCORS: true,
          foreignObjectRendering: false, // 关闭foreignObject可能有助于文本渲染
        })
        if (canvas) {
          imageBase64 = canvas.toDataURL('image/png')
        } else {
          const textElement = appendChild.querySelector('.ql-editor') as HTMLElement
          if (textElement) {
            textElement.style.overflow = 'hidden'
          }
          imageBase64 = await domToImageHelper(appendChild.firstElementChild as HTMLElement, component.width, component.height, renderScale)
        }
        return imageBase64
      }

      if (component.componentType === EComponentType.Text) {
        const textElement = appendChild.querySelector('.ql-editor') as HTMLElement
        if (textElement) {
          textElement.style.overflow = 'hidden'
        }
      }
      imageBase64 = await domToImageHelper(appendChild.firstElementChild as HTMLElement, component.width, component.height, renderScale)
      return imageBase64
    } else {
      return null
    }
  } catch (error) {
    console.error('PDF导出组件渲染失败:', {
      componentId: component.componentId,
      componentType: component.componentType,
      divStyle: component.divStyle,
      error: error,
    })
    return null
  } finally {
    removeExportRenderNode(appendChild)
  }
}
