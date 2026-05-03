import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Snapshot = {
  ordersVersion: string
  reservationsVersion: string
  availabilityVersion: string
  pendingOrders: number
  pendingReservations: number
}

const getSnapshot = async (): Promise<Snapshot> => {
  const [
    ordersAggregate,
    reservationsAggregate,
    availabilityAggregate,
    pendingOrders,
    pendingReservations,
  ] = await Promise.all([
    prisma.order.aggregate({ _max: { updatedAt: true } }),
    prisma.reservation.aggregate({ _max: { updatedAt: true } }),
    prisma.calendarAvailability.aggregate({ _max: { updatedAt: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({ where: { status: 'SENT' } }),
  ])

  return {
    ordersVersion: ordersAggregate._max.updatedAt?.toISOString() ?? '',
    reservationsVersion: reservationsAggregate._max.updatedAt?.toISOString() ?? '',
    availabilityVersion: availabilityAggregate._max.updatedAt?.toISOString() ?? '',
    pendingOrders,
    pendingReservations,
  }
}

const sse = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let previous = await getSnapshot()
  let interval: NodeJS.Timeout | undefined
  let heartbeat: NodeJS.Timeout | undefined

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse('connected', previous)))

      interval = setInterval(async () => {
        try {
          const next = await getSnapshot()

          if (next.ordersVersion !== previous.ordersVersion) {
            controller.enqueue(encoder.encode(sse('orders_changed', next)))
          }

          if (
            next.reservationsVersion !== previous.reservationsVersion ||
            next.availabilityVersion !== previous.availabilityVersion
          ) {
            controller.enqueue(encoder.encode(sse('reservations_changed', next)))
          }

          if (
            next.pendingOrders !== previous.pendingOrders ||
            next.pendingReservations !== previous.pendingReservations
          ) {
            controller.enqueue(encoder.encode(sse('badges_changed', next)))
          }

          previous = next
        } catch {
          controller.enqueue(encoder.encode(sse('error', { message: 'Realtime stream error' })))
        }
      }, 2000)

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 25000)
    },
    cancel() {
      if (interval) clearInterval(interval)
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
