import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
	const lastUpdatedAtParam = req.nextUrl.searchParams.get('lastUpdatedAt')

	const whereCondition = lastUpdatedAtParam
		? { createdAt: { gt: new Date(lastUpdatedAtParam) } }
		: {}

	const newOrders = await prisma.order.findMany({
		where: whereCondition,
		orderBy: { createdAt: 'asc' },
		include: {
			items: {
				include: {
					menuItem: true, // Включаємо пов’язані дані про меню
				},
			},
			promoCode: true, // Включаємо пов’язані дані про промокод
		},
	})

	return NextResponse.json(newOrders)
}
