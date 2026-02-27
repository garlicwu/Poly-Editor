<script setup lang="ts">
import {nextTick, onMounted, onUnmounted, type PropType, reactive, ref, watch} from 'vue'
import {AgGridVue} from 'ag-grid-vue3'
import {
  type CellContextMenuEvent,
  type CellMouseDownEvent,
  type CellMouseOverEvent,
  CellSpanModule,
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  type ColDef,
  type GridApi,
  InfiniteRowModelModule,
  ModuleRegistry,
  RenderApiModule,
  type RowHeightParams,
  ValidationModule,
} from 'ag-grid-community'
import type {IComponentInfo} from '@/view/editor/utils/common-modle'
import {gridTableDefaultHeight, gridTableDefaultWidth, type MergedCellInfo, type SelectedCell, type TableRow} from '@/view/editor/component/table/grid-table-util'
import {useEditorStore} from '@/store/editorStore'
import {cloneDeep, debounce} from 'lodash'
import {TableActionType, useTableStateStore} from '@/store/useTableStateStore'
import {storeToRefs} from 'pinia'
import {useAreaMoveStore} from '@/store/useAreaMoveStore'

ModuleRegistry.registerModules([CellSpanModule, ClientSideRowModelModule, ValidationModule, RenderApiModule, CellStyleModule, ClientSideRowModelApiModule, InfiniteRowModelModule])
const emit = defineEmits(['focus', 'blur', 'customContextmenu'])
const props = defineProps({componentInfo: {type: Object as PropType<IComponentInfo>, required: true}})

const editorStore = useEditorStore()
const tableState = useTableStateStore()
const areaStore = useAreaMoveStore()
const {tableChangeAction} = storeToRefs(tableState)

const {dragerItemReSizeIng} = storeToRefs(areaStore)
const cellSizeConfigShow = ref(false)

const tableKey = ref(0)
const tableRefreshState = ref(true)

const clearAllData = () => {
  columnDefs.value = []
  rowData.value = []
  rowHeights.value = []
}
watch(
  () => props.componentInfo?.resizeStatus,
  (value) => {
    console.log('resizeStatus', value, props.componentInfo?.selected)
    let allHeight = 0
    rowData.value.forEach((row, index) => {
      allHeight += rowHeights.value[index] ?? gridTableDefaultHeight
    })
    const parentHeight = props.componentInfo?.height
    const ratio = (parentHeight - 4) / allHeight

    rowData.value.forEach((row, index) => {
      rowHeights.value[index] = Number(Math.floor((rowHeights.value[index] ?? gridTableDefaultHeight) * ratio))
    })
    // const rowHeightsClone = cloneDeep(rowHeights.value)
    // clearAllData()
    tableKey.value++
    // console.log('mergedCells', mergedCells.value)
    // console.log('rowHeights', rowHeights.value)
    // gridApi?.refreshCells({force: true})
    // gridApi?.resetRowHeights()
    // rowData.value = props.componentInfo.tableStyle?.rowData || []
    // rowHeights.value = rowHeightsClone
    refreshGridTable()
    // cellSpanMap.value = coneDeep(cellSpanMapClone)
    debounceSave()
  },
)

watch(
  () => props.componentInfo?.selected,
  () => {
    hideContextMenu()
  },
)
// watch(
//   () => props.componentInfo?.tableStyle,
//   (newValue, oldValue) => {
// let changeValue = false
// if (!isEqual(newValue?.columns, oldValue?.columns || [])) {
//   columnDefs.value = newValue?.columns || []
//   changeValue = true
// }
// if (!isEqual(newValue?.rowData, oldValue?.rowData || [])) {
//   rowData.value = newValue?.rowData || []
//   changeValue = true
// }
//
// if (!isEqual(newValue?.cellSpanMap, oldValue?.cellSpanMap || {})) {
//   cellSpanMap.value = newValue?.cellSpanMap || {}
//   changeValue = true
// }
// if (!isEqual(newValue?.mergedCells, oldValue?.mergedCells || [])) {
//   mergedCells.value = newValue?.mergedCells || []
//   changeValue = true
// }
// if (!isEqual(newValue?.rowHeights, oldValue?.rowHeights || {})) {
//   rowHeights.value = newValue?.rowHeights || {}
//   changeValue = true
// }
// if (changeValue) {
//   refreshGridTable()
// }
//   },
//   {deep: true},
// )

