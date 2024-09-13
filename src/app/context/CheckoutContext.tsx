'use client'

import React, { createContext, useContext, useState } from 'react'

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

// Типи для контексту
interface CheckoutContextType {
	deliveryData: DeliveryData
	paymentData: PaymentData
	setDeliveryData: React.Dispatch<React.SetStateAction<DeliveryData>>
	setPaymentData: React.Dispatch<React.SetStateAction<PaymentData>>
	validate: () => boolean
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
		<CheckoutContext.Provider value={{ deliveryData, paymentData, setDeliveryData, setPaymentData, validate }}>
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
