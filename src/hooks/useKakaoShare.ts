import { useEffect } from 'react'
import type { GifItem } from '../types/types'
import { getTemplateIdForGif } from '../utils/kakao'

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || 'APP KEY'

type UseKakaoShareOptions = {
  onError?: (message: string) => void
}

export const useKakaoShare = (options: UseKakaoShareOptions = {}) => {
  useEffect(() => {
    const kakao = window.Kakao
    if (!kakao) {
      return
    }

    if (!kakao.isInitialized()) {
      kakao.init(KAKAO_APP_KEY)
    }
  }, [])

  const handleShare = (gif: GifItem) => {
    const kakao = window.Kakao
    if (!kakao) {
      options.onError?.('카카오 SDK를 불러오지 못했습니다.')
      return
    }

    if (!kakao.isInitialized()) {
      kakao.init(KAKAO_APP_KEY)
    }

    const shareParams = `?send=${encodeURIComponent(gif.id)}`

    kakao.Share.sendCustom({
      templateId: getTemplateIdForGif(gif),
      templateArgs: {
        web_mobile: shareParams,
        web_PC: shareParams,
        THU: gif.originalUrl,
      },
    })
  }

  return { handleShare }
}
