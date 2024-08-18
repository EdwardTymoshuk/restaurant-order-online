'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import { CartProvider } from '@/app/context/CartContext'
import { Inter, Roboto } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

import { trpc, trpcClient } from '@/utils/trps'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })
const roboto = Roboto({ weight: '400', subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang='en'>
      <body className={roboto.className}>
        <CartProvider>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <Header />
              <MainContainer>
                {children}
              </MainContainer>
              <Toaster position='top-center' richColors />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </trpc.Provider>
        </CartProvider>
      </body>
    </html>
  )
}