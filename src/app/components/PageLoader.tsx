'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingScreen from './LoadingScreen'

const PageLoader = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isLoading, setIsLoading] = useState(true)

	// Лоадер показується тільки для головної сторінки або адмін-панелі без вкладок
	const shouldShowLoadingScreen =
		pathname === '/' || (pathname === '/admin-panel' && !searchParams.get('tab'))

	useEffect(() => {
		if (shouldShowLoadingScreen) {
			setIsLoading(true)
			const timer = setTimeout(() => setIsLoading(false), 1500) // Затримка для лоадера
			return () => clearTimeout(timer)
		} else {
			setIsLoading(false)
		}
	}, [shouldShowLoadingScreen])

	// Якщо лоадер активний, показуємо екран завантаження
	if (isLoading && shouldShowLoadingScreen) {
		return <LoadingScreen fullScreen />
	}

	return <>{children}</>
}

export default PageLoader
