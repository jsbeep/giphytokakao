import type { GifItem } from '../types/types'

export const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

/** width / height of the GIF, or square when GIPHY left the size out */
export const gifAspectRatio = (gif: Pick<GifItem, 'originalWidth' | 'originalHeight'>) =>
  gif.originalWidth > 0 && gif.originalHeight > 0 ? gif.originalWidth / gif.originalHeight : 1

const normalizeTitle = (title: string) => {
  const cleaned = title.replace(/ GIF$/i, '').trim()
  return cleaned.length > 0 ? cleaned : 'Untitled'
}

export const mapGifs = (items: any[], highQualityPreview = false): GifItem[] =>
  items
    .map((item) => ({
      id: item.id,
      title: normalizeTitle(item.title || 'Untitled'),
      previewUrl: highQualityPreview
        ? item.images?.fixed_width?.url || item.images?.fixed_width_downsampled?.url
        : item.images?.fixed_width_downsampled?.url || item.images?.fixed_width?.url,
      originalUrl: item.images?.original?.url,
      originalWidth: Number(item.images?.original?.width) || 0,
      originalHeight: Number(item.images?.original?.height) || 0,
    }))
    .filter((item) => item.previewUrl && item.originalUrl)
