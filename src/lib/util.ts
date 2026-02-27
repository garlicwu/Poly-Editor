import axios from 'axios'
import {fontFaceList} from '@/lib/font-face-list'

const util: Record<string, any> = {
  baseUrl: import.meta.env.VITE_APP_BASE_API,
  baseUrlOld: import.meta.env.VITE_APP_BASE_API_OLD,
  fontUrl: import.meta.env.VITE_FONT_URL,
}
export const IS_DEV = import.meta.env.MODE === 'development'

export function getConfigCommonData(name: string, fileSuffix: string = 'json', path: string = '/poly/config') {
  const url = (IS_DEV ? '' : '') + `${path}/${name}.${fileSuffix}`
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response: any) => {
        resolve(response)
      })
      .catch((e: any) => {
        console.error(e)
      })
      .finally(() => {
        resolve(null)
      })
  })
}

export let fontFaceNameList: string[] = []
export let fontFaceNameListWithFileSuffix: string[] = []

export function fontInit() {
  return new Promise((resolve) => {
    fontFaceList.forEach((item: any) => {
      item.list.forEach((fontItem: any) => {
        fontItem.children.forEach((child: any) => {
          const fontName = fontItem.prefix + child
          const fontFile = item.file + '/' + fontItem.prefix + child + '.' + fontItem.suffix
          // console.log(fontFile)
          const url = new URL(`../assets/font/${fontFile}`, import.meta.url).href
          // const font = new FontFace(fontName, `url(${url})  format('truetype')`)
          fontFaceNameList.push(fontName)
          fontFaceNameListWithFileSuffix.push(fontItem.prefix + child + '.' + fontItem.suffix)
          // font
          //   .load()
          //   .then(() => {
          //     document.fonts.add(font)
          //   })
          //   .catch((e) => {
          //     console.error(fontFile, e)
          //   })
        })
      })
    })
    resolve(fontFaceNameList)
  })
}

export function fontServerInit() {
  return new Promise((resolve) => {
    getConfigCommonData('font-server-list', 'csv')
      .then((res: any) => {
        const list = res.data.split('\n').filter((item: string) => item.trim() !== '')
        fontFaceNameListWithFileSuffix = list.map((item: string) => item.trim())
        fontFaceNameList = fontFaceNameListWithFileSuffix.map((item) => {
          const decoded = decodeURIComponent(item.includes('.') ? item.split('.')[0] : item)
          return decoded.trim()
        })
        resolve(fontFaceNameListWithFileSuffix)
      })
      .finally(() => {
        resolve(null)
      })
  })
}

export function fontInitWithList(fontList?: string[]) {
  return new Promise((resolve) => {
    // 独立编辑器模式：不从远程加载字体，使用系统字体
    console.log('使用系统字体:', fontList)
    resolve(true)
  })
}

export default util
