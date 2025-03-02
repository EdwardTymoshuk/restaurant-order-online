// src/server/trpc/appRouter.ts
import { bannerRouter } from './bannerRouter'
import { imageRouter } from './imageRouter'
import { mainPageBannerRouter } from './mainPageBannerRouter'
import { menuRouter } from './menuRouter'
import { newsRouter } from './newsRouter'
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
  news: newsRouter,
  mainPageBanner: mainPageBannerRouter,
})

// Експортуємо типи для автозаповнення та перевірки типів
export type AppRouter = typeof appRouter
