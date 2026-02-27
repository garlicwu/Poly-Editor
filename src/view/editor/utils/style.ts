import {addPxUnit} from './common'
import {fontAfterLineHeightList} from '@/lib/font-face-list'

const unitKeys = ['fontSize', 'lineHeight', 'borderWidth', 'borderRadius']
const textStyleKeys = ['fontSize', 'fontWeight', 'fontFamily', 'color', 'lineHeight', 'fontStyle', 'textDecoration', 'justifyContent', 'alignItems']

export function pickStyle(obj: AnyObject | undefined, flag: boolean = true) {
  if (!obj) return obj
  const result: AnyObject = {}
  const keys = Object.keys(obj).filter((key) => {
    return flag ? textStyleKeys.includes(key) : !textStyleKeys.includes(key)
  })
  for (const key of keys) {
    result[key] = unitKeys.includes(key) ? addPxUnit(obj[key]) : obj[key]
  }
  return result
}

type AnyObject = {[key in string]: any}

// 实现 pick 函数
export function pick(obj: AnyObject, keys: string[]) {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key]
    }
    return acc
  }, {} as AnyObject)
}

// 实现 omit 函数
export function omit(obj: AnyObject, keys: string[]) {
  return Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) {
      acc[key] = obj[key]
    }
    return acc
  }, {} as AnyObject)
}

let styleAll = ''

function generateOrderedListClass(x: number, y: number) {
  const paddingLeft = Number((y * (x * 0.5 + 0.85)).toFixed(2))
  const marginLeft = -paddingLeft

  const className = `custom-list-ordered-${x}-${y}`

  if (!document.querySelector(`style[data-class="${className}"]`)) {
    const style = document.createElement('style')
    style.setAttribute('data-class', className)
    style.textContent = `
            .${className} {
                padding-left: ${paddingLeft}px !important;
                counter-set: list-0 1;
                counter-increment: list-0;
                counter-reset: list-1 list-2;
            }
            
            .${className} .ql-ui:before {
                font-size: ${y}px;
                display: inline-block;
                margin-left: ${marginLeft}px !important;
                text-align: right;
                white-space: nowrap;
                content: counter(list-0, decimal) '. ' !important;
            }
        `

    // styleAll += `\n` + style.textContent
    document.head.appendChild(style)
  }

  return className
}

function generateOrderedListCircleClass(x: number, y: number) {
  const paddingLeft = Number((y * (x * 0.5 + 0.85)).toFixed(2))
  const marginLeft = -paddingLeft

  const className1 = `custom-list-ordered-circle-${x}-${y}`
  if (!document.querySelector(`style[data-class="${className1}"]`)) {
    const style = document.createElement('style')
    style.setAttribute('data-class', className1)
    style.textContent = `
            .${className1} {
                counter-set: list-0 1;
                counter-increment: list-0;
                counter-reset: list-1 list-2;
                padding-left: ${paddingLeft}px !important;
            }
            
            .${className1} .ql-ui:before {
                font-size: ${y - 7}px;
                display: inline-block;
                content: counter(list-0, decimal) '' !important;
                margin-left: ${marginLeft}px !important;
                width: ${y - 3}px !important;
                height: ${y - 3}px !important;
                border: 1px solid #000;
                border-radius: 50%;
                text-align: center !important;;
                line-height: ${y - 3}px;
            }
        `
    // styleAll += `\n` + style.textContent
    document.head.appendChild(style)
  }

  return className1
}

function generateOrderedListParenthesesClass(x: number, y: number) {
  const paddingLeft = Number((y * (x * 0.8 + 1)).toFixed(2))
  const marginLeft = -paddingLeft

  const className2 = `custom-list-ordered-parentheses-${x}-${y}`

  if (!document.querySelector(`style[data-class="${className2}"]`)) {
    const style = document.createElement('style')
    style.setAttribute('data-class', className2)
    style.textContent = `
            .${className2} {
                padding-left: ${paddingLeft}px !important;
                counter-set: list-0 1;
                counter-increment: list-0;
                counter-reset: list-1 list-2;
            }
            
            .${className2} .ql-ui:before {
                font-size: ${y}px;
                display: inline-block;
                margin-left: ${marginLeft}px !important;
                text-align: right;
                white-space: nowrap;
                content: '(' counter(list-0, decimal) ')' !important;
            }
        `
    // styleAll += `\n` + style.textContent
    document.head.appendChild(style)
  }

  return className2
}

