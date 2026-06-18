import type { IncomingMessage, ServerResponse } from 'node:http'
import { logMetric } from './_metrics'

const DEFAULT_TREND_LIMIT = 15
const DEFAULT_SEARCH_LIMIT = 8

// Persists for the lifetime of a warm function instance so rotation
// continues from where the previous request left off.
let currentKeyIndex = 0

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const parseApiKeys = (apiKey: string) =>
  apiKey
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)

const isKeyExhausted = (status: number) => status === 429 || status === 401 || status === 403

const fetchWithKeyRotation = async (apiKeys: string[], buildUrl: (key: string) => string) => {
  let response: Response | null = null

  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const keyIndex = currentKeyIndex % apiKeys.length
    response = await fetch(buildUrl(apiKeys[keyIndex]))

    if (!isKeyExhausted(response.status)) {
      return response
    }

    logMetric('api_key_exhausted', { keyIndex, status: response.status })
    currentKeyIndex = (keyIndex + 1) % apiKeys.length
  }

  return response
}

export type GiphyHandlerConfig = {
  apiKey: string | undefined
  trendLimit?: number
  searchLimit?: number
}

export const handleGiphyRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  config: GiphyHandlerConfig,
) => {
  const { apiKey, trendLimit = DEFAULT_TREND_LIMIT, searchLimit = DEFAULT_SEARCH_LIMIT } = config
  const apiKeys = parseApiKeys(apiKey || '')
  if (apiKeys.length === 0) {
    sendJson(res, 500, { error: 'API_KEY_MISSING' })
    return
  }

  const url = new URL(req.url || '', 'http://internal')
  const type = url.searchParams.get('type')

  logMetric('api_call', { type })

  let buildUrl: (key: string) => string
  if (type === 'trending') {
    logMetric('trending_call')
    buildUrl = (key) => {
      const params = new URLSearchParams({ api_key: key, limit: String(trendLimit), rating: 'g' })
      return `https://api.giphy.com/v1/gifs/trending?${params.toString()}`
    }
  } else if (type === 'search') {
    const q = url.searchParams.get('q') || ''
    logMetric('search_call', { query: q })
    buildUrl = (key) => {
      const params = new URLSearchParams({ api_key: key, q, limit: String(searchLimit), rating: 'g' })
      return `https://api.giphy.com/v1/gifs/search?${params.toString()}`
    }
  } else if (type === 'gif') {
    const id = url.searchParams.get('id') || ''
    buildUrl = (key) => {
      const params = new URLSearchParams({ api_key: key })
      return `https://api.giphy.com/v1/gifs/${encodeURIComponent(id)}?${params.toString()}`
    }
  } else {
    sendJson(res, 400, { error: 'INVALID_REQUEST' })
    return
  }

  try {
    const upstreamRes = await fetchWithKeyRotation(apiKeys, buildUrl)
    if (!upstreamRes) {
      sendJson(res, 502, { error: 'UPSTREAM_ERROR' })
      return
    }
    const data = await upstreamRes.json()
    sendJson(res, upstreamRes.status, data)
  } catch {
    sendJson(res, 502, { error: 'UPSTREAM_ERROR' })
  }
}
