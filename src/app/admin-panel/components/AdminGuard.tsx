'use client'

import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Skeleton } from '@/app/components/ui/skeleton'
import { signOut, useSession } from 'next-auth/react'
import { ReactNode, useState } from 'react'

interface AdminGuardProps {
	children: ReactNode
}

const AdminGuard = ({ children }: AdminGuardProps) => {
	const { data: session, status } = useSession()
	const [isDialogOpen, setIsDialogOpen] = useState(true)

	if (status === 'loading') {
		return (
			<div className="p-6">
				<Skeleton />
			</div>
		)
	}

	if (session?.user?.role === 'admin') {
		return <>{children}</>
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Dostęp zablokowany</DialogTitle>
					<DialogDescription className='text-text-foreground'>
						Ta strona jest dostępna tylko dla administratorów. Zaloguj się na konto administratora, aby uzyskać dostęp.
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-end gap-4">
					<Button
						variant="secondary"
						onClick={() => signOut({ callbackUrl: '/' })}
					>
						Wyloguj się
					</Button>
					<Button onClick={() => setIsDialogOpen(false)}>
						Zamknij
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default AdminGuard
