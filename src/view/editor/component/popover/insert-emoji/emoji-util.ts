import httpRequest from '@/net/httpRequest'

export const emojis: any[] = []

export function getEmojis() {
  return httpRequest.get('/emoji/tEmoji/getAll')
}
