import {defaultDpi} from '@/view/editor/utils/common-modle'
import {getConfigCommonData} from '@/lib/util'

export const fontFaceList: Record<any, any>[] = [
  {
    file: 'OPlusSans3',
    list: [
      {
        prefix: 'OPlusSans3-',
        suffix: 'ttf',
        children: ['Bold', 'ExtraLight', 'Light', 'Medium', 'Regular'],
      },
    ],
  },
  {
    file: 'SourceHanSans',
    list: [
      {
        prefix: 'SourceHanSans-',
        suffix: 'otf',
        children: ['Normal', 'Bold', 'ExtraLight', 'Light', 'Medium', 'Regular', 'Heavy'],
      },
      {
        prefix: 'SourceHanSansSC-',
        suffix: 'otf',
        children: ['VF'],
      },
    ],
  },
  {
    file: 'NotoSansDevanagari',
    list: [
      {
        prefix: 'NotoSansDevanagari-',
        suffix: 'ttf',
        children: ['Black', 'Bold', 'ExtraBold', 'ExtraLight', 'Light', 'Medium', 'Regular', 'SemiBold', 'Thin'],
      },
      {
        prefix: 'NotoSansDevanagari_Condensed-',
        suffix: 'ttf',
        children: ['Black', 'Bold', 'ExtraBold', 'ExtraLight', 'Light', 'Medium', 'Regular', 'SemiBold', 'Thin'],
      },
      {
        prefix: 'NotoSansDevanagari_ExtraCondensed-',
        suffix: 'ttf',
        children: ['Black', 'Bold', 'ExtraBold', 'ExtraLight', 'Light', 'Medium', 'Regular', 'SemiBold', 'Thin'],
      },
      {
        prefix: 'NotoSansDevanagari_SemiCondensed-',
        suffix: 'ttf',
        children: ['Black', 'Bold', 'ExtraBold', 'ExtraLight', 'Light', 'Medium', 'Regular', 'SemiBold', 'Thin'],
      },
    ],
  },
  {
    file: 'Yaber-Japanese',
    list: [
      {
        prefix: '',
        suffix: 'ttf',
        children: ['Future-Circle-Bold', 'Future-Circle-Light', 'Future-Circle-Medium', 'Future-Circle-Regular', 'Future-Circle-Thin', 'Future-Circle-Ultralight'],
      },
    ],
  },
  {
    file: 'Arial',
    list: [
      {
        prefix: 'Arial',
        suffix: 'ttf',
        children: ['', ' Black', ' Bold', ' Bold Italic', ' Italic', ' Narrow', ' Narrow Bold', ' Narrow Bold Italic', ' Narrow Italic', ' Rounded Bold'],
      },
    ],
  },
  {
    file: 'Poppins-Complete',
    list: [
      {
        prefix: 'Poppins-',
        suffix: 'otf',
        children: [
          'Black',
          'BlackItalic',
          'Bold',
          'BoldItalic',
          'ExtraBold',
          'ExtraBoldItalic',
          'ExtraLight',
          'ExtraLightItalic',
          'Italic',
          'Light',
          'LightItalic',
          'Medium',
          'MediumItalic',
          'Regular',
          'SemiBold',
          'SemiBoldItalic',
          'Thin',
          'ThinItalic',
        ],
      },
    ],
  },
]

