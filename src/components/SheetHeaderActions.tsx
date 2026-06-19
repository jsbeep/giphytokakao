import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HelpCircle, House, Search } from 'lucide-react'

import HeroActionButton from './HeroActionButton'
import { giphyCache } from '../utils/giphyCache'

const REMAINING_LABEL_MS = 1500

interface SheetHeaderActionsProps {
	onHomeClick: () => void
	onSearchClick: () => void
	onHelpClick: () => void
}

/** floating House / Search / Help buttons pinned above the sheet */
export default function SheetHeaderActions({ onHomeClick, onSearchClick, onHelpClick }: SheetHeaderActionsProps) {
	const [remainingLabel, setRemainingLabel] = useState<string | null>(null)
	const hideTimerRef = useRef<number | null>(null)

	const handleHomeClick = () => {
		const remainingMs = giphyCache.getRemainingMs()
		const label = remainingMs > 0 ? `${Math.ceil(remainingMs / 60000)}분 후 갱신` : '캐시 만료, 새로 불러옴'
		setRemainingLabel(label)

		if (hideTimerRef.current) {
			window.clearTimeout(hideTimerRef.current)
		}
		hideTimerRef.current = window.setTimeout(() => setRemainingLabel(null), REMAINING_LABEL_MS)

		onHomeClick()
	}

	return (
		<div className="absolute -top-10 right-2 z-10 flex justify-end gap-[0.6rem]">
			<div className="relative">
				<AnimatePresence>
					{remainingLabel && (
						<motion.span
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 4 }}
							transition={{ duration: 0.15 }}
							className="flex pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-[0.68rem] text-(--ink) shadow-(--sharp-shadow)"
						>
							{remainingLabel}
						</motion.span>
					)}
				</AnimatePresence>
				<HeroActionButton onClick={handleHomeClick} ariaLabel="첫 화면으로">
					<House size={20} />
				</HeroActionButton>
			</div>
			<HeroActionButton onClick={onSearchClick} ariaLabel="검색하러 가기">
				<Search size={20} />
			</HeroActionButton>
			<HeroActionButton onClick={onHelpClick} ariaLabel="도움말">
				<HelpCircle size={20} />
			</HeroActionButton>
		</div>
	)
}
