import type { GifItem } from '../types/types'

/** kept small — the payload round-trips through the Kakao share link's URL */
const TRENDING_SHARE_LIMIT = 6

export type SharePayload = {
  gif: GifItem
  trending: GifItem[]
  ts: number
}

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** bundles the shared gif + sharer's trending list + share time into one URL-safe token */
export const encodeSharePayload = (gif: GifItem, trending: GifItem[]): string => {
  const payload: SharePayload = {
    gif,
    trending: trending.slice(0, TRENDING_SHARE_LIMIT),
    ts: Date.now(),
  }
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
}

export const decodeSharePayload = (encoded: string): SharePayload | null => {
  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded))
    return JSON.parse(json) as SharePayload
  } catch {
    return null
  }
}
