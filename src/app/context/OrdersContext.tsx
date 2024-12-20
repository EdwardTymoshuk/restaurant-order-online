// OrdersContext.tsx

import { Prisma } from '@prisma/client'
import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useRef, useState } from 'react'

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        menuItem: true
      }
    }
    promoCode: true
  }
}>

type OrdersContextType = {
  allOrders: OrderWithItems[]
  highlightedOrderIds: Set<string>
  isDialogOpen: boolean
  handleCloseDialog: () => void
  newOrderCount: number
  setAllOrders: Dispatch<SetStateAction<OrderWithItems[]>>
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export const useOrders = () => {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([])
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<Set<string>>(new Set())
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const lastUpdatedAtRef = useRef<string | null>(null)
  const loginTimeRef = useRef<Date>(new Date()) // Store the login time
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null) // Reference to the audio interval timer

  // Function to play the notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/audio/notification.wav')
    audio.play().catch((err) => console.error('Audio play failed:', err))
  }

  const fetchOrders = async () => {
    try {
      const query = lastUpdatedAtRef.current
        ? `?lastUpdatedAt=${encodeURIComponent(lastUpdatedAtRef.current)}`
        : ''
      const response = await fetch(`/api/orders/stream${query}`)
      const orders: OrderWithItems[] = await response.json()

      if (orders.length > 0) {
        // Оновлення lastUpdatedAt
        const latestOrderCreatedAt = orders[orders.length - 1].createdAt
        lastUpdatedAtRef.current = new Date(latestOrderCreatedAt).toISOString()

        // Запобігання дублюванню
        setAllOrders((prevOrders) => {
          const existingOrderIds = new Set(prevOrders.map((order) => order.id))
          const newUniqueOrders = orders.filter((order) => !existingOrderIds.has(order.id))
          return [...prevOrders, ...newUniqueOrders]
        })

        // Перевірка PENDING-замовлень
        const now = new Date()
        const delayedPendingOrders = orders.filter(
          (order) =>
            order.status === 'PENDING' &&
            // new Date(order.statusUpdatedAt) <= new Date(now.getTime() - 10 * 60 * 1000)
            new Date(order.statusUpdatedAt) <= new Date(now.getTime() - 10 * 1000)

        )

        if (delayedPendingOrders.length > 0) {
          // Відправлення повідомлення для кожного замовлення
          await Promise.all(
            delayedPendingOrders.map((order) =>
              fetch('/api/orders/notify-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, phone: order.phone, name: order.name, finalAmount: order.finalAmount }),
              })
            )
          )
          console.log(`Sent notifications for delayed orders: ${delayedPendingOrders.map(o => o.id).join(', ')}`)
        }

        // Логіка для нових замовлень
        const newOrders = orders.filter(
          (order) => new Date(order.createdAt) > loginTimeRef.current
        )

        if (newOrders.length > 0) {
          setNewOrderCount((prevCount) => prevCount + newOrders.length)
          setHighlightedOrderIds((prev) => {
            const updatedIds = new Set(prev)
            newOrders.forEach((order) => updatedIds.add(order.id))
            return updatedIds
          })
          setIsDialogOpen(true)

          if (!audioIntervalRef.current) {
            playNotificationSound()
            audioIntervalRef.current = setInterval(playNotificationSound, 15000) // 15 секунд
          }
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }


  useEffect(() => {
    fetchOrders() // Initial fetch
    const interval = setInterval(fetchOrders, 5000) // Fetch every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Use useEffect to manage the audio playback based on isDialogOpen
  useEffect(() => {
    if (!isDialogOpen && audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current)
      audioIntervalRef.current = null
    }
  }, [isDialogOpen])

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setNewOrderCount(0)
    setTimeout(() => {
      setHighlightedOrderIds(new Set())
    }, 5000)
  }

  return (
    <OrdersContext.Provider
      value={{
        allOrders,
        highlightedOrderIds,
        isDialogOpen,
        handleCloseDialog,
        newOrderCount,
        setAllOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}
