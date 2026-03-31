import fontkit from '@pdf-lib/fontkit'
import type {Font as FontkitFont} from '@pdf-lib/fontkit'
import {DEFAULT_PRINT_PDF_COLOR_PROFILE, type PrintPdfColorProfile} from '@/export/print-pdf-color-profile'
import ExportPageView from '@/export/render/export-page-view.vue'
import {loadFontListWithBufferInStyleSheets, loadFontWithBufferSingle} from '@/lib/pdf-util'
import {resolveFontFileCandidates} from '@/lib/util'
import type {FontSizeInfoType} from '@/store/textEdiotrSotre'
import {EComponentType, EPageSizeType, type IComponentInfo, type IEditorInfo, type IEditorPageInfo} from '@/view/editor/utils/common-modle'
import domToImage from 'dom-to-image'
import html2canvas from 'html2canvas'
import {cmyk, degrees, drawImage as drawImageOperator, PDFDict, PDFDocument, PDFName, PDFOperator, PDFOperatorNames, PDFString, rgb, type Color, type PDFPage, type PDFRef} from 'pdf-lib'
import {createVNode, nextTick, render, type VNode} from 'vue'

type PrintPdfColorMode = 'cmyk' | 'rgb'

interface PrintPdfExportOptions {
  fileName: string
  renderScale?: number
  maxRenderScale?: number
  colorProfile?: PrintPdfColorProfile
  embedOutputIntent?: boolean
  colorMode?: PrintPdfColorMode
  outlineText?: boolean
}

interface RenderedPageView {
  element: HTMLElement
  cleanup: () => void
}

interface RenderedPageContext extends RenderedPageView {
  pageElement: HTMLElement
  componentElements: Map<string, HTMLElement>
}

interface RenderPageViewOptions {
  backgroundColor: string
}

interface PrintLayerImageData {
  width: number
  height: number
  colorData: Uint8Array
  colorSpace: 'DeviceCMYK' | 'DeviceRGB'
  decode: number[]
  alphaData?: Uint8Array
}

interface PrintLayerSpec {
  key: string
  label: string
}

interface RegisteredOptionalContentLayer {
  key: string
  label: string
  ref: PDFRef
  resourceName: PDFName
}

interface PixelPlacement {
  left: number
  top: number
  width: number
  height: number
}

interface ComponentCaptureOptions {
  cropWidth?: number
  cropHeight?: number
  clipOverflow?: boolean
}

