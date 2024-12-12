// src/app/components/Providers.tsx
'use client'

import { CartProvider } from '@/app/context/CartContext'
import { CheckoutProvider } from '@/app/context/CheckoutContext'
import { MenuProvider } from '@/app/context/MenuContext'
import { OrderProvider } from '@/app/context/OrderContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'

const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [queryClient] = useState(() => new QueryClient())

	return (
		<QueryClientProvider client={queryClient}>
			<SessionProvider>
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
			</SessionProvider>
		</QueryClientProvider>
	)
}

export default Providers
