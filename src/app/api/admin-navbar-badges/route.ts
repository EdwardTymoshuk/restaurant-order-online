import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [orders, reservations] = await Promise.all([
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({ where: { status: 'SENT' } }),
  ])

  return NextResponse.json({ orders, reservations })
}
