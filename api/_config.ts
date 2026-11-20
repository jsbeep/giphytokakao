import type { GiphyHandlerConfig } from './_giphyHandler.js'
import { DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_SEC } from './_rateLimit.js'

type Env = Record<string, string | undefined>

export const parsePositive = (value: string | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/** 0 is meaningful here (disables the default key), so only blank/invalid values fall back */
const parseNonNegative = (value: string | undefined, fallback: number) => {
  if (value === undefined || value.trim() === '') {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback
}

/** shared by the Vercel function and the Vite dev middleware so both read the same env vars */
export const giphyConfigFromEnv = (env: Env): GiphyHandlerConfig => ({
  apiKey: env.GIPHY_API_KEY,
  trendLimit: parsePositive(env.GIPHY_TREND_LIMIT),
  searchLimit: parsePositive(env.GIPHY_SEARCH_LIMIT),
  rateLimit: {
    limit: parseNonNegative(env.DEFAULT_KEY_RATE_LIMIT, DEFAULT_RATE_LIMIT),
    windowSec: parsePositive(env.DEFAULT_KEY_RATE_WINDOW_SEC) ?? DEFAULT_RATE_WINDOW_SEC,
    // Vercel's Upstash integration injects KV_REST_API_*; a manual Upstash setup uses UPSTASH_REDIS_REST_*
    redisUrl: env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL,
    redisToken: env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN,
  },
})
