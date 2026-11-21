import { useEffect, useState } from 'react'
import type { GifItem } from '../types/types'
import { gifStorage } from '../utils/storage'

type UseGifStorageOptions = {
  recentLimit?: number
  favoritesLimit?: number
}

export const useGifStorage = (options: UseGifStorageOptions = {}) => {
  const { recentLimit, favoritesLimit } = options
  const [recent, setRecent] = useState<GifItem[]>([])
  const [favorites, setFavorites] = useState<GifItem[]>([])

  useEffect(() => {
    setRecent(gifStorage.getRecent())
    setFavorites(gifStorage.getFavorites())
  }, [])

  const addRecent = (gif: GifItem) => {
    setRecent(gifStorage.addRecent(gif, recentLimit))
  }

  const addFavorite = (gif: GifItem) => {
    setFavorites(gifStorage.addFavorite(gif, favoritesLimit))
  }

  const removeFavorite = (gifId: string) => {
    setFavorites(gifStorage.removeFavorite(gifId))
  }

  const toggleFavorite = (gif: GifItem) => {
    const result = gifStorage.toggleFavorite(gif, favoritesLimit)
    setFavorites(result.items)
    return result.isFavorite
  }

  const isFavorite = (gifId: string) =>
    favorites.some((item) => item.id === gifId)

  const clearRecent = () => {
    gifStorage.clearRecent()
    setRecent([])
  }

  const clearFavorites = () => {
    gifStorage.clearFavorites()
    setFavorites([])
  }

  return {
    recent,
    favorites,
    addRecent,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearRecent,
    clearFavorites,
  }
}
