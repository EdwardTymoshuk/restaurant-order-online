// src/app/admin-panel/page.tsx
'use client'

import { Suspense } from 'react'
import { Skeleton } from '../components/ui/skeleton'
import AdminPanelContent from './components/AdminPanelContent'

export default function AdminPanel() {
	return (
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
	)
}
