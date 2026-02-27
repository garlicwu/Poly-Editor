<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import util from '@/lib/util'
import {useImageUpload} from '@/view/editor/hooks/useImageUpload'
import {useToast} from 'primevue/usetoast'
import {EComponentType, type IComponentAddTypeItem} from '@/view/editor/utils/common-modle'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {useConfirm} from 'primevue/useconfirm'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import ConfirmDialog from 'primevue/confirmdialog'
import {VueDraggable} from 'vue-draggable-plus'
import {getIconListSort, setIconListSort} from '@/lib/storage'
import {mockIconList, mockCategories} from '@/lib/mockData'

const editorStore = useEditorStore()
const {currentPage, post} = storeToRefs(editorStore)
const selectImageType = ref('我的')
const options = ref(['我的', '图库'])
const toast = useToast()
const selectedCategory = ref(null)
const {onFileSelect, uploadLoading, uploadRef, imageUpload, imageProgress, imageBeforeSend, uploadName, onEvent} = useImageUpload(1, selectedCategory, selectImageType)
const selectCategory = ref({name: '全部', id: ''})
const categoryList: any = ref([])
const sortWithTimeFormLargeToSmall = ref(true)

onEvent('imageUploadSuccess', (res: any) => {
  toast.add({severity: 'success', summary: '上传成功', detail: '', life: 2000})
  getPicInfoList()
})

onEvent('imageUploadError', (response: any) => {
  toast.add({severity: 'error', summary: '失败', detail: response.message ?? '上传失败', life: 2000})
})

onMounted(() => {
  sortWithTimeFormLargeToSmall.value = getIconListSort() === '1'
  getPicInfoList()
  getIconCategory()
})
const pageInfo = reactive({
  page: 1,
  total: 10,
  size: 10,
})

interface ImageTypeItem {
  id: string
  imgUrl: string
  width: string
  height: string
}

const imageList = ref<ImageTypeItem[]>([])

const getPicInfoList = async () => {
  // 使用 mock 数据
  imageList.value = mockIconList
  pageInfo.total = mockIconList.length
}

const getIconCategory = async () => {
  // 使用 mock 数据
  categoryList.value = mockCategories
}

const clickTextItem = (imageType: ImageTypeItem) => {
  if (editorStore.currentPage) {
    const addImageType: IComponentAddTypeItem = {
      id: imageType.id,
      name: 'icon',
      width: parseInt(imageType.width ?? 300),
      height: parseInt(imageType.height ?? 300),
      style: {},
      type: EComponentType.Icon,
      imgSrc: imageType.imgUrl,
    }
    editorStore.clickCurrentPageComponentAction(addImageType)
  } else {
    show()
  }
}

const dblclickItem = (imageType: ImageTypeItem) => {
  // 双击，自动添加
  if (editorStore.currentPage) {
    const addImageType: IComponentAddTypeItem = {
      id: imageType.id,
      name: 'icon',
      width: parseInt(imageType.width ?? 300),
      height: parseInt(imageType.height ?? 300),
      autoAdd: true,
      style: {},
      type: EComponentType.Icon,
      imgSrc: imageType.imgUrl,
    }
    console.log('dblclickItem', addImageType)
    editorStore.clickCurrentPageComponentAction(addImageType)
  } else {
    show()
  }
}

const show = () => {
  toast.add({severity: 'warning', summary: '提示', detail: '当面页面为空，不能添加组件', life: 2000})
}

const store = useEditorStore()
const confirm = useConfirm()
let CategoryName = ref('')
const categoryAdd = () => {
  CategoryName.value = ''
  confirm.require({
    group: 'CategoryInput',
    header: '请输入分类名称',
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
      if (CategoryName.value === '') {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: '请输入分类名称',
          life: 1500,
        })
        return
      }
      if (CategoryName.value.length > 50) {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: '分类名称不能超过50个字符',
          life: 1500,
        })
        return
      }
      // Category add functionality removed - local storage only
      toast.add({
        severity: 'info',
        summary: '提示',
        detail: '分类添加功能已移除',
        life: 1500,
      })
    },
    reject: () => {},
  })
}

const changeType = () => {
  getPicInfoList()
  getIconCategory()
}

const dragRectMouseGap = reactive({x: 0, y: 0})

function onStart(event: any) {
  // 直接使用鼠标位置，不依赖于元素的边界框
  dragRectMouseGap.x = 0
  dragRectMouseGap.y = 0
}