watch(
  () => tableChangeAction.value,
  (newValue, oldValue) => {
    if (newValue?.componentId === props.componentInfo.componentId) {
      switch (newValue?.type) {
        case TableActionType.tableMerge:
          mergeCells()
          break
        case TableActionType.tableUnMerge:
          unmergeCell()
          break
        case TableActionType.tableAddRow:
          addRow()
          break
        case TableActionType.tableAddCol:
          addColumn()
          break
        case TableActionType.tableDelRow:
          deleteRow()
          break
        case TableActionType.tableDelCol:
          deleteColumn()
          break
        case TableActionType.tableCellSize:
          cellSizeConfigShow.value = true
          break
      }
    }
  },
)

onMounted(async () => {
  document.addEventListener('mouseup', onMouseUp)
  initTable()
  // const updateComponent = cloneDeep(props.componentInfo) as IComponentInfo
  // if (!updateComponent.imageSrc) {
  //   const imageData = await buildComponentWithRender(updateComponent)
  //   updateComponent.imageSrc = imageData?.toString()
  // }
  // editorStore.updateCurrentTable(updateComponent, false, false, false)
})

const initTable = () => {
  const tableStyle = props.componentInfo?.tableStyle || {}
  columnDefs.value = tableStyle?.columns || []
  rowData.value = tableStyle?.rowData || []
  cellSpanMap.value = tableStyle?.cellSpanMap || {}
  mergedCells.value = tableStyle?.mergedCells || []
  rowHeights.value = tableStyle?.rowHeights || {}
  console.log('initTable', props.componentInfo?.tableStyle)
  refreshGridTable()
}

const debounceSave = debounce(
  async ({
    addRow,
    deleteRow,
    addCol,
    deleteCol,
    deleteColWidth,
    deleteRowHeight,
    noCache,
  }: {
    addRow?: boolean
    deleteRow?: boolean
    addCol?: boolean
    deleteCol?: boolean
    deleteColWidth?: number | undefined
    deleteRowHeight?: number | undefined
    noCache?: boolean
  } = {}) => {
    const updateComponent = cloneDeep(props.componentInfo) as IComponentInfo
    if (!updateComponent.tableStyle) {
      updateComponent.tableStyle = {}
    }
    let allHeight = 4
    rowData.value.forEach((row, index) => {
      allHeight += rowHeights.value[index] ?? gridTableDefaultHeight
    })

    if (allHeight !== updateComponent.height) {
      updateComponent.height = allHeight
    }

    if (addCol) {
      updateComponent.width += gridTableDefaultWidth
    }
    if (deleteCol) {
      updateComponent.width -= deleteColWidth ?? gridTableDefaultWidth
    }
    updateComponent.tableStyle.columns = cloneDeep(
      columnDefs.value.map((item) => {
        return {field: item.field, flex: item.flex, width: item.width, headerName: item.headerName}
      }),
    )
    updateComponent.tableStyle.rowData = cloneDeep(rowData.value)
    updateComponent.tableStyle.cellSpanMap = cloneDeep(cellSpanMap.value)
    updateComponent.tableStyle.mergedCells = cloneDeep(mergedCells.value)
    updateComponent.tableStyle.rowNum = columnDefs.value.length
    updateComponent.tableStyle.colNum = rowData.value.length
    updateComponent.tableStyle.rowHeights = cloneDeep(rowHeights.value)
    if (noCache) {
      editorStore.updateCurrentTable(updateComponent, false, false, false)
    } else {
      editorStore.updateCurrentTable(updateComponent)
    }
    // const imageData = await buildComponentWithRender(updateComponent)
    // updateComponent.imageSrc = imageData?.toString()
    editorStore.updateCurrentTable(updateComponent, false, false, false)
    console.log('updateCurrentTable', updateComponent.tableStyle)
  },
  100,
  {trailing: true},
)

const cellSpanMap = ref<Record<string, {colSpan: number; rowSpan: number; isMaster: boolean}>>({})

const gridRef = ref<typeof AgGridVue | null>(null)
let gridApi: GridApi | null = null

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
})

const selectedRange = reactive({
  startRow: -1,
  endRow: -1,
  startCol: '',
  endCol: '',
})

const isSelecting = ref(false)
const selectionStart = reactive({row: -1, col: ''})
const selectedCells = ref<SelectedCell[]>([])

const mergedCells = ref<MergedCellInfo[]>([])

