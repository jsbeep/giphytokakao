import { useState } from 'react'
import type { ApiAlert, GifItem, errorType } from '../types/types'
import { delay, mapGifs } from '../utils/giphy'
import { giphyCache } from '../utils/giphyCache'
import { fetchGiphy, readErrorCode, type GiphyResponse } from '../utils/giphyClient'

const MIN_LOADING_TIME = 300

type UseGiphyOptions = {
  onUpdateUrl?: (query: string) => void
}

export const useGiphy = (options: UseGiphyOptions = {}) => {
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [activeQuery, setActiveQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<errorType>(null)
  const [apiAlert, setApiAlert] = useState<ApiAlert | null>(null)

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
      void loadTrending()
      return
    }

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

  /**
   * One GIF by id (a shared link's). 'GIF_NOT_FOUND' when GIPHY has no such GIF (deleted, or a broken link),
   * with no error shown; null on any other failure, with the error shown like the loaders above.
   */
  const loadGifById = async (gifId: string): Promise<GifItem | 'GIF_NOT_FOUND' | null> => {
    setError(null)
    setApiAlert(null)

    try {
      const result = await fetchGiphy({ type: 'gif', id: gifId })
      // GIPHY answers 404 for an unknown id and 400 for a malformed one; /api/giphy passes both through
      if (result.response.status === 404 || result.response.status === 400) {
        return 'GIF_NOT_FOUND'
      }
      await handleApiResponse(result)
      const json = await result.response.json()
      return mapGifs([json.data || {}], true)[0] ?? 'GIF_NOT_FOUND'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PLEASE_TRY_AGAIN')
      return null
    }
  }

  /**
   * A batch of GIFs for the dice stash. Throws like the loaders above and shows the alert for key/quota
   * problems, unless quiet (a background top-up the user didn't ask for).
   */
  const fetchGifPool = async (
    keyword: string,
    limit: number,
    offset: number,
    { quiet = false }: { quiet?: boolean } = {},
  ): Promise<GifItem[]> => {
    const result = await fetchGiphy({ type: 'pool', q: keyword, limit, offset })
    if (quiet && !result.response.ok) {
      throw new Error('POOL_TOP_UP_FAILED')
    }
    await handleApiResponse(result)
    const json = await result.response.json()
    return mapGifs(json.data || [], true)
  }

  return {
    gifs,
    keywords,
    activeQuery,
    isLoading,
    error,
    apiAlert,
    loadTrending,
    runSearch,
    loadGifById,
    fetchGifPool,
    setError,
  }
}
