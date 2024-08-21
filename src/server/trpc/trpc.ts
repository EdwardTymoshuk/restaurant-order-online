// src/server/trpc.ts
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

// Ініціалізація tRPC з superjson
const t = initTRPC.create({
	transformer: superjson, // Для підтримки складних типів даних, як-от Date
	errorFormatter({ shape }) {
		return shape
	},
})

export const router = t.router
export const publicProcedure = t.procedure
