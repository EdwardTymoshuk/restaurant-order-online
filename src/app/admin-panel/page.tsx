'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { FaThList } from 'react-icons/fa'
import { ImStatsBars } from 'react-icons/im'
import { IoRestaurant } from 'react-icons/io5'
import { MdDashboard, MdMenu, MdSettingsSuggest } from 'react-icons/md'
import { Sidebar } from './components/sidebar'
import { SidebarLink } from './components/sidebar-link'
import Dashboard from './dashboard/dashboard'
import MenuTable from './menu/page'
import Orders from './orders/orders'
import Settings from './settings/settings'
import Statistics from './statistics/page'

export default function AdminPanel() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const tabParam = searchParams.get('tab')
	const validTabs = ['dashboard', 'orders', 'menu', 'statistics', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'

	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	const menuItems = [
		{ label: 'Pulpit', icon: <MdDashboard />, key: 'dashboard' },
		{ label: 'Zamówienia', icon: <FaThList />, key: 'orders' },
		{ label: 'Menu', icon: <IoRestaurant />, key: 'menu' },
		{ label: 'Statystyki', icon: <ImStatsBars />, key: 'statistics' },
		{ label: 'Ustawienia', icon: <MdSettingsSuggest />, key: 'settings' },
	]

	return (
		<div className="flex flex-col md:flex-row min-h-screen bg-gray-100 ">
			{/* Кнопка для відкриття меню на мобільних пристроях */}
			<div className="md:hidden flex w-full items-start p-6 bg-secondary shadow-sm shadow-primary">
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
					} md:translate-x-0 transition-transform duration-300 ease-in-out`}
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
			<main className="flex-1 p-8 md:pl-72">
				{tab === 'dashboard' && <Dashboard />}
				{tab === 'orders' && <Orders />}
				{tab === 'menu' && <MenuTable />}
				{tab === 'statistics' && <Statistics />}
				{tab === 'settings' && <Settings />}
			</main>
		</div>
	)
}
