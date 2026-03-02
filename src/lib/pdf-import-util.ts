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
 * 清理 LaTeX 公式，提取纯文本
 * @param content LaTeX 格式的公式
 * @returns 纯文本内容
 */
function cleanLatex(content: string): string {
  let cleaned = content
    // 移除 $$ 包裹
    .replace(/^\$\$\s*/g, '')
    .replace(/\s*\$\$$/g, '')
    // 移除行内 $ 包裹（包括单个 $ 和成对的 $）
    .replace(/\$([^$]+)\$/g, '$1') // $content$ → content
    .replace(/\$/g, '') // 移除剩余的单个 $
    // 移除换行
    .replace(/\n/g, ' ')
    // 移除 LaTeX 命令（保留内容）
    .replace(/\\textcircled\{([^}]*)\}/g, '($1)') // \textcircled{1} → (1)
    .replace(/\\([a-zA-Z]+)\{([^}]*)\}/g, '$2') // \command{content} → content
    .replace(/\\([a-zA-Z]+)/g, '') // \command → 空
    // 移除特殊符号
    .replace(/[{}]/g, '')
    .replace(/_/g, ' ')
    .replace(/\^/g, ' ')
    // 清理多余空格
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || '[公式]' // 如果清理后为空，显示占位符
}

/**
 * 检测字符串是否包含 LaTeX 公式
 * @param content 待检测的内容
 * @returns 是否包含 LaTeX
 */
function hasLatex(content: string): boolean {
  return /\$|\\\w+\{|\\[a-zA-Z]+/.test(content)
}

/**
 * 检测字符串是否包含 HTML 标签
 * @param content 待检测的内容
 * @returns 是否包含 HTML
 */
function isHtml(content: string): boolean {
  return /<[^>]+>/.test(content)
}

/**
 * 生成默认占位图片（SVG 格式）
 * @param width 图片宽度
 * @param height 图片高度
 * @returns base64 编码的 SVG 图片
 */
function getDefaultPlaceholderImage(width: number, height: number): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f5f5f5" stroke="#d0d0d0" stroke-width="2"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#999" font-family="Arial">
        图片占位符
      </text>
      <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#bbb" font-family="Arial">
        ${Math.round(width)} × ${Math.round(height)}
      </text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
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

  // ✅ 修复: 在循环外部获取一次基准时间戳，避免 ID 冲突
  const baseTimestamp = new Date().getTime()

  // 遍历每一页
  layout_details.forEach((pageBlocks, pageIndex) => {
    // ✅ 使用基准时间戳 + 较大的偏移量，并添加 -imported 后缀
    const pageTimestamp = baseTimestamp + pageIndex * 10000 // 每页间隔 10 秒
    const pageId = `${projectId}P${pageTimestamp}-imported`

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

    // 转换文本块、图片、公式等
    const componentList: IComponentInfo[] = []
    let componentIndex = 0

    pageBlocks.forEach((block) => {
      const [left, top, right, bottom] = block.bbox_2d
      const width = right - left
      const height = bottom - top

      // ✅ 每个组件间隔 100ms
      const componentTimestamp = pageTimestamp + componentIndex * 100
      const componentId = `${pageId}C${componentTimestamp}`

      // ✅ 处理文本类型
      if (block.label === 'text' && block.content) {
        let cleanContent = block.content
        let deltaOps: any[]

        // 检查是否包含 LaTeX 公式
        if (hasLatex(block.content)) {
          // 清理 LaTeX 公式
          cleanContent = cleanLatex(block.content)
          deltaOps = [
            {
              insert: cleanContent,
            },
            {
              insert: '\n',
            },
          ]
        }
        // 检查是否包含 HTML
        else if (isHtml(block.content)) {
          // TODO: 实现 HTML 到 DeltaOps 的转换
          // 暂时先移除 HTML 标签，显示纯文本
          cleanContent = block.content.replace(/<[^>]+>/g, '')
          deltaOps = [
            {
              insert: cleanContent,
            },
            {
              insert: '\n',
            },
          ]
        } else {
          deltaOps = [
            {
              insert: block.content,
            },
            {
              insert: '\n',
            },
          ]
        }

        const component: IComponentInfo = {
          componentId: componentId,
          id: componentId,
          componentType: EComponentType.Text,
          component: './text/quill-text-view.vue',
          text: cleanContent,
          semanticHTML: `<p>${cleanContent}</p>`,
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
      // ✅ 处理公式类型（LaTeX）
      else if (block.label === 'formula' && block.content) {
        // 清理 LaTeX，只显示纯文本
        const cleanContent = cleanLatex(block.content)

        const deltaOps = [
          {
            insert: cleanContent,
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
          text: cleanContent,
          semanticHTML: `<p>${cleanContent}</p>`,
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
            color: '#666666', // 公式用灰色显示
            textAlign: 'left',
            fontStyle: 'italic', // 公式用斜体
          },
          divStyle: {
            fontFamily: finalConfig.defaultFont,
            fontSize: `${finalConfig.defaultFontSize}pt`,
            color: '#666666',
            fontStyle: 'italic',
          },
        }

        componentList.push(component)
        componentIndex++
      }
      // ✅ 处理图片类型
      else if (block.label === 'image') {
        // 生成占位图片
        const placeholderImage = getDefaultPlaceholderImage(width, height)

        const component: IComponentInfo = {
          componentId: componentId,
          id: componentId,
          componentType: EComponentType.Image,
          component: './image/image-view.vue',
          imageSrc: placeholderImage,  // ✅ 修正: 使用 imageSrc 而不是 imgUrl
          left: left,
          top: top,
          width: width,
          height: height,
          angle: 0,
          zindex: 1 + componentIndex,
          selected: false,
          editable: true,
          disabled: false,
          // 图片特有属性
          originalWidth: width,
          originalHeight: height,
          flipX: false,
          flipY: false,
          opacity: 1,
          deltaOps: [],  // 图片组件也需要 deltaOps
        }

        componentList.push(component)
        componentIndex++
      }
      // 其他类型暂时忽略（table, title 等）
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
  let totalFormulaBlocks = 0
  let totalImageBlocks = 0
  let totalCharacters = 0

  ocrResponse.layout_details?.forEach((pageBlocks) => {
    pageBlocks.forEach((block) => {
      if (block.label === 'text' && block.content) {
        totalTextBlocks++
        totalCharacters += block.content.length
      } else if (block.label === 'formula' && block.content) {
        totalFormulaBlocks++
        // 公式也计入字符数（使用清理后的文本）
        const cleanContent = cleanLatex(block.content)
        totalCharacters += cleanContent.length
      } else if (block.label === 'image') {
        totalImageBlocks++
      }
    })
  })

  return {
    totalPages,
    totalTextBlocks,
    totalFormulaBlocks,
    totalImageBlocks,
    totalCharacters,
    averageBlocksPerPage: totalPages > 0 ? Math.round((totalTextBlocks + totalFormulaBlocks + totalImageBlocks) / totalPages) : 0,
  }
}
