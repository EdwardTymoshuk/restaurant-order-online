'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

const ClientRoutingHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const pathname = usePathname()
	const isAdminPanel = pathname?.startsWith('/admin-panel') || pathname === '/auth/login'
	const isHomePage = pathname === '/'
	const isOrderPage = pathname?.startsWith('/order')
	const isCheckoutPage = pathname?.startsWith('/checkout')
	const isThankYouPage = pathname?.startsWith('/thank-you')

	return (
		<>
			{!isAdminPanel && <Header />}
			{!isAdminPanel && !isHomePage ? (
				<MainContainer
					className={
						isOrderPage
							? 'mt-12 h-[calc(100vh-48px)] min-h-0 max-w-none items-stretch overflow-hidden px-0 pt-0 md:px-0'
							: isCheckoutPage || isThankYouPage
								? 'max-w-none items-stretch px-0 pt-12 md:px-0'
								: undefined
					}
				>
					{children}
				</MainContainer>
			) : (
				children
			)}
			{!isAdminPanel && !isHomePage && !isOrderPage && !isCheckoutPage && !isThankYouPage && <Footer />}
		</>
	)
}

export default ClientRoutingHandler
