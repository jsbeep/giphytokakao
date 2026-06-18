import {
	type CSSProperties,
	type FormEvent,
} from 'react'
import {
	Search,
	ArrowRight,
	CircleX,
	X,
	Star,
	Clock,
	TrendingUp,
	House,
	HelpCircle,
} from 'lucide-react'

import type { GifItem, ApiAlert, errorType } from '../types/types'
import ErrorMeta from './ErrorMeta'
import FloatingAlert from './FloatingAlert'

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
	activeTab: 'recent' | 'favorites' | 'results'
	onTabChange: (tab: 'recent' | 'favorites' | 'results') => void

	// gif data
	gifs: GifItem[]
	recent: GifItem[]
	favorites: GifItem[]
	hoveredGifId: string | null
	onHoverGif: (id: string | null) => void

	// actions
	onShareGif: (gif: GifItem) => void
	onAddRecent: (gif: GifItem) => void
	onRemoveRecent: (id: string) => void
	onToggleFavorite: (gif: GifItem) => void
	isFavorite: (id: string) => boolean
	setShowHelp: (show: boolean) => void
	moveToMid: () => void

	// ui state
	showHelp: boolean
	isLoading: boolean
	apiAlert: ApiAlert | null
	error: errorType
}

// ─── small reusable pieces ────────────────────────────────────────────────────

/** overlay button sitting top-right of a gif card */
function GifActionButton({
	className,
	onClick,
	label,
	children,
}: {
	className?: string
	onClick: (e: React.MouseEvent) => void
	label: string
	children: React.ReactNode
}) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={(e) => { e.stopPropagation(); onClick(e) }}
			className={[
				'absolute top-1 right-1',
				'flex items-center justify-center',
				'w-[30px] h-[30px] rounded-full p-0',
				'border border-black/10 bg-white/95 text-(--ink)',
				'cursor-pointer',
				'transition-[opacity,transform] duration-150',
				className,
			].join(' ')}
		>
			{children}
		</button>
	)
}

