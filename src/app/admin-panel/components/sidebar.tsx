'use client'

import { Button } from '@/app/components/ui/button'
import { cn } from '@/utils/utils'
import { signOut, useSession } from 'next-auth/react'
import { MdClose } from 'react-icons/md'

interface SidebarProps {
	children: React.ReactNode
	className?: string
	onClose?: () => void
}

export const Sidebar = ({ children, className, onClose }: SidebarProps) => {
	const { data: session } = useSession()

	const displayName = session?.user?.name || session?.user?.userName || session?.user?.email || 'Użytkownik'
	const initial = displayName.charAt(0).toUpperCase() // Перший символ імені користувача

	return (
		<nav id="sidebar" className={cn("min-w-64 w-fit bg-secondary shadow-primary shadow-sm h-full flex flex-col justify-between", className)}>
			<div>
				<div className="p-6 flex items-center justify-between">
					<h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
					<button
						onClick={onClose}
						className="lg:hidden text-text-primary hover:text-primary transition-all"
					>
						<MdClose size={28} />
					</button>
				</div>
				<ul className="pt-8">
					{children}
				</ul>
			</div>

			<div className='hidden lg:flex items-center p-6 border-t border-primary text-text-primary'>
				<div className="flex items-center gap-4">
					<div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-text-primary text-xl font-bold">
						{initial}
					</div>
					<div>
						<h3>Cześć, {displayName}!</h3>
						<Button
							onClick={() => signOut()}
							className="text-sm text-center text-danger w-full"
							variant='link'
							size='link'
						>
							Wyloguj się
						</Button>
					</div>
				</div>
			</div>
		</nav>
	)
}