interface Matrix2D {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

interface GraphemeSegment {
  text: string
  start: number
  end: number
}

interface RgbaColorValue {
  r: number
  g: number
  b: number
  a: number
}

interface PdfFillStyle {
  color: Color
  opacity?: number
}

interface OutlinePathRun {
  key: string
  pathData: string
  color: Color
  opacity?: number
}

interface OutlineFontResource {
  fontName: string
  font: FontkitFont
}

interface OutlineBuildResult {
  runs: OutlinePathRun[] | null
  reason?: string
}

const pageCaptureWidth = 1080
const pageCaptureHeight = 1920

let exportRenderHost: HTMLElement | null = null
const colorProfileBytesCache = new Map<string, Promise<Uint8Array>>()
const parsedFontCache = new Map<string, Promise<OutlineFontResource | null>>()
const fontFileNameCache = new Map<string, string | null>()
let cssColorParserContext: CanvasRenderingContext2D | null = null

function isBackgroundComponent(component: IComponentInfo) {
  return component.componentType === EComponentType.Background
}

function isImageComponent(component: IComponentInfo) {
  return [EComponentType.Image, EComponentType.Icon].includes(component.componentType)
}

function isTextComponent(component: IComponentInfo) {
  return [EComponentType.Text, EComponentType.PageFooter, EComponentType.PageIndexNumber].includes(component.componentType)
}

function isOtherComponent(component: IComponentInfo) {
  return !isBackgroundComponent(component) && !isImageComponent(component) && !isTextComponent(component)
}

function getOutlineDebugLabel(component: IComponentInfo, pageIndex?: number) {
  const componentId = String(component.componentId ?? component.id ?? 'unknown')
  const componentName = String(component.name ?? component.des ?? componentId)
  return pageIndex === undefined ? `[print-outline][${componentName}][${componentId}]` : `[print-outline][page-${pageIndex + 1}][${componentName}][${componentId}]`
}

function getPagePixelSize(page: IEditorPageInfo) {
  return {
    width: page.pageSize?.pixelWidth ?? pageCaptureWidth,
    height: page.pageSize?.pixelHeight ?? pageCaptureHeight,
  }
}

function getExportRenderHost() {
  if (exportRenderHost && document.body.contains(exportRenderHost)) {
    return exportRenderHost
  }

  exportRenderHost = document.createElement('div')
  exportRenderHost.id = 'print-pdf-export-render-host'
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

function removeRenderedNode(node?: HTMLElement | null) {
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

function toPoints(page: IEditorPageInfo) {
  const pageSize = page.pageSize
  if (!pageSize) {
    return {
      width: 595.28,
      height: 841.89,
    }
  }

  switch (pageSize.type) {
    case EPageSizeType.Centimeter:
      return {
        width: (pageSize.width / 2.54) * 72,
        height: (pageSize.height / 2.54) * 72,
      }
    case EPageSizeType.Inch:
      return {
        width: pageSize.width * 72,
        height: pageSize.height * 72,
      }
    case EPageSizeType.Millimetre:
    default:
      return {
        width: (pageSize.width / 25.4) * 72,
        height: (pageSize.height / 25.4) * 72,
      }
  }
}

function getComponentFontInfo(component: IComponentInfo, allFontMap: Record<string, Record<string, FontSizeInfoType>>, lang: string) {
  return (
    allFontMap[component.lang ?? lang ?? 'cn']?.[component.textType ?? 'Yaber正文'] ?? {
      type: 'Yaber正文',
      lang: '中文',
      size: 7,
      font: 'OPlusSans3-Regular',
      pxSize: 29,
    }
  )
}

function collectFonts(editor: IEditorInfo, allFontMap: Record<string, Record<string, FontSizeInfoType>>) {
  const fontSet = new Set<string>(editor.fontList ?? [])

  editor.pageList.forEach((page) => {
    page.componentList.forEach((component) => {
      if (isTextComponent(component)) {
        const fontInfo = getComponentFontInfo(component, allFontMap, component.lang ?? editor.translationType ?? 'cn')
        if (fontInfo.font) {
          fontSet.add(fontInfo.font)
        }
        if (component.fontName) {
          fontSet.add(component.fontName)
        }
        ;(component.deltaOps ?? []).forEach((delta) => {
          if (typeof delta?.attributes?.font === 'string' && delta.attributes.font.trim()) {
            fontSet.add(delta.attributes.font.trim())
          }
        })
      }
    })
  })

  fontSet.add('OPlusSans3-Regular')
  return Array.from(fontSet)
}

async function renderPageView(page: IEditorPageInfo, fontMap: Record<string, Record<string, FontSizeInfoType>>, lang: string, options: RenderPageViewOptions): Promise<RenderedPageView> {
  const mountNode = document.createElement('div')
  getExportRenderHost().appendChild(mountNode)

  const vnode: VNode = createVNode(ExportPageView, {
    pageInfo: page,
    lang,
    fontMap,
    hiddenTextComponentIds: [],
    backgroundColor: options.backgroundColor,
  })

  render(vnode, mountNode)
  await waitForRenderFrames(3)
  await document.fonts.ready

  const element = mountNode.firstElementChild as HTMLElement | null
  if (!element) {
    removeRenderedNode(mountNode)
    throw new Error('Failed to render print export page view')
  }

  return {
    element,
    cleanup: () => removeRenderedNode(mountNode),
  }
}

async function renderPageContext(page: IEditorPageInfo, fontMap: Record<string, Record<string, FontSizeInfoType>>, lang: string) {
  const renderedView = await renderPageView(page, fontMap, lang, {
    backgroundColor: '#ffffff',
  })

  const componentElements = new Map<string, HTMLElement>()
  renderedView.element.querySelectorAll<HTMLElement>('[data-component-id]').forEach((element) => {
    const componentId = element.dataset.componentId?.trim()
    if (componentId) {
      componentElements.set(componentId, element)
    }
  })

  return {
    ...renderedView,
    pageElement: renderedView.element,
    componentElements,
  } as RenderedPageContext
}

function buildPageCaptureOptions(page: IEditorPageInfo, renderScale: number, backgroundColor: string | null) {
  const pagePixelSize = getPagePixelSize(page)
  return {
    backgroundColor,
    scale: renderScale,
    useCORS: true,
    logging: false,
    removeContainer: true,
    width: pagePixelSize.width,
    height: pagePixelSize.height,
    windowWidth: pagePixelSize.width,
    windowHeight: pagePixelSize.height,
  }
}

async function capturePageCanvas(renderedPage: RenderedPageContext, page: IEditorPageInfo, renderScale: number, backgroundColor: string | null, visibleComponentIds: Set<string>) {
  const originalBackground = renderedPage.pageElement.style.background
  const originalVisibility = new Map<HTMLElement, string>()

  renderedPage.pageElement.style.background = backgroundColor ?? 'transparent'
  renderedPage.componentElements.forEach((element, componentId) => {
    originalVisibility.set(element, element.style.visibility)
    element.style.visibility = visibleComponentIds.has(componentId) ? 'visible' : 'hidden'
  })

  await waitForRenderFrames(1)

  try {
    return await html2canvas(renderedPage.pageElement, buildPageCaptureOptions(page, renderScale, backgroundColor))
  } finally {
    renderedPage.pageElement.style.background = originalBackground
    renderedPage.componentElements.forEach((element) => {
      element.style.visibility = originalVisibility.get(element) ?? ''
    })
    await waitForRenderFrames(1)
  }
}

function buildLocalComponentTransform(component: IComponentInfo) {
  const transform: string[] = []
  transform.push(`rotate(${component.angle ?? 0}deg)`)

  if (component.skew?.length) {
    let skewString = `skewX(${component.skew[0]}deg)`
    if (component.skew[1]) {
      skewString += ` skewY(${component.skew[1]}deg)`
    }
    transform.push(skewString)
  }

  const transformString = transform.join(' ').trim()
  return transformString || 'none'
}

function measureComponentPlacement(pageElement: HTMLElement, componentElement: HTMLElement): PixelPlacement | null {
  const pageRect = pageElement.getBoundingClientRect()
  const componentRect = componentElement.getBoundingClientRect()
  const left = componentRect.left - pageRect.left
  const top = componentRect.top - pageRect.top
  const width = componentRect.width
  const height = componentRect.height

  if (width <= 0 || height <= 0) {
    return null
  }

  return {
    left,
    top,
    width,
    height,
  }
}

function hasComponentTransform(component: IComponentInfo) {
  return Math.abs(component.angle ?? 0) > 0.001 || !!component.skew?.some((value) => Math.abs(value) > 0.001)
}

function measureComponentModelPlacement(component: IComponentInfo): PixelPlacement | null {
  const width = Number(component.width ?? 0)
  const height = Number(component.height ?? 0)
  if (width <= 0 || height <= 0) {
    return null
  }

  return {
    left: Number(component.left ?? 0),
    top: Number(component.top ?? 0),
    width,
    height,
  }
}

function shouldUseDomToImageForText(component: IComponentInfo, options?: ComponentCaptureOptions) {
  return isTextComponent(component) && !hasComponentTransform(component) && !!options?.cropWidth && !!options?.cropHeight
}

async function createCanvasFromDataUrl(dataUrl: string, width: number, height: number) {
  const image = new Image()
  const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to decode rendered text image'))
    image.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to create canvas for print text layer')
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(loadedImage, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function captureTextComponentCanvasWithDomToImage(componentElement: HTMLElement, renderScale: number, options: ComponentCaptureOptions) {
  const captureWidth = Math.max(1, Math.ceil(options.cropWidth ?? componentElement.offsetWidth ?? 1))
  const captureHeight = Math.max(1, Math.ceil(options.cropHeight ?? componentElement.offsetHeight ?? 1))
  const exportWidth = Math.max(1, Math.round(captureWidth * renderScale))
  const exportHeight = Math.max(1, Math.round(captureHeight * renderScale))

  const dataUrl = await domToImage.toPng(componentElement, {
    bgcolor: 'transparent',
    width: exportWidth,
    height: exportHeight,
    style: {
      width: `${captureWidth}px`,
      height: `${captureHeight}px`,
      transform: `scale(${renderScale})`,
      transformOrigin: 'top left',
      overflow: options.clipOverflow ? 'hidden' : 'visible',
    },
  })

  return createCanvasFromDataUrl(dataUrl, exportWidth, exportHeight)
}

async function captureComponentCanvas(component: IComponentInfo, componentElement: HTMLElement, renderScale: number, options?: ComponentCaptureOptions) {
  const originalTransform = componentElement.style.transform
  const originalOverflow = componentElement.style.overflow
  componentElement.style.transform = buildLocalComponentTransform(component)
  if (options?.clipOverflow) {
    componentElement.style.overflow = 'hidden'
  }
  await waitForRenderFrames(1)

  try {
    if (shouldUseDomToImageForText(component, options)) {
      return await captureTextComponentCanvasWithDomToImage(componentElement, renderScale, options ?? {})
    }

    const captureOptions: Parameters<typeof html2canvas>[1] = {
      backgroundColor: null,
      scale: renderScale,
      useCORS: true,
      logging: false,
      removeContainer: true,
    }

    if (options?.cropWidth) {
      captureOptions.width = Math.max(1, Math.ceil(options.cropWidth))
      captureOptions.windowWidth = captureOptions.width
    }

    if (options?.cropHeight) {
      captureOptions.height = Math.max(1, Math.ceil(options.cropHeight))
      captureOptions.windowHeight = captureOptions.height
    }

    return await html2canvas(componentElement, captureOptions)
  } finally {
    componentElement.style.transform = originalTransform
    componentElement.style.overflow = originalOverflow
    await waitForRenderFrames(1)
  }
}

function blendChannelWithWhite(channel: number, alpha: number) {
  return Math.round((channel * alpha + 255 * (255 - alpha)) / 255)
}

function rgbToCmyk(r: number, g: number, b: number) {
  const rUnit = r / 255
  const gUnit = g / 255
  const bUnit = b / 255
  const k = 1 - Math.max(rUnit, gUnit, bUnit)

  if (k >= 0.999999) {
    return [0, 0, 0, 255]
  }

  const denominator = 1 - k
  const c = (1 - rUnit - k) / denominator
  const m = (1 - gUnit - k) / denominator
  const y = (1 - bUnit - k) / denominator

  return [Math.round(Math.min(1, Math.max(0, c)) * 255), Math.round(Math.min(1, Math.max(0, m)) * 255), Math.round(Math.min(1, Math.max(0, y)) * 255), Math.round(Math.min(1, Math.max(0, k)) * 255)]
}

function canvasToCmykLayerImageData(canvas: HTMLCanvasElement, preserveTransparency: boolean): PrintLayerImageData {
  const context = canvas.getContext('2d', {willReadFrequently: true})
  if (!context) {
    throw new Error('Failed to read rendered canvas for print export')
  }

  const {width, height} = canvas
  const rgbaData = context.getImageData(0, 0, width, height).data
  const colorData = new Uint8Array(width * height * 4)
  const alphaData = preserveTransparency ? new Uint8Array(width * height) : undefined

  let colorIndex = 0
  let alphaIndex = 0
  for (let i = 0; i < rgbaData.length; i += 4) {
    const alpha = rgbaData[i + 3]
    const sourceR = preserveTransparency ? rgbaData[i] : blendChannelWithWhite(rgbaData[i], alpha)
    const sourceG = preserveTransparency ? rgbaData[i + 1] : blendChannelWithWhite(rgbaData[i + 1], alpha)
    const sourceB = preserveTransparency ? rgbaData[i + 2] : blendChannelWithWhite(rgbaData[i + 2], alpha)
    const [c, m, y, k] = alpha === 0 && preserveTransparency ? [0, 0, 0, 0] : rgbToCmyk(sourceR, sourceG, sourceB)

    colorData[colorIndex++] = c
    colorData[colorIndex++] = m
    colorData[colorIndex++] = y
    colorData[colorIndex++] = k

    if (alphaData) {
      alphaData[alphaIndex++] = alpha
    }
  }

  return {
    width,
    height,
    colorData,
    colorSpace: 'DeviceCMYK',
    decode: [0, 1, 0, 1, 0, 1, 0, 1],
    alphaData,
  }
}

function canvasToRgbLayerImageData(canvas: HTMLCanvasElement, preserveTransparency: boolean): PrintLayerImageData {
  const context = canvas.getContext('2d', {willReadFrequently: true})
  if (!context) {
    throw new Error('Failed to read rendered canvas for print export')
  }

  const {width, height} = canvas
  const rgbaData = context.getImageData(0, 0, width, height).data
  const colorData = new Uint8Array(width * height * 3)
  const alphaData = preserveTransparency ? new Uint8Array(width * height) : undefined

  let colorIndex = 0
  let alphaIndex = 0
  for (let i = 0; i < rgbaData.length; i += 4) {
    const alpha = rgbaData[i + 3]
    colorData[colorIndex++] = preserveTransparency ? rgbaData[i] : blendChannelWithWhite(rgbaData[i], alpha)
    colorData[colorIndex++] = preserveTransparency ? rgbaData[i + 1] : blendChannelWithWhite(rgbaData[i + 1], alpha)
    colorData[colorIndex++] = preserveTransparency ? rgbaData[i + 2] : blendChannelWithWhite(rgbaData[i + 2], alpha)

    if (alphaData) {
      alphaData[alphaIndex++] = alpha
    }
  }

  return {
    width,
    height,
    colorData,
    colorSpace: 'DeviceRGB',
    decode: [0, 1, 0, 1, 0, 1],
    alphaData,
  }
}

function canvasToLayerImageData(canvas: HTMLCanvasElement, preserveTransparency: boolean, colorMode: PrintPdfColorMode): PrintLayerImageData {
  return colorMode === 'cmyk' ? canvasToCmykLayerImageData(canvas, preserveTransparency) : canvasToRgbLayerImageData(canvas, preserveTransparency)
}

function getCssColorParserContext() {
  if (cssColorParserContext) {
    return cssColorParserContext
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  cssColorParserContext = canvas.getContext('2d')
  return cssColorParserContext
}

function parseHexColorValue(value: string): RgbaColorValue | null {
  const hex = value.replace('#', '').trim()
  if (![3, 4, 6, 8].includes(hex.length)) {
    return null
  }

  const normalized =
    hex.length <= 4
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  const alphaHex = normalized.length === 8 ? normalized.slice(6, 8) : 'ff'
  const alpha = Number.parseInt(alphaHex, 16) / 255

  if ([r, g, b].some((channel) => Number.isNaN(channel)) || Number.isNaN(alpha)) {
    return null
  }

  return {
    r,
    g,
    b,
    a: alpha,
  }
}

function parseCssColorValue(colorValue: string): RgbaColorValue | null {
  const normalizedInput = colorValue.trim().toLowerCase()
  if (!normalizedInput) {
    return null
  }

  const parser = getCssColorParserContext()
  let normalizedColor = normalizedInput
  if (parser) {
    parser.fillStyle = '#000000'
    parser.fillStyle = normalizedInput
    normalizedColor = parser.fillStyle.toString().toLowerCase()
  }

  if (normalizedColor === 'transparent') {
    return {r: 0, g: 0, b: 0, a: 0}
  }

  if (normalizedColor.startsWith('#')) {
    return parseHexColorValue(normalizedColor)
  }

  const match = normalizedColor.match(/^rgba?\(([^)]+)\)$/)
  if (!match) {
    return null
  }

  const values = match[1].split(',').map((item) => item.trim())
  if (values.length < 3) {
    return null
  }

  const r = Number.parseFloat(values[0])
  const g = Number.parseFloat(values[1])
  const b = Number.parseFloat(values[2])
  const a = values.length > 3 ? Number.parseFloat(values[3]) : 1

  if ([r, g, b, a].some((item) => Number.isNaN(item))) {
    return null
  }

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
    a: Math.max(0, Math.min(1, a)),
  }
}

function getEffectiveElementOpacity(element: HTMLElement, stopElement: HTMLElement) {
  let current: HTMLElement | null = element
  let opacity = 1

  while (current) {
    const currentOpacity = Number.parseFloat(getComputedStyle(current).opacity || '1')
    if (!Number.isNaN(currentOpacity)) {
      opacity *= currentOpacity
    }
    if (current === stopElement) {
      break
    }
    current = current.parentElement
  }

  return Math.max(0, Math.min(1, opacity))
}

function resolvePdfFillStyle(colorValue: string, opacityValue: number, colorMode: PrintPdfColorMode): PdfFillStyle | null {
  const rgbaColor = parseCssColorValue(colorValue)
  if (!rgbaColor) {
    return null
  }

  const opacity = Math.max(0, Math.min(1, rgbaColor.a * opacityValue))
  if (opacity <= 0) {
    return null
  }

  if (colorMode === 'cmyk') {
    const [c, m, y, k] = rgbToCmyk(rgbaColor.r, rgbaColor.g, rgbaColor.b)
    return {
      color: cmyk(c / 255, m / 255, y / 255, k / 255),
      opacity,
    }
  }

  return {
    color: rgb(rgbaColor.r / 255, rgbaColor.g / 255, rgbaColor.b / 255),
    opacity,
  }
}

function getPdfFillStyleKey(fillStyle: PdfFillStyle) {
  const color = fillStyle.color as any
  const type = color?.type ?? 'unknown'
  const channels = Array.isArray(color?.components) ? color.components.join(',') : ''
  return `${type}:${channels}:${(fillStyle.opacity ?? 1).toFixed(4)}`
}

function parseCssPixelValue(value: string, fallbackValue: number) {
  if (!value || value === 'normal') {
    return fallbackValue
  }

  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue
}

function getTextBaselineOffset(font: FontkitFont, fontSize: number, lineHeight: number) {
  const unitsPerEm = Math.max(1, font.unitsPerEm || 1000)
  const ascent = (font.ascent / unitsPerEm) * fontSize
  const descent = Math.abs((font.descent / unitsPerEm) * fontSize)
  const contentHeight = ascent + descent
  const extraSpace = Math.max(0, lineHeight - contentHeight)
  return extraSpace / 2 + ascent
}

function parseTransformMatrix(transformValue: string): Matrix2D {
  if (!transformValue || transformValue === 'none') {
    return {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0}
  }

  if (typeof DOMMatrixReadOnly !== 'undefined') {
    const matrix = new DOMMatrixReadOnly(transformValue)
    return {
      a: matrix.a,
      b: matrix.b,
      c: matrix.c,
      d: matrix.d,
      e: matrix.e,
      f: matrix.f,
    }
  }

  const matrixMatch = transformValue.match(/^matrix\(([^)]+)\)$/)
  if (!matrixMatch) {
    return {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0}
  }

  const values = matrixMatch[1].split(',').map((item) => Number.parseFloat(item.trim()))
  if (values.length !== 6 || values.some((item) => Number.isNaN(item))) {
    return {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0}
  }

  return {
    a: values[0],
    b: values[1],
    c: values[2],
    d: values[3],
    e: values[4],
    f: values[5],
  }
}

function segmentTextIntoGraphemes(text: string): GraphemeSegment[] {
  if (!text) {
    return []
  }

  const Segmenter = (Intl as any)?.Segmenter
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, {granularity: 'grapheme'})
    const segments: GraphemeSegment[] = []
    let offset = 0
    for (const item of segmenter.segment(text)) {
      const segmentText = String(item.segment ?? '')
      segments.push({
        text: segmentText,
        start: offset,
        end: offset + segmentText.length,
      })
      offset += segmentText.length
    }
    return segments
  }

  const fallbackSegments: GraphemeSegment[] = []
  let offset = 0
  for (const item of Array.from(text)) {
    fallbackSegments.push({
      text: item,
      start: offset,
      end: offset + item.length,
    })
    offset += item.length
  }

  return fallbackSegments
}

function getVisibleRangeRect(range: Range) {
  const visibleRect = Array.from(range.getClientRects()).find((rect) => rect.width > 0 || rect.height > 0)
  if (visibleRect) {
    return visibleRect
  }

  const boundingRect = range.getBoundingClientRect()
  if (boundingRect.width > 0 || boundingRect.height > 0) {
    return boundingRect
  }

  return null
}

function getSupportedFontFileName(fontName: string) {
  const normalizedFontName = fontName.trim()
  if (!normalizedFontName) {
    return null
  }

  if (fontFileNameCache.has(normalizedFontName)) {
    return fontFileNameCache.get(normalizedFontName) ?? null
  }

  const resolvedFileName = resolveFontFileCandidates(normalizedFontName)[0] ?? null

  fontFileNameCache.set(normalizedFontName, resolvedFileName)
  return resolvedFileName
}

function parseFontFamilies(fontFamilyValue: string) {
  return fontFamilyValue
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter((item) => item && !['sans-serif', 'serif', 'system-ui', 'ui-sans-serif', 'ui-serif', 'monospace', 'emoji', 'math', 'fangsong'].includes(item.toLowerCase()))
}

function dataUrlToUint8Array(dataUrl: string) {
  const base64Marker = 'base64,'
  const markerIndex = dataUrl.indexOf(base64Marker)
  if (markerIndex < 0) {
    return new Uint8Array()
  }

  const base64 = dataUrl.slice(markerIndex + base64Marker.length)
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let index = 0; index < binaryString.length; index++) {
    bytes[index] = binaryString.charCodeAt(index)
  }
  return bytes
}

