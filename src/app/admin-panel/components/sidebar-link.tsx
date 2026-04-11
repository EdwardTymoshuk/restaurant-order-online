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
					'w-full py-2.5 px-5 flex items-center gap-3 text-sm font-sans font-light transition-all duration-150 relative',
					isActive
						? 'text-white bg-white/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary'
						: 'text-white/55 hover:text-white hover:bg-white/5'
				)}
			>
				{children}
			</Link>
		</li>
	)
}
