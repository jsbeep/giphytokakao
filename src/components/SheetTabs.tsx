import { motion } from 'framer-motion'
import { Clock, Search, Star, TrendingUp } from 'lucide-react'

export type SheetTab = 'recent' | 'favorites' | 'results'

interface SheetTabsProps {
	activeTab: SheetTab
	activeQuery: string
	onTabChange: (tab: SheetTab) => void
}

/** recent / favorites / results tab row, accent colour driven by --accent / --muted */
export default function SheetTabs({ activeTab, activeQuery, onTabChange }: SheetTabsProps) {
	const tabColors = (tab: SheetTab) => ({
		color: activeTab === tab ? '#07080a' : '#6a6f73',
		borderBottomColor: activeTab === tab ? '#07080a' : 'rgba(7,8,10,0)',
	})

	const tabs: { tab: SheetTab; label: string; icon: React.ReactNode }[] = [
		{ tab: 'recent', label: '최근 공유', icon: <Clock size={18} /> },
		{ tab: 'favorites', label: '즐겨찾기', icon: <Star size={18} /> },
		{
			tab: 'results',
			label: '검색 결과',
			icon: activeQuery ? <Search size={18} /> : <TrendingUp size={18} />,
		},
	]

	return (
		<div className="flex" role="tablist" aria-label="GIF 분류">
			{tabs.map(({ tab, label, icon }) => (
				<motion.button
					key={tab}
					type="button"
					role="tab"
					aria-label={label}
					aria-selected={activeTab === tab}
					className="flex w-12 justify-center border-b-2 bg-transparent text-sm font-semibold pt-3 px-1 pb-2.5 cursor-pointer"
					animate={tabColors(tab)}
					whileTap={{ y: 1 }}
					transition={{ duration: 0.2, ease: 'easeOut' }}
					onClick={() => onTabChange(tab)}
				>
					{icon}
				</motion.button>
			))}
		</div>
	)
}