// 检查单元格是否为合并后的子单元格
const isChildCell = (rowIndex: number, colId: string): boolean => {
  const key = `${rowIndex}-${colId}`
  const spanInfo = cellSpanMap.value[key]
  // 如果 colSpan 或 rowSpan 为 0，表示这是被隐藏的子单元格
  return spanInfo !== undefined && (spanInfo.colSpan === 0 || spanInfo.rowSpan === 0)
}

const cellMergeIsLastRow = (colId: string, rowIndex: number): boolean => {
  if (mergedCells.value.length === 0) {
    return false
  }
  let isLastRow = false
  const curCell = mergedCells.value.find((cell) => {
    return cell.colStart === colId
  })
  if (!curCell) {
    return false
  }
  if (curCell.rowEnd === rowData.value.length - 1) {
    isLastRow = true
  }

  return isLastRow
}

const cellMergeIsLastCol = (colId: string, rowIndex: number): boolean => {
  if (mergedCells.value.length === 0) {
    return false
  }
  let isLastCol = false
  const curCell = mergedCells.value.find((cell) => {
    return cell.colStart === colId
  })
  if (!curCell) {
    return false
  }

  if (curCell.colEnd === columnDefs.value[columnDefs.value.length - 1].field) {
    isLastCol = true
  }
  return isLastCol
}

// 自定义 cellRenderer，用于隐藏合并后的子单元格
const cellRenderer = (params: any) => {
  const rowIndex = params.node.rowIndex
  const colId = params.column?.getColId()
  const div = document.createElement('div')

  // const merge = mergedCells.value.find((cell) => {
  //   return cell.colStart === colId && cell.rowStart === rowIndex
  // })
  // let divHeight = rowHeights.value[rowIndex]
  // if (merge) {
  //   for (let i = merge.rowStart + 1; i <= merge.rowEnd; i++) {
  //     divHeight += rowHeights.value[i]
  //   }
  //   console.log('cellRenderer', divHeight)
  // }
  // div.className = 'real-merged-cell'
  let cellStyleStr = `
  width: 100%;
  height: 100%;
  position: relative;
  `
  const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
  const curColIdIndex = cols.indexOf(colId)
  if (curColIdIndex === cols.length - 1) {
    // 最后一列
    if (rowIndex < rowData.value.length - 1 && !cellMergeIsLastRow(colId, rowIndex)) {
      cellStyleStr += `border-bottom: 2px solid #000;`
    }
  } else {
    cellStyleStr += `border-right: 2px solid #000;`
    if (rowIndex < rowData.value.length - 1 && !cellMergeIsLastRow(colId, rowIndex)) {
      cellStyleStr += `border-bottom: 2px solid #000;`
    }
  }
  div.style = cellStyleStr

  // 如果是子单元格（colSpan=0 或 rowSpan=0），保留边框但不显示内容
  // 不再设置 display: none，这样边框仍然可见
  if (rowIndex !== undefined && colId && isChildCell(rowIndex, colId)) {
    // 返回空的 div，保留边框样式
    return div
  }

  return div
}

const cellStyle = (params: any) => {
  const rowIndex = params.node.rowIndex
  const colId = params.column?.getColId()
  if (selectedRange.startRow === -1 || !selectedRange.startCol) {
    return {
      backgroundColor: 'white',
    }
  } else {
    const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
    const endColIdx = cols.indexOf(selectedRange.endCol)
    const startColIdx = cols.indexOf(selectedRange.startCol)
    const curColIds = cols.indexOf(colId)
    if (curColIds >= startColIdx && curColIds <= endColIdx && rowIndex >= selectedRange.startRow && rowIndex <= selectedRange.endRow) {
      return {backgroundColor: '#c8e6c9'}
    } else {
      return {backgroundColor: 'white'}
    }
  }
}

// 生成列定义的函数，添加 colSpan、rowSpan 和 cellRenderer 支持
const createColumnDefs = (): ColDef[] => {
  const baseCols = cloneDeep(columnDefs.value || []) ?? []
  return baseCols.map((col: any) => ({
    ...col,
    cellStyle: cellStyle,
    cellRenderer: cellRenderer,
    colSpan: customColSpan,
    rowSpan: customRowSpan,
  }))
}

const customColSpan = (params: any) => {
  const rowIndex = params.node.rowIndex
  const colId = params.column?.getColId()
  if (rowIndex === undefined || !colId) return 1
  const key = `${rowIndex}-${colId}`
  const spanInfo = cellSpanMap.value[key]
  // 如果存在 spanInfo，返回其 colSpan（0表示隐藏，大于1表示合并）
  // 如果不存在，返回默认值 1
  if (spanInfo !== undefined) {
    return spanInfo.colSpan
  }
  return 1
}
const customRowSpan = (params: any) => {
  const rowIndex = params.node.rowIndex
  const colId = params.column?.getColId()
  if (rowIndex === undefined || !colId) return 1
  const key = `${rowIndex}-${colId}`
  const spanInfo = cellSpanMap.value[key]
  // 如果存在 spanInfo，返回其 rowSpan（0表示隐藏，大于1表示合并）
  // 如果不存在，返回默认值 1
  if (spanInfo !== undefined) {
    let span = spanInfo.colSpan
    if (span === 0) {
      return 0
    }
    const findMerge = mergedCells.value.find((cell) => {
      return cell.colStart === colId
    })
    if (findMerge) {
      let allHeight = 0
      for (let i = findMerge.rowStart; i <= findMerge.rowEnd; i++) {
        allHeight += rowHeights.value[i]
      }
      span = allHeight / gridTableDefaultHeight
    }
    return span
  }
  return 1
}
const columnDefs = ref<ColDef[]>([])

const defaultColDef: ColDef = {
  sortable: false,
  filter: false,
  resizable: true,
  editable: false,
}

const rowData = ref<TableRow[]>([])

const rowHeights = ref<Record<number, number>>({})

// { node: { rowIndex: number }}
const getRowHeight = (params: RowHeightParams) => {
  return rowHeights.value[params?.node?.rowIndex ?? -1] || gridTableDefaultHeight
}

const onGridReady = (params: {api: GridApi}) => {
  console.log('onGridReady', params)
  gridApi = params.api
}

const onColumnResized = () => {
  // 列宽改变时刷新网格以重新计算合并单元格
  if (gridApi) {
    gridApi.refreshCells({force: true})
  }
}

const onCellMouseDown = (event: CellMouseDownEvent) => {
  clickTable()
  if (!dragerItemReSizeIng.value && event.event && (event.event as MouseEvent).button === 0) {
    isSelecting.value = true
    selectionStart.row = event.rowIndex ?? -1
    selectionStart.col = event.column?.getColId() ?? ''
    selectedRange.startRow = selectionStart.row
    selectedRange.endRow = selectionStart.row
    selectedRange.startCol = selectionStart.col
    selectedRange.endCol = selectionStart.col
    updateSelectionGrid()
    updateTableConfigInfo(event)
  }
}

const onCellMouseOver = (event: CellMouseOverEvent) => {
  if (!dragerItemReSizeIng.value && isSelecting.value && selectionStart.row !== -1) {
    const currentRow = event.rowIndex ?? -1
    const currentCol = event.column?.getColId() ?? ''

    selectedRange.startRow = Math.min(selectionStart.row, currentRow)
    selectedRange.endRow = Math.max(selectionStart.row, currentRow)

    const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
    const startIdx = cols.indexOf(selectionStart.col)
    const endIdx = cols.indexOf(currentCol)

    if (startIdx !== -1 && endIdx !== -1) {
      selectedRange.startCol = cols[Math.min(startIdx, endIdx)]
      selectedRange.endCol = cols[Math.max(startIdx, endIdx)]
    }
    updateSelectionGrid()
    updateTableConfigInfo(event)
  }
}

const onMouseUp = () => {
  isSelecting.value = false
}

const onContainerMouseDown = (e: MouseEvent) => {
  // 按住 Ctrl 时阻止冒泡，允许单元格选择
  if (e.ctrlKey) {
    e.stopPropagation()
  }
  // 否则让事件冒泡到 drager 触发移动
}

const updateSelectionGrid = () => {
  gridApi?.refreshCells({
    force: true, // 强制刷新样式
  })
}

const updateTableConfigInfo = (event: CellContextMenuEvent | CellMouseDownEvent | CellMouseOverEvent) => {
  if (selectedRange.startRow === -1) {
    selectedRange.startRow = event.rowIndex ?? -1
    selectedRange.endRow = event.rowIndex ?? -1
    selectedRange.startCol = event.column?.getColId() ?? ''
    selectedRange.endCol = event.column?.getColId() ?? ''
  }

  customColumnWidth.value = 1
  customRowHeight.value = rowHeights.value[selectedRange.endRow] ?? gridTableDefaultHeight
  const findCol = columnDefs.value.find((item) => item.field === selectedRange.endCol)
  if (findCol) {
    customColumnWidth.value = findCol.flex ?? 1
  }

  useTableStateStore().setTableInfo({
    componentId: props.componentInfo.componentId,
    cols: columnDefs.value.map((c) => c.field).filter(Boolean) as string[],
    rowData: cloneDeep(rowData.value),
    customColumnHeight: customRowHeight.value,
    customColumnWidth: customColumnWidth.value,
    selectedRange: selectedRange,
    mergedCells: cloneDeep(mergedCells.value),
  })
}

const onCellContextMenu = (event: CellContextMenuEvent) => {
  const mouseEvent = event.event as MouseEvent
  contextMenu.x = mouseEvent.clientX
  contextMenu.y = mouseEvent.clientY
  contextMenu.visible = true
  updateTableConfigInfo(event)
  event.event?.preventDefault()
  // // 检查是否可以合并
  // canMerge.value = checkCanMergeCells()
  // // 检查是否可以拆分
  // canUnmerge.value = findMergedCellAtSelection() !== -1
  //
  // canDeleteCol.value = columnDefs.value.length > 1
  // canDeleteRow.value = rowData.value.length > 1
}

const hideContextMenu = () => {
  contextMenu.visible = false
  cellSizeConfigShow.value = false
  clearSelection()
}

const clearSelection = () => {
  selectedRange.startRow = -1
  selectedRange.endRow = -1
  selectedRange.startCol = ''
  selectedRange.endCol = ''
  selectedCells.value = []
  gridApi?.refreshCells({
    force: true,
  })
}

const checkCanMergeCells = () => {
  let canMergeCells = true
  if (selectedRange.startRow === -1 || !selectedRange.startCol) {
    // alert('请先选择要合并的单元格区域')
    return false
  }

  const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
  const startColIdx = cols.indexOf(selectedRange.startCol)
  const endColIdx = cols.indexOf(selectedRange.endCol)

  // 检查是否有冲突的合并单元格
  for (const merged of mergedCells.value) {
    const mergedStartColIdx = cols.indexOf(merged.colStart)
    const mergedEndColIdx = cols.indexOf(merged.colEnd)
    // 检查是否与现有合并单元格重叠（使用列索引比较）
    if (selectedRange.startRow <= merged.rowEnd && selectedRange.endRow >= merged.rowStart && startColIdx <= mergedEndColIdx && endColIdx >= mergedStartColIdx) {
      // alert('不能与已合并的单元格重叠')
      canMergeCells = false
    }
  }

  return canMergeCells
}
const mergeCells = () => {
  const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
  const startColIdx = cols.indexOf(selectedRange.startCol)
  const endColIdx = cols.indexOf(selectedRange.endCol)

  // 保存原始数据
  const originalData: {row: number; col: string; value: string | number}[] = []

  // 计算选中区域所有
  let sum = ''
  for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      const colId = cols[c]
      const val = rowData.value[r]?.[colId]
      originalData.push({row: r, col: colId, value: val ?? ''})
      sum += '|' + (val ?? '')
    }
  }

  // 计算 colSpan 和 rowSpan（合并的列数和行数）
  const colSpan = endColIdx - startColIdx + 1
  const rowSpan = selectedRange.endRow - selectedRange.startRow + 1

  // 步骤1: 设置主单元格的合并信息
  // 主单元格的 colSpan 和 rowSpan 设置为合并范围，使其扩展到覆盖子单元格
  const masterKey = `${selectedRange.startRow}-${selectedRange.startCol}`
  cellSpanMap.value[masterKey] = {
    colSpan, // 主单元格跨越的列数（例如：2列合并则为2）
    rowSpan, // 主单元格跨越的行数（例如：2行合并则为2）
    isMaster: true,
  }

  // 步骤2: 将合并后的值设置到主单元格
  rowData.value[selectedRange.startRow][selectedRange.startCol] = sum

  // 步骤3: 将所有子单元格标记为隐藏
  // 子单元格的 colSpan 和 rowSpan 设置为 0，ag-grid 会隐藏这些单元格
  // 同时清空子单元格的数据，确保即使偶尔显示也不会有内容
  for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      // 跳过主单元格（只处理子单元格）
      if (r === selectedRange.startRow && c === startColIdx) {
        continue
      }
      const colId = cols[c]
      const key = `${r}-${colId}`
      // 子单元格返回 colSpan=0 和 rowSpan=0，会被 ag-grid 隐藏
      cellSpanMap.value[key] = {
        colSpan: 0, // 0 表示隐藏此单元格
        rowSpan: 0, // 0 表示隐藏此单元格
        isMaster: false,
      }
      // 清空子单元格的数据，双重保险确保只显示主单元格的内容
      if (rowData.value[r]) {
        rowData.value[r][colId] = ''
      }
    }
  }

  // 保存合并信息
  mergedCells.value.push({
    rowStart: selectedRange.startRow,
    rowEnd: selectedRange.endRow,
    colStart: selectedRange.startCol,
    colEnd: selectedRange.endCol,
    value: sum,
    originalData,
  })
  // refreshMergeGridTable()
  debounceSave()
  hideContextMenu()
}

