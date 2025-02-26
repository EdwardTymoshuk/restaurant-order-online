import { appRouter } from '@/server/trpc/appRouter'
import { createContext } from '@/server/trpc/context'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'


const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext
	})

export { handler as GET, handler as POST }
