<script setup lang="ts">
import {onMounted, type PropType, reactive, ref, watch} from 'vue'
import {AgGridVue} from 'ag-grid-vue3'
import type {IComponentInfo} from '@/view/editor/utils/common-modle'
import {gridTableDefaultHeight, type MergedCellInfo, type TableRow} from '@/view/editor/component/table/grid-table-util'
import {CellSpanModule, CellStyleModule, ClientSideRowModelModule, type ColDef, type GridApi, ModuleRegistry, RenderApiModule, type RowHeightParams, ValidationModule} from 'ag-grid-community'

ModuleRegistry.registerModules([CellSpanModule, ClientSideRowModelModule, ValidationModule, RenderApiModule, CellStyleModule])

const props = defineProps({componentInfo: {type: Object as PropType<IComponentInfo>, required: true}})

watch(
  () => props.componentInfo,
  (newValue, oldValue) => {
    initTable()
  },
  {deep: true},
)
onMounted(() => {
  initTable()
})

const initTable = () => {
  const tableStyle = props.componentInfo?.tableStyle || {}
  columnDefs.value = tableStyle?.columns || []
  rowData.value = tableStyle?.rowData || []
  cellSpanMap.value = tableStyle?.cellSpanMap || {}
  mergedCells.value = tableStyle?.mergedCells || []
  rowHeights.value = tableStyle?.rowHeights || {}
  columnDefs.value = createColumnDefs()
  gridApi?.setGridOption('columnDefs', columnDefs.value)
  gridApi?.setGridOption('rowData', rowData.value)
  gridApi?.refreshCells({force: true})
}

const cellSpanMap = ref<Record<string, {colSpan: number; rowSpan: number; isMaster: boolean}>>({})

const gridRef = ref<typeof AgGridVue | null>(null)
let gridApi: GridApi | null = null

const selectedRange = reactive({
  startRow: -1,
  endRow: -1,
  startCol: '',
  endCol: '',
})

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

// 自定义 cellRenderer，用于隐藏合并后的子单元格
const cellRenderer = (params: any) => {
  const rowIndex = params.node.rowIndex
  const colId = params.column?.getColId()
  const div = document.createElement('div')

  let cellStyleStr = `
  width: 100%;
  height: 100%;
  position: relative;
  color:transparent;
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

  // 如果是子单元格（colSpan=0 或 rowSpan=0），返回 null 来完全隐藏单元格内容
  if (rowIndex !== undefined && colId && isChildCell(rowIndex, colId)) {
    div.style.display = 'none'
    return div
  }

  return div
}
const cellStyle = (params: any) => {
  return {
    backgroundColor: 'white',
  }
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

// 生成列定义的函数，添加 colSpan、rowSpan 和 cellRenderer 支持
const createColumnDefs = (): ColDef[] => {
  const baseCols = columnDefs.value ?? []
  return baseCols.map((col: any) => ({
    ...col,
    cellStyle: cellStyle,
    cellRenderer: cellRenderer,
    colSpan: customColSpan,
    rowSpan: customRowSpan,
  }))
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
  gridApi = params.api
}

const onColumnResized = () => {
  // 列宽改变时刷新网格以重新计算合并单元格
  if (gridApi) {
    gridApi.refreshCells({force: true})
  }
}
</script>
<template>
  <div class="grade-table-container" @contextmenu.prevent>
    <ag-grid-vue
      ref="gridRef"
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
      @grid-ready="onGridReady"
      @column-resized="onColumnResized" />
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
</style>
