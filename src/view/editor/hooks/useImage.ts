export function useImage() {
  const imageUrl = (icon: string) => {
    const extension = icon.endsWith('.svg') ? '.svg' : '.png'
    return new URL(`../assets/${icon}${extension}`, import.meta.url).href
  }

  const imageAbsolute = (path: string) => {
    return new URL(path, import.meta.url).href
  }

  return {
    imageUrl,
    imageAbsolute,
  }
}
