'use client'

import React from 'react'
import { FaClipboardList, FaHandHoldingHeart, FaShippingFast } from 'react-icons/fa'
import { PiCookingPot, PiHandshake } from "react-icons/pi"
import { SlPresent } from "react-icons/sl"

interface OrderStatusTrackerProps {
	status: string
	deliveryMethod: 'DELIVERY' | 'TAKE_OUT'
}

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ status, deliveryMethod }) => {
	const statuses = [
		{ key: 'PENDING', label: 'złożone', icon: <FaClipboardList /> },
		{ key: 'ACCEPTED', label: 'przyjęte do realizacji', icon: <PiHandshake /> },
		{ key: 'IN_PROGRESS', label: 'w trakcie realizacji', icon: <PiCookingPot /> },
		{
			key: 'READY',
			label: deliveryMethod === 'DELIVERY' ? 'gotowe do wysyłki' : 'gotowe do odbioru',
			icon: <SlPresent />,
		},
		{
			key: 'DELIVERING',
			label: 'w trakcie dostarczenia',
			icon: <FaShippingFast />,
			show: deliveryMethod === 'DELIVERY'
		},
		{
			key: 'DELIVERED',
			label: deliveryMethod === 'DELIVERY' ? 'dostarczono' : 'odebrane',
			icon: <FaHandHoldingHeart />,
		},
	]

	const currentStatus = statuses.find(s => s.key === status)

	return (
		<div className="flex flex-col items-center space-y-4">
			<div className="flex flex-col items-center">
				<div className="h-12 w-12 rounded-full flex items-center justify-center bg-secondary text-white">
					{React.cloneElement(currentStatus?.icon || <FaClipboardList />, {
						className: 'h-8 w-8',
					})}
				</div>
				<p className="text-lg font-semibold text-secondary mt-2">Status Twojego zamówienia: <span className='text-primary uppercase'>{currentStatus?.label}</span></p>
			</div>
		</div>
	)
}

export default OrderStatusTracker
