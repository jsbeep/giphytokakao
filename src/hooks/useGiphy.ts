import { useState } from 'react'
import type { ApiAlert, GifItem, errorType } from '../types/types'
import { delay, mapGifs } from '../utils/giphy'
import { CACHE_TTL_MS, giphyCache } from '../utils/giphyCache'

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
    setError(null)
    setApiAlert(null)
    if (!preserveUrl) {
      options.onUpdateUrl?.('')
    }

    const cached = giphyCache.getTrending()
    if (cached) {
      setGifs(cached)
      setKeywords(cached.map((item) => item.title).slice(0, 10))
      setActiveQuery('')
      return
    }

    setIsLoading(true)
    try {
      const fetchPromise = fetch('/api/giphy?type=trending').then(async (response) => {
        handleApiResponse(response)
        const json = await response.json()
        const items = mapGifs(json.data || [])
        setGifs(items)
        setKeywords(items.map((item) => item.title).slice(0, 10))
        setActiveQuery('')
        giphyCache.setTrending(items)
      })

      await Promise.all([fetchPromise, delay(MIN_LOADING_TIME)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PLEASE_TRY_AGAIN')
    } finally {
      setIsLoading(false)
    }
  }

  const runSearch = async (query: string) => {
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
    options.onUpdateUrl?.(trimmed)

    const cached = giphyCache.getSearch(trimmed)
    if (cached) {
      if (cached.length === 0) {
        setError('NO_RESULT')
      }
      setGifs(cached)
      setActiveQuery(trimmed)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({ type: 'search', q: trimmed })
      const fetchPromise = fetch(`/api/giphy?${params.toString()}`).then(async (response) => {
        handleApiResponse(response)
        const json = await response.json()
        const items = mapGifs(json.data || [])
        if (items.length === 0) {
          setError('NO_RESULT')
        }
        setGifs(items)
        setActiveQuery(trimmed)
        giphyCache.setSearch(trimmed, items)
      })

      await Promise.all([fetchPromise, delay(MIN_LOADING_TIME)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PLEASE_TRY_AGAIN')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGifById = async (gifId: string) => {
    setError(null)
    setApiAlert(null)
    setIsFeaturedLoading(true)

    try {
      const params = new URLSearchParams({ type: 'gif', id: gifId })
      const response = await fetch(`/api/giphy?${params.toString()}`)
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

  /** renders a shared gif straight from the Kakao link payload — no /api/giphy round trip */
  const hydrateFromShare = (gif: GifItem, trending: GifItem[], sharedAt: number) => {
    setError(null)
    setApiAlert(null)
    setFeaturedGif(gif)
    options.onFeaturedTitle?.(gif.title)

    const isFresh = trending.length > 0 && Date.now() - sharedAt <= CACHE_TTL_MS
    if (isFresh) {
      setGifs(trending)
      setKeywords(trending.map((item) => item.title).slice(0, 10))
      setActiveQuery('')
    } else {
      // sharer's trending snapshot is too old to show as-is — fetch a fresh one instead
      void loadTrending(true)
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
    hydrateFromShare,
    setError,
  }
}
