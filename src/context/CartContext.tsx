'use client'

import React, { createContext, useContext, useReducer } from 'react'

// Типи для товарів у кошику
interface CartItem {
	id: string
	name: string
	price: number
	quantity: number
	image?: string
}

// Стейт для корзини
interface CartState {
	items: CartItem[]
	totalAmount: number
}

// Дії для кошика
type CartAction =
	| { type: 'ADD_ITEM'; payload: CartItem }
	| { type: 'REMOVE_ITEM'; payload: string }
	| { type: 'INCREASE_QUANTITY'; payload: string }
	| { type: 'DECREASE_QUANTITY'; payload: string }
	| { type: 'CLEAR_CART' }

// Початковий стан кошика
const initialState: CartState = {
	items: [],
	totalAmount: 0,
}

// Функція для оновлення стейту кошика
function cartReducer(state: CartState, action: CartAction): CartState {
	switch (action.type) {
		case 'ADD_ITEM': {
			const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id)

			if (existingItemIndex >= 0) {
				const updatedItems = [...state.items]
				const existingItem = updatedItems[existingItemIndex]
				updatedItems[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + action.payload.quantity }
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
			const updatedItems = state.items.filter(item => item.id !== action.payload)
			const itemToRemove = state.items.find(item => item.id === action.payload)
			return {
				...state,
				items: updatedItems,
				totalAmount: itemToRemove ? state.totalAmount - itemToRemove.price * itemToRemove.quantity : state.totalAmount,
			}
		}
		case 'INCREASE_QUANTITY': {
			const updatedItems = state.items.map(item =>
				item.id === action.payload ? { ...item, quantity: item.quantity + 1 } : item
			)
			const item = state.items.find(item => item.id === action.payload)
			return {
				...state,
				items: updatedItems,
				totalAmount: item ? state.totalAmount + item.price : state.totalAmount,
			}
		}
		case 'DECREASE_QUANTITY': {
			const updatedItems = state.items.map(item =>
				item.id === action.payload && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
			)
			const item = state.items.find(item => item.id === action.payload)
			return {
				...state,
				items: updatedItems,
				totalAmount: item ? state.totalAmount - item.price : state.totalAmount,
			}
		}
		case 'CLEAR_CART': {
			return initialState
		}
		default:
			return state
	}
}

const CartContext = createContext<{ state: CartState; dispatch: React.Dispatch<CartAction> }>({
	state: initialState,
	dispatch: () => undefined,
})

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(cartReducer, initialState)

	return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
