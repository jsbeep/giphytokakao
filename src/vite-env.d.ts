/// <reference types="vite/client" />

/** injected by vite.config.ts from GIPHY_TREND_LIMIT / GIPHY_SEARCH_LIMIT */
declare const __GIPHY_TREND_LIMIT__: number
declare const __GIPHY_SEARCH_LIMIT__: number

interface ImportMetaEnv {
  readonly VITE_KAKAO_APP_KEY?: string
  readonly VITE_KAKAO_TEMPLATE_IDS?: string
  readonly VITE_SEARCH_CACHE_LIMIT?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_GITHUB_URL?: string
  readonly VITE_CONTACT_EMAIL?: string
}
