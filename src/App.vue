<script setup lang="ts">
import {useRoute, useRouter} from 'vue-router'
import {ToastGroupType} from '@/view/editor/utils/common-modle'
import {onMounted, onUnmounted} from 'vue'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {useToast} from 'primevue/usetoast'
import type {ToastServiceMethods} from 'primevue/toastservice'
import useWindowResizeHook from '@/hooks/useWindowResizeHook'

let toast: ToastServiceMethods

useWindowResizeHook()
const toastLifeEnd = (options: any) => {
  const message = options.message || {}
  // 移除了重定向逻辑，因为已经是独立编辑器
  console.log('toastLifeEnd', JSON.stringify(message))
}

onMounted(() => {
  toast = useToast()
  emitter.all.clear()
  emitter.on(MittTypeEnum.Toast_Message, (msg: any) => {
    console.log(msg)
    toast.add(msg)
  })
})
onUnmounted(() => {
  emitter.all.clear()
})
</script>

<template>
  <div class="w-full h-full">
    <Toast :position="'top-right'" :group="ToastGroupType.RE_LOGIN" @life-end="toastLifeEnd" />
    <Toast :position="'top-right'" :group="ToastGroupType.Save_Editor_Success" @life-end="toastLifeEnd" />
    <Toast :position="'top-right'" :group="ToastGroupType.NO_PROJECT" @life-end="toastLifeEnd" />
    <Toast :position="'top-center'" :group="ToastGroupType.TOP_CENTER" @life-end="toastLifeEnd" />
    <Toast :position="'top-right'" @life-end="toastLifeEnd" />
    <router-view />
  </div>
</template>

<style scoped></style>
