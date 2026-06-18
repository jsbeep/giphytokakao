import { HelpCircle, House, Search } from 'lucide-react'

import HeroActionButton from './HeroActionButton'

interface SheetHeaderActionsProps {
	onHomeClick: () => void
	onSearchClick: () => void
	onHelpClick: () => void
}

/** floating House / Search / Help buttons pinned above the sheet */
export default function SheetHeaderActions({ onHomeClick, onSearchClick, onHelpClick }: SheetHeaderActionsProps) {
	return (
		<div className="absolute -top-10 right-2 z-10 flex justify-end gap-[0.6rem]">
			<HeroActionButton onClick={onHomeClick} ariaLabel="첫 화면으로">
				<House size={20} />
			</HeroActionButton>
			<HeroActionButton onClick={onSearchClick} ariaLabel="검색하러 가기">
				<Search size={20} />
			</HeroActionButton>
			<HeroActionButton onClick={onHelpClick} ariaLabel="도움말">
				<HelpCircle size={20} />
			</HeroActionButton>
		</div>
	)
}
