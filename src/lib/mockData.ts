// Mock 图片数据 - 使用 base64 占位图片
const createPlaceholderImage = (width: number, height: number, text: string, color: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)
  }
  return canvas.toDataURL('image/png')
}

// 简单的占位图片 - 使用 data URI
const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E'

export const mockImageList = [
  {
    id: 'img-1',
    imgUrl: placeholderImage,
    width: '300',
    height: '200',
    category: '',
    type: 0
  },
  {
    id: 'img-2',
    imgUrl: placeholderImage,
    width: '400',
    height: '300',
    category: '',
    type: 0
  },
  {
    id: 'img-3',
    imgUrl: placeholderImage,
    width: '350',
    height: '250',
    category: '',
    type: 0
  },
  {
    id: 'img-4',
    imgUrl: placeholderImage,
    width: '500',
    height: '300',
    category: '',
    type: 0
  },
  {
    id: 'img-5',
    imgUrl: placeholderImage,
    width: '300',
    height: '300',
    category: '',
    type: 0
  },
  {
    id: 'img-6',
    imgUrl: placeholderImage,
    width: '400',
    height: '250',
    category: '',
    type: 0
  }
]

// Mock 图标数据 - 使用简单的 SVG 图标
const placeholderIcon = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%23666"%3EIcon%3C/text%3E%3C/svg%3E'

export const mockIconList = [
  {
    id: 'icon-1',
    imgUrl: placeholderIcon,
    width: '100',
    height: '100',
    category: '',
    type: 0
  },
  {
    id: 'icon-2',
    imgUrl: placeholderIcon,
    width: '100',
    height: '100',
    category: '',
    type: 0
  },
  {
    id: 'icon-3',
    imgUrl: placeholderIcon,
    width: '100',
    height: '100',
    category: '',
    type: 0
  },
  {
    id: 'icon-4',
    imgUrl: placeholderIcon,
    width: '100',
    height: '100',
    category: '',
    type: 0
  },
  {
    id: 'icon-5',
    imgUrl: placeholderIcon,
    width: '100',
    height: '100',
    category: '',
    type: 0
  },
  {
    id: 'icon-6',
    imgUrl: placeholderIcon,
    width: '100',
    height: '100',
    category: '',
    type: 0
  }
]

// Mock 分类数据
export const mockCategories = [
  {name: '全部', id: ''},
  {name: '风景', id: 'cat-1'},
  {name: '人物', id: 'cat-2'},
  {name: '图标', id: 'cat-3'}
]
