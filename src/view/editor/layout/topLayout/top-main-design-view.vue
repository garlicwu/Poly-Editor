<script setup lang="ts">
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import {useImage} from '@/view/editor/hooks/useImage'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import {buildComponentWithRender, htmlToPdf, loadFontListWithBufferInStyleSheets} from '@/lib/pdf-util'
import {useTextEditorStore} from '@/store/textEdiotrSotre'
import Popover from 'primevue/popover'
import {Combine_Lang, configPixel, defaultDpi, EComponentType, EPageSizeType, type IComponentInfo, type IEditorInfo, type IEditorPageInfo, type IPageSize} from '@/view/editor/utils/common-modle'
import {fontInitWithList} from '@/lib/util'
import {cloneDeep} from 'lodash'
import {importPdfFile, importTrFile, pdfFileExport, trFileExport} from '@/net/editorNet'
import {useConfirm} from 'primevue/useconfirm'
import {dealFontsizePt2Px} from '@/lib/font-face-list'
import {EditorComponent} from '@/view/editor/component/editorComponentInit'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {download} from 'downloadts'
import router from '@/router'
import {useTranslation} from '@/view/editor/hooks/useTranslation'
import {useToast} from 'primevue/usetoast'

interface IItemTop {
  name: string
  icon: string
  selected?: boolean
}

const editorStore = useEditorStore()
const editorEnStore = useEditorTranslationStore()
const {currentPage, editorInfo, editorLang, disableEdit, projectInfo} = storeToRefs(editorStore)
const {multilingualTranslationList, editorTranslationInfo} = storeToRefs(editorEnStore)
const {translateUpdate, userSave} = useTranslation()
const confirm = useConfirm()

const $emit = defineEmits(['save'])

const fileBtn = ref()
const fileInputKey = ref(0)
const opExportShow = ref()

const exportDes = computed(() => {
  let name = '母版导出'
  if (editorLang.value === 'en') {
    name = '英文版'
  } else if (editorLang.value === Combine_Lang) {
    name = '组合版'
  }
  return name
})

watch(
  () => editorTranslationInfo.value.translationType,
  (value) => {
    if (value === 'en') {
      topItemList.value.push({
        name: '英译保存',
        icon: 'ic-top-design-cn-to-en-save',
      })
    }
  },
)
const topItemList = ref<IItemTop[]>([
  {
    name: '保存',
    icon: 'ic-top-design-save',
  },
])

const {imageUrl} = useImage()
const clickItem = async (event: Event, item: IItemTop) => {
  switch (item.name) {
    case '保存':
      if (disableEdit.value) {
        break
      }
      $emit('save')
      break
  }
}

// 跳转到新手指导页面
const goToGuide = () => {
  const route = router.resolve({path: '/guide'})
  window.open(route.href, '_blank')
}

const sendEnToEditor = async () => {
  await userSave(false, false, true)
  openEditNewPage()
}

function openEditNewPage() {
  confirm.require({
    message: '英文翻译保存成功，确认打开翻译编辑区内容么？',
    header: '提醒',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '打开',
    },
    accept: async () => {
      const route = router.resolve({
        path: '/design',
        query: {
          projectId: editorStore.projectInfo?.id,
          lang: multilingualTranslationList.value && multilingualTranslationList.value.length > 0 ? Combine_Lang : (editorTranslationInfo.value.translationType ?? 'cn'),
        },
      })
      window.open(route.href, '_blank')
    },
    reject: () => {},
  })
}

const exportMasterPDf = async () => {
  // if (!editorStore.exportStatus) {
  //   editorStore.setExportStatus(true)
  //   await sleep(1000)
  // }
  opExportShow.value?.hide()
  editorStore.setLoading(true)
  editorStore.setLoadingText('pdf导出中...')
  // editorStore.setShowPdfProgressValue(true)
  await htmlToPdf(editorInfo.value, useTextEditorStore().allFontMap, editorInfo.value.name && editorInfo.value.name !== '' ? editorInfo.value.name : '未命名文件')
  // editorStore.setShowPdfProgressValue(false)
  editorStore.setLoadingText('')
  editorStore.setLoading(false)
}

const exportMasterPDfWithNet = async () => {
  opExportShow.value?.hide()
  editorStore.setLoading(true)
  editorStore.setLoadingText('pdf导出中...')
  // const url = 'https://huishi-media.oss-cn-hangzhou.aliyuncs.com/upload/generated_pdf_1753176247730_1753176248074.pdf'
  // return
  pdfFileExport(editorInfo.value)
    .then((res: any) => {
      console.log(res)
      if (!res.data || !res.data.success) {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: res.data.message,
          life: 1500,
        })
        return
      }
      const url = res.data.message
      download(url, (projectInfo.value?.name && projectInfo.value.name !== '' ? projectInfo.value.name : '未命名') + '.pdf')
    })
    .finally(() => {
      editorStore.setLoadingText('')
      editorStore.setLoading(false)
    })
}

