import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spoko Admin',
    short_name: 'Spoko Admin',
    description: 'Panel administracyjny Restauracji Spoko Sopot — zamówienia, rezerwacje, menu.',
    start_url: '/admin-panel',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#173a8a',
    theme_color: '#173a8a',
    categories: ['food', 'business', 'productivity'],
    icons: [
      {
        src: '/icons/cleaned.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/cleaned.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/cleaned.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Zamówienia',
        short_name: 'Zamówienia',
        description: 'Przejdź do obsługi zamówień.',
        url: '/admin-panel/orders',
        icons: [{ src: '/icons/cleaned.png', sizes: '512x512' }],
      },
      {
        name: 'Rezerwacje',
        short_name: 'Rezerwacje',
        description: 'Przejdź do obsługi rezerwacji.',
        url: '/admin-panel/reservations',
        icons: [{ src: '/icons/cleaned.png', sizes: '512x512' }],
      },
    ],
  }
}
