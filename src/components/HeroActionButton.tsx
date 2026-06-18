import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/** shared visual base for the circular glass icon buttons used around the hero/sheet header */
export const heroActionClass =
	'grid h-7.5 w-11 place-items-center rounded-full border border-(--border) bg-(--bg) p-0 text-[var(--ink)] shadow-(--sharp-shadow) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:h-12 sm:w-12'

const heroActionMotion = {
	whileHover: {
		y: -2,
		scale: 1.05,
		borderColor: 'rgba(255,255,255,0.6)',
		backgroundColor: 'rgba(255,255,255,0.25)',
	},
	whileTap: { scale: 0.95 },
	transition: { duration: 0.2, ease: 'easeOut' as const },
}

interface HeroActionButtonProps {
	onClick: () => void
	ariaLabel: string
	children: ReactNode
}

export default function HeroActionButton({ onClick, ariaLabel, children }: HeroActionButtonProps) {
	return (
		<motion.button
			type="button"
			className={heroActionClass}
			{...heroActionMotion}
			onClick={onClick}
			aria-label={ariaLabel}
		>
			{children}
		</motion.button>
	)
}
