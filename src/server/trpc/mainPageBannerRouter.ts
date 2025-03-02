import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const mainPageBannerRouter = router({
  // ✅ Create a new main banner
  createMainBanner: publicProcedure
    .input(
      z.object({
        desktopImageUrl: z.string(),
        mobileImageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.mainBanner.create({
        data: {
          ...input,
          position: input.position ?? 0, // Default position to 0 (new banners go to the top)
        },
      })
    }),

  // ✅ Fetch all banners (ordered by position)
  getAllMainBanners: publicProcedure.query(async () => {
    return await prisma.mainBanner.findMany({
      orderBy: { position: 'asc' },
    })
  }),

  // ✅ Update an existing banner
  updateMainBanner: publicProcedure
    .input(
      z.object({
        id: z.string(),
        desktopImageUrl: z.string().optional(),
        mobileImageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return await prisma.mainBanner.update({
        where: { id },
        data,
      })
    }),

  // ✅ Delete a banner
  deleteMainBanner: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.mainBanner.delete({
        where: { id: input.id },
      })
      return { success: true }
    }),
})
