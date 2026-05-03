'use client'

import LoadingScreen from '@/app/components/LoadingScreen'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Dashboard from '../dashboard/page'
import MenuTable from '../menu/page'
import Orders from '../orders/page'
import Reservations from '../reservations/page'
import Settings from '../settings/page'
import { AdminNavbar } from './AdminNavbar'

// Orders and Menu handle their own scroll container (below PageHeader).
// Other pages are wrapped in a generic scroll div.
const withScroll = (children: React.ReactNode) => (
	<div className="flex-1 overflow-y-auto min-h-0">{children}</div>
)

const renderTabContent = (tab: string) => {
	switch (tab) {
		case 'orders':       return <Orders />
		case 'reservations': return <Reservations />
		case 'menu':         return <MenuTable />
		case 'dashboard':    return withScroll(<Dashboard />)
		case 'settings':     return withScroll(<Settings />)
		default:             return withScroll(<Dashboard />)
	}
}

const AdminPanelContent = () => {
	const searchParams = useSearchParams()
	const tabParam = searchParams.get('tab')
	const validTabs = ['dashboard', 'orders', 'reservations', 'menu', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'

	return (
		<div className="h-screen flex flex-col bg-muted pt-14">
			<AdminNavbar />

			<main className="flex-1 flex flex-col overflow-hidden min-h-0">
				<Suspense fallback={<LoadingScreen fullScreen />}>
					{renderTabContent(tab)}
				</Suspense>
			</main>
		</div>
	)
}

export default AdminPanelContent
