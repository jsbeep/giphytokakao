import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleShareRequest } from './_shareHandler'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleShareRequest(req, res)
}
