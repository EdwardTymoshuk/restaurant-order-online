'use client'

import LoadingScreen from '@/app/components/LoadingScreen'
import { Button } from '@/app/components/ui/button'
import { signOut, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useTransition } from 'react'
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
	const router = useRouter()
	const searchParams = useSearchParams()
	const tabParam = searchParams.get('tab')
	const validTabs = ['dashboard', 'orders', 'menu', 'statistics', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'

	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [isPageLoading, setIsPageLoading] = useState(false)

	const [isPending, startTransition] = useTransition()
	const { data: session } = useSession()

	const displayName = session?.user?.name || session?.user?.userName || session?.user?.email || 'Użytkownik'
	const initial = displayName.charAt(0).toUpperCase() // Перший символ імені користувача

	// Закриття меню при кліку поза межами
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const sidebarElement = document.getElementById('sidebar')
			if (sidebarElement && !sidebarElement.contains(event.target as Node) && isSidebarOpen) {
				setIsSidebarOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isSidebarOpen])

	useEffect(() => {
		if (isPending) {
			setIsPageLoading(true)
		} else {
			setIsPageLoading(false)
		}
	}, [isPending])

	const handleNavigation = (url: string) => {
		startTransition(() => {
			router.push(url)
		})
	}

	const menuItems = [
		{ label: 'Pulpit', icon: <MdDashboard />, key: 'dashboard' },
		{ label: 'Zamówienia', icon: <FaThList />, key: 'orders' },
		{ label: 'Menu', icon: <IoRestaurant />, key: 'menu' },
		{ label: 'Statystyki', icon: <ImStatsBars />, key: 'statistics' },
		{ label: 'Ustawienia', icon: <MdSettingsSuggest />, key: 'settings' },
	]

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
			{isPageLoading && <LoadingScreen fullScreen />}
			<div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
				{/* Кнопка для відкриття меню на мобільних пристроях */}
				<div className="lg:hidden flex justify-between w-full items-center p-4 bg-secondary shadow-sm shadow-primary">
					<button
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						className="text-text-primary hover:text-primary transition-all"
					>
						<MdMenu size={28} />
					</button>
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-text-primary text-xl font-bold">
							{initial}
						</div>
						<div className="text-center">
							<h3 className="text-text-primary">Cześć, {displayName}!</h3>
							<Button
								onClick={() => signOut()}
								className="text-sm text-center text-danger w-full"
								variant="link"
								size="link"
							>
								Wyloguj się
							</Button>
						</div>
					</div>
				</div>

				{/* Бокове меню */}
				<Sidebar
					className={`fixed min-h-screen h-auto z-20 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
						} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
					onClose={() => setIsSidebarOpen(false)} // Закриття через кнопку
				>
					{menuItems.map((item) => (
						<SidebarLink
							key={item.key}
							href={`/admin-panel?tab=${item.key}`}
							isActive={tab === item.key}
							onClick={() => setIsSidebarOpen(false)} // Закриваємо меню після вибору пункту
						>
							{item.icon} {item.label}
						</SidebarLink>
					))}
				</Sidebar>

				{/* Контент */}
				<main className="flex-1 p-2 md:p-4 lg:p-8 lg:pl-72">
					<Suspense fallback={<LoadingScreen fullScreen />}>
						{renderTabContent()}
					</Suspense>
				</main>
			</div>
		</>
	)
}

export default AdminPanelContent