const exportMasterPDfImageWithNet = async () => {
  opExportShow.value?.hide()
  editorStore.setLoading(true)
  editorStore.setLoadingText('pdf导出中...')
  const allFontMap = useTextEditorStore().allFontMap
  const pdfFileEditorInfo: any = cloneDeep(editorInfo.value)
  console.log('pdfFileEditorInfo', editorInfo.value.fontList)
  await loadFontListWithBufferInStyleSheets(cloneDeep(editorInfo.value.fontList)??[])
  for (const page of pdfFileEditorInfo.pageList) {
    for (const component of page.componentList) {
      const fontType = allFontMap[component.lang ?? editorInfo.value.translationType ?? 'en']?.[component.textType ?? 'Yaber正文'] ?? {
        type: 'Yaber正文',
        lang: '中文',
        size: 7,
        font: 'OPlusSans3-Regular',
        pxSize: 29,
      }
      const imageData = await buildComponentWithRender(component, fontType)
      if (imageData) {
        component.imageSrc = imageData
      }
    }
  }
  pdfFileEditorInfo['exportType'] = 1
  // editorStore.setLoadingText('')
  // editorStore.setLoading(false)
  // return
  pdfFileExport(pdfFileEditorInfo)
    .then((res: any) => {
      console.log(res)
      if (!res.data || !res.data.success) {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: res.data.message,
          life: 1500,
        })
        return
      }
      const url = res.data.message
      download(url, (projectInfo.value?.name && projectInfo.value.name !== '' ? projectInfo.value.name : '未命名') + '.pdf')
    })
    .finally(() => {
      editorStore.setLoadingText('')
      editorStore.setLoading(false)
    })
}

const exportMaster = async () => {
  opExportShow.value?.hide()
  editorStore.setLoading(true)
  editorStore.setLoadingText('自定义导出中...')
  console.log(editorInfo.value)
  trFileExport(editorInfo.value)
    .then((res) => {
      if (res.data && res.data.code && res.data.code !== 200) {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: res.data.message,
          life: 1500,
        })
        return
      }
      let blobUrl = window.URL.createObjectURL(new Blob([res.data], {type: 'application/tr'}))
      const downloadObj = document.createElement('a')
      downloadObj.download = (projectInfo.value?.name && projectInfo.value.name !== '' ? projectInfo.value.name : '未命名') + '.tr'
      downloadObj.href = blobUrl
      document.body.appendChild(downloadObj)
      downloadObj.click()
      document.body.removeChild(downloadObj)
    })
    .finally(() => {
      editorStore.setLoadingText('')
      editorStore.setLoading(false)
    })
}

const exportTranslation = async () => {
  opExportShow.value?.hide()
  editorStore.setLoading(true)
  editorStore.setLoadingText('自定义导出中...')
  let exportInfo: any = {}
  if (multilingualTranslationList.value.length > 0) {
    const pageList: IEditorPageInfo[] = []
    let fontList: string[] = []
    multilingualTranslationList.value.forEach((item: IEditorInfo) => {
      fontList = fontList.concat(item.fontList ?? [])
    })
    fontList = Array.from(new Set(fontList))
    fontInitWithList(fontList).then((data) => {})
    const editorLength = multilingualTranslationList.value.length
    for (let j = 0; j < editorLength; j++) {
      pageList.push(...multilingualTranslationList.value[j].pageList)
    }
    exportInfo = cloneDeep(multilingualTranslationList.value[0])
    exportInfo.pageList = pageList
  } else {
    exportInfo = editorEnStore.editorTranslationInfo
  }
  trFileExport(exportInfo)
    .then((res) => {
      let blobUrl = window.URL.createObjectURL(new Blob([res.data], {type: 'application/tr'}))
      const downloadObj = document.createElement('a')
      downloadObj.download = (projectInfo.value?.name && projectInfo.value.name !== '' ? projectInfo.value.name : '未命名') + '.tr'
      downloadObj.href = blobUrl
      document.body.appendChild(downloadObj)
      downloadObj.click()
      document.body.removeChild(downloadObj)
    })
    .finally(() => {
      editorStore.setLoadingText('')
      editorStore.setLoading(false)
    })
}
const exportTranslationPDF = async () => {
  // if (!editorStore.exportStatus) {
  //   editorStore.setExportStatus(true)
  //   await sleep(1000)
  // }
  opExportShow.value?.hide()
  editorStore.setShowPdfProgressValue(true)
  if (multilingualTranslationList.value.length > 0) {
    const pageList: IEditorPageInfo[] = []
    let fontList: string[] = []
    multilingualTranslationList.value.forEach((item: IEditorInfo) => {
      fontList = fontList.concat(item.fontList ?? [])
    })
    fontList = Array.from(new Set(fontList))
    fontInitWithList(fontList).then((data) => {})
    const editorLength = multilingualTranslationList.value.length
    for (let j = 0; j < editorLength; j++) {
      pageList.push(...multilingualTranslationList.value[j].pageList)
    }
    const longEditorInfo = cloneDeep(multilingualTranslationList.value[0])
    longEditorInfo.pageList = pageList
    await htmlToPdf(longEditorInfo, useTextEditorStore().allFontMap, (longEditorInfo.name && longEditorInfo.name !== '' ? longEditorInfo.name : '未命名文件') + '-多语言翻译')
  } else {
    await htmlToPdf(editorEnStore.editorTranslationInfo, useTextEditorStore().allFontMap, (editorTranslationInfo.value.name && editorTranslationInfo.value.name !== '' ? editorTranslationInfo.value.name : '未命名文件') + '-英译')
  }
  editorStore.setShowPdfProgressValue(false)
}

