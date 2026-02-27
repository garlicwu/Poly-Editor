import {configFontSizeWithPound} from '@/lib/font-face-list'

export let defaultDpi: number = 254

export function setDefaultDpi(dpi: number) {
  defaultDpi = dpi
  console.log('setDefaultDpi', dpi)
  configFontSizeWithPound()
}

export enum EPageSizeType {
  // Pixel = '像素',
  Inch = '英寸',
  Millimetre = '毫米',
  Centimeter = '厘米',
}

export interface IPageSize {
  sizeName: string
  width: number
  height: number
  dpi?: number
  isCustomize: boolean
  type: EPageSizeType
  pixelWidth?: number
  pixelHeight?: number
}

export declare interface IProjectInfo {
  id?: string
  name?: string
  description?: string
}

export enum EDirectoryType {
  Custom = 'custom',
  Auto = 'auto',
}

export enum EFooterTypeType {
  Custom = 'custom',
  Auto = 'auto',
}

export const Combine_Lang = 'combine'

// directoryType:custom | ''
// footerType: custom | ''
export declare interface IEditorInfo {
  id: string
  name: string
  projectId: string
  description: string
  dpi?: number | string
  translationType?: string
  pageList: IEditorPageInfo[]
  fontList?: string[]
  hasChange?: boolean
  directoryType?: EDirectoryType
  footerType?: EFooterTypeType
  disableEdit?: boolean
  autoSaveTiming?: number
}

export declare interface IPageLine {
  h: number[]
  v: number[]
}

export declare interface IEditorPageInfo {
  id: string | undefined
  pageId: string | number
  pageSize?: IPageSize
  preHeight?: string
  type?: EPageType
  translationType?: string
  lang?: string
  targetLanguageCode?: string[]
  addComponentAction?: IComponentAddTypeItem | null
  componentList: IComponentInfo[]
  pageFooterNum?: number
  lines?: IPageLine
  zoomData?: Record<string, any> | undefined
  hasComputeTextOverflow?: boolean
}

export enum EPageType {
  // 自动目录
  Directory = 'directory',
  // 手动目录
  ManualDirectory = 'manual_directory',
  // 多语种目录
  MultilingualDirectory = 'multilingual_directory',
  // 封面
  Cover = 'cover',
  Default = '',
}

export enum EComponentType {
  Text = 'text',
  Image = 'image',
  Icon = 'icon',
  Background = 'background',
  Line = 'line',
  DashedLine = 'dashedLine',
  Group = 'group',
  PageFooter = 'pageFooter',
  SelfPageFooter = 'selfPageFooter',
  PageIndexNumber = 'pageIndexNumber',
  Table = 'table',
}

// 例子
// 项目id           TR20250524000001
// 翻译体id       TR20250524000001CN
// pageId         TR20250524000001CNP151330
// compentId   TR20250524000001CNP151330C151338
export declare interface IComponentAddTypeItem {
  id?: string | number
  name: string
  displayName?: string
  style: Record<string, any>
  autoAdd?: boolean
  dragAdd?: boolean
  width: number
  height: number
  type: EComponentType
  imgSrc?: string
  fontName?: string
  fontSize?: number
  left?: number
  top?: number
  dragMouseX?: number
  dragMouseY?: number
  notDrag?: boolean
  rowNum?: number
  colNum?: number
}

export declare interface IComponentInfo {
  id?: string | number
  componentId?: string | number
  compareOriginId?: string | number // 比较原始组件id
  groupId?: string | number // 编组id
  groupName?: string // 编组id
  componentType: EComponentType
  // 文字类型
  textType?: string
  // 图片，图标，text
  component: string // 自定义组件
  des?: string // 组件描述
  name?: string // 组件名
  text?: string // 文本
  semanticHTML?: string // html 文本，适合导出
  deltaOps: any[] // 富文本
  imageSrc?: string
  width: number
  height: number
  top: number
  left: number
  angle?: number
  skew?: number[]
  style?: Record<string, any> // 样式
  divStyle?: Record<string, any> // 样式
  selected?: boolean
  group?: boolean
  groupStyle?: any
  props?: any
  editable?: boolean
  index?: number
  zindex: number
  componentView?: any
  disabled?: boolean
  equalProportion?: boolean
  lang?: string
  hasChange?: number
  fontName?: string
  fontSize?: number
  dragStatus?: number
  resizeStatus?: number
  textOverflow?: boolean
  tableStyle?: Record<string, any>
  // [key: string]: string | undefined
}

export declare interface IComponentGroup {
  groupId?: string | number
  groupName?: string
  components: IComponentInfo[]
  inputAble?: boolean
  selected?: boolean
}

export function getPageSizeTypeList(): IPageSize[] {
  const list: any[] = []
  for (const key in EPageSizeType) {
    list.push({name: EPageSizeType[key as keyof typeof EPageSizeType], type: key})
  }

  return list
}

export function configPixel(pageSize: IPageSize): IPageSize {
  console.log('defaultDpi', defaultDpi)
  switch (pageSize.type) {
    case EPageSizeType.Centimeter: {
      const centimeterRate = Number(((10 * defaultDpi) / 25.4).toFixed(5))
      pageSize.pixelWidth = Math.floor(pageSize.width * centimeterRate)
      pageSize.pixelHeight = Math.floor(pageSize.height * centimeterRate)
      break
    }
    case EPageSizeType.Millimetre: {
      const millimetreRate = Number((defaultDpi / 25.4).toFixed(5))
      pageSize.pixelWidth = Math.floor(pageSize.width * millimetreRate)
      pageSize.pixelHeight = Math.floor(pageSize.height * millimetreRate)
      break
    }
    case EPageSizeType.Inch: {
      // 1 inch = 25.4 mm
      const inchRate = Number(defaultDpi.toFixed(5))
      pageSize.pixelWidth = Math.floor(pageSize.width * inchRate)
      pageSize.pixelHeight = Math.floor(pageSize.height * inchRate)
      break
    }
    // case PageSizeType.Pixel:
    //   pageSize.pixelWidth = pageSize.width
    //   pageSize.pixelHeight = pageSize.height
    //   break
  }

  return pageSize
}

export interface ISelectLanguage {
  name: string
  code: string
  selected?: boolean
}

export const enum ToastGroupType {
  RE_LOGIN = 'Re_Login',
  Save_Editor_Success = 'Save_Editor_Success',
  NO_PROJECT = 'NO_PROJECT',
  TOP_CENTER = 'TOP_CENTER',
}

export interface ILangImageItem {
  id: string
  langLabel: string
  lang: string
  url: string
}

export const enum EOperationHistory {
  ADD_COMPONENT = 'add_component',
  ADD_GROUP_COMPONENT = 'add_group_component',
  UPDATE_COMPONENT = 'update_component',
  UPDATE_COMPONENT_TEXT = 'update_component_text',
  UPDATE_COMPONENT_STYLE = 'update_component_style',
  SWAP_COMPONENT = 'swap_component',
  TOP_COMPONENT = 'top_component',
  BOTTOM_COMPONENT = 'bottom_component',
  DELETE_COMPONENT = 'delete_component',
  DELETE_GROUP_COMPONENT = 'delete_group_component',
  UPDATE_GROUP_COMPONENT = 'update_group_component',
  DELETE_PAGE = 'delete_Page',
}

export interface IOperationHistory {
  id: string
  type: EOperationHistory
  page?: IEditorPageInfo
  pageId?: string | number
  componentId?: string | number
  deltaOps?: any[]
  divStyle?: any
  component?: IComponentInfo
  components?: IComponentInfo[]
  swapPositions?: number[]
}
