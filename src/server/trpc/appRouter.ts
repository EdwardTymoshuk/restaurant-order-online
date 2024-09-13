// src/server/trpc/appRouter.ts
import { menuRouter } from './menuRouter'
import { orderRouter } from './orderRouter'
import { router } from './trpc'

export const appRouter = router({
	menu: menuRouter,
	order: orderRouter,
})

// Експортуємо типи для автозаповнення та перевірки типів
export type AppRouter = typeof appRouter
