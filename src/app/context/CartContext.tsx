'use client'

import React, { createContext, useContext, useEffect, useReducer } from 'react'

interface CartItem {
	id: string
	name: string
	category: string
	price: number
	quantity: number
	image: string
}

interface DiscountInfo {
	code: string
	discountValue: number
	discountType: 'PERCENTAGE' | 'FIXED'
}

export interface CartState {
	items: CartItem[]
	totalAmount: number
	finalAmount: number
	deliveryDiscount?: DiscountInfo | null // Знижка для доставки
	takeOutDiscount?: DiscountInfo | null // Знижка для самовивозу
	deliveryCost: number | null // Додаємо вартість доставки
	deliveryMethod: 'DELIVERY' | 'TAKE_OUT' // Додаємо метод доставки
}

type CartAction =
	| { type: 'ADD_ITEM'; payload: CartItem }
	| { type: 'REMOVE_ITEM'; payload: string }
	| { type: 'INCREASE_QUANTITY'; payload: string }
	| { type: 'DECREASE_QUANTITY'; payload: string }
	| { type: 'CLEAR_CART' }
	| { type: 'SET_CART'; payload: CartState }
	| { type: 'SET_DELIVERY_DISCOUNT'; payload: DiscountInfo | null }
	| { type: 'SET_TAKEOUT_DISCOUNT'; payload: DiscountInfo | null }
	| { type: 'REMOVE_DELIVERY_DISCOUNT' }
	| { type: 'REMOVE_TAKEOUT_DISCOUNT' }
	| { type: 'SET_DELIVERY_COST'; payload: number | null }
	| { type: 'SET_DELIVERY_METHOD'; payload: 'DELIVERY' | 'TAKE_OUT' }


const initialState: CartState = {
	items: [],
	totalAmount: 0,
	finalAmount: 0,
	deliveryDiscount: null,
	takeOutDiscount: null,
	deliveryCost: null,
	deliveryMethod: 'TAKE_OUT',
}

const initCartState = (): CartState => {
	if (typeof window !== 'undefined') {
		const storedCart = localStorage.getItem('cart')
		if (storedCart) {
			try {
				const parsedCart = JSON.parse(storedCart)
				return {
					...parsedCart,
					finalAmount: calculateFinalAmount(parsedCart),
				}
			} catch (error) {
				console.error('Error parsing stored cart:', error)
				return initialState
			}
		}
	}
	return initialState
}

const calculateFinalAmount = (state: CartState): number => {
	let discount = 0
	const { deliveryDiscount, takeOutDiscount, totalAmount, deliveryCost, deliveryMethod } = state

	if (deliveryMethod === 'DELIVERY' && deliveryDiscount) {
		discount =
			deliveryDiscount.discountType === 'PERCENTAGE'
				? (totalAmount * deliveryDiscount.discountValue) / 100
				: deliveryDiscount.discountValue
	} else if (deliveryMethod === 'TAKE_OUT' && takeOutDiscount) {
		discount =
			takeOutDiscount.discountType === 'PERCENTAGE'
				? (totalAmount * takeOutDiscount.discountValue) / 100
				: takeOutDiscount.discountValue
	}

	let finalAmount = totalAmount - discount

	if (deliveryMethod === 'DELIVERY') {
		deliveryCost === null ? finalAmount : finalAmount += deliveryCost // Додаємо вартість доставки
	}

	return finalAmount > 0 ? finalAmount : 0
}




const cartReducer = (state: CartState, action: CartAction): CartState => {
	switch (action.type) {
		case 'ADD_ITEM': {
			const itemIndex = state.items.findIndex(item => item.id === action.payload.id)
			let updatedItems
			let updatedTotalAmount

			if (itemIndex >= 0) {
				updatedItems = [...state.items]
				updatedItems[itemIndex].quantity += action.payload.quantity
			} else {
				updatedItems = [...state.items, action.payload]
			}

			updatedTotalAmount = state.totalAmount + action.payload.price * action.payload.quantity

			const newState = {
				...state,
				items: updatedItems,
				totalAmount: updatedTotalAmount,
			}

			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'REMOVE_ITEM': {
			const itemToRemove = state.items.find(item => item.id === action.payload)
			if (!itemToRemove) return state

			const updatedItems = state.items.filter(item => item.id !== action.payload)
			const updatedTotalAmount = state.totalAmount - (itemToRemove.price * itemToRemove.quantity)

			const newState = {
				...state,
				items: updatedItems,
				totalAmount: updatedTotalAmount,
			}

			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'INCREASE_QUANTITY': {
			const updatedItems = state.items.map(item =>
				item.id === action.payload
					? { ...item, quantity: item.quantity + 1 }
					: item
			)
			const item = state.items.find(item => item.id === action.payload)
			if (!item) return state

			const updatedTotalAmount = state.totalAmount + item.price

			const newState = {
				...state,
				items: updatedItems,
				totalAmount: updatedTotalAmount,
			}

			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'DECREASE_QUANTITY': {
			const updatedItems = state.items.map(item =>
				item.id === action.payload && item.quantity > 1
					? { ...item, quantity: item.quantity - 1 }
					: item
			)
			const item = state.items.find(item => item.id === action.payload)
			if (!item) return state

			const updatedTotalAmount = state.totalAmount - item.price

			const newState = {
				...state,
				items: updatedItems,
				totalAmount: updatedTotalAmount,
			}

			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'CLEAR_CART': {
			const newState = {
				...state,
				items: [],
				totalAmount: 0,
				deliveryDiscount: null,
				takeOutDiscount: null,
			}

			return {
				...newState,
				finalAmount: 0,
			}
		}
		case 'SET_CART': {
			return {
				...action.payload,
				finalAmount: calculateFinalAmount(action.payload),
			}
		}
		case 'SET_DELIVERY_DISCOUNT': {
			const newState = {
				...state,
				deliveryDiscount: action.payload,
				takeOutDiscount: null, // Знімаємо знижку для самовивозу
			}
			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'SET_TAKEOUT_DISCOUNT': {
			const newState = {
				...state,
				takeOutDiscount: action.payload,
				deliveryDiscount: null, // Знімаємо знижку для доставки
			}
			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'REMOVE_DELIVERY_DISCOUNT': {
			const newState = {
				...state,
				deliveryDiscount: null,
			}
			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'REMOVE_TAKEOUT_DISCOUNT': {
			const newState = {
				...state,
				takeOutDiscount: null,
			}
			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'SET_DELIVERY_COST': {
			const newState = {
				...state,
				deliveryCost: action.payload,
			}
			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		case 'SET_DELIVERY_METHOD': {
			const newState = {
				...state,
				deliveryMethod: action.payload,
			}
			return {
				...newState,
				finalAmount: calculateFinalAmount(newState),
			}
		}
		default:
			return state
	}
}


const CartContext = createContext<{ state: CartState; dispatch: React.Dispatch<CartAction> } | undefined>(undefined)

const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Використовуємо initCartState для ініціалізації стану
	const [state, dispatch] = useReducer(cartReducer, initialState, initCartState)

	useEffect(() => {
		localStorage.setItem('cart', JSON.stringify(state))
	}, [state])

	return (
		<CartContext.Provider value={{ state, dispatch }}>
			{children}
		</CartContext.Provider>
	)
}

const useCart = () => {
	const context = useContext(CartContext)
	if (context === undefined) {
		throw new Error('useCart must be used within a CartProvider')
	}
	return context
}

export { CartProvider, useCart }
