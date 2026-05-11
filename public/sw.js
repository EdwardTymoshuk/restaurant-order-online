const CACHE_NAME = 'spoko-admin-pwa-v1'
const APP_SHELL = [
  '/icons/cleaned.png',
  '/img/logo-admin.svg',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request))
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(request).then((response) => {
        const shouldCache =
          response.ok &&
          (url.pathname.startsWith('/_next/static/') ||
            url.pathname.startsWith('/icons/') ||
            url.pathname.startsWith('/img/'))

        if (shouldCache) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        }

        return response
      })
    })
  )
})

self.addEventListener('push', (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {
      title: 'Nowe zdarzenie w Spoko',
      body: event.data ? event.data.text() : 'Sprawdź panel administracyjny.',
    }
  }

  const title = payload.title || 'Spoko Admin'
  const options = {
    body: payload.body || 'Masz nowe zdarzenie w panelu.',
    icon: '/icons/cleaned.png',
    badge: '/icons/cleaned.png',
    tag: payload.tag || 'spoko-admin-notification',
    renotify: true,
    requireInteraction: true,
    vibrate: [180, 80, 180],
    data: {
      url: payload.url || '/admin-panel',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/admin-panel'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
