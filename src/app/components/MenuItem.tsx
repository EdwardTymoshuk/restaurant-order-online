'use client'

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from "@/app/components/ui/card"
import { useCart } from '@/app/context/CartContext'
import { MenuItemType } from '@/app/types'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import React, { useState } from 'react'
import { CiShoppingBasket } from 'react-icons/ci'
import { FaCheck, FaMinus, FaPlus } from 'react-icons/fa'
import { Button } from './ui/button'

type MenuItemProps = Partial<MenuItemType> & {
	id: string,
	name: string,
	price: number,
	description?: string,
	image: string,
	orientation?: 'vertical' | 'horizontal',
	className?: string,
}

const MenuItem: React.FC<MenuItemProps> = ({ id, name, price, description, image, orientation = 'vertical', className }) => {
	const [imageError, setImageError] = useState(false)
	const [addedToCart, setAddedToCart] = useState(false) // Для анімації чеку
	const isVertical = orientation === 'vertical'

	const { state, dispatch } = useCart()

	// Перевіряємо, чи продукт вже є в кошику, і якщо є - отримуємо його кількість
	const existingItem = state.items.find(item => item.id === id)
	const itemQuantity = existingItem ? existingItem.quantity : 0

	const addToCart = () => {
		if (name && price) {
			dispatch({
				type: 'ADD_ITEM',
				payload: {
					id,
					name,
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

	// Функції для зміни кількості товару
	const incrementQuantity = () => {
		dispatch({ type: 'INCREASE_QUANTITY', payload: id })
	}

	const decrementQuantity = () => {
		if (itemQuantity > 1) {
			dispatch({ type: 'DECREASE_QUANTITY', payload: id })
		} else {
			dispatch({ type: 'REMOVE_ITEM', payload: id })
		}
	}

	return (
		<Card className={cn('w-full max-w-full border-0 shadow-none flex justify-between', {
			'flex-col': isVertical,
			'flex-row items-center': !isVertical,
		}, className)}>
			<CardHeader className={cn('p-0', {
				'w-full h-48': isVertical,
				'w-24 h-24': !isVertical,
			})}>
				<div className='relative w-full h-full p-2'>
					{image && !imageError ? (
						<Image
							src={image}
							alt={name ?? 'Menu item image'}
							fill
							style={{ objectFit: 'cover' }}
							className='rounded-md'
							onError={() => setImageError(true)}
						/>
					) : (
						<div className='w-full h-full bg-gray-200 rounded-md flex items-center justify-center italic text-text-foreground text-center'>
							No image
						</div>
					)}
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

				{/* Якщо товар доданий до кошика, відображаємо кількість */}
				{itemQuantity > 0 && !addedToCart ? (
					<div className='flex items-center space-x-2'>
						{/* Кнопка для зменшення кількості */}
						<Button
							variant='secondary'
							className={cn('h-6 w-6 flex items-center justify-center px-2', {
								'opacity-50 cursor-not-allowed': itemQuantity <= 1
							})}
							onClick={decrementQuantity}
							disabled={itemQuantity <= 1}
						>
							<FaMinus />
						</Button>
						{/* Виводимо кількість товару */}
						<span className="text-sm">{itemQuantity}</span>
						{/* Кнопка для збільшення кількості */}
						<Button
							variant='secondary'
							className='h-6 w-6 flex items-center justify-center px-2'
							onClick={incrementQuantity}
						>
							<FaPlus />
						</Button>
					</div>
				) : (
					<Button
						variant='secondary'
						className={cn('h-6 transition-colors duration-300', {
							'text-success scale-105': addedToCart, // Додаємо анімацію
						})}
						onClick={addToCart}
					>
						{addedToCart ? <FaCheck /> : <CiShoppingBasket />}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}

export default MenuItem
