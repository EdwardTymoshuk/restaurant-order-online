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

      console.log('Fetched orders:', orders)

      if (orders.length > 0) {
        // Update lastUpdatedAt
        const latestOrderCreatedAt = orders[orders.length - 1].createdAt
        lastUpdatedAtRef.current = new Date(latestOrderCreatedAt).toISOString()

        // Prevent duplicates
        setAllOrders((prevOrders) => {
          const existingOrderIds = new Set(prevOrders.map((order) => order.id))
          const newUniqueOrders = orders.filter((order) => !existingOrderIds.has(order.id))
          return [...prevOrders, ...newUniqueOrders]
        })

        // Filter orders to find new ones based on login time
        const newOrders = orders.filter(
          (order) => new Date(order.createdAt) > loginTimeRef.current
        )

        if (newOrders.length > 0) {
          // Handle new orders
          setNewOrderCount((prevCount) => prevCount + newOrders.length)
          setHighlightedOrderIds((prev) => {
            const updatedIds = new Set(prev)
            newOrders.forEach((order) => updatedIds.add(order.id))
            return updatedIds
          })
          setIsDialogOpen(true)

          // Start playing audio if not already started
          if (!audioIntervalRef.current) {
            playNotificationSound() // Play immediately
            audioIntervalRef.current = setInterval(() => {
              playNotificationSound()
            }, 15000) // 15 seconds
          }
        }

        console.log('Updated lastUpdatedAt:', lastUpdatedAtRef.current)
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
