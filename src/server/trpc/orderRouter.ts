import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const orderRouter = router({
	create: publicProcedure
		.input(z.object({
			name: z.string(),
			phone: z.string(),
			paymentMethod: z.string(),
			deliveryTime: z.union([z.string(), z.date()]),
			deliveryMethod: z.enum(['DELIVERY', 'TAKE_OUT']),
			items: z.array(z.object({
				menuItemId: z.string(),
				quantity: z.number(),
			})),
			totalAmount: z.number(),
			method: z.enum(['DELIVERY', 'TAKE_OUT']),
			city: z.string().optional(),
			postalCode: z.string().optional(),
			street: z.string().optional(),
			buildingNumber: z.number().optional(),
			apartment: z.number().optional(),
		}))
		.mutation(async ({ input }) => {
			const { name, phone, paymentMethod, deliveryTime, items, totalAmount, method, deliveryMethod } = input

			const orderData: Prisma.OrderUncheckedCreateInput = {
				name,
				phone,
				paymentMethod,
				deliveryTime: new Date(deliveryTime),
				deliveryMethod,
				totalAmount,
				status: 'PENDING',
				items: {
					create: items.map((item) => ({
						menuItemId: item.menuItemId,
						quantity: item.quantity,
					})),
				},
			}

			// Якщо це доставка, додаємо поля адреси
			if (method === 'DELIVERY') {
				orderData.city = input.city
				orderData.postalCode = input.postalCode
				orderData.street = input.street
				orderData.buildingNumber = input.buildingNumber
				orderData.apartment = input.apartment ?? undefined
			}

			const order = await prisma.order.create({
				data: orderData,
			})

			return order
		}),
})
