import { prisma } from '@/lib/prisma'
import { OrderStatus, Prisma } from '@prisma/client' // Додаємо Prisma для типів
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const orderRouter = router({
	// Створення замовлення
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
			comment: z.string().max(200).optional(),
			promoCode: z.string().max(20).optional(),
			nip: z.string().optional(),
		}))
		.mutation(async ({ input }) => {
			const orderData = {
				name: input.name,
				phone: input.phone,
				paymentMethod: input.paymentMethod,
				deliveryTime: new Date(input.deliveryTime),
				deliveryMethod: input.deliveryMethod,
				totalAmount: input.totalAmount,
				status: OrderStatus.PENDING,
				items: {
					create: input.items.map(item => ({
						menuItemId: item.menuItemId,
						quantity: item.quantity,
					})),
				},
				comment: input.comment,
				promoCode: input.promoCode,
				nip: input.nip
			}

			if (input.method === 'DELIVERY') {
				Object.assign(orderData, {
					city: input.city,
					postalCode: input.postalCode,
					street: input.street,
					buildingNumber: input.buildingNumber,
					apartment: input.apartment ?? undefined,
					nip: input.nip
				})
			}

			return prisma.order.create({
				data: orderData,
			})
		}),

	// Отримання всіх замовлень
	getAllOrders: publicProcedure.query(async () => {
		const orders = await prisma.order.findMany({
			include: {
				items: {
					include: {
						menuItem: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		return orders as Prisma.OrderGetPayload<{
			include: {
				items: {
					include: {
						menuItem: true
					}
				}
			}
		}>[]
	}),

	// Отримання статусу замовлення
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

	// Оновлення статусу замовлення
	updateStatus: publicProcedure
		.input(z.object({
			orderId: z.string(),
			status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELLED']),
		}))
		.mutation(async ({ input }) => {
			return await prisma.order.update({
				where: { id: input.orderId },
				data: { status: OrderStatus[input.status] }, // Використовуємо enum OrderStatus
			})
		}),

	// Видалення замовлення
	deleteOrder: publicProcedure
		.input(z.object({
			orderId: z.string(),
		}))
		.mutation(async ({ input }) => {
			// Спочатку видаляємо всі записи в OrderItem, що пов'язані з цим замовленням
			await prisma.orderItem.deleteMany({
				where: {
					orderId: input.orderId,
				},
			})

			// Після цього видаляємо саме замовлення
			const order = await prisma.order.delete({
				where: { id: input.orderId },
			})

			return order
		}),

})
