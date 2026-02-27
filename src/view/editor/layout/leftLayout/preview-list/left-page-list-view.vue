<script setup lang="ts">
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch} from 'vue'
import {Combine_Lang, configPixel, defaultDpi, EDirectoryType, EPageSizeType, EPageType, type IEditorPageInfo, type IPageSize} from '@/view/editor/utils/common-modle'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import {useConfirm} from 'primevue/useconfirm'
import ConfirmDialog from 'primevue/confirmdialog'
import PreivewDetailView from '@/view/editor/layout/leftLayout/preview-list/preivew-detail-view.vue'
import {debounce} from 'lodash'
import {userStore} from '@/store/user'
import {getHtmlToImage} from '@/lib/pdf-util'
import {useTextEditorStore} from '@/store/textEdiotrSotre'
import ContextMenu from 'primevue/contextmenu'
import {netGetTemplateCategory, netSetTemplate} from '@/net/editorNet'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {updateCombineDirectory, updateSingleDirectory} from '@/view/editor/utils/page-util'
import {useElementVisibility, useScroll} from '@vueuse/core'

const store = useEditorStore()
const storeEn = useEditorTranslationStore()
const textStore = useTextEditorStore()
const {pageList, currentPage, editorLang, editorInfo} = storeToRefs(store)
const {currentPageIndex} = storeToRefs(storeEn)

const user = userStore()
const {hasAllModelAuth} = storeToRefs(user)
const confirm = useConfirm()
const settingPageIndex = ref(-1)
const pageToTemplateTitle = ref('')

const opPageSettingRef = ref()
const pageListRef = ref()
const pageScrollHeight = ref(100)

const preViewPageList = ref<IEditorPageInfo[]>([])

const keySelectedKeyDown = ref(false)
const preSelectPageIndexList = ref<number[]>([])
const preSelectPageIdList = ref<any[]>([])

const menu = ref()
const menuItems = ref<any[]>([])
const prPageListInsertIndex = ref<number>(0)
const pageSingleStyle = (page: IEditorPageInfo) => {
  let style: any = {
    height: Number(((6.875 / (page?.pageSize?.width ?? 1)) * (page?.pageSize?.height ?? 1)).toFixed(5)) + 'rem',
  }

  console.log('pageSingleStyle', style)
  // if (page.selected) {
  //   style['border-inline-width'] = '1px'
  //   style['border-top-width'] = '1px'
  //   style['border-bottom-width'] = '2px'
  //   style['border-color'] = '#EEE9E5'
  //   style['border-bottom-color'] = '#000000'
  // }
  return style
}
const debounceUpdate = debounce(initPageList, 1000, {trailing: true})

const firstInit = ref(true)
const directoryActionDes = computed(() => {
  return pageList.value.find((page: IEditorPageInfo) => page.type === EPageType.Directory) ? '更新目录' : '生成目录'
})

const scrollEl = useTemplateRef('pageListRef')
const {x, y, measure, isScrolling, arrivedState, directions} = useScroll(scrollEl)
const targetIsVisible = useElementVisibility(scrollEl)

const cacheScrollY = ref<number>(0)
watch(
  () => y.value,
  (value) => {
    cacheScrollY.value = y.value
  },
)
watch(
  () => targetIsVisible.value,
  (value) => {
    if (value) {
      y.value = cacheScrollY.value || 0
    } else {
      cacheScrollY.value = y.value
    }
  },
)

onMounted(() => {
  console.log('onMounted', 'left-page')
  emitter.on(MittTypeEnum.Page_Preview_Refresh, () => {
    debounceUpdate()
  })
  initKeyDownEvent(true)
  // emitter.on(MittTypeEnum.Window_ReSize, () => {
  // debounceUpdate()
  // })
})

onUnmounted(() => {
  initKeyDownEvent(false)
})

watch(
  () => pageList.value,
  (value) => {
    if (firstInit.value) {
      initPageList()
      firstInit.value = false
    } else {
      debounceUpdate()
    }
  },
  {immediate: true, deep: true},
)

