import type { IncomingMessage, ServerResponse } from 'node:http'
import { giphyConfigFromEnv } from './_config.js'
import { handleGiphyRequest } from './_giphyHandler.js'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleGiphyRequest(req, res, giphyConfigFromEnv(process.env))
}
