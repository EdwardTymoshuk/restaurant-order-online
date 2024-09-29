// src/app/providers.tsx
'use client'

import { CartProvider } from '@/app/context/CartContext'
import { CheckoutProvider } from '@/app/context/CheckoutContext'
import { trpc } from '@/utils/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { httpBatchLink } from '@trpc/client'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'
import superjson from 'superjson'
import { MenuProvider } from '../context/MenuContext'
import { OrderProvider } from '../context/OrderContext'

const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [queryClient] = useState(() => new QueryClient())
	const [trpcClient] = useState(() =>
		trpc.createClient({
			transformer: superjson,
			links: [
				httpBatchLink({
					url: '/api/trpc',
				}),
			],
		})
	)

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
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
		</trpc.Provider>
	)
}

export default Providers