async function loadOutlineFontResource(fontName: string): Promise<OutlineFontResource | null> {
  const normalizedFontName = fontName.trim()
  if (!normalizedFontName || !getSupportedFontFileName(normalizedFontName)) {
    return null
  }

  const cacheValue = parsedFontCache.get(normalizedFontName)
  if (cacheValue) {
    return cacheValue
  }

  const request = loadFontWithBufferSingle(normalizedFontName, `print-outline-font:${normalizedFontName}`)
    .then((fontDataUrl) => {
      if (!fontDataUrl) {
        return null
      }

      const fontBytes = dataUrlToUint8Array(String(fontDataUrl))
      if (!fontBytes.length) {
        return null
      }

      const parsedFont = fontkit.create(fontBytes)
      return {
        fontName: normalizedFontName,
        font: parsedFont,
      }
    })
    .catch((error) => {
      console.error('Failed to load outline font', normalizedFontName, error)
      parsedFontCache.delete(normalizedFontName)
      return null
    })

  parsedFontCache.set(normalizedFontName, request)
  return request
}

async function resolveOutlineFontForText(text: string, style: CSSStyleDeclaration, fallbackFontNames: string[]) {
  const visibleCodePoints = Array.from(text)
    .filter((item) => item.trim() !== '')
    .map((item) => item.codePointAt(0) ?? 0)
    .filter((item) => item > 0)

  const candidateFontNames = Array.from(
    new Set(
      [...parseFontFamilies(style.fontFamily), ...fallbackFontNames.map((item) => item.trim())]
        .map((item) => item.trim())
        .filter((item) => item !== ''),
    ),
  )

  let firstLoadedFont: OutlineFontResource | null = null
  for (const candidateFontName of candidateFontNames) {
    const fontResource = await loadOutlineFontResource(candidateFontName)
    if (!fontResource) {
      continue
    }

    if (!firstLoadedFont) {
      firstLoadedFont = fontResource
    }

    const supportsAllGlyphs = visibleCodePoints.every((codePoint) => fontResource.font.hasGlyphForCodePoint(codePoint))
    if (supportsAllGlyphs) {
      return fontResource
    }
  }

  return visibleCodePoints.length === 0 ? firstLoadedFont : null
}

