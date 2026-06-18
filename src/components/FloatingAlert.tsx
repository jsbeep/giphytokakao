import { AlertTriangle, KeyRound } from 'lucide-react'

import type { ApiAlert } from '../types/types'

interface FloatingAlertProps {
	apiAlert: ApiAlert
}

export default function FloatingAlert({ apiAlert }: FloatingAlertProps) {
	return (
		<div
			role="status"
			className={`absolute -top-[130px] left-1/2 z-1 flex w-[min(560px,90vw)] -translate-x-1/2 items-center gap-4 rounded-[18px] border px-5 py-[18px] text-base shadow-(--sharp-shadow) ${
				apiAlert.type === 'limit'
					? 'border-[var(--border-strong)] bg-[linear-gradient(135deg,var(--surface),var(--surface-strong))]'
					: 'border-[var(--border)] bg-[linear-gradient(135deg,var(--surface),var(--surface-strong))]'
			}`}
		>
			<div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-(--alert) text-(--ink)">
				{apiAlert.type === 'limit' ? (
					<AlertTriangle size={34} />
				) : (
					<KeyRound size={34} color="var(--bg)" />
				)}
			</div>
			<div className="flex flex-col gap-1">
				<strong className="text-[18px] text-[var(--ink)]">
					{apiAlert.title}
				</strong>

				<p className="m-0 text-sm text-[var(--muted)]">
					{apiAlert.message}
				</p>
			</div>
		</div>
	)
}
