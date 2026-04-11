'use client'

import { cn } from '@/utils/utils'
import { MdClose } from 'react-icons/md'

interface SidebarProps {
	children: React.ReactNode
	className?: string
	onClose?: () => void
}

export const Sidebar = ({ children, className, onClose }: SidebarProps) => {

	return (
		<nav id="sidebar" className={cn("w-64 bg-secondary h-full flex flex-col", className)}>
			{/* Mobile close button */}
			<div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-white/10">
				<span className="text-white/60 text-xs font-sans font-light tracking-widest uppercase">Menu</span>
				<button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
					<MdClose size={20} />
				</button>
			</div>

			<ul className="pt-4 pb-4 flex-1">
				{children}
			</ul>
		</nav>
	)
}
