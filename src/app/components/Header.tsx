// Header.tsx
'use client'

import CartSheet from '@/app/components/CartSheet'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BsCart4 } from 'react-icons/bs'
import { useCart } from '../context/CartContext'
import { Button } from './ui/button'

const Header = () => {
	const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
	const { state } = useCart()
	const currentPath = usePathname()

	const totalItemsInCart = state.items.reduce((total, item) => total + item.quantity, 0)

	const handleCartSheetClose = () => {
		setIsCartSheetOpen(false)
	}

	const handleCartSheetOpen = () => {
		setIsCartSheetOpen(true)
	}

	return (
		<header className='bg-background p-4 shadow-sm shadow-primary min-h-20 h-auto fixed w-full z-10'>
			<div className={cn('mx-auto flex justify-between items-center', {
				'justify-center': currentPath.includes('/checkout')
			})}>
				<Link href='/'>
					<img
						src='/img/page-main-logo.png'
						alt='Spoko Restaurant Logo'
						className='max-h-12'
					/>
				</Link>
				{!currentPath.includes('/checkout') && (
					<Button onClick={handleCartSheetOpen} variant="ghost" className="flex items-center space-x-2 hover:bg-transparent p-0 m-0 ring-0">
						<div className="relative scale-75 group">
							<BsCart4 className="h-8 w-8 text-text-secondary group-hover:text-secondary" />
							{totalItemsInCart > 0 && (
								<span className="absolute -top-2 left-4 rounded-full bg-secondary group-hover:brightness-125 p-0.5 px-2 text-sm text-text-primary transition-all">
									{totalItemsInCart}
								</span>
							)}
						</div>
					</Button>
				)}
				{isCartSheetOpen && <CartSheet onClose={handleCartSheetClose} />}
			</div>
		</header>
	)
}

export default Header
