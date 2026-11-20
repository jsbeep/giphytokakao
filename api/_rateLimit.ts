import { createHmac } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { logMetric } from './_metrics.js'

export type RateLimitConfig = {
  /** max default-key requests per client in one window; 0 disables the default key entirely */
  limit: number
  windowSec: number
  /** Upstash Redis REST endpoint; without it counters live in this function instance's memory */
  redisUrl?: string
  redisToken?: string
  /** secret used to hash client IPs so raw addresses are never stored */
  hashSecret: string
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  /** epoch ms when the current window ends */
  resetAt: number
}

export const DEFAULT_RATE_LIMIT = 30
export const DEFAULT_RATE_WINDOW_SEC = 24 * 60 * 60

const KEY_PREFIX = 'giphytokakao:rl:'
const MEMORY_SWEEP_THRESHOLD = 5000

const memoryCounters = new Map<string, { count: number; resetAt: number }>()

const headerValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim() || ''

/** Vercel sets x-real-ip / x-forwarded-for itself, so they can't be spoofed by the client there */
export const getClientIp = (req: IncomingMessage) =>
  headerValue(req.headers['x-real-ip']) ||
  headerValue(req.headers['x-forwarded-for']) ||
  req.socket?.remoteAddress ||
  'unknown'

const counterKey = (ip: string, secret: string) =>
  KEY_PREFIX + createHmac('sha256', secret).update(ip).digest('base64url').slice(0, 22)

const redisPipeline = async (config: RateLimitConfig, commands: (string | number)[][]) => {
  const response = await fetch(`${config.redisUrl}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.redisToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  if (!response.ok) {
    throw new Error(`REDIS_${response.status}`)
  }
  const results = (await response.json()) as { result?: unknown; error?: string }[]
  return results.map((entry) => {
    if (entry.error) {
      throw new Error(entry.error)
    }
    return entry.result
  })
}

const toResult = (config: RateLimitConfig, count: number, ttlSec: number): RateLimitResult => ({
  allowed: count <= config.limit,
  limit: config.limit,
  remaining: Math.max(0, config.limit - count),
  resetAt: Date.now() + Math.max(0, ttlSec) * 1000,
})

const sweepMemory = () => {
  if (memoryCounters.size < MEMORY_SWEEP_THRESHOLD) {
    return
  }
  const now = Date.now()
  for (const [key, entry] of memoryCounters) {
    if (entry.resetAt <= now) {
      memoryCounters.delete(key)
    }
  }
}

const readMemory = (key: string) => {
  const entry = memoryCounters.get(key)
  return entry && entry.resetAt > Date.now() ? entry : null
}

const hasRedis = (config: RateLimitConfig) => Boolean(config.redisUrl && config.redisToken)

/** counts one default-key request for this client and reports whether it's still within the limit */
export const consumeRateLimit = async (
  req: IncomingMessage,
  config: RateLimitConfig,
): Promise<RateLimitResult> => {
  const key = counterKey(getClientIp(req), config.hashSecret)

  if (hasRedis(config)) {
    try {
      // SET NX EX starts the window on the first request; INCR keeps the existing TTL
      const [, count, ttl] = await redisPipeline(config, [
        ['SET', key, 0, 'EX', config.windowSec, 'NX'],
        ['INCR', key],
        ['TTL', key],
      ])
      return toResult(config, Number(count), Number(ttl))
    } catch (err) {
      // fail open: a Redis outage shouldn't take search down with it
      logMetric('rate_limit_store_error', { message: err instanceof Error ? err.message : 'unknown' })
      return toResult(config, 0, config.windowSec)
    }
  }

  sweepMemory()
  const entry = readMemory(key) ?? { count: 0, resetAt: Date.now() + config.windowSec * 1000 }
  entry.count += 1
  memoryCounters.set(key, entry)
  return toResult(config, entry.count, (entry.resetAt - Date.now()) / 1000)
}

/** reports the client's current quota without counting a request */
export const peekRateLimit = async (
  req: IncomingMessage,
  config: RateLimitConfig,
): Promise<RateLimitResult> => {
  const key = counterKey(getClientIp(req), config.hashSecret)

  if (hasRedis(config)) {
    try {
      const [count, ttl] = await redisPipeline(config, [
        ['GET', key],
        ['TTL', key],
      ])
      const ttlSec = Number(ttl) > 0 ? Number(ttl) : config.windowSec
      return toResult(config, Number(count) || 0, ttlSec)
    } catch {
      return toResult(config, 0, config.windowSec)
    }
  }

  const entry = readMemory(key)
  return entry
    ? toResult(config, entry.count, (entry.resetAt - Date.now()) / 1000)
    : toResult(config, 0, config.windowSec)
}
