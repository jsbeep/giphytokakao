import { useState } from 'react'
import type { ApiAlert, GifItem, errorType } from '../types/types'
import { delay, mapGifs } from '../utils/giphy'
import { giphyCache } from '../utils/giphyCache'
import { fetchGiphy, readErrorCode, type GiphyResponse } from '../utils/giphyClient'

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

  const fail = (code: string, alert?: ApiAlert): never => {
    if (alert) {
      setApiAlert(alert)
    }
    throw new Error(code)
  }

  const handleApiResponse = async ({ response, usingPersonalKey }: GiphyResponse) => {
    if (response.ok) {
      return
    }

    // codes only /api/giphy sends: the default key is used up, or this deployment has none
    const code = usingPersonalKey ? null : await readErrorCode(response)
    if (code === 'DEFAULT_QUOTA_EXCEEDED') {
      fail(code, {
        type: 'limit',
        title: '기본 키 사용량 소진',
        message: '설정에서 내 GIPHY API 키를 등록하면 바로 계속 쓸 수 있어요.',
      })
    }
    if (code === 'API_KEY_REQUIRED') {
      fail(code, {
        type: 'invalid',
        title: 'API 키 필요',
        message: '이 사이트는 기본 키를 제공하지 않아요. 설정에서 내 GIPHY API 키를 등록해주세요.',
      })
    }

    if (response.status === 429) {
      fail('RATE_LIMIT', {
        type: 'limit',
        title: 'API 사용량 제한',
        message: usingPersonalKey
          ? '내 키의 GIPHY 사용량 한도에 도달했어요. 잠시 후 다시 시도해주세요.'
          : '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
      })
    }

    if (response.status === 401 || response.status === 403) {
      fail(usingPersonalKey ? 'INVALID_PERSONAL_KEY' : 'INVALID_KEY', {
        type: 'invalid',
        title: 'API 키 문제',
        message: usingPersonalKey
          ? '등록한 GIPHY API 키가 올바르지 않아요. 설정에서 키를 확인해주세요.'
          : '기본 키에 문제가 생겼어요. 설정에서 내 GIPHY API 키를 등록하면 바로 쓸 수 있어요.',
      })
    }

    fail('API_ERROR')
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
      const fetchPromise = fetchGiphy({ type: 'trending' }).then(async (result) => {
        await handleApiResponse(result)
        const json = await result.response.json()
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
      const fetchPromise = fetchGiphy({ type: 'search', q: trimmed }).then(async (result) => {
        await handleApiResponse(result)
        const json = await result.response.json()
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
      const result = await fetchGiphy({ type: 'gif', id: gifId })
      await handleApiResponse(result)
      const json = await result.response.json()
      const item = mapGifs([json.data || {}], true)[0]
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