watch(
  () => currentPageIndex.value,
  (value) => {
    selectPage(value)
  },
)
const selectedCategory: any = ref(null)
const categoryList: any = ref([])
const getTemplateCategory = (type: any) => {
  netGetTemplateCategory(type).then((res: any) => {
    console.log(res)
    categoryList.value = res
    categoryList.value.unshift({name: '全部', id: ''})
  })
}

function initPageList() {
  const pageListClone = pageList.value
  if (pageList.value.length > 0) {
    const page = pageList.value[0]
    const height = Number(((6.875 / (page?.pageSize?.width ?? 1)) * (page?.pageSize?.height ?? 1)).toFixed(2)) + 'rem'
    pageListClone.forEach((page1: IEditorPageInfo) => {
      page1.preHeight = height
    })
    // console.log('preHeight', pageListClone)
  }
  nextTick(() => {
    pageScrollHeight.value = pageListRef.value?.offsetHeight ?? 0 - 32
    // console.log('pageScrollHeight', pageScrollHeight.value)
    preViewPageList.value = pageListClone
    if (currentPage.value) {
      const currentIndex = preViewPageList.value.findIndex((item) => item.pageId === currentPage.value?.pageId)
      selectPage(currentIndex)
    }
    // console.log('preViewPageList', pageListClone)
  })
}

function addPage(type: string = '') {
  // opPageSettingRef.value.toggle(event)
  let pageSize: IPageSize = {
    width: 210,
    height: 297,
    sizeName: 'A4',
    type: EPageSizeType.Millimetre,
    isCustomize: false,
    dpi: defaultDpi,
    pixelWidth: 210,
    pixelHeight: 297,
  }
  if (currentPage.value && currentPage.value.pageSize) {
    pageSize = currentPage.value.pageSize
  }

  store.addNewPageInfoBySize(configPixel(pageSize), type, settingPageIndex.value)
  settingPageIndex.value = -1
}

function selectPage(index: number) {
  console.log('selectPage', index)
  if (keySelectedKeyDown.value) {
    const pageId = pageList.value[index]?.pageId ?? ''
    if (!preSelectPageIndexList.value.includes(index)) {
      preSelectPageIndexList.value.push(index)
      preSelectPageIdList.value.push(pageId)
    }
  } else {
    if (store.currentPageIndex !== index) {
      store.selectCurrentPage(index)
      preSelectPageIndexList.value = [index]
      preSelectPageIdList.value = [pageList.value[index]?.pageId ?? '']
      if (storeEn.editorLang === 'en' || storeEn.noPageAction) {
        storeEn.selectCurrentPage(index)
      }
    }
  }
}

function hidePageSettingOp() {
  opPageSettingRef.value?.hide()
  settingPageIndex.value = -1
}

function pageMoreSetting(event: Event, index: number) {
  settingPageIndex.value = index
  opPageSettingRef.value?.toggle(event)
}

