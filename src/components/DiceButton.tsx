import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from 'framer-motion'

/** a press shorter than this is a plain tap that only rolls the number */
const HOLD_DELAY_MS = 180
/** charging time until the gauge is full; releasing after that pops a random GIF */
const CHARGE_MS = 900
/** moving further than this while pressed turns the press into a drag and cancels the charge */
const DRAG_CANCEL_PX = 10
const SPIN_INTERVAL_MS = 70
const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

type Phase = 'idle' | 'charging' | 'charged' | 'rolling'

function rollDice() {
	return Math.floor(Math.random() * 99) + 1
}

const vibrate = (ms: number) => {
	try {
		navigator.vibrate?.(ms)
	} catch {
		// not supported (e.g. iOS Safari)
	}
}

/** the dice wobbles harder as the charge builds, and spins while the GIF is on its way */
const diceMotion = (phase: Phase, isPressed: boolean): { animate: TargetAndTransition; transition: Transition } => {
	if (phase === 'rolling') {
		return {
			animate: { scale: 1.06, rotate: [0, 360], filter: 'saturate(1.3) contrast(1.08)' },
			transition: { rotate: { duration: 0.45, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }, default: { duration: 0.2 } },
		}
	}
	if (phase === 'charged') {
		return {
			animate: { scale: [1.12, 1.18, 1.12], rotate: [0, -14, 14, 0], filter: 'saturate(1.6) contrast(1.15)' },
			transition: { duration: 0.12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
		}
	}
	if (phase === 'charging' || isPressed) {
		return {
			animate: {
				scale: [1, 1.11, 1.03],
				rotate: [0, -8, 8, 0],
				filter: ['saturate(1) contrast(1)', 'saturate(1.45) contrast(1.12)', 'saturate(1.2) contrast(1.05)'],
			},
			transition: { duration: 0.24, repeat: Number.POSITIVE_INFINITY, repeatType: 'loop', ease: 'easeInOut' },
		}
	}
	return { animate: { scale: 1, rotate: 0, filter: 'none' }, transition: { duration: 0.18, ease: 'easeOut' } }
}

interface DiceButtonProps {
	/** a charge started: begin fetching now so the pop feels instant */
	onChargeStart: () => void
	/** a full charge was released (or Enter/Space pressed); resolves once the GIF is showing */
	onPop: () => Promise<void>
}

/** tap rolls the number; press and hold until the ring fills, then let go to pop a random GIF */
export default function DiceButton({ onChargeStart, onPop }: DiceButtonProps) {
	const [value, setValue] = useState(() => rollDice())
	const [isPressed, setIsPressed] = useState(false)
	const [phase, setPhaseState] = useState<Phase>('idle')
	const [burstKey, setBurstKey] = useState(0)
	const [failKey, setFailKey] = useState(0)
	// handlers and timers read these so they never act on a stale render
	const phaseRef = useRef<Phase>('idle')
	const pressedRef = useRef(false)
	const pressRef = useRef<{ x: number; y: number; timers: number[] } | null>(null)

	const setPhase = (next: Phase) => {
		phaseRef.current = next
		setPhaseState(next)
	}

	// the number spins while charging or rolling and settles when the dice does
	useEffect(() => {
		if (phase === 'idle') {
			return
		}
		const intervalId = window.setInterval(() => setValue(rollDice()), SPIN_INTERVAL_MS)
		return () => window.clearInterval(intervalId)
	}, [phase])

	useEffect(() => {
		const press = pressRef
		return () => press.current?.timers.forEach((timer) => window.clearTimeout(timer))
	}, [])

	const stopCharging = () => {
		pressRef.current?.timers.forEach((timer) => window.clearTimeout(timer))
		pressRef.current = null
		if (phaseRef.current === 'charging' || phaseRef.current === 'charged') {
			setPhase('idle')
		}
	}

	const pop = async () => {
		setPhase('rolling')
		try {
			await onPop()
			setBurstKey((key) => key + 1)
			vibrate(30)
		} catch {
			// the caller shows what went wrong; the dice just shakes its head
			setFailKey((key) => key + 1)
		} finally {
			setPhase('idle')
			setValue(rollDice())
		}
	}

	const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
		if (phaseRef.current === 'rolling') {
			return
		}
		stopCharging()
		pressedRef.current = true
		setIsPressed(true)

		const press = { x: event.clientX, y: event.clientY, timers: [] as number[] }
		press.timers.push(
			window.setTimeout(() => {
				setPhase('charging')
				onChargeStart()
				press.timers.push(
					window.setTimeout(() => {
						setPhase('charged')
						vibrate(15)
					}, CHARGE_MS),
				)
			}, HOLD_DELAY_MS),
		)
		pressRef.current = press
	}

	const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
		const press = pressRef.current
		if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_CANCEL_PX) {
			stopCharging()
		}
	}

	/** pointer up or drag end (both can fire for one press, so only the first one counts) */
	const handleRelease = () => {
		if (!pressedRef.current) {
			return
		}
		pressedRef.current = false
		setIsPressed(false)

		if (phaseRef.current === 'charged') {
			pressRef.current?.timers.forEach((timer) => window.clearTimeout(timer))
			pressRef.current = null
			void pop()
			return
		}
		stopCharging()
		setValue(rollDice())
	}

	const handlePointerCancel = () => {
		if (!pressedRef.current) {
			return
		}
		pressedRef.current = false
		setIsPressed(false)
		stopCharging()
	}

	// Enter/Space can't be held, so the keyboard pops straight away. Handled on keydown (not click) because
	// browsers disagree on click.detail for keyboard activation, and preventDefault stops the native click.
	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return
		}
		event.preventDefault()
		if (!event.repeat && phaseRef.current === 'idle') {
			onChargeStart()
			void pop()
		}
	}

	const isActive = phase !== 'idle'
	const { animate, transition } = diceMotion(phase, isPressed)
	const ringFull = phase === 'charged' || phase === 'rolling'

	return (
		<div className="relative grid place-items-center">
			{burstKey > 0 && (
				<div key={burstKey} className="pointer-events-none absolute inset-0" aria-hidden="true">
					<motion.span
						className="absolute inset-0 rounded-full border-4 border-[#fae100]"
						initial={{ scale: 0.8, opacity: 1 }}
						animate={{ scale: 2.4, opacity: 0 }}
						transition={{ duration: 0.55, ease: 'easeOut' }}
					/>
					{SPARK_ANGLES.map((angle) => (
						<motion.span
							key={angle}
							className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-[#fae100] shadow-[0_0_8px_rgba(250,225,0,0.8)]"
							initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
							animate={{
								x: Math.cos((angle * Math.PI) / 180) * 110,
								y: Math.sin((angle * Math.PI) / 180) * 110,
								scale: 0.3,
								opacity: 0,
							}}
							transition={{ duration: 0.6, ease: 'easeOut' }}
						/>
					))}
				</div>
			)}
			<motion.button
				type="button"
				className={[
					'no-select relative grid aspect-square w-[clamp(112px,24vw,148px)] place-items-center overflow-hidden rounded-full',
					'border border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,255,255,0.22))]',
					'shadow-md backdrop-blur-md',
					// transform is left to framer-motion: a CSS transition on it would smear the spin
					'transition-[translate,box-shadow,border-color,background-color] duration-200 ease-out',
					'hover:-translate-y-0.5 hover:border-[var(--border)]',
					phase === 'rolling' ? 'cursor-progress' : isPressed ? 'cursor-grabbing z-[99]' : 'cursor-grab',
				].join(' ')}
				drag={phase !== 'rolling'}
				dragConstraints={{ left: -58, right: 58, top: -24, bottom: 24 }}
				dragElastic={0.7}
				dragMomentum={false}
				dragSnapToOrigin
				dragTransition={{
					bounceStiffness: 30,
					bounceDamping: 8,
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handleRelease}
				onPointerCancel={handlePointerCancel}
				onDragEnd={handleRelease}
				onKeyDown={handleKeyDown}
				onContextMenu={(event) => event.preventDefault()}
				animate={animate}
				transition={transition}
				aria-label="주사위: 꾹 눌러서 링이 차면 손을 떼 랜덤 GIF 뽑기"
				aria-busy={phase === 'rolling'}
			>
				<span
					className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_38%)]"
					aria-hidden="true"
				/>
				{/* charge gauge: fills while holding, turns Kakao yellow when a release will pop */}
				<svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
					<motion.circle
						cx="50"
						cy="50"
						r="46"
						fill="none"
						strokeWidth="5"
						strokeLinecap="round"
						initial={false}
						animate={{
							pathLength: phase === 'charging' || ringFull ? 1 : 0,
							opacity: isActive ? 1 : 0,
							stroke: ringFull ? '#fae100' : 'rgba(7,8,10,0.45)',
						}}
						transition={{
							pathLength: phase === 'charging' ? { duration: CHARGE_MS / 1000, ease: 'linear' } : { duration: 0.15 },
							opacity: { duration: 0.15 },
							stroke: { duration: 0.12 },
						}}
					/>
				</svg>
				<motion.span
					key={failKey}
					className="pointer-events-none relative z-[1] text-[2.8rem] leading-none"
					aria-hidden="true"
					initial={false}
					animate={failKey > 0 ? { x: [0, -9, 9, -6, 6, 0] } : undefined}
					transition={{ duration: 0.4 }}
				>
					🎲
				</motion.span>
				<AnimatePresence mode="wait" initial={false}>
					<motion.span
						// while spinning the number just flickers; it animates in once it settles
						key={isActive ? 'spin' : value}
						className="pointer-events-none absolute bottom-[13%] z-[1] rounded-full bg-[rgba(255,255,255,0.78)] px-2 py-0.5 text-[0.9rem] font-semibold tracking-[0.06em] text-[var(--ink)] shadow-[0_8px_16px_rgba(20,16,8,0.1)]"
						aria-hidden="true"
						initial={{ y: -10, opacity: 0, scale: 0.7 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={{ y: 10, opacity: 0, scale: 0.7 }}
						transition={{ duration: 0.16, ease: 'easeOut' }}
					>
						{value}
					</motion.span>
				</AnimatePresence>
			</motion.button>
		</div>
	)
}
