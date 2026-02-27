export interface TableRow {
  [key: string]: string | number
}

export interface MergedCellInfo {
  rowStart: number
  rowEnd: number
  colStart: string
  colEnd: string
  value: string | number
  originalData: {row: number; col: string; value: string | number}[]
}

export interface SelectedCell {
  rowIndex: number
  colId: string
  style: Record<string, string>
}

export const gridTableDefaultHeight = 120
export const gridTableDefaultWidth = 160
