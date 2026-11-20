import type { IncomingMessage, ServerResponse } from 'node:http'
import { logMetric } from './_metrics.js'

/** counts successful shares only; which GIF was shared is never recorded */
export const handleShareRequest = (_req: IncomingMessage, res: ServerResponse) => {
  logMetric('share_call')

  res.statusCode = 204
  res.end()
}
