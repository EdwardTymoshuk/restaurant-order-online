// src/server/trpc/appRouter.ts
import { bannerRouter } from './bannerRouter'
import { imageRouter } from './imageRouter'
import { menuRouter } from './menuRouter'
import { orderRouter } from './orderRouter'
import { promoCodeRouter } from './promoCodeRouter'
import { settingsRouter } from './settingsRouter'
import { router } from './trpc'
import { userRouter } from './userRouter'

export const appRouter = router({
	menu: menuRouter,
	order: orderRouter,
	image: imageRouter,
	user: userRouter,
	settings: settingsRouter,
	banner: bannerRouter,
	promoCode: promoCodeRouter,
})

// Експортуємо типи для автозаповнення та перевірки типів
export type AppRouter = typeof appRouter
