'use client'

import { trpc } from '@/utils/trpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { TRPCClientError } from '@trpc/client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { SlRefresh } from "react-icons/sl"
import { z } from 'zod'
import LoadingButton from './LoadingButton'
import OrderStatusTracker from './OrderStatusTracker'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

// Validation schema
const trackingSchema = z.object({
	phone: z.string().regex(/^[0-9]{9,15}$/, 'Podaj numer telefonu w formacie xxxxxxxxxx'),
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
	const [orderData, setOrderData] = useState<{ activeOrder: any, completedOrder: any } | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [lastUpdated, setLastUpdated] = useState<string | null>(null)

	// Fetch order status
	const getOrderStatus = trpc.order.getOrderStatus.useQuery(
		{ phone: phoneNumber || '' },
		{
			enabled: !!phoneNumber,
			onSuccess: (data) => {
				setOrderData(data)
				setLastUpdated(new Date().toLocaleTimeString())
				setIsLoading(false)
			},
			onError: (error) => {
				if (error instanceof TRPCClientError && error.message === 'Order not found') {
					setErrorMessage('Nie znaleziono zamówienia dla podanego numeru telefonu.')
				} else {
					setErrorMessage('Wystąpił błąd. Spróbuj ponownie.')
				}
				setOrderData(null)
				setIsLoading(false)
			},
		}
	)

	// Handle form submission
	const onSubmit = async (data: TrackingFormData) => {
		setErrorMessage(null)
		setPhoneNumber(data.phone)
		if (data.phone) {
			setIsLoading(true)
			getOrderStatus.refetch()
		}
	}

	// Handle reset
	const handleReset = () => {
		reset()
		setOrderData(null)
		setPhoneNumber(null)
		setErrorMessage(null)
		setLastUpdated(null)
		onOpenChange(false)
	}

	const { activeOrder, completedOrder } = orderData || {}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				{!orderData ? (
					<>
						<DialogHeader>
							<DialogTitle className="text-2xl">Śledź zamówienie</DialogTitle>
							<p className="text-sm text-text-foreground">
								Wpisz nr telefonu podany podczas zamówienia, aby sprawdzić na jakim etapie jest Twoje zamówienie.
							</p>
						</DialogHeader>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
							<div>
								<Input
									id="phone"
									placeholder="Numer telefonu"
									{...register('phone')}
									className={errors.phone ? 'border-danger' : ''}
								/>
								{errors.phone && <p className="text-danger text-sm pt-1">{errors.phone.message}</p>}
								{errorMessage && <p className="text-danger text-sm pt-1">{errorMessage}</p>}
							</div>
							<DialogFooter>
								<LoadingButton isLoading={isLoading} variant="secondary" className="w-full">
									Sprawdź
								</LoadingButton>
							</DialogFooter>
						</form>
					</>
				) : (
					<div className="flex flex-col space-y-2 py-4 items-start">
						{activeOrder ? (
							<>
								<OrderStatusTracker status={activeOrder.status} deliveryMethod={activeOrder.deliveryMethod} />
								<p className="text-base lg:text-lg font-semibold text-secondary mt-2">
									Przybliony czas dostawy/odbioru:
									<span className='text-primary uppercase'>
										{activeOrder.deliveryTime ? ` ${new Date(activeOrder.deliveryTime).toLocaleDateString()} ${new Date(activeOrder.deliveryTime).toLocaleTimeString()}` : 'Nieznany czas'}
									</span>
								</p>
							</>
						) : (
							<>
								<OrderStatusTracker status={completedOrder?.status || ''} deliveryMethod={completedOrder?.deliveryMethod || 'TAKE_OUT'} />
								<p className="text-base lg:text-lg font-semibold text-secondary text-center self-center mt-2">
									Dziękujemy za zamówienie!
								</p>
							</>
						)}
						<DialogFooter className='self-center'>
							<Button
								variant="link"
								onClick={async () => {
									setIsLoading(true)
									await new Promise((resolve) => setTimeout(resolve, 300))
									getOrderStatus.refetch()
									setIsLoading(false)
								}}
								disabled={isLoading}
								className="relative group"
							>
								{isLoading ? (
									<svg
										className="animate-spin h-6 w-6 text-primary"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.964 7.964 0 014 12H2c0 2.042.618 3.933 1.677 5.522l1.323-1.231z"
										></path>
									</svg>
								) : (
									<SlRefresh
										size={24}
										className="transition-transform duration-300 group-hover:rotate-90"
									/>
								)}
							</Button>
							<Button variant="secondary" onClick={handleReset}>
								Zamknij
							</Button>
						</DialogFooter>
						{lastUpdated && (
							<p className="text-sm text-gray-500 text-center w-full">
								Ostatnia aktualizacja: {lastUpdated}
							</p>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}

export default OrderTrackingDialog
