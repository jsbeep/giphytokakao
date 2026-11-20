/** used when VITE_RANDOM_KEYWORDS is empty, so the dice works without any setup */
const FALLBACK_KEYWORDS = ['reaction', 'funny', 'cute', 'animals', 'good morning']

const parseKeywords = (raw: string | undefined) => [
  ...new Set(
    (raw || '')
      .split(',')
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean),
  ),
]

const configured = parseKeywords(import.meta.env.VITE_RANDOM_KEYWORDS)

/**
 * Search words the dice draws from, set with VITE_RANDOM_KEYWORDS (comma-separated).
 * It is baked in at build time, so changing it takes a redeploy.
 */
export const RANDOM_KEYWORDS: readonly string[] = configured.length > 0 ? configured : FALLBACK_KEYWORDS
