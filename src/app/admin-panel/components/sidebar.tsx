'use client'

import { cn } from '@/lib/utils'
import { MdClose } from 'react-icons/md' // Додаємо іконку закриття

interface SidebarProps {
	children: React.ReactNode
	className?: string
	onClose?: () => void // Функція для закриття меню
}

export const Sidebar = ({ children, className, onClose }: SidebarProps) => {
	return (
		<nav id="sidebar" className={cn("min-w-64 w-fit bg-secondary shadow-primary shadow-sm h-full", className)}>
			<div className="p-6 flex items-center justify-between">
				{/* Заголовок Admin Panel */}
				<h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>

				{/* Кнопка для закриття, яка буде поруч з заголовком */}
				<button
					onClick={onClose} // Виклик функції для закриття
					className="lg:hidden text-text-primary hover:text-primary transition-all"
				>
					<MdClose size={28} />
				</button>
			</div>
			<ul className="pt-8">
				{children}
			</ul>
		</nav>
	)
}
