import type { GifItem } from '../types/types'

const POOL_KEY = 'giphytokakao:randomPool'
/** a stash older than this is dropped, so the dice doesn't keep serving an old batch */
const POOL_TTL_MS = 24 * 60 * 60 * 1000

/** one GIF waiting in the dice stash, with the search word it came from */
export type PoolEntry = {
  gif: GifItem
  keyword: string
  fetchedAt: number
}

const isBrowser = () => typeof window !== 'undefined'

const isPoolEntry = (value: unknown): value is PoolEntry => {
  const entry = value as PoolEntry | null
  return (
    typeof entry?.keyword === 'string' &&
    typeof entry.fetchedAt === 'number' &&
    typeof entry.gif?.id === 'string' &&
    typeof entry.gif.previewUrl === 'string' &&
    typeof entry.gif.originalUrl === 'string'
  )
}

/**
 * The dice's stash of GIFs in localStorage. Reading drops expired entries and entries whose keyword
 * is no longer configured, so a redeploy with new keywords takes effect right away.
 */
export const gifPoolStorage = {
  read: (keywords: readonly string[]): PoolEntry[] => {
    if (!isBrowser()) {
      return []
    }
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(POOL_KEY) || '[]')
      if (!Array.isArray(parsed)) {
        return []
      }
      const now = Date.now()
      return parsed.filter(
        (entry): entry is PoolEntry =>
          isPoolEntry(entry) && now - entry.fetchedAt < POOL_TTL_MS && keywords.includes(entry.keyword),
      )
    } catch {
      return []
    }
  },
  write: (entries: PoolEntry[]) => {
    if (!isBrowser()) {
      return
    }
    try {
      if (entries.length === 0) {
        window.localStorage.removeItem(POOL_KEY)
      } else {
        window.localStorage.setItem(POOL_KEY, JSON.stringify(entries))
      }
    } catch {
      // storage full or blocked: the dice still works, it just fetches more often
    }
  },
}
