import { useEffect } from 'react'
import type { GifItem } from '../types/types'
import { getTemplateIdForGif } from '../utils/kakao'

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || 'APP KEY'
const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'

let kakaoSdkPromise: Promise<void> | null = null

// Loaded on demand (idle/first share) instead of statically in index.html so it
// doesn't compete with critical resources for bandwidth during initial page load.
function loadKakaoSdk(): Promise<void> {
  if (window.Kakao) {
    return Promise.resolve()
  }
  if (!kakaoSdkPromise) {
    kakaoSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = KAKAO_SDK_SRC
      script.onload = () => resolve()
      script.onerror = () => {
        kakaoSdkPromise = null
        reject(new Error('Failed to load Kakao SDK'))
      }
      document.head.appendChild(script)
    })
  }
  return kakaoSdkPromise
}

type UseKakaoShareOptions = {
  onError?: (message: string) => void
}

export const useKakaoShare = (options: UseKakaoShareOptions = {}) => {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadKakaoSdk().then(() => {
        const kakao = window.Kakao
        if (kakao && !kakao.isInitialized()) {
          kakao.init(KAKAO_APP_KEY)
        }
      })
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const handleShare = async (gif: GifItem) => {
    try {
      await loadKakaoSdk()
    } catch {
      options.onError?.('카카오 SDK를 불러오지 못했습니다.')
      return
    }

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

    fetch(`/api/share?gifId=${encodeURIComponent(gif.id)}`, { keepalive: true }).catch(() => {
      // best-effort metric ping, ignore failures
    })
  }

  return { handleShare }
}
