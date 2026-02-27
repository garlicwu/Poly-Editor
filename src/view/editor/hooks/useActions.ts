import {cancelGroup, deepCopy, makeGroup} from '../utils'
import {computed, type ComputedRef, onMounted, onUnmounted, ref, type Ref} from 'vue'
import type {ActionType, MenuItem} from '@/view/editor/component/common/contextmenu'
import {$contextmenu} from '@/view/editor/component/common/contextmenu'
import {EComponentType, type IComponentInfo, type IEditorPageInfo, ToastGroupType} from '@/view/editor/utils/common-modle'
import type {SketchRulerProps} from '@/view/common/sketch-ruler'
import {getGlobalCopySnapshot, setGlobalCopySnapshot} from '@/lib/storage'
import {useQuillTextOnFocusStore} from '@/store/useQuillTextOnFocusStore'
import {storeToRefs} from 'pinia'
import emitter, {MittTypeEnum} from '@/lib/mitt'
import {cloneDeep} from 'lodash'
import {useClipboard} from '@vueuse/core'
import {EditorComponent} from '@/view/editor/component/editorComponentInit'
import {TableActionType, useTableStateStore} from '@/store/useTableStateStore'

type ActionMethods = {
  [key in ActionType]?: (element: IComponentInfo, ...args: any[]) => void
}
// 键盘映射表
const keyboardMap = {
  ['ctrl+x']: 'cut',
  ['ctrl+c']: 'copy',
  ['ctrl+v']: 'paste',
  ['Delete']: 'remove',
  ['ctrl+a']: 'selectAll',
  ['ctrl+d']: 'duplicate',
  ['ctrl+z']: 'undo',
  ['ctrl+y']: 'redo',
  ['ctrl+shift+E']: 'switchMarkLine',
  ['ctrl+shift+Y']: 'deleteAllMarkLine',
  ['ctrl+shift+U']: 'deleteAllPageMarkLine',
}

type EventHandler = (data: any) => void

export function useActions(data: ComputedRef<IEditorPageInfo | undefined>, editorRef: Ref<HTMLElement | null>, post: ComputedRef<SketchRulerProps>) {
  const editorRect = computed(() => {
    return editorRef.value?.getBoundingClientRect() || ({} as DOMRect)
  })

  const {text, copy, copied, isSupported} = useClipboard({read: true, legacy: true, copiedDuring: 200})
  const copyTextIsImage = ref(false)
  const useQuillTextOnFocus = useQuillTextOnFocusStore()
  const {textOnFocusState, hasTerm, range, focusInfo} = storeToRefs(useQuillTextOnFocus)
  const tableState = useTableStateStore()

  const eventHandlers = new Map<string, EventHandler[]>()
  // 当前右键元素
  let currentMenudownElement: IComponentInfo | null = null
  const mouseEventClientInfo = ref<Record<any, any>>({clientX: 0, clientY: 0})

  const copyCacheInfo = ref<string>('')
  // 获取指定元素的索引
  const getIndex = (element: IComponentInfo | null) => {
    if (!element) return -1
    return data.value?.componentList.findIndex((item) => item.componentId === element.componentId)
  }

  // 交换两个元素
  const swap = (i: number, j: number) => {
    if (data.value && data.value.componentList && data.value.componentList.length > 0) {
      // const iComponent = cloneDeep(data.value?.componentList[j])
      // const jComponent = cloneDeep(data.value?.componentList[i])
      // data.value.componentList[i] = iComponent
      // data.value.componentList[j] = jComponent
      emit('swapElement', {i, j})
      // ;[data.value.componentList[i], data.value.componentList[j]] = [data.value.componentList[j], data.value.componentList[i]]
    }
  }

  // 添加元素
  const addElement = (element: IComponentInfo | null) => {
    if (!element) return
    // 拷贝一份
    const newElement = cloneDeep(element)
    // 修改id
    // data.value?.componentList.push(newElement)
    emit('addElement', {component: newElement})
  }
  const actions: ActionMethods = {
    remove() {
      // 删除
      // const index = getIndex(currentMenudownElement)
      // if (index > -1) data.value.componentList.splice(index, 1)
      const removeElements = data.value?.componentList.filter((item) => item.selected) || []
      if (removeElements.length > 1) {
        emit('removeElementWithGroup', {components: removeElements})
      } else if (currentMenudownElement) {
        emit('removeElement', {component: currentMenudownElement})
        // editorStore.deleteComponent(currentMenudownElement)
      }
    },
    cut(element) {
      // 剪切
      // if (currentMenudownElement) {
      //   emit('removeElement', {component: element, noConfirm: true})
      //   // editorStore.deleteComponent(currentMenudownElement)
      // }
      const removeElements = data.value?.componentList.filter((item) => item.selected) || []
      if (removeElements.length > 1) {
        emit('removeElementWithGroup', {components: removeElements, noConfirm: true})
      } else if (currentMenudownElement) {
        emit('removeElement', {component: currentMenudownElement, noConfirm: true})
        // editorStore.deleteComponent(currentMenudownElement)
      }
      const copyElements = (data.value?.componentList.filter((item) => item.selected) || []).map((item) => {
        return {...item, text: '', semanticHTML: ''}
      })
      if (copyElements.length === 0) {
        return
      }
      copyCacheInfo.value = JSON.stringify(copyElements)
      setGlobalCopySnapshot(JSON.stringify(copyElements))
      emitter.emit(MittTypeEnum.Toast_Message, {
        severity: 'success',
        summary: '成功',
        detail: `剪切${copyElements.length > 1 ? '多组件' : ''}成功`,
        life: 1000,
        group: ToastGroupType.TOP_CENTER,
      })
    },
    copy(element) {
      // 拷贝
      if (textOnFocusState.value.componentId && textOnFocusState.value.componentId !== '') {
        return
      }
      const copyElements = (data.value?.componentList.filter((item) => item.selected) || []).map((item) => {
        return {...item, text: '', semanticHTML: ''}
      })
      if (copyElements.length === 0) {
        return
      }
      copy('').then()
      copyCacheInfo.value = JSON.stringify(copyElements)
      setGlobalCopySnapshot(JSON.stringify(copyElements))
      emitter.emit(MittTypeEnum.Toast_Message, {
        severity: 'success',
        summary: '成功',
        detail: `复制${copyElements.length > 1 ? '多组件' : ''}成功`,
        life: 1000,
        group: ToastGroupType.TOP_CENTER,
      })
    },
    duplicate(element) {
      // 创建副本
      const newElement = deepCopy(element)
      // 偏移left和top避免重叠
      newElement.left += 20
      newElement.top += 20
      addElement(newElement)
    },
    top(element) {
      // 获取当前元素索引
      const index = getIndex(element) ?? -1
      if (index > -1) {
        // todo 将该索引的元素删除
        // const [topElement] = data.value?.componentList.splice(index, 1) ?? []
        // // 添加到末尾
        // data.value?.componentList!.push(topElement)
        emit('topElement', {index: index})
      }
    },
    bottom(element) {
      // 获取当前元素索引
      const index = getIndex(element) ?? -1
      // 将该索引的元素删除
      if (index > -1) {
        // const [topElement] = data.value?.componentList.splice(index, 1) ?? []
        // 添加到开头
        // data.value?.componentList.unshift(topElement)
        emit('bottomElement', {index: index})
      }
    },
    group() {
      // 组合
      if (data.value) {
        data.value.componentList = makeGroup(data.value?.componentList, editorRect.value)
      }
    },
    ungroup() {
      // 拆分
      if (data.value) {
        data.value.componentList = cancelGroup(data.value.componentList, editorRect.value)
      }
    },
    async paste(_, clientX: number, clientY: number) {
      // 粘贴
      const copyTextIsImage = await textUrlIsImage()
      if (copyTextIsImage) {
        console.log('copyTextIsImage', copyTextIsImage)
        if (!clientX) clientX = mouseEventClientInfo.value.clientX
        if (!clientY) clientY = mouseEventClientInfo.value.clientY
        let left = clientX
        let top = clientY
        let width = 300
        let height = 300
        try {
          const searchParams = new URLSearchParams(decodeURIComponent(copyTextIsImage.toString()))
          searchParams.forEach((value, key) => {
            console.log(`${key}: ${value}`)
            if (key === 'width' || key === 'w') {
              width = parseInt(value ?? 300)
            }
            if (key === 'height' || key === 'h') {
              height = parseInt(value ?? 300)
            }
          })
        } catch (e) {
          console.log('error', e)
        }
        // if (clientX < editorRect.value!.left || clientX > editorRect.value!.left + editorRect.value!.width) {
        left = editorRect.value!.width / 2 / post.value.scale! - width / 2
        // } else {
        //   left = (clientX - editorRect.value!.left) / post.value.scale!
        // }

        // if (clientY < editorRect.value!.top || clientY > editorRect.value!.top + editorRect.value!.height) {
        top = editorRect.value!.height / 2 / post.value.scale! - height / 2
        // } else {
        //   top = (clientY - editorRect.value!.top) / post.value.scale!
        // }
        mouseEventClientInfo.value = {clientX: 0, clientY: 0}
        addElement({
          left,
          top,
          width,
          height,
          componentType: EComponentType.Image,
          component: EditorComponent.IMAGE,
          imageSrc: copyTextIsImage.toString(),
        } as IComponentInfo)
        return
      }
      let copySnapshot = []
      try {
        let copySnapshotString = getGlobalCopySnapshot()
        if (!copySnapshotString || copySnapshotString === '') {
          copySnapshotString = copyCacheInfo.value
        }
        if (copySnapshotString && copySnapshotString.startsWith('[')) {
          copySnapshot = JSON.parse(copySnapshotString)
        }
      } catch (e) {
        console.error(e)
      }

      if (!copySnapshot || copySnapshot.length === 0) {
        return
      }
      if (copySnapshot.length === 1) {
        const element = deepCopy(copySnapshot[0])
        // 计算粘贴位置
        if (clientX && clientY) {
          if (clientX < editorRect.value!.left || clientX > editorRect.value!.left + editorRect.value!.width) {
            element.left = editorRect.value!.width / 2 / post.value.scale! - element.width / 2
          } else {
            element.left = (clientX - editorRect.value!.left) / post.value.scale!
          }

          if (clientY < editorRect.value!.top || clientY > editorRect.value!.top + editorRect.value!.height) {
            element.top = editorRect.value!.height / 2 / post.value.scale! - element.height / 2
          } else {
            element.top = (clientY - editorRect.value!.top) / post.value.scale!
          }
        }
        // if (!clientX) clientX = mouseEventClientInfo.value.clientX
        // if (!clientY) clientY = mouseEventClientInfo.value.clientY

        mouseEventClientInfo.value = {clientX: 0, clientY: 0}
        addElement(element)
      } else {
        emit('addElementWithGroup', {components: copySnapshot})
      }
    },
    selectAll() {
      // 全选
      if (textOnFocusState.value.componentId && textOnFocusState.value.componentId !== '') {
        return
      }
      data.value!.componentList.forEach((item) => {
        if (item.componentType !== EComponentType.PageFooter) item.selected = true
      })
    },
    lock(element) {
      // 锁定/解锁
      const index = getIndex(element) ?? -1
      if (index > -1) {
        data.value!.componentList[index]!.disabled = !data.value!.componentList[index].disabled
      }
    },
    moveUp(element) {
      // 上移
      // 获取当前元素索引
      const index = getIndex(element) ?? -1
      // 不能超过边界
      if (index <= 0) {
        return
      }

      swap(index, index - 1)
    },
    moveDown(element) {
      // 下移
      // 获取当前元素索引
      const index = getIndex(element) ?? -1
      // 不能超过边界
      if (index >= data.value!.componentList.length - 1) {
        return
      }

      swap(index, index + 1)
    },
    imgReplaceAll(element) {
      console.log('imgReplaceAll')
      setShowPicReplaceAllDialog(true)
      emit('imgReplaceAll', element)
    },
    alignLeft(element) {
      emit('alignLeft', element)
    },
    alignCenter(element) {
      emit('alignCenter', element)
    },
    alignRight(element) {
      emit('alignRight', element)
    },
    alignVerticalCenter(element) {
      emit('alignVerticalCenter', element)
    },
    alignCanvasLeft(element) {
      emit('alignCanvasLeft', element)
    },
    alignCanvasRight(element) {
      emit('alignCanvasRight', element)
    },
    appliedToAll(element) {
      emit('appliedToAll', element)
    },
    undo(data: any) {
      emit('undo', data)
    },
    redo(data: any) {
      emit('redo', data)
    },
    switchMarkLine(data: any) {
      emit('switchMarkLine', data)
    },
    cancelTerm(data: any) {
      emit('cancelTerm', {componentId: data.componentId, ...focusInfo.value})
    },
    deleteAllMarkLine(data: any) {
      emit('deleteAllMarkLine', data)
    },
    deleteAllPageMarkLine(data: any) {
      emit('deleteAllPageMarkLine', data)
    },
    verticalIsometric() {
      emit('verticalIsometric', '')
    },
    horizontalIsometric() {
      emit('horizontalIsometric', '')
    },
    editGroup() {
      emit('editGroup', '')
    },
    editUngroup() {
      emit('editUngroup', '')
    },
    tableMerge(data: any) {
      tableState.tableActionValue(data.componentId, TableActionType.tableMerge)
    },
    tableUnMerge(data: any) {
      tableState.tableActionValue(data.componentId, TableActionType.tableUnMerge)
    },
    tableAddRow(data: any) {
      tableState.tableActionValue(data.componentId, TableActionType.tableAddRow)
    },
    tableDelRow(data: any) {
      tableState.tableActionValue(data.componentId, TableActionType.tableDelRow)
    },
    tableDelCol(data: any) {
      tableState.tableActionValue(data.componentId, TableActionType.tableDelCol)
    },
    tableAddCol(data: any) {
      tableState.tableActionValue(data.componentId, TableActionType.tableAddCol)
    },
    tableCellSize(data: any) {
      tableState.tableActionValue(data.componentId, TableActionType.tableCellSize)
    },
  }

  const textUrlIsImage = () => {
    return new Promise((resolve, reject) => {
      try {
        navigator.clipboard
          .readText()
          .then((copyText) => {
            console.log('copyTextIsImage', copyText)
            if (copyText && copyText !== '' && (copyText.startsWith('http') || copyText.includes('base64,'))) {
              // const ImgObj = new Image() //判断图片是否存在
              // ImgObj.src = copyText
              // ImgObj.onload = function (res) {
              //   copyTextIsImage.value = true
              resolve(copyText)
              // }
              // ImgObj.onerror = function (res) {
              //   resolve(false)
              // }
            } else {
              resolve(false)
            }
          })
          .catch((e) => {
            console.error(e)
            resolve(false)
          })
      } catch (e) {
        console.error(e)
        resolve(false)
      }
    })
  }
  // 元素右键菜单
  const onContextmenu = (e: MouseEvent, item: IComponentInfo) => {
    e.preventDefault()
    const {clientX, clientY} = e
    currentMenudownElement = deepCopy(item)

    const selectedComponentList = data.value?.componentList.filter((item) => item.selected) ?? []
    const actionItems: MenuItem[] = [
      // {action: 'selectLayer', label: '选择图层', bottomLine: true},
      {action: 'bottom', label: '置顶'},
      {action: 'top', label: '置底'},
      {action: 'moveDown', label: '上移一层'},
      {action: 'moveUp', label: '下移一层', bottomLine: true},
      {action: 'remove', label: '删除'},
      {action: 'copy', label: '复制', notice: '需开启浏览器权限，默认开启'},
      {action: 'cut', label: '剪切', bottomLine: false},
      {action: 'appliedToAll', label: '应用到全部页面', bottomLine: true},
      // {action: 'duplicate', label: '创建副本'},
      // {action: 'imgReplace', label: '图片替换'},
    ]
    if (selectedComponentList.length > 1) {
      actionItems.push({action: 'alignLeft', label: '左对齐', bottomLine: false})
      actionItems.push({action: 'alignCenter', label: '居中水平对齐', bottomLine: false})
      actionItems.push({action: 'alignVerticalCenter', label: '居中垂直对齐', bottomLine: false})
      actionItems.push({action: 'alignRight', label: '右对齐', bottomLine: true})
      actionItems.push({action: 'alignCanvasLeft', label: '画布左对齐', bottomLine: false})
      actionItems.push({action: 'alignCanvasRight', label: '画布右对齐', bottomLine: true})
      if (selectedComponentList.length > 2) {
        actionItems.push({action: 'verticalIsometric', label: '垂直等距', bottomLine: false})
        actionItems.push({action: 'horizontalIsometric', label: '水平等距', bottomLine: true})
      }
    } else {
      actionItems.push({action: 'alignCanvasLeft', label: '画布左对齐', bottomLine: false})
      actionItems.push({action: 'alignCanvasRight', label: '画布右对齐', bottomLine: true})
    }

    if (!item.groupId && selectedComponentList.length > 1) {
      // 如果不是组合元素并且有多个选中元素，则显示组合操作
      actionItems.push({action: 'editGroup', label: '编辑组合', bottomLine: true})
    } else {
      // 显示取消组合操作
      if (item.groupId) {
        actionItems.push({action: 'editUngroup', label: '取消组合', bottomLine: true})
      }
    }
    if (item.componentType === EComponentType.Table) {
      if (tableState.checkCanMergeCells()) {
        actionItems.push({action: 'tableMerge', label: '合并单元格', bottomLine: false})
      }
      if (tableState.findMergedCellAtSelection() > -1) {
        actionItems.push({action: 'tableUnMerge', label: '拆分单元格', bottomLine: false})
      }

      actionItems.push({action: 'tableAddCol', label: '新增列', bottomLine: false})
      if (tableState.canDelCol) {
        actionItems.push({action: 'tableDelCol', label: '删除列', bottomLine: false})
      }
      actionItems.push({action: 'tableAddRow', label: '新增行', bottomLine: false})
      if (tableState.canDelRow) {
        actionItems.push({action: 'tableDelRow', label: '删除行', bottomLine: false})
      }
      actionItems.push({action: 'tableCellSize', label: '设置列宽/行高', bottomLine: true})
    }
    // if (!item.group && selectedComponentList.length > 1) {
    //   // 如果不是组合元素并且有多个选中元素，则显示组合操作
    //   actionItems.push({action: 'group', label: '组合'})
    // } else {
    //   // 显示取消组合操作
    //   if (item.group) {
    //     actionItems.push({action: 'ungroup', label: '打散'})
    //   }
    // }

    const isLocked = currentMenudownElement!.disabled
    const lockAction: MenuItem = {action: 'lock', label: '锁定 / 解锁'}
    if (!isLocked) {
      actionItems.push(lockAction)
    }
    $contextmenu({
      clientX,
      clientY,
      items: !isLocked ? actionItems : [lockAction], // 如果是锁定元素只显示解锁操作
      onClick: ({action}) => {
        if (actions[action]) {
          actions[action]!(currentMenudownElement!)
        }
      },
    })
  }

  // 画布右键菜单
  const onEditorContextMenu = (e: MouseEvent) => {
    const {clientX, clientY} = e
    let copySnapshot = null
    try {
      const copySnapshotString = getGlobalCopySnapshot()
      if (copySnapshotString && copySnapshotString.startsWith('{')) {
        copySnapshot = JSON.parse(copySnapshotString)
      }
    } catch (e) {
      console.error(e)
    }

    if (!copySnapshot) {
      e.stopPropagation()
    } else {
      const items: any[] = [
        {action: 'paste', label: '在这粘贴'},
        // {action: 'selectAll', label: '全选'},
      ]
      e.preventDefault()
      $contextmenu({
        clientX,
        clientY,
        items: items,
        onClick({action}) {
          if (action === 'paste') {
            actions.paste!(currentMenudownElement!, clientX, clientY, true)
          } else {
            if (actions[action]) {
              actions[action]!(currentMenudownElement!)
            }
          }
        },
      })
    }
  }
  // 画布点击获取鼠标位置
  const onEditorContextClick = (e: MouseEvent) => {
    const {clientX, clientY} = e
    mouseEventClientInfo.value.clientX = clientX
    mouseEventClientInfo.value.clientY = clientY
  }

  // 检查当前是否有表单元素聚焦
  const isCheckFocus = () => {
    const activeElement = document.activeElement || {tagName: ''}
    return activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'
  }

  // 监听键盘事件
  const onKeydown = (e: KeyboardEvent) => {
    const {ctrlKey, key, shiftKey, altKey} = e
    // 拼凑按下的键
    const keyArr = []
    if (ctrlKey) keyArr.push('ctrl')
    if (shiftKey) keyArr.push('shift')
    keyArr.push(key)
    const keyStr = keyArr.join('+')
    // ctrl+z 光标在情况，走文字内部逻辑
    if (['ctrl+v', 'ctrl+c', 'ctrl+a'].includes(keyStr) && textOnFocusState.value.componentId && textOnFocusState.value.componentId !== '') {
      return
    }
    // 获取操作
    const action = (keyboardMap as any)[keyStr]! as ActionType
    // 如果actions中有具体的操作则执行
    if (actions[action]) {
      // 检查当前是否有表单元素聚焦,没有聚焦状态才执行自定义事件
      if (!isCheckFocus()) {
        e.preventDefault()
        // 找到当前选中的元素
        currentMenudownElement = data.value!.componentList.find((item) => item.selected) || null
        actions[action]!(currentMenudownElement!)
      }
    }
  }

  const onEvent = (event: string, handler: EventHandler) => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, [])
    }
    eventHandlers.get(event)?.push(handler)
  }

  const offEvent = (event: string, handler?: EventHandler) => {
    if (!handler) {
      eventHandlers.delete(event)
      return
    }

    const handlers = eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  const emit = (event: string, data: any) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    eventHandlers?.clear()
    window.removeEventListener('keydown', onKeydown)
  })

  return {
    editorRect,
    onContextmenu,
    onEditorContextMenu,
    onEditorContextClick,
    onEvent,
    emit,
  }
}