function setModule(type: number) {
  pageToTemplateTitle.value = ''
  selectedCategory.value = null
  const page = pageList.value[settingPageIndex.value]
  hidePageSettingOp()
  if (!page) return
  getTemplateCategory(type)
  confirm.require({
    group: 'templating',
    header: '模板信息',
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
      // 表单校验
      if (pageToTemplateTitle.value === '') {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: '请输入模板名称',
          life: 1500,
        })
        // 校验失败时，重新打开对话框，保持在当前状态
        setTimeout(() => {
          confirm.require({
            group: 'templating',
            header: '模板信息',
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
              // 这里复用原始的accept逻辑
              if (pageToTemplateTitle.value === '' || selectedCategory.value === null) {
                emitter.emit(MittTypeEnum.Toast_Message, {
                  severity: 'error',
                  summary: '错误',
                  detail: pageToTemplateTitle.value === '' ? '请输入模板名称' : '请选择模板分类',
                  life: 1500,
                })
                return
              }
              store.setLoading(true)
              const imageString = await getHtmlToImage(page, editorInfo.value.fontList ?? [], editorLang.value, useTextEditorStore().allFontMap)
              const content = JSON.stringify(page)
              netSetTemplate({
                content: content,
                title: pageToTemplateTitle.value,
                type: type.toString(),
                templateCover: imageString,
                category: selectedCategory.value.id,
              })
                .then((data) => {})
                .catch()
                .finally(() => {
                  store.setLoading(false)
                })
            },
            reject: () => {},
          })
        }, 100)
        return
      }
      if (selectedCategory.value === null) {
        emitter.emit(MittTypeEnum.Toast_Message, {
          severity: 'error',
          summary: '错误',
          detail: '请选择模板分类',
          life: 1500,
        })
        // 校验失败时，重新打开对话框，保持在当前状态
        setTimeout(() => {
          confirm.require({
            group: 'templating',
            header: '模板信息',
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
              // 这里复用原始的accept逻辑
              if (pageToTemplateTitle.value === '' || selectedCategory.value === null) {
                emitter.emit(MittTypeEnum.Toast_Message, {
                  severity: 'error',
                  summary: '错误',
                  detail: pageToTemplateTitle.value === '' ? '请输入模板名称' : '请选择模板分类',
                  life: 1500,
                })
                return
              }
              store.setLoading(true)
              const imageString = await getHtmlToImage(page, editorInfo.value.fontList ?? [], editorLang.value, useTextEditorStore().allFontMap)
              const content = JSON.stringify(page)
              netSetTemplate({
                content: content,
                title: pageToTemplateTitle.value,
                type: type.toString(),
                templateCover: imageString,
                category: selectedCategory.value.id,
              })
                .then((data) => {})
                .catch()
                .finally(() => {
                  store.setLoading(false)
                })
            },
            reject: () => {},
          })
        }, 100)
        return
      }

      // 校验通过，执行正常的模板保存逻辑
      store.setLoading(true)
      const imageString = await getHtmlToImage(page, editorInfo.value.fontList ?? [], editorLang.value, useTextEditorStore().allFontMap)
      const content = JSON.stringify(page)
      netSetTemplate({
        content: content,
        title: pageToTemplateTitle.value,
        type: type.toString(),
        templateCover: imageString,
        category: selectedCategory.value.id,
      })
        .then((data) => {})
        .catch()
        .finally(() => {
          store.setLoading(false)
        })
    },
    reject: () => {},
  })
}

function pagePositionConfig(type: string) {
  if (settingPageIndex.value < 0) {
    hidePageSettingOp()
    return
  }
  switch (type) {
    case 'top':
      store.topPage(settingPageIndex.value)
      break
    case 'bottom':
      store.bottomPage(settingPageIndex.value)
      break
    case 'moveUp':
      if (settingPageIndex.value <= 0) {
        return
      }
      store.swapPage(settingPageIndex.value, settingPageIndex.value - 1)
      break
    case 'moveDown':
      if (settingPageIndex.value >= pageList.value.length - 1) {
        return
      }
      store.swapPage(settingPageIndex.value, settingPageIndex.value + 1)
      break
  }
  hidePageSettingOp()
}

function pageListPositionConfig(type: string, index: number = 0) {
  switch (type) {
    case 'list-top':
      store.topListPage(preSelectPageIdList.value)
      break
    case 'list-bottom':
      store.bottomListPage(preSelectPageIdList.value)
      break
    case 'list-moveUp':
      store.moveListPage(preSelectPageIdList.value, preSelectPageIndexList.value, type)
      break
    case 'list-moveDown':
      store.moveListPage(preSelectPageIdList.value, preSelectPageIndexList.value, type)
      break
    case 'insert-list':
      store.moveListPage(preSelectPageIdList.value, preSelectPageIndexList.value, type, index)
      break
  }
  preSelectPageIndexList.value = [pageList.value.findIndex((item) => item.pageId === currentPage.value?.pageId)]
  preSelectPageIdList.value = preSelectPageIndexList.value.filter((item) => item === currentPage.value?.pageId)
}

function deletePage() {
  confirmDelete()
}

const confirmDelete = () => {
  confirm.require({
    group: 'deletePage',
    message: '确定删除当前页么？',
    header: '提醒',
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
      store.deletePageInfo(settingPageIndex.value)
      hidePageSettingOp()
    },
    reject: () => {
      hidePageSettingOp()
    },
  })
}

function setPageToDirectory() {
  store.setPageToAction(settingPageIndex.value, pageList.value[settingPageIndex.value].type !== EPageType.ManualDirectory, EPageType.ManualDirectory)
  hidePageSettingOp()
}

