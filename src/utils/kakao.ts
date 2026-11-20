import type { GifItem } from '../types/types'

// width:height ratios for VITE_KAKAO_TEMPLATE_IDS, in this order: 1:2, 3:4, 1:1, 4:3, 2:1
const TEMPLATE_RATIOS = [1 / 2, 3 / 4, 1, 4 / 3, 2]

const templateIds = (import.meta.env.VITE_KAKAO_TEMPLATE_IDS || '')
  .split(',')
  .map((id) => Number(id.trim()))
  .filter((id) => Number.isInteger(id) && id > 0)

// a single ID is used for every GIF; five IDs pick the template closest to the GIF's ratio
const templateMap =
  templateIds.length === 1
    ? [{ ratio: 1, templateId: templateIds[0] }]
    : TEMPLATE_RATIOS.slice(0, templateIds.length).map((ratio, i) => ({ ratio, templateId: templateIds[i] }))

export const getTemplateIdForGif = (gif: GifItem): number | null => {
  if (templateMap.length === 0) {
    return null
  }

  const { originalWidth: width, originalHeight: height } = gif
  const ratio = width > 0 && height > 0 ? width / height : 1

  let closest = templateMap[0]
  for (const entry of templateMap) {
    if (Math.abs(ratio - entry.ratio) < Math.abs(ratio - closest.ratio)) {
      closest = entry
    }
  }

  return closest.templateId
}