const refreshGridTable = () => {
  columnDefs.value = createColumnDefs()
  gridApi?.setGridOption('columnDefs', columnDefs.value)
  // 重新设置 rowData 以触发重新渲染
  gridApi?.setGridOption('rowData', rowData.value)
  gridApi?.refreshCells({force: true})
}

const refreshMergeGridTable = () => {
  nextTick(() => {
    // 刷新网格以应用合并
    // 由于 cellSpanMap 是响应式的，我们需要强制刷新网格
    // 更新列定义以触发 colSpan 和 rowSpan 函数的重新计算
    columnDefs.value = createColumnDefs()
    gridApi?.setGridOption('columnDefs', columnDefs.value)
    // 重新设置 rowData 以触发重新渲染
    gridApi?.setGridOption('rowData', rowData.value)

    // 获取受影响的行节点并强制刷新
    const rowNodes: any[] = []
    for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
      const rowNode = gridApi?.getDisplayedRowAtIndex(r)
      if (rowNode) {
        rowNodes.push(rowNode)
      }
    }

    // 强制重绘受影响的行以确保合并生效
    if (rowNodes.length > 0) {
      gridApi?.redrawRows({rowNodes})
    } else {
      gridApi?.redrawRows({rowNodes: undefined})
    }
  })
}

const addRow = () => {
  const newRow: TableRow = {}
  const insertIndex = selectedRange.endRow >= 0 ? selectedRange.endRow + 1 : rowData.value.length
  for (let j = 0; j < columnDefs.value.length; j++) {
    newRow['field' + j] = `value-${j}-${insertIndex + 1}`
  }
  rowData.value.splice(insertIndex, 0, newRow)
  rowHeights.value[insertIndex] = rowHeights.value[insertIndex - 1]
  gridApi?.setGridOption('rowData', rowData.value)
  debounceSave({addRow: true})
  hideContextMenu()
}

const deleteRow = () => {
  if (selectedRange.endRow > -1) {
    rowData.value.splice(selectedRange.endRow, 1)
    gridApi?.setGridOption('rowData', rowData.value)
    debounceSave({deleteRow: true, deleteRowHeight: rowHeights.value[selectedRange.endRow]})
  }
  hideContextMenu()
}

const addColumn = () => {
  const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
  const startColIdx = cols.indexOf(selectedRange.startCol)
  let endColIdx = cols.indexOf(selectedRange.endCol) ?? columnDefs.value.length
  let newField = 'field' + endColIdx
  const findSameCol = cols.find((item) => item === 'field' + endColIdx)
  if (findSameCol) {
    newField = 'field-' + endColIdx + '-' + new Date().getTime()
  }
  const newColDef: ColDef = {
    field: newField,
    headerName: 'name' + endColIdx,
    flex: 1,
    cellRenderer: cellRenderer,
    colSpan: customColSpan,
    rowSpan: customRowSpan,
  }
  columnDefs.value.splice(endColIdx, 0, newColDef)

  rowData.value.forEach((row, index) => {
    row[newField] = `value-${endColIdx + 1}-${index}`
  })
  debounceSave({addCol: true})
  gridApi?.setGridOption('columnDefs', columnDefs.value)
  gridApi?.setGridOption('rowData', rowData.value)
  hideContextMenu()
}

const deleteColumn = () => {
  if (selectedRange.endCol && selectedRange.endCol !== '') {
    const findIndex = columnDefs.value.findIndex((item) => item.field === selectedRange.endCol)
    if (findIndex > -1) {
      columnDefs.value.splice(findIndex, 1)
      rowData.value.forEach((row) => {
        delete row['field' + findIndex]
      })
      gridApi?.setGridOption('columnDefs', columnDefs.value)
      gridApi?.setGridOption('rowData', rowData.value)
      debounceSave({deleteCol: true, deleteColWidth: columnDefs.value[findIndex].width})
    }
  }
  hideContextMenu()
}

