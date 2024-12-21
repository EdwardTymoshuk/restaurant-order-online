'use client'

import { trpc } from '@/utils/trpc'
import { Prisma } from '@prisma/client'
import { Dispatch, ReactNode, SetStateAction, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

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
  const loginTimeRef = useRef<Date>(new Date())
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const markNotified = trpc.order.markNotified.useMutation()

  // Статична функція без зовнішніх залежностей.
  const playNotificationSoundRef = useRef(() => {
    const audio = new Audio('/audio/notification.wav')
    audio.play().catch((err) => console.error('Audio play failed:', err))
  })

  const fetchOrders = useCallback(async () => {
    try {
      const query = lastUpdatedAtRef.current
        ? `?lastUpdatedAt=${encodeURIComponent(lastUpdatedAtRef.current)}`
        : ''
      const response = await fetch(`/api/orders/stream${query}`)
      const orders: OrderWithItems[] = await response.json()

      setAllOrders((prevOrders) => {
        let updatedOrders = [...prevOrders]

        if (orders.length > 0) {
          const latestOrderCreatedAt = orders[orders.length - 1].createdAt
          lastUpdatedAtRef.current = new Date(latestOrderCreatedAt).toISOString()

          const existingOrderIds = new Set(updatedOrders.map((order) => order.id))
          const newUniqueOrders = orders.filter((order) => !existingOrderIds.has(order.id))
          updatedOrders = [...updatedOrders, ...newUniqueOrders]

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
              playNotificationSoundRef.current()
              audioIntervalRef.current = setInterval(playNotificationSoundRef.current, 15000)
            }
          }
        }

        const now = new Date()
        const delayedPendingOrders = updatedOrders.filter(
          (order) =>
            order.status === 'PENDING' &&
            order.notifiedAt == null &&
            new Date(order.statusUpdatedAt) <= new Date(now.getTime() - 10 * 60 * 1000)
        )

        if (delayedPendingOrders.length > 0) {
          Promise.all(
            delayedPendingOrders.map((order) =>
              fetch('/api/orders/notify-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: order.id,
                  phone: order.phone,
                  name: order.name,
                  finalAmount: order.finalAmount
                }),
              })
            )
          )
            .then(async () => {
              await markNotified.mutateAsync({ orderIds: delayedPendingOrders.map(o => o.id) })

              const updatedAfterNotified = updatedOrders.map(order => {
                if (delayedPendingOrders.some(dpo => dpo.id === order.id)) {
                  return { ...order, notifiedAt: new Date() }
                }
                return order
              })
              setAllOrders(updatedAfterNotified)
            })
            .catch(err => {
              console.error('Error sending or marking notifications:', err)
            })

          return updatedOrders
        }

        return updatedOrders
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Без залежностей

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Запускаємо тільки один раз

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
