<script setup lang="ts">
import {defineAsyncComponent, shallowRef, onMounted, type PropType, watch} from 'vue'
import {pickStyle} from '@/view/editor/utils'
import {EditorComponent, editorComponentModule} from '@/view/editor/component/editorComponentInit'
import type {IComponentInfo} from '@/view/editor/utils/common-modle'

const props = defineProps({
  componentInfo: {type: Object as PropType<IComponentInfo>, required: true},
  lang: {type: String, required: true},
  isPreview: {type: Boolean, default: false},
})
const emit = defineEmits(['focus', 'blur', 'customContextmenu'])

watch(
  () => props.componentInfo?.component,
  () => {
    loaderComponent()
  },
)

const componentView = shallowRef()
onMounted(() => {
  loaderComponent()
})

async function loaderComponent() {
  try {
    if (Object.prototype.hasOwnProperty.call(editorComponentModule, props.componentInfo?.component)) {
      console.log('loaderComponent', props.componentInfo?.component)
      let realComponentName = props.componentInfo?.component
      if (props.isPreview && realComponentName === EditorComponent.Table) {
        realComponentName = EditorComponent.TableDisplay
      }
      componentView.value = defineAsyncComponent(editorComponentModule[realComponentName] ?? 'div')
    } else {
      console.log('loaderComponentNo', props.componentInfo?.component)
      componentView.value = props.componentInfo?.component
    }
  } catch (e) {
    console.error(e)
    componentView.value = props.componentInfo?.component
  }
}

function onChildFocus() {
  emit('focus', {componentId: props.componentInfo?.componentId})
}

function customContextmenu(event: any) {
  console.log('customContextmenu')
  emit('customContextmenu', event)
}
</script>

<template>
  <component
    :is="componentView"
    v-if="componentView"
    :component-info="componentInfo"
    :lang="lang"
    :style="{
      ...pickStyle(props.componentInfo?.style, false),
      width: '100%',
      height: '100%',
    }"
    @focus="onChildFocus()"
    @custom-contextmenu="customContextmenu">
  </component>
</template>

<style scoped></style>
