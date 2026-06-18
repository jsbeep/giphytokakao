import { useState } from 'react'
import type { GifItem } from '../types/types'

const SEND_HIGHLIGHT_MS = 850

type UseGifGridInteractionOptions = {
  onShareGif: (gif: GifItem) => void
  onAddRecent: (gif: GifItem) => void
}

/** touch-first share feedback + sticky hover for the gif grid: highlights the tapped gif until the send call lands, keeps the last-hovered gif's actions visible until another gif is hovered */
export const useGifGridInteraction = ({ onShareGif, onAddRecent }: UseGifGridInteractionOptions) => {
  const [sendingGifId, setSendingGifId] = useState<string | null>(null)
  const [hoveredGifId, setHoveredGifId] = useState<string | null>(null)

  const shareWithFeedback = (gif: GifItem, addToRecent = false) => {
    setSendingGifId(gif.id)
    onShareGif(gif)
    if (addToRecent) {
      onAddRecent(gif)
    }
    window.setTimeout(() => {
      setSendingGifId((current) => (current === gif.id ? null : current))
    }, SEND_HIGHLIGHT_MS)
  }

  return {
    sendingGifId,
    hoveredGifId,
    onHoverGif: setHoveredGifId,
    shareWithFeedback,
  }
}
