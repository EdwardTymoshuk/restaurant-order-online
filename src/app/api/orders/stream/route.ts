import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
	const lastUpdatedAtParam = req.nextUrl.searchParams.get('lastUpdatedAt')

	const whereCondition = lastUpdatedAtParam
		? { updatedAt: { gt: new Date(lastUpdatedAtParam) } }
		: {}

	try {
		const newOrders = await prisma.order.findMany({
			where: whereCondition,
			orderBy: { updatedAt: 'asc' },
			include: {
				items: { include: { menuItem: true } },
				promoCode: true,
			},
		})
		return NextResponse.json(newOrders)
	} catch {
		return NextResponse.json([], { status: 200 })
	}
}
