'use client'

import { Button } from '@/app/components/ui/button'
import { cn } from '@/utils/utils'
import { signOut, useSession } from 'next-auth/react'
import { HiSparkles } from 'react-icons/hi'
import { MdClose } from 'react-icons/md'

interface SidebarProps {
	children: React.ReactNode
	className?: string
	onClose?: () => void
}

export const Sidebar = ({ children, className, onClose }: SidebarProps) => {
	const { data: session } = useSession()

	const displayName = session?.user?.name || session?.user?.userName || session?.user?.email || 'Użytkownik'
	const initial = displayName.charAt(0).toUpperCase()

	return (
		<nav
			id="sidebar"
			className={cn(
				'flex h-full min-w-0 flex-col border-r border-slate-200 bg-white',
				className
			)}
		>
			<div className="flex-1 px-4 py-4">
				<div className="mb-6 flex items-center justify-between px-1">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
							Spoko
						</p>
						<h1 className="text-xl font-semibold text-slate-900">Admin Panel</h1>
					</div>
					<button
						onClick={onClose}
						className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
						aria-label="Zamknij menu"
					>
						<MdClose size={24} />
					</button>
				</div>

				<div className="mb-6 rounded-xl border border-secondary/20 bg-secondary/5 px-3 py-3">
					<div className="flex items-center gap-2 text-sm font-medium text-secondary">
						<HiSparkles />
						Panel operacyjny restauracji
					</div>
					<p className="mt-1 text-xs leading-5 text-slate-500">
						Zarządzaj zamówieniami, menu i ustawieniami z jednego miejsca.
					</p>
				</div>

				<ul className="space-y-1">{children}</ul>
			</div>

			<div className="border-t border-slate-200 p-4">
				<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
					<div className="mb-3 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-white">
							{initial}
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
							<p className="text-xs text-slate-500">Konto administratora</p>
						</div>
					</div>
					<Button
						onClick={() => signOut()}
						variant="outline"
						className="w-full border-slate-300 text-slate-700 hover:bg-white"
					>
						Wyloguj się
					</Button>
				</div>
			</div>
		</nav>
	)
}
