import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Dices, LoaderCircle, Send, Star, X } from 'lucide-react'
import type { GifItem } from '../types/types'

const roundButtonClass =
	'grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-(--border) text-(--ink) shadow-(--sharp-shadow) transition-colors duration-200 disabled:cursor-progress'

const rerollErrorMessage = (err: unknown) => {
	const code = err instanceof Error ? err.message : ''
	if (code === 'DEFAULT_QUOTA_EXCEEDED' || code === 'API_KEY_REQUIRED') {
		return '기본 키 사용량을 다 썼어요. 설정에서 내 GIPHY API 키를 등록해주세요.'
	}
	return 'GIF를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
}

interface RandomGifCardProps {
	gif: GifItem
	/** the search word this GIF came from, shown as a tag */
	keyword: string
	isFavorite: boolean
	onShare: () => void
	onToggleFavorite: () => void
	/** pressing "again" starts fetching before the click lands */
	onRerollStart: () => void
	onReroll: () => Promise<void>
	onClose: () => void
}

/** the GIF the dice popped: share it, roll again, or keep it */
export default function RandomGifCard({
	gif,
	keyword,
	isFavorite,
	onShare,
	onToggleFavorite,
	onRerollStart,
	onReroll,
	onClose,
}: RandomGifCardProps) {
	const [isRerolling, setIsRerolling] = useState(false)
	const [rerollError, setRerollError] = useState<string | null>(null)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onClose])

	const reroll = async () => {
		if (isRerolling) {
			return
		}
		setIsRerolling(true)
		setRerollError(null)
		try {
			await onReroll()
		} catch (err) {
			setRerollError(rerollErrorMessage(err))
		} finally {
			setIsRerolling(false)
		}
	}

	const aspectRatio =
		gif.originalWidth > 0 && gif.originalHeight > 0 ? `${gif.originalWidth} / ${gif.originalHeight}` : '1 / 1'

	return (
		<motion.div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-[5%] backdrop-blur-sm"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.18 }}
			onClick={onClose}
		>
			<motion.div
				role="dialog"
				aria-modal="true"
				aria-label="랜덤 GIF"
				className="relative flex w-[min(400px,100%)] flex-col gap-3 rounded-3xl border border-(--border) bg-(--surface-strong) p-3 text-(--ink) shadow-(--box-shadow)"
				initial={{ scale: 0.2, opacity: 0, y: 160, rotate: -8 }}
				animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
				// bouncy pop on the way in, quick fade on the way out
				exit={{ scale: 0.85, opacity: 0, y: 40, transition: { duration: 0.16, ease: 'easeIn' } }}
				transition={{ type: 'spring', stiffness: 380, damping: 18 }}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="relative overflow-hidden rounded-2xl bg-(--input-bg)">
					<AnimatePresence mode="popLayout" initial={false}>
						<motion.img
							key={gif.id}
							src={gif.previewUrl}
							alt={gif.title}
							draggable={false}
							style={{ aspectRatio }}
							className="block max-h-[55dvh] w-full select-none object-contain"
							initial={{ scale: 0.5, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 1.15, opacity: 0 }}
							transition={{ type: 'spring', stiffness: 420, damping: 22 }}
						/>
					</AnimatePresence>
					<button
						type="button"
						onClick={onClose}
						aria-label="닫기"
						className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-(--border) bg-(--bg) text-(--ink) shadow-(--sharp-shadow)"
					>
						<X size={16} />
					</button>
				</div>

				<div className="flex min-w-0 items-center gap-2 px-1">
					<span className="shrink-0 rounded-full border border-(--border) bg-(--bg) px-2.5 py-0.5 text-xs font-semibold text-(--ink)">
						#{keyword}
					</span>
					<p className="m-0 min-w-0 truncate text-sm text-(--muted)">{gif.title}</p>
				</div>
				{rerollError && (
					<p role="alert" className="m-0 px-1 text-xs leading-relaxed text-red-600">
						{rerollError}
					</p>
				)}

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onShare}
						className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#fae100] text-sm font-semibold text-[#191600] shadow-(--sharp-shadow)"
					>
						<Send size={16} />
						카톡 공유
					</button>
					<button
						type="button"
						onPointerDown={onRerollStart}
						onClick={() => void reroll()}
						disabled={isRerolling}
						aria-label="다시 굴리기"
						className={`${roundButtonClass} bg-(--bg)`}
					>
						{isRerolling ? <LoaderCircle size={18} className="animate-spin" /> : <Dices size={18} />}
					</button>
					<button
						type="button"
						onClick={onToggleFavorite}
						aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
						aria-pressed={isFavorite}
						className={`${roundButtonClass} ${isFavorite ? 'bg-[#fae100]' : 'bg-(--bg)'}`}
					>
						<Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
					</button>
				</div>
			</motion.div>
		</motion.div>
	)
}
