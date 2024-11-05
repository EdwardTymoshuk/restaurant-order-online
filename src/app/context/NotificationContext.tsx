// src/context/NotificationContext.tsx
'use client'

import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/app/components/ui/dialog'
import { ReactNode, createContext, useContext, useState } from 'react'

interface NotificationContextType {
	newOrderId: string | null
	showDialog: (orderId: string) => void
	hideDialog: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
	const context = useContext(NotificationContext)
	if (!context) {
		throw new Error('useNotification must be used within a NotificationProvider')
	}
	return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
	const [newOrderId, setNewOrderId] = useState<string | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const showDialog = (orderId: string) => {
		setNewOrderId(orderId)
		setIsDialogOpen(true)
		const audio = new Audio('/audio/notification.wav')
		audio.play()
	}

	const hideDialog = () => {
		setIsDialogOpen(false)
		setTimeout(() => setNewOrderId(null), 5000) // Додатковий час для виділення
	}

	return (
		<NotificationContext.Provider value={{ newOrderId, showDialog, hideDialog }}>
			{children}

			<Dialog open={isDialogOpen} onOpenChange={hideDialog}>
				<DialogContent>
					<p>Nowe zamówienie!</p>
					<DialogFooter className='w-full'>
						<Button onClick={hideDialog}>OK</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</NotificationContext.Provider>
	)
}
