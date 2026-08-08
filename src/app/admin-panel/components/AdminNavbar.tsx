'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { cn } from '@/utils/utils'
import { hasPermission, ROLE_LABELS, type Permission } from '@/lib/roles'
import { CalendarDays, ChefHat, ClipboardList, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { RiCloseLine, RiMenu3Line } from 'react-icons/ri'
import useSWR from 'swr'
import { useAdminRealtime } from '../hooks/useAdminRealtime'

type NavbarBadges = {
	orders: number
	reservations: number
}

const fetcher = async (url: string) => {
	const response = await fetch(url)
	if (!response.ok) throw new Error('Nie udało się pobrać liczników nawigacji.')
	return response.json() as Promise<NavbarBadges>
}

const navItems = [
	{ label: 'Pulpit', key: 'dashboard', permission: 'dashboard.view' as Permission, icon: LayoutDashboard },
	{ label: 'Zamówienia', key: 'orders', permission: 'orders.view' as Permission, icon: ClipboardList },
	{ label: 'Rezerwacje', key: 'reservations', permission: 'reservations.view' as Permission, icon: CalendarDays },
	{ label: 'Menu', key: 'menu', permission: 'menu.view' as Permission, icon: ChefHat },
	{ label: 'Ustawienia', key: 'settings', permission: 'settings.view' as Permission, icon: Settings },
]

interface AdminNavbarProps {
	className?: string
	activeTab?: string
}

export const AdminNavbar = ({ className, activeTab }: AdminNavbarProps) => {
	const { data: session } = useSession()
	const searchParams = useSearchParams()
	const currentTab = activeTab || searchParams?.get('tab') || 'dashboard'
	const [mobileOpen, setMobileOpen] = useState(false)
	const { data: badges, mutate: refreshBadges } = useSWR('/api/admin-navbar-badges', fetcher, {
		refreshInterval: 0,
		revalidateOnFocus: true,
	})

	const displayName = session?.user?.name || session?.user?.email || 'Admin'
	const email = session?.user?.email || ''
	const rawRole = session?.user?.role as string | undefined
	const role = ROLE_LABELS[rawRole ?? ''] ?? 'Admin'
	const visibleNavItems = navItems.filter(({ permission }) => hasPermission(rawRole, session?.user?.permissions, permission))
	const initial = displayName.charAt(0).toUpperCase()
	const getBadgeCount = (key: string) => {
		if (key === 'orders') return badges?.orders ?? 0
		if (key === 'reservations') return badges?.reservations ?? 0
		return 0
	}
	const formatBadgeCount = (count: number) => count > 9 ? '9+' : count

	useAdminRealtime({
		onBadgesChanged: () => {
			void refreshBadges()
		},
	})

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
					{visibleNavItems.map(({ label, key, icon: Icon }) => {
						const badgeCount = getBadgeCount(key)

						return (
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
								<span>{label}</span>
								{badgeCount > 0 && (
									<span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-secondary">
										{formatBadgeCount(badgeCount)}
									</span>
								)}
							</Link>
						)
					})}
				</nav>

				{/* Right side — desktop */}
				<div className="hidden lg:flex items-center gap-2 w-52 justify-end shrink-0">
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

				{/* Mobile: spacer + header actions */}
				<div className="flex-1 lg:hidden" />
				<div className="relative lg:hidden">
					<button
						onClick={() => setMobileOpen(!mobileOpen)}
						className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white"
						aria-label={mobileOpen ? 'Zamknij menu' : 'Otwórz menu'}
					>
						{mobileOpen ? <RiCloseLine size={22} /> : <RiMenu3Line size={22} />}
					</button>
					{!mobileOpen && (badges?.orders ?? 0) + (badges?.reservations ?? 0) > 0 && (
						<span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-semibold leading-none text-secondary">
							{formatBadgeCount((badges?.orders ?? 0) + (badges?.reservations ?? 0))}
						</span>
					)}
				</div>
			</header>

			{/* Mobile dropdown */}
			{mobileOpen && (
				<div className="fixed left-0 right-0 top-14 z-50 border-t border-white/5 bg-secondary shadow-xl shadow-slate-950/20 lg:hidden">
					<nav className="flex flex-col gap-1 px-3 py-3">
						{visibleNavItems.map(({ label, key, icon: Icon }) => {
							const badgeCount = getBadgeCount(key)

							return (
								<Link
									key={key}
									href={`/admin-panel?tab=${key}`}
									onClick={() => setMobileOpen(false)}
									className={cn(
										'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-sans font-medium transition-colors',
										currentTab === key
											? 'bg-white/10 text-white'
											: 'text-white/65 hover:bg-white/7 hover:text-white'
									)}
								>
									<Icon size={16} strokeWidth={1.8} />
									<span className="flex-1">{label}</span>
									{badgeCount > 0 && (
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-secondary">
											{formatBadgeCount(badgeCount)}
										</span>
									)}
								</Link>
							)
						})}
						<div className="mt-2 flex items-center justify-between rounded-xl bg-white/[0.06] px-4 py-3">
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-white/80">{displayName}</p>
								<p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{role}</p>
							</div>
							<button
								onClick={() => signOut()}
								className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/10 hover:text-red-100"
							>
								<LogOut size={14} strokeWidth={1.8} />
								Wyloguj
							</button>
						</div>
					</nav>
				</div>
			)}
		</>
	)
}
