import type { AppRouter } from '@/server/trpc/appRouter'
import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import { getSession } from 'next-auth/react'
import superjson from 'superjson'

export const trpc = createTRPCNext<AppRouter>({
	config() {
		return {
			transformer: superjson,
			links: [
				httpBatchLink({
					url: '/api/trpc',
					async headers() {
						const session = await getSession() // Отримуємо сесію
						return {
							Authorization: session?.user?.accessToken ? `Bearer ${session.user.accessToken}` : '',
						}
					},
				}),
			],
		}
	},
	ssr: false,
})
