'use client'

import { trpc } from '@/utils/trpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { TRPCClientError } from '@trpc/client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import LoadingButton from './LoadingButton'
import OrderStatusTracker from './OrderStatusTracker'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

// Схема для валідації номера телефону
const trackingSchema = z.object({
	phone: z.string().regex(/^\+?[0-9]{9}$/, 'Podaj numer telefonu w formacie xxxxxxxxxx'),
})

type TrackingFormData = z.infer<typeof trackingSchema>

interface OrderTrackingDialogProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}

const OrderTrackingDialog: React.FC<OrderTrackingDialogProps> = ({ isOpen, onOpenChange }) => {
	const { register, handleSubmit, formState: { errors }, reset } = useForm<TrackingFormData>({
		resolver: zodResolver(trackingSchema),
		mode: 'onChange',
	})
	const [isLoading, setIsLoading] = useState(false)
	const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
	const [orderStatus, setOrderStatus] = useState<string | null>(null)
	const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'TAKE_OUT'>('TAKE_OUT')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const getOrderStatus = trpc.order.getOrderStatus.useQuery(
		{ phone: phoneNumber || '' }, // Якщо phoneNumber null, передаємо порожній рядок
		{
			enabled: !!phoneNumber, // Виконуємо запит лише тоді, коли phoneNumber не null
			onSuccess: (data) => {
				setOrderStatus(data?.status || null)
				setDeliveryMethod(data?.deliveryMethod || 'TAKE_OUT')
				setIsLoading(false)
			},
			onError: (error) => {
				if (error instanceof TRPCClientError && error.message === 'Order not found') {
					setErrorMessage('Nie znaleziono zamówienia dla podanego numeru telefonu, sprawdź jego poprawność.')
				} else {
					setErrorMessage('Wystąpił błąd. Spróbuj ponownie.')
				}
				setOrderStatus(null)
				setIsLoading(false)
			}
		}
	)

	const onSubmit = async (data: TrackingFormData) => {
		setErrorMessage(null)
		setPhoneNumber(data.phone)
		if (data.phone) {
			setIsLoading(true)
			getOrderStatus.refetch() // Викликаємо запит вручну після встановлення стану
		}
	}

	const handleReset = () => {
		reset()
		setOrderStatus(null)
		setPhoneNumber(null)
		setErrorMessage(null)
		onOpenChange(false)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				{orderStatus === null && (
					<DialogHeader>
						<DialogTitle className='text-2xl'>Śledź zamówienie</DialogTitle>

						<p className='text-sm text-text-foreground'>Wpisz nr telefonu podany podczas zamówienia, aby sprawdzić na jakim etapie jest Twoje zamówienie.</p>

					</DialogHeader>
				)}
				{orderStatus !== null ? (
					<div className="space-y-4 py-4">
						<OrderStatusTracker status={orderStatus} deliveryMethod={deliveryMethod} />
						<DialogFooter>
							<Button variant="secondary" onClick={handleReset}>Zamknij</Button>
						</DialogFooter>
					</div>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
						<div>
							<Input
								id='phone'
								placeholder="Numer telefonu"
								{...register('phone')}
								className={errors.phone ? 'border-danger' : ''}
							/>
							{errors.phone && (
								<p className="text-danger text-sm pt-1">{errors.phone.message}</p>
							)}
							{errorMessage && (
								<p className="text-danger text-sm pt-1">{errorMessage}</p>
							)}
						</div>
						<DialogFooter>
							<LoadingButton isLoading={isLoading} variant='secondary' className='w-full'>Sprawdź</LoadingButton>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	)
}

export default OrderTrackingDialog
