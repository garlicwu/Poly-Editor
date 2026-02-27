<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {useToast} from 'primevue/usetoast'
import {netDeleteTemplate, netGetTemplateCategory, netGetTemplateList, netTemplateCategoryAdd} from '@/net/editorNet'
import ConfirmDialog from 'primevue/confirmdialog'
import {useConfirm} from 'primevue/useconfirm'
import Popover from 'primevue/popover'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import {userStore} from '@/store/user'
import {storeToRefs} from 'pinia'
import {useEditorStore} from '@/store/editorStore'
import type {IEditorPageInfo} from '@/view/editor/utils/common-modle'
import emitter, {MittTypeEnum} from '@/lib/mitt'

const editorStore = useEditorStore()
const opPageSettingRef = ref()
const settingTemplateIndex = ref(-1)
const user = userStore()
const {hasAllModelAuth} = storeToRefs(user)
const confirm = useConfirm()
const pageInfo = reactive({
  pageNo: 1,
  total: 3,
  pageSize: 3,
})

interface ImageTypeItem {
  id: string
  templateCover: string
  title: string
  content: string
}

const templateList = ref<ImageTypeItem[]>([])

onMounted(() => {
  getTemplateList()
  getTemplateCategory()
})
const totalPages = ref(1)

const getTemplateList = async () => {
  netGetTemplateList('', 0, pageInfo.pageNo, pageInfo.pageSize)
    .then((res: any) => {
      templateList.value = res.records
      pageInfo.total = res.total
      // 计算总页数
      totalPages.value = Math.ceil(res.total / pageInfo.pageSize)
    })
    .catch((err) => console.log(err))
}

function prevPage() {
  if (pageInfo.pageNo > 1) {
    pageInfo.pageNo--
    getTemplateList()
  }
}

function nextPage() {
  if (pageInfo.pageNo < totalPages.value) {
    pageInfo.pageNo++
    getTemplateList()
  }
}

const getTemplateCategory = () => {
  netGetTemplateCategory(0).then((res: any) => {
    console.log(res)
  })
}

function hidePageSettingOp() {
  opPageSettingRef.value?.hide()
}

function pageMoreSetting(event: Event, index: number) {
  settingTemplateIndex.value = index
  opPageSettingRef.value?.toggle(event)
}

function applyTemplate() {
  if (!templateList.value[settingTemplateIndex.value]) {
    return
  }
  const applyContent = templateList.value[settingTemplateIndex.value].content
  if (applyContent) {
    const applyPage = JSON.parse(applyContent) as IEditorPageInfo
    editorStore.addPageWithTemplate(applyPage)
    emitter.emit(MittTypeEnum.Toast_Message, {severity: 'success', summary: '成功', detail: '应用模板成功', life: 1500})
  }
  hidePageSettingOp()
}

const confirmDelete = () => {
  // 先关闭Popover菜单
  hidePageSettingOp();
  
  // 保存当前要删除的模板索引和ID
  const templateToDelete = settingTemplateIndex.value;
  if (templateToDelete === -1 || !templateList.value[templateToDelete]) {
    return;
  }
  
  const templateId = templateList.value[templateToDelete].id;
  const templateTitle = templateList.value[templateToDelete].title || '该模板';
  
  // 立即重置索引
  settingTemplateIndex.value = -1;
  
  // 使用唯一的group属性避免与其他确认弹窗冲突
  confirm.require({
    group: 'templateDelete',
    message: `确定删除"${templateTitle}"模板么？`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '删除',
    },
    accept: () => {
        // 使用保存的ID执行删除
        netDeleteTemplate(templateId).then((res) => {
          getTemplateList();
        }).catch((error) => {
          // 显示错误提示
          emitter.emit(MittTypeEnum.Toast_Message, {
            severity: 'error',
            summary: '错误',
            detail: '模板删除失败，请重试',
            life: 1500,
          });
        });
      },
    reject: () => {
      // 取消操作，不需要额外处理
    }
  });
};

const store = useEditorStore()
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
      store.setLoading(true)
      netTemplateCategoryAdd({name: CategoryName.value, type: 0})
        .then((res) => {
          getTemplateCategory()
        })
        .finally(() => {
          store.setLoading(false)
        })
    },
    reject: () => {},
  })
}

