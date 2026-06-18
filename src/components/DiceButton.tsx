import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function rollDice() {
	return Math.floor(Math.random() * 99) + 1
}

export default function DiceButton() {
	const [value, setValue] = useState(() => rollDice())
	const [isDragging, setIsDragging] = useState(false)

	useEffect(() => {
		if (!isDragging ) {
			setValue(rollDice())
		}
	}, [isDragging])

	const stopRolling = () => {

		setIsDragging(false)
		// setValue(rollDice())
	}

	const startRolling = () => {

		setIsDragging(true)
		// setValue(rollDice())
		// intervalRef.current = window.setInterval(() => {
		// 	setValue(rollDice())
		// }, 70)
	}

	const handleClick = () => {
		setValue(rollDice())
	}

	return (
		<motion.button
			type="button"
			className={[
				'no-select relative grid aspect-square w-[clamp(112px,24vw,148px)] place-items-center overflow-hidden rounded-full',
				'border border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,255,255,0.22))]',
				'shadow-md backdrop-blur-md',
				'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out',
				'hover:-translate-y-0.5 hover:border-[var(--border)]',
				isDragging ? 'cursor-grabbing z-[99]' : 'cursor-grab',
			].join(' ')}
			drag
			dragConstraints={{ left: -58, right: 58, top: -24, bottom: 24 }}
			dragElastic={0.7}
			dragMomentum={false}
			dragSnapToOrigin
			dragTransition={{
				bounceStiffness: 30,
				bounceDamping: 8,
			}}
			onPointerDown={startRolling}
			onPointerUp={stopRolling}
			onPointerCancel={stopRolling}
			onDragStart={startRolling}
			onDragEnd={stopRolling}
			onClick={handleClick}
			animate={
				isDragging
					? {
						scale: [1, 1.11, 1.03],
						rotate: [0, -8, 8, 0],
						filter: [
							'saturate(1) contrast(1)',
							'saturate(1.45) contrast(1.12)',
							'saturate(1.2) contrast(1.05)',
						],
					}
					: {
						scale: 1,
						rotate: 0,
						filter: 'none',
					}
			}
			transition={
				isDragging
					? {
						duration: 0.24,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: 'loop',
						ease: 'easeInOut',
					}
					: {
						duration: 0.18,
						ease: 'easeOut',
					}
			}
			whileTap={{ scale: 1.2 }}
			aria-label="주사위 굴리기"
		>
			<span
				className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_38%)]"
				aria-hidden="true"
			/>
			<span
				className="pointer-events-none relative z-[1] text-[2.8rem] leading-none"
				aria-hidden="true"
			>
				🎲
			</span>
			<AnimatePresence mode="wait" initial={false}>
				<motion.span
					key={value}
					className="pointer-events-none absolute bottom-[13%] z-[1] rounded-full bg-[rgba(255,255,255,0.78)] px-2 py-0.5 text-[0.9rem] font-semibold tracking-[0.06em] text-[var(--ink)] shadow-[0_8px_16px_rgba(20,16,8,0.1)]"
					aria-live="polite"
					initial={{ y: -10, opacity: 0, scale: 0.7 }}
					animate={{ y: 0, opacity: 1, scale: 1 }}
					exit={{ y: 10, opacity: 0, scale: 0.7 }}
					transition={{ duration: 0.16, ease: 'easeOut' }}
				>
					{value}
				</motion.span>
			</AnimatePresence>
		</motion.button>
	)
}
