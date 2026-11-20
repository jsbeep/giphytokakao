const API_KEY_STORAGE_KEY = 'giphytokakao:giphyApiKey'

// fallback for browsers that block localStorage (e.g. some private modes): the key lasts until the tab closes
let memoryKey: string | null = null

/** the visitor's own GIPHY key: kept on this device only and never sent to this site's server */
export const apiKeyStorage = {
  get: (): string | null => {
    try {
      return window.localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() || memoryKey
    } catch {
      return memoryKey
    }
  },
  set: (key: string) => {
    memoryKey = key
    try {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, key)
    } catch {
      // memoryKey keeps it usable for this session
    }
  },
  clear: () => {
    memoryKey = null
    try {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY)
    } catch {
      // nothing stored to remove
    }
  },
}

export const maskApiKey = (key: string) =>
  key.length <= 8 ? '•'.repeat(key.length) : `${key.slice(0, 4)}${'•'.repeat(8)}${key.slice(-4)}`
