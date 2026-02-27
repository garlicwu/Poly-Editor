import {onUnmounted, type Ref, ref} from 'vue'
import type {FileUploadBeforeSendEvent, FileUploadProgressEvent, FileUploadSelectEvent, FileUploadUploadEvent} from 'primevue'
import {getToken} from '@/lib/storage'
import {useToast} from 'primevue/usetoast'
import {netIconInfoAdd, netPicInfoAdd} from '@/net/editorNet'
import type {ILangImageItem} from '@/view/editor/utils/common-modle'
import httpRequest from '@/net/httpRequest'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {useConfirm} from 'primevue/useconfirm'

type EventHandler = (data: any) => void

// Mock upload function since backend is removed
const upload = (formData: FormData) => {
  return Promise.reject(new Error('Upload functionality removed - local storage only'))
}

/**
 * 图片上传通用
 * @param uploadType 0 image 1 iocn
 */
export function useImageUpload(uploadType: number, selectedCategory?: Ref<any>, selectImageType?: Ref<any>) {
  const uploadLoading = ref<boolean>(false)
  const uploadProgress = ref<number>(0)
  const uploadName = ref<string>('上传')
  const uploadRef = ref()
  const confirm = useConfirm()

  const imageUrl = (icon: string) => {
    return new URL(`../assets/${icon}.png`, import.meta.url).href
  }
  const eventHandlers = new Map<string, EventHandler[]>()

  const src = ref(null)
  const onFileSelect = (event: FileUploadSelectEvent) => {
    uploadLoading.value = true
    uploadName.value = '上传中...'
    const uploadNet: any = []
    event.files.forEach((file: any) => {
      const formData = new FormData()
      formData.append('file', file)
      uploadNet.push(upload(formData))
    })

    const uploadImages = async () => {
      Promise.allSettled(uploadNet)
        .then((resultList: any[]) => {
          resultList.forEach(async (item) => {
            if (item.status === 'fulfilled' && item.value) {
              console.log('uploadImage', item)
              const result = item.value.data.result
              const {savePath, width, height} = result
              const type = selectImageType?.value === '我的' ? 0 : 1
              const category = selectedCategory.value ? selectedCategory.value.id : ''
              await uploadImageToList({savePath, width, height, category, type})
            }
          })
        })
        .finally(() => {
          uploadName.value = '上传'
          uploadLoading.value = false
          uploadRef.value?.clear()
          selectedCategory.value = null
        })
    }

    if (selectedCategory?.value) {
      uploadImages()
    } else {
      confirm.require({
        group: 'SelectCategoryDialog',
        header: '请选择分类',
        icon: 'pi pi-exclamation-triangle',
        modal: false,
        rejectProps: {
          label: '取消',
          severity: 'secondary',
          outlined: true,
        },
        acceptProps: {
          label: '确定',
        },
        accept: async () => {
          if (!selectedCategory?.value) {
            emitter.emit(MittTypeEnum.Toast_Message, {
              severity: 'error',
              summary: '错误',
              detail: '请选择分类',
              life: 1500,
            })
            return
          }
          uploadImages()
        },
        reject: () => {
          uploadName.value = '上传'
          uploadLoading.value = false
          uploadRef.value?.clear()
          if (selectedCategory?.value) {
            selectedCategory.value = null
          }
        },
      })
    }
  }

  const imageUpload = (event: FileUploadUploadEvent) => {
    console.log('imageUpload', event)
    uploadName.value = '上传'
    uploadLoading.value = true
    const responseStr = event.xhr.response

    const response = JSON.parse(responseStr)
    if (!response.success) {
      uploadLoading.value = false
      emit('imageUploadError', response)
      return
    } else {
      const result = response.result
      const {savePath, width, height} = result
      uploadImageToList({savePath, width, height, category: '', type: 0}).finally(() => {
        uploadLoading.value = false
      })
    }
  }

  const uploadImageToList = ({savePath, width, height, category, type}: {savePath: string; width: number; height: number; category: string; type: number}) => {
    return new Promise((resolve) => {
      if (uploadType === 0) {
        netPicInfoAdd({
          imgUrl: savePath,
          width: width.toString(),
          height: height.toString(),
          category: category,
          type: type,
        })
          .then((res) => {
            emit('imageUploadSuccess', res)
          })
          .catch((err) => {
            console.log(err)
          })
          .finally(() => {
            resolve(null)
          })
      } else {
        netIconInfoAdd({
          imgUrl: savePath,
          width: width.toString(),
          height: height.toString(),
          category: category,
          type: type,
        })
          .then((res) => {
            emit('imageUploadSuccess', res)
          })
          .catch((err) => {
            console.log(err)
          })
          .finally(() => {
            resolve(null)
          })
      }
    })
  }
  const justImageUpload = (event: FileUploadUploadEvent, index: number) => {
    console.log('imageUpload', event)
    uploadName.value = '上传'
    uploadLoading.value = true
    const responseStr = event.xhr.response
    uploadLoading.value = false
    const response = JSON.parse(responseStr)
    if (!response.success) {
      emit('imageUploadError', response)
      return
    } else {
      const result = response.result
      const {savePath, width, height} = result
      emit('imageUploadSuccess', {...result, index: index})
    }
  }
  const imageBeforeSend = (event: FileUploadBeforeSendEvent) => {
    console.log('imageBeforeSend', event)
    event.xhr.setRequestHeader('x-access-token', getToken() ?? '')
  }
  const imageProgress = (event: FileUploadProgressEvent) => {
    uploadLoading.value = true
    uploadProgress.value = event.progress
    uploadName.value = '上传进度 ' + event.progress + '%'
    console.log('imageProgress', event)
  }

  const onEvent = (event: string, handler: EventHandler) => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, [])
    }
    eventHandlers.get(event)?.push(handler)
  }

  const offEvent = (event: string, handler?: EventHandler) => {
    if (!handler) {
      eventHandlers.delete(event)
      return
    }

    const handlers = eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  const emit = (event: string, data: any) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  onUnmounted(() => {
    eventHandlers.clear()
  })
  return {
    imageUrl,
    onFileSelect,
    uploadLoading,
    imageUpload,
    imageBeforeSend,
    imageProgress,
    uploadName,
    uploadProgress,
    onEvent,
    emit,
    justImageUpload,
    uploadRef,
  }
}
