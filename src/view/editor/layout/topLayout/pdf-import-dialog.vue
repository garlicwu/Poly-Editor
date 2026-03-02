<script setup lang="ts">
import {ref, computed, nextTick} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {getOCRService, type IOCRUploadProgress} from '@/net/ocrApi'
import {convertOCRToEditorPages, getOCRStatistics, type IPDFImportConfig} from '@/lib/pdf-import-util'
import emitter, {MittTypeEnum} from '@/lib/mitt'

const editorStore = useEditorStore()
const visible = ref(false)
const loading = ref(false)
const uploadProgress = ref(0)
const currentStep = ref<'upload' | 'config' | 'preview' | 'importing'>('upload')

// API Key 配置
const apiKey = ref('')
const rememberApiKey = ref(true)
const API_KEY_STORAGE = 'ocr_api_key'

// 上传的文件
const selectedFile = ref<File | null>(null)

// 导入配置
const importConfig = ref<IPDFImportConfig>({
  defaultFont: 'Arial',
  defaultFontSize: 12,
  defaultTextType: 'Yaber正文',
  defaultLang: 'cn',
  dpi: 254,
  autoFitPage: true,
})

// OCR 识别结果
const ocrResult = ref<any>(null)
const statistics = ref<any>(null)

// 从 localStorage 加载 API Key
const loadApiKey = () => {
  const saved = localStorage.getItem(API_KEY_STORAGE)
  if (saved) {
    apiKey.value = saved
  }
}

// 保存 API Key
const saveApiKey = () => {
  if (rememberApiKey.value && apiKey.value) {
    localStorage.setItem(API_KEY_STORAGE, apiKey.value)
  } else {
    localStorage.removeItem(API_KEY_STORAGE)
  }
}

// 打开对话框
const open = () => {
  visible.value = true
  currentStep.value = 'upload'
  selectedFile.value = null
  ocrResult.value = null
  statistics.value = null
  uploadProgress.value = 0
  loadApiKey()
}

// 关闭对话框
const close = () => {
  if (!loading.value) {
    visible.value = false
  }
}

// 文件选择处理
const onFileSelect = (event: any) => {
  const files = event.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
  }
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
}

