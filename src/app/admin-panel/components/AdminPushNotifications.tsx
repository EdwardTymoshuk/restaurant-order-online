'use client'

import { cn } from '@/utils/utils'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type PushState = 'checking' | 'unsupported' | 'not-configured' | 'blocked' | 'off' | 'on'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

const saveSubscription = async (subscription: PushSubscription) => {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })

  if (!response.ok) {
    throw new Error('Nie udało się zapisać powiadomień.')
  }
}

export const AdminPushNotifications = ({ className }: { className?: string }) => {
  const [state, setState] = useState<PushState>('checking')
  const [isLoading, setIsLoading] = useState(false)

  const getPublicKey = useCallback(async () => {
    const response = await fetch('/api/push/public-key', { cache: 'no-store' })
    if (response.status === 503) {
      setState('not-configured')
      return null
    }
    if (!response.ok) throw new Error('Nie udało się pobrać klucza powiadomień.')

    const data = await response.json() as { publicKey?: string }
    return data.publicKey || null
  }, [])

  useEffect(() => {
    let ignore = false

    const checkSubscription = async () => {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        setState('unsupported')
        return
      }

      if (Notification.permission === 'denied') {
        setState('blocked')
        return
      }

      const publicKey = await getPublicKey()
      if (!publicKey || ignore) return

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (ignore) return

      if (subscription) {
        await saveSubscription(subscription).catch(() => undefined)
        setState('on')
      } else {
        setState('off')
      }
    }

    void checkSubscription().catch(() => {
      if (!ignore) setState('off')
    })

    return () => {
      ignore = true
    }
  }, [getPublicKey])

  const enableNotifications = async () => {
    if (isLoading || state === 'on' || state === 'blocked' || state === 'unsupported') return

    setIsLoading(true)

    try {
      const publicKey = await getPublicKey()
      if (!publicKey) return

      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setState('blocked')
        return
      }
      if (permission !== 'granted') {
        setState('off')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }))

      await saveSubscription(subscription)
      setState('on')
    } catch (error) {
      console.error(error)
      setState('off')
    } finally {
      setIsLoading(false)
    }
  }

  if (state === 'unsupported' || state === 'not-configured') return null

  const isOn = state === 'on'
  const isBlocked = state === 'blocked'
  const title = isOn
    ? 'Powiadomienia push są włączone'
    : isBlocked
      ? 'Powiadomienia są zablokowane w ustawieniach przeglądarki'
      : 'Włącz powiadomienia o nowych zamówieniach i rezerwacjach'

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={enableNotifications}
      disabled={isLoading || isOn || isBlocked || state === 'checking'}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors',
        'hover:border-primary/70 hover:text-primary disabled:cursor-default disabled:hover:border-white/15',
        isOn && 'border-primary/50 bg-primary/10 text-primary',
        isBlocked && 'text-white/40',
        className
      )}
    >
      {isLoading || state === 'checking' ? (
        <Loader2 size={17} className="animate-spin" />
      ) : isBlocked ? (
        <BellOff size={17} />
      ) : isOn ? (
        <BellRing size={17} />
      ) : (
        <Bell size={17} />
      )}
    </button>
  )
}
