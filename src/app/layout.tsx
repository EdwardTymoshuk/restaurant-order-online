// src/app/layout.tsx
'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import { Inter, Roboto } from 'next/font/google'
import { usePathname } from 'next/navigation'
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

  return (
    <html lang='en'>
      <body className={roboto.className}>
        <Providers>
          {!isAdminPanel && <Header />}
          {!isAdminPanel ? (
            <MainContainer>
              {children}
            </MainContainer>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