export let fontSizeWithPound: Record<any, any>[] = [
  {title: '5.5', poundNum: 5.5, pxNum: 19},
  {title: '6', poundNum: 6, pxNum: 21},
  {title: '6.5', poundNum: 6.5, pxNum: 22},
  {title: '7', poundNum: 7, pxNum: 24},
  {title: '7.5', poundNum: 7.5, pxNum: 26},
  {title: '8', poundNum: 8, pxNum: 28},
  {title: '8.5', poundNum: 8.5, pxNum: 29},
  {title: '9', poundNum: 9, pxNum: 31},
  {title: '9.5', poundNum: 9.5, pxNum: 33},
  {title: '10', poundNum: 10, pxNum: 35},
  {title: '10.5', poundNum: 10.5, pxNum: 37},
  {title: '11', poundNum: 11, pxNum: 38},
  {title: '11.5', poundNum: 11.5, pxNum: 40},
  {title: '12', poundNum: 12, pxNum: 42},
  {title: '12.5', poundNum: 12.5, pxNum: 44},
  {title: '13', poundNum: 13, pxNum: 45},
  {title: '13.5', poundNum: 13.5, pxNum: 47},
  {title: '14', poundNum: 14, pxNum: 49},
  {title: '14.5', poundNum: 14.5, pxNum: 51},
  {title: '14', poundNum: 14, pxNum: 49},
  {title: '14.5', poundNum: 14.5, pxNum: 51},
  {title: '15', poundNum: 15, pxNum: 52},
  {title: '15.5', poundNum: 15.5, pxNum: 54},
  {title: '16', poundNum: 16, pxNum: 56},
  {title: '16.5', poundNum: 16.5, pxNum: 58},
  {title: '17', poundNum: 17, pxNum: 59},
  {title: '17.5', poundNum: 17.5, pxNum: 61},
  {title: '18', poundNum: 18, pxNum: 63},
  {title: '18.5', poundNum: 18.5, pxNum: 65},
  {title: '19', poundNum: 19, pxNum: 67},
  {title: '19.5', poundNum: 19.5, pxNum: 68},
  {title: '20', poundNum: 20, pxNum: 70},
  {title: '20.5', poundNum: 20.5, pxNum: 72},
  {title: '21', poundNum: 21, pxNum: 74},
  {title: '21.5', poundNum: 21.5, pxNum: 75},
  {title: '22', poundNum: 22, pxNum: 77},
  {title: '22.5', poundNum: 22.5, pxNum: 79},
  {title: '23', poundNum: 23, pxNum: 81},
  {title: '23.5', poundNum: 23.5, pxNum: 82},
  {title: '24', poundNum: 24, pxNum: 84},
  {title: '八号(5)', poundNum: 5, pxNum: 17},
  {title: '七号(5.5)', poundNum: 5.5, pxNum: 19},
  {title: '小六(6.5)', poundNum: 6.5, pxNum: 22},
  {title: '六号(7.5)', poundNum: 7.5, pxNum: 26},
  {title: '小五(9)', poundNum: 9, pxNum: 31},
  {title: '五号(10.5)', poundNum: 10.5, pxNum: 37},
  {title: '小四(12)', poundNum: 12, pxNum: 42},
  {title: '四号(14)', poundNum: 14, pxNum: 49},
  {title: '小三(15)', poundNum: 15, pxNum: 52},
  {title: '三号(16)', poundNum: 16, pxNum: 56},
  {title: '小二(18)', poundNum: 18, pxNum: 63},
  {title: '二号(22)', poundNum: 22, pxNum: 77},
  {title: '小一(24)', poundNum: 24, pxNum: 84},
  {title: '一号(26)', poundNum: 26, pxNum: 91},
  {title: '小初(36)', poundNum: 36, pxNum: 127},
  {title: '初号(42)', poundNum: 42, pxNum: 148},
]

export function configFontSizeWithPound() {
  fontSizeWithPound = fontSizeWithPound.map((item: any) => {
    return {...item, pxNum: dealFontsizePt2Px(item.poundNum)}
  })
}

export const fontsizeNameRecord: Record<string, number> = {
  '6': 25,
  '7': 29,
  '8': 33,
  '10': 41,
  '14': 58,
  '16': 66,
  '18': 75,
  '19': 79,
  '20': 83,
  '5.5': 22,
  '八号(5)': 20,
  '七号(5.5)': 22,
  '小六(6.5)': 27,
  '六号(7.5)': 31,
  '小五(9)': 37,
  '五号(10.5)': 43,
  '小四(12)': 50,
  '四号(14)': 58,
  '小三(15)': 62,
  '三号(16)': 66,
  '小二(18)': 75,
  '二号(22)': 91,
  '小一(24)': 100,
  '一号(26)': 108,
  '小初(36)': 150,
  '初号(42)': 175,
}

