import type { GifItem } from '../types/types'

const templateMap = [   // GIF 비율별 템플릿 매핑
  { ratio: 1 / 2, templateId: 132837 },
  { ratio: 3 / 4, templateId: 132839 },
  { ratio: 1, templateId: 132821 },
  { ratio: 4 / 3, templateId: 132838 },
  { ratio: 2, templateId: 132840 },
]

export const getTemplateIdForGif = (gif: GifItem) => {
  const width = gif.originalWidth
  const height = gif.originalHeight
  if (width <= 0 || height <= 0) {
    return 132821
  }

  const ratio = width / height
  let closest = templateMap[0]
  let minDiff = Math.abs(ratio - closest.ratio)

  for (let i = 1; i < templateMap.length; i += 1) {
    const entry = templateMap[i]
    const diff = Math.abs(ratio - entry.ratio)
    if (diff < minDiff) {
      minDiff = diff
      closest = entry
    }
  }

  return closest.templateId
}
