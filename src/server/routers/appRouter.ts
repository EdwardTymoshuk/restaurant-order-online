// src/server/trpc/appRouter.ts
import { router } from '../trpc'
import { bannerRouter } from './bannerRouter'
import { imageRouter } from './imageRouter'
import { mainPageBannerRouter } from './mainPageBannerRouter'
import { menuRouter } from './menuRouter'
import { newsRouter } from './newsRouter'
import { orderRouter } from './orderRouter'
import { promoCodeRouter } from './promoCodeRouter'
import { reservationsRouter } from './reservationsRouter'
import { settingsRouter } from './settingsRouter'
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
  reservations: reservationsRouter,
})

// Експортуємо типи для автозаповнення та перевірки типів
export type AppRouter = typeof appRouter