const setColumnWidth = () => {
  const width = customColumnWidth.value
  const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
  const startColIdx = cols.indexOf(selectedRange.startCol)
  const endColIdx = cols.indexOf(selectedRange.endCol)

  for (let c = startColIdx; c <= endColIdx; c++) {
    const colDef = columnDefs.value.find((col) => col.field === cols[c])
    if (colDef) {
      colDef.flex = width
      // if (!width || width === 0) {
      //   colDef.flex = 1
      //   delete colDef.width
      // } else {
      //   delete colDef.flex
      //   colDef.width = Number(width)
      // }
    }
  }
  refreshGridTable()
  debounceSave()
  hideContextMenu()
}

const setRowHeight = () => {
  const height = customRowHeight.value
  if (height && !isNaN(Number(height))) {
    for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
      rowHeights.value[r] = Number(height)
    }
    gridApi?.resetRowHeights()
    gridApi?.refreshCells({force: true})
    debounceSave()
  }
  hideContextMenu()
}

// 判断当前选中区域是否有合并单元格
const canUnmerge = ref(false)
const canMerge = ref(false)
const canDeleteRow = ref(false)
const canDeleteCol = ref(false)
const currentMergedIdx = ref(-1)

const customRowHeight = ref(0)
const customColumnWidth = ref<undefined | number>(0)

