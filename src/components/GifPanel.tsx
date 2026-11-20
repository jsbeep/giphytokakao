import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import type { errorType, GifItem } from '../types/types'
import { gifAspectRatio } from '../utils/giphy'
import ErrorMeta from './ErrorMeta'
import GifCard, { type GifCardAction } from './GifCard'

/** how far below the visible area the next page starts rendering, so it's ready before you reach it */
const PRELOAD_MARGIN = '0px 0px 600px 0px'

/** greedily bucket items into N columns, always appending to the currently-shortest column (by estimated aspect-ratio height) */
function distributeIntoColumns(items: GifItem[], columnCount: number): GifItem[][] {
	const columns: GifItem[][] = Array.from({ length: columnCount }, () => [])
	const columnHeights = new Array(columnCount).fill(0)

	for (const item of items) {
		const shortestIndex = columnHeights.indexOf(Math.min(...columnHeights))
		columns[shortestIndex].push(item)
		columnHeights[shortestIndex] += 1 / gifAspectRatio(item)
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
	/**
	 * render this many at first and this many more each time the list nears its end, scrolling the list to
	 * the top whenever it's replaced (a new search); without it every item renders at once
	 */
	pageSize?: number
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
	pageSize,
}: GifPanelProps) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const sentinelRef = useRef<HTMLDivElement>(null)

	// pages belong to one list: a new list starts over from its first page
	const [page, setPage] = useState({ items, count: 1 })
	if (page.items !== items) {
		setPage({ items, count: 1 })
	}
	const visibleCount = pageSize ? page.count * pageSize : items.length
	const canLoadMore = !error && visibleCount < items.length

	// slicing is safe for the layout: each item's column depends only on the items before it
	const columns = useMemo(
		() => distributeIntoColumns(items.slice(0, visibleCount), 2),
		[items, visibleCount],
	)

	useLayoutEffect(() => {
		if (pageSize) {
			scrollRef.current?.scrollTo({ top: 0 })
		}
	}, [items, pageSize])

	useEffect(() => {
		const root = scrollRef.current
		const sentinel = sentinelRef.current
		if (!canLoadMore || !root || !sentinel) {
			return
		}

		// rebuilt after every page: a new observer reports at once, so a sentinel still in range keeps filling
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setPage((current) => (current.items === items ? { items, count: current.count + 1 } : current))
				}
			},
			{ root, rootMargin: PRELOAD_MARGIN },
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [items, visibleCount, canLoadMore])

	return (
		<motion.div
			ref={scrollRef}
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
			{canLoadMore && <div ref={sentinelRef} aria-hidden="true" />}
			{footer && !error && items.length > 0 && (
				<div className="flex justify-center mt-[-5vh] pb-[12vh]">{footer}</div>
			)}
		</motion.div>
	)
}
