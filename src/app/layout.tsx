'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import { CartProvider } from '@/app/context/CartContext'
import { trpc } from '@/utils/trps'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Inter, Roboto } from 'next/font/google'
import { useState } from 'react'
import { Toaster } from 'sonner'
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
        <CartProvider>
          <QueryClientProvider client={queryClient}>
            <Header />
            <MainContainer>
              {children}
            </MainContainer>
            <Toaster position='top-center' richColors />
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </CartProvider>
      </body>
    </html>
  )
}

// Обгортаємо ваш RootLayout з `withTRPC`
export default trpc.withTRPC(RootLayout)
