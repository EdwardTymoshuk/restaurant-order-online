'use client'

import { cn } from '@/utils/utils'
import Link from 'next/link'

interface SidebarLinkProps {
	children: React.ReactNode
	href: string
	isActive: boolean
	onClick?: () => void
}

export const SidebarLink = ({ children, href, isActive, onClick }: SidebarLinkProps) => {
	return (
		<li onClick={onClick}>
			<Link
				href={href}
				className={cn(
					'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition',
					isActive
						? 'bg-secondary text-white shadow-sm'
						: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
				)}
			>
				{children}
			</Link>
		</li>
	)
}
