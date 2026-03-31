'use client'

import LoadingScreen from '@/app/components/LoadingScreen'
import { Button } from '@/app/components/ui/button'
import { signOut, useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { FaThList } from 'react-icons/fa'
import { ImStatsBars } from 'react-icons/im'
import { IoRestaurant } from 'react-icons/io5'
import { MdDashboard, MdMenu, MdSettingsSuggest } from 'react-icons/md'
import Dashboard from '../dashboard/page'
import MenuTable from '../menu/page'
import Orders from '../orders/page'
import Settings from '../settings/page'
import Statistics from '../statistics/page'
import { Sidebar } from './sidebar'
import { SidebarLink } from './sidebar-link'

const AdminPanelContent = () => {
	const searchParams = useSearchParams()
	const tabParam = searchParams.get('tab')
	const validTabs = ['dashboard', 'orders', 'menu', 'statistics', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'

	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	const { data: session } = useSession()

	const displayName = session?.user?.name || session?.user?.userName || session?.user?.email || 'Użytkownik'
	const initial = displayName.charAt(0).toUpperCase()

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent | TouchEvent) => {
			const sidebarElement = document.getElementById('sidebar')
			if (sidebarElement && !sidebarElement.contains(event.target as Node) && isSidebarOpen) {
				setIsSidebarOpen(false)
			}
		}
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsSidebarOpen(false)
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
	}, [isSidebarOpen])

	useEffect(() => {
		setIsSidebarOpen(false)
	}, [tab])

	const menuItems = [
		{ label: 'Pulpit', icon: <MdDashboard size={18} />, key: 'dashboard' },
		{ label: 'Zamówienia', icon: <FaThList size={16} />, key: 'orders' },
		{ label: 'Menu', icon: <IoRestaurant size={18} />, key: 'menu' },
		{ label: 'Statystyki', icon: <ImStatsBars size={16} />, key: 'statistics' },
		{ label: 'Ustawienia', icon: <MdSettingsSuggest size={19} />, key: 'settings' },
	]

	const currentTabLabel = menuItems.find((item) => item.key === tab)?.label ?? 'Pulpit'

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
			<div className="min-h-screen bg-slate-100">
				<header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
					<div className="flex h-16 items-center justify-between px-4">
						<div className="flex items-center gap-3">
							<button
								onClick={() => setIsSidebarOpen(true)}
								className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100"
								aria-label="Otwórz menu"
							>
								<MdMenu size={23} />
							</button>
							<div>
								<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
									Spoko Admin
								</p>
								<p className="text-sm font-semibold text-slate-900">{currentTabLabel}</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-white">
								{initial}
							</div>
						</div>
					</div>
				</header>

				<div className="mx-auto flex min-h-screen w-full max-w-[1700px]">
					<div
						className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${
							isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
						}`}
					/>
					<Sidebar
						className={`fixed inset-y-0 left-0 z-40 h-full w-[280px] transform transition-transform duration-300 ease-out ${
							isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
						} lg:sticky lg:top-0 lg:z-20 lg:translate-x-0`}
						onClose={() => setIsSidebarOpen(false)}
					>
						{menuItems.map((item) => (
							<SidebarLink
								key={item.key}
								href={`/admin-panel?tab=${item.key}`}
								isActive={tab === item.key}
								onClick={() => setIsSidebarOpen(false)}
							>
								{item.icon}
								<span>{item.label}</span>
							</SidebarLink>
						))}
					</Sidebar>

					<main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-8">
						<div className="hidden items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:flex">
							<div>
								<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
									Panel Administracyjny
								</p>
								<h1 className="text-xl font-semibold text-slate-900">{currentTabLabel}</h1>
							</div>
							<div className="flex items-center gap-4">
								<div className="text-right">
									<p className="text-sm font-medium text-slate-800">Cześć, {displayName}</p>
									<p className="text-xs text-slate-500">Miłej pracy w panelu</p>
								</div>
								<Button
									onClick={() => signOut()}
									variant="outline"
									className="border-slate-300 text-slate-700 hover:bg-slate-100"
								>
									Wyloguj się
								</Button>
							</div>
						</div>

						<section className="mt-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4 lg:mt-4 lg:p-6">
							<Suspense fallback={<LoadingScreen fullScreen />}>
								{renderTabContent()}
							</Suspense>
						</section>
					</main>
				</div>
			</div>
		</>
	)
}

export default AdminPanelContent
