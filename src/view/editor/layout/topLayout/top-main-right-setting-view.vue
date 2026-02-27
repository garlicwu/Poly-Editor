<script setup lang="ts">
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {useConfirm} from 'primevue/useconfirm'

const editor = useEditorStore()
const {disableEdit} = storeToRefs(editor)

const $emit = defineEmits(['save'])

const confirm = useConfirm()
const closePage = () => {
  if (disableEdit.value) {
    window.close()
    return
  }
  confirm.require({
    message: '需要保存修改么？',
    header: '提醒',
    icon: 'pi pi-save',
    rejectProps: {
      label: '直接关闭',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '保存',
    },
    accept: () => {
      $emit('save')
    },
    reject: () => {
      window.close()
    },
  })
}

</script>

<template>
  <div class="ml-auto flex flex-row">
    <!-- 功能按钮区域 -->
  </div>
</template>

<style scoped>
</style>
