'use client'

import { MenuItemType } from '@/app/types'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from "@/components/ui/card"
import Image from 'next/image'
import React, { useState } from 'react'
import { CiShoppingBasket } from 'react-icons/ci'
import { Button } from './ui/button'

type MenuItemProps = Partial<MenuItemType> & {
	orientation?: 'vertical' | 'horizontal'
}

const MenuItem: React.FC<MenuItemProps> = ({ name, price, description, image, orientation = 'vertical' }) => {
	const [imageError, setImageError] = useState(false)
	const isVertical = orientation === 'vertical'

	return (
		<Card className={`w-full max-w-full border-0 shadow-none flex ${isVertical ? 'flex-col' : 'flex-row items-center'} justify-between`}>
			<CardHeader className={`p-0 ${isVertical ? 'w-full h-48' : 'w-24 h-24'}`}>
				<div className='relative w-full h-full'>
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
			<CardContent className={`p-2 border-0 flex-1`}>
				<h4 className={`uppercase text-secondary py-2 font-bold ${isVertical ? 'text-lg' : 'text-sm'}`}>{name}</h4>
				<span className={`text-sm text-text-foreground italic ${isVertical ? 'text-sm' : 'text-xs'}`}>{description}</span>
			</CardContent>
			<CardFooter className={`px-2 pb-2 mt-auto flex flex-col h-full justify-evenly ${!isVertical && 'my-auto pb-0'}`}>
				<span className='text-secondary'>{price} zł</span>
				<Button variant='secondary' className='h-6'><CiShoppingBasket /></Button>
			</CardFooter>
		</Card>
	)
}

export default MenuItem
