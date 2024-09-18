// src/server/trpc/menuRouter.ts
import { MenuItemCategory } from '@/app/types'
import { MenuCategories } from '@/config'
import prisma from '@/lib/prisma'
import { publicProcedure, router } from './trpc'

// Функція для перевірки категорії
const isValidCategory = (category: string): category is MenuItemCategory => {
	return MenuCategories.includes(category)
}

export const menuRouter = router({
	getMenuItems: publicProcedure.query(async () => {
		const items = await prisma.menuItem.findMany({
			where: {
				isOrderable: true,
			},
		})
		const validItems = items.map(item => ({
			...item,
			category: isValidCategory(item.category) ? item.category : 'Inne',
		}))

		return validItems
	}),
})