function generateBulletListClass(x: number, y: number) {
  const paddingLeft = Number((y * (x * 0.5 + 0.85)).toFixed(2))
  const marginLeft = -Number((y * (x * 0.5 + 1)).toFixed(2))
  const marginRight = Number((y * 0.3).toFixed(2))
  const width = Number((y * 1.2).toFixed(2))

  const className = `custom-list-bullet-${x}-${y}`

  if (!document.querySelector(`style[data-class="${className}"]`)) {
    const style = document.createElement('style')
    style.setAttribute('data-class', className)
    style.textContent = `
            .${className} {
                padding-left: ${paddingLeft}px !important;
            }
            
            .${className} .ql-ui:before {
                font-size: ${y}px;
                display: inline-block;
                margin-left: ${marginLeft}px !important;       
                margin-right: ${marginRight}px;
                text-align: right;
                white-space: nowrap;
                width: ${width}px;
                content: '\\2022' !important;
            }
        `
    // styleAll += `\n` + style.textContent
    document.head.appendChild(style)
  }

  return className
}

function generateAfterLineClass(value: string) {
  const className = `ql-after-line-height-${value}`

  if (!document.querySelector(className)) {
    const style = document.createElement('style')
    // style.setAttribute('data-class', className)
    style.textContent = `
            .${className} {
               padding-bottom: ${value}px !important;
            }
        `
    // styleAll += `\n` + style.textContent
    document.head.appendChild(style)
  }

  return className
}

export function dynamicInitQuillStyle(element?: HTMLElement) {
  // const classNameList = []
  for (let i = 1; i < 4; i++) {
    for (let j = 7; j < 200; j++) {
      const dynamicClass = generateOrderedListClass(i, j)
      const dynamicClass1 = generateOrderedListCircleClass(i, j)
      const dynamicClass2 = generateOrderedListParenthesesClass(i, j)
      const dynamicBulletClass = generateBulletListClass(i, j)
      // classNameList.push(dynamicClass.toString().replace('custom-list-', ''))
      // classNameList.push(dynamicBulletClass.toString().replace('custom-list-', ''))
      element?.classList.add(dynamicClass)
      element?.classList.add(dynamicClass1)
      element?.classList.add(dynamicClass2)
      element?.classList.add(dynamicBulletClass)
    }
  }
  for (let i = 0; i < fontAfterLineHeightList.length; i++) {
    const dynamicClass4 = generateAfterLineClass(fontAfterLineHeightList[i])
    element?.classList.add(dynamicClass4)
  }
  // console.log('classNameList', styleAll)
}

function generateOrderedListStyle(x: number, y: number, element: HTMLElement) {
  const paddingLeft = Number((y * (x * 0.5 + 0.85)).toFixed(2))
  const marginLeft = -paddingLeft

  const className = `custom-list-ordered-${x}-${y}`

  const style = document.createElement('style')
  style.setAttribute('data-class', className)
  style.textContent = `
            .${className} {
                padding-left: ${paddingLeft}px !important;
                counter-set: list-0 1;
                counter-increment: list-0;
                counter-reset: list-1 list-2;
            }
            
            .${className} .ql-ui:before {
                font-size: ${y}px;
                display: inline-block;
                margin-left: ${marginLeft}px !important;
                text-align: right;
                white-space: nowrap;
                content: counter(list-0, decimal) '. ' !important;
            }
        `
  element.appendChild(style)
}