export const fontsizeDesRecord: Record<number, string> = {
  '20': '八号(5)',
  '22': '七号(5.5)',
  '25': '6',
  '27': '小六(6.5)',
  '29': '7',
  '31': '六号(7.5)',
  '33': '8',
  '37': '小五(9)',
  '41': '10',
  '43': '五号(10.5)',
  '50': '小四(12)',
  '58': '四号(14)',
  '62': '小三(15)',
  '66': '三号(16)',
  '75': '小二(18)',
  '79': '19',
  '83': '20',
  '91': '二号(22)',
  '100': '小一(24)',
  '108': '一号(26)',
  '150': '小初(36)',
  '175': '初号(42)',
}

export function dealFontSizeWithPound() {
  // const pounds: any[] = []
  // const poundsDes: any = {}
  fontSizeWithPound.forEach((item: any) => {
    // const pt2px = defaultDpi / 72
    // const pxNum = Math.floor(Number((item.poundNum * pt2px).toFixed(5)))
    // pounds.push({...item, pxNum: pxNum})
    // poundsDes[item.title] = pxNum
    fontsizeDesRecord[item.pxNum] = item.title
    fontsizeNameRecord[item.title] = item.pxNum
  })
  // console.log('pounds', pounds)

  // Object.keys(fontsizeNameRecord).forEach((item) => {
  //   poundsDes[fontsizeNameRecord[item]] = item
  // })
}

export function dealFontsizePt2Px(poundNum: number): number {
  const pt2px = defaultDpi / 72
  return Math.floor(Number((poundNum * pt2px).toFixed(5)))
}

export function dealFontsizePx2Pt(px: number): number {
  const pt2px = defaultDpi / 72
  return Math.floor(Number((px / pt2px).toFixed(0)))
}

export function configFontMap() {
  getConfigCommonData('font-list').then((res: any) => {
    const data = res.data as Array<any>
    const langList = new Set(data.map((item: any) => item.lang))
    let newLang = []
    for (const lang of langList) {
      if (lang.includes('/')) {
        newLang.push(...lang.split('/'))
      } else if (lang !== '') {
        newLang.push(lang)
      }
    }
    newLang = newLang.filter((item: any) => item.lang !== '')
    const _currentDefaultFontMap: Record<string, any> = {}
    newLang = Array.from(new Set(newLang))
    data.forEach((item: any) => {
      newLang.forEach((lang: any) => {
        if (item.lang.includes(lang)) {
          if (!_currentDefaultFontMap[lang]) {
            _currentDefaultFontMap[lang] = {} as Record<string, any>
          }
          _currentDefaultFontMap[lang][item.type] = {...item, pxSize: dealFontsizePt2Px(item.size)}
        }
      })
    })

    console.log(JSON.stringify(_currentDefaultFontMap))
  })
}

export const fontLineHeightList = ['0', '0-1', '0-2', '0-4', '0-6', '0-8', '1-0', '1-25', '1-5', '1-75', '2-0', '2-2', '2-5', '3-0']
export const fontAfterLineHeightList = [
  '0',
  '2',
  '4',
  '6',
  '8',
  '10',
  '12',
  '14',
  '16',
  '18',
  '20',
  '22',
  '24',
  '26',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  '46',
  '48',
  '50',
  '52',
  '54',
  '56',
  '58',
  '60',
  '62',
  '64',
  '66',
  '68',
  '70',
  '72',
  '74',
  '76',
  '78',
  '80',
  '90',
  '100',
  '110',
  '120',
  '130',
  '140',
  '150',
  '160',
]
export const fontLetterSpaceList = ['normal', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30']
