import {neMutiTranslate, netCnTranslationToEn, netGenerateCombine, netGetDesignSave, netTranslateCurrenPage} from '@/net/editorNet'
import {useEditorStore} from '@/store/editorStore'
import {useEditorTranslationStore} from '@/store/editorTranslationStore'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {ToastGroupType} from '@/view/editor/utils/common-modle'
import {storeToRefs} from 'pinia'
import {cloneDeep, cloneDeepWith} from 'lodash'

export function useTranslation() {
  const editorStore = useEditorStore()
  const {editorInfo, currentPage, currentPageIndex} = storeToRefs(editorStore)
  const editorTranslationStore = useEditorTranslationStore()
  const {editorTranslationInfo, multilingualTranslationList, mainChangeBeforeTranslate, allLanguageList} = storeToRefs(editorTranslationStore)

  async function CnTranslationToEn(update: boolean) {
    editorStore.setLoading(true)
    if (editorInfo.value.hasChange) {
      editorTranslationStore.setMainChangeBeforeTranslate(true)
      await userSave(true)
    }
    editorStore.setLoading(true)
    const translateInfo = cloneDeep(editorInfo.value)
    translateInfo.pageList.forEach((page) => {
      if (page.zoomData) delete page.zoomData
      page.componentList.forEach((component) => {
        // if (component.componentType === EComponentType.Text && component.deltaOps) {
        //   component.deltaOps = resetTermDeltaOps(component.deltaOps)
        // }
        component.text = ''
      })
    })
    netCnTranslationToEn({
      ...translateInfo,
      update: mainChangeBeforeTranslate || update ? 1 : 0,
    })
      .then((res) => {
        console.log(res)
        editorTranslationStore.clearEditorInfo(true)
        editorTranslationStore.setEditorInfo(res, editorStore.currentPageIndex ?? 0, true)
        // editorTranslationStore.resizeAutoText()
        editorTranslationStore.setMainChangeBeforeTranslate(false)
      })
      .catch((e) => {
        console.error(e)
      })
      .finally(() => {
        editorStore.setLoading(false)
      })
  }

  async function translateOtherLanguage(update: boolean) {
    const needTranslationList = editorTranslationStore.selectLanguageList
    if (needTranslationList.length === 0) {
      emitter.emit(MittTypeEnum.Toast_Message, {
        severity: 'error',
        summary: '错误',
        detail: '未选择翻译语种',
        life: 1500,
      })
      return
    }
    if (editorInfo.value.hasChange) {
      editorTranslationStore.setMainChangeBeforeTranslate(true)
      await userSave(true)
    }
    editorStore.setLoading(true)
    const translateInfo = cloneDeep(editorInfo.value)
    translateInfo.pageList.forEach((page) => {
      if (page.zoomData) delete page.zoomData
      page.componentList.forEach((component) => {
        // if (component.componentType === EComponentType.Text && component.deltaOps) {
        //   component.deltaOps = resetTermDeltaOps(component.deltaOps)
        // }
        component.text = ''
      })
    })
    neMutiTranslate({
      ...translateInfo,
      targetLanguageCode: needTranslationList,
      update: update ? 1 : 0,
    })
      .then((res: any) => {
        console.log(res)
        editorTranslationStore.setMultilingualTranslationList(res)
        // editorTranslationStore.resizeAutoText()
        editorTranslationStore.setMainChangeBeforeTranslate(false)
      })
      .catch((e) => {
        emitter.emit(MittTypeEnum.CLEAR_TRANSLATE_SELECT_LIST)
        console.error(e)
      })
      .finally(() => {
        editorStore.setLoading(false)
      })
  }

  async function translateUpdate() {
    // 强制更新
    if (editorTranslationStore.multilingualTranslationList.length > 0) {
      await translateOtherLanguage(true)
    } else {
      await CnTranslationToEn(true)
    }
  }

  async function userSave(justMain: boolean = false, closePage: boolean = false, userDo: boolean = false) {
    editorStore.setLoading(true)

    // const netList = []
    // const langList: string[] = []
    // if (editorInfo.value.hasChange) {
    const saveList = cloneDeep(editorInfo.value)
    // 去除术语标识
    saveList.pageList.forEach((page) => {
      if (page.zoomData) delete page.zoomData
      page.componentList.forEach((component) => {
        // if (component.componentType === EComponentType.Text && component.deltaOps) {
        //   component.deltaOps = resetTermDeltaOps(component.deltaOps)
        // }
        component.text = ''
      })
    })
    const mainRes = await netGetDesignSave(saveList)
    if (mainRes) {
      const detail = justMain ? '版本自动保存成功' : '版本保存成功'
      // showSaveToast(detail)
      editorStore.saveSuccess()
    }
    // netList.push(netGetDesignSave(saveList))
    // langList.push('main')d
    // }

    if (!justMain) {
      if (editorTranslationInfo.value.id !== '') {
        if (multilingualTranslationList.value.length === 0 && editorTranslationInfo.value.hasChange) {
          const enTranslationRes = await netGetDesignSave(JSON.parse(JSON.stringify(editorTranslationInfo.value)))
          if (enTranslationRes) {
            // showSaveToast('翻译版本保存成功')
            editorTranslationStore.saveSuccess(editorTranslationInfo.value?.translationType ?? 'en', true)
          }
          // netList.push(netGetDesignSave(JSON.parse(JSON.stringify(editorTranslationInfo.value))))
          // langList.push(`single-${editorTranslationInfo.value.translationType}`)
        } else {
          for (const item of multilingualTranslationList.value) {
            if (item.hasChange) {
              const multiTranslationRes = await netGetDesignSave(JSON.parse(JSON.stringify(item)))
              if (multiTranslationRes) {
                const findName = allLanguageList.value.find((l) => l.code === item.translationType)?.name || '小语种'
                // showSaveToast(`${findName}保存成功`)
                editorTranslationStore.saveSuccess(item.translationType ?? '', true)
              }
              // netList.push(netGetDesignSave(JSON.parse(JSON.stringify(item))))
              // langList.push(`multi-${item.translationType}`)
            }
          }
          if (userDo && multilingualTranslationList.value.length > 0) {
            const netGenerateCombineRes = await netGenerateCombine(editorStore.projectInfo?.id)
          }
        }
      }
    }

    // if (netList.length === 0) {
    //   toast.add({severity: 'info', summary: '提示', detail: '尚未有内容修改，无需保存', life: 2000})
    // }
    editorStore.setLoading(false)
    if (mainRes) {
      showSaveToast(justMain ? '自动保存成功' : '保存成功')
    }
    if (closePage) {
      window.close()
    }
    // await Promise.allSettled(netList)
    //   .then((resultList: any[]) => {
    //     resultList.forEach((item, index) => {
    //       console.log('netSave', item)
    //       editorStore.setLoading(false)
    //       if (item.status === 'fulfilled' && item.value) {
    //         const lang = langList[index]
    //         let detail = '成功'
    //         if (lang === 'main') {
    //           detail = justMain ? '版本自动保存成功' : '版本保存成功'
    //           editorStore.saveSuccess()
    //         } else if (lang.startsWith('single')) {
    //           detail = '翻译版本保存成功'
    //           editorTranslationStore.saveSuccess(lang.split('-')[1], true)
    //         } else if (lang.startsWith('multi')) {
    //           detail = '小语种保存成功'
    //           editorTranslationStore.saveSuccess(lang.split('-')[1])
    //         }
    //         emitter.emit(MittTypeEnum.Toast_Message, {
    //           group: ToastGroupType.Save_Editor_Success,
    //           severity: 'success',
    //           summary: '成功',
    //           detail: detail,
    //           life: 1500,
    //         })
    //       }
    //       // editorEnStore.clearEditorInfo()
    //     })
    //   })
    //   .finally(() => {
    //     editorStore.setLoading(false)
    //     if (closePage) {
    //       window.close()
    //     }
    //   })
  }

  async function userAutoSave(justMain: boolean = false) {
    console.log('userAutoSave', new Date().getTime())
    const saveList = cloneDeep(editorInfo.value)
    // 去除术语标识
    saveList.pageList.forEach((page) => {
      if (page.zoomData) delete page.zoomData
      page.componentList.forEach((component) => {
        component.text = ''
      })
    })
    const mainRes = await netGetDesignSave(saveList)
    if (mainRes) {
      editorStore.saveSuccess()
      showSaveToast('自动保存成功')
    }
    if (!justMain) {
      if (editorTranslationInfo.value.id !== '') {
        if (multilingualTranslationList.value.length === 0 && editorTranslationInfo.value.hasChange) {
          const enTranslationRes = await netGetDesignSave(JSON.parse(JSON.stringify(editorTranslationInfo.value)))
          if (enTranslationRes) {
            editorTranslationStore.saveSuccess(editorTranslationInfo.value?.translationType ?? 'en', true)
          }
        } else {
          for (const item of multilingualTranslationList.value) {
            if (item.hasChange) {
              const multiTranslationRes = await netGetDesignSave(JSON.parse(JSON.stringify(item)))
              if (multiTranslationRes) {
                const findName = allLanguageList.value.find((l) => l.code === item.translationType)?.name || '小语种'
                editorTranslationStore.saveSuccess(item.translationType ?? '', true)
              }
            }
          }
          if (multilingualTranslationList.value.length > 0) {
            await netGenerateCombine(editorStore.projectInfo?.id)
          }
        }
      }
    }
  }

  function translateCurrentPage() {
    editorStore.setLoadingText('翻译当页中')
    editorStore.setLoading(true)
    const translateParams = cloneDeepWith(editorInfo.value, (value: any, key: any) => {
      if (key === 'pageList') {
        return []
      }
    })
    delete translateParams.pageList

    translateParams.page = cloneDeepWith(currentPage.value, (value: any, key: any) => {
      if (key === 'componentList') {
        value.forEach((component: any) => {
          component.text = ''
        })
        return value
      }
    })
    translateParams.page.index = currentPageIndex.value
    if (translateParams.page.zoomData) delete translateParams.page.zoomData
    translateParams.targetLanguageCode = [editorTranslationInfo.value.translationType]
    netTranslateCurrenPage(translateParams)
      .then((response) => {
        if (response) {
          editorTranslationStore.translateCurrentPage(response, currentPageIndex.value, editorTranslationInfo.value.translationType)
        }
      })
      .finally(() => {
        editorStore.setLoading(false)
      })
  }

  function showSaveToast(detail: string) {
    emitter.emit(MittTypeEnum.Toast_Message, {
      group: ToastGroupType.Save_Editor_Success,
      severity: 'success',
      summary: '成功',
      detail: detail,
      life: 1500,
    })
  }

  return {CnTranslationToEn, translateOtherLanguage, translateUpdate, userSave, translateCurrentPage, userAutoSave}
}
