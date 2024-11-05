// src/app/components/Providers.tsx
'use client'

import { CartProvider } from '@/app/context/CartContext'
import { CheckoutProvider } from '@/app/context/CheckoutContext'
import { MenuProvider } from '@/app/context/MenuContext'
import { OrderProvider } from '@/app/context/OrderContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'
import { NotificationProvider } from '../context/NotificationContext'

const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [queryClient] = useState(() => new QueryClient())

	return (
		<QueryClientProvider client={queryClient}>
			<CartProvider>
				<CheckoutProvider>
					<MenuProvider>
						<OrderProvider>
							<NotificationProvider>
								{children}
							</NotificationProvider>
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
