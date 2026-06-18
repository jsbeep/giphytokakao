export {}

declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Share: {
        sendCustom: (config: unknown) => void
      }
    }
  }
}
