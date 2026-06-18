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
import DragSheet from './components/DragSheet'
import { useBottomSheet } from './hooks/useBottomSheet'
import { useGiphy } from './hooks/useGiphy'
import { useGifStorage } from './hooks/useGifStorage'
import { useKakaoShare } from './hooks/useKakaoShare'
import DiceButton from './components/DiceButton'
import './App.css'

function App() {
  const [inputValue, setInputValue] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [hoveredGifId, setHoveredGifId] = useState<string | null>(null)
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

  useEffect(() => {
    if (isDragging) {
      setHoveredGifId(null)
    }
  }, [isDragging])

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runSearch(inputValue)
  }

  const heroActionClass =
    'grid h-7.5 w-11 place-items-center rounded-full border border-(--border) bg-(--bg) p-0 text-[var(--ink)] shadow-(--sharp-shadow) transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-white/60 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-95 sm:h-12 sm:w-12'

    const ratio = featuredGif ? featuredGif.originalHeight / featuredGif.originalWidth : 1
    const isTall = ratio > 1.2
    const imgClass = isTall ? 'max-h-[60dvh] w-auto' : 'max-w-[90vw] min-w-[75vw] h-auto'

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
      <header className="hero-shell">
        <div className='hero-top'>
          <div className="hero-copy">

            <p className="hero-eyebrow mono">gif search / share</p>
            <h1 className={`hero-title ${isSendMode ? 'text-[clamp(1rem,13vw,6rem)]' : 'max-w-[8ch] text-[clamp(3.1rem,16vw,5.9rem)]'}`}>
              Old and <span className="hero-title-em">Sick</span> <span className="text-[#fae100] text-shadow-md text-shadow-yellow-600/25">Kakao</span>
            </h1>
            {!isSendMode && <p className="hero-meta mono">fossil / relic / Luddite</p>}
            {!isSendMode && (
              <p className="hero-desc">
                GIF를 검색해서 탭 한 번으로 카카오톡에 공유하세요.
              </p>
            )}
          </div>
          {!isSendMode &&
            <div className="hero-art" aria-hidden="true">


              <a
                className={`${heroActionClass} absolute bottom-10 h-8! w-8! no-select`}
                href="https://github.com/jsb0315?tab=repositories"
                target="_blank"
                rel="noreferrer"
                aria-label="Github"
              ><img width="90%" height="90%" src="https://img.icons8.com/fluency/50/github.png" alt="github" />
              </a>
              <DiceButton />
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
          hoveredGifId={hoveredGifId}
          onHoverGif={setHoveredGifId}

          onShareGif={handleShare}
          onAddRecent={addRecent}
          onRemoveRecent={removeRecent}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
          setShowHelp={setShowHelp}
          moveToMid={moveToMid}

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
