import { cn } from '@/lib/utils'

interface SidebarProps {
	children: React.ReactNode
	className?: string
}

export const Sidebar = ({ children, className }: SidebarProps) => {
	return (
		<nav className={cn("min-w-64 w-fit bg-secondary shadow-primary shadow-sm h-full", className)}>
			<div className="p-6">
				<h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
			</div>
			<ul className="pt-8">
				{children}
			</ul>
		</nav>
	)
}