function hasUnsupportedOutlineStyle(style: CSSStyleDeclaration) {
  const backgroundColor = parseCssColorValue(style.backgroundColor || '')
  const textStrokeWidth = style.getPropertyValue('-webkit-text-stroke-width')
  return (
    style.direction === 'rtl' ||
    (style.textShadow && style.textShadow !== 'none') ||
    (style.filter && style.filter !== 'none') ||
    (style.mixBlendMode && style.mixBlendMode !== 'normal') ||
    (style.textDecorationLine && style.textDecorationLine !== 'none') ||
    (textStrokeWidth && textStrokeWidth !== '0px' && textStrokeWidth !== 'initial') ||
    ((backgroundColor?.a ?? 0) > 0)
  )
}

function buildOutlinedGraphemePath(
  text: string,
  font: FontkitFont,
  fontSize: number,
  xLocal: number,
  baselineYLocal: number,
  componentMatrix: Matrix2D,
  pageWidthScale: number,
  pageHeightScale: number,
) {
  const glyphRun = font.layout(text)
  if (!glyphRun.glyphs.length) {
    return ''
  }

  const fontScale = fontSize / Math.max(1, font.unitsPerEm || 1000)
  let currentAdvanceX = 0
  const pathParts: string[] = []

  glyphRun.glyphs.forEach((glyph, glyphIndex) => {
    const glyphPath = glyph.path as any
    if (!glyphPath || typeof glyphPath.mapPoints !== 'function') {
      currentAdvanceX += glyphRun.positions[glyphIndex]?.xAdvance ?? glyph.advanceWidth ?? 0
      return
    }

    const glyphPosition = glyphRun.positions[glyphIndex] ?? {xAdvance: glyph.advanceWidth ?? 0, yAdvance: 0, xOffset: 0, yOffset: 0}
    const mappedPath = glyphPath.mapPoints((x: number, y: number) => {
      const localX = xLocal + (currentAdvanceX + glyphPosition.xOffset + x) * fontScale
      const localY = baselineYLocal - (glyphPosition.yOffset + y) * fontScale
      const pagePixelX = componentMatrix.a * localX + componentMatrix.c * localY + componentMatrix.e
      const pagePixelY = componentMatrix.b * localX + componentMatrix.d * localY + componentMatrix.f
      return [pagePixelX * pageWidthScale, pagePixelY * pageHeightScale]
    })

    const svgPath = mappedPath?.toSVG?.() ?? ''
    if (svgPath.trim()) {
      pathParts.push(svgPath)
    }

    currentAdvanceX += glyphPosition.xAdvance ?? glyph.advanceWidth ?? 0
  })

  return pathParts.join(' ')
}

