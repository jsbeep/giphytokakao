import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGiphyRequest } from './_giphyHandler'

const parseLimit = (value: string | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleGiphyRequest(req, res, {
    apiKey: process.env.GIPHY_API_KEY,
    trendLimit: parseLimit(process.env.GIPHY_TREND_LIMIT),
    searchLimit: parseLimit(process.env.GIPHY_SEARCH_LIMIT),
  })
}
