export type GifItem = {
  id: string
  title: string
  previewUrl: string
  originalUrl: string
  originalWidth: number
  originalHeight: number
}

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