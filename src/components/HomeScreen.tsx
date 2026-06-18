import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HelpCircle, House, Moon, Search, SunMedium, TriangleAlert } from 'lucide-react'

import type { GifItem } from '../types/types'

type HomeScreenProps = {
	isSendMode: boolean
	isFeaturedLoading: boolean
	featuredGif: GifItem | null
	showHelp: boolean
	theme: 'light' | 'dark'
	onReset: () => void
	onGoSearch: () => void
	onShowHelp: () => void
	onHideHelp: () => void
	onToggleTheme: () => void
}

function HomeScreen({
	isSendMode,
	isFeaturedLoading,
	featuredGif,
	showHelp,
	theme,
	onReset,
	onGoSearch,
	onShowHelp,
	onHideHelp,
	onToggleTheme,
}: HomeScreenProps) {
	return (
		<header className="hero-area">
			<div className="hero-actions">
				<button
					type="button"
					className="hero-action theme-action"
					onClick={onReset}
					aria-label="첫 화면으로"
				>
					<House size={22} />
				</button>
				<button
					type="button"
					className="hero-action theme-action"
					onClick={onGoSearch}
					aria-label="검색하러 가기"
				>
					<Search size={22} />
				</button>
				<button
					type="button"
					className="hero-action theme-action"
					onClick={onShowHelp}
					aria-label="도움말"
				>
					<HelpCircle size={22} />
				</button>
			</div>
			<h1 style={{ fontFamily: "'DM Serif Display', serif" }}>Old and Sick Kakao</h1>
			<DiceButton />
			{isSendMode && ((isFeaturedLoading || featuredGif) ? (
				<div className={isFeaturedLoading ? ' gifloading' : 'featured-gif'}>
					{isFeaturedLoading ? (
						<div className="spinner" aria-hidden="true"></div>
					) : (
						featuredGif && <img src={featuredGif.previewUrl} alt={featuredGif.title} />
					)}
				</div>
			) : (
				<TriangleAlert size={48} color="#888" aria-hidden="true" style={{ margin: '20%' }} />
			))}
			<div className="hero-link-row">
				<a
					className="hero-action github-link"
					href="https://github.com/jsb0315?tab=repositories"
					target="_blank"
					rel="noreferrer"
					aria-label="Github"
				>
					<img
						width="100%"
						height="100%"
						src="https://img.icons8.com/fluency/50/github.png"
						alt="github"
					/>
				</a>
				<button
					type="button"
					className="hero-action theme-action"
					onClick={onToggleTheme}
					aria-label={theme === 'dark' ? '화이트모드로 전환' : '다크모드로 전환'}
					aria-pressed={theme === 'dark'}
				>
					{theme === 'dark' ? <SunMedium size={22} /> : <Moon size={22} />}
				</button>
			</div>
			{showHelp && (
				<div className="help-tooltip" role="status" onPointerEnter={onHideHelp}>
					1. 한번 눌러 빠른 공유<br />
					2. 꾹 눌러 이미지 원본 공유
				</div>
			)}
		</header>
	)
}

function DiceButton() {
	const [value, setValue] = useState(() => rollDice())
	const [isDragging, setIsDragging] = useState(false)
	const intervalRef = useRef<number | null>(null)

	useEffect(() => {
		return () => {
			if (intervalRef.current !== null) {
				window.clearInterval(intervalRef.current)
			}
		}
	}, [])

	const stopRolling = () => {
		if (intervalRef.current !== null) {
			window.clearInterval(intervalRef.current)
			intervalRef.current = null
		}

		setIsDragging(false)
		setValue(rollDice())
	}

	const startRolling = () => {
		if (intervalRef.current !== null) {
			return
		}

		setIsDragging(true)
		setValue(rollDice())
		intervalRef.current = window.setInterval(() => {
			setValue(rollDice())
		}, 70)
	}

	const handleClick = () => {
		setValue(rollDice())
	}

	return (
		<motion.button
			type="button"
			className={`dice-button ${isDragging ? 'is-dragging' : ''}`}
			drag
			dragConstraints={{ left: -48, right: 48, top: -24, bottom: 24 }}
			dragElastic={0.2}
			dragMomentum={false}
			dragSnapToOrigin
			onPointerDown={startRolling}
			onPointerUp={stopRolling}
			onPointerCancel={stopRolling}
			onDragStart={startRolling}
			onDragEnd={stopRolling}
			onClick={handleClick}
			animate={
				isDragging
					? {
						scale: [1, 1.08, 1.03],
						rotate: [0, -4, 4, 0],
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
			whileTap={{ scale: 0.98 }}
			aria-label="주사위 굴리기"
		>
			<span className="dice-icon" aria-hidden="true">
				🎲
			</span>
			<AnimatePresence mode="wait" initial={false}>
				<motion.span
					key={value}
					className="dice-value"
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

function rollDice() {
	return Math.floor(Math.random() * 99) + 1
}

export default HomeScreen