// 上传并识别 PDF
const uploadAndRecognize = async () => {
  if (!selectedFile.value) {
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'warn',
      summary: '提示',
      detail: '请先选择 PDF 文件',
      life: 2000,
    })
    return
  }

  if (!apiKey.value.trim()) {
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'warn',
      summary: '提示',
      detail: '请输入智谱 AI API Key',
      life: 2000,
    })
    return
  }

  loading.value = true
  uploadProgress.value = 0

  try {
    saveApiKey()

    // 初始化 OCR 服务
    const ocrService = getOCRService(apiKey.value)

    // 上传并识别
    const result = await ocrService.recognizePDF(selectedFile.value, (progress: IOCRUploadProgress) => {
      uploadProgress.value = progress.percentage
    })

    ocrResult.value = result
    statistics.value = getOCRStatistics(result)

    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'success',
      summary: '成功',
      detail: `识别完成！共 ${statistics.value.totalPages} 页，${statistics.value.totalTextBlocks} 个文本块，${statistics.value.totalImageBlocks} 张图片`,
      life: 3000,
    })

    currentStep.value = 'preview'
  } catch (error: any) {
    console.error('OCR 识别失败:', error)
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'error',
      summary: '错误',
      detail: error.message || 'OCR 识别失败',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

// 导入到编辑器
const importToEditor = async () => {
  if (!ocrResult.value) return

  loading.value = true
  currentStep.value = 'importing'

  try {
    console.log('开始转换 OCR 结果')
    const pages = convertOCRToEditorPages(ocrResult.value, editorStore.editorInfo.id || 'project', importConfig.value)
    console.log('转换完成，页面数:', pages.length)

    const currentIndex = editorStore.editorInfo.pageList.findIndex((p) => p.pageId === editorStore.currentPage?.pageId)
    const insertIndex = currentIndex >= 0 ? currentIndex + 1 : editorStore.editorInfo.pageList.length

    console.log('开始插入页面，插入位置:', insertIndex)
    pages.forEach((page, index) => {
      editorStore.editorInfo.pageList.splice(insertIndex + index, 0, page)
    })

    console.log('页面插入完成，等待 DOM 更新')
    await nextTick()

    console.log('刷新配置')
    editorStore.configAllPageFooter()
    editorStore.selectCurrentPage(insertIndex + pages.length - 1)

    console.log('导入完成')
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'success',
      summary: '成功',
      detail: `成功导入 ${pages.length} 个页面`,
      life: 2000,
    })

    visible.value = false
  } catch (error: any) {
    console.error('导入失败:', error)
    emitter.emit(MittTypeEnum.Toast_Message, {
      severity: 'error',
      summary: '错误',
      detail: error.message || '导入失败',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

// 返回上传步骤
const backToUpload = () => {
  currentStep.value = 'upload'
  ocrResult.value = null
  statistics.value = null
}

defineExpose({open})
</script>

<template>
  <Dialog v-model:visible="visible" modal header="导入 PDF 文件" :style="{width: '600px'}" :closable="!loading" @hide="close">
    <!-- 上传步骤 -->
    <div v-if="currentStep === 'upload'" class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="font-semibold">智谱 AI API Key</label>
        <InputText v-model="apiKey" placeholder="请输入您的 API Key" :disabled="loading" type="password" />
        <div class="flex items-center gap-2">
          <Checkbox v-model="rememberApiKey" binary input-id="remember-api-key" />
          <label for="remember-api-key" class="text-sm">记住 API Key（保存在本地浏览器）</label>
        </div>
        <a href="https://open.bigmodel.cn/" target="_blank" class="text-sm text-primary">获取 API Key</a>
      </div>

      <Divider />

      <div class="flex flex-col gap-2">
        <label class="font-semibold">选择 PDF 文件</label>
        <FileUpload
          mode="basic"
          accept="application/pdf"
          :max-file-size="20000000"
          choose-label="选择文件"
          :auto="false"
          :disabled="loading"
          @select="onFileSelect"
          @clear="clearFile" />
        <span v-if="selectedFile" class="text-sm text-surface-600">已选择: {{ selectedFile.name }} ({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
      </div>

      <ProgressBar v-if="loading" :value="uploadProgress" class="mt-2" />
    </div>

    <!-- 预览步骤 -->
    <div v-else-if="currentStep === 'preview'" class="flex flex-col gap-4">
      <div class="surface-50 border-1 surface-border rounded-lg p-4">
        <h4 class="mt-0 mb-3">识别结果统计</h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="text-sm text-surface-600">总页数</div>
            <div class="text-2xl font-semibold">{{ statistics?.totalPages }}</div>
          </div>
          <div>
            <div class="text-sm text-surface-600">文本块数量</div>
            <div class="text-2xl font-semibold">{{ statistics?.totalTextBlocks }}</div>
          </div>
          <div>
            <div class="text-sm text-surface-600">公式数量</div>
            <div class="text-2xl font-semibold text-purple-600">{{ statistics?.totalFormulaBlocks }}</div>
          </div>
          <div>
            <div class="text-sm text-surface-600">图片数量</div>
            <div class="text-2xl font-semibold text-blue-600">{{ statistics?.totalImageBlocks }}</div>
          </div>
          <div>
            <div class="text-sm text-surface-600">总字符数</div>
            <div class="text-2xl font-semibold">{{ statistics?.totalCharacters }}</div>
          </div>
          <div>
            <div class="text-sm text-surface-600">平均每页组件</div>
            <div class="text-2xl font-semibold">{{ statistics?.averageBlocksPerPage }}</div>
          </div>
        </div>
      </div>

      <Divider />

      <div class="flex flex-col gap-3">
        <h4 class="mt-0 mb-2">导入配置</h4>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">默认字体</label>
          <InputText v-model="importConfig.defaultFont" placeholder="Arial" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">默认字号（磅）</label>
          <InputNumber v-model="importConfig.defaultFontSize" :min="6" :max="72" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">DPI</label>
          <InputNumber v-model="importConfig.dpi" :min="72" :max="600" />
        </div>
      </div>
    </div>

    <!-- 导入中 -->
    <div v-else-if="currentStep === 'importing'" class="flex flex-col gap-4 items-center py-6">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <p class="text-center">正在导入到编辑器...</p>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <Button v-if="currentStep === 'preview'" label="返回" severity="secondary" @click="backToUpload" :disabled="loading" />
        <div v-else></div>

        <div class="flex gap-2">
          <Button label="取消" severity="secondary" @click="close" :disabled="loading" />
          <Button v-if="currentStep === 'upload'" label="识别" @click="uploadAndRecognize" :loading="loading" :disabled="!selectedFile || !apiKey" />
          <Button v-else-if="currentStep === 'preview'" label="导入" @click="importToEditor" :loading="loading" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped></style>
