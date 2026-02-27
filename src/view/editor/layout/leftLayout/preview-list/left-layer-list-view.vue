<script setup lang="ts">
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import SvgIcon from '@/view/common/svg-icon.vue'
import {EComponentType, type IComponentGroup, type IComponentInfo} from '@/view/editor/utils/common-modle'
import {type SortableEvent, VueDraggable} from 'vue-draggable-plus'
import {ref, watch} from 'vue'
import {cloneDeep, debounce} from 'lodash'
import {zodResolver} from '@primevue/forms/resolvers/zod'
import {z} from 'zod'

const store = useEditorStore()
const {currentComponentList, groupSelect} = storeToRefs(store)
const groupList = ref<IComponentGroup[]>([])
const groupExpand = ref<string[]>([])
const localComponentList = ref<IComponentInfo[]>([])

const debounceInit = debounce(
  () => {
    localComponentList.value = cloneDeep(currentComponentList.value)
    initGroupList()
  },
  450,
  {trailing: true},
)

watch(
  () => currentComponentList.value,
  (value) => {
    // console.log('currentComponentList1', value.find((item) => item.selected)?.componentId)
    debounceInit()
  },
  {immediate: true, deep: true},
)

const resolver = ref(
  zodResolver(
    z.object({
      name: z.string().min(1, {message: '请输入'}).max(15, {message: '组合名称最大为10个字符'}),
    }),
  ),
)

function initGroupList() {
  groupList.value = []
  localComponentList.value.forEach((item: IComponentInfo) => {
    if (item.groupId) {
      const findGroupIndex = groupList.value.findIndex((group) => group.groupId === item.groupId)
      if (findGroupIndex === -1) {
        groupList.value.push({
          groupName: item.groupName,
          groupId: item.groupId,
          components: [item],
        })
      } else {
        groupList.value[findGroupIndex].components.push(item)
      }
    }
  })
  console.log('groupList', groupList.value)
  groupExpand.value = groupList.value.filter((item) => groupExpand.value.includes(item.groupId?.toString() ?? '')).map((item) => item.groupId?.toString()) as string[]
}

const clickCurrentComponent = (component: IComponentInfo) => {
  store.setCurrentComponentSelected(component.componentId)
}
const configComponentSvg = (component: IComponentInfo) => {
  return component.componentType === EComponentType.Image || component.componentType === EComponentType.Icon ? 'ic-left-component-image' : 'ic-left-component-text-des'
}

function onStart(event: SortableEvent) {
  console.log('start drag')
}

function onEnd(event: SortableEvent) {
  console.log('end drag', event)
  if (event.newIndex !== undefined && event.oldIndex !== undefined) {
    store.swapComponent(event.newIndex, event.oldIndex)
  }
}

const layerName = (component: IComponentInfo) => {
  let name = ''
  if (component.componentType === EComponentType.Text || component.componentType === EComponentType.PageFooter) {
    if (component.text && component.text.length > 0) {
      name = `:${component.text.substring(0, 10)}`
    }
  }
  return name
}

const getComponentTypeName = (type: string): string => {
  // 去掉Yaber前缀
  if (type.startsWith('Yaber')) {
    return type.substring(5)
  }
  return type
}

const showInputGroup = (index: number, able: boolean) => {
  groupList.value[index].inputAble = able
  if (able) {
    setTimeout(() => {
      document.getElementById('layer-group-id' + groupList.value[index].groupId)?.focus()
    }, 100)
  }
}

const inputBlur = (event: InputEvent, index: number) => {
  const groupName = groupList.value[index].groupName
  const groupId = groupList.value[index].groupId
  showInputGroup(index, false)
  store.resetCurrentComponentGroupName(groupId, groupName)
}

const debounceClickGroup = debounce(
  (index: number) => {
    if (groupList.value[index].inputAble) {
      return
    }
    resetGroupList(index)
  },
  300,
  {trailing: true},
)

function resetGroupList(index: number) {
  // groupList.value.forEach((item) => {
  //   item.selected = false
  // })
  // groupList.value[index].selected = true
  const groupId = groupList.value[index].groupId
  groupSelect.value = true
  currentComponentList.value.forEach((item) => {
    item.selected = item.groupId === groupId
  })
  setTimeout(() => {
    groupSelect.value = false
  }, 300)
}
</script>