function generateOrderedListCircleStyle(x: number, y: number, element: HTMLElement) {
  const paddingLeft = Number((y * (x * 0.5 + 0.85)).toFixed(2))
  const marginLeft = -paddingLeft

  const className1 = `custom-list-ordered-circle-${x}-${y}`
  if (!document.querySelector(`style[data-class="${className1}"]`)) {
    const style = document.createElement('style')
    style.setAttribute('data-class', className1)
    style.textContent = `
            .${className1} {
                counter-set: list-0 1;
                counter-increment: list-0;
                counter-reset: list-1 list-2;
                padding-left: ${paddingLeft}px !important;
            }
            
            .${className1} .ql-ui:before {
                font-size: ${y - 7}px;
                display: inline-block;
                content: counter(list-0, decimal) '' !important;
                margin-left: ${marginLeft}px !important;
                width: ${y - 3}px !important;
                height: ${y - 3}px !important;
                border: 1px solid #000;
                border-radius: 50%;
                text-align: center !important;;
                line-height: ${y - 3}px;
            }
        `
    element.appendChild(style)
  }
}

function generateOrderedListParenthesesStyle(x: number, y: number, element: HTMLElement) {
  const paddingLeft = Number((y * (x * 0.8 + 1)).toFixed(2))
  const marginLeft = -paddingLeft

  const className2 = `custom-list-ordered-parentheses-${x}-${y}`

  if (!document.querySelector(`style[data-class="${className2}"]`)) {
    const style = document.createElement('style')
    style.setAttribute('data-class', className2)
    style.textContent = `
            .${className2} {
                padding-left: ${paddingLeft}px !important;
                counter-set: list-0 1;
                counter-increment: list-0;
                counter-reset: list-1 list-2;
            }
            
            .${className2} .ql-ui:before {
                font-size: ${y}px;
                display: inline-block;
                margin-left: ${marginLeft}px !important;
                text-align: right;
                white-space: nowrap;
                content: '(' counter(list-0, decimal) ')' !important;
            }
        `
    element.appendChild(style)
  }
}

function generateBulletListStyle(x: number, y: number, element: HTMLElement) {
  const paddingLeft = Number((y * (x * 0.5 + 0.85)).toFixed(2))
  const marginLeft = -Number((y * (x * 0.5 + 1)).toFixed(2))
  const marginRight = Number((y * 0.3).toFixed(2))
  const width = Number((y * 1.2).toFixed(2))

  const className = `custom-list-bullet-${x}-${y}`

  if (!document.querySelector(`style[data-class="${className}"]`)) {
    const style = document.createElement('style')
    style.setAttribute('data-class', className)
    style.textContent = `
            .${className} {
                padding-left: ${paddingLeft}px !important;
            }
            
            .${className} .ql-ui:before {
                font-size: ${y}px;
                display: inline-block;
                margin-left: ${marginLeft}px !important;       
                margin-right: ${marginRight}px;
                text-align: right;
                white-space: nowrap;
                width: ${width}px;
                content: '\\2022' !important;
            }
        `
    element.appendChild(style)
  }
}

function generateAfterLineStyle(value: string, element: HTMLElement) {
  const className = `ql-after-line-height-${value}`

  if (!document.querySelector(className)) {
    const style = document.createElement('style')
    // style.setAttribute('data-class', className)
    style.textContent = `
            .${className} {
               padding-bottom: ${value}px !important;
            }
        `
    element.appendChild(style)
  }
}

export function buildComponentWithRenderStyle(element: HTMLElement) {
  for (let i = 1; i < 4; i++) {
    for (let j = 7; j < 200; j++) {
      generateOrderedListStyle(i, j, element)
      generateOrderedListCircleStyle(i, j, element)
      generateOrderedListParenthesesStyle(i, j, element)
      generateBulletListStyle(i, j, element)
    }
  }
  for (let i = 0; i < fontAfterLineHeightList.length; i++) {
    generateAfterLineStyle(fontAfterLineHeightList[i], element)
  }
}
