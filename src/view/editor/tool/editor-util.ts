import {type AsyncComponentLoader, defineAsyncComponent} from 'vue'
import {editorComponentModule} from '@/view/editor/component/editorComponentInit'
import Quill, {Parchment} from 'quill'
import {fontFaceNameList} from '@/lib/util'
import {fontAfterLineHeightList, fontLetterSpaceList, fontLineHeightList} from '@/lib/font-face-list'

export enum QuillOlType {
  default = '',
  olCircle = 'olCircle',
  olParentheses = 'olParentheses',
}

export function loaderComponent(componentName: string) {
  try {
    if (Object.prototype.hasOwnProperty.call(editorComponentModule, componentName) && editorComponentModule[componentName]) {
      console.log('loaderComponent', componentName)
      return defineAsyncComponent(editorComponentModule[componentName] as AsyncComponentLoader)
    } else {
      return componentName
    }
  } catch (e) {
    console.error(e)
    return componentName
  }
}

export let isInitQuillRegister = false

export function initQuillRegister() {
  if (isInitQuillRegister) {
    return
  }
  // const Font: any = Quill.imports['formats/font']
  const Font: any = Quill.imports['attributors/style/font']
  const Size: any = Quill.imports['attributors/style/size']

  // 使用系统字体列表，如果 fontFaceNameList 为空则使用默认列表
  const defaultFonts = [
    'Arial',
    'Arial Black',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Times New Roman',
    'Georgia',
    'Garamond',
    'Courier New',
    'Brush Script MT',
    'Impact',
    'Comic Sans MS',
    'Lucida Console',
    'Lucida Sans Unicode',
    'Palatino Linotype',
    'Microsoft YaHei',
    'SimSun',
    'SimHei',
    'KaiTi',
    'FangSong',
    'NSimSun',
    'Microsoft JhengHei',
    'PMingLiU',
    'MingLiU',
    'DFKai-SB',
  ]
  // 不使用 whitelist 限制，允许任何字体
  Font.whitelist = null
  const fontSize = []
  for (let i = 1; i < 200; i++) {
    fontSize.push(`${i}px`)
  }
  fontSize.push(false)
  Size.whitelist = fontSize
  Quill.register(Font, true)
  Quill.register(Size, true)

  const Header: any = Quill.import('formats/header')

  class CustomHeader extends Header {
    static create(value: any) {
      const node = super.create(value)
      node.classList.add(`custom-header-${value}`) // Add a custom class
      // console.log('CustomHeader', node)
      return node
    }
  }

  Quill.register(CustomHeader, true)

  const List: any = Quill.import('formats/list')

  class CustomList extends List {
    static create(value: any) {
      const node = super.create(value)
      // console.log('custom-list', value)
      node.classList.add(`custom-list-${value}`) // Add a custom class
      // console.log('classList', node.classList)
      // console.log('CustomList', node)
      return node
    }
  }

  Quill.register(CustomList, true)

  // console.log('quillImportsHeader', Header)
  const lineHeightClass = new Parchment.ClassAttributor('line-height', 'ql-line-height', {
    scope: Parchment.Scope.BLOCK,
    whitelist: fontLineHeightList,
  })
  const lineHeightStyle = new Parchment.StyleAttributor('line-height', 'line-height', {
    scope: Parchment.Scope.BLOCK,
    whitelist: fontLineHeightList,
  })
  Quill.register(
    {
      'attributors/class/lineHeight': lineHeightClass,
      // 'attributors/style/lineHeight': lineHeightStyle,
    },
    true,
  )
  Quill.register({'formats/line-height': lineHeightClass}, true)

  const letterSpaceClass = new Parchment.ClassAttributor('letter-spacing', 'ql-cs-letter-spacing', {
    scope: Parchment.Scope.INLINE,
    whitelist: fontLetterSpaceList,
  })
  Quill.register(
    {
      'attributors/class/letterSpacing': letterSpaceClass,
      // 'attributors/style/lineHeight': lineHeightStyle,
    },
    true,
  )
  Quill.register({'formats/letter-spacing': letterSpaceClass}, true)

  const termCustomStyle = new Parchment.ClassAttributor('term-custom-style', 'term-custom-style', {
    scope: Parchment.Scope.INLINE,
    whitelist: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  })
  // const lineHeightStyle = new Parchment.StyleAttributor('line-height', 'line-height', {
  //   scope: Parchment.Scope.INLINE,
  //   whitelist: fontLineHeightList,
  // })
  Quill.register(
    {
      'attributors/class/termCustomStyle': termCustomStyle,
      // 'attributors/style/lineHeight': lineHeightStyle,
    },
    true,
  )
  Quill.register({'formats/term-custom-style': termCustomStyle}, true)

  const afterLineHeightStyle = new Parchment.ClassAttributor('ql-after-line-height', 'ql-after-line-height', {
    scope: Parchment.Scope.BLOCK,
    whitelist: fontAfterLineHeightList,
  })
  // const lineHeightStyle = new Parchment.StyleAttributor('line-height', 'line-height', {
  //   scope: Parchment.Scope.INLINE,
  //   whitelist: fontLineHeightList,
  // })
  Quill.register(
    {
      'attributors/class/qlAfterLineHeight': afterLineHeightStyle,
      // 'attributors/style/lineHeight': lineHeightStyle,
    },
    true,
  )
  Quill.register({'formats/ql-after-line-height': afterLineHeightStyle}, true)

  // let Break = Quill.import('blots/break')
  //
  // class CustomBreak extends Break {
  //   static create() {
  //     let node = super.create()
  //     node.classList.add('custom-br') // Add a class
  //     return node
  //   }
  // }
  //
  // Quill.register(CustomBreak, true)

  console.log('quillImports', Quill.imports)
  isInitQuillRegister = true
}

