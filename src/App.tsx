import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  TriangleAlert,
} from 'lucide-react'
import { Analytics } from "@vercel/analytics/react"
import { AnimatePresence } from 'framer-motion'
import DragSheet from './components/DragSheet'
import RandomGifCard from './components/RandomGifCard'
import SettingsPage from './components/SettingsPage'
import { useBottomSheet } from './hooks/useBottomSheet'
import { useGiphy } from './hooks/useGiphy'
import { useGifStorage } from './hooks/useGifStorage'
import { useKakaoShare } from './hooks/useKakaoShare'
import { usePersonalApiKey } from './hooks/usePersonalApiKey'
import { useRandomGif, type RandomPick } from './hooks/useRandomGif'
import DiceButton from './components/DiceButton'
import GithubMark from './components/GithubMark'
import { heroActionClass } from './components/HeroActionButton'
import type { GifItem } from './types/types'

const GITHUB_URL = import.meta.env.VITE_GITHUB_URL

function App() {
  const [inputValue, setInputValue] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { apiKey, saveApiKey, clearApiKey } = usePersonalApiKey()
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'results'>(
    'results',
  )
  const inputRef = useRef<HTMLInputElement | null>(null)
  const updateUrl = (query: string) => {
    const url = new URL(window.location.href)
    url.pathname = '/'
    url.search = query ? `?q=${encodeURIComponent(query)}` : ''
    window.history.replaceState({}, '', url)
  }

  const {
    gifs,
    activeQuery,
    isLoading,
    error,
    apiAlert,
    featuredGif,
    isFeaturedLoading,
    isSendMode,
    setIsSendMode,
    setFeaturedGif,
    loadTrending,
    runSearch,
    loadGifById,
    fetchGifPool,
    setError,
  } = useGiphy({
    onUpdateUrl: updateUrl,
    onFeaturedTitle: setInputValue,
  })

  const {
    sheetOffset,
    setSheetOffset,
    maxOffset,
    isDragging,
    sheetRef,
    snapTo,
    moveToMid,
    startDrag,
    handlePointerMove,
    finishDrag,
  } = useBottomSheet({
    onDragStart: () => inputRef.current?.blur(),
  })

  const { handleShare } = useKakaoShare({ onError: setError })
  const {
    recent,
    favorites,
    addRecent,
    removeRecent,
    toggleFavorite,
    isFavorite,
  } = useGifStorage()

  // dice: pops come from a stash of 50 GIFs in localStorage; holding it preloads the next one
  const randomGifs = useRandomGif(fetchGifPool)
  const [randomPick, setRandomPick] = useState<RandomPick | null>(null)

  const popRandomGif = async () => {
    setRandomPick(await randomGifs.take())
  }

  const shareRandomGif = (gif: GifItem) => {
    void handleShare(gif)
    addRecent(gif)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryParam = params.get('q')?.trim() || ''
    const sendParam = params.get('send')?.trim() || ''
    const sendId = sendParam ? decodeURIComponent(sendParam) : ''
    const initialQuery = queryParam
    setInputValue(initialQuery)

    if (sendId) {
      setIsSendMode(true)
      snapTo('collapsed')
      void loadGifById(sendId)
      void loadTrending(true)
      return
    }

    if (initialQuery) {
      void runSearch(initialQuery)
      return
    }

    void loadTrending()
  }, [])

  useEffect(() => {
    if (isSendMode && maxOffset > 0) {
      snapTo('collapsed')
      const timer1 = window.setTimeout(() => {
        setSheetOffset(maxOffset * 0.94)
      }, 700)
      const timer2 = window.setTimeout(() => {
        snapTo('collapsed')
      }, 1000)
      return () => {
        window.clearTimeout(timer1)
        window.clearTimeout(timer2)
      }
    }
  }, [isSendMode, maxOffset])

  const resetToHome = () => {
    setActiveTab('results')
    setIsSendMode(false)
    setFeaturedGif(null)
    setInputValue('')
    setShowHelp(false)
    updateUrl('')
    moveToMid()
    void loadTrending()
  }

  // after the key changes, redo whatever just failed (e.g. the default key ran out) with the new key
  const retryFailedRequest = () => {
    if (!error || error === 'NO_RESULT') {
      return
    }
    const params = new URLSearchParams(window.location.search)
    const sendId = params.get('send')?.trim()
    const query = params.get('q')?.trim()
    if (sendId) {
      void loadGifById(sendId)
      void loadTrending(true)
      return
    }
    if (query) {
      void runSearch(query)
      return
    }
    void loadTrending()
  }

  const handleSaveApiKey = (key: string) => {
    saveApiKey(key)
    retryFailedRequest()
  }

  const handleClearApiKey = () => {
    clearApiKey()
    retryFailedRequest()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runSearch(inputValue)
  }

  const heroLinkClass =
    `${heroActionClass} transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-white/60 hover:bg-white/25 active:scale-95`

    const ratio = featuredGif ? featuredGif.originalHeight / featuredGif.originalWidth : 1
    const isTall = ratio > 1.2
    const imgClass = isTall ? 'max-h-[60dvh] w-auto md:max-h-[80dvh]' : 'max-w-[90vw] min-w-[75vw] h-auto md:max-w-[60vw] md:min-w-[40vw]'

  return (
    <div className="box-border flex min-h-dvh flex-col items-center gap-8 pt-[2dvh] px-[5%]"
    // style={{
    // paddingTop: `${(1 - MID_OPEN_RATIO) * 10}vh`,
    // }}
    >
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-16 left-[-4rem] h-40 w-40 rounded-full bg-[rgba(20,16,8,0.09)] blur-3xl" />
        <div className="absolute right-[-3rem] top-[28vh] h-52 w-52 rounded-full bg-[rgba(20,16,8,0.08)] blur-3xl" />
      </div>

      {showSettings && (
        <SettingsPage
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          onClearApiKey={handleClearApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
      <AnimatePresence>
        {randomPick && (
          <RandomGifCard
            key="random-gif"
            gif={randomPick.gif}
            keyword={randomPick.keyword}
            isFavorite={isFavorite(randomPick.gif.id)}
            onShare={() => shareRandomGif(randomPick.gif)}
            onToggleFavorite={() => toggleFavorite(randomPick.gif)}
            onRerollStart={randomGifs.prefetch}
            onReroll={popRandomGif}
            onClose={() => setRandomPick(null)}
          />
        )}
      </AnimatePresence>
      <header className="flex w-[min(100%,560px)] h-dvh flex-col gap-4">
        <div className="relative grid grid-cols-1 min-[521px]:grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="flex min-w-0 flex-col gap-2">

            <p className="mono w-fit rounded-full border border-(--border) bg-(--surface) px-[0.65rem] py-[0.35rem] text-[0.68rem] text-(--muted) shadow-(--sharp-shadow)">gif search / share</p>
            <h1 className={`m-0 font-(--heading-font) leading-[0.86] tracking-[-0.06em] text-balance text-(--ink) ${isSendMode ? 'text-[clamp(1rem,13vw,6rem)]' : 'max-w-[8ch] text-[clamp(3.1rem,16vw,5.9rem)]'}`}>
              Old and <span className="inline-block italic -translate-y-[0.02em]">Sick</span> <span className="text-[#fae100] text-shadow-md text-shadow-yellow-600/25">Kakao</span>
            </h1>
            {!isSendMode && <p className="mono w-fit text-[0.72rem] text-(--muted) opacity-[0.82]">fossil / relic / Luddite</p>}
            {!isSendMode && (
              <p className="max-w-[26ch] text-[0.92rem] text-white opacity-85">
                GIF를 검색해서 탭 한 번으로 카카오톡에 공유하세요.
              </p>
            )}
          </div>
          
          <a
            href="#settings"
            onClick={(event) => {
              event.preventDefault()
              setShowSettings(true)
            }}
            className="mono absolute top-0 py-[0.35rem] right-[1%] z-20 text-[0.7rem] text-(--muted) underline decoration-dotted underline-offset-3 hover:text-(--ink)"
          >
            설정
          </a>
          {!isSendMode &&
            <div className="flex relative flex-col justify-center items-center pt-[10dvh]">
              {GITHUB_URL && (
                <a
                  className={`${heroLinkClass} absolute bottom-10 h-8! w-8! no-select`}
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Github"
                >
                  <GithubMark size="90%" />
                </a>
              )}
              <DiceButton onChargeStart={randomGifs.prefetch} onPop={popRandomGif} />
            </div>
          }
        </div>
        {isSendMode && <div className="flex h-full w-full items-center justify-center flex-1">
          {(isFeaturedLoading || featuredGif) ? (
          <div className=" h-full w-full flex items-center justify-center flex-1">
            <div
              className={
                isFeaturedLoading
                  ? 'm-[20%] flex items-center justify-center'
                  : 'flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] p-1 shadow-[var(--soft-shadow)]'
              }
            >
              {isFeaturedLoading ? (
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" aria-hidden="true"></div>
              ) : (
                featuredGif && (
                  <img
                    src={featuredGif.previewUrl}
                    alt={featuredGif.title}
                    className={`block ${imgClass}`}
                  />
                )
              )}
            </div>
          </div>
          ) : (
          <TriangleAlert
            size={48}
            color="var(--muted)"
            aria-hidden="true"
            style={{ margin: '20%' }}
          />
          )}
        </div>}

        <div className="h-[15dvh]" />
      </header>

      <main className="w-full flex-1">
        <DragSheet
          sheetRef={sheetRef}
          sheetOffset={sheetOffset}
          isDragging={isDragging}
          startDrag={startDrag}
          handlePointerMove={handlePointerMove}
          finishDrag={finishDrag}

          inputValue={inputValue}
          inputRef={inputRef}
          activeQuery={activeQuery}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          onClearInput={() => { setInputValue(''); inputRef.current?.focus() }}
          onHomeClick={resetToHome}

          activeTab={activeTab}
          onTabChange={setActiveTab}

          gifs={gifs}
          recent={recent}
          favorites={favorites}

          onShareGif={handleShare}
          onAddRecent={addRecent}
          onRemoveRecent={removeRecent}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
          setShowHelp={setShowHelp}
          moveToMid={moveToMid}
          onOpenSettings={() => setShowSettings(true)}

          showHelp={showHelp}
          isLoading={isLoading}
          apiAlert={apiAlert}
          error={error}
        />
      </main>
      <Analytics />
    </div>
  )
}

export default App
