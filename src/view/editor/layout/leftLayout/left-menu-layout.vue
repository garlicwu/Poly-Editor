<script setup lang="ts">
import {ref, watch} from 'vue'
import SvgIcon from '@/view/common/svg-icon.vue'
import PreviewListView from '@/view/editor/layout/leftLayout/preview-list/preview-list-view.vue'
import TextListView from '@/view/editor/layout/leftLayout/text-list/text-list-view.vue'
import IconListView from '@/view/editor/layout/leftLayout/icon-list/icon-list-view.vue'
import ImageListView from '@/view/editor/layout/leftLayout/image-list/image-list-view.vue'
import TemplateListView from '@/view/editor/layout/leftLayout/template-list/template-list-view.vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import ComponentListView from '@/view/editor/layout/leftLayout/component-list/component-list-view.vue'

const editorStore = useEditorStore()
const {exportStatus} = storeToRefs(editorStore)

interface IItemLeft {
  name: string
  icon: string
  clickIcon?: string
  selected: boolean
}

watch(
  () => exportStatus.value,
  (value) => {
    if (value) {
      clickItem(leftItemList.value[0])
    }
  },
)

const currentLeftItem = ref<IItemLeft>({
  name: '预览',
  icon: 'ic-left-menu-preview',
  selected: true,
})
const leftItemList = ref<IItemLeft[]>([
  {
    name: '预览',
    icon: 'ic-left-menu-preview',
    selected: true,
  },
  {
    name: '文字',
    icon: 'ic-left-menu-text',
    selected: false,
  },
  {
    name: '图片',
    icon: 'ic-left-menu-image',
    selected: false,
  },
  {
    name: '图标',
    icon: 'ic-left-menu-icon',
    selected: false,
  },
  {
    name: '组件',
    icon: 'ic-left-menu-component',
    selected: false,
  },
  {
    name: '模板',
    icon: 'ic-left-menu-template',
    selected: false,
  },
])

const clearSelected = () => {
  leftItemList.value.forEach((item) => {
    item.selected = false
  })
}
const clickItem = (item: IItemLeft) => {
  clearSelected()
  currentLeftItem.value = item
  if (item.name === '预览') {
    editorStore.setExportStatus(true)
  } else {
    editorStore.setExportStatus(false)
  }
  useEditorStore().clearComponentAction()
  item.selected = true
}
</script>

<template>
  <div class="flex flex-row w-fit h-full bg-white">
    <div class="flex flex-col w-17.5 h-full items-center border-r border-ppt-line bg-white">
      <div v-for="(item, index) in leftItemList" :key="item.name + '_' + index" class="left-card" :class="item.selected ? 'select' : ''" @click="clickItem(item)">
        <svg-icon :name="item.icon" :custom-width="1.75" class-name="left-svg" />
        <span class="mt-0.5">{{ item.name }}</span>
      </div>
    </div>
    <div class="h-full w-49 flex flex-col border-r border-ppt-line bg-white">
      <keep-alive>
        <preview-list-view v-if="currentLeftItem.name === '预览'" />
        <text-list-view v-else-if="currentLeftItem.name === '文字'" />
        <image-list-view v-else-if="currentLeftItem.name === '图片'" />
        <icon-list-view v-else-if="currentLeftItem.name === '图标'" />
        <component-list-view v-else-if="currentLeftItem.name === '组件'" />
        <template-list-view v-else-if="currentLeftItem.name === '模板'" />
      </keep-alive>
    </div>
  </div>
</template>

<style scoped></style>
