import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spoko Sopot — Zamów online',
    short_name: 'Spoko Sopot',
    description: 'Zamów online ulubione dania z Restauracji Spoko w Sopocie. Dostawa lub odbiór osobisty.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#173a8a',
    theme_color: '#173a8a',
    categories: ['food', 'restaurants', 'lifestyle'],
    icons: [
      {
        src: '/icons/order-icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/order-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/order-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Złóż zamówienie',
        short_name: 'Zamów',
        description: 'Przejdź bezpośrednio do menu i złóż zamówienie.',
        url: '/',
        icons: [{ src: '/icons/order-icon.png', sizes: '512x512' }],
      },
    ],
  }
}
