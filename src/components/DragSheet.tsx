import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Clock, Star, X } from 'lucide-react'

import type { GifItem, ApiAlert, errorType } from '../types/types'
import { useGifGridInteraction } from '../hooks/useGifGridInteraction'
import FloatingAlert from './FloatingAlert'
import GifPanel from './GifPanel'
import SheetHeaderActions from './SheetHeaderActions'
import SheetSearchBar from './SheetSearchBar'
import SheetTabs, { type SheetTab } from './SheetTabs'

/** search/trending arrive up to 50 per request; the list shows this many at a time as it scrolls */
const RESULTS_PAGE_SIZE = 12

interface DragSheetProps {
	// sheet drag
	sheetRef: React.RefObject<HTMLElement | null>
	sheetOffset: number
	isDragging: boolean
	startDrag: (event: React.PointerEvent<HTMLElement>, origin: 'header' | 'grid') => void
	handlePointerMove: (event: React.PointerEvent<HTMLElement>) => void
	finishDrag: (event: React.PointerEvent<HTMLElement>) => void

	// search
	inputValue: string
	inputRef: React.RefObject<HTMLInputElement | null>
	activeQuery: string
	onInputChange: (value: string) => void
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
	onClearInput: () => void
	onHomeClick: () => void

	// tabs
	activeTab: SheetTab
	onTabChange: (tab: SheetTab) => void

	// gif data
	gifs: GifItem[]
	recent: GifItem[]
	favorites: GifItem[]

	// actions
	onShareGif: (gif: GifItem) => void
	onAddRecent: (gif: GifItem) => void
	onRemoveRecent: (id: string) => void
	onToggleFavorite: (gif: GifItem) => void
	isFavorite: (id: string) => boolean
	setShowHelp: (show: boolean) => void
	moveToMid: () => void
	onOpenSettings: () => void

	// ui state
	showHelp: boolean
	isLoading: boolean
	apiAlert: ApiAlert | null
	error: errorType
}