const previewTemplate = ref<ImageTypeItem | null>(null)
const previewPosition = reactive({x: 0, y: 0})

const onTemplateMouseEnter = (event: MouseEvent, template: ImageTypeItem) => {
  previewTemplate.value = template
  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  previewPosition.x = rect.right + 10
  previewPosition.y = rect.top
}

const onTemplateMouseLeave = () => {
  previewTemplate.value = null
}
</script>

<template>
  <div class="template-list-container">
    <div class="template-list-header">
      <div class="header-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="header-icon">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
        <span class="header-title">模板库</span>
      </div>
      <div class="header-right">
        <!-- 可以添加排序按钮或其他操作 -->
      </div>
    </div>
    <div class="template-list-content">
      <div class="template-grid">
        <div
          v-for="(template, index) in templateList"
          :key="template.id"
          class="template-card"
          @mouseenter="onTemplateMouseEnter($event, template)"
          @mouseleave="onTemplateMouseLeave">
          <div class="template-wrapper">
            <Image :src="template.templateCover" alt="Template" class="template-item" />
          </div>
          <i class="template-menu-icon absolute top-4 right-3 pi pi-ellipsis-h text-base text-purple-500 cursor-pointer transition-colors duration-200 hover:text-purple-600" @click="pageMoreSetting($event, index)"></i>
          <div class="template-name">{{ template.title  }}</div>
        </div>
      </div>
      <Teleport to="body">
        <Transition name="preview-fade">
          <div v-if="previewTemplate" class="template-preview" :style="{left: previewPosition.x + 'px', top: previewPosition.y + 'px'}">
            <Image :src="previewTemplate.templateCover" alt="Preview" class="preview-image" />
          </div>
        </Transition>
      </Teleport>
    </div>
    <div class="template-list-footer">
      <div class="pagination">
        <button :disabled="pageInfo.pageNo <= 1" class="pagination-button" @click="prevPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div class="pagination-info">
          <span class="current-page">{{ pageInfo.pageNo }}</span>
          <span class="divider">/</span>
          <span class="total-pages">{{ totalPages }}</span>
        </div>
        <button :disabled="pageInfo.pageNo >= totalPages" class="pagination-button" @click="nextPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  <Popover ref="opPageSettingRef">
    <div class="page-contentmenu">
      <div class="menu-item" @click="applyTemplate"><span>应用</span></div>
      <div class="menu-item !text-red-400 hover:!text-red-600" @click="confirmDelete"><span>删除</span></div>
    </div>
  </Popover>
  <ConfirmDialog group="templateDelete"></ConfirmDialog>
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
</template>

<style scoped>
@reference "@/style/tailwind.css";

.template-list-container {
  @apply w-full h-full flex flex-col bg-white;
}

.template-list-header {
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

.template-list-content {
  @apply flex-1 overflow-auto p-3 relative;
}

.template-grid {
  @apply grid grid-cols-2 gap-3;
}

.template-card {
  @apply bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-200 hover:bg-purple-50/50 relative;
}

.template-wrapper {
  @apply w-full aspect-square flex items-center justify-center bg-gray-50 p-2;
}

.template-item {
  @apply max-w-full max-h-full object-contain;
}

.template-name {
  @apply text-xs text-gray-600 font-medium transition-colors duration-200 text-center py-2;
}

.template-card:hover .template-name {
  @apply text-purple-600;
}

.template-menu-icon {
  @apply absolute top-3 right-3 text-purple-500 cursor-pointer transition-colors duration-200 hover:text-purple-600;
}

.template-list-footer {
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

.template-preview {
  @apply fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 p-2 pointer-events-none;
  max-width: 320px;
  max-height: 320px;
}

.preview-image {
  @apply max-w-full max-h-full object-contain rounded-lg;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.preview-fade-enter-to,
.preview-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

.page-contentmenu {
  @apply w-24 rounded-md flex flex-col shadow-sm bg-white;

  .menu-item {
    @apply w-full h-9 font-normal rounded-sm items-center px-3 flex flex-row whitespace-nowrap  text-sm cursor-pointer outline-0 text-gray-700
    hover:border-purple-300  hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200;
  }
}
</style>
