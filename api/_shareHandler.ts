import type { IncomingMessage, ServerResponse } from 'node:http'
import { logMetric } from './_metrics'

export const handleShareRequest = (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '', 'http://internal')
  const gifId = url.searchParams.get('gifId') || ''

  logMetric('share_call', { gifId })

  res.statusCode = 204
  res.end()
}