export default function DragSheet({
	sheetRef,
	sheetOffset,
	isDragging,
	startDrag,
	handlePointerMove,
	finishDrag,
	inputValue,
	inputRef,
	activeQuery,
	onInputChange,
	onSubmit,
	onClearInput,
	onHomeClick,
	activeTab,
	onTabChange,
	gifs,
	recent,
	favorites,
	onShareGif,
	onAddRecent,
	onRemoveRecent,
	onToggleFavorite,
	isFavorite,
	showHelp,
	setShowHelp,
	moveToMid,
	onOpenSettings,
	isLoading,
	error,
	apiAlert,
}: DragSheetProps) {
	const tabIndex = activeTab === 'recent' ? 0 : activeTab === 'favorites' ? 1 : 2

	const { sendState, hoveredGifId, onHoverGif, shareWithFeedback } = useGifGridInteraction({
		onShareGif,
		onAddRecent,
	})

	return (
		<motion.section
			ref={sheetRef}
			className={[
				// position / size: the visible area, from the top (bottom-0 could sit under an in-app browser's toolbar)
				'fixed inset-x-0 top-0 mx-auto',
				'w-[min(640px,100%)] max-w-[640px] h-(--app-height)',
				// visual
				'bg-(--sheet-bg) rounded-t-4xl',
				'shadow-(--box-shadow)',
				// layout
				'flex flex-col',
				// drag
				'touch-none cursor-grab',
				isDragging ? 'select-none' : '',
			].join(' ')}
			// first frame already at the bottom (95%, before the screen is measured): without initial={false} framer-motion
			// mounts it at y 0 – fully open – and then slides it down to where it should rest
			initial={false}
			animate={{ y: sheetOffset < 0 ? '95%' : sheetOffset }}
			transition={isDragging ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
			onPointerMove={handlePointerMove}
			onPointerUp={finishDrag}
			onPointerCancel={finishDrag}
		>

			{apiAlert && <FloatingAlert apiAlert={apiAlert} />}

			<SheetHeaderActions
				onHomeClick={onHomeClick}
				onSearchClick={() => {
					setShowHelp(false)
					moveToMid()
					onTabChange('results')
					// focus must stay synchronous (in the click's call stack) or iOS Safari drops the keyboard entirely;
					// preventScroll stops Safari's own scroll-into-view from fighting the sheet's slide-up animation
					inputRef.current?.focus({ preventScroll: true })
				}}
				onHelpClick={() => {
					moveToMid()
					setShowHelp(true)
				}}
			/>

			{/* ── drag handle + search + tabs ───────────────────────────────────── */}
			<div
				className="flex flex-col gap-1.5 px-3 select-none [touch-action:pan-y]"
				onPointerDown={(e) => startDrag(e, 'header')}
			>
				<SheetSearchBar
					inputValue={inputValue}
					inputRef={inputRef}
					onInputChange={onInputChange}
					onSubmit={onSubmit}
					onClearInput={onClearInput}
					onHomeClick={onHomeClick}
					onGoToResults={() => onTabChange('results')}
				/>
				<SheetTabs activeTab={activeTab} activeQuery={activeQuery} onTabChange={onTabChange} />
			</div>

			{/* ── sliding gif track ─────────────────────────────────────────────── */}
			<div className="relative flex-1 overflow-hidden">
				<motion.div
					className="flex w-[300%] h-full"
					initial={false}
					animate={{ x: `-${tabIndex * 33.333}%` }}
					transition={{ duration: 0.25, ease: 'easeInOut' }}
				>
					<GifPanel
						items={recent}
						emptyState={<div className="text-[48px] opacity-70" aria-hidden="true"><Clock size={56} /></div>}
						sheetOffset={sheetOffset}
						isDragging={isDragging}
						sendState={sendState}
						hoveredGifId={hoveredGifId}
						onHoverGif={onHoverGif}
						onShare={(gif) => shareWithFeedback(gif)}
						getAction={(gif) => ({
							label: '최근 공유 제거',
							icon: <X size={16} />,
							active: false,
							onClick: () => onRemoveRecent(gif.id),
						})}
					/>

					<GifPanel
						items={favorites}
						emptyState={<div className="text-[48px] opacity-70" aria-hidden="true"><Star size={56} /></div>}
						sheetOffset={sheetOffset}
						isDragging={isDragging}
						sendState={sendState}
						hoveredGifId={hoveredGifId}
						onHoverGif={onHoverGif}
						onShare={(gif) => shareWithFeedback(gif)}
						getAction={(gif) => ({
							label: '즐겨찾기 해제',
							icon: <Star size={16} />,
							active: true,
							onClick: () => onToggleFavorite(gif),
						})}
					/>

					<GifPanel
						items={gifs}
						pageSize={RESULTS_PAGE_SIZE}
						emptyState={null}
						error={error}
						sheetOffset={sheetOffset}
						isDragging={isDragging}
						sendState={sendState}
						hoveredGifId={hoveredGifId}
						onHoverGif={onHoverGif}
						onShare={(gif) => shareWithFeedback(gif, true)}
						getAction={(gif) => ({
							label: '즐겨찾기',
							icon: <Star size={16} />,
							active: isFavorite(gif.id),
							onClick: () => onToggleFavorite(gif),
						})}
						onOpenSettings={onOpenSettings}
						footer={
							<a href="https://giphy.com" target="_blank" rel="noreferrer" aria-label="Powered by GIPHY">
								<img src="/powered-by-giphy.png" alt="Powered by GIPHY" width={140} height={30} className="block h-auto w-35" />
							</a>
						}
					/>
				</motion.div>
			</div>

			{/* ── help tooltip ──────────────────────────────────────────────────── */}
			{showHelp && (
				<div
					role="status"
					className="fixed top-[90px] left-3 px-3 py-2.5 rounded-xl border border-black/10 bg-white/90 shadow text-lg text-[var(--ink)]"
					onPointerEnter={() => setShowHelp(false)}
				>
					1. 한번 눌러 빠른 공유<br />
					2. 꾹 눌러 이미지 원본 공유
				</div>
			)}

			{isLoading && (
				<div
					role="status"
					aria-live="polite"
					className="absolute top-[134px] inset-0 bg-(--surface-soft) backdrop-blur-sm flex flex-col items-center pt-[25dvh]"
				>
					<motion.div
						className="relative h-14 w-14 rounded-full border-6 border-(--spinner-border) border-t-(--accent)"
						animate={{ rotate: 360 }}
						transition={{ duration: 0.6, ease: 'linear', repeat: Infinity }}
					/>
				</div>
			)}

		</motion.section>
	)
}