function setPageToCover() {
  store.setPageToAction(settingPageIndex.value, pageList.value[settingPageIndex.value].type !== EPageType.Cover, EPageType.Cover)
  hidePageSettingOp()
}

async function updateDirectory() {
  store.setLoading(true)
  if (editorLang.value === Combine_Lang && pageList.value.length > 0) {
    const topPageList = await updateCombineDirectory(pageList.value, editorLang.value, editorInfo.value.id, textStore.allFontMap)
    if (topPageList.length > 0) {
      store.resetPageList(topPageList)
    }
    // const multilingualDirectoryIndex = topPageList.findIndex((page) => page.type === EPageType.MultilingualDirectory)
    // const multilingualDirectoryLength = topPageList.filter((page) => page.type === EPageType.MultilingualDirectory).length
  } else {
    const directoryPageList = await updateSingleDirectory(pageList.value, editorLang.value, editorInfo.value.id, textStore.allFontMap)
    store.addDirectoryPage(directoryPageList)
    if (directoryPageList.length > 1) {
      store.resetDirectoryPage(directoryPageList.length - 1)
    }
  }
  store.setLoading(false)
  // getTitleListById(editorInfo.value.id)
  //   .then((data: any) => {
  //     if (data && data instanceof Array) {
  //       addDirectory(data, nowTime, true)
  //       // todo
  //     }
  //   })
  //   .finally(() => {
  //     store.setLoading(false)
  //   })
}

function onPageRightClick(event: Event, index: number) {
  if (preSelectPageIndexList.value.length <= 1 || !preSelectPageIndexList.value.includes(index)) {
    return
  }
  menuItems.value = [] as any[]
  menuItems.value.push({
    label: '插入到',
    command: null,
  })
  menuItems.value.push({
    label: '多项置顶',
    command: () => {
      pageListPositionConfig('list-top')
    },
  })
  menuItems.value.push({
    label: '多项置底',
    command: () => {
      pageListPositionConfig('list-bottom')
    },
  })
  menuItems.value.push({
    label: '多项上移',
    command: () => {
      pageListPositionConfig('list-moveUp')
    },
  })
  menuItems.value.push({
    label: '多项下移',
    command: () => {
      pageListPositionConfig('list-moveDown')
    },
  })
  menu.value.show(event)
}

function prPageListInsertIndexDone() {
  pageListPositionConfig('insert-list', prPageListInsertIndex.value)
  menu.value.hide()
}

// 键盘事件
const onKeydown = (e: KeyboardEvent) => {
  // console.log('keyDown', e.key)
  if (e.key === 'Shift' || e.key === 'Control') {
    // console.log('keyDown', true)
    keySelectedKeyDown.value = true
  }
}

const onKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Shift' || e.key === 'Control') {
    // console.log('keyDown', false)
    keySelectedKeyDown.value = false
  }
}

function initKeyDownEvent(val: boolean) {
  if (val) {
    document?.addEventListener('keydown', onKeydown)
    document?.addEventListener('keyup', onKeyup)
  } else {
    // 不是选中移除
    document?.removeEventListener('keydown', onKeydown)
    document?.removeEventListener('keyup', onKeyup)
  }
}
</script>

