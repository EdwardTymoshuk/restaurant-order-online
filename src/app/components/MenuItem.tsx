'use client'

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from "@/app/components/ui/card"
import { useCart } from '@/app/context/CartContext'
import { MenuItemCategory, MenuItemType } from '@/app/types/types'
import { cn } from '@/utils/utils'
import React, { useState } from 'react'
import { CiShoppingBasket } from 'react-icons/ci'
import { FaCheck, FaMinus, FaPlus } from 'react-icons/fa'
import { toast } from 'sonner'
import ImageWithFallback from './ImageWithFallback'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

type MenuItemProps = Partial<MenuItemType> & {
	id: string,
	name: string,
	price: number,
	category: MenuItemCategory,
	description?: string,
	image: string,
	orientation?: 'vertical' | 'horizontal',
	className?: string,
	isOrderingActive: boolean | undefined,
	isPizzaAvailable: boolean | undefined,
}

const MenuItem: React.FC<MenuItemProps> = ({ id, name, price, description, image, orientation = 'vertical', className, category, isOrderingActive, isPizzaAvailable }) => {
	const [addedToCart, setAddedToCart] = useState(false)
	const [isImageLoaded, setIsImageLoaded] = useState(false)
	const isVertical = orientation === 'vertical'

	const { state, dispatch } = useCart()

	// Check if the item already exists in the cart and get its quantity
	const existingItem = state.items.find(item => item.id === id)
	const itemQuantity = existingItem ? existingItem.quantity : 0

	const isDisabled =
		!isOrderingActive ||
		(category === 'Pizza' && !isPizzaAvailable)

	// Function to check conflict between breakfast and other items
	const checkCategoryConflict = () => {
		const hasBreakfast = state.items.some(cartItem => cartItem.category === 'Śniadania')
		const hasRegular = state.items.some(cartItem => cartItem.category !== 'Śniadania' && cartItem.category !== 'Napoje bezalkoholowe')
	
		if ((hasBreakfast && category !== 'Śniadania' && category !== 'Napoje bezalkoholowe') || 
			(hasRegular && category === 'Śniadania')) {
			toast.warning('Nie można łączyć śniadań z innymi posiłkami w jednym zamówieniu.')
			return false
		}
		return true
	}
	

	const addToCart = () => {
		if (name && price) {
			if (!checkCategoryConflict()) return // Block adding if there's a conflict

			dispatch({
				type: 'ADD_ITEM',
				payload: {
					id,
					name,
					category,
					price,
					quantity: 1,
					image
				},
			})

			setAddedToCart(true)
			setTimeout(() => setAddedToCart(false), 500)
		} else {
			console.error('Item name or price is missing.')
		}
	}

	// Functions to manage quantity
	const incrementQuantity = () => {
		if (checkCategoryConflict()) {
			dispatch({ type: 'INCREASE_QUANTITY', payload: id })
		}
	}

	const decrementQuantity = () => {
		if (itemQuantity > 1) {
			dispatch({ type: 'DECREASE_QUANTITY', payload: id })
		} else {
			dispatch({ type: 'REMOVE_ITEM', payload: id })
		}
	}

	const showSkeleton = image && !isImageLoaded

	return (
		<Card className={cn('w-full max-w-full border-0 shadow-none flex justify-between p-2', {
			'flex-col': isVertical,
			'flex-row items-center': !isVertical,
		}, className)}>
			<CardHeader className={cn('p-0', {
				'w-full h-48': isVertical,
				'w-24 h-24': !isVertical,
			})}>
				<div className='relative w-48 h-48'>
					{showSkeleton && (
						<Skeleton
							className={cn('absolute inset-0 rounded-md', {
								'w-full h-48': isVertical,
								'w-24 h-24': !isVertical,
							})}
						/>
					)}
					<ImageWithFallback
						src={image}
						alt={name ?? 'Menu item image'}
						width={isVertical ? 192 : 96}
						height={isVertical ? 192 : 96}
						style={{ objectFit: 'cover' }}
						className='rounded-md'
						containerClassName={cn('p-0', {
							'w-full h-48': isVertical,
							'w-24 h-24': !isVertical,
						})}
						onLoad={() => setIsImageLoaded(true)}
					/>
				</div>
			</CardHeader>
			<CardContent className='p-2 border-0 flex-1'>
				<h4 className={cn('uppercase text-secondary py-2 font-bold', {
					'text-lg': isVertical,
					'text-sm': !isVertical,
				})}>{name}</h4>
				<span className={cn('text-sm text-text-foreground italic', {
					'text-sm': isVertical,
					'text-xs': !isVertical,
				})}>{description}</span>
			</CardContent>
			<CardFooter className={cn('px-2 pb-2 mt-auto flex flex-col h-full justify-evenly', {
				'my-auto pb-0': !isVertical,
			})}>
				<span className='text-secondary'>{price} zł</span>

				{/* Якщо товар у кошику, показати кількість */}
				{itemQuantity > 0 && !addedToCart ? (
					<div className='flex items-center space-x-2'>
						<Button
							variant='secondary'
							className={cn('h-6 w-6 flex items-center justify-center px-2', {
								'opacity-50 cursor-not-allowed': itemQuantity <= 1 || isDisabled,
							})}
							onClick={decrementQuantity}
							disabled={isDisabled}
						>
							<FaMinus />
						</Button>
						<span className="text-sm">{itemQuantity}</span>
						<Button
							variant='secondary'
							className={cn('h-6 w-6 flex items-center justify-center px-2', {
								'opacity-50 cursor-not-allowed': isDisabled,
							})}
							onClick={incrementQuantity}
							disabled={isDisabled}
						>
							<FaPlus />
						</Button>
					</div>
				) : (
					<Button
						variant='secondary'
						className={cn('h-6 transition-colors duration-300', {
							'opacity-50 cursor-not-allowed': isDisabled,
							'text-success scale-105': addedToCart,
						})}
						onClick={addToCart}
						disabled={isDisabled}
					>
						{addedToCart ? <FaCheck /> : <CiShoppingBasket />}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}

export default MenuItem
