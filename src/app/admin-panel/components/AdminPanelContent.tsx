'use client'

import LoadingScreen from '@/app/components/LoadingScreen'
import { hasPermission, type Permission } from '@/lib/roles'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import Dashboard from '../dashboard/page'
import Analytics from '../analytics/page'
import MenuTable from '../menu/page'
import Orders from '../orders/page'
import Reservations from '../reservations/page'
import Settings from '../settings/page'
import { AdminNavbar } from './AdminNavbar'

// Orders and Menu handle their own scroll container (below PageHeader).
// Other pages are wrapped in a generic scroll div.
const withScroll = (children: React.ReactNode) => (
	<div className="min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
)

const renderTabContent = (tab: string) => {
	switch (tab) {
		case 'orders':       return <Orders />
		case 'reservations': return <Reservations />
		case 'menu':         return <MenuTable />
		case 'dashboard':    return withScroll(<Dashboard />)
		case 'analytics':    return withScroll(<Analytics />)
		case 'settings':     return withScroll(<Settings />)
		default:             return withScroll(<Dashboard />)
	}
}

const TAB_PERMISSIONS: Record<string, Permission> = {
	 dashboard: 'dashboard.view',
	 analytics: 'dashboard.view',
	 orders: 'orders.view',
	 reservations: 'reservations.view',
	 menu: 'menu.view',
	 settings: 'settings.view',
}

const AdminPanelContent = () => {
	const searchParams = useSearchParams()
	const { data: session } = useSession()
	const tabParam = searchParams?.get('tab')
	const validTabs = ['dashboard', 'analytics', 'orders', 'reservations', 'menu', 'settings']
	const tab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'
	const canAccessTab = hasPermission(session?.user?.role, session?.user?.permissions, TAB_PERMISSIONS[tab])

	useEffect(() => {
		document.documentElement.classList.add('admin-panel-document')
		document.body.classList.add('admin-panel-document')
		document.documentElement.scrollLeft = 0
		document.body.scrollLeft = 0

		return () => {
			document.documentElement.classList.remove('admin-panel-document')
			document.body.classList.remove('admin-panel-document')
		}
	}, [])

	return (
		<div className="admin-panel-shell flex h-dvh w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-muted pt-14">
			<AdminNavbar />

			<main className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden">
				<Suspense fallback={<LoadingScreen fullScreen />}>
					{canAccessTab ? renderTabContent(tab) : (
						<div className="flex min-h-full items-center justify-center p-8"><div className="max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Brak uprawnień</h2><p className="mt-2 text-sm text-muted-foreground">Twoje konto nie ma dostępu do tego obszaru panelu.</p></div></div>
					)}
				</Suspense>
			</main>
		</div>
	)
}

export default AdminPanelContent
