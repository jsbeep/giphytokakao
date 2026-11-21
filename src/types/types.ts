export type GifItem = {
  id: string
  title: string
  previewUrl: string
  originalUrl: string
  originalWidth: number
  originalHeight: number
}

/** feedback on a tapped gif: a spinner while the share sheet comes up, then a check */
export type GifSendStatus = 'sending' | 'sent'

export type GifSendState = { id: string; status: GifSendStatus }

export type ApiAlert = {  // API 관련
  type: 'limit' | 'invalid'
  title: string
  message: string
}

export type errorType =
  | 'NO_RESULT'
  | 'PLEASE_TRY_AGAIN'
  | 'API_KEY_REQUIRED'
  | 'DEFAULT_QUOTA_EXCEEDED'
  | 'RATE_LIMIT'
  | 'INVALID_KEY'
  | 'INVALID_PERSONAL_KEY'
  | 'API_ERROR'
  | null
  | string;