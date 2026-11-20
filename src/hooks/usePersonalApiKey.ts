import { useState } from 'react'
import { apiKeyStorage } from '../utils/apiKeyStorage'

export const usePersonalApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => apiKeyStorage.get())

  const saveApiKey = (key: string) => {
    apiKeyStorage.set(key)
    setApiKey(key)
  }

  const clearApiKey = () => {
    apiKeyStorage.clear()
    setApiKey(null)
  }

  return { apiKey, saveApiKey, clearApiKey }
}
