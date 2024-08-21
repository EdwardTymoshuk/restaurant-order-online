// src/server/trpc/menuRouter.ts
import prisma from '@/lib/prisma'
import { publicProcedure, router } from './trpc'

export const menuRouter = router({
	getMenuItems: publicProcedure.query(async () => {
		const items = await prisma.menuItem.findMany({
			where: {
				isOrderable: true,
			},
		})
		return items
	}),
})
