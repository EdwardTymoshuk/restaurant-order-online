'use client'

import { useEffect } from 'react'

export default function PwaRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (error) {
        console.warn('Nie udało się zarejestrować service workera PWA.', error)
      }
    }

    registerServiceWorker()
  }, [])

  return null
}