const findMergedCellAtSelection = () => {
  for (let i = mergedCells.value.length - 1; i >= 0; i--) {
    const merged = mergedCells.value[i]
    // 检查选中区域是否与合并区域有交集
    if (selectedRange.startRow <= merged.rowEnd && selectedRange.endRow >= merged.rowStart) {
      const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
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

const unmergeCell = () => {
  let mergedIdx = currentMergedIdx.value
  if (mergedIdx === -1) {
    mergedIdx = findMergedCellAtSelection()
  }

  // 恢复原始数据
  const merged = mergedCells.value[mergedIdx]
  for (const item of merged.originalData) {
    if (rowData.value[item.row]) {
      rowData.value[item.row][item.col] = item.value
    }
  }

  // 移除合并记录 - 清除所有相关的 span 信息
  const cols = columnDefs.value.map((c) => c.field).filter(Boolean) as string[]
  const startColIdx = cols.indexOf(merged.colStart)
  const endColIdx = cols.indexOf(merged.colEnd)

  for (let r = merged.rowStart; r <= merged.rowEnd; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      const colId = cols[c]
      const key = `${r}-${colId}`
      delete cellSpanMap.value[key]
    }
  }

  // 移除合并记录
  mergedCells.value.splice(mergedIdx, 1)

  // 刷新网格
  gridApi?.setGridOption('rowData', [...rowData.value])
  gridApi?.refreshCells({force: true})

  currentMergedIdx.value = -1
  debounceSave()
  clearSelection()
  hideContextMenu()
}

const clickTable = () => {
  emit('focus', {componentId: props.componentInfo?.componentId})
}
onUnmounted(() => {
  document.removeEventListener('mouseup', onMouseUp)
})
</script>
<template>
  <div class="grade-table-container" @click.stop="clickTable" @mousedown="onContainerMouseDown">
    <ag-grid-vue
      v-if="tableRefreshState"
      ref="gridRef"
      :key="tableKey"
      class="ag-theme-alpine custom-grid"
      :column-defs="columnDefs"
      :row-data="rowData"
      :default-col-def="defaultColDef"
      :enable-click-selection="true"
      :suppress-row-transform="true"
      :row-height="gridTableDefaultHeight"
      :get-row-height="getRowHeight"
      :enable-cell-span="true"
      :row-buffer="30"
      :suppress-column-virtualisation="true"
      @click.stop="clickTable"
      @grid-ready="onGridReady"
      @cell-context-menu="onCellContextMenu"
      @cell-mouse-down="onCellMouseDown"
      @cell-mouse-over="onCellMouseOver"
      @column-resized="onColumnResized" />

    <!-- 右键菜单 -->
    <!--    <div v-if="contextMenu.visible" class="context-menu" :style="{left: contextMenu.x + 'px', top: contextMenu.y + 'px'}">-->
    <!--      <div v-if="canMerge" class="menu-item" @click="mergeCells"><span class="icon">🔗</span> 合并单元格</div>-->
    <!--      <div v-if="canUnmerge" class="menu-item" @click="unmergeCell"><span class="icon">✂️</span> 拆分单元格</div>-->
    <!--      <div class="menu-divider"></div>-->
    <!--      <div class="menu-item" @click="addRow"><span class="icon">➕</span> 新增行</div>-->
    <!--      <div class="menu-item" @click="addColumn"><span class="icon">📝</span> 新增列</div>-->
    <!--      <div v-if="canDeleteRow" class="menu-item" @click="deleteRow"><span class="icon">➖</span> 删除行</div>-->
    <!--      <div v-if="canDeleteCol" class="menu-item" @click="deleteColumn"><span class="icon">➖</span> 删除列</div>-->
    <!--      <div class="menu-divider"></div>-->
    <!--      <div class="menu-item">-->
    <!--        <span class="icon">↔️</span> <span> 设置列宽</span>>-->
    <!--        <InputNumber v-model="customColumnWidth" class="my-input-number-style w-12 ml-2" placeholder="默认0,自适应" size="small" :min="0" @blur.self="setColumnWidth" @keydown.enter="setColumnWidth" />-->
    <!--      </div>-->
    <!--      <div class="menu-item mt-2">-->
    <!--        <span class="icon">↕️</span> <span> 设置行高</span>-->
    <!--        <InputNumber v-model="customRowHeight" class="my-input-number-style w-12 ml-2" placeholder="" size="small" :min="0" @blur.self="setRowHeight" @keydown.enter="setRowHeight" />-->
    <!--      </div>-->
    <!--    </div>-->
    <Dialog v-model:visible="cellSizeConfigShow" modal header="编辑列宽/行高" class="w-80" pt:root:class="!border-0  !p-0 " pt:content:class="!p-0" :closable="true">
      <div class="w-full flex flex-col pl-6 pr-6 pb-6">
        <div class="font-black flex flex-col">
          <div class="flex flex-row">
            <span class="icon">↔️</span> <span> 设置列宽</span>
            <span>（自适应比例，默认1）</span>
          </div>
          <InputNumber v-model="customColumnWidth" class="my-input-number-style w-full" placeholder="" size="small" :min="0" :step="0.25" show-buttons button-layout="horizontal" @blur.self="setColumnWidth" @keydown.enter="setColumnWidth">
            <template #incrementbuttonicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementbuttonicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
        </div>
        <div class="font-black flex flex-col mt-2">
          <div class="flex flex-row"><span class="icon">↕️</span> <span> 设置行高</span></div>
          <InputNumber v-model="customRowHeight" class="my-input-number-style w-full" show-buttons button-layout="horizontal" placeholder="" size="small" :min="0" @blur.self="setRowHeight" @keydown.enter="setRowHeight">
            <template #incrementbuttonicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementbuttonicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.grade-table-container {
  width: 100%;
  height: 100%;
  background: #fff;
  position: relative;
}

.custom-grid {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

:deep(.ag-root-wrapper) {
  border: 2px solid #000;
}

:deep(.ag-theme-alpine) {
  --ag-background-color: #fff;
  --ag-header-background-color: #fff;
  --ag-odd-row-background-color: #fff;
  --ag-row-hover-color: transparent;
  --ag-selected-row-background-color: transparent;
  --ag-selected-border-color: transparent;
  --ag-range-selection-border-color: transparent;
  --ag-range-selection-background-color: transparent;
  --ag-border-color: transparent;
  --ag-border-radius: 3px;
  --ag-foreground-color: #000;
  --ag-header-foreground-color: #000;
  --ag-row-border-width: 0px;
  --ag-cell-horizontal-border: solid 0px #000;
  --ag-borders: solid 0px;
  --ag-header-height: 0px;
  --ag-cell-horizontal-padding: 0px;
  --ag-row-group-indent-size: 0px;
}

:deep(.ag-cell-focus) {
  border: 0 solid #000 !important;
}

:deep(.ag-cell-range-selected) {
  border-right: 0 solid #000 !important;
}

:deep(.ag-header) {
  display: none;
}

:deep(.ag-cell) {
  display: flex;
  align-items: center;
  border: 0 solid #000;
}

:deep(.ag-cell:last-child) {
  border-right: 0 solid #000;
}

:deep(.ag-row) {
  border-bottom: 0 solid #000;
}

:deep(.ag-row:last-child) {
  border-bottom: 0 solid #000;
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 8px 0;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  color: #000;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.1);
}

.menu-item .icon {
  font-size: 16px;
}

.menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 6px 0;
}

.selection-overlay {
  background: rgba(0, 0, 0, 0.1);
  z-index: 100;
  box-sizing: border-box;
}
</style>
