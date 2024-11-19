// app/admin-panel/settings/page.tsx
'use client'

import { useIsAdmin } from '@/hooks/useIsAdmin'
import UserList from '../components/UserList'

const Settings = () => {
	const isAdmin = useIsAdmin()
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Ustawienia</h1>
			<div className="space-y-8">
				{isAdmin &&
					<section>
						<UserList />
					</section>
				}

				{/* Додаткові налаштування */}
				<section>
					<h2 className="text-xl font-semibold mb-2">Inne ustawienia</h2>
					<p className="text-gray-600">Tutaj można dodać inne opcje konfiguracyjne dla administratora.</p>
					{/* Місце для інших компонентів налаштувань */}
				</section>
			</div>
		</div>
	)
}

export default Settings
