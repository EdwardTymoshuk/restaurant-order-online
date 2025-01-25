'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Button } from '@/app/components/ui/button'
import { trpc } from '@/utils/trpc'
import { useState } from 'react'
import { toast } from 'sonner'

interface DeliveryTimeManagerProps {
	orderId: string
	currentDeliveryTime: Date
}

const DeliveryTimeManager: React.FC<DeliveryTimeManagerProps> = ({
	orderId,
	currentDeliveryTime,
}) => {
	const [isLoading, setIsLoading] = useState(false)
	const [selectedTime, setSelectedTime] = useState<number | null>(null) // Selected additional time
	const [updatedDeliveryTime, setUpdatedDeliveryTime] = useState<Date>(currentDeliveryTime) // Local delivery time state

	const updateDeliveryTime = trpc.order.updateDeliveryTime.useMutation({
		onSuccess: (data) => {
			toast.success('Czas dostawy został zaktualizowany!')
			// Update local delivery time based on server response
			setUpdatedDeliveryTime(new Date(data.deliveryTime))
			setSelectedTime(null) // Reset selected time
		},
		onError: () => {
			toast.error('Wystąpił błąd podczas aktualizacji czasu dostawy.')
		},
	})

	const handleAddTime = async () => {
		if (selectedTime === null) return

		setIsLoading(true)
		try {
			// Call server to update delivery time
			await updateDeliveryTime.mutateAsync({
				orderId,
				additionalTime: selectedTime,
			})
		} catch (error) {
			console.error('Błąd podczas aktualizacji czasu dostawy:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Format the delivery time for display
	const formattedDeliveryTime = new Date(updatedDeliveryTime).toLocaleTimeString('pl-PL', {
		hour: '2-digit',
		minute: '2-digit',
	})

	return (
		<div className="flex flex-col">
			{/* Display current delivery time */}
			<p className="text-base">
				<span className="text-secondary font-bold">Aktualny czas dostawy:</span> {formattedDeliveryTime}
			</p>

			{/* Buttons for selecting time */}
			<p className="text-base pt-4">
				<span className="text-secondary font-bold">Dodaj czas dostawy:</span>
			</p>
			<div className="flex gap-2 flex-wrap py-2">
				{[10, 15, 30, 45, 60].map((time) => (
					<Button
						key={time}
						variant={selectedTime === time ? 'default' : 'outline'}
						size="sm"
						className={selectedTime === time ? 'bg-primary' : ''}
						disabled={isLoading}
						onClick={() => setSelectedTime(time)}
					>
						+{time} min
					</Button>
				))}
			</div>

			{/* Confirm button */}
			{selectedTime !== null && (
				<div className="flex space-x-2">
					<LoadingButton
						isLoading={isLoading}
						variant="default"
						size="sm"
						onClick={handleAddTime}
						disabled={isLoading}
					>
						Dodaj
					</LoadingButton>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setSelectedTime(null)}
						disabled={isLoading}
					>
						Anuluj
					</Button>
				</div>
			)}
		</div>
	)
}

export default DeliveryTimeManager
