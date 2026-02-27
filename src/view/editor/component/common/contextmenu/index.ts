import {type VNode, createVNode, render} from 'vue'
import MenuView from './menu-view.vue'
import {useEditorContainer} from '@/view/editor/hooks'

export type ActionType =
  | 'selectLayer'
  | 'remove'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'duplicate'
  | 'top'
  | 'bottom'
  | 'group'
  | 'ungroup'
  | 'selectAll'
  | 'lock'
  | 'moveUp'
  | 'moveDown'
  | 'imgReplace'
  | 'imgReplaceAll'
  | 'alignLeft'
  | 'alignCanvasLeft'
  | 'alignCenter'
  | 'alignVerticalCenter'
  | 'alignRight'
  | 'alignCanvasRight'
  | 'appliedToAll'
  | 'undo'
  | 'redo'
  | 'switchMarkLine'
  | 'cancelTerm'
  | 'praseImage'
  | 'deleteAllMarkLine'
  | 'deleteAllPageMarkLine'
  | 'verticalIsometric'
  | 'horizontalIsometric'
  | 'editGroup'
  | 'editUngroup'
  | 'tableMerge'
  | 'tableUnMerge'
  | 'tableAddCol'
  | 'tableAddRow'
  | 'tableDelCol'
  | 'tableDelRow'
  | 'tableCellSize'

export type MenuItem = {
  label: string
  action: ActionType
  bottomLine?: boolean
  actionKey?: string
  notice?:string
}

export type MenuOption = {
  clientX?: number
  clientY?: number
  items?: MenuItem[]
  onClick?: (item: MenuItem) => void
}

let vm: VNode | null = null

export function $contextmenu(option: MenuOption) {
  if (!vm) {
    const {container: globalContainer} = useEditorContainer()
    const container = document.createElement('div')
    console.log('contextmenu', option)
    container.classList.add('contextmenu')
    vm = createVNode(MenuView, {option})

    // 将组件渲染成真实节点
    render(vm, container)
    console.log(globalContainer)
    globalContainer.appendChild(container.firstElementChild!)
  }

  const {open} = vm.component!.exposed!
  open(option)
}
