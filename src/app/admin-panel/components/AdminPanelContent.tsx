'use client'

import LoadingScreen from '@/app/components/LoadingScreen'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Dashboard from '../dashboard/page'
import MenuTable from '../menu/page'
import Orders from '../orders/page'
import Settings from '../settings/page'
import Statistics from '../statistics/page'
import { AdminNavbar } from './AdminNavbar'

const renderTabContent = (tab: string) => {
	switch (tab) {
		case 'dashboard': return <Dashboard />
		case 'orders': return <Orders />
		case 'menu': return <MenuTable />
		case 'statistics': return <Statistics />
		case 'settings': return <Settings />
		default: return <Dashboard />
	}
}

const AdminPanelContent = () => {
	const searchParams = useSearchParams()
	const tabParam = searchParams.get('tab')
	const validTabs = ['dashboard', 'orders', 'menu', 'statistics', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'

	return (
		<div className="min-h-screen bg-muted">
			<AdminNavbar />

			<main className="pt-14">
				<div className="p-4 md:p-6 lg:p-8">
					<Suspense fallback={<LoadingScreen fullScreen />}>
						{renderTabContent(tab)}
					</Suspense>
				</div>
			</main>
		</div>
	)
}

export default AdminPanelContent
