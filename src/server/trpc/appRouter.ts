// src/server/trpc/appRouter.ts
import { menuRouter } from './menuRouter'
import { router } from './trpc'

export const appRouter = router({
	menu: menuRouter,
})

// Експортуємо типи для автозаповнення та перевірки типів
export type AppRouter = typeof appRouter