const exportTranslationPDFWithNet = async () => {
  opExportShow.value?.hide()
  editorStore.setLoading(true)
  editorStore.setLoadingText('pdf导出中...')
  let longEditorInfo = cloneDeep(editorTranslationInfo.value)
  if (multilingualTranslationList.value.length > 0) {
    const pageList: IEditorPageInfo[] = []
    let fontList: string[] = []
    multilingualTranslationList.value.forEach((item: IEditorInfo) => {
      fontList = fontList.concat(item.fontList ?? [])
    })
    fontList = Array.from(new Set(fontList))
    fontInitWithList(fontList).then((data) => {})
    const editorLength = multilingualTranslationList.value.length
    for (let j = 0; j < editorLength; j++) {
      pageList.push(...multilingualTranslationList.value[j].pageList)
    }
    const longEditorInfo = cloneDeep(multilingualTranslationList.value[0])
    longEditorInfo.pageList = pageList
  }

  pdfFileExport(longEditorInfo)
    .then((res: any) => {
      console.log(res)
      if (!res.data || !res.data.success) {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: res.data.message,
          life: 1500,
        })
        return
      }
      const url = res.data.message
      download(url, (projectInfo.value?.name && projectInfo.value.name !== '' ? projectInfo.value.name : '未命名') + '.pdf')
    })
    .finally(() => {
      editorStore.setLoadingText('')
      editorStore.setLoading(false)
    })
}

function importFileInEditor() {
  confirm.require({
    message: '导入格式将替换掉当前编辑内容？',
    header: '提醒',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '导入',
    },
    accept: async () => {
      // 打开文件
      fileBtn.value.click()
    },
    reject: () => {},
  })
}

