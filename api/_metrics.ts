export const logMetric = (event: string, meta: Record<string, unknown> = {}) => {
  console.log(JSON.stringify({ metric: event, ...meta, timestamp: new Date().toISOString() }))
}
