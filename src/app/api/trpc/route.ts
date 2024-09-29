import prisma from '@/lib/prisma'
import { appRouter } from '@/server/trpc/appRouter'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext: () => ({ prisma }),
	})

export { handler as GET, handler as POST }