<template>
  <div class="h-3/5 w-full flex flex-col overflow-auto justify-center items-center bg-white">
    <div ref="pageListRef" class="flex-1 h-0 overflow-auto pt-3 w-full flex flex-col items-center justify-center">
      <!--      <VirtualScroller :items="preViewPageList" lazy :item-size="preViewPageList.length > 10 ? preViewPageList.length : preViewPageList.length + 1" class="h-full w-full">-->
      <!--        <template #item="{item, options}">-->
      <!--          <div-->
      <!--            class="page-item-layout h-full"-->
      <!--            :class="currentPage?.pageId === item.pageId || preSelectPageIdList.includes(item.pageId) ? 'selected' : ''"-->
      <!--            :style="{height: item.preHeight ?? 'fit-content'}"-->
      <!--            @click="selectPage(options.index)"-->
      <!--            @contextmenu="onPageRightClick($event, options.index)">-->
      <!--            <preivew-detail-view :key="'prePageView' + item.pageId" :page-info="item" :lang="editorLang" class="w-full h-full" />-->
      <!--            <i class="absolute top-2 right-1 pi pi-ellipsis-h text-base !text-ppt-text-orange cursor-pointer" @click="pageMoreSetting($event, options.index)"></i>-->
      <!--            <div class="absolute w-fit h-5 px-1.5 pt-[2px] flex text-center justify-center -left-[1px] -bottom-[2px] bg-stone-700 rounded-[4px_4px_0_4px] text-white text-xs">-->
      <!--              {{ options.index + 1 }}-->
      <!--            </div>-->
      <!--          </div>-->
      <!--          &lt;!&ndash;          <div :class="['flex items-center p-2', {'bg-surface-100 dark:bg-surface-700': options.odd}]" style="height: 50px" :style="{height: item.preHeight ?? 'fit-content'}">{{ item }}</div>&ndash;&gt;-->
      <!--        </template>-->
      <!--      </VirtualScroller>-->
      <div class="h-full w-full">
        <!--        <div v-for="(page, index) in preViewPageList" :key="'pageId_' + page.pageId" class="h-fit flex flex-col">-->
        <div
          v-for="(page, index) in preViewPageList"
          :key="'pageId_' + page.pageId"
          class="page-item-layout h-full"
          :class="currentPage?.pageId === page.pageId || preSelectPageIdList.includes(page.pageId) ? 'selected' : ''"
          :style="{height: page.preHeight ?? 'fit-content'}"
          @click="selectPage(index)"
          @contextmenu="onPageRightClick($event, index)">
          <preivew-detail-view :key="'prePageView' + page.pageId" :page-info="page" :lang="editorLang" class="w-full h-full" />
          <i class="absolute top-2 right-1 pi pi-ellipsis-h text-base !text-ppt-text-purple cursor-pointer" @click="pageMoreSetting($event, index)"></i>
          <div class="absolute w-fit h-5 px-1.5 pt-[2px] flex text-center justify-center -left-[1px] -bottom-[2px] bg-stone-700 rounded-[4px_4px_0_4px] text-white text-xs">
            {{ index + 1 }}
          </div>
        </div>
        <!--                <div class="page-item-layout h-full" :class="currentPage?.pageId === page.pageId ? 'selected' : ''" :style="{height: page.preHeight ?? 'fit-content'}" @click="selectPage(index)">-->
        <!--                  &lt;!&ndash;            <preivew-detail-view :key="'prePageView' + page.pageId" :page-info="page" :lang="editorLang" class="w-full h-full" />&ndash;&gt;-->
        <!--                  <i class="absolute top-2 right-1 pi pi-ellipsis-h text-base !text-ppt-text-orange cursor-pointer" @click="pageMoreSetting($event, index)"></i>-->
        <!--                  <div class="absolute w-5 h-5 flex text-center justify-center -left-[1px] -bottom-[2px] bg-stone-700 rounded-[4px_4px_0_4px] text-white text-xs">-->
        <!--                    {{ index + 1 }}-->
        <!--                  </div>-->
        <!--                </div>-->
        <!--        </div>-->
      </div>
    </div>
    <div class="w-full h-8 mt-auto pl-4 pr-4 mb-2 flex flex-row items-center justify-center gap-2">
      <span class="py-2 flex-1 cursor-pointer text-sm bg-ppt-bg-purple rounded text-ppt-text-purple text-center" @click="addPage">新增页面</span>
      <div v-if="editorInfo.directoryType === EDirectoryType.Auto" class="py-2 flex-1 cursor-pointer text-sm bg-ppt-bg-purple rounded text-ppt-text-purple" @click="updateDirectory">
        {{ directoryActionDes }}
      </div>
    </div>
  </div>
  <ContextMenu ref="menu" :model="menuItems">
    <template #item="{item, props}">
      <a class="flex items-center" v-bind="props.action">
        <span :class="item.icon" />
        <span class="ml-2">{{ item.label }}</span>
        <InputNumber v-if="item.label === '插入到'" v-model="prPageListInsertIndex" placeholder="请输入" size="small" :max="pageList.length" :min="1" class="w-12 my-input-style" @click.stop @keydown.enter="prPageListInsertIndexDone" />
      </a>
    </template>
  </ContextMenu>
  <Popover ref="opPageSettingRef">
    <div class="page-contentmenu">
      <div v-if="hasAllModelAuth" class="menu-item" @click="setModule(1)"><span>设为公有模板</span></div>
      <div class="menu-item" @click="setModule(0)">
        <span>设为我的模板</span>
      </div>
      <div v-if="pageList[settingPageIndex] && ![EPageType.Directory, EPageType.MultilingualDirectory].includes(pageList[settingPageIndex]?.type ?? EPageType.Default)" class="menu-item" @click="setPageToCover()">
        <span>{{ pageList[settingPageIndex]?.type === EPageType.Cover ? '取消封面' : '设为封面' }}</span>
      </div>
      <!--      <div v-if="![EPageType.Directory, EPageType.Cover].includes(pageList[settingPageIndex]?.type ?? EPageType.Default)" class="menu-item" @click="setPageToDirectory()">-->
      <!--        <span>{{ pageList[settingPageIndex].type === EPageType.MultilingualDirectory ? '取消目录' : '设为目录' }}</span>-->
      <!--      </div>-->
      <div v-if="settingPageIndex === 0" class="menu-item" @click="addPage(EPageType.Cover)">
        <span>插入封面</span>
      </div>
      <div v-if="editorInfo.directoryType === EDirectoryType.Custom" class="menu-item" @click="addPage(EPageType.Directory)"><span>插入目录</span></div>
      <div v-if="editorLang === Combine_Lang" class="menu-item" @click="addPage(EPageType.MultilingualDirectory)"><span>插入语种目录</span></div>
      <div class="menu-item" @click="addPage('insert')"><span>插入页面</span></div>
      <div v-if="settingPageIndex !== 0" class="menu-item" @click="pagePositionConfig('top')"><span>置顶</span></div>
      <div v-if="settingPageIndex < pageList.length - 1" class="menu-item" @click="pagePositionConfig('bottom')">
        <span>置底</span>
      </div>
      <div v-if="settingPageIndex > 0" class="menu-item" @click="pagePositionConfig('moveUp')"><span>上移</span></div>
      <div v-if="settingPageIndex < pageList.length - 1" class="menu-item" @click="pagePositionConfig('moveDown')">
        <span>下移</span>
      </div>
      <div class="menu-item !text-red-400 hover:!text-red-600" @click="deletePage"><span>删除</span></div>
    </div>
  </Popover>
  <ConfirmDialog group="deletePage" class="w-100"></ConfirmDialog>
  <ConfirmDialog group="templating">
    <template #message="">
      <div class="flex flex-col items-center w-full gap-4 border-surface-200 dark:border-surface-700">
        <div class="flex w-full items-center">
          <label class="mr-3">名称</label>
          <InputText v-model="pageToTemplateTitle" />
        </div>
        <div class="flex w-full items-center">
          <label class="mr-3">分类</label>
          <Select v-model="selectedCategory" class="flex-1" :options="categoryList" option-label="name" placeholder="请选择分类" />
        </div>
      </div>
    </template>
  </ConfirmDialog>
  <!--  <Popover ref="opPageSettingRef">-->
  <!--    <settings-page-view :add="true" @confirm-page-size="hidePageSettingOp" />-->
  <!--  </Popover>-->
</template>

<style scoped>
@reference "@/style/tailwind.css";

.page-item-layout {
  @apply w-27.5 justify-self-center border-1 border-ppt-page-border bg-white mt-4 box-border relative shadow-sm rounded-md;

  &.selected {
    @apply border-2 border-ppt-text-purple ring-2 ring-ppt-text-purple/20 shadow-md rounded-md;
  }
}

.page-contentmenu {
  @apply w-24 rounded-md flex flex-col shadow-sm bg-white;

  .menu-item {
    @apply w-full h-9 font-normal rounded-sm items-center px-3 flex flex-row whitespace-nowrap  text-sm cursor-pointer outline-0 text-ppt-text-dark
    hover:border-ppt-text-purple  hover:text-ppt-text-purple hover:bg-ppt-bg-purple transition-colors duration-200;
  }
}
</style>
