import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const bannerRouter = router({
	createBanner: publicProcedure
		.input(
			z.object({
				imageUrl: z.string(),
				linkUrl: z.string().optional(),
				position: z.number().optional(),
			})
		)
		.mutation(async ({ input }) => {
			const banner = await prisma.banner.create({
				data: input,
			})
			return banner
		}),

	getAllBanners: publicProcedure.query(async () => {
		return await prisma.banner.findMany()
	}),

	updateBanner: publicProcedure
		.input(
			z.object({
				id: z.string(),
				imageUrl: z.string().optional(),
				linkUrl: z.string().optional(),
				position: z.number().optional(),
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			const banner = await prisma.banner.update({
				where: { id },
				data,
			})
			return banner
		}),

	deleteBanner: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			await prisma.banner.delete({
				where: { id: input.id },
			})
			return { success: true }
		}),
})
