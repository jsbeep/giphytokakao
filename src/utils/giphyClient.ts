import { apiKeyStorage } from './apiKeyStorage'

export type GiphyQuery =
  | { type: 'trending' }
  | { type: 'search'; q: string }
  | { type: 'gif'; id: string }

export type GiphyResponse = {
  response: Response
  usingPersonalKey: boolean
}

export type DefaultKeyQuota =
  | { enabled: false }
  | { enabled: true; limit: number; remaining: number; resetAt: number; windowSec: number }

export type KeyCheckResult = 'ok' | 'invalid' | 'rate_limited' | 'network'

const GIPHY_API = 'https://api.giphy.com/v1/gifs'

const directUrl = (query: GiphyQuery, apiKey: string) => {
  switch (query.type) {
    case 'trending':
      return `${GIPHY_API}/trending?${new URLSearchParams({ api_key: apiKey, limit: String(__GIPHY_TREND_LIMIT__), rating: 'g' })}`
    case 'search':
      return `${GIPHY_API}/search?${new URLSearchParams({ api_key: apiKey, q: query.q, limit: String(__GIPHY_SEARCH_LIMIT__), rating: 'g' })}`
    case 'gif':
      return `${GIPHY_API}/${encodeURIComponent(query.id)}?${new URLSearchParams({ api_key: apiKey })}`
  }
}

const proxyUrl = (query: GiphyQuery) => `/api/giphy?${new URLSearchParams(query)}`

/**
 * With a personal key the browser calls GIPHY directly, so the key never reaches this site's server.
 * Without one the request goes through /api/giphy, which uses the server's rate-limited default key.
 */
export const fetchGiphy = async (query: GiphyQuery): Promise<GiphyResponse> => {
  const apiKey = apiKeyStorage.get()
  const response = await fetch(apiKey ? directUrl(query, apiKey) : proxyUrl(query))
  return { response, usingPersonalKey: Boolean(apiKey) }
}

/** error code from /api/giphy's JSON body, e.g. DEFAULT_QUOTA_EXCEEDED */
export const readErrorCode = async (response: Response): Promise<string | null> => {
  try {
    const body = await response.clone().json()
    return typeof body?.error === 'string' ? body.error : null
  } catch {
    return null
  }
}

/** one cheap direct call to GIPHY to confirm a key works before it's saved */
export const checkGiphyKey = async (apiKey: string): Promise<KeyCheckResult> => {
  try {
    const params = new URLSearchParams({ api_key: apiKey, limit: '1', rating: 'g' })
    const response = await fetch(`${GIPHY_API}/trending?${params}`)
    if (response.ok) return 'ok'
    if (response.status === 429) return 'rate_limited'
    if (response.status === 401 || response.status === 403) return 'invalid'
    return 'network'
  } catch {
    return 'network'
  }
}

export const fetchDefaultKeyQuota = async (): Promise<DefaultKeyQuota | null> => {
  try {
    const response = await fetch('/api/giphy?type=quota')
    return response.ok ? ((await response.json()) as DefaultKeyQuota) : null
  } catch {
    return null
  }
}
