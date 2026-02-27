import {type IComponentInfo} from '@/view/editor/utils/common-modle'
import {optTextHtml} from '@/lib/pdf-util'
import {type FontSizeInfoType, useTextEditorStore} from '@/store/textEdiotrSotre'
import {dealFontsizePt2Px, fontLineHeightList, fontSizeWithPound} from '@/lib/font-face-list'

let fontsizeListPx: number[] = []

export async function configTextComponentAutoResize(textComponent: IComponentInfo, editorFontList: string[], lang: string) {
  let optInfo: any = {difference: 0}
  let textFontInfo = useTextEditorStore().allFontMap[lang ?? 'cn']?.[textComponent.textType ?? 'Yaber正文'] ?? {
    type: 'Yaber正文',
    lang: '英/西/法/德/意/芬兰/捷克/丹麦/印尼/挪威/波兰/葡萄牙/瑞典/土耳其/',
    size: 7,
    font: 'Poppins-Regular',
    pxSize: 24,
  }

  if (!textFontInfo) {
    textFontInfo = {
      type: 'Yaber正文',
      lang: '英/西/法/德/意/芬兰/捷克/丹麦/印尼/挪威/波兰/葡萄牙/瑞典/土耳其/',
      size: 7,
      font: 'Poppins-Regular',
      pxSize: 24,
    }
  }
  let changeNum = 0
  if (!textComponent.deltaOps || textComponent.deltaOps.length === 0) {
    return {change: changeNum > 0, component: textComponent}
  }
  configFontsizeList()
  do {
    optInfo = await optTextHtml(textComponent, editorFontList, textComponent.lang ?? lang, textFontInfo, 200)
    if (optInfo.difference > 10) {
      configTextHeight(textComponent, optInfo.difference, textFontInfo)
      changeNum++
    }
    // console.log('optInfo', optInfo)
    // console.log('optInfo-changeNum', changeNum)
  } while (optInfo?.difference > 10 && changeNum < 6)
  // {
  //   changeNum++
  //   textClone = configTextHeight(textClone, optInfo.difference, textFontInfo)
  //   optInfo = await optTextHtml(textClone, editorFontList, lang, textFontInfo, 100)
  // }

  return {change: changeNum > 0, component: textComponent}
}

function configTextHeight(componentInfo: IComponentInfo, difference: number, textFontInfo: FontSizeInfoType) {
  const textComponent = componentInfo
  const changeSizePx = difference > 100 ? 6 : difference > 50 ? 3 : 3
  // const heightDelta = textComponent.deltaOps.find((item) => item.attributes && item.attributes[EditorTextActionType.LineHeight])
  let changeFontSize = 12
  for (const delta of textComponent.deltaOps) {
    if (delta?.attributes?.size) {
      const fontsizeNum = Number(delta.attributes.size.replace('px', ''))
      const fontsizeIndex = fontsizeListPx.indexOf(fontsizeNum)
      changeFontSize = Math.max(12, fontsizeNum - changeSizePx)
      if (fontsizeIndex > -1 && changeFontSize > fontsizeListPx[fontsizeIndex - 1]) {
        changeFontSize = fontsizeListPx[fontsizeIndex - 1]
      }
      if (!changeFontSize) {
        changeFontSize = 12
      }
      delta.attributes = {...(delta.attributes ?? {}), ...{size: changeFontSize + 'px'}}
      console.log('changeFontLineHeight-s' + componentInfo.componentId, delta.attributes)
    } else {
      const fontsizeIndex = fontsizeListPx.indexOf(textFontInfo.pxSize)
      changeFontSize = textFontInfo.pxSize - changeSizePx
      if (fontsizeIndex > -1) {
        changeFontSize = fontsizeListPx[fontsizeIndex - 1]
      }
      if (!changeFontSize) {
        changeFontSize = 12
      }
      delta.attributes = {...(delta.attributes ?? {}), ...{size: changeFontSize + 'px'}}
      // console.log('changeFontLineHeight-i' + componentInfo.componentId, delta.attributes)
    }
    if (delta.attributes?.['line-height']) {
      const curLineHeight = delta.attributes['line-height']
      const lineHeightIndex = fontLineHeightList.indexOf(curLineHeight)
      let changeFontLineHeight = fontLineHeightList[Math.max(5, lineHeightIndex - 1)]
      if (!changeFontLineHeight) {
        changeFontLineHeight = '1-0'
      }
      delta.attributes = {...(delta.attributes ?? {}), ...{'line-height': changeFontLineHeight}}
      // console.log('changeFontLineHeight-' + componentInfo.componentId, delta.attributes)
    } else {
      delta.attributes = {...(delta.attributes ?? {}), ...{'line-height': '1-0'}}
      // console.log('changeFontLineHeight-l' + componentInfo.componentId, delta.attributes)
    }
  }
  // console.log('configTextHeight', textComponent.lang, textComponent.text)
  return textComponent
}

function configFontsizeList() {
  if (fontsizeListPx.length === 0) {
    fontsizeListPx = fontSizeWithPound.map((item: any) => {
      return dealFontsizePt2Px(item.poundNum)
    })
    fontsizeListPx = Array.from(new Set(fontsizeListPx.sort((a, b) => a - b)))
  }
}

export async function computeTextOverflow(textComponent: IComponentInfo, editorFontList: string[], lang: string) {
  let textFontInfo = useTextEditorStore().allFontMap[lang ?? 'cn']?.[textComponent.textType ?? 'Yaber正文'] ?? {
    type: 'Yaber正文',
    lang: '英/西/法/德/意/芬兰/捷克/丹麦/印尼/挪威/波兰/葡萄牙/瑞典/土耳其/',
    size: 7,
    font: 'Poppins-Regular',
    pxSize: 24,
  }

  if (!textFontInfo) {
    textFontInfo = {
      type: 'Yaber正文',
      lang: '英/西/法/德/意/芬兰/捷克/丹麦/印尼/挪威/波兰/葡萄牙/瑞典/土耳其/',
      size: 7,
      font: 'Poppins-Regular',
      pxSize: 24,
    }
  }
  const optInfo = await optTextHtml(textComponent, editorFontList, textComponent.lang ?? lang, textFontInfo, 200)

  return optInfo.difference > 0
}
