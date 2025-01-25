import { prisma } from '@/lib/prisma'
import { OrderStatus, Prisma } from '@prisma/client' // Додаємо Prisma для типів
import { TRPCError } from '@trpc/server'
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
			finalAmount: z.number(),
			method: z.enum(['DELIVERY', 'TAKE_OUT']),
			city: z.string().optional(),
			postalCode: z.string().optional(),
			street: z.string().optional(),
			buildingNumber: z.string().optional(),
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
				finalAmount: input.finalAmount,
				status: OrderStatus.PENDING,
				items: {
					create: input.items.map(item => ({
						menuItemId: item.menuItemId,
						quantity: item.quantity,
					})),
				},
				comment: input.comment,
				...(input.promoCode && {
					promoCode: {
						connect: { code: input.promoCode },
					},
				}),
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
				promoCode: true,
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
				},
				promoCode: true,
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

			// Отримання замовлень за номером телефону
			const orders = await prisma.order.findMany({
				where: { phone },
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					status: true,
					deliveryMethod: true,
					deliveryTime: true,
				},
			})

			if (!orders || orders.length === 0) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
			}

			const activeOrder = orders.find(order => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status))
			const completedOrder = !activeOrder ? orders[0] : null

			return {
				activeOrder,
				completedOrder,
			}
		}),

	updateStatus: publicProcedure
		.input(z.object({
			orderId: z.string(),
			status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELLED']),
		}))
		.mutation(async ({ input }) => {
			return await prisma.order.update({
				where: { id: input.orderId },
				data: {
					status: OrderStatus[input.status],
					statusUpdatedAt: new Date(),
				},
			})
		}),

	deleteOrder: publicProcedure
		.input(z.object({
			orderId: z.string(),
		}))
		.mutation(async ({ input }) => {
			await prisma.orderItem.deleteMany({
				where: {
					orderId: input.orderId,
				},
			})

			const order = await prisma.order.delete({
				where: { id: input.orderId },
			})

			return order
		}),

	markNotified: publicProcedure
		.input(z.object({
			orderIds: z.array(z.string()),
		}))
		.mutation(async ({ input }) => {
			await prisma.order.updateMany({
				where: { id: { in: input.orderIds } },
				data: {
					notifiedAt: new Date(),
				},
			})

			return { success: true }
		}),

	updateDeliveryTime: publicProcedure
		.input(
			z.object({
				orderId: z.string(),
				additionalTime: z.number(), // Час у хвилинах
			})
		)
		.mutation(async ({ input }) => {
			const { orderId, additionalTime } = input

			// Отримати поточний час доставки
			const order = await prisma.order.findUnique({
				where: { id: orderId },
				select: { deliveryTime: true },
			})

			if (!order || !order.deliveryTime) {
				throw new Error('Nie znaleziono zamówienia lub brakuje czasu dostawy.')
			}

			// Обчислити новий час доставки
			const newDeliveryTime = new Date(order.deliveryTime.getTime() + additionalTime * 60 * 1000)

			// Оновити час доставки
			const updatedOrder = await prisma.order.update({
				where: { id: orderId },
				data: { deliveryTime: newDeliveryTime },
			})

			return updatedOrder
		}),

})
