import type { IncomingMessage, ServerResponse } from 'node:http'
import { logMetric } from './_metrics.js'
import {
  consumeRateLimit,
  peekRateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from './_rateLimit.js'

export const DEFAULT_TREND_LIMIT = 15
export const DEFAULT_SEARCH_LIMIT = 8
/** GIPHY beta keys return at most 50 results per search */
const POOL_MAX_LIMIT = 50
const GIPHY_MAX_OFFSET = 4999

const clampInt = (value: string | null, min: number, max: number, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

// Persists for the lifetime of a warm function instance so rotation
// continues from where the previous request left off.
let currentKeyIndex = 0

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

const setRateLimitHeaders = (res: ServerResponse, result: RateLimitResult) => {
  res.setHeader('X-RateLimit-Limit', String(result.limit))
  res.setHeader('X-RateLimit-Remaining', String(result.remaining))
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))
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
  rateLimit: Omit<RateLimitConfig, 'hashSecret'>
}

export const handleGiphyRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  config: GiphyHandlerConfig,
) => {
  const { apiKey, trendLimit = DEFAULT_TREND_LIMIT, searchLimit = DEFAULT_SEARCH_LIMIT } = config
  const apiKeys = parseApiKeys(apiKey || '')
  // the default key is optional: without it (or with a 0 limit) visitors must bring their own key
  const isDefaultKeyEnabled = apiKeys.length > 0 && config.rateLimit.limit > 0
  const rateLimit: RateLimitConfig = { ...config.rateLimit, hashSecret: apiKeys.join(',') }

  const url = new URL(req.url || '', 'http://internal')
  const type = url.searchParams.get('type')

  if (type === 'quota') {
    if (!isDefaultKeyEnabled) {
      sendJson(res, 200, { enabled: false })
      return
    }
    const quota = await peekRateLimit(req, rateLimit)
    sendJson(res, 200, { enabled: true, ...quota, windowSec: rateLimit.windowSec })
    return
  }

  if (!isDefaultKeyEnabled) {
    sendJson(res, 403, { error: 'API_KEY_REQUIRED' })
    return
  }

  let buildUrl: (key: string) => string
  if (type === 'trending') {
    buildUrl = (key) => {
      const params = new URLSearchParams({ api_key: key, limit: String(trendLimit), rating: 'g' })
      return `https://api.giphy.com/v1/gifs/trending?${params.toString()}`
    }
  } else if (type === 'search') {
    const q = url.searchParams.get('q') || ''
    buildUrl = (key) => {
      const params = new URLSearchParams({ api_key: key, q, limit: String(searchLimit), rating: 'g' })
      return `https://api.giphy.com/v1/gifs/search?${params.toString()}`
    }
  } else if (type === 'pool') {
    // one wide search the browser keeps as a stash of dice rolls, so one quota hit covers many pops
    const q = url.searchParams.get('q') || ''
    const limit = clampInt(url.searchParams.get('limit'), 1, POOL_MAX_LIMIT, POOL_MAX_LIMIT)
    const offset = clampInt(url.searchParams.get('offset'), 0, GIPHY_MAX_OFFSET, 0)
    buildUrl = (key) => {
      const params = new URLSearchParams({ api_key: key, q, limit: String(limit), offset: String(offset), rating: 'g' })
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

  const quota = await consumeRateLimit(req, rateLimit)
  setRateLimitHeaders(res, quota)
  if (!quota.allowed) {
    logMetric('default_quota_exceeded', { type })
    sendJson(res, 429, { error: 'DEFAULT_QUOTA_EXCEEDED', resetAt: quota.resetAt })
    return
  }

  // only the request type is logged: search terms and GIF ids are never recorded
  logMetric('api_call', { type })

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
