import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

import type { GifItem, GifSendStatus } from '../types/types'
import { gifAspectRatio } from '../utils/giphy'

/** glass pill button – colour signals on/off state, sizing/position handled by the motion wrapper around it */
function GifActionButton({
	onClick,
	label,
	children,
	active = false,
}: {
	onClick: (e: React.MouseEvent) => void
	label: string
	children: ReactNode
	active?: boolean
}) {
	return (
		<motion.button
			type="button"
			aria-label={label}
			onClick={(e) => { e.stopPropagation(); onClick(e) }}
			className="flex h-7 w-7 items-center justify-center rounded-full border-0 p-0 backdrop-blur-md text-[#ffffffe0] shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
			animate={{ backgroundColor: active ? '#fae100' : 'rgba(255,255,255,0.7)',
				color: active ? '#ffffffe0' : 'var(--ink)',
			 }}
			whileHover={active ? undefined : { backgroundColor: 'rgba(255,255,255,0.9)' }}
			whileTap={{ scale: 0.7 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
		>
			{children}
		</motion.button>
	)
}

export type GifCardAction = {
	label: string
	icon: ReactNode
	active: boolean
	onClick: () => void
}

/** masonry gif tile – tap to share, mouse hover (or the tap itself, on touch) reveals actions in sync with the image shrink, touch-first send feedback */
export default function GifCard({
	gif,
	sendStatus,
	isHovered,
	onHover,
	onShare,
	action,
}: {
	gif: GifItem
	/** null when this gif isn't the one being sent */
	sendStatus: GifSendStatus | null
	isHovered: boolean
	onHover: () => void
	onShare: () => void
	action?: GifCardAction
}) {
	const showAction = action !== undefined && (action.active || isHovered)
	const isSending = sendStatus !== null

	return (
		<div
			className="relative flex flex-col"
			// mouse only: a touch reaching here at touchstart would reveal the action button mid-tap, and iOS WebKit
			// then treats the tap as a hover and drops the click, so the share would need a second tap
			onPointerEnter={(e) => {
				if (e.pointerType === 'mouse') {
					onHover()
				}
			}}
		>
			<motion.button
				type="button"
				// touch has no hover: the tapped gif keeps its action button, so it can be starred right after sending
				onClick={() => {
					onHover()
					onShare()
				}}
				animate={{ scale: isSending ? 1.01 : isHovered ? 1.03 : 1 }}
				whileTap={{ scale: 1.03 }}
				transition={{ duration: 0.2, ease: 'easeOut' }}
				className={[
					'relative flex flex-col overflow-hidden rounded-lg border-0 p-0 cursor-pointer',
					isSending ? 'ring-2 ring-(--accent) ring-offset-2 ring-offset-(--sheet-bg)' : '',
				].join(' ')}
			>
				<img
					src={gif.previewUrl}
					alt={gif.title}
					loading="lazy"
					draggable={false}
					// reserve the height before the GIF loads, so lazy loading only fetches what's near the screen
					style={{ aspectRatio: gifAspectRatio(gif) }}
					className="block h-full w-full select-none object-cover"
				/>
				<AnimatePresence>
					{isSending && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.18 }}
							className="absolute inset-0 flex items-center justify-center bg-black/35"
						>
							<motion.div
								initial={{ scale: 0.6, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ duration: 0.18, ease: 'easeOut' }}
								className="grid h-10 w-10 place-items-center rounded-full bg-(--accent) text-white shadow-(--soft-shadow)"
							>
								{/* initial off: the first icon rides in with the circle's own pop */}
								<AnimatePresence mode="wait" initial={false}>
									<motion.span
										key={sendStatus}
										initial={{ scale: 0.5, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										exit={{ scale: 0.5, opacity: 0 }}
										transition={{ duration: 0.15, ease: 'easeOut' }}
										className="grid place-items-center"
									>
										{sendStatus === 'sending' ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
									</motion.span>
								</AnimatePresence>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.button>
			<AnimatePresence>
				{showAction && (
					<motion.div
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.5 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className="absolute top-1.5 right-1.5 z-10"
					>
						<GifActionButton label={action.label} onClick={action.onClick} active={action.active}>
							{action.icon}
						</GifActionButton>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
