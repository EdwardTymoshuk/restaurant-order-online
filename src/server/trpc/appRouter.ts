// src/server/trpc/appRouter.ts
import { imageRouter } from './imageRouter'
import { menuRouter } from './menuRouter'
import { orderRouter } from './orderRouter'
import { router } from './trpc'

export const appRouter = router({
	menu: menuRouter,
	order: orderRouter,
	image: imageRouter
})

// Експортуємо типи для автозаповнення та перевірки типів
export type AppRouter = typeof appRouter
