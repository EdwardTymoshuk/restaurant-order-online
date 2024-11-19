// src/app/admin-panel/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { Skeleton } from '../components/ui/skeleton'
import AdminGuard from './components/AdminGuard'
import AdminPanelContent from './components/AdminPanelContent'

export default function AdminPanel() {

	const { data: session, status } = useSession()
	const router = useRouter()

	useEffect(() => {
		if (status === 'loading') return
		if (status === 'unauthenticated') {
			router.push('/admin-panel/auth/login')
		}
	}, [status, session, router])

	return (
		<AdminGuard>
			<Suspense fallback={
				<div className='flex flex-col w-full p-8'>
					<Skeleton className='h-8 w-full mb-4' />
					<Skeleton className='h-8 w-full mb-4' />
					<Skeleton className='h-8 w-full mb-4' />
					<Skeleton className='h-8 w-full mb-4' />
					<Skeleton className='h-8 w-full mb-4' />
				</div>
			}>
				<AdminPanelContent />
			</Suspense>
		</AdminGuard>
	)
}
