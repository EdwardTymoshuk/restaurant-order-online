import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, ReservationStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Range = 'day' | 'week' | 'month' | 'year' | 'all'

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const getRangeWindow = (range: Range, monthParam: string | null, yearParam: string | null) => {
  const today = startOfDay(new Date())
  if (range === 'day') return { start: today, end: undefined }
  if (range === 'week') return { start: addDays(today, -6), end: undefined }
  if (range === 'all') return { start: undefined, end: undefined }

  if (range === 'year') {
    const year = Number(yearParam) || today.getFullYear()
    return {
      start: new Date(year, 0, 1),
      end: new Date(year + 1, 0, 1),
    }
  }

  const monthMatch = /^(\d{4})-(\d{2})$/.exec(monthParam ?? '')
  if (monthMatch) {
    const year = Number(monthMatch[1])
    const month = Number(monthMatch[2]) - 1
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 1),
    }
  }

  return { start: addDays(today, -29), end: undefined }
}

const money = (value: number | null | undefined) => Math.round(value ?? 0)

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rangeParam = searchParams.get('range')
  const range: Range =
    rangeParam === 'day' ||
    rangeParam === 'week' ||
    rangeParam === 'month' ||
    rangeParam === 'year' ||
    rangeParam === 'all'
      ? rangeParam
      : 'week'

  const rangeWindow = getRangeWindow(range, searchParams.get('month'), searchParams.get('year'))
  const now = new Date()
  const upcomingTo = addDays(startOfDay(now), 14)
  const dateWhere =
    rangeWindow.start || rangeWindow.end
      ? {
          ...(rangeWindow.start ? { gte: rangeWindow.start } : {}),
          ...(rangeWindow.end ? { lt: rangeWindow.end } : {}),
        }
      : undefined

  const completedOrderStatuses: OrderStatus[] = [
    'ACCEPTED',
    'IN_PROGRESS',
    'READY',
    'DELIVERING',
    'DELIVERED',
    'COMPLETED',
  ]
  const activeOrderStatuses: OrderStatus[] = [
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'READY',
    'DELIVERING',
  ]

  const [
    orders,
    activeOrders,
    reservations,
    upcomingReservations,
    menuItems,
    latestOrders,
    latestReservations,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(dateWhere ? { createdAt: dateWhere } : {}),
        status: { not: 'CANCELLED' },
      },
      include: {
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { status: { in: activeOrderStatuses } },
      orderBy: { createdAt: 'asc' },
      take: 8,
    }),
    prisma.reservation.findMany({
      where: {
        ...(dateWhere ? { createdAt: dateWhere } : {}),
        status: { not: 'CANCELLED' },
      },
      include: {
        offerSnapshot: true,
        contact: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reservation.findMany({
      where: {
        eventDate: { gte: startOfDay(now), lte: upcomingTo },
        status: { in: ['SENT', 'CONFIRMED'] },
      },
      include: {
        offerSnapshot: true,
        contact: true,
      },
      orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
      take: 8,
    }),
    prisma.menuItem.findMany({
      where: { isActive: true },
      select: { id: true, name: true, category: true, price: true, isOrderable: true },
    }),
    prisma.order.findMany({
      where: { ...(dateWhere ? { createdAt: dateWhere } : {}), status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: { include: { menuItem: true } } },
    }),
    prisma.reservation.findMany({
      where: { ...(dateWhere ? { createdAt: dateWhere } : {}), status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { contact: true, offerSnapshot: true },
    }),
  ])

  const orderRevenue = orders.reduce((sum, order) => sum + money(order.finalAmount ?? order.totalAmount), 0)
  const avgOrderValue = orders.length > 0 ? Math.round(orderRevenue / orders.length) : 0
  const deliveryOrders = orders.filter((order) => order.deliveryMethod === 'DELIVERY').length
  const takeOutOrders = orders.length - deliveryOrders

  const reservationRevenue = reservations.reduce((sum, reservation) => sum + money(reservation.offerSnapshot?.total), 0)
  const reservationGuests = reservations.reduce(
    (sum, reservation) => sum + reservation.adultsCount + (reservation.childrenCount ?? 0),
    0
  )
  const pendingReservations = reservations.filter((reservation) => reservation.status === 'SENT').length
  const confirmedReservations = reservations.filter((reservation) => reservation.status === 'CONFIRMED').length

  const itemStats = new Map<string, {
    id: string
    name: string
    category: string
    quantity: number
    revenue: number
  }>()

  for (const item of menuItems) {
    itemStats.set(item.id, {
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: 0,
      revenue: 0,
    })
  }

  for (const order of orders) {
    for (const item of order.items) {
      const current = itemStats.get(item.menuItemId) ?? {
        id: item.menuItemId,
        name: item.menuItem?.name ?? 'Usunięta pozycja',
        category: item.menuItem?.category ?? 'Inne',
        quantity: 0,
        revenue: 0,
      }

      current.quantity += item.quantity
      current.revenue += item.quantity * (item.menuItem?.price ?? 0)
      itemStats.set(item.menuItemId, current)
    }
  }

  const itemStatsList = Array.from(itemStats.values())
  const topItems = itemStatsList
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5)

  const weakestItems = itemStatsList
    .filter((item) => menuItems.some((menuItem) => menuItem.id === item.id && menuItem.isOrderable))
    .sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue)
    .slice(0, 5)

  const customerStats = new Map<string, {
    name: string
    phone: string
    orders: number
    spent: number
  }>()

  for (const order of orders) {
    const key = order.phone || order.name
    const current = customerStats.get(key) ?? {
      name: order.name,
      phone: order.phone,
      orders: 0,
      spent: 0,
    }
    current.orders += 1
    current.spent += money(order.finalAmount ?? order.totalAmount)
    customerStats.set(key, current)
  }

  const topCustomers = Array.from(customerStats.values())
    .sort((a, b) => b.orders - a.orders || b.spent - a.spent)
    .slice(0, 5)

  return NextResponse.json({
    range,
    generatedAt: now.toISOString(),
    orders: {
      count: orders.length,
      revenue: orderRevenue,
      averageValue: avgOrderValue,
      activeCount: activeOrders.length,
      deliveryCount: deliveryOrders,
      takeOutCount: takeOutOrders,
      statusCounts: completedOrderStatuses.reduce<Record<string, number>>((acc, status) => {
        acc[status] = orders.filter((order) => order.status === status).length
        return acc
      }, {}),
    },
    reservations: {
      count: reservations.length,
      revenue: reservationRevenue,
      guests: reservationGuests,
      pendingCount: pendingReservations,
      confirmedCount: confirmedReservations,
      upcomingCount: upcomingReservations.length,
    },
    menu: {
      activeItems: menuItems.length,
      orderableItems: menuItems.filter((item) => item.isOrderable).length,
      topItems,
      weakestItems,
    },
    customers: {
      uniqueCount: customerStats.size,
      topCustomers,
    },
    operations: {
      activeOrders: activeOrders.map((order) => ({
        id: order.id,
        name: order.name,
        phone: order.phone,
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        deliveryTime: order.deliveryTime?.toISOString(),
        amount: money(order.finalAmount ?? order.totalAmount),
        createdAt: order.createdAt.toISOString(),
      })),
      upcomingReservations: upcomingReservations.map((reservation) => ({
        id: reservation.id,
        name: reservation.contact?.name ?? 'Bez nazwy',
        status: reservation.status as ReservationStatus,
        eventDate: reservation.eventDate.toISOString(),
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        guests: reservation.adultsCount + (reservation.childrenCount ?? 0),
        total: money(reservation.offerSnapshot?.total),
      })),
      latestOrders: latestOrders.map((order) => ({
        id: order.id,
        name: order.name,
        status: order.status,
        amount: money(order.finalAmount ?? order.totalAmount),
        items: order.items.slice(0, 3).map((item) => item.menuItem?.name ?? 'Pozycja'),
        createdAt: order.createdAt.toISOString(),
      })),
      latestReservations: latestReservations.map((reservation) => ({
        id: reservation.id,
        name: reservation.contact?.name ?? 'Bez nazwy',
        status: reservation.status,
        eventDate: reservation.eventDate.toISOString(),
        total: money(reservation.offerSnapshot?.total),
        createdAt: reservation.createdAt.toISOString(),
      })),
    },
  })
}
