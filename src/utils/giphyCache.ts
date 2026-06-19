import type { GifItem } from '../types/types'

const CACHE_KEY = 'giphytokakao:apiCache'
const CACHE_TTL_MS = 5 * 60 * 1000
const SEARCH_CACHE_LIMIT = Number(import.meta.env.VITE_SEARCH_CACHE_LIMIT) || 5

type SearchCacheEntry = {
  query: string
  items: GifItem[]
}

type GiphyCache = {
  timestamp: number
  trending: GifItem[] | null
  searches: SearchCacheEntry[]
}

const isBrowser = () => typeof window !== 'undefined'

const emptyCache = (): GiphyCache => ({
  timestamp: Date.now(),
  trending: null,
  searches: [],
})

const readCache = (): GiphyCache => {
  if (!isBrowser()) {
    return emptyCache()
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) {
      return emptyCache()
    }

    const parsed = JSON.parse(raw) as GiphyCache
    if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      window.localStorage.removeItem(CACHE_KEY)
      return emptyCache()
    }

    return parsed
  } catch {
    return emptyCache()
  }
}

const writeCache = (cache: Omit<GiphyCache, 'timestamp'>) => {
  if (!isBrowser()) {
    return
  }

  try {
    const next: GiphyCache = { ...cache, timestamp: Date.now() }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(next))
  } catch {
    // ignore storage write failures
  }
}

/** ms left before the cached trending/search results expire (0 if expired or missing) */
const getRemainingMs = (): number => {
  if (!isBrowser()) {
    return 0
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) {
      return 0
    }

    const parsed = JSON.parse(raw) as GiphyCache
    if (!parsed.timestamp) {
      return 0
    }

    return Math.max(0, CACHE_TTL_MS - (Date.now() - parsed.timestamp))
  } catch {
    return 0
  }
}

export const giphyCache = {
  getRemainingMs,
  getTrending: (): GifItem[] | null => readCache().trending,
  setTrending: (items: GifItem[]) => {
    const cache = readCache()
    writeCache({ ...cache, trending: items })
  },
  getSearch: (query: string): GifItem[] | null =>
    readCache().searches.find((entry) => entry.query === query)?.items ?? null,
  setSearch: (query: string, items: GifItem[]) => {
    const cache = readCache()
    const nextSearches = [
      { query, items },
      ...cache.searches.filter((entry) => entry.query !== query),
    ].slice(0, SEARCH_CACHE_LIMIT)
    writeCache({ ...cache, searches: nextSearches })
  },
}
