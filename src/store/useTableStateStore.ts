import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import type {MergedCellInfo} from '@/view/editor/component/table/grid-table-util'

export enum TableActionType {
  'tableMerge',
  'tableUnMerge',
  'tableAddCol',
  'tableAddRow',
  'tableDelCol',
  'tableDelRow',
  'tableCellWidth',
  'tableCellHeight',
  'tableCellSize',
}

export interface TableUserAction {
  componentId: string | undefined | number
  type: TableActionType
}

export const useTableStateStore = defineStore('useTableStateStore', () => {
  const _tableInfo = ref<Record<string, any>>({
    componentId: '',
    cols: [],
    rowData: [],
    selectedRange: {},
    mergedCells: {},
    customColumnWidth: undefined,
    customColumnHeight: undefined,
  })

  const _tableChangeAction = ref<TableUserAction>()

  const tableChangeAction = computed(() => ({
    ..._tableChangeAction.value,
  }))

  function setTableInfo(info: {
    componentId: string | undefined | number
    cols: string[]
    rowData: any[]
    selectedRange: Record<string, any>
    mergedCells: MergedCellInfo[]
    customColumnWidth: undefined | number
    customColumnHeight: undefined | number
  }) {
    _tableInfo.value = info
  }

  const checkCanMergeCells = () => {
    let canMergeCells = true
    const selectedRange: Record<string, any> = _tableInfo.value.selectedRange || {}
    const mergedCells: MergedCellInfo[] = _tableInfo.value.mergedCells || []
    const cols: any[] = _tableInfo.value.cols || []

    if (selectedRange.startRow === -1 || !selectedRange.startCol) {
      return false
    }

    const startColIdx = cols.indexOf(selectedRange.startCol)
    const endColIdx = cols.indexOf(selectedRange.endCol)
    // 检查是否有冲突的合并单元格
    for (const merged of mergedCells) {
      const mergedStartColIdx = cols.indexOf(merged.colStart)
      const mergedEndColIdx = cols.indexOf(merged.colEnd)
      // 检查是否与现有合并单元格重叠（使用列索引比较）
      if (selectedRange.startRow <= merged.rowEnd && selectedRange.endRow >= merged.rowStart && startColIdx <= mergedEndColIdx && endColIdx >= mergedStartColIdx) {
        canMergeCells = false
      }
    }

    return canMergeCells
  }

  const findMergedCellAtSelection = () => {
    const selectedRange: Record<string, any> = _tableInfo.value.selectedRange
    const mergedCells: MergedCellInfo[] = _tableInfo.value.mergedCells || []
    const cols: any[] = _tableInfo.value.cols
    for (let i = mergedCells.length - 1; i >= 0; i--) {
      const merged = mergedCells[i]
      // 检查选中区域是否与合并区域有交集
      if (selectedRange.startRow <= merged.rowEnd && selectedRange.endRow >= merged.rowStart) {
        const selStartColIdx = cols.indexOf(selectedRange.startCol)
        const selEndColIdx = cols.indexOf(selectedRange.endCol)
        const mergedStartColIdx = cols.indexOf(merged.colStart)
        const mergedEndColIdx = cols.indexOf(merged.colEnd)

        if (selStartColIdx <= mergedEndColIdx && selEndColIdx >= mergedStartColIdx) {
          return i
        }
      }
    }
    return -1
  }

  const canDelRow = computed(() => {
    return _tableInfo.value.rowData.length > 1
  })

  const canDelCol = computed(() => {
    return _tableInfo.value.cols.length > 1
  })

  const tableCellHeight = computed(() => {
    return _tableInfo.value.customColumnHeight
  })
  const tableCellWidth = computed(() => {
    return _tableInfo.value.customColumnWidth
  })

  function tableActionValue(componentId: string | undefined | number, key: TableActionType) {
    _tableChangeAction.value = {componentId: componentId, type: key}
  }

  return {
    setTableInfo,
    checkCanMergeCells,
    findMergedCellAtSelection,
    tableChangeAction,
    canDelCol,
    canDelRow,
    tableCellHeight,
    tableCellWidth,
    tableActionValue,
  }
})
