import { prisma } from '@/lib/prisma'
import webpush, { PushSubscription } from 'web-push'

type PushPayload = {
  title: string
  body: string
  url: string
  tag: string
}

const publicKey =
  process.env.WEB_PUSH_PUBLIC_KEY || process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
const subject = process.env.WEB_PUSH_SUBJECT || 'mailto:info@spokosopot.pl'

const isPushConfigured = Boolean(publicKey && privateKey)

if (isPushConfigured) {
  webpush.setVapidDetails(subject, publicKey!, privateKey!)
}

export const getWebPushPublicKey = () => publicKey

export const sendAdminPushNotification = async (payload: PushPayload) => {
  if (!isPushConfigured) {
    console.warn('Web Push is not configured. Missing VAPID keys.')
    return
  }

  const subscriptions = await prisma.pushSubscription.findMany()
  if (subscriptions.length === 0) return

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      }

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
      } catch (error) {
        const statusCode =
          typeof error === 'object' && error && 'statusCode' in error
            ? Number(error.statusCode)
            : null

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          })
          return
        }

        console.error('Failed to send Web Push notification.', error)
      }
    })
  )
}

export const notifyNewOrder = async ({
  id,
  name,
  finalAmount,
  deliveryMethod,
}: {
  id: string
  name: string
  finalAmount: number | null
  deliveryMethod: 'DELIVERY' | 'TAKE_OUT'
}) => {
  const amount = typeof finalAmount === 'number' ? `${finalAmount.toFixed(2)} zł` : 'bez kwoty'
  const method = deliveryMethod === 'DELIVERY' ? 'dostawa' : 'odbiór'

  await sendAdminPushNotification({
    title: 'Nowe zamówienie',
    body: `${name} · ${amount} · ${method}`,
    url: '/admin-panel?tab=orders',
    tag: `order-${id}`,
  })
}

export const notifyNewReservation = async ({
  id,
  name,
  eventDate,
  startTime,
  guests,
}: {
  id: string
  name: string
  eventDate: Date
  startTime?: string | null
  guests: number
}) => {
  const date = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(eventDate)

  await sendAdminPushNotification({
    title: 'Nowa rezerwacja',
    body: `${name} · ${date}${startTime ? `, ${startTime}` : ''} · ${guests} os.`,
    url: '/admin-panel?tab=reservations',
    tag: `reservation-${id}`,
  })
}
