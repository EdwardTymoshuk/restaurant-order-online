'use client'

import { useEffect, useRef } from 'react'

type AdminRealtimeHandlers = {
  onOrdersChanged?: () => void
  onReservationsChanged?: () => void
  onBadgesChanged?: () => void
}

export const useAdminRealtime = (handlers: AdminRealtimeHandlers, enabled = true) => {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return

    const source = new EventSource('/api/admin-realtime')

    const handleOrdersChanged = () => handlersRef.current.onOrdersChanged?.()
    const handleReservationsChanged = () => handlersRef.current.onReservationsChanged?.()
    const handleBadgesChanged = () => handlersRef.current.onBadgesChanged?.()

    source.addEventListener('orders_changed', handleOrdersChanged)
    source.addEventListener('reservations_changed', handleReservationsChanged)
    source.addEventListener('badges_changed', handleBadgesChanged)

    return () => {
      source.removeEventListener('orders_changed', handleOrdersChanged)
      source.removeEventListener('reservations_changed', handleReservationsChanged)
      source.removeEventListener('badges_changed', handleBadgesChanged)
      source.close()
    }
  }, [enabled])
}
