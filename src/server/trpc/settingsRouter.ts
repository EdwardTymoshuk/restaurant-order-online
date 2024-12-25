import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const settingsRouter = router({
	getSettings: publicProcedure.query(async () => {
		const settings = await prisma.settings.findFirst()

		if (!settings) {
			throw new Error("Settings not found")
		}

		return settings
	}),
	updateSettings: publicProcedure
		.input(
			z.object({
				isOrderingOpen: z.boolean().optional(),
				orderWaitTime: z.number().optional(),
				deliveryCost: z.number().optional(),
			})
		)
		.mutation(async ({ input }) => {
			const settings = await prisma.settings.findFirst()

			if (!settings) {
				throw new Error("Settings not found")
			}

			return await prisma.settings.update({
				where: { id: settings.id },
				data: {
					...input,
				},
			})
		}),
})
