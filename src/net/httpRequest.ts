import type {AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from 'axios'
import axios from 'axios'
import util from '@/lib/util'
import {getToken} from '@/lib/storage'
import {useToast} from 'primevue/usetoast'
import {ToastGroupType} from '@/view/editor/utils/common-modle'
import emitter, {MittTypeEnum} from '@/lib/mitt'

type Result<T> = {
  code: number
  message: string
  data: T
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  justRes?: boolean
  justData?: boolean
  export?: boolean
  showMessage?: boolean
}

export class HttpRequest {
  instance: AxiosInstance
  baseConfig: CustomAxiosRequestConfig = {baseURL: util.baseUrl, timeout: 90000, withCredentials: false}

  constructor(config: CustomAxiosRequestConfig) {
    this.instance = axios.create(Object.assign(this.baseConfig, config))
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 独立编辑器模式：不需要 token 验证
        return config
      },
      (err: any) => {
        return Promise.reject(err)
      },
    )

    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        if ((res?.config as CustomAxiosRequestConfig).showMessage) {
          emitter.emit(MittTypeEnum.Toast_Message, {
            severity: 'success',
            summary: '成功',
            detail: res.data.message ?? '',
            life: 1500,
          })
        }
        if (res.data && res.data.code === 200) {
          if ((res?.config as CustomAxiosRequestConfig).justRes) {
            return res.data
          } else if ((res?.config as CustomAxiosRequestConfig).justData) {
            return res.data
          } else if (res.data.result) {
            return res.data.result
          } else {
            return res.data
          }
        } else if ((res?.config as CustomAxiosRequestConfig).export) {
          return res
        }
        let message = ''
        switch (res?.data?.code ?? -100) {
          case 400:
            message = '请求不通(400)'
            break
          case 401:
            message = res?.data?.message ?? '鉴权失败，请重新登录'
            break
          case 403:
            message = res?.data?.message ?? '拒绝访问(403)'
            break
          case 404:
            message = res?.data?.message ?? '请求出错(404)'
            break
          case 408:
            message = res?.data?.message ?? '请求超时(408)'
            break
          case 500:
            message = res?.data?.message ?? '服务器错误(500)'
            break
          case 501:
            message = '服务未实现(501)'
            break
          case 601:
            message = res?.data?.message ?? '服务器错误(601)'
            break
          case 502:
            message = '网络错误(502)'
            break
          case 503:
            message = '服务不可用(503)'
            break
          case 504:
            message = '网络超时(504)'
            break
          case 505:
            message = 'HTTP版本不受支持(505)'
            break
          default:
            message = `连接出错${res?.data.code ?? ''}!`
        }

        if (res?.data?.code === 401 && (res?.config?.url ?? '').indexOf('/welcome') < 0) {
          // 独立编辑器模式：不显示鉴权失败提示
          console.warn('API 请求失败:', message)
        } else {
          emitter.emit(MittTypeEnum.Toast_Message, {severity: 'error', summary: '错误', detail: message, life: 1500})
        }
        return Promise.reject(res)
      },
      (err: any) => {
        let message = ''
        switch (err?.response?.status ?? -100) {
          case 400:
            message = '请求不通(400)'
            break
          case 401:
            message = err?.response?.data?.message ?? '鉴权失败，请重新登录'
            break
          case 403:
            message = err?.response?.data?.message ?? '拒绝访问(403)'
            break
          case 404:
            message = err?.response?.data?.message ?? '请求出错(404)'
            break
          case 408:
            message = err?.response?.data?.message ?? '请求超时(408)'
            break
          case 500:
            message = err?.response?.data?.message ?? '服务器错误(500)'
            break
          case 501:
            message = '服务未实现(501)'
            break
          case 502:
            message = '网络错误(502)'
            break
          case 503:
            message = '服务不可用(503)'
            break
          case 504:
            message = '网络超时(504)'
            break
          case 505:
            message = 'HTTP版本不受支持(505)'
            break
          default:
            message = `连接出错${err?.response?.status ?? ''}!`
        }

        if (err?.response?.status === 401 && (err?.config?.url ?? '').indexOf('/welcome') < 0) {
          // 独立编辑器模式：不显示鉴权失败提示
          console.warn('API 请求失败:', message)
        } else {
          emitter.emit(MittTypeEnum.Toast_Message, {severity: 'error', summary: '错误', detail: message, life: 1500})
        }
        return Promise.reject(err?.response ?? err)
      },
    )
  }

  // 定义请求方法
  public request(config: CustomAxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.request(config)
  }

  public get<T = any>(url: string, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<Result<T>>> {
    return this.instance.put(url, data, config)
  }

  public delete<T = any>(url: string, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<Result<T>>> {
    return this.instance.delete(url, config)
  }
}

// 默认导出Request实例
export default new HttpRequest({})
