import { Analytics } from '@vercel/analytics/react'
import { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import Script from 'next/script'
import ClientRoutingHandler from './components/ClientRoutingHandler'
import PageLoader from './components/PageLoader'
import Providers from './components/Providers'
import './globals.css'

const roboto = Roboto({ weight: '400', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zamówienia | Spoko Sopot',
  description:
    'Zamów online swoje ulubione dania z dostawą do domu lub odbiorem osobistym w Spoko Sopot. Szybko, wygodnie i smacznie!',
  openGraph: {
    title: 'Zamówienia | Spoko Sopot',
    description:
      'Zamów online swoje ulubione dania z dostawą do domu lub odbiorem osobistym w Spoko Sopot. Szybko, wygodnie i smacznie!',
    url: 'https://order.spokosopot.pl',
    siteName: 'Restauracja Spoko',
    images: [
      {
        url: 'https://spokosopot.pl/img/main-page.webp',
        width: 1200,
        height: 630,
        alt: 'Zdjęcie Restauracji Spoko z widokiem na Bałtyk',
        type: 'image/jpeg',
      },
    ],
    locale: 'pl_PL',
    type: 'website',
  },
}

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-JJXBY09736"
        />
        <Script strategy="afterInteractive" id="gtag-init">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', 'G-JJXBY09736');
          `}
        </Script>
      </head>
      <body className={roboto.className}>
        <Providers>
          <PageLoader>
            <ClientRoutingHandler>{children}</ClientRoutingHandler>
          </PageLoader>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
