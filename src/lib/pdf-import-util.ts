import type {IComponentInfo, IEditorPageInfo, IPageSize} from '@/view/editor/utils/common-modle'
import {EComponentType, EPageSizeType} from '@/view/editor/utils/common-modle'
import type {IOCRPage, IOCRResponse, IOCRTextBlock} from '@/net/ocrApi'
import {cloneDeep} from 'lodash'

/**
 * PDF 导入配置
 */
export interface IPDFImportConfig {
  // 默认字体
  defaultFont?: string
  // 默认字号（磅）
  defaultFontSize?: number
  // 默认文本类型
  defaultTextType?: string
  // 默认语言
  defaultLang?: string
  // DPI 设置
  dpi?: number
  // 是否自动调整组件大小以适应页面
  autoFitPage?: boolean
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<IPDFImportConfig> = {
  defaultFont: 'Arial',
  defaultFontSize: 12, // 12磅
  defaultTextType: 'Yaber正文',
  defaultLang: 'cn',
  dpi: 254,
  autoFitPage: true,
}

/**
 * 将 OCR 文本块转换为编辑器文本组件
 * @param textBlock OCR 识别的文本块
 * @param pageId 页面 ID
 * @param componentIndex 组件索引
 * @param config 导入配置
 * @returns 编辑器组件信息
 */
function convertTextBlockToComponent(textBlock: IOCRTextBlock, pageId: string, componentIndex: number, config: Required<IPDFImportConfig>): IComponentInfo {
  const timestamp = new Date().getTime() + componentIndex
  const componentId = `${pageId}C${timestamp}`

  // 创建 Quill Delta 格式的文本内容
  const deltaOps = [
    {
      insert: textBlock.text + '\n',
      attributes: {
        font: config.defaultFont,
        size: `${config.defaultFontSize}pt`,
        color: '#000000',
      },
    },
  ]

  // 创建组件
  const component: IComponentInfo = {
    componentId: componentId,
    id: componentId,
    componentType: EComponentType.Text,
    component: 'text',
    text: textBlock.text,
    semanticHTML: `<p>${textBlock.text}</p>`,
    deltaOps: deltaOps,

    // 位置和尺寸（使用 OCR 返回的 location）
    left: textBlock.location.left,
    top: textBlock.location.top,
    width: textBlock.location.width,
    height: textBlock.location.height,

    // 样式设置
    angle: 0,
    zindex: 1 + componentIndex,
    selected: false,
    editable: true,
    disabled: false,

    // 字体设置
    fontName: config.defaultFont,
    fontSize: config.defaultFontSize,
    textType: config.defaultTextType,
    lang: config.defaultLang,

    // 样式对象
    style: {
      fontFamily: config.defaultFont,
      fontSize: `${config.defaultFontSize}pt`,
      color: '#000000',
      textAlign: 'left',
    },

    divStyle: {
      fontFamily: config.defaultFont,
      fontSize: `${config.defaultFontSize}pt`,
      color: '#000000',
    },
  }

  return component
}

/**
 * 将 OCR 页面转换为编辑器页面
 * @param ocrPage OCR 识别的页面
 * @param pageIndex 页面索引
 * @param projectId 项目 ID
 * @param config 导入配置
 * @returns 编辑器页面信息
 */
function convertOCRPageToEditorPage(ocrPage: IOCRPage, pageIndex: number, projectId: string, config: Required<IPDFImportConfig>): IEditorPageInfo {
  const timestamp = new Date().getTime()
  const pageId = `${projectId}P${timestamp + pageIndex * 1000}`

  // 创建页面尺寸配置
  // OCR 返回的宽高是像素值，需要转换为毫米
  const pixelWidth = ocrPage.width
  const pixelHeight = ocrPage.height

  // 将像素转换为毫米（假设 DPI）
  const mmWidth = (pixelWidth / config.dpi) * 25.4
  const mmHeight = (pixelHeight / config.dpi) * 25.4

  const pageSize: IPageSize = {
    sizeName: 'Custom',
    width: Math.round(mmWidth),
    height: Math.round(mmHeight),
    dpi: config.dpi,
    isCustomize: true,
    type: EPageSizeType.Millimetre,
    pixelWidth: pixelWidth,
    pixelHeight: pixelHeight,
  }

  // 转换所有文本块为组件
  const componentList: IComponentInfo[] = ocrPage.text_blocks.map((textBlock, index) => {
    return convertTextBlockToComponent(textBlock, pageId, index, config)
  })

  // 创建编辑器页面
  const editorPage: IEditorPageInfo = {
    id: pageId,
    pageId: pageId,
    pageSize: pageSize,
    componentList: componentList,
    lang: config.defaultLang,
  }

  return editorPage
}

/**
 * 将 OCR 响应转换为编辑器页面列表
 */
export function convertOCRToEditorPages(ocrResponse: IOCRResponse, projectId: string, config?: Partial<IPDFImportConfig>): IEditorPageInfo[] {
  const finalConfig: Required<IPDFImportConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  // 检查智谱 AI 实际返回格式
  if (!ocrResponse.layout_details || !ocrResponse.data_info) {
    throw new Error('OCR 识别结果格式错误')
  }

  const {layout_details, data_info} = ocrResponse
  const editorPages: IEditorPageInfo[] = []

  // 遍历每一页
  layout_details.forEach((pageBlocks, pageIndex) => {
    const timestamp = new Date().getTime()
    const pageId = `${projectId}P${timestamp + pageIndex * 1000}`

    // 获取页面尺寸
    const pageInfo = data_info.pages[pageIndex]
    const pixelWidth = pageInfo.width
    const pixelHeight = pageInfo.height

    // 转换为毫米
    const mmWidth = (pixelWidth / finalConfig.dpi) * 25.4
    const mmHeight = (pixelHeight / finalConfig.dpi) * 25.4

    const pageSize: IPageSize = {
      sizeName: 'Custom',
      width: Math.round(mmWidth),
      height: Math.round(mmHeight),
      dpi: finalConfig.dpi,
      isCustomize: true,
      type: EPageSizeType.Millimetre,
      pixelWidth: pixelWidth,
      pixelHeight: pixelHeight,
    }

    // 转换文本块（只处理 text 类型）
    const componentList: IComponentInfo[] = []
    let componentIndex = 0

    pageBlocks.forEach((block) => {
      if (block.label === 'text' && block.content) {
        const [left, top, right, bottom] = block.bbox_2d
        const width = right - left
        const height = bottom - top

        const componentTimestamp = timestamp + pageIndex * 1000 + componentIndex * 100
        const componentId = `${pageId}C${componentTimestamp}`

        const deltaOps = [
          {
            insert: block.content,
          },
          {
            insert: '\n',
          },
        ]

        const component: IComponentInfo = {
          componentId: componentId,
          id: componentId,
          componentType: EComponentType.Text,
          component: './text/quill-text-view.vue',
          text: block.content,
          semanticHTML: `<p>${block.content}</p>`,
          deltaOps: deltaOps,
          left: left,
          top: top,
          width: width,
          height: height,
          angle: 0,
          zindex: 1 + componentIndex,
          selected: false,
          editable: true,
          disabled: false,
          fontName: finalConfig.defaultFont,
          fontSize: finalConfig.defaultFontSize,
          textType: finalConfig.defaultTextType,
          lang: finalConfig.defaultLang,
          style: {
            fontFamily: finalConfig.defaultFont,
            fontSize: `${finalConfig.defaultFontSize}pt`,
            color: '#000000',
            textAlign: 'left',
          },
          divStyle: {
            fontFamily: finalConfig.defaultFont,
            fontSize: `${finalConfig.defaultFontSize}pt`,
            color: '#000000',
          },
        }

        componentList.push(component)
        componentIndex++
      }
    })

    const editorPage: IEditorPageInfo = {
      id: pageId,
      pageId: pageId,
      pageSize: pageSize,
      componentList: componentList,
      lang: finalConfig.defaultLang,
    }

    editorPages.push(editorPage)
  })

  return editorPages
}

/**
 * 计算页面最佳尺寸（根据标准纸张尺寸）
 * @param width 宽度（毫米）
 * @param height 高度（毫米）
 * @returns 标准尺寸名称或 'Custom'
 */
export function detectPageSize(width: number, height: number): string {
  const tolerance = 5 // 允许 5mm 的误差

  const standardSizes: Record<string, {width: number; height: number}> = {
    A4: {width: 210, height: 297},
    A3: {width: 297, height: 420},
    A5: {width: 148, height: 210},
    Letter: {width: 216, height: 279},
    Legal: {width: 216, height: 356},
  }

  for (const [name, size] of Object.entries(standardSizes)) {
    // 检查纵向
    if (Math.abs(width - size.width) <= tolerance && Math.abs(height - size.height) <= tolerance) {
      return name
    }
    // 检查横向
    if (Math.abs(width - size.height) <= tolerance && Math.abs(height - size.width) <= tolerance) {
      return name
    }
  }

  return 'Custom'
}

/**
 * 预览 OCR 识别结果统计信息
 * @param ocrResponse OCR API 响应
 * @returns 统计信息
 */
export function getOCRStatistics(ocrResponse: IOCRResponse) {
  const totalPages = ocrResponse.data_info?.num_pages || 0
  let totalTextBlocks = 0
  let totalCharacters = 0

  ocrResponse.layout_details?.forEach((pageBlocks) => {
    pageBlocks.forEach((block) => {
      if (block.label === 'text' && block.content) {
        totalTextBlocks++
        totalCharacters += block.content.length
      }
    })
  })

  return {
    totalPages,
    totalTextBlocks,
    totalCharacters,
    averageBlocksPerPage: totalPages > 0 ? Math.round(totalTextBlocks / totalPages) : 0,
  }
}
