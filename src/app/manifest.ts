import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spoko Admin Panel',
    short_name: 'Spoko Admin',
    description: 'Panel operacyjny Spoko Sopot do obsługi zamówień i rezerwacji.',
    start_url: '/admin-panel',
    scope: '/admin-panel',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6f7f8',
    theme_color: '#173a8a',
    categories: ['food', 'business', 'productivity'],
    icons: [
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
