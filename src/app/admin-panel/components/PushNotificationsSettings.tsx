'use client'

import { Switch } from '@/app/components/ui/switch'
import { cn } from '@/utils/utils'
import { BellOff, BellRing, Loader2 } from 'lucide-react'
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

  if (!response.ok) throw new Error('Nie udało się zapisać powiadomień.')
}

const deleteSubscription = async (subscription: PushSubscription) => {
  const response = await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })

  if (!response.ok) throw new Error('Nie udało się usunąć powiadomień.')
}

export const PushNotificationsSettings = () => {
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

  const getExistingSubscription = async () => {
    const registration = await navigator.serviceWorker.ready
    return registration.pushManager.getSubscription()
  }

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

      const subscription = await getExistingSubscription()
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

  const disableNotifications = async () => {
    setIsLoading(true)

    try {
      const subscription = await getExistingSubscription()
      if (subscription) {
        await deleteSubscription(subscription).catch(() => undefined)
        await subscription.unsubscribe()
      }
      setState('off')
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (checked: boolean) => {
    if (isLoading || state === 'checking') return
    if (checked) {
      void enableNotifications()
    } else {
      void disableNotifications()
    }
  }

  const disabled = isLoading || state === 'checking' || state === 'unsupported' || state === 'not-configured' || state === 'blocked'
  const statusText =
    state === 'on'
      ? 'Włączone dla tej przeglądarki'
      : state === 'blocked'
        ? 'Zablokowane w ustawieniach przeglądarki'
        : state === 'unsupported'
          ? 'Niedostępne w tej przeglądarce'
          : state === 'not-configured'
            ? 'Brak konfiguracji push'
            : 'Wyłączone'

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            state === 'on' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
          )}
        >
          {isLoading || state === 'checking' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : state === 'on' ? (
            <BellRing size={18} />
          ) : (
            <BellOff size={18} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">Powiadomienia push</p>
          <p className="text-xs text-muted-foreground">{statusText}</p>
        </div>
      </div>
      <Switch
        checked={state === 'on'}
        disabled={disabled}
        onCheckedChange={handleToggle}
        aria-label="Powiadomienia push"
      />
    </div>
  )
}
