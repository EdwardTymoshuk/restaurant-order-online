import { initTRPC } from '@trpc/server'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure

export const appRouter = router({
	// приклад простого роуту
	getMenuItems: publicProcedure.query(() => {
		// Логіка отримання меню з бази даних
		return [
			{ id: 1, name: 'Pizza', price: 12 },
			{ id: 2, name: 'Burger', price: 8 },
		]
	}),
})

export type AppRouter = typeof appRouter
