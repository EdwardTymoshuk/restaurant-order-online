import { useEffect } from 'react'

const useLogoutOnTabClose = () => {
	useEffect(() => {
		const handleTabClose = () => {
			const url = '/api/auth/logout' // Наш новий маршрут
			const data = JSON.stringify({ action: 'logout' })
			navigator.sendBeacon(url, data)

			// Очистка cookies для завершення сесії локально
			document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
			document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
		}

		window.addEventListener('beforeunload', handleTabClose)

		return () => {
			window.removeEventListener('beforeunload', handleTabClose)
		}
	}, [])
}

export default useLogoutOnTabClose