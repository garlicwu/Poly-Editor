import {type ComputedRef, ref, type Ref} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import Area from '@/view/editor/component/area-view.vue'
import type {DragData} from '@/view/common/drager/drager'
import {type IEditorPageInfo, type IComponentInfo} from '@/view/editor/utils/common-modle'
import {deepCopy} from '@/view/editor/utils'
import {useAreaMoveStore} from '@/store/useAreaMoveStore'

export function useArea(data: ComputedRef<IEditorPageInfo | undefined>, areaRef: Ref<typeof Area>) {
  const areaSelected = ref()
  const areaMove = ref(false)

  // 编辑器鼠标按下事件
  function onEditorMouseDown(e: MouseEvent) {
    console.log('onEditorMouseDown', e)
    let flag = false
    data.value?.componentList.forEach((item: IComponentInfo) => {
      // 如果有选中的元素，取消选中
      if (item.selected) {
        item.selected = false
        flag = true
      }
    })
    // if (!flag) {
    areaRef.value?.onMouseDown(e)
    // }
  }

  function onAreaMove(areaData: DragData) {
    areaMove.value = true
    if (!data.value?.addComponentAction && data.value?.componentList) {
      for (let i = 0; i < data.value?.componentList?.length; i++) {
        const item = data.value?.componentList[i] as Required<IComponentInfo>
        // 计算旋转后的最小外接矩形
        const boundingBox = getBoundingBox(item, item.angle || 0)
        // 判断框选区域是否包含最小外接矩形
        // 更新选中状态
        const noPartContact = boundingBox.rotatedMaxX < areaData.left || areaData.top + areaData.height < boundingBox.rotatedMinY || areaData.left + areaData.width < boundingBox.rotatedMinX || areaData.top > boundingBox.rotatedMaxY
        // item.selected = areaData.left < boundingBox.rotatedMinX && areaData.left + areaData.width > boundingBox.rotatedMaxX && areaData.top < boundingBox.rotatedMinY && areaData.top + areaData.height > boundingBox.rotatedMaxY
        item.selected = !noPartContact
      }
    }
    useAreaMoveStore().setAreaMoveState(true)
  }

  // 计算旋转后的最小外接矩形
  function getBoundingBox(d: DragData, angle: number) {
    const centerX = d.left + d.width / 2
    const centerY = d.top + d.height / 2
    const corners = [
      rotateMatrix(d.left, d.top, centerX, centerY, angle),
      rotateMatrix(d.left + d.width, d.top, centerX, centerY, angle),
      rotateMatrix(d.left, d.top + d.height, centerX, centerY, angle),
      rotateMatrix(d.left + d.width, d.top + d.height, centerX, centerY, angle),
    ]

    const rotatedMinX = Math.min(...corners.map((corner) => corner[0]))
    const rotatedMaxX = Math.max(...corners.map((corner) => corner[0]))
    const rotatedMinY = Math.min(...corners.map((corner) => corner[1]))
    const rotatedMaxY = Math.max(...corners.map((corner) => corner[1]))

    return {rotatedMinX, rotatedMaxX, rotatedMinY, rotatedMaxY}
  }

  function rotateMatrix(x: number, y: number, centerX: number, centerY: number, angle: number) {
    const radian = (angle * Math.PI) / 180
    const translatedX = x - centerX
    const translatedY = y - centerY

    return [translatedX * Math.cos(radian) - translatedY * Math.sin(radian) + centerX, translatedX * Math.sin(radian) + translatedY * Math.cos(radian) + centerY]
  }

  // 松开区域选择
  function onAreaUp(areaData: DragData) {
    console.log('onAreaUp', areaData)
    if (data.value?.addComponentAction) {
      // 添加布局
      useEditorStore().addNewComponentByArea({...deepCopy(areaData)})
    } else {
      areaSelected.value = data.value?.componentList.some((item: IComponentInfo) => item.selected)
      // 如果区域有选中元素
      if (areaSelected.value) {
        setTimeout(() => {
          document.addEventListener(
            'click',
            () => {
              areaSelected.value = false
            },
            {once: true},
          )
        })
      }
    }
    setTimeout(() => {
      areaMove.value = false
      useAreaMoveStore().setAreaMoveState(false)
    }, 100)
  }

  return {
    areaSelected,
    onEditorMouseDown,
    onAreaMove,
    onAreaUp,
    areaMove,
  }
}
