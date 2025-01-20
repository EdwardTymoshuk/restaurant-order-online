import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const settingsRouter = router({
	// Get all settings
	getSettings: publicProcedure.query(async () => {
		const settings = await prisma.settings.findFirst()

		if (!settings) {
			throw new Error("Settings not found")
		}

		return settings
	}),

	// Update ordering state
	updateOrderingState: publicProcedure
		.input(
			z.object({
				isOrderingOpen: z.boolean(),
			})
		)
		.mutation(async ({ input }) => {
			const settings = await prisma.settings.findFirst()

			if (!settings) {
				throw new Error("Settings not found")
			}

			return await prisma.settings.update({
				where: { id: settings.id },
				data: { isOrderingOpen: input.isOrderingOpen },
			})
		}),

	// Update order wait time
	updateOrderWaitTime: publicProcedure
		.input(
			z.object({
				orderWaitTime: z.number(),
			})
		)
		.mutation(async ({ input }) => {
			const settings = await prisma.settings.findFirst()

			if (!settings) {
				throw new Error("Settings not found")
			}

			return await prisma.settings.update({
				where: { id: settings.id },
				data: { orderWaitTime: input.orderWaitTime },
			})
		}),

	// Update delivery cost
	updateDeliveryCost: publicProcedure
		.input(
			z.object({
				deliveryCost: z.number(),
			})
		)
		.mutation(async ({ input }) => {
			const settings = await prisma.settings.findFirst()

			if (!settings) {
				throw new Error("Settings not found")
			}

			return await prisma.settings.update({
				where: { id: settings.id },
				data: { deliveryCost: input.deliveryCost },
			})
		}),

	// Update delivery zone prices
	updateDeliveryZonePrices: publicProcedure
		.input(
			z.array(
				z.object({
					minRadius: z.number(), // Мінімальна відстань
					maxRadius: z.number(), // Максимальна відстань
					price: z.number(),     // Ціна доставки
				})
			)
		)
		.mutation(async ({ input }) => {
			const settings = await prisma.settings.findFirst()

			if (!settings) {
				throw new Error("Settings not found")
			}

			// Validate the input to ensure ranges don't overlap
			for (let i = 0; i < input.length; i++) {
				for (let j = i + 1; j < input.length; j++) {
					const a = input[i]
					const b = input[j]
					if (
						(a.minRadius < b.maxRadius && a.maxRadius > b.minRadius) || // Перекриття
						(b.minRadius < a.maxRadius && b.maxRadius > a.minRadius)    // Перекриття
					) {
						throw new Error(`Overlapping delivery zones detected between zones ${i + 1} and ${j + 1}`)
					}
				}
			}


			// Save the delivery zones in settings
			return await prisma.settings.update({
				where: { id: settings.id },
				data: { deliveryZones: input }, // Зберігаємо як масив зон
			})
		}),
	updatePizzaAvailability: publicProcedure
		.input(
			z.object({
				enabled: z.boolean(), // Увімкнення/вимкнення категорії
				availability: z.array(
					z.object({
						day: z.number().min(0).max(6), // Дні (0 - неділя, 6 - субота)
						startHour: z.number().min(0).max(23), // Початкова година
						endHour: z.number().min(0).max(23),   // Кінцева година
					})
				),
			})
		)
		.mutation(async ({ input }) => {
			const settings = await prisma.settings.findFirst()
			if (!settings) throw new Error("Settings not found")

			return await prisma.settings.update({
				where: { id: settings.id },
				data: {
					pizzaCategoryEnabled: input.enabled,
					pizzaAvailability: input.availability,
				},
			})
		}),

})
