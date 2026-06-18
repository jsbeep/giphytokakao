import {
	AlertTriangle,
	KeyRound,
	RefreshCcw,
	SearchX,
	TriangleAlert,
	type LucideIcon,
} from 'lucide-react'

import type { errorType } from '../types/types'

type ErrorMetaItem = {
	icon: LucideIcon
	title: string
	message: string
}

type KnownErrorType =
	| 'RATE_LIMIT'
	| 'NO_RESULT'
	| 'PLEASE_TRY_AGAIN'
	| 'INVALID_KEY'
	| 'API_ERROR'

const errorMetaMap: Record<KnownErrorType, ErrorMetaItem> = {
	RATE_LIMIT: {
		icon: AlertTriangle,
		title: '요청이 너무 많아요',
		message: '잠시 쉬었다가 다시 시도해주세요.',
	},
	NO_RESULT: {
		icon: SearchX,
		title: '검색 결과가 없어요',
		message: '다른 키워드로 다시 찾아보세요.',
	},
	PLEASE_TRY_AGAIN: {
		icon: RefreshCcw,
		title: '잠시 후 다시 시도',
		message: '네트워크 상태를 확인한 뒤 다시 불러올 수 있어요.',
	},
	INVALID_KEY: {
		icon: KeyRound,
		title: 'API 키 문제',
		message: '키가 존재하지 않거나 잘못되었습니다. 환경변수를 확인해주세요.',
	},
	API_ERROR: {
		icon: TriangleAlert,
		title: 'API 오류',
		message: '데이터를 불러오는 중 문제가 발생했어요. 다시 시도해주세요.',
	},
}

interface ErrorMetaProps {
	error: errorType
}

export default function ErrorMeta({ error }: ErrorMetaProps) {
	if (!error || !(error in errorMetaMap)) {
		return (
			<div className="text-[48px] opacity-70" aria-hidden="true">
				<TriangleAlert size={56} />
			</div>
		)
	}

	const meta = errorMetaMap[error as keyof typeof errorMetaMap]
	const Icon = meta.icon

	return (
		<div className="flex max-w-[260px] flex-col items-center gap-3 rounded-3xl px-5 py-6 text-center ">
			<div className="grid h-14 w-14 place-items-center rounded-full bg-(--surface-strong) text-(--accent)">
				<Icon size={30} />
			</div>
			<div className="flex flex-col gap-1">
				<strong className="text-base leading-tight text-(--ink)">
					{meta.title}
				</strong>
				<p className="text-sm leading-snug text-(--muted)">
					{meta.message}
				</p>
			</div>
		</div>
	)
}
