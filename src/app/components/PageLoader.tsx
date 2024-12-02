'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import LoadingScreen from './LoadingScreen'

const PageLoader = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isLoading, setIsLoading] = useState(true)

	const shouldShowLoadingScreen =
		pathname === '/' || (pathname === '/admin-panel' && !searchParams.get('tab'))

	useEffect(() => {
		if (shouldShowLoadingScreen) {
			setIsLoading(true)
			const timer = setTimeout(() => setIsLoading(false), 1500)
			return () => clearTimeout(timer)
		} else {
			setIsLoading(false)
		}
	}, [shouldShowLoadingScreen])

	if (isLoading && shouldShowLoadingScreen) {
		return <LoadingScreen fullScreen />
	}

	return <>{children}</>
}

const PageLoaderWrapper = ({ children }: { children: React.ReactNode }) => (
	<Suspense fallback={<LoadingScreen fullScreen />}>
		<PageLoader>{children}</PageLoader>
	</Suspense>
)

export default PageLoaderWrapper
