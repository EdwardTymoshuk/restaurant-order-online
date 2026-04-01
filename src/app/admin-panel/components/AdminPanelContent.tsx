'use client'

import LoadingScreen from '@/app/components/LoadingScreen'
import { Button } from '@/app/components/ui/button'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { FaThList } from 'react-icons/fa'
import { ImStatsBars } from 'react-icons/im'
import { IoRestaurant } from 'react-icons/io5'
import { HiSparkles } from 'react-icons/hi'
import { MdClose, MdDashboard, MdMenu, MdSettingsSuggest } from 'react-icons/md'
import Dashboard from '../dashboard/page'
import MenuTable from '../menu/page'
import Orders from '../orders/page'
import Settings from '../settings/page'
import Statistics from '../statistics/page'

const AdminPanelContent = () => {
	const searchParams = useSearchParams()
	const tabParam = searchParams.get('tab')
	const validTabs = ['dashboard', 'orders', 'menu', 'statistics', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'

	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const { data: session } = useSession()

	const displayName = session?.user?.name || session?.user?.userName || session?.user?.email || 'Użytkownik'
	const initial = displayName.charAt(0).toUpperCase()

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent | TouchEvent) => {
			const mobileMenuElement = document.getElementById('mobile-admin-menu')
			const mobileMenuButton = document.getElementById('mobile-admin-menu-button')
			const target = event.target as Node

			if (
				mobileMenuElement &&
				!mobileMenuElement.contains(target) &&
				mobileMenuButton &&
				!mobileMenuButton.contains(target) &&
				isMobileMenuOpen
			) {
				setIsMobileMenuOpen(false)
			}
		}
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsMobileMenuOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('touchstart', handleClickOutside)
		document.addEventListener('keydown', handleEscape)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('touchstart', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isMobileMenuOpen])

	useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [tab])

	const menuItems = [
		{ label: 'Pulpit', icon: <MdDashboard size={18} />, key: 'dashboard' },
		{ label: 'Zamówienia', icon: <FaThList size={16} />, key: 'orders' },
		{ label: 'Menu', icon: <IoRestaurant size={18} />, key: 'menu' },
		{ label: 'Statystyki', icon: <ImStatsBars size={16} />, key: 'statistics' },
		{ label: 'Ustawienia', icon: <MdSettingsSuggest size={19} />, key: 'settings' },
	]

	const currentTabLabel = menuItems.find((item) => item.key === tab)?.label ?? 'Pulpit'

	const renderDesktopTopNav = () => (
		<nav className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-1 md:flex">
			{menuItems.map((item) => (
				<Link
					key={item.key}
					href={`/admin-panel?tab=${item.key}`}
					className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
						tab === item.key
							? 'bg-white text-slate-900 shadow-sm shadow-slate-200'
							: 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
					}`}
				>
					{item.icon}
					<span>{item.label}</span>
				</Link>
			))}
		</nav>
	)

	const renderTabContent = () => {
		switch (tab) {
			case 'dashboard':
				return <Dashboard />
			case 'orders':
				return <Orders />
			case 'menu':
				return <MenuTable />
			case 'statistics':
				return <Statistics />
			case 'settings':
				return <Settings />
			default:
				return <Dashboard />
		}
	}

	return (
		<>
			<div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
				<header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur">
					<div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-4 sm:px-6">
						<div className="flex items-center gap-4">
							<button
								id="mobile-admin-menu-button"
								onClick={() => setIsMobileMenuOpen((prev) => !prev)}
								className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
								aria-label={isMobileMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
							>
								{isMobileMenuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
							</button>
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
									Spoko
								</p>
								<p className="text-lg font-semibold text-slate-900">Admin Panel</p>
							</div>
						</div>

						{renderDesktopTopNav()}

						<div className="flex items-center gap-3">
							<div className="hidden text-right md:block">
								<p className="text-sm font-semibold text-slate-800">{displayName}</p>
								<p className="text-xs text-slate-500">Panel operacyjny</p>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-white">
								{initial}
							</div>
							<Button
								onClick={() => signOut()}
								variant="outline"
								className="hidden h-10 rounded-xl border-slate-300 px-4 text-slate-700 hover:bg-slate-100 md:inline-flex"
							>
								Wyloguj się
							</Button>
						</div>
					</div>

					<div
						id="mobile-admin-menu"
						className={`border-t border-slate-200 bg-white/95 px-4 pb-4 pt-3 shadow-lg transition-all md:hidden ${
							isMobileMenuOpen
								? 'translate-y-0 opacity-100'
								: 'pointer-events-none -translate-y-2 opacity-0'
						}`}
					>
						<div className="grid grid-cols-1 gap-2">
							{menuItems.map((item) => (
								<Link
									key={item.key}
									href={`/admin-panel?tab=${item.key}`}
									className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
										tab === item.key
											? 'bg-secondary text-white'
											: 'bg-slate-100 text-slate-700'
									}`}
								>
									{item.icon}
									<span>{item.label}</span>
								</Link>
							))}
							<div className="mt-1 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
								<div className="flex items-center gap-2 text-sm text-slate-700">
									<HiSparkles className="text-secondary" />
									<span>{currentTabLabel}</span>
								</div>
								<Button
									onClick={() => signOut()}
									variant="outline"
									className="h-9 rounded-lg border-slate-300 px-3 text-xs"
								>
									Wyloguj
								</Button>
							</div>
						</div>
					</div>
				</header>

				<main className="mx-auto w-full max-w-[1500px] px-3 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
					<div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-lg shadow-slate-200/60 sm:px-6 sm:py-6 lg:rounded-3xl lg:px-8 lg:py-8">
						<div className="mb-4 flex items-end justify-between border-b border-slate-100 pb-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
									Panel administracyjny
								</p>
								<h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
									{currentTabLabel}
								</h1>
							</div>
							<div className="hidden text-right sm:block">
								<p className="text-sm font-medium text-slate-700">Cześć, {displayName}</p>
								<p className="text-xs text-slate-500">Wszystkie narzędzia pod ręką</p>
							</div>
						</div>

						<section className="min-h-[calc(100vh-15rem)]">
							<Suspense fallback={<LoadingScreen fullScreen />}>
								{renderTabContent()}
							</Suspense>
						</section>
					</div>
				</main>
			</div>
		</>
	)
}

export default AdminPanelContent
