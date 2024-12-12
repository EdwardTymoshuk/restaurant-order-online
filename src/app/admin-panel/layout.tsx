// app/admin-panel/layout.tsx
'use client'

import { OrdersProvider } from '@/app/context/OrdersContext'

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
	return (
		<OrdersProvider>
			{children}
		</OrdersProvider>
	)
}
