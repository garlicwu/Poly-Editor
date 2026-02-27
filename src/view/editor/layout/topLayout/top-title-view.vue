<script setup lang="ts">
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import SvgIcon from '@/view/common/svg-icon.vue'
import {onMounted, ref} from 'vue'
import {zodResolver} from '@primevue/forms/resolvers/zod'
import {z} from 'zod'
import {Form} from '@primevue/forms'
import {useRoute} from 'vue-router'

// Mock functions since backend is removed
const editProjectInfo = (data: any) => {
  return Promise.resolve({success: true})
}

const getProjectList = (params: any) => {
  return Promise.resolve({
    records: [{
      name: 'Poly Editor Project',
      type: '',
      banner: null,
      language: '',
      fontType: '',
      dpi: '254',
    }]
  })
}

const route = useRoute()
const projectId = route.query.projectId
const form = ref({
  name: '',
  type: '',
  banner: null as string | null,
  language: '',
  fontType: '',
  dpi: '254',
})
const store = useEditorStore()
const {editorInfo, disableEdit} = storeToRefs(store)
const canEditorName = ref(false)
const titleRef = ref()
const resolver = ref(
  zodResolver(
    z.object({
      name: z.string().min(1, {message: '请输入项目名称'}).max(50, {message: '项目名称最大为50个字符'}),
    }),
  ),
)

onMounted(() => {
  getProjectList({id: projectId}).then((res: any) => {
    form.value = res.records[0] || {}
    store.setProjectName(res.records[0].name || '')
  })
})
const editorName = (status: boolean) => {
  canEditorName.value = status
}

const onFormSubmit = ({valid}: any) => {
  if (valid) {
    editProjectInfo(form.value).then((res) => {
      editorName(false)
    })
  }
}

const inputBlur = () => {
  titleRef.value?.submit()
}
</script>

<template>
  <div class="h-full w-0 flex-1 max-w-53 pt-3.5 pb-3.5 flex flex-row pr-4 items-center content-center">
    <div class="flex-1 w-0 text-ppt-text-dark text-base font-medium">
      <div v-if="!canEditorName" class="w-full leading-4 text-wrap text-left line-clamp-2">{{ form.name || '未命名文件' }}</div>
      <Form v-else v-slot="$form" ref="titleRef" :resolver="resolver" :initial-values="form" :validate-on-value-update="true" :validate-on-blur="true" class="flex flex-col gap-4 w-full" @submit="onFormSubmit">
        <div class="flex flex-col gap-1">
          <InputText v-model="form.name" name="name" type="text" placeholder="请输入名称" fluid @blur="inputBlur" />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{ $form.name.error.message }} </Message>
        </div>
      </Form>
    </div>
    <svg-icon v-if="!disableEdit" name="ic-top-main-name-editor" class="cursor-pointer text-ppt-text-light ml-1" :custom-width="0.925" @click="editorName(true)" />
  </div>
</template>

<style scoped></style>
