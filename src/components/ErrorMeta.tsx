import {
	AlertTriangle,
	Gauge,
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
	/** label of a button that opens Settings, for errors a personal API key would fix */
	settingsAction?: string
}

type KnownErrorType =
	| 'RATE_LIMIT'
	| 'NO_RESULT'
	| 'PLEASE_TRY_AGAIN'
	| 'INVALID_KEY'
	| 'INVALID_PERSONAL_KEY'
	| 'API_KEY_REQUIRED'
	| 'DEFAULT_QUOTA_EXCEEDED'
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
		title: '기본 키 문제',
		message: '기본 키에 문제가 생겼어요. 내 GIPHY API 키를 등록하면 바로 쓸 수 있어요.',
		settingsAction: '내 API 키 등록',
	},
	INVALID_PERSONAL_KEY: {
		icon: KeyRound,
		title: 'API 키 문제',
		message: '등록한 GIPHY API 키가 올바르지 않아요.',
		settingsAction: '설정에서 키 확인',
	},
	API_KEY_REQUIRED: {
		icon: KeyRound,
		title: 'API 키가 필요해요',
		message: '이 사이트는 기본 키를 제공하지 않아요. 내 GIPHY API 키를 등록해주세요.',
		settingsAction: '내 API 키 등록',
	},
	DEFAULT_QUOTA_EXCEEDED: {
		icon: Gauge,
		title: '기본 키 사용량을 다 썼어요',
		message: '내 GIPHY API 키를 등록하면 바로 계속 쓸 수 있어요.',
		settingsAction: '내 API 키 등록',
	},
	API_ERROR: {
		icon: TriangleAlert,
		title: 'API 오류',
		message: '데이터를 불러오는 중 문제가 발생했어요. 다시 시도해주세요.',
	},
}

interface ErrorMetaProps {
	error: errorType
	onOpenSettings?: () => void
}

export default function ErrorMeta({ error, onOpenSettings }: ErrorMetaProps) {
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
			{meta.settingsAction && onOpenSettings && (
				<button
					type="button"
					onClick={onOpenSettings}
					className="mt-1 cursor-pointer rounded-full bg-(--ink) px-4 py-2 text-sm font-semibold text-(--bg) shadow-(--sharp-shadow) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2"
				>
					{meta.settingsAction}
				</button>
			)}
		</div>
	)
}
