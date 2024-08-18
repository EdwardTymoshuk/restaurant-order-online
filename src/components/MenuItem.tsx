'use client'

import { MenuItemType } from '@/app/types'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from "@/components/ui/card"
import { useCart } from '@/context/CartContext'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import React, { useState } from 'react'
import { CiShoppingBasket } from 'react-icons/ci'
import { FaCheck } from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'
import { Button } from './ui/button'

type MenuItemProps = Partial<MenuItemType> & {
	name: string,
	price: number,
	description?: string,
	image?: string,
	orientation?: 'vertical' | 'horizontal',
	className?: string, // Додаємо пропс для прийому додаткових класів
}

const MenuItem: React.FC<MenuItemProps> = ({ name, price, description, image, orientation = 'vertical', className }) => {
	const [imageError, setImageError] = useState(false)
	const [addedToCart, setAddedToCart] = useState(false)
	const isVertical = orientation === 'vertical'

	const { dispatch } = useCart()

	const addToCart = () => {
		if (name && price) {
			dispatch({
				type: 'ADD_ITEM',
				payload: {
					id: uuidv4(),
					name,
					price,
					quantity: 1
				},
			})

			setAddedToCart(true)
			setTimeout(() => setAddedToCart(false), 1000)
		} else {
			console.error('Item name or price is missing.')
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
							layout='fill'
							objectFit='cover'
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
				<Button
					variant='secondary'
					className={cn('h-6 transition-colors duration-300', {
						'text-success scale-105': addedToCart,
					})}
					onClick={addToCart}
				>
					{addedToCart ? <FaCheck /> : <CiShoppingBasket />}
				</Button>
			</CardFooter>
		</Card>
	)
}

export default MenuItem
