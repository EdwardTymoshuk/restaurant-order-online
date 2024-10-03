'use client'

import { Settings } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaThList } from 'react-icons/fa'
import { ImStatsBars } from 'react-icons/im'
import { IoRestaurant } from 'react-icons/io5'
import { MdDashboard, MdMenu, MdSettingsSuggest } from 'react-icons/md'
import Dashboard from '../dashboard/dashboard'
import MenuTable from '../menu/page'
import Orders from '../orders/orders'
import Statistics from '../statistics/page'
import { Sidebar } from './sidebar'
import { SidebarLink } from './sidebar-link'

export default function AdminPanelContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const tabParam = searchParams.get('tab')
	const validTabs = ['dashboard', 'orders', 'menu', 'statistics', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'

	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

	const menuItems = [
		{ label: 'Pulpit', icon: <MdDashboard />, key: 'dashboard' },
		{ label: 'Zamówienia', icon: <FaThList />, key: 'orders' },
		{ label: 'Menu', icon: <IoRestaurant />, key: 'menu' },
		{ label: 'Statystyki', icon: <ImStatsBars />, key: 'statistics' },
		{ label: 'Ustawienia', icon: <MdSettingsSuggest />, key: 'settings' },
	]

	return (
		<div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
			{/* Кнопка для відкриття меню на мобільних пристроях */}
			<div className="lg:hidden flex w-full items-start p-6 bg-secondary shadow-sm shadow-primary">
				<button
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
					className="text-text-primary hover:text-primary transition-all"
				>
					<MdMenu size={28} />
				</button>
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
				{tab === 'dashboard' && <Dashboard />}
				{tab === 'orders' && <Orders />}
				{tab === 'menu' && <MenuTable />}
				{tab === 'statistics' && <Statistics />}
				{tab === 'settings' && <Settings />}
			</main>
		</div>
	)
}