function onEnd(event: any) {
  const imageType = event.clonedData as ImageTypeItem

  const {dragWidth, dragHeight} = configDragWidth(event.clonedData, true)
  if (editorStore.currentPage) {
    // 获取鼠标位置，兼容不同的事件对象结构
    let mouseX = 0
    let mouseY = 0
    
    if (event.originalEvent) {
      if (event.originalEvent.clientX && event.originalEvent.clientY) {
        mouseX = event.originalEvent.clientX
        mouseY = event.originalEvent.clientY
      } else if (event.originalEvent.x && event.originalEvent.y) {
        mouseX = event.originalEvent.x
        mouseY = event.originalEvent.y
      }
    } else if (event.clientX && event.clientY) {
      mouseX = event.clientX
      mouseY = event.clientY
    }
    
    const addImageType: IComponentAddTypeItem = {
      id: imageType.id,
      name: 'icon',
      width: dragWidth,
      height: dragHeight,
      left: mouseX - 40, // 调整偏移，使元素中心对齐鼠标位置
      top: mouseY - 40, // 调整偏移，使元素中心对齐鼠标位置
      dragAdd: true,
      style: {},
      type: EComponentType.Icon,
      imgSrc: imageType.imgUrl,
    }
    editorStore.clickCurrentPageComponentAction(addImageType)
  }
  dragRectMouseGap.x = 0
  dragRectMouseGap.y = 0
}

function configDragWidth(data: any, end: boolean = false) {
  let dragWidth = Number(data.width || 50) as any
  let dragHeight = Number(data.height || 50) as any
  if (editorStore.currentPage) {
    const scale = !end ? (post.value.scale ?? 1) : 1
    const {pixelHeight, pixelWidth} = currentPage.value?.pageSize || {}
    dragWidth = (dragWidth > (pixelWidth ?? 1080) ? pixelWidth : dragWidth) * scale
    dragHeight = (dragWidth > (pixelHeight ?? 1920) ? pixelHeight : dragHeight) * scale
  }

  console.log('configDragWidth', dragWidth, dragHeight)
  return {dragWidth, dragHeight}
}

const menu = ref()
const menuImage = ref<ImageTypeItem>()

function onSortRefreshList() {
  pageInfo.page = 1
  sortWithTimeFormLargeToSmall.value = !sortWithTimeFormLargeToSmall.value
  setIconListSort(sortWithTimeFormLargeToSmall.value ? '1' : '0')
  getPicInfoList()
}

const items = ref<any[]>([
  {
    label: '删除',
    icon: 'pi pi-trash text-red-500',
    command: () => {
      deleteImage()
    },
  },
])

function deleteImage() {
  // Delete functionality removed - local storage only
  toast.add({
    severity: 'info',
    summary: '提示',
    detail: '删除功能已移除',
    life: 1500,
  })
}

const onImageContextMenu = (event: MouseEvent, selectImage: ImageTypeItem) => {
  menuImage.value = selectImage
  menu.value.show(event)
}
</script>

