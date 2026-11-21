import { useRef, useState } from 'react'
import type { GifItem, GifSendState } from '../types/types'

/** spinner first: KakaoTalk's share sheet takes a second or two to come up, and picking a friend takes a while too */
const SEND_SPINNER_MS = 1500
const SEND_CHECK_MS = 1200

type UseGifGridInteractionOptions = {
  onShareGif: (gif: GifItem) => void
  onAddRecent: (gif: GifItem) => void
}

/** touch-first share feedback + sticky hover for the gif grid: a spinner then a check on the tapped gif, keeps the last-hovered (or, on touch, last-tapped) gif's actions visible until another gif takes over */
export const useGifGridInteraction = ({ onShareGif, onAddRecent }: UseGifGridInteractionOptions) => {
  const [sendState, setSendState] = useState<GifSendState | null>(null)
  const [hoveredGifId, setHoveredGifId] = useState<string | null>(null)
  // the latest tap owns the feedback: an earlier tap's timers must not flip or clear it
  const sendSeqRef = useRef(0)

  const shareWithFeedback = (gif: GifItem, addToRecent = false) => {
    const seq = ++sendSeqRef.current
    setSendState({ id: gif.id, status: 'sending' })
    onShareGif(gif)
    if (addToRecent) {
      onAddRecent(gif)
    }
    window.setTimeout(() => {
      if (sendSeqRef.current === seq) {
        setSendState({ id: gif.id, status: 'sent' })
      }
    }, SEND_SPINNER_MS)
    window.setTimeout(() => {
      if (sendSeqRef.current === seq) {
        setSendState(null)
      }
    }, SEND_SPINNER_MS + SEND_CHECK_MS)
  }

  return {
    sendState,
    hoveredGifId,
    onHoverGif: setHoveredGifId,
    shareWithFeedback,
  }
}
