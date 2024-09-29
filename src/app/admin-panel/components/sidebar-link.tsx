'use client'

import { cn } from '@/lib/utils'
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
					'w-full py-3 px-6 flex items-center space-x-3 text-base font-medium gap-2',
					isActive
						? 'bg-primary text-text-secondary'
						: 'text-text-primary hover:bg-slate-400 transition-all'
				)}
			>
				{children}
			</Link>
		</li>
	)
}
