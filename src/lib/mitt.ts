import mitt from 'mitt'

const emitter = mitt<Events>()

type Events = {
  toastMessage: any
  pagePreviewRefresh: any
  updateDate: any
  windowResize: any
  clearTranslateSelectList: any
  refreshDPI: any
  showExportDialog: any
}

export enum MittTypeEnum {
  Toast_Message = 'toastMessage',
  Page_Preview_Refresh = 'pagePreviewRefresh',
  All = '*',
  Update_Date = 'updateDate',
  Window_ReSize = 'windowResize',
  CLEAR_TRANSLATE_SELECT_LIST = 'clearTranslateSelectList',
  REFRESH_DPI = 'refreshDPI',
  Show_Export_Dialog = 'showExportDialog',
}

export default emitter
