'use client'

import Header from '@/app/components/Header'
import MainContainer from '@/app/components/MainContainer'
import useLogoutOnTabClose from '@/hooks/useLogoutOnTabClose'
import { trpc } from '@/utils/trpc'
import { Inter, Roboto } from 'next/font/google'
import { usePathname } from 'next/navigation'
import Footer from './components/Footer'
import PageLoader from './components/PageLoader'
import Providers from './components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const roboto = Roboto({ weight: '400', subsets: ['latin'] })

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isAdminPanel = usePathname()?.startsWith('/admin-panel')
  const isHomePage = usePathname() === '/'

  useLogoutOnTabClose()

  return (
    <html lang="en">
      <body className={roboto.className}>
        <Providers>
          <PageLoader>
            {!isAdminPanel && <Header />}
            {!isAdminPanel && !isHomePage ? (
              <MainContainer>
                {children}
              </MainContainer>
            ) : (
              children
            )}
          </PageLoader>
          {!isAdminPanel && <Footer />}
        </Providers>
      </body>
    </html>
  )
}

export default trpc.withTRPC(RootLayout)
