import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGiphyRequest } from './_giphyHandler'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleGiphyRequest(req, res, process.env.GIPHY_API_KEY)
}
