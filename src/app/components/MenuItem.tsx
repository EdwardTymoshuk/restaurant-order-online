'use client'

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from "@/app/components/ui/card"
import { useCart } from '@/app/context/CartContext'
import { MenuItemType } from '@/app/types/types'
import { cn } from '@/utils/utils'
import React, { useState } from 'react'
import { CiShoppingBasket } from 'react-icons/ci'
import { FaCheck, FaMinus, FaPlus } from 'react-icons/fa'
import ImageWithFallback from './ImageWithFallback'
import { Button } from './ui/button'

type MenuItemProps = Partial<MenuItemType> & {
	id: string,
	name: string,
	price: number,
	description?: string,
	image: string,
	orientation?: 'vertical' | 'horizontal',
	className?: string,
	isBreakfastOnly?: boolean,
	isOrderingActive: boolean | undefined,
}

const MenuItem: React.FC<MenuItemProps> = ({ id, name, price, description, image, orientation = 'vertical', className, isBreakfastOnly, category, isOrderingActive }) => {
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
		<Card className={cn('w-full max-w-full border-0 shadow-none flex justify-between p-2', {
			'flex-col': isVertical,
			'flex-row items-center': !isVertical,
		}, className)}>
			<CardHeader className={cn('p-0', {
				'w-full h-48': isVertical,
				'w-24 h-24': !isVertical,
			})}>
				<div className='relative w-48 h-48'>
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
							disabled={itemQuantity <= 1 || !isBreakfastOnly && category === 'Śniadania'}
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
							disabled={!isBreakfastOnly && category === 'Śniadania'}
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
						disabled={!isBreakfastOnly && category === 'Śniadania' || !isOrderingActive}
					>
						{addedToCart ? <FaCheck /> : <CiShoppingBasket />}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}

export default MenuItem
