import { AppRouter } from '@/server/trpc/appRouter'
import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'

export const trpc = createTRPCNext<AppRouter>({
	config() {
		return {
			transformer: superjson,
			links: [
				httpBatchLink({
					url: '/api/trpc',
				}),
			],
		}
	},
	ssr: false,
})
