'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { cn } from '@/utils/utils'
import { BarChart2, CalendarDays, ChefHat, ClipboardList, LayoutDashboard, LogOut, Settings, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { RiCloseLine, RiMenu3Line } from 'react-icons/ri'

const navItems = [
	{ label: 'Pulpit', key: 'dashboard', icon: LayoutDashboard },
	{ label: 'Zamówienia', key: 'orders', icon: ClipboardList },
	{ label: 'Rezerwacje', key: 'reservations', icon: CalendarDays },
	{ label: 'Menu', key: 'menu', icon: ChefHat },
	{ label: 'Statystyki', key: 'statistics', icon: BarChart2 },
]

interface AdminNavbarProps {
	className?: string
	activeTab?: string
}

export const AdminNavbar = ({ className, activeTab }: AdminNavbarProps) => {
	const { data: session } = useSession()
	const searchParams = useSearchParams()
	const currentTab = activeTab || searchParams.get('tab') || 'dashboard'
	const [mobileOpen, setMobileOpen] = useState(false)

	const displayName = session?.user?.name || session?.user?.email || 'Admin'
	const email = session?.user?.email || ''
	const role = (session?.user?.role as string | undefined) || 'Admin'
	const initial = displayName.charAt(0).toUpperCase()

	return (
		<>
			<header className={cn(
				'fixed top-0 left-0 right-0 z-30 h-14 bg-secondary flex items-center px-5',
				className
			)}>
				{/* Logo */}
				<Link href="/admin-panel" className="shrink-0 flex items-center w-40">
					<Image
						src="/img/logo-admin.svg"
						alt="Spoko"
						width={96}
						height={38}
						className="object-contain"
						priority
					/>
				</Link>

				{/* Desktop nav — centered */}
				<nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
					{navItems.map(({ label, key, icon: Icon }) => (
						<Link
							key={key}
							href={`/admin-panel?tab=${key}`}
							className={cn(
								'flex items-center gap-2 px-4 text-xs font-sans font-normal transition-all duration-150 border-b-[3px] h-14',
								currentTab === key
									? 'border-primary text-white'
									: 'border-transparent text-white/60 hover:text-white'
							)}
						>
							<Icon size={16} strokeWidth={2} />
							{label}
						</Link>
					))}
				</nav>

				{/* Right side — desktop */}
				<div className="hidden lg:flex items-center gap-2 w-40 justify-end shrink-0">
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-secondary text-base font-sans font-semibold hover:opacity-90 transition-opacity focus:outline-none">
								{initial}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" sideOffset={8} className="w-60 p-0 overflow-hidden shadow-lg rounded-xl">
							{/* User info header */}
							<DropdownMenuLabel className="px-4 py-5 border-b border-border bg-muted">
								<div className="flex flex-col items-center gap-1 text-center">
									<div className="w-10 h-10 rounded-full bg-primary text-secondary text-base font-sans font-semibold flex items-center justify-center mb-1">
										{initial}
									</div>
									<span className="text-sm font-sans font-semibold text-dark-gray">{displayName}</span>
									<span className="text-[10px] font-sans font-normal tracking-widest uppercase text-muted-foreground">{role}</span>
									{email && <span className="text-xs font-sans font-normal text-muted-foreground">{email}</span>}
								</div>
							</DropdownMenuLabel>

							<div className="py-1.5">
								<DropdownMenuItem className="gap-3 font-sans font-normal text-sm py-2.5 px-4 cursor-pointer rounded-none text-dark-gray" asChild>
									<Link href="/admin-panel?tab=settings">
										<User size={17} strokeWidth={2} className="text-dark-gray shrink-0" />
										Mój profil
									</Link>
								</DropdownMenuItem>

								<DropdownMenuItem className="gap-3 font-sans font-normal text-sm py-2.5 px-4 cursor-pointer rounded-none text-dark-gray" asChild>
									<Link href="/admin-panel?tab=settings">
										<Settings size={17} strokeWidth={2} className="text-dark-gray shrink-0" />
										Ustawienia
									</Link>
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									className="gap-3 font-sans font-normal text-sm py-2.5 px-4 rounded-none text-danger focus:text-danger focus:bg-danger/10 cursor-pointer"
									onClick={() => signOut()}
								>
									<LogOut size={17} strokeWidth={2} className="shrink-0" />
									Wyloguj
								</DropdownMenuItem>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Mobile: spacer + hamburger */}
				<div className="flex-1 lg:hidden" />
				<button
					onClick={() => setMobileOpen(!mobileOpen)}
					className="lg:hidden text-white/70 hover:text-white"
				>
					{mobileOpen ? <RiCloseLine size={22} /> : <RiMenu3Line size={22} />}
				</button>
			</header>

			{/* Mobile dropdown */}
			{mobileOpen && (
				<div className="fixed top-14 left-0 right-0 z-20 bg-secondary border-t border-white/10 shadow-md lg:hidden">
					<nav className="flex flex-col p-3 gap-1">
						{navItems.map(({ label, key, icon: Icon }) => (
							<Link
								key={key}
								href={`/admin-panel?tab=${key}`}
								onClick={() => setMobileOpen(false)}
								className={cn(
									'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-sans font-light transition-all',
									currentTab === key
										? 'bg-white/15 text-white'
										: 'text-white/60 hover:text-white hover:bg-white/10'
								)}
							>
								<Icon size={16} strokeWidth={1.5} />
								{label}
							</Link>
						))}
						<div className="border-t border-white/10 mt-2 pt-2 px-4 flex items-center justify-between">
							<span className="text-sm font-sans font-light text-white/60">{displayName}</span>
							<button
								onClick={() => signOut()}
								className="flex items-center gap-1.5 text-xs font-sans font-light text-danger hover:text-danger/80"
							>
								<LogOut size={14} strokeWidth={1.5} />
								Wyloguj
							</button>
						</div>
					</nav>
				</div>
			)}
		</>
	)
}
