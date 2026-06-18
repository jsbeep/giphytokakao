import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CircleX, House, Search } from 'lucide-react'

interface SheetSearchBarProps {
	inputValue: string
	inputRef: React.RefObject<HTMLInputElement | null>
	onInputChange: (value: string) => void
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
	onClearInput: () => void
	onHomeClick: () => void
	onGoToResults: () => void
}

/** drag handle pill + GIPHY search input/submit row */
export default function SheetSearchBar({
	inputValue,
	inputRef,
	onInputChange,
	onSubmit,
	onClearInput,
	onHomeClick,
	onGoToResults,
}: SheetSearchBarProps) {
	return (
		<>
			{/* handle pill */}
			<div className="w-[54px] h-1 bg-black/20 rounded-full mx-auto mt-[18px] mb-[14px] [touch-action:none]" />

			{/* search row */}
			<form className="flex h-11 gap-2.5 items-center justify-center" onSubmit={onSubmit}>
				<div className="relative flex items-center h-11 flex-1 min-w-0 rounded-full px-3 bg-(--input-bg) gap-2">
					<Search size={20} color="#888" className="shrink-0" />
					<input
						ref={inputRef}
						type="search"
						value={inputValue}
						placeholder="GIPHY 검색"
						aria-label="GIPHY 검색"
						onChange={(e) => onInputChange(e.target.value)}
						className="w-full text-(--ink) text-[17px] border-none outline-none  font-(--body-font) py-3"
					/>
					<motion.button
						type="button"
						aria-label="검색어 지우기"
						tabIndex={inputValue ? 0 : -1}
						className="flex shrink-0 items-center justify-center border-none bg-transparent p-0 cursor-pointer"
						style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: inputValue ? 'auto' : 'none' }}
						animate={{ opacity: inputValue ? 1 : 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClearInput}
					>
						<CircleX size={20} color="#888" />
					</motion.button>
				</div>

				<div>
					<button
						type="submit"
						aria-label={inputValue ? '검색 결과 보기' : '홈으로 이동'}
						className="flex items-center justify-center shrink-0 h-10 w-10 rounded-full bg-(--secondary) text-white self-stretch cursor-pointer border-none"
						onClick={(e) => {
							if (!inputValue.trim()) {
								e.preventDefault()
								onHomeClick()
							} else {
								onGoToResults()
							}
						}}
					>
						{inputValue ? <ArrowRight size={18} /> : <House size={18} />}
					</button>
				</div>
			</form>
		</>
	)
}
