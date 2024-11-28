import { Prisma } from '@prisma/client'
import { useEffect, useState } from 'react'

type OrderWithItems = Prisma.OrderGetPayload<{
	include: {
		items: {
			include: {
				menuItem: true
			}
		},
		promoCode: true,
	}
}>

export const useOrderSubscription = () => {
	const [newOrders, setNewOrders] = useState<OrderWithItems[]>([])
	const [highlightedOrderIds, setHighlightedOrderIds] = useState<Set<string>>(new Set())
	const [newOrderCount, setNewOrderCount] = useState(0)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [initialTitle] = useState(document?.title)

	useEffect(() => {
		const eventSource = new EventSource('/api/orders/stream')

		eventSource.onmessage = (event) => {
			const orders: OrderWithItems[] = JSON.parse(event.data)

			if (orders.length > 0) {
				setNewOrders((prevOrders) => [...prevOrders, ...orders])
				setNewOrderCount((prevCount) => prevCount + orders.length) // Збільшуємо лічильник нових замовлень
				setHighlightedOrderIds((prev) => {
					const updatedIds = new Set(prev)
					orders.forEach((order) => updatedIds.add(order.id))
					return updatedIds
				})
				setIsDialogOpen(true) // Відкриваємо діалогове вікно для нових замовлень

				// Відтворення звуку
				const audio = new Audio('/audio/notification.wav')
				audio.play()
			}
		}

		return () => {
			eventSource.close()
		}
	}, [initialTitle])

	// Повернення заголовка при фокусі
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document && document.visibilityState === 'visible') {
				document.title = initialTitle
			}
		}
		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [initialTitle])

	// Закриття діалогу і зняття виділення через 5 секунд
	const handleCloseDialog = () => {
		setIsDialogOpen(false)
		setNewOrderCount(0) // Скидаємо лічильник
		setTimeout(() => {
			setHighlightedOrderIds(new Set())
		}, 5000)
	}

	return { newOrders, highlightedOrderIds, isDialogOpen, handleCloseDialog, newOrderCount }
}
