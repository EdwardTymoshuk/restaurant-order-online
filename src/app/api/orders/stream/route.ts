import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
	const headers = new Headers({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	})

	let lastUpdatedAt = new Date() // Змінна для відстеження останнього оновлення

	const stream = new ReadableStream({
		start(controller) {
			const send = async () => {
				try {
					// Отримуємо замовлення, створені після останнього оновлення
					const newOrders = await prisma.order.findMany({
						where: {
							createdAt: { gt: lastUpdatedAt },
						},
						orderBy: { createdAt: 'asc' },
					})

					// Якщо є нові замовлення, відправляємо їх і оновлюємо час останнього оновлення
					if (newOrders.length > 0) {
						controller.enqueue(`data: ${JSON.stringify(newOrders)}\n\n`)
						lastUpdatedAt = new Date() // Оновлюємо час останнього отриманого замовлення
					}
				} catch (error) {
					controller.error(error)
				}
			}

			// Відправляємо оновлення кожні 5 секунд
			const intervalId = setInterval(send, 5000)

			req.signal.onabort = () => {
				clearInterval(intervalId)
				controller.close()
			}
		},
	})

	return new NextResponse(stream, { headers })
}
