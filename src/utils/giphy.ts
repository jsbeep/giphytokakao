import type { GifItem } from '../types/types'

export const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const normalizeTitle = (title: string) => {
  const cleaned = title.replace(/ GIF$/i, '').trim()
  return cleaned.length > 0 ? cleaned : 'Untitled'
}

export const mapGifs = (items: any[]): GifItem[] =>
  items
    .map((item) => ({
      id: item.id,
      title: normalizeTitle(item.title || 'Untitled'),
      previewUrl:
        item.images?.fixed_width_downsampled?.url ||
        item.images?.fixed_width?.url,
      originalUrl: item.images?.original?.url,
      originalWidth: Number(item.images?.original?.width) || 0,
      originalHeight: Number(item.images?.original?.height) || 0,
    }))
    .filter((item) => item.previewUrl && item.originalUrl)
