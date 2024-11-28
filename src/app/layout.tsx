// src/app/layout.tsx
'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import useLogoutOnTabClose from '@/hooks/useLogoutOnTabClose'
import { trpc } from '@/utils/trpc'
import { Inter, Roboto } from 'next/font/google'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'
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
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)

  // Перевірка, чи шлях містить "admin-panel"
  const isAdminPanel = pathname?.startsWith('/admin-panel')
  const isCheckout = pathname?.startsWith('/checkout')
  const isOrder = pathname?.startsWith('/order')
  const isThankYou = pathname?.startsWith('/thank-you')
  const isHomePage = pathname === '/'


  const shouldShowLoadingScreen =
    pathname === '/' || (pathname === '/admin-panel' && !searchParams.get('tab'))

  useEffect(() => {
    if (shouldShowLoadingScreen) {
      setIsLoading(true)
      const timer = setTimeout(() => setIsLoading(false), 3200) // Затримка для лоадера
      return () => clearTimeout(timer)
    }
  }, [shouldShowLoadingScreen])

  useLogoutOnTabClose()

  if (isLoading && shouldShowLoadingScreen) {
    return (
      <html lang='en'>
        <body className={roboto.className}>
          <LoadingScreen fullScreen />
        </body>
      </html>
    )
  }
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