// 处理键盘事件，实现ctrl+s快捷键功能
function handleKeyDown(e: KeyboardEvent) {
  // 检查是否按下了Ctrl+S键
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault() // 阻止默认的保存行为
    if (!disableEdit.value) {
      $emit('save') // 调用保存功能
    }
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const handleUpload = (e: Event) => {
  fileInputKey.value++
  let file: any[]
  file = Array.prototype.slice.call(e.target?.files)
  if (!file || file.length === 0) {
    return
  }
  let ext = file[0].name.substr(file[0].name.lastIndexOf('.')).toLowerCase() // 获得文件后缀名
  if (!['.pdf', '.tr'].includes(ext)) {
    return false
  }

  const form = new FormData()
  form.append('file', file[0])
  editorStore.setLoadingText('导入文件中...')
  editorStore.setLoading(true)
  if (ext === '.pdf') {
    importPdfFile(form)
      .then(async (res: any) => {
        let nowTime = new Date().getTime()
        let editorInfoImport = cloneDeep(editorInfo.value)
        let defaultPage = {
          sizeName: 'A4',
          width: 210,
          height: 297,
          type: EPageSizeType.Millimetre,
          dpi: defaultDpi,
          isCustomize: false,
        } as IPageSize
        let defaultPageSize = editorInfoImport.pageList[0]?.pageSize ?? defaultPage
        if (!defaultPageSize.dpi) {
          defaultPageSize.dpi = defaultDpi
        }
        if (!editorInfoImport.dpi) {
          editorInfoImport.dpi = defaultDpi
        }
        defaultPageSize = configPixel(defaultPageSize)
        editorInfoImport.pageList = [] as IEditorPageInfo[]
        res.forEach((item: any) => {
          let pageInfo = {
            id: editorInfoImport.id + 'P' + nowTime,
            pageSize: defaultPageSize,
            componentList: [],
            pageId: editorInfoImport.id + 'P' + nowTime,
            translationType: editorInfoImport.translationType,
          } as IEditorPageInfo
          nowTime += 100
          item.images.forEach((image: any) => {
            // 2730x175 pixels
            nowTime += 100
            const size = (image.webSize ?? image.size ?? '').split(', ')
            const width = Number(size[0].replace('width=', '') ?? 200)
            const height = Number(size[1].replace('height=', '') ?? 200)
            // x=0.00, y=0.00
            const position = (image.webPosition ?? image.position ?? '').split(', ')
            const left = Number(position[0].replace('x=', '') ?? 0)
            const top = Number(position[1].replace('y=', '') ?? 0)
            pageInfo.componentList.push({
              id: pageInfo.id + 'C' + nowTime,
              componentId: pageInfo.id + 'C' + nowTime,
              componentType: EComponentType.Image,
              component: EditorComponent.IMAGE,
              width: width,
              height: height,
              top: top,
              left: left,
              imageSrc: image.base64 ?? '',
            } as IComponentInfo)
            nowTime += 100
          })
          item.textLines.forEach((textLine: any) => {
            // width=142.85, height=8.80
            nowTime += 100
            const size = (textLine.webSize ?? textLine.size ?? '').split(', ')
            const width = Number(size[0].replace('width=', '') ?? 200)
            const height = Number(size[1].replace('height=', '') ?? 200)
            // x=0.00, y=0.00
            const position = (textLine.webPosition ?? textLine.position ?? '').split(', ')
            const left = Number(position[0].replace('x=', '') ?? 0)
            const top = Number(position[1].replace('y=', '') ?? 0)

            const dominantFont = textLine.dominantFont.split('+', '')[1]
            const avgFontSize = Number(textLine.avgFontSize)
            pageInfo.componentList.push({
              id: pageInfo.id + 'C' + nowTime,
              componentId: pageInfo.id + 'C' + nowTime,
              componentType: EComponentType.Text,
              textType: 'Yaber正文',
              width: dealFontsizePt2Px(width),
              height: dealFontsizePt2Px(avgFontSize) * 1.45,
              component: EditorComponent.QUILL_TEXT,
              top: top,
              left: left,
              deltaOps: [
                {
                  insert: textLine.text.toString(),
                  attributes: {
                    size: dealFontsizePt2Px(avgFontSize),
                    font: dominantFont,
                  },
                },
                {
                  insert: '\n',
                },
              ],
            } as IComponentInfo)
            nowTime += 100
          })

          // const sameText = {}
          // for (let i = 0; i < pageInfo.componentList.length; i++) {
          //   const j = i + 1
          //   if (j < pageInfo.componentList.length) {
          //     const preComponent = pageInfo.componentList[i]
          //     const nextComponent = pageInfo.componentList[j]
          //     if (preComponent.componentType === EComponentType.Text && nextComponent.componentType === EComponentType.Text) {
          //       if (preComponent.left === nextComponent.left && nextComponent.top - preComponent.top < 20) {
          //       }
          //     }
          //   }
          // }

          editorInfoImport.pageList.push(pageInfo)
        })
        editorStore.initLocalStorageEditorInfoWithNet(editorInfoImport)
        editorStore.setSaveChange()
      })
      .catch((e) => {
        console.error(e)
      })
      .finally(() => {
        editorStore.setLoadingText('')
        editorStore.setLoading(false)
      })
  } else {
    importTrFile(form)
      .then(async (res) => {
        const json = JSON.parse(res.toString())
        json.id = editorInfo.value.id
        json.projectId = editorInfo.value.projectId
        json.name = editorInfo.value.projectId
        editorStore.initLocalStorageEditorInfoWithNet(json)
        editorStore.setSaveChange()
      })
      .finally(() => {
        editorStore.setLoadingText('')
        editorStore.setLoading(false)
      })
  }
}
</script>

<template>
  <div class="w-fit flex-row flex items-center">
    <div
      v-for="(item, index) in topItemList"
      :key="item.name + '_' + index"
      class="mx-2 w-12 h-12 flex items-center justify-center rounded-lg"
      :class="disableEdit && '保存' === item.name ? 'bg-ppt-btn-bg cursor-not-allowed' : ' cursor-pointer hover:bg-ppt-bg-purple/30 transition-all duration-200 transform hover:scale-105'"
      :title="item.name"
      @click="clickItem($event, item)">
      <img :src="imageUrl(item.icon)" alt="" class="w-6 h-6" />
    </div>
  </div>
</template>

<style scoped></style>
