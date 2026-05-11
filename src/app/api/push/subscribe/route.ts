import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

const deleteSchema = z.object({
  endpoint: z.string().url(),
})

type SessionWithOptionalId = {
  user?: {
    id?: string | null
  }
} | null

const getUserId = (session: SessionWithOptionalId) => session?.user?.id ?? null

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = subscriptionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid push subscription.' },
      { status: 400 }
    )
  }

  const subscription = parsed.data

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: getUserId(session),
      userAgent: request.headers.get('user-agent'),
      lastSeenAt: new Date(),
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: getUserId(session),
      userAgent: request.headers.get('user-agent'),
      lastSeenAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = deleteSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid push subscription.' },
      { status: 400 }
    )
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint },
  })

  return NextResponse.json({ ok: true })
}
