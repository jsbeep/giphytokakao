import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { motion } from 'framer-motion'

import type { errorType, GifItem } from '../types/types'
import ErrorMeta from './ErrorMeta'
import GifCard, { type GifCardAction } from './GifCard'

/** greedily bucket items into N columns, always appending to the currently-shortest column (by estimated aspect-ratio height) */
function distributeIntoColumns(items: GifItem[], columnCount: number): GifItem[][] {
	const columns: GifItem[][] = Array.from({ length: columnCount }, () => [])
	const columnHeights = new Array(columnCount).fill(0)

	for (const item of items) {
		const shortestIndex = columnHeights.indexOf(Math.min(...columnHeights))
		columns[shortestIndex].push(item)
		columnHeights[shortestIndex] += item.originalHeight / item.originalWidth
	}

	return columns
}

interface GifPanelProps {
	items: GifItem[]
	emptyState: ReactNode
	error?: errorType
	sheetOffset: number
	isDragging: boolean
	sendingGifId: string | null
	hoveredGifId: string | null
	onHoverGif: (id: string) => void
	onShare: (gif: GifItem) => void
	getAction: (gif: GifItem) => GifCardAction
	onOpenSettings?: () => void
	/** shown under the grid when there are results, e.g. the GIPHY attribution mark */
	footer?: ReactNode
}

/** one sliding-track panel (recent / favorites / results) – masonry grid with a shared empty/error state */
export default function GifPanel({
	items,
	emptyState,
	error,
	sheetOffset,
	isDragging,
	sendingGifId,
	hoveredGifId,
	onHoverGif,
	onShare,
	getAction,
	onOpenSettings,
	footer,
}: GifPanelProps) {
	const columns = useMemo(() => distributeIntoColumns(items, 2), [items])

	return (
		<motion.div
			className="flex-1 overflow-y-auto"
			animate={{ height: sheetOffset > 0 && !isDragging ? 'calc(75vh - 115px)' : 'calc(100vh - 115px)' }}
			transition={{ duration: 0.25, ease: 'easeInOut' }}
		>
			<div
				role="tabpanel"
				className={
					items.length === 0
						? 'flex items-center justify-center h-[50vh]'
						: 'flex gap-3 pt-2.5 px-2.5 mb-[8vh]'
				}
			>
				{error ? (
					<ErrorMeta error={error} onOpenSettings={onOpenSettings} />
				) : items.length === 0 ? (
					emptyState
				) : (
					columns.map((column, columnIndex) => (
						<div key={columnIndex} className="flex flex-1 flex-col gap-3">
							{column.map((gif) => (
								<GifCard
									key={gif.id}
									gif={gif}
									isSending={sendingGifId === gif.id}
									isHovered={hoveredGifId === gif.id}
									onHover={() => onHoverGif(gif.id)}
									onShare={() => onShare(gif)}
									action={getAction(gif)}
								/>
							))}
						</div>
					))
				)}
			</div>
			{footer && !error && items.length > 0 && (
				<div className="flex justify-center mt-[-5vh] pb-[12vh]">{footer}</div>
			)}
		</motion.div>
	)
}
