'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

const ClientRoutingHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const pathname = usePathname()
	const isAdminPanel = pathname?.startsWith('/admin-panel')
	const isHomePage = pathname === '/'

	return (
		<>
			{!isAdminPanel && <Header />}
			{!isAdminPanel && !isHomePage ? (
				<MainContainer>
					{children}
				</MainContainer>
			) : (
				children
			)}
			{!isAdminPanel && <Footer />}
		</>
	)
}

export default ClientRoutingHandler