<template>
  <div class="flex-1 h-0 w-full flex-col bg-ppt-bg-normal overflow-auto">
    <div class="w-full flex flex-row text-xs text-ppt-text-light mt-2 mb-2">
      <span class="w-10 ml-2 text-left">图层</span>
      <span class="ml-auto mr-2">位置</span>
    </div>
    <Accordion :value="groupExpand" multiple>
      <AccordionPanel v-for="(tab, groupIndex) in groupList" :key="tab.groupId" :value="tab.groupId">
        <AccordionHeader class="my-custom-accordionheader-style" @keydown.enter.stop>
          <span class="flex items-center w-full" @mousedown.stop @click.stop>
            <span v-if="!tab.inputAble" class="flex-1 text-left truncate text-ppt-text-dark text-sm" :class="tab.selected ? 'font-bold' : ''" @click.stop="debounceClickGroup(groupIndex)" @dblclick.stop="showInputGroup(groupIndex, true)">{{
              !tab.groupName || tab.groupName === '' ? `编组${groupIndex + 1}` : tab.groupName
            }}</span>
            <!--            <Form v-else v-slot="$form" ref="titleRef" :resolver="resolver" :initial-values="tab" :validate-on-value-update="true" :validate-on-blur="true" class="flex flex-col gap-4 w-full" @submit="onFormSubmit">-->
            <!--              <div class="flex flex-col gap-1">-->
            <!--                <InputText v-model="tab.groupName" name="groupName" type="text" placeholder="请输入名称" fluid @blur="inputBlur" />-->
            <!--                &lt;!&ndash;          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{ $form.name.error.message }} </Message>&ndash;&gt;-->
            <!--              </div>-->
            <!--            </Form>-->
            <InputText
              v-else
              :id="'layer-group-id' + tab.groupId"
              v-model="tab.groupName"
              name="name"
              :max-length="10"
              type="text"
              size="small"
              class="text-xs w-full"
              placeholder="请输入"
              fluid
              @blur="inputBlur($event, groupIndex)"
              @keydown.enter.stop="inputBlur($event, groupIndex)" />
          </span>
        </AccordionHeader>
        <AccordionContent
          class="my-custom-accordioncontent-style"
          :pt="{
            content: {style: {padding: '0rem'}},
          }">
          <div
            v-for="(component, groupChildIndex) in tab.components"
            :key="component.componentId + '_group_' + groupChildIndex"
            class="layer-card text-xs"
            :class="component.selected ? 'selected' : ''"
            @click="clickCurrentComponent(component)">
            <svg-icon :name="configComponentSvg(component)" :custom-width="0.65" class="text-xs left-svg font-semibold" />
            <span class="ml-[2px] text-xs pt-[1px] font-semibold text-left">{{
              component.componentType === EComponentType.Text ? getComponentTypeName(component.textType || '') : component.componentType === EComponentType.PageFooter ? '页码' : component.componentType
            }}</span>
            <span class="flex-1 w-0 truncate text-xs pt-[1px] text-left">{{ layerName(component) }}</span>
            <span class="ml-auto text-xs mr-2 mt-[2px]">{{ groupChildIndex + 1 }}</span>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
    <VueDraggable v-model="localComponentList" @start="onStart" @end="onEnd">
      <div v-for="(component, index) in localComponentList" :key="component.componentId + '_' + index" class="layer-card" :class="component.selected ? 'selected' : ''" @click="clickCurrentComponent(component)">
        <svg-icon :name="configComponentSvg(component)" :custom-width="1" class="left-svg font-semibold" />
        <span class="ml-[2px] text-xs pt-[1px] font-semibold text-left">{{
          component.componentType === EComponentType.Text ? getComponentTypeName(component.textType || '') : component.componentType === EComponentType.PageFooter ? '页码' : component.componentType
        }}</span>
        <span class="flex-1 w-0 truncate text-xs pt-[1px] text-left">{{ layerName(component) }}</span>
        <span class="ml-auto text-xs mr-2 mt-[2px]">{{ index + 1 }}</span>
      </div>
    </VueDraggable>
    <!--    <div v-for="(component, index) in currentComponentList" :key="component.componentId + '_' + index" class="layer-card" :class="component.selected ? 'selected' : ''" @click="clickCurrentComponent(component)">-->
    <!--      <svg-icon :name="configComponentSvg(component)" :custom-width="1" class="left-svg" />-->
    <!--      <span class="flex-1 w-0 ml-1.5 truncate text-xs pt-[1px] text-left">{{-->
    <!--        component.componentType === EComponentType.Text ? component.textType : component.componentType === EComponentType.PageFooter ? '页码' : component.componentType-->
    <!--      }}</span>-->
    <!--      <span class="ml-auto text-xs mr-2">{{ index + 1 }}</span>-->
    <!--    </div>-->
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";
.chosenClass {
  background-color: #eee;
  opacity: 1;
  border: solid 1px red;
}

.layer-card {
  @apply ml-2 h-10 text-ppt-text-light hover:text-ppt-text-dark text-ppt-text-normal cursor-pointer flex flex-row items-center;

  .left-svg {
    color: var(--color-ppt-text-normal);
    fill: var(--color-ppt-text-normal);
  }

  &:hover {
    @apply text-ppt-text-dark;

    .left-svg {
      color: var(--color-ppt-text-dark);
      fill: var(--color-ppt-text-dark);
    }
  }

  &.selected {
    @apply text-ppt-text-orange;

    .left-svg {
      color: var(--color-ppt-text-dark);
      fill: var(--color-ppt-text-dark);
    }
  }
}

.my-custom-accordionheader-style.p-accordionheader {
  padding: 4px;
}

.my-custom-accordioncontent-style.p-accordioncontent {
  padding: 0;
}
</style>