export const getCharCount = (str: string, char: string) => {
  const regex = new RegExp(char, 'g') // 使用g表示整个字符串都要匹配
  const result = str.match(regex) //match方法可在字符串内检索指定的值，或找到一个或多个正则表达式的匹配。
  const count = !result ? 0 : result.length
  return count
}

export function confitTermDeltaOps(deltaOps: any[], termList: string[]): Record<string, any> {
  let newOps: any[] = []
  let termNum = 0
  deltaOps.forEach((op) => {
    if (op.attributes && Object.prototype.hasOwnProperty.call(op.attributes, 'term-custom-style') && op.attributes['term-custom-style'] === '1') {
      if (op.insert && termList.includes(op.insert)) {
        termNum++
      } else {
        delete op.attributes['term-custom-style']
      }
      newOps.push(op)
    } else {
      if (op.insert) {
        const filterTerm = termList.filter((item) => op.insert.includes(item))
        if (filterTerm.length > 0) {
          let newDeltaOps: any[] = [op]
          filterTerm.forEach((term) => {
            const newOpData = configListDeltaOps(newDeltaOps, term)
            newDeltaOps = newOpData.newOps
            termNum += newOpData.termNum
          })
          newOps = newOps.concat(newDeltaOps)
        } else {
          newOps.push(op)
        }
      } else {
        newOps.push(op)
      }
    }
  })

  return {newOps, termNum}
}

function configListDeltaOps(deltaOpsList: any[], term: string) {
  let newOps: any[] = []
  let termNum = 0
  deltaOpsList.forEach((op) => {
    const newDeltaOps = configSingleDeltaOps(op, term)
    termNum += newDeltaOps.termNum
    newOps = newOps.concat(newDeltaOps.newOps)
  })

  return {newOps, termNum}
}

function configSingleDeltaOps(deltaOps: any, term: string) {
  let newOps: any[] = []
  let termNum = 0
  if (term && term.length > 0 && deltaOps.insert.includes(term)) {
    const commonAttr = deltaOps.attributes
    const findIndex = deltaOps.insert.indexOf(term)
    const firstOp: any = {insert: deltaOps.insert.substring(0, findIndex)}
    if (commonAttr) {
      firstOp.attributes = commonAttr
    }
    newOps.push(firstOp)
    const secondOp: any = {insert: term, attributes: {'term-custom-style': '1'}}
    if (commonAttr) {
      secondOp.attributes = {...commonAttr, ...secondOp.attributes}
    }
    newOps.push(secondOp)
    termNum += 1
    const thirdOp: any = {insert: deltaOps.insert.substring(findIndex + term.length, deltaOps.insert.length)}
    if (thirdOp.insert !== '') {
      if (commonAttr) {
        thirdOp.attributes = commonAttr
      }
      const newData = configSingleDeltaOps(thirdOp, term)
      termNum += newData.termNum
      newOps = newOps.concat(newData.newOps)
    }
  } else {
    newOps = [{...deltaOps}]
  }
  return {newOps, termNum}
}

export function resetTermDeltaOps(deltaOpsList: any[]) {
  const hasTermNum = deltaOpsList.findIndex((item) => item?.attributes?.['term-custom-style'] === '1')
  if (hasTermNum) {
    deltaOpsList.forEach((op, index) => {
      if (op?.attributes?.['term-custom-style'] === '1') {
        delete op.attributes['term-custom-style']
      }
    })
  } else {
    return deltaOpsList
  }

  return mergeSameAttr(deltaOpsList)
}

export function mergeSameAttr(deltaOpsList: any[]) {
  const newDeltaOps: any[] = []
  deltaOpsList.forEach((op, index) => {
    const preOp = deltaOpsList[index - 1]
    // const findSameAttrIndex = newDeltaOps.findIndex((item) => JSON.stringify(item.attributes ?? {}) === JSON.stringify(op.attributes ?? {}))
    if (op.attributes && preOp && preOp.attributes && JSON.stringify(preOp.attributes) === JSON.stringify(op.attributes)) {
      newDeltaOps[newDeltaOps.length - 1].insert = newDeltaOps[newDeltaOps.length - 1].insert + op.insert
    } else {
      newDeltaOps.push(op)
    }
  })

  return newDeltaOps
}

export function replaceContentDeltaOps(
  deltaOps: any[],
  original: string,
  replace: string,
): {
  newOps: any[]
  count: number
} {
  const newOps: any[] = []
  let count = 0

  deltaOps.forEach((op) => {
    if (op.insert && op.insert.includes(original)) {
      // 创建正则表达式对象
      const regex = new RegExp(original, 'g')
      // 匹配所有匹配项
      const matches = op.insert.match(regex)
      // 计算匹配次数
      const replaceCount = matches ? matches.length : 0
      // 累加替换次数
      count += replaceCount

      // 执行替换
      const newInsert = op.insert.replace(regex, replace)
      newOps.push({...op, insert: newInsert})
    } else {
      newOps.push(op)
    }
  })

  return {newOps, count}
}