<template>
  <div class="icon-list-container">
    <div class="icon-list-header">
      <div class="header-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="header-icon">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span class="header-title">图标库</span>
      </div>
      <div class="header-right">
        <div v-if="sortWithTimeFormLargeToSmall" class="sort-button" @click="onSortRefreshList">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 16 4 4 4-4"/>
            <path d="M7 20V4"/>
            <path d="m21 8-4-4-4 4"/>
            <path d="M17 4v16"/>
          </svg>
        </div>
        <div v-else class="sort-button" @click="onSortRefreshList">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 8 4-4 4 4"/>
            <path d="M7 4v16"/>
            <path d="m21 16-4 4-4-4"/>
            <path d="M17 20V4"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="icon-list-content">
      <VueDraggable v-model="imageList" :sort="false" :scroll="true" :force-fallback="false" :touch-start-threshold="10" :delay="0" :delay-on-touch-only="false" class="icon-grid" @start="onStart" @end="onEnd">
        <div
          v-for="image in imageList"
          :key="image.id"
          class="icon-card"
          :class="currentPage?.addComponentAction?.id === image.id ? 'selected' : ''"
          @click="clickTextItem(image)"
          @dblclick="dblclickItem(image)"
          @contextmenu="onImageContextMenu($event, image)">
          <div class="icon-wrapper">
            <Image :src="image.imgUrl" alt="icon" class="icon-item" />
          </div>
        </div>
      </VueDraggable>
    </div>
    <div class="icon-list-footer">
      <div class="pagination">
        <button :disabled="pageInfo.page == 1" class="pagination-button" @click="pageDecrease">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div class="pagination-info">
          <span class="current-page">{{ pageInfo.page }}</span>
          <span class="divider">/</span>
          <span class="total-pages">{{ pageInfo.total }}</span>
        </div>
        <button :disabled="pageInfo.page == pageInfo.total" class="pagination-button" @click="pageAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
      <div class="upload-section">
        <FileUpload
          :ref="uploadRef"
          mode="basic"
          class="upload-button"
          :choose-label="uploadName"
          name="file"
          :auto="true"
          choose-icon="null"
          :custom-upload="true"
          accept="image/png,image/jpg,image/jpeg,image/svg"
          :url="util.baseUrl + '/sys/common/upload'"
          :with-credentials="true"
          cancel-label="取消上传"
          upload-label="上传中"
          :disabled="uploadLoading"
          :multiple="true"
          :style="{root: {width: '100%'}}"
          :show-upload-button="false"
          :show-cancel-button="false"
          @before-send="imageBeforeSend"
          @progress="imageProgress"
          @upload="imageUpload"
          @select="onFileSelect" />
      </div>
    </div>
  </div>
  <Toast />
  <ConfirmDialog group="CategoryInput">
    <template #message="">
      <div class="flex flex-col items-center w-full gap-4 border-surface-200 dark:border-surface-700">
        <InputText v-model="CategoryName" maxlength="50" placeholder="最多输入50个字符" />
        <span :class="['text-xs w-full text-right', CategoryName.length >= 45 ? 'text-ppt-text-orange' : 'text-gray-500']">
          {{ CategoryName.length }}/50
          <span v-if="CategoryName.length >= 50" class="ml-1">已达到字符上限</span>
        </span>
      </div>
    </template>
  </ConfirmDialog>
  <ConfirmDialog group="SelectCategoryDialog" class="SelectCategoryDialog">
    <template #message="">
      <div class="flex flex-col items-center w-full gap-4 border-surface-200 dark:border-surface-700 p-4">
        <Select v-model="selectedCategory" :options="categoryList" option-label="name" placeholder="请选择分类" />
      </div>
    </template>
  </ConfirmDialog>
  <ContextMenu ref="menu" :model="items"></ContextMenu>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.icon-list-container {
  @apply w-full h-full flex flex-col bg-white;
}

.icon-list-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white;
}

.header-left {
  @apply flex items-center gap-2;
}

.header-icon {
  @apply text-purple-500;
}

.header-title {
  @apply text-sm font-medium text-gray-700;
}

.header-right {
  @apply flex items-center;
}

.sort-button {
  @apply w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 text-gray-400 hover:text-purple-500 hover:bg-purple-50;
}

.icon-list-content {
  @apply flex-1 overflow-auto p-3;
}

.icon-grid {
  @apply grid grid-cols-3 gap-2;
}

.icon-card {
  @apply bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden cursor-grab transition-all duration-200 hover:shadow-md hover:border-purple-200 hover:bg-purple-50/50;
}

.icon-card:active {
  @apply cursor-grabbing;
}

.icon-card.selected {
  @apply border-purple-500 bg-purple-50 shadow-md;
}

.icon-wrapper {
  @apply w-full aspect-square flex items-center justify-center bg-gray-50;
}

.icon-item {
  @apply w-full h-full object-contain;
}

.icon-list-footer {
  @apply flex flex-col gap-2 px-3 py-3 border-t border-gray-100 bg-gray-50/50;
}

.pagination {
  @apply flex items-center justify-center gap-2;
}

.pagination-button {
  @apply w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 cursor-pointer transition-all duration-200 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed;
}

.pagination-info {
  @apply flex items-center gap-1 text-sm;
}

.current-page {
  @apply font-medium text-gray-700;
}

.divider {
  @apply text-gray-400;
}

.total-pages {
  @apply text-gray-500;
}

.upload-section {
  @apply w-full;
}

.upload-button {
  @apply w-full h-9 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center border-0;
}
</style>

<style scoped lang="less">
.icon-drag-item-layout {
  background: rgba(147, 51, 234, 0.1);
  border: 2px dashed #9333ea;
  color: #9333ea;
  border-radius: 12px;
  padding: 12px;
}
</style>
