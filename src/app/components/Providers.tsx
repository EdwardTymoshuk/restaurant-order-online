'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'

import { CartProvider } from '@/app/context/CartContext'
import { CheckoutProvider } from '@/app/context/CheckoutContext'
import { MenuProvider } from '@/app/context/MenuContext'
import { OrderProvider } from '@/app/context/OrderContext'
import Noop from './Noop' // <- Імпорт Noop-компонента, обгорнутого у withTRPC

export default function Providers({ children }: { children: ReactNode }) {
	const [queryClient] = useState(() => new QueryClient())

	return (
		<QueryClientProvider client={queryClient}>
			<SessionProvider>
				<Noop> {/* Тут підключається весь tRPC-клієнт */}
					<CartProvider>
						<CheckoutProvider>
							<MenuProvider>
								<OrderProvider>
									{children}
								</OrderProvider>
							</MenuProvider>
						</CheckoutProvider>
					</CartProvider>
				</Noop>
				<Toaster position="top-center" richColors />
				<ReactQueryDevtools initialIsOpen={false} />
			</SessionProvider>
		</QueryClientProvider>
	)
}
