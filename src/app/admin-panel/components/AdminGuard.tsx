// app/components/AdminGuard.tsx
'use client'

import { Skeleton } from '@/app/components/ui/skeleton'
import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'

interface AdminGuardProps {
	children: ReactNode
}

const AdminGuard = ({ children }: AdminGuardProps) => {
	const { data: session, status } = useSession()

	// Показуємо Skeleton під час завантаження
	if (status === 'loading') {
		return <div className="p-6"><Skeleton /></div>
	}

	// Показуємо контент тільки якщо роль – адміністратор
	if (session?.user?.role === 'admin') {
		return <>{children}</>
	}

	// Якщо користувач не адміністратор, не показуємо нічого
	return null
}

export default AdminGuard
