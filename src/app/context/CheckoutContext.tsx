'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

const OPENING_HOUR = 10 // Приклад
const CLOSING_HOUR = 22 // Приклад
const OPENING_MINUTES_DELAY = 0

interface DeliveryData {
	city: string
	postalCode: string
	street: string
	buildingNumber: string
	flatNumber?: string
}

interface PaymentData {
	method: string
	details: any
}

interface CheckoutContextType {
	deliveryData: DeliveryData
	paymentData: PaymentData
	setDeliveryData: React.Dispatch<React.SetStateAction<DeliveryData>>
	setPaymentData: React.Dispatch<React.SetStateAction<PaymentData>>
	validate: () => boolean
	isRestaurantClosed: boolean
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined)

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [deliveryData, setDeliveryData] = useState<DeliveryData>({
		city: '',
		postalCode: '',
		street: '',
		buildingNumber: '',
		flatNumber: '',
	})
	const [paymentData, setPaymentData] = useState<PaymentData>({
		method: '',
		details: {},
	})
	const [isRestaurantClosed, setIsRestaurantClosed] = useState(false)

	useEffect(() => {
		const now = new Date()
		const openingTime = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			OPENING_HOUR,
			OPENING_MINUTES_DELAY
		)
		const closingTime = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			CLOSING_HOUR
		)

		// Визначаємо, чи ресторан закритий
		setIsRestaurantClosed(now < openingTime || now >= closingTime)
	}, [])

	const validate = () => {
		let valid = true
		if (!deliveryData.city || !deliveryData.postalCode || !deliveryData.street || !deliveryData.buildingNumber) {
			valid = false
		}
		if (!paymentData.method) {
			valid = false
		}
		return valid
	}

	return (
		<CheckoutContext.Provider
			value={{
				deliveryData,
				paymentData,
				setDeliveryData,
				setPaymentData,
				validate,
				isRestaurantClosed,
			}}
		>
			{children}
		</CheckoutContext.Provider>
	)
}

export const useCheckout = () => {
	const context = useContext(CheckoutContext)
	if (!context) {
		throw new Error('useCheckout must be used within a CheckoutProvider')
	}
	return context
}
