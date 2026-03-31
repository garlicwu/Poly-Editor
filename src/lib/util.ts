import axios from 'axios'
import bundledFontFileListRaw from '@/assets/config/font-server-list.csv?raw'
import {fontFaceList} from '@/lib/font-face-list'

const util: Record<string, any> = {
  baseUrl: import.meta.env.VITE_APP_BASE_API,
  baseUrlOld: import.meta.env.VITE_APP_BASE_API_OLD,
  fontUrl: import.meta.env.VITE_FONT_URL,
}

export const IS_DEV = import.meta.env.MODE === 'development'

const loadedFontFamilySet = new Set<string>()
const bundledDownloadableFontFiles = bundledFontFileListRaw
  .split(/\r?\n/)
  .map((item) => item.trim())
  .filter((item) => item !== '')
const fontFileAliasMap: Record<string, string> = {
  Arialr: 'Arial',
}

export function getConfigCommonData(name: string, fileSuffix: string = 'json', path: string = '/poly/config') {
  const url = (IS_DEV ? '' : '') + `${path}/${name}.${fileSuffix}`
  return new Promise((resolve) => {
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

function parseCsvList(content?: string) {
  return String(content ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item !== '')
}

function ensureDownloadableFontFileList() {
  if (fontFaceNameListWithFileSuffix.length === 0) {
    fontFaceNameListWithFileSuffix = [...bundledDownloadableFontFiles]
  }
}

function normalizeFontNameForFileLookup(fontName: string) {
  const normalizedFontName = String(fontName ?? '').trim()
  return fontFileAliasMap[normalizedFontName] ?? normalizedFontName
}

export function fontInit() {
  return new Promise((resolve) => {
    ensureDownloadableFontFileList()
    fontFaceList.forEach((item: any) => {
      item.list.forEach((fontItem: any) => {
        fontItem.children.forEach((child: any) => {
          const fontName = fontItem.prefix + child
          if (!fontFaceNameList.includes(fontName)) {
            fontFaceNameList.push(fontName)
          }
        })
      })
    })
    resolve(fontFaceNameList)
  })
}

export async function fontServerInit() {
  ensureDownloadableFontFileList()

  const response: any = await getConfigCommonData('font-server-list', 'csv')
  const systemFontList = parseCsvList(response?.data)

  if (systemFontList.length > 0) {
    fontFaceNameList = systemFontList.map((item) => {
      const decoded = decodeURIComponent(item.includes('.') ? item.split('.')[0] : item)
      return decoded.trim()
    })
  } else if (fontFaceNameList.length === 0) {
    fontFaceNameList = bundledDownloadableFontFiles.map((item) => {
      const decoded = decodeURIComponent(item.includes('.') ? item.split('.')[0] : item)
      return decoded.trim()
    })
  }

  return fontFaceNameListWithFileSuffix
}

export function resolveFontFileCandidates(fontName: string) {
  ensureDownloadableFontFileList()

  const normalizedFontName = normalizeFontNameForFileLookup(fontName)
  if (!normalizedFontName) {
    return [] as string[]
  }

  const candidateSet = new Set<string>()
  fontFaceNameListWithFileSuffix
    .filter((itemSuffix) => itemSuffix.includes(encodeURIComponent(normalizedFontName) + '.') || itemSuffix.includes(normalizedFontName + '.'))
    .forEach((itemSuffix) => candidateSet.add(itemSuffix))

  fontFaceList.forEach((fontGroup: any) => {
    fontGroup.list.forEach((fontItem: any) => {
      fontItem.children.forEach((child: any) => {
        const resolvedFontName = `${fontItem.prefix}${child}`
        if (resolvedFontName !== normalizedFontName) {
          return
        }

        candidateSet.add(`${fontGroup.file}/${resolvedFontName}.${fontItem.suffix}`)
        candidateSet.add(`${resolvedFontName}.${fontItem.suffix}`)
      })
    })
  })

  ;['ttf', 'otf', 'woff', 'woff2'].forEach((suffix) => {
    candidateSet.add(`${normalizedFontName}.${suffix}`)
  })

  return Array.from(candidateSet)
}

export async function fontInitWithList(fontList?: string[]) {
  ensureDownloadableFontFileList()

  const normalizedFontList = Array.from(
    new Set(
      (fontList ?? [])
        .map((item) => String(item ?? '').trim())
        .filter((item) => item !== ''),
    ),
  )

  if (normalizedFontList.length === 0) {
    return true
  }

  if (!util.fontUrl || typeof FontFace === 'undefined') {
    console.log('Using system fonts for editor rendering:', normalizedFontList)
    return true
  }

  const loadRequests = normalizedFontList.map(async (fontName) => {
    if (loadedFontFamilySet.has(fontName)) {
      return
    }

    const candidateFile = resolveFontFileCandidates(fontName)[0]
    if (!candidateFile) {
      console.warn('No downloadable font candidate found for:', fontName)
      return
    }

    const font = new FontFace(fontName, `url(${util.fontUrl}/${candidateFile})`)
    try {
      await font.load()
      document.fonts.add(font)
      loadedFontFamilySet.add(fontName)
    } catch (error) {
      console.error(`Failed to load remote font: ${fontName}`, error)
    }
  })

  await Promise.all(loadRequests)
  return true
}

export function isOverThreshold(str: any, thresholdBytes: number) {
  return new Blob([str]).size > thresholdBytes
}

export default util