// ─── main component ───────────────────────────────────────────────────────────

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
	hoveredGifId,
	onHoverGif,
	onShareGif,
	onAddRecent,
	onRemoveRecent,
	onToggleFavorite,
	isFavorite,
	showHelp,
	setShowHelp,
	moveToMid,
	isLoading,
	error,
	apiAlert,
}: DragSheetProps) {
	const heroActionClass =
    'grid h-7.5 w-11 place-items-center rounded-full border border-(--border) bg-(--bg) p-0 text-[var(--ink)] shadow-(--sharp-shadow) transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-white/60 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-95 sm:h-12 sm:w-12'
	
	const tabIndex = activeTab === 'recent' ? 0 : activeTab === 'favorites' ? 1 : 2

	// ── tab accent colour (driven by CSS var --accent) ──────────────────────────
	const tabCls = (tab: typeof activeTab) =>
		[
			'flex justify-center w-12 border-b-2 bg-transparent text-sm font-semibold pt-3 px-1 pb-2.5 cursor-pointer transition-colors active:translate-y-px',
			activeTab === tab
				? 'border-b-(--accent) text-(--accent) text-(--ink)'
				: 'border-b-transparent text-(--muted) ',
		].join(' ')

	return (
		<section
			ref={sheetRef}
			className={[
				// position / size
				'fixed inset-x-0 bottom-0 mx-auto',
				'w-[min(640px,100%)] max-w-[640px] h-[100dvh]',
				// visual
				'bg-(--sheet-bg) rounded-t-4xl',
				'shadow-(--box-shadow)',
				// layout
				'flex flex-col',
				// drag
				'touch-none cursor-grab',
				// transition – disabled while dragging
				isDragging ? 'transition-none select-none' : 'transition-transform duration-250 ease-[ease]',
			].join(' ')}
			style={{
				'--sheet-offset': sheetOffset < 0 ? '95%' : `${sheetOffset}px`,
				transform: 'translateY(var(--sheet-offset, 0px))',
			} as CSSProperties}
			onPointerMove={handlePointerMove}
			onPointerUp={finishDrag}
			onPointerCancel={finishDrag}
		>

			{apiAlert && <FloatingAlert apiAlert={apiAlert} />}

			<div className="absolute -top-10 right-2 z-10" >
              <div className="hero-controls">
                <button
                  type="button"
                  className={heroActionClass}
                  onClick={() => {
                    onHomeClick()
                  }}
                  aria-label="첫 화면으로"
                >
                  <House size={20} />
                </button>
                <button
                  type="button"
                  className={heroActionClass}
                  onClick={() => {
                    setShowHelp(false)
                    moveToMid()
                    onTabChange('results')
                  }}
                  aria-label="검색하러 가기"
                >
                  <Search size={20} />
                </button>
                <button
                  type="button"
                  className={heroActionClass}
                  onClick={() => {
                    moveToMid()
                    setShowHelp(true)
                  }}
                  aria-label="도움말"
                >
                  <HelpCircle size={20} />
                </button>
              </div>
			</div>
			

			{/* ── drag handle + search + tabs ───────────────────────────────────── */}
			<div
				className="flex flex-col gap-1.5 px-3 select-none [touch-action:pan-y]"
				onPointerDown={(e) => startDrag(e, 'header')}
			>
				{/* handle pill */}
				<div className="w-[54px] h-1 bg-black/20 rounded-full mx-auto mt-[18px] mb-[14px] [touch-action:none]" />

				{/* search row */}
				<form className="flex h-11 gap-2.5 items-center justify-center" onSubmit={onSubmit}>
					<div className="relative flex items-center h-11 flex-1 min-w-0 rounded-full px-3 bg-(--input-bg) gap-2">
						<Search size={20} color="#888" className="shrink-0" />
						<input
							ref={inputRef}
							type="search"
							value={inputValue}
							placeholder="GIPHY 검색"
							aria-label="GIPHY 검색"
							onChange={(e) => onInputChange(e.target.value)}
							className="w-full text-(--ink) text-[17px] border-none outline-none  font-(--body-font) py-3"
						/>
						<CircleX
							size={20}
							color="#888"
							className="shrink-0 transition-opacity duration-200 cursor-pointer"
							style={{
								opacity: inputValue ? 1 : 0,
								WebkitTapHighlightColor: 'transparent',
							}}
							onClick={onClearInput}
						/>
					</div>

					<div>
						<button
							type="submit"
							className="flex items-center justify-center shrink-0 h-10 w-10 rounded-full bg-(--secondary) text-white self-stretch cursor-pointer border-none"
							onClick={(e) => {
								if (!inputValue.trim()) {
									e.preventDefault()
									onHomeClick()
								} else {
									onTabChange('results')
								}
							}}
						>
							{inputValue ? <ArrowRight size={18} /> : <House size={18} />}
						</button>
					</div>
				</form>

				{/* tab row */}
				<div className="flex" role="tablist" aria-label="GIF 분류">
					{(
						[
							{ tab: 'recent', label: '최근 공유', icon: <Clock size={18} /> },
							{ tab: 'favorites', label: '즐겨찾기', icon: <Star size={18} /> },
							{
								tab: 'results',
								label: '검색 결과',
								icon: activeQuery ? <Search size={18} /> : <TrendingUp size={18} />,
							},
						] as const
					).map(({ tab, label, icon }) => (
						<button
							key={tab}
							type="button"
							role="tab"
							aria-label={label}
							aria-selected={activeTab === tab}
							className={tabCls(tab)}
							onClick={() => onTabChange(tab)}
						>
							{icon}
						</button>
					))}
				</div>
			</div>

			{/* ── sliding gif track ─────────────────────────────────────────────── */}
			<div className="relative flex-1 overflow-hidden">
				<div
					className="flex w-[300%] h-full transition-transform duration-[250ms] ease-[ease]"
					style={{ transform: `translateX(-${tabIndex * 33.333}%)` }}
				>

					{/* recent */}
					<div className={`flex-1 overflow-y-auto transition-[height] duration-250 ${sheetOffset > 0 && !isDragging ? 'h-[calc(75vh-115px)]' : 'h-[calc(100vh-115px)]'}`}>
						<div
							role="tabpanel"
							className={
								recent.length === 0
									? 'flex items-center justify-center h-[50vh]'
									: 'columns-2 gap-3 pt-2.5 px-2.5 mb-[8vh]'
							}
						>
							{recent.length === 0 ? (
								<div className="text-[48px] opacity-70" aria-hidden="true"><Clock size={56} /></div>
							) : (
								recent.map((gif) => (
									<div
										key={gif.id}
										className={`flex flex-col break-inside-avoid pb-3 relative group/gif ${hoveredGifId === gif.id ? 'is-active' : ''}`}
										onMouseEnter={() => onHoverGif(gif.id)}
										onMouseLeave={() => onHoverGif(null)}
									>
										<button
											type="button"
											className="rounded-lg border-0 p-0 overflow-hidden cursor-pointer flex flex-col active:scale-105 transition-transform"
											onClick={() => onShareGif(gif)}
											onTouchStart={() => onHoverGif(gif.id)}
										>
											<img src={gif.previewUrl} alt={gif.title} loading="lazy" draggable={false} className="w-full h-full object-cover block select-none" />
										</button>
										<GifActionButton
											label="최근 공유 제거"
											onClick={() => onRemoveRecent(gif.id)}
											className={hoveredGifId === gif.id ? 'opacity-60 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'}
										>
											<X size={18} />
										</GifActionButton>
									</div>
								))
							)}
						</div>
					</div>

					{/* favorites */}
					<div className={`flex-1 overflow-y-auto transition-[height] duration-250 ${sheetOffset > 0 && !isDragging ? 'h-[calc(75vh-115px)]' : 'h-[calc(100vh-115px)]'}`}>
						<div
							role="tabpanel"
							className={
								favorites.length === 0
									? 'flex items-center justify-center h-[50vh]'
									: 'columns-2 gap-3 pt-2.5 px-2.5 mb-[8vh]'
							}
						>
							{favorites.length === 0 ? (
								<div className="text-[48px] opacity-70" aria-hidden="true"><Star size={56} /></div>
							) : (
								favorites.map((gif) => (
									<div
										key={gif.id}
										className="flex flex-col break-inside-avoid pb-3 relative"
										onMouseEnter={() => onHoverGif(gif.id)}
										onMouseLeave={() => onHoverGif(null)}
									>
										<button
											type="button"
											className="rounded-lg border-0 p-0 overflow-hidden cursor-pointer flex flex-col active:scale-105 transition-transform"
											onClick={() => onShareGif(gif)}
											onTouchStart={() => onHoverGif(gif.id)}
										>
											<img src={gif.previewUrl} alt={gif.title} loading="lazy" draggable={false} className="w-full h-full object-cover block select-none" />
										</button>
										<GifActionButton
											label="즐겨찾기 해제"
											onClick={() => onToggleFavorite(gif)}
											className="opacity-100 pointer-events-auto scale-100 !text-white !bg-[#ffd54f]"
										>
											<Star size={18} />
										</GifActionButton>
									</div>
								))
							)}
						</div>
					</div>

					{/* results */}
					<div className={`flex-1 overflow-y-auto transition-[height] duration-250 ${sheetOffset > 0 && !isDragging ? 'h-[calc(75vh-115px)]' : 'h-[calc(100vh-115px)]'}`}>
						<div role="tabpanel" className={gifs.length === 0 ? 'flex items-center justify-center h-[50vh]' : 'columns-2 gap-3 pt-2.5 px-2.5 mb-[8vh]'}>

							{/* ── loading overlay ───────────────────────────────────────────────── */}
							{error ? (
								<ErrorMeta error={error} />
							) : 
								gifs.map((gif) => (
									<div
										key={gif.id}
										className="flex flex-col break-inside-avoid pb-3 relative"
										onMouseEnter={() => onHoverGif(gif.id)}
										onMouseLeave={() => onHoverGif(null)}
									>
										<button
											type="button"
											className="rounded-lg border-0 p-0 overflow-hidden cursor-pointer flex flex-col active:scale-105 transition-transform"
											onClick={() => { onShareGif(gif); onAddRecent(gif) }}
											onTouchStart={() => onHoverGif(gif.id)}
										>
											<img src={gif.previewUrl} alt={gif.title} loading="lazy" draggable={false} className="w-full h-full object-cover block select-none" />
										</button>
										<GifActionButton
											label="즐겨찾기"
											onClick={() => onToggleFavorite(gif)}
											className={
												isFavorite(gif.id)
													? 'opacity-100 pointer-events-auto scale-100 !text-white !bg-[#ffd54f]'
													: hoveredGifId === gif.id
														? 'opacity-60 pointer-events-auto scale-100'
														: 'opacity-0 pointer-events-none scale-95'
											}
										>
											<Star size={18} />
										</GifActionButton>
									</div>
								))}
						</div>
					</div>
				</div>
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
					<div className="relative h-14 w-14 rounded-full border-6 border-(--spinner-border) border-t-(--accent) animate-[spin_0.6s_linear_infinite]" />
				</div>
			)}

		</section>
	)
}
