import { useRef } from 'react'
import type { GifItem } from '../types/types'
import { gifPoolStorage, type PoolEntry } from '../utils/gifPoolStorage'
import { RANDOM_KEYWORDS } from '../utils/randomKeywords'

/** GIFs per search: one quota hit fills the stash for this many pops */
const BATCH_SIZE = 50
/** start from a random spot in the first results, so a keyword doesn't always give the same 50 */
const MAX_OFFSET = 100
/** top up while this many are left, so a new keyword mixes into the remaining ones */
const REFILL_AT = 25
/** after a background top-up fails, wait this long before trying again */
const QUIET_RETRY_MS = 60 * 1000
/** a failed charge-start fetch older than this is retried instead of reported again */
const STALE_FAILURE_MS = 5 * 1000

export type FetchGifPool = (
  keyword: string,
  limit: number,
  offset: number,
  options?: { quiet?: boolean },
) => Promise<GifItem[]>

export type RandomPick = Pick<PoolEntry, 'gif' | 'keyword'>

/** a fetch that adds one batch to the stash; quiet ones run in the background and never show an alert */
type Refill = {
  promise: Promise<void>
  quiet: boolean
  failedAt: number | null
}

const readPool = () => gifPoolStorage.read(RANDOM_KEYWORDS)

const pickRandom = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

const shuffle = <T>(items: T[]) => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** resolves once the image is in the browser cache (or failed), so the card opens with it drawn */
const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })

/**
 * Random GIFs for the dice from a stash in localStorage: one search fills it with 50 GIFs and each pop
 * takes one, so the default key's quota drops about once every 50 pops instead of on every pop.
 */
export const useRandomGif = (fetchGifPool: FetchGifPool) => {
  const refillRef = useRef<Refill | null>(null)

  const fetchBatch = async (quiet: boolean): Promise<PoolEntry[]> => {
    // prefer a keyword that isn't already in the stash, so a top-up brings something new
    const inStash = new Set(readPool().map((entry) => entry.keyword))
    const unused = RANDOM_KEYWORDS.filter((keyword) => !inStash.has(keyword))
    const keyword = pickRandom(unused.length > 0 ? unused : RANDOM_KEYWORDS)
    const offset = Math.floor(Math.random() * (MAX_OFFSET + 1))

    let gifs = await fetchGifPool(keyword, BATCH_SIZE, offset, { quiet })
    if (gifs.length === 0 && offset > 0) {
      // a narrow keyword can have fewer results than the offset skips
      gifs = await fetchGifPool(keyword, BATCH_SIZE, 0, { quiet })
    }
    const fetchedAt = Date.now()
    return gifs.map((gif) => ({ gif, keyword, fetchedAt }))
  }

  /** adds a batch to the stash; one fetch at a time, and a failed one stays visible until replaced */
  const startRefill = (quiet: boolean): Refill => {
    const current = refillRef.current
    if (current && current.failedAt === null) {
      return current
    }

    const refill: Refill = {
      quiet,
      failedAt: null,
      promise: fetchBatch(quiet).then((batch) => {
        // re-read: pops may have taken GIFs while this was loading
        const stash = readPool()
        const known = new Set(stash.map((entry) => entry.gif.id))
        gifPoolStorage.write(shuffle([...stash, ...batch.filter((entry) => !known.has(entry.gif.id))]))
      }),
    }
    refill.promise.then(
      () => {
        if (refillRef.current === refill) {
          refillRef.current = null
        }
      },
      () => {
        refill.failedAt = Date.now()
      },
    )
    refillRef.current = refill
    return refill
  }

  const topUpInBackground = () => {
    const current = refillRef.current
    if (current?.failedAt && Date.now() - current.failedAt < QUIET_RETRY_MS) {
      return
    }
    startRefill(true)
  }

  /** fills an empty stash; throws the fetch error (the alert for key/quota problems is already showing) */
  const ensureStocked = async () => {
    if (readPool().length > 0) {
      return
    }

    const pending = refillRef.current
    if (pending?.quiet) {
      // a background top-up may still bring GIFs; if it doesn't, fetch again so the error is shown
      await pending.promise.catch(() => {})
      if (readPool().length > 0) {
        return
      }
    }

    // the charge-start fetch is this pop's fetch, even if it just failed (a stale failure is retried)
    const isFresh = pending && !pending.quiet && (pending.failedAt === null || Date.now() - pending.failedAt < STALE_FAILURE_MS)
    const refill = isFresh ? pending : startRefill(false)
    try {
      await refill.promise
    } finally {
      if (refillRef.current === refill) {
        refillRef.current = null
      }
    }
  }

  /** warms up the next pop without using it up: fills an empty stash and preloads the next image */
  const prefetch = () => {
    const [next] = readPool()
    if (next) {
      void preloadImage(next.gif.previewUrl)
      return
    }
    startRefill(false)
      .promise.then(() => {
        const [first] = readPool()
        return first ? preloadImage(first.gif.previewUrl) : undefined
      })
      .catch(() => {
        // reported when the pop awaits the same fetch
      })
  }

  /** takes one GIF out of the stash, fetching first if it's empty */
  const take = async (): Promise<RandomPick> => {
    await ensureStocked()

    const [next, ...rest] = readPool()
    if (!next) {
      throw new Error('NO_RESULT')
    }
    gifPoolStorage.write(rest)
    if (rest.length <= REFILL_AT) {
      topUpInBackground()
    }

    await preloadImage(next.gif.previewUrl)
    return { gif: next.gif, keyword: next.keyword }
  }

  return { prefetch, take }
}
