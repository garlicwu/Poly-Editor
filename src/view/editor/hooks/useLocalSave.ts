import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'
import {cloneDeep} from 'lodash'
import {LStorage} from '@/lib/storage'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {ToastGroupType} from '@/view/editor/utils/common-modle'

export function useLocalSave() {
  const editorStore = useEditorStore()
  const {editorInfo} = storeToRefs(editorStore)

  // 保存到本地存储
  async function saveToLocal() {
    try {
      const saveData = cloneDeep(editorInfo.value)

      // 清理不需要保存的数据
      saveData.pageList.forEach((page) => {
        if (page.zoomData) delete page.zoomData
        page.componentList.forEach((component) => {
          component.text = ''
        })
      })

      // 保存到 localStorage
      LStorage.set('editor-data', JSON.stringify(saveData))

      editorStore.saveSuccess()

      emitter.emit(MittTypeEnum.Toast_Message, {
        group: ToastGroupType.SAVE_SUCCESS,
        severity: 'success',
        summary: '成功',
        detail: '数据已保存到本地',
        life: 2000,
      })

      return true
    } catch (e) {
      console.error('保存失败:', e)
      emitter.emit(MittTypeEnum.Toast_Message, {
        group: ToastGroupType.SAVE_ERROR,
        severity: 'error',
        summary: '错误',
        detail: '保存失败',
        life: 2000,
      })
      return false
    }
  }

  // 导出数据（弹出对话框展示）
  function exportDataToDialog() {
    const saveData = cloneDeep(editorInfo.value)

    // 清理不需要的数据
    saveData.pageList.forEach((page) => {
      if (page.zoomData) delete page.zoomData
    })

    const dataStr = JSON.stringify(saveData, null, 2)
    emitter.emit(MittTypeEnum.Show_Export_Dialog, dataStr)
  }

  // 下载为 JSON 文件
  function downloadAsJson() {
    const saveData = cloneDeep(editorInfo.value)

    saveData.pageList.forEach((page) => {
      if (page.zoomData) delete page.zoomData
    })

    const dataStr = JSON.stringify(saveData, null, 2)
    const blob = new Blob([dataStr], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `editor-data-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    emitter.emit(MittTypeEnum.Toast_Message, {
      group: ToastGroupType.EXPORT_SUCCESS,
      severity: 'success',
      summary: '成功',
      detail: '数据已导出',
      life: 2000,
    })
  }

  return {
    saveToLocal,
    exportDataToDialog,
    downloadAsJson,
  }
}
