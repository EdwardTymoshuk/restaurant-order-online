'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import { trpc } from '@/utils/trps'
import { QueryClient } from '@tanstack/react-query'
import { Inter, Roboto } from 'next/font/google'
import { useState } from 'react'
import Providers from './components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const roboto = Roboto({ weight: '400', subsets: ['latin'] })

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang='en'>
      <body className={roboto.className}>
        <Providers>
          <Header />
          <MainContainer>
            {children}
          </MainContainer>
        </Providers>
      </body>
    </html>
  )
}

// Обгортаємо ваш RootLayout з `withTRPC`
export default trpc.withTRPC(RootLayout)
