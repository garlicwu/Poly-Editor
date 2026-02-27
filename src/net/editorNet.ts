import httpRequest from '@/net/httpRequest'

export function netCnTranslationToEn(editorInfo: Record<any, any>) {
  return httpRequest.post('/api/translate/en2cn', editorInfo, {
    timeout: 600000,
  })
}

export function neMutiTranslate(editorInfos: Record<any, any>) {
  return httpRequest.post('/api/translate/muti_translate', editorInfos, {timeout: 6000000})
}

export function netMultiLanguageConfig() {
  return httpRequest.get('/config/tMultiLanguageConfig/list')
}

export function netFontFaceList() {
  return httpRequest.get('/config/tFontConfig/queryById')
}

// export function netGetIconCategory() {
//   return httpRequest.get('/icon/tIconInfo/getIconCategory')
// }

export function netPicInfoAdd(param: any) {
  return httpRequest.post('/image/tPicInfo/add', param)
}

export function netPicInfoDelete(id: any) {
  return httpRequest.delete(`/image/tPicInfo/delete?id=${id}`, {showMessage: true})
}

export function netPicInfoList(category: string, page: number, size: number, type: number, timeSort: string) {
  return httpRequest.get(`/image/tPicInfo/list?category=${category}&pageSize=${size}&pageNo=${page}&type=${type}&column=createTime&order=${timeSort}`)
  // return httpRequest.get(`/image/tPicInfo/list?category=${category}&pageSize=${size}&pageNo=${page}&type=${type}`)
}

export function netIconInfoList(category: string, page: number, size: number, type: number, timeSort: string) {
  return httpRequest.get(`/icon/tIconInfo/list?category=${category}&size=${size}&page=${page}&type=${type}&column=createTime&order=${timeSort}`)
  // return httpRequest.get(`/icon/tIconInfo/list?category=${category}&size=${size}&page=${page}&type=${type}`)
}

export function netIconInfoAdd(param: any) {
  return httpRequest.post('/icon/tIconInfo/add', param)
}

export function netIconInfoDelete(id: any) {
  return httpRequest.delete(`/icon/tIconInfo/delete?id=${id}`, {showMessage: true})
}

export function netGetDesignProjectInfo(id: any, lang: string = '') {
  return httpRequest.get(`/api/translate/query_single?projectId=${id}&lang=${lang}`)
}

export function netGetDesignSave(param: any) {
  return new Promise((resolve, reject) => {
    httpRequest
      .post(`/api/translate/save_single`, param)
      .then((response) => {
        resolve(response)
      })
      .catch((e) => resolve(undefined))
  })
}

export function netGetPicTransferByComponentId(id: any, lang: string = 'cn') {
  return httpRequest.get(`/image/tPicInfo/getPicTransferByComponentId?componentId=${id}&lang=${lang}`)
}

export function netSavePicTransfer(param: any) {
  return httpRequest.post(`/image/tPicInfo/savePicTransfer`, param)
}

export function netGetTemplateList(category: string, type: number, pageNo: number, pageSize: number) {
  return httpRequest.get(`/model/tModel/list?type=${type}&pageSize=${pageSize}&pageNo=${pageNo}&category=${category}`)
}

export function netSetTemplate(params: any) {
  return httpRequest.post(`/model/tModel/add`, params, {showMessage: true})
}

export function netDeleteTemplate(id: string) {
  return httpRequest.delete(`/model/tModel/delete?id=${id}`, {showMessage: true})
}

export function getTitleListById(id: string) {
  return httpRequest.get(`/model/tModel/getTitleListById?translationId=${id}`, {showMessage: true})
}

export function trFileExport(param: any) {
  return httpRequest.post(`/api/tr-file/export`, param, {
    export: true,
  })
}

export function pdfFileExport(param: any) {
  return httpRequest.post(`/api/translate/exportEditPdf`, param, {
    export: true,
    timeout: 6000000,
  })
}

export function importPdfFile(param: any) {
  return httpRequest.post(`/api/importandexport/pdf/parse`, param, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function importTrFile(param: any) {
  return httpRequest.post(`/api/tr-file/import`, param, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function netTranslateText(sourceLang: string, text: string, targetLang: string) {
  return httpRequest.get(`/api/translate/translteText?sourceLang=${sourceLang}&text=${text}&targetLang=${targetLang}`, {showMessage: false})
}

export function netGetProWordAll() {
  return httpRequest.get(`/proword/tProWord/getProWordTypes`, {})
}

export function netGetProWordByType(type: string, keyword: string) {
  return httpRequest.get(`/proword/tProWord/getProWordByType?type=${type}&keyword=${keyword}`, {})
}

export function netGetIconCategory(type: number) {
  return httpRequest.get(`/category/tIconCategory/queryMyList?type=${type}`, {})
}

export function netGetPicCategory(type: number) {
  return httpRequest.get(`/category/tPicCategory/queryMyList?type=${type}`, {})
}

export function netGetTemplateCategory(type: number) {
  return httpRequest.get(`/category/tTemplateCategory/queryMyList?type=${type}`, {})
}

export function netPicCategoryAdd(params: any) {
  return httpRequest.post(`/category/tPicCategory/add`, params, {showMessage: true})
}

export function netIconCategoryAdd(params: any) {
  return httpRequest.post(`/category/tIconCategory/add`, params, {showMessage: true})
}

export function netTemplateCategoryAdd(params: any) {
  return httpRequest.post(`/category/tTemplateCategory/add`, params, {showMessage: true})
}

export function netGenerateCombine(id: any) {
  return new Promise((resolve) => {
    httpRequest
      .get(`/api/translate/generateCombine?projectId=${id}`, {showMessage: false, timeout: 6000000})
      .then((result) => {
        resolve(true)
      })
      .catch((error) => {
        console.error(error)
        resolve(false)
      })
  })
}

export function netTranslateCurrenPage(param: any) {
  return httpRequest.post(`/api/translate/singlepage_translate`, param)
}
