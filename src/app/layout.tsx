// src/app/layout.tsx
'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import { trpc } from '@/utils/trpc'
import { Inter, Roboto } from 'next/font/google'
import { usePathname } from 'next/navigation'
import Footer from './components/Footer'
import Providers from './components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const roboto = Roboto({ weight: '400', subsets: ['latin'] })

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  // Перевірка, чи шлях містить "admin-panel"
  const isAdminPanel = pathname?.startsWith('/admin-panel')
  const isCheckout = pathname?.startsWith('/checkout')
  const isOrder = pathname?.startsWith('/order')
  const isThankYou = pathname?.startsWith('/thank-you')
  const isHomePage = pathname === '/'

  return (
    <html lang='en'>
      <body className={roboto.className}>
        <Providers>
          {!isAdminPanel && <Header />}
          {!isAdminPanel && !isHomePage ? (
            <MainContainer>
              {children}
            </MainContainer>
          ) : (
            children
          )}
        </Providers>
        {!isAdminPanel && <Footer />}
      </body>
    </html>
  )
}

export default trpc.withTRPC(RootLayout)
