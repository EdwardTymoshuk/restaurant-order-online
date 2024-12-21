import { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import ClientRoutingHandler from './components/ClientRoutingHandler'
import PageLoader from './components/PageLoader'
import Providers from './components/Providers'
import './globals.css'

const roboto = Roboto({ weight: '400', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zamówienia | Spoko Sopot',
  description: 'Zamów online swoje ulubione dania z dostawą do domu lub odbiorem osobistym w Spoko Sopot. Szybko, wygodnie i smacznie!',
}

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={roboto.className}>
        <Providers>
          <PageLoader>
            <ClientRoutingHandler>{children}</ClientRoutingHandler>
          </PageLoader>
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
