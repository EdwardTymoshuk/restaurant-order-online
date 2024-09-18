// Providers.tsx
'use client'

import { CartProvider } from '@/app/context/CartContext'
import { CheckoutProvider } from '@/app/context/CheckoutContext' // Import your new context
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { MenuProvider } from '../context/MenuContext'
import { OrderProvider } from '../context/OrderContext'

const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
	const queryClient = new QueryClient()

	return (
		<QueryClientProvider client={queryClient}>
			<CartProvider>
				<CheckoutProvider>
					<MenuProvider>
						<OrderProvider>
							{children}
						</OrderProvider>
					</MenuProvider>
				</CheckoutProvider>
			</CartProvider>
			<Toaster position='top-center' richColors />
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	)
}

export default Providers
