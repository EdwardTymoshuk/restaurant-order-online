'use client'

import React, { createContext, useContext, useEffect, useReducer } from 'react'

interface CartItem {
	id: string
	name: string
	price: number
	quantity: number
	image: string
}

interface CartState {
	items: CartItem[]
	totalAmount: number
}

type CartAction =
	| { type: 'ADD_ITEM'; payload: CartItem }
	| { type: 'REMOVE_ITEM'; payload: string }
	| { type: 'INCREASE_QUANTITY'; payload: string }
	| { type: 'DECREASE_QUANTITY'; payload: string }
	| { type: 'CLEAR_CART' }
	| { type: 'SET_CART'; payload: CartState }

const initialState: CartState = {
	items: [],
	totalAmount: 0,
}

const initCartState = (): CartState => {
	// Перевірка, чи ми на клієнтській стороні
	if (typeof window !== 'undefined') {
		const storedCart = localStorage.getItem('cart')
		if (storedCart) {
			try {
				const parsedCart = JSON.parse(storedCart)
				console.log('Initializing cart from storage...', parsedCart)
				return parsedCart
			} catch (error) {
				console.error('Error parsing stored cart:', error)
				return initialState
			}
		}
	}
	// Якщо ми на сервері або немає збережених даних у localStorage
	return initialState
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
	switch (action.type) {
		case 'ADD_ITEM': {
			const itemIndex = state.items.findIndex(item => item.id === action.payload.id)
			if (itemIndex >= 0) {
				const updatedItems = [...state.items]
				updatedItems[itemIndex].quantity += action.payload.quantity
				return {
					...state,
					items: updatedItems,
					totalAmount: state.totalAmount + action.payload.price * action.payload.quantity,
				}
			} else {
				return {
					...state,
					items: [...state.items, action.payload],
					totalAmount: state.totalAmount + action.payload.price * action.payload.quantity,
				}
			}
		}
		case 'REMOVE_ITEM': {
			const itemToRemove = state.items.find(item => item.id === action.payload)
			if (!itemToRemove) return state
			return {
				...state,
				items: state.items.filter(item => item.id !== action.payload),
				totalAmount: state.totalAmount - (itemToRemove.price * itemToRemove.quantity),
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
			return {
				...state,
				items: updatedItems,
				totalAmount: state.totalAmount + item.price,
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
			return {
				...state,
				items: updatedItems,
				totalAmount: state.totalAmount - item.price,
			}
		}
		case 'CLEAR_CART': {
			return {
				items: [],
				totalAmount: 0,
			}
		}
		case 'SET_CART': {
			return action.payload
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
		console.log('Saving cart state to storage:', state)
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