async function buildOutlinedTextRuns(
  page: IEditorPageInfo,
  componentElement: HTMLElement,
  fallbackFontNames: string[],
  colorMode: PrintPdfColorMode,
): Promise<OutlineBuildResult> {
  const fail = (reason: string): OutlineBuildResult => ({
    runs: null,
    reason,
  })

  const textRoot = componentElement.querySelector<HTMLElement>('.ql-editor')
  if (!textRoot) {
    return fail('missing .ql-editor root')
  }

  if (textRoot.querySelector('li, img, svg, canvas, table, iframe, video, .ql-code-block, .ql-formula')) {
    return fail('contains unsupported rich content nodes')
  }

  const pagePoints = toPoints(page)
  const pagePixelSize = getPagePixelSize(page)
  const pageWidthScale = pagePoints.width / pagePixelSize.width
  const pageHeightScale = pagePoints.height / pagePixelSize.height
  const componentMatrix = parseTransformMatrix(getComputedStyle(componentElement).transform)
  const originalInlineTransform = componentElement.style.transform

  componentElement.style.transform = 'none'
  await waitForRenderFrames(1)

  try {
    const componentRect = componentElement.getBoundingClientRect()
    const treeWalker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    const outlineRuns: OutlinePathRun[] = []
    let currentRun: OutlinePathRun | null = null
    let hasVisibleText = false
    let hasOutlinedPath = false

    while (treeWalker.nextNode()) {
      const textNode = treeWalker.currentNode as Text
      const textContent = textNode.textContent ?? ''
      if (!textContent) {
        continue
      }

      const parentElement = textNode.parentElement
      if (!parentElement) {
        continue
      }

      const style = getComputedStyle(parentElement)
      if (style.display === 'none' || style.visibility === 'hidden') {
        continue
      }

      if (hasUnsupportedOutlineStyle(style)) {
        const unsupportedReasons = [
          style.direction === 'rtl' ? 'rtl-direction' : '',
          style.textShadow && style.textShadow !== 'none' ? 'text-shadow' : '',
          style.filter && style.filter !== 'none' ? 'filter' : '',
          style.mixBlendMode && style.mixBlendMode !== 'normal' ? 'mix-blend-mode' : '',
          style.textDecorationLine && style.textDecorationLine !== 'none' ? `text-decoration:${style.textDecorationLine}` : '',
          (() => {
            const textStrokeWidth = style.getPropertyValue('-webkit-text-stroke-width')
            return textStrokeWidth && textStrokeWidth !== '0px' && textStrokeWidth !== 'initial' ? `text-stroke:${textStrokeWidth}` : ''
          })(),
          (() => {
            const backgroundColor = parseCssColorValue(style.backgroundColor || '')
            return (backgroundColor?.a ?? 0) > 0 ? `background:${style.backgroundColor}` : ''
          })(),
        ]
          .filter((item) => item !== '')
          .join(', ')
        return fail(`contains unsupported text style${unsupportedReasons ? ` (${unsupportedReasons})` : ''}`)
      }

      const effectiveOpacity = getEffectiveElementOpacity(parentElement, componentElement)
      const fillStyle = resolvePdfFillStyle(style.color || 'rgb(0, 0, 0)', effectiveOpacity, colorMode)
      if (!fillStyle) {
        continue
      }

      const fontSize = Math.max(1, parseCssPixelValue(style.fontSize, 16))
      const textSegments = segmentTextIntoGraphemes(textContent)
      for (const segment of textSegments) {
        if (segment.text.trim() === '') {
          continue
        }

        hasVisibleText = true
        range.setStart(textNode, segment.start)
        range.setEnd(textNode, segment.end)
        const rangeRect = getVisibleRangeRect(range)
        if (!rangeRect) {
          return fail(`failed to measure text range for segment "${segment.text}"`)
        }

        const fontCandidates = Array.from(
          new Set(
            [...parseFontFamilies(style.fontFamily), ...fallbackFontNames.map((item) => item.trim())]
              .map((item) => item.trim())
              .filter((item) => item !== ''),
          ),
        )
        const fontResource = await resolveOutlineFontForText(segment.text, style, fallbackFontNames)
        if (!fontResource) {
          return fail(`missing outline font for segment "${segment.text}" with candidates: ${fontCandidates.join(', ') || 'none'}`)
        }

        const lineHeight = style.lineHeight === 'normal' ? Math.max(rangeRect.height, fontSize) : parseCssPixelValue(style.lineHeight, Math.max(rangeRect.height, fontSize))
        const baselineYLocal = rangeRect.top - componentRect.top + getTextBaselineOffset(fontResource.font, fontSize, Math.max(lineHeight, fontSize))
        const xLocal = rangeRect.left - componentRect.left
        const pathData = buildOutlinedGraphemePath(segment.text, fontResource.font, fontSize, xLocal, baselineYLocal, componentMatrix, pageWidthScale, pageHeightScale)
        if (!pathData) {
          return fail(`failed to build outline path for segment "${segment.text}" using font ${fontResource.fontName}`)
        }

        hasOutlinedPath = true
        const fillStyleKey = getPdfFillStyleKey(fillStyle)
        if (!currentRun || currentRun.key !== fillStyleKey) {
          currentRun = {
            key: fillStyleKey,
            pathData,
            color: fillStyle.color,
            opacity: fillStyle.opacity,
          }
          outlineRuns.push(currentRun)
        } else {
          currentRun.pathData += ` ${pathData}`
        }
      }
    }

    if (hasVisibleText && !hasOutlinedPath) {
      return fail('visible text found but no outline path was generated')
    }

    return {
      runs: outlineRuns,
    }
  } finally {
    componentElement.style.transform = originalInlineTransform
    await waitForRenderFrames(1)
  }
}
async function loadColorProfileBytes(profile: PrintPdfColorProfile) {
  const cacheValue = colorProfileBytesCache.get(profile.assetPath)
  if (cacheValue) {
    return cacheValue
  }

  const request = fetch(profile.assetPath)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ICC profile: ${profile.assetPath}`)
      }
      return new Uint8Array(await response.arrayBuffer())
    })
    .catch((error) => {
      colorProfileBytesCache.delete(profile.assetPath)
      throw error
    })

  colorProfileBytesCache.set(profile.assetPath, request)
  return request
}

async function registerDocumentColorProfile(pdfDoc: PDFDocument, profile: PrintPdfColorProfile) {
  const profileBytes = await loadColorProfileBytes(profile)
  const iccStream = pdfDoc.context.flateStream(profileBytes, {
    N: 4,
  })
  const iccProfileRef = pdfDoc.context.register(iccStream)

  const outputIntent = pdfDoc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFX',
    OutputConditionIdentifier: PDFString.of(profile.outputConditionIdentifier),
    OutputCondition: PDFString.of(profile.outputCondition ?? profile.profileName),
    Info: PDFString.of(profile.info ?? profile.profileName),
    RegistryName: PDFString.of(profile.registryName ?? 'https://www.eci.org/'),
    DestOutputProfile: iccProfileRef,
  })
  const outputIntentRef = pdfDoc.context.register(outputIntent)

  pdfDoc.catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([outputIntentRef]))
  pdfDoc.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOC'))

  return iccProfileRef
}

function sanitizeLayerLabelPart(value?: string | number) {
  const normalized = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) {
    return ''
  }
  return normalized.slice(0, 60)
}

function getComponentLayerLabel(pageIndex: number, typeLabel: string, component: IComponentInfo, index: number) {
  const suffix = sanitizeLayerLabelPart(component.name ?? component.des ?? component.componentId ?? component.id)
  return suffix ? `Page ${pageIndex + 1} / ${typeLabel} ${index + 1} / ${suffix}` : `Page ${pageIndex + 1} / ${typeLabel} ${index + 1}`
}

function getPageBackgroundLayerKey(pageIndex: number) {
  return `page-${pageIndex + 1}-background`
}

function getPageOtherLayerKey(pageIndex: number) {
  return `page-${pageIndex + 1}-other`
}

function getComponentLayerKey(pageIndex: number, type: 'image' | 'text', component: IComponentInfo, index: number) {
  const componentKey = String(component.componentId ?? component.id ?? `${type}-${index + 1}`)
  return `page-${pageIndex + 1}-${type}-${componentKey}`
}

function buildDocumentLayerSpecs(editor: IEditorInfo) {
  const specs: PrintLayerSpec[] = []

  editor.pageList.forEach((page, pageIndex) => {
    specs.push({
      key: getPageBackgroundLayerKey(pageIndex),
      label: `Page ${pageIndex + 1} / Background`,
    })

    page.componentList.forEach((component, index) => {
      if (isImageComponent(component)) {
        specs.push({
          key: getComponentLayerKey(pageIndex, 'image', component, index),
          label: getComponentLayerLabel(pageIndex, 'Image', component, index),
        })
      }
      if (isTextComponent(component)) {
        specs.push({
          key: getComponentLayerKey(pageIndex, 'text', component, index),
          label: getComponentLayerLabel(pageIndex, 'Text', component, index),
        })
      }
    })

    if (page.componentList.some((component) => isOtherComponent(component))) {
      specs.push({
        key: getPageOtherLayerKey(pageIndex),
        label: `Page ${pageIndex + 1} / Other`,
      })
    }
  })

  return specs
}

function registerOptionalContentLayers(pdfDoc: PDFDocument, layerSpecs: PrintLayerSpec[]) {
  const entries = layerSpecs.map((layer, index) => {
    const ocgRef = pdfDoc.context.register(
      pdfDoc.context.obj({
        Type: 'OCG',
        Name: PDFString.of(layer.label),
      }),
    )

    return {
      key: layer.key,
      label: layer.label,
      ref: ocgRef,
      resourceName: PDFName.of(`Lyr${index + 1}`),
    } as RegisteredOptionalContentLayer
  })

  const ocgRefs = entries.map((entry) => entry.ref)
  const ocProperties = pdfDoc.context.obj({
    OCGs: pdfDoc.context.obj(ocgRefs),
    D: pdfDoc.context.obj({
      Name: PDFString.of('Print Export Layers'),
      BaseState: 'ON',
      Order: pdfDoc.context.obj(ocgRefs),
      ON: pdfDoc.context.obj(ocgRefs),
    }),
  })

  pdfDoc.catalog.set(PDFName.of('OCProperties'), ocProperties)
  pdfDoc.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOC'))

  return entries.reduce(
    (acc, entry) => {
      acc[entry.key] = entry
      return acc
    },
    {} as Record<string, RegisteredOptionalContentLayer>,
  )
}

function attachOptionalContentProperties(pdfPage: PDFPage, layerEntries: RegisteredOptionalContentLayer[]) {
  const resources = pdfPage.node.normalizedEntries().Resources
  let properties = resources.lookupMaybe(PDFName.of('Properties'), PDFDict)
  if (!properties) {
    properties = pdfPage.node.context.obj({}) as PDFDict
    resources.set(PDFName.of('Properties'), properties)
  }

  layerEntries.forEach((entry) => {
    properties?.set(entry.resourceName, entry.ref)
  })
}

function registerAlphaMask(pdfDoc: PDFDocument, width: number, height: number, alphaData?: Uint8Array) {
  if (!alphaData) {
    return undefined
  }

  const alphaStream = pdfDoc.context.flateStream(alphaData, {
    Type: 'XObject',
    Subtype: 'Image',
    BitsPerComponent: 8,
    Width: width,
    Height: height,
    ColorSpace: 'DeviceGray',
    Decode: [0, 1],
  })

  return pdfDoc.context.register(alphaStream)
}

function registerLayerImage(pdfDoc: PDFDocument, imageData: PrintLayerImageData) {
  const alphaMaskRef = registerAlphaMask(pdfDoc, imageData.width, imageData.height, imageData.alphaData)
  const imageStream = pdfDoc.context.flateStream(imageData.colorData, {
    Type: 'XObject',
    Subtype: 'Image',
    BitsPerComponent: 8,
    Width: imageData.width,
    Height: imageData.height,
    ColorSpace: imageData.colorSpace,
    Decode: imageData.decode,
    Interpolate: true,
    SMask: alphaMaskRef,
  })

  return pdfDoc.context.register(imageStream)
}

function setPageBoxes(page: IEditorPageInfo, pdfPage: PDFPage) {
  const pagePoints = toPoints(page)
  if (typeof pdfPage.setCropBox === 'function') {
    pdfPage.setCropBox(0, 0, pagePoints.width, pagePoints.height)
    pdfPage.setTrimBox(0, 0, pagePoints.width, pagePoints.height)
    pdfPage.setBleedBox(0, 0, pagePoints.width, pagePoints.height)
  }
}

function drawLayerImage(page: IEditorPageInfo, pdfPage: PDFPage, imageRef: PDFRef, layerEntry: RegisteredOptionalContentLayer, placement: PixelPlacement) {
  const pagePoints = toPoints(page)
  const pagePixelSize = getPagePixelSize(page)
  const xObjectKey = pdfPage.node.newXObject('Image', imageRef)

  const widthScale = pagePoints.width / pagePixelSize.width
  const heightScale = pagePoints.height / pagePixelSize.height
  const x = placement.left * widthScale
  const y = pagePoints.height - (placement.top + placement.height) * heightScale
  const width = placement.width * widthScale
  const height = placement.height * heightScale

  pdfPage.pushOperators(
    PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [PDFName.of('OC'), layerEntry.resourceName]),
    ...drawImageOperator(xObjectKey, {
      x,
      y,
      width,
      height,
      rotate: degrees(0),
      xSkew: degrees(0),
      ySkew: degrees(0),
    }),
    PDFOperator.of(PDFOperatorNames.EndMarkedContent),
  )
}

function getFullPagePlacement(page: IEditorPageInfo): PixelPlacement {
  const pagePixelSize = getPagePixelSize(page)
  return {
    left: 0,
    top: 0,
    width: pagePixelSize.width,
    height: pagePixelSize.height,
  }
}

async function addFullPageLayer(
  pdfDoc: PDFDocument,
  pdfPage: PDFPage,
  page: IEditorPageInfo,
  layerEntry: RegisteredOptionalContentLayer | undefined,
  canvas: HTMLCanvasElement | null,
  preserveTransparency: boolean,
  colorMode: PrintPdfColorMode,
) {
  if (!layerEntry || !canvas) {
    return
  }

  const imageData = canvasToLayerImageData(canvas, preserveTransparency, colorMode)
  const imageRef = registerLayerImage(pdfDoc, imageData)
  drawLayerImage(page, pdfPage, imageRef, layerEntry, getFullPagePlacement(page))
}

async function addComponentLayer(
  pdfDoc: PDFDocument,
  pdfPage: PDFPage,
  page: IEditorPageInfo,
  component: IComponentInfo,
  componentElement: HTMLElement | undefined,
  layerEntry: RegisteredOptionalContentLayer | undefined,
  renderScale: number,
  pageElement: HTMLElement,
  colorMode: PrintPdfColorMode,
) {
  if (!componentElement || !layerEntry) {
    return
  }

  const useModelBoxCapture = isTextComponent(component) && !hasComponentTransform(component)
  const placement = useModelBoxCapture ? (measureComponentModelPlacement(component) ?? measureComponentPlacement(pageElement, componentElement)) : measureComponentPlacement(pageElement, componentElement)
  if (!placement) {
    return
  }

  const canvas = await captureComponentCanvas(
    component,
    componentElement,
    renderScale,
    useModelBoxCapture
      ? {
          cropWidth: placement.width,
          cropHeight: placement.height,
          clipOverflow: true,
        }
      : undefined,
  )
  if (!canvas.width || !canvas.height) {
    return
  }

  if (!useModelBoxCapture) {
    placement.width = canvas.width / renderScale
    placement.height = canvas.height / renderScale
  }

  const imageData = canvasToLayerImageData(canvas, true, colorMode)
  const imageRef = registerLayerImage(pdfDoc, imageData)
  drawLayerImage(page, pdfPage, imageRef, layerEntry, placement)
}

async function addTextOutlineLayer(
  pdfPage: PDFPage,
  page: IEditorPageInfo,
  pageIndex: number,
  component: IComponentInfo,
  componentElement: HTMLElement | undefined,
  layerEntry: RegisteredOptionalContentLayer | undefined,
  colorMode: PrintPdfColorMode,
  fallbackFontNames: string[],
) {
  const debugLabel = getOutlineDebugLabel(component, pageIndex)
  if (!componentElement || !layerEntry) {
    console.warn(`${debugLabel} fallback to image: missing component element or layer entry`)
    return false
  }

  const outlineResult = await buildOutlinedTextRuns(page, componentElement, fallbackFontNames, colorMode)
  if (!outlineResult.runs) {
    console.warn(`${debugLabel} fallback to image: ${outlineResult.reason ?? 'unknown outline failure'}`)
    return false
  }

  const pagePoints = toPoints(page)
  if (outlineResult.runs.length === 0) {
    console.info(`${debugLabel} outline succeeded: text component is empty or whitespace-only`)
    return true
  }

  pdfPage.pushOperators(PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [PDFName.of('OC'), layerEntry.resourceName]))
  outlineResult.runs.forEach((run) => {
    pdfPage.drawSvgPath(run.pathData, {
      x: 0,
      y: pagePoints.height,
      color: run.color,
      opacity: run.opacity,
    })
  })
  pdfPage.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))
  console.info(`${debugLabel} outline succeeded with ${outlineResult.runs.length} path run(s)`)
  return true
}
export async function exportPrintPdfCmyk(editor: IEditorInfo, allFontMap: Record<string, Record<string, FontSizeInfoType>>, options: PrintPdfExportOptions) {
  const maxRenderScale = options.maxRenderScale ?? 3
  const renderScale = Math.min(Math.max(options.renderScale ?? 2, 2), maxRenderScale)
  const colorProfile = options.colorProfile ?? DEFAULT_PRINT_PDF_COLOR_PROFILE
  const colorMode = options.colorMode ?? 'cmyk'
  const embedOutputIntent = colorMode === 'cmyk' && (options.embedOutputIntent ?? false)
  const outlineText = options.outlineText ?? false
  const pdfDoc = await PDFDocument.create()

  const fontList = collectFonts(editor, allFontMap)
  await loadFontListWithBufferInStyleSheets(fontList)
  await document.fonts.ready

  if (embedOutputIntent) {
    await registerDocumentColorProfile(pdfDoc, colorProfile)
  }

  const layerEntries = registerOptionalContentLayers(pdfDoc, buildDocumentLayerSpecs(editor))

  for (const [pageIndex, page] of editor.pageList.entries()) {
    const pagePoints = toPoints(page)
    const pdfPage = pdfDoc.addPage([pagePoints.width, pagePoints.height])
    const backgroundLayerEntry = layerEntries[getPageBackgroundLayerKey(pageIndex)]
    const otherLayerEntry = layerEntries[getPageOtherLayerKey(pageIndex)]
    const pageLayerEntries: RegisteredOptionalContentLayer[] = [backgroundLayerEntry]
    if (otherLayerEntry) {
      pageLayerEntries.push(otherLayerEntry)
    }

    page.componentList.forEach((component, componentIndex) => {
      if (isImageComponent(component)) {
        pageLayerEntries.push(layerEntries[getComponentLayerKey(pageIndex, 'image', component, componentIndex)])
      }
      if (isTextComponent(component)) {
        pageLayerEntries.push(layerEntries[getComponentLayerKey(pageIndex, 'text', component, componentIndex)])
      }
    })

    attachOptionalContentProperties(
      pdfPage,
      pageLayerEntries.filter((entry): entry is RegisteredOptionalContentLayer => !!entry),
    )

    const renderedPage = await renderPageContext(page, allFontMap, editor.translationType ?? 'cn')

    try {
      const backgroundComponentIds = new Set(page.componentList.filter((component) => isBackgroundComponent(component)).map((component, index) => String(component.componentId ?? component.id ?? `background-${index + 1}`)))
      const otherComponentIds = new Set(page.componentList.filter((component) => isOtherComponent(component)).map((component, index) => String(component.componentId ?? component.id ?? `other-${index + 1}`)))

      const backgroundCanvas = await capturePageCanvas(renderedPage, page, renderScale, '#ffffff', backgroundComponentIds)
      await addFullPageLayer(pdfDoc, pdfPage, page, backgroundLayerEntry, backgroundCanvas, false, colorMode)

      if (otherComponentIds.size > 0) {
        const otherCanvas = await capturePageCanvas(renderedPage, page, renderScale, null, otherComponentIds)
        await addFullPageLayer(pdfDoc, pdfPage, page, otherLayerEntry, otherCanvas, true, colorMode)
      }

      for (const [componentIndex, component] of page.componentList.entries()) {
        const componentId = String(component.componentId ?? component.id ?? '')
        const componentElement = componentId ? renderedPage.componentElements.get(componentId) : undefined

        if (isImageComponent(component)) {
          const imageLayerEntry = layerEntries[getComponentLayerKey(pageIndex, 'image', component, componentIndex)]
          await addComponentLayer(pdfDoc, pdfPage, page, component, componentElement, imageLayerEntry, renderScale, renderedPage.pageElement, colorMode)
        }

        if (isTextComponent(component)) {
          const textLayerEntry = layerEntries[getComponentLayerKey(pageIndex, 'text', component, componentIndex)]
          const componentFontInfo = getComponentFontInfo(component, allFontMap, component.lang ?? editor.translationType ?? 'cn')
          const outlined = outlineText
            ? await addTextOutlineLayer(pdfPage, page, pageIndex, component, componentElement, textLayerEntry, colorMode, [component.fontName ?? '', componentFontInfo.font ?? '', 'OPlusSans3-Regular'])
            : false

          if (!outlined) {
            await addComponentLayer(pdfDoc, pdfPage, page, component, componentElement, textLayerEntry, renderScale, renderedPage.pageElement, colorMode)
          }
        }
      }
    } finally {
      renderedPage.cleanup()
    }

    setPageBoxes(page, pdfPage)
  }

  const pdfBytes = await pdfDoc.save({useObjectStreams: false})
  const blob = new Blob([pdfBytes], {type: 'application/pdf'})
  const blobUrl = URL.createObjectURL(blob)
  const downloadLink = document.createElement('a')
  downloadLink.href = blobUrl
  downloadLink.download = `${options.fileName}.pdf`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
  URL.revokeObjectURL(blobUrl)
}
