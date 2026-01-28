import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const menuRouter = router({
	getMenuItems: publicProcedure.query(async () => {
		const items = await prisma.menuItem.findMany({
			where: {
				isOrderable: true,
				isActive: true,
			},
		})
		return items
	}),

	getAllMenuItems: publicProcedure.query(async () => {
		const items = await prisma.menuItem.findMany()
		return items
	}),

	getMenuItemById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const { id } = input

			if (!ObjectId.isValid(id)) {
				throw new Error('Invalid ID format')
			}

			const item = await prisma.menuItem.findUnique({
				where: { id },
			})

			if (!item) {
				throw new Error(`Item with ID ${id} not found`)
			}

			return item
		}),

	createMenuItem: publicProcedure
		.input(z.object({
			name: z.string(),
			price: z.number(),
			description: z.string().optional(),
			category: z.string(),
			image: z.string().optional(),
			isActive: z.boolean().default(true),
			isOrderable: z.boolean().default(false),
			isRecommended: z.boolean().default(false),
			isOnMainPage: z.boolean().default(false),

		}))
		.mutation(async ({ input }) => {
			const newItem = await prisma.menuItem.create({
				data: {
					name: input.name,
					price: input.price,
					description: input.description,
					category: input.category,
					image: input.image,
					isActive: input.isActive,
					isRecommended: input.isRecommended,
					isOnMainPage: input.isOnMainPage,
				},
			})
			return newItem
		}),

	updateMenuItem: publicProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			price: z.number().optional(),
			description: z.string().optional(),
			image: z.string().optional(),
			category: z.string().optional(),
			isRecommended: z.boolean().optional(),
			isActive: z.boolean().optional(),
			isOrderable: z.boolean().optional(),
			isOnMainPage: z.boolean().optional(),
		}))
		.mutation(async ({ input }) => {
			const { id, ...data } = input

			const item = await prisma.menuItem.findUnique({
				where: { id },
			})

			if (!ObjectId.isValid(id)) {
				throw new Error('Invalid ID format')
			}

			if (!item) {
				throw new Error('Item not found')
			}

			const updatedItem = await prisma.menuItem.update({
				where: { id },
				data,
			})
			return updatedItem
		}),

	deleteMenuItem: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const { id } = input

			if (!ObjectId.isValid(id)) {
				throw new Error('Invalid ID format')
			}

			const deletedItem = await prisma.menuItem.delete({
				where: { id },
			})

			return deletedItem
		}),
})
