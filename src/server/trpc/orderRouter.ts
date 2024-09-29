import { prisma } from '@/lib/prisma'
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
			comment: z.string().max(200, 'Komentarz jest zbyt długi').optional(),
			promoCode: z.string().max(20, 'Kod promocyjny jest zbyt długi').optional(),
		}))
		.mutation(async ({ input }) => {
			const { name, phone, paymentMethod, deliveryTime, items, totalAmount, method, deliveryMethod, comment, promoCode } = input

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
				comment,
				promoCode,
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
	getOrderStatus: publicProcedure
		.input(z.object({
			phone: z.string(),
		}))
		.query(async ({ input }) => {
			const { phone } = input

			const order = await prisma.order.findFirst({
				where: {
					phone: phone,
				},
				orderBy: {
					createdAt: 'desc',
				},
			})

			if (!order) {
				throw new Error('Order not found')
			}

			return {
				status: order.status,
				orderId: order.id,
				deliveryMethod: order.deliveryMethod,
				deliveryTime: order.deliveryTime,
			}
		}),
})
