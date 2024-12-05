// import { Prisma } from '@prisma/client'
// import { useEffect, useRef, useState } from 'react'

// type OrderWithItems = Prisma.OrderGetPayload<{
// 	include: {
// 		items: {
// 			include: {
// 				menuItem: true
// 			}
// 		}
// 		promoCode: true
// 	}
// }>

// export const useOrderSubscription = () => {
// 	const [allOrders, setAllOrders] = useState<OrderWithItems[]>([])
// 	const [newOrders, setNewOrders] = useState<OrderWithItems[]>([])
// 	const [highlightedOrderIds, setHighlightedOrderIds] = useState<Set<string>>(new Set())
// 	const [newOrderCount, setNewOrderCount] = useState(0)
// 	const [isDialogOpen, setIsDialogOpen] = useState(false)

// 	const lastUpdatedAtRef = useRef<string | null>(null)
// 	const isInitialLoadRef = useRef(true)

// 	const fetchOrders = async () => {
// 		try {
// 			const query = lastUpdatedAtRef.current
// 				? `?lastUpdatedAt=${encodeURIComponent(lastUpdatedAtRef.current)}`
// 				: ''
// 			const response = await fetch(`/api/orders/stream${query}`)
// 			const orders: OrderWithItems[] = await response.json()

// 			console.log('Fetched orders:', orders)

// 			if (orders.length > 0) {
// 				// Оновлюємо lastUpdatedAt
// 				const latestOrderCreatedAt = orders[orders.length - 1].createdAt
// 				lastUpdatedAtRef.current = new Date(latestOrderCreatedAt).toISOString()

// 				if (isInitialLoadRef.current) {
// 					// Початкове завантаження, встановлюємо всі замовлення
// 					setAllOrders(orders)
// 					isInitialLoadRef.current = false
// 					console.log('Set isInitialLoad to false')
// 				} else {
// 					// Наступні завантаження, обробляємо нові замовлення
// 					setAllOrders((prevOrders) => [...prevOrders, ...orders])
// 					setNewOrders(orders) // Встановлюємо newOrders як останні отримані замовлення
// 					setNewOrderCount(orders.length)
// 					setHighlightedOrderIds((prev) => {
// 						const updatedIds = new Set(prev)
// 						orders.forEach((order) => updatedIds.add(order.id))
// 						return updatedIds
// 					})
// 					setIsDialogOpen(true)

// 					// Відтворення звуку
// 					const audio = new Audio('/audio/notification.wav')
// 					audio.play().catch((err) => console.error('Audio play failed:', err))
// 				}

// 				console.log('Updated lastUpdatedAt:', lastUpdatedAtRef.current)
// 			}
// 		} catch (error) {
// 			console.error('Error fetching orders:', error)
// 		}
// 	}

// 	useEffect(() => {
// 		fetchOrders() // Початкове завантаження
// 		const interval = setInterval(fetchOrders, 5000) // Запити кожні 5 секунд
// 		return () => clearInterval(interval)
// 	}, [])

// 	const handleCloseDialog = () => {
// 		setIsDialogOpen(false)
// 		setNewOrderCount(0)
// 		setNewOrders([]) // Скидаємо newOrders після обробки
// 		setTimeout(() => {
// 			setHighlightedOrderIds(new Set())
// 		}, 5000)
// 	}

// 	return {
// 		allOrders,
// 		newOrders,
// 		highlightedOrderIds,
// 		isDialogOpen,
// 		handleCloseDialog,
// 		newOrderCount,
// 		fetchOrders,
// 		setAllOrders, // Додаємо методи для оновлення замовлень
// 	}
// }
