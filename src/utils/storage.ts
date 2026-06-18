import type { GifItem } from '../types/types'

const STORAGE_PREFIX = 'giphytokakao'
const RECENT_KEY = `${STORAGE_PREFIX}:recent`
const FAVORITES_KEY = `${STORAGE_PREFIX}:favorites`
const DEFAULT_RECENT_LIMIT = 15
const DEFAULT_FAVORITES_LIMIT = 20

const isBrowser = () => typeof window !== 'undefined'

const readItems = (key: string): GifItem[] => {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as GifItem[]) : []
  } catch {
    return []
  }
}

const writeItems = (key: string, items: GifItem[]) => {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // ignore storage write failures
  }
}

const upsert = (items: GifItem[], gif: GifItem, limit: number) => {
  const next = [gif, ...items.filter((item) => item.id !== gif.id)]
  return next.slice(0, limit)
}

const removeById = (items: GifItem[], gifId: string) =>
  items.filter((item) => item.id !== gifId)

export const gifStorage = {
  getRecent: () => readItems(RECENT_KEY),
  getFavorites: () => readItems(FAVORITES_KEY),
  addRecent: (gif: GifItem, limit = DEFAULT_RECENT_LIMIT) => {
    const next = upsert(readItems(RECENT_KEY), gif, limit)
    writeItems(RECENT_KEY, next)
    return next
  },
  removeRecent: (gifId: string) => {
    const next = removeById(readItems(RECENT_KEY), gifId)
    writeItems(RECENT_KEY, next)
    return next
  },
  addFavorite: (gif: GifItem, limit = DEFAULT_FAVORITES_LIMIT) => {
    const next = upsert(readItems(FAVORITES_KEY), gif, limit)
    writeItems(FAVORITES_KEY, next)
    return next
  },
  removeFavorite: (gifId: string) => {
    const next = removeById(readItems(FAVORITES_KEY), gifId)
    writeItems(FAVORITES_KEY, next)
    return next
  },
  toggleFavorite: (gif: GifItem, limit = DEFAULT_FAVORITES_LIMIT) => {
    const current = readItems(FAVORITES_KEY)
    const isFavorite = current.some((item) => item.id === gif.id)
    const next = isFavorite
      ? removeById(current, gif.id)
      : upsert(current, gif, limit)
    writeItems(FAVORITES_KEY, next)
    return { items: next, isFavorite: !isFavorite }
  },
  isFavorite: (gifId: string) =>
    readItems(FAVORITES_KEY).some((item) => item.id === gifId),
  clearRecent: () => writeItems(RECENT_KEY, []),
  clearFavorites: () => writeItems(FAVORITES_KEY, []),
}
