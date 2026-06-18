import { useState } from 'react'
import type { ApiAlert, GifItem, errorType } from '../types/types'
import { delay, mapGifs } from '../utils/giphy'

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'API KEY'
const TREND_LIMIT = 15
const SEARCH_LIMIT = 8
const MIN_LOADING_TIME = 300

type UseGiphyOptions = {
  onUpdateUrl?: (query: string) => void
  onFeaturedTitle?: (title: string) => void
}

export const useGiphy = (options: UseGiphyOptions = {}) => {
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [activeQuery, setActiveQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<errorType>(null)
  const [apiAlert, setApiAlert] = useState<ApiAlert | null>(null)
  const [featuredGif, setFeaturedGif] = useState<GifItem | null>(null)
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(false)
  const [isSendMode, setIsSendMode] = useState(false)

  const setRateLimitAlert = () => {
    setApiAlert({
      type: 'limit',
      title: 'API 사용량 제한',
      message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
    })
  }

  const setInvalidKeyAlert = () => {
    setApiAlert({
      type: 'invalid',
      title: 'API 키 문제',
      message: '키가 존재하지 않거나 잘못되었습니다. 환경변수를 확인해주세요.',
    })
  }

  const handleApiResponse = (response: Response) => {
    // console.count('loadTrending')
    if (response.status === 429) {
      setRateLimitAlert()
      throw new Error('RATE_LIMIT')
    }

    if (response.status === 401 || response.status === 403) {
      setInvalidKeyAlert()
      throw new Error('INVALID_KEY')
    }

    if (!response.ok) {
      throw new Error('API_ERROR')
    }
  }

  const loadTrending = async (preserveUrl = false) => {
    if (!GIPHY_API_KEY) {
      setError('API_KEY_MISSING')
      setInvalidKeyAlert()
      return
    }

    setError(null)
    setApiAlert(null)
    setIsLoading(true)
    if (!preserveUrl) {
      options.onUpdateUrl?.('')
    }

    try {
      const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
        limit: String(TREND_LIMIT),
        rating: 'g',
      })
      const fetchPromise = fetch(
        `https://api.giphy.com/v1/gifs/trending?${params.toString()}`,
      ).then(async (response) => {
        handleApiResponse(response)
        const json = await response.json()
        const items = mapGifs(json.data || [])
        setGifs(items)
        setKeywords(items.map((item) => item.title).slice(0, 10))
        setActiveQuery('')
      })

      await Promise.all([fetchPromise, delay(MIN_LOADING_TIME)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PLEASE_TRY_AGAIN')
    } finally {
      setIsLoading(false)
    }
  }

  const runSearch = async (query: string) => {
    if (!GIPHY_API_KEY) {
      setError('API_KEY_MISSING')
      setInvalidKeyAlert()
      return
    }

    const trimmed = query.trim()
    if (!trimmed) {
      setIsSendMode(false)
      setFeaturedGif(null)
      void loadTrending()
      return
    }

    setIsSendMode(false)
    setFeaturedGif(null)
    setError(null)
    setApiAlert(null)
    setIsLoading(true)
    options.onUpdateUrl?.(trimmed)

    try {
      const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
        q: trimmed,
        limit: String(SEARCH_LIMIT),
        rating: 'g',
      })
      const fetchPromise = fetch(
        `https://api.giphy.com/v1/gifs/search?${params.toString()}`,
      ).then(async (response) => {
        handleApiResponse(response)
        const json = await response.json()
        const items = mapGifs(json.data || [])
        if (items.length === 0) {
          setError('NO_RESULT')
        }
        setGifs(items)
        setActiveQuery(trimmed)
      })

      await Promise.all([fetchPromise, delay(MIN_LOADING_TIME)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PLEASE_TRY_AGAIN')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGifById = async (gifId: string) => {
    if (!GIPHY_API_KEY) {
      setError('API_KEY_MISSING')
      setInvalidKeyAlert()
      return
    }

    setError(null)
    setApiAlert(null)
    setIsFeaturedLoading(true)

    try {
      const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
      })
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/${encodeURIComponent(gifId)}?${params.toString()}`,
      )
      handleApiResponse(response)
      const json = await response.json()
      const item = mapGifs([json.data || {}])[0]
      if (item) {
        setFeaturedGif(item)
        options.onFeaturedTitle?.(item.title)
      } else {
        setFeaturedGif(null)
        console.log('No GIF found for ID:', gifId)
        setError('NO_RESULT')
      }
    } catch (err) {
      setFeaturedGif(null)
      setError(err instanceof Error ? err.message : 'PLEASE_TRY_AGAIN')
    } finally {
      setIsFeaturedLoading(false)
    }
  }

  return {
    gifs,
    keywords,
    activeQuery,
    isLoading,
    error,
    apiAlert,
    featuredGif,
    isFeaturedLoading,
    isSendMode,
    setIsSendMode,
    setFeaturedGif,
    loadTrending,
    runSearch,
    loadGifById,
    setError,
  }
}
