import { ReactNode, createContext, useContext, useState } from 'react'

interface OrderContextType {
	orderId: string | null
	phoneNumber: string | null
	clientName: string | null
	deliveryMethod: 'DELIVERY' | 'TAKE_OUT' | null
	deliveryTime: string | null
	setOrderData: (id: string, phone: string, name: string, method: 'DELIVERY' | 'TAKE_OUT', time: string) => void
	clearOrderData: () => void
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export const useOrder = () => {
	const context = useContext(OrderContext)
	if (!context) {
		throw new Error('useOrder must be used within an OrderProvider')
	}
	return context
}

export const OrderProvider = ({ children }: { children: ReactNode }) => {
	const [orderId, setOrderId] = useState<string | null>(null)
	const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
	const [clientName, setClientName] = useState<string | null>(null)
	const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'TAKE_OUT' | null>(null)
	const [deliveryTime, setDeliveryTime] = useState<string | null>(null)

	const setOrderData = (id: string, phone: string, name: string, method: 'DELIVERY' | 'TAKE_OUT', time: string) => {
		setOrderId(id)
		setPhoneNumber(phone)
		setClientName(name)
		setDeliveryMethod(method)
		setDeliveryTime(time)
	}

	const clearOrderData = () => {
		setOrderId(null)
		setPhoneNumber(null)
		setClientName(null)
		setDeliveryMethod(null)
		setDeliveryTime(null)
	}

	return (
		<OrderContext.Provider value={{ orderId, phoneNumber, clientName, deliveryMethod, deliveryTime, setOrderData, clearOrderData }}>
			{children}
		</OrderContext.Provider>
	)
}
