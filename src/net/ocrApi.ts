import axios, {type AxiosProgressEvent} from 'axios'

// 智谱 AI OCR API 响应类型定义
export interface IOCRLocation {
  left: number
  top: number
  width: number
  height: number
}

export interface IOCRTextBlock {
  text: string
  location: IOCRLocation
  confidence?: number
}

export interface IOCRPage {
  page_number: number
  width: number
  height: number
  text_blocks: IOCRTextBlock[]
}

export interface IOCRResponse {
  code?: number
  message?: string
  data?: {
    pages: IOCRPage[]
    total_pages: number
  }
  // 智谱 AI 实际返回格式
  layout_details?: Array<
    Array<{
      bbox_2d: [number, number, number, number]
      content: string
      label: string
      index: number
    }>
  >
  data_info?: {
    num_pages: number
    pages: Array<{
      width: number
      height: number
    }>
  }
}

export interface IOCRUploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * OCR API 服务类
 * 用于调用智谱 AI 的 OCR 接口识别 PDF 文档
 */
export class OCRApiService {
  private apiKey: string
  private ocrUrl: string = 'https://open.bigmodel.cn/api/paas/v4/layout_parsing'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 将文件转换为 base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 上传 PDF 文件并进行 OCR 识别
   */
  async recognizePDF(file: File, onProgress?: (progress: IOCRUploadProgress) => void): Promise<IOCRResponse> {
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      throw new Error('只支持 PDF 文件格式')
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('PDF 文件大小不能超过 50MB')
    }

    try {
      // 转换为 base64
      if (onProgress) onProgress({loaded: 0, total: 100, percentage: 10})
      const base64 = await this.fileToBase64(file)

      // OCR 识别
      if (onProgress) onProgress({loaded: 50, total: 100, percentage: 50})
      const response = await axios.post(
        this.ocrUrl,
        {
          model: 'glm-ocr',
          file: base64,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      )

      if (onProgress) onProgress({loaded: 100, total: 100, percentage: 100})

      if (response.data.code && response.data.code !== 200) {
        throw new Error(response.data.message || 'OCR 识别失败')
      }

      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(`OCR 服务错误: ${error.response.data?.message || error.response.statusText}`)
      } else if (error.request) {
        throw new Error('OCR 服务无响应，请检查网络连接')
      } else {
        throw new Error(error.message || 'OCR 识别过程发生错误')
      }
    }
  }

  /**
   * 设置 API Key
   * @param apiKey 新的 API Key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 设置 API 基础 URL（用于自定义或代理）
   * @param url 基础 URL
   */
  setBaseUrl(url: string) {
    this.baseUrl = url
  }
}

// 导出单例实例（使用时需要先设置 API Key）
let ocrService: OCRApiService | null = null

/**
 * 获取 OCR 服务实例
 * @param apiKey API Key（首次调用时必须提供）
 * @returns OCR 服务实例
 */
export function getOCRService(apiKey?: string): OCRApiService {
  if (!ocrService && apiKey) {
    ocrService = new OCRApiService(apiKey)
  } else if (!ocrService) {
    throw new Error('请先提供 API Key 初始化 OCR 服务')
  }
  return ocrService
}
