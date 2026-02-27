export const editorComponentModule = import.meta.glob('./**/*.vue')

export enum EditorComponent {
  QUILL_TEXT = './text/quill-text-view.vue',
  IMAGE = './image/image-view.vue',
  Shape = './shape/shape-view.vue',
  Table = './table/grid-table.vue',
  TableDisplay = './table/grid-table-display.vue',
}
