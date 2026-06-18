import type { IncomingMessage, ServerResponse } from 'node:http'
import { logMetric } from './_metrics'

const TREND_LIMIT = 15
const SEARCH_LIMIT = 8

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export const handleGiphyRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined,
) => {
  if (!apiKey) {
    sendJson(res, 500, { error: 'API_KEY_MISSING' })
    return
  }

  const url = new URL(req.url || '', 'http://internal')
  const type = url.searchParams.get('type')

  logMetric('api_call', { type })

  let upstreamUrl: string
  if (type === 'trending') {
    logMetric('trending_call')
    const params = new URLSearchParams({
      api_key: apiKey,
      limit: String(TREND_LIMIT),
      rating: 'g',
    })
    upstreamUrl = `https://api.giphy.com/v1/gifs/trending?${params.toString()}`
  } else if (type === 'search') {
    const q = url.searchParams.get('q') || ''
    logMetric('search_call', { query: q })
    const params = new URLSearchParams({
      api_key: apiKey,
      q,
      limit: String(SEARCH_LIMIT),
      rating: 'g',
    })
    upstreamUrl = `https://api.giphy.com/v1/gifs/search?${params.toString()}`
  } else if (type === 'gif') {
    const id = url.searchParams.get('id') || ''
    const params = new URLSearchParams({ api_key: apiKey })
    upstreamUrl = `https://api.giphy.com/v1/gifs/${encodeURIComponent(id)}?${params.toString()}`
  } else {
    sendJson(res, 400, { error: 'INVALID_REQUEST' })
    return
  }

  try {
    const upstreamRes = await fetch(upstreamUrl)
    const data = await upstreamRes.json()
    sendJson(res, upstreamRes.status, data)
  } catch {
    sendJson(res, 502, { error: 'UPSTREAM_ERROR' })
  }
}
