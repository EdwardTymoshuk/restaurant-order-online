'use client'

import CartSheet from '@/app/components/CartSheet'
import { cn } from '@/utils/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import OrderTrackingDialog from './OrderTrackingDialog'
import { Button } from './ui/button'

const Header = () => {
	const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
	const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false)
	const { state } = useCart()
	const currentPath = usePathname()
	const isHomePage = currentPath === '/'

	const totalItemsInCart = state.items.reduce((total, item) => total + item.quantity, 0)

	const handleCartSheetClose = () => {
		setIsCartSheetOpen(false)
	}

	const handleCartSheetOpen = () => {
		setIsCartSheetOpen(true)
	}

	const handleOrderTrackingOpen = () => {
		setIsOrderTrackingOpen(true)
	}

	return (
		<header className={cn(
			'fixed left-0 right-0 top-0 z-30 px-4',
			isHomePage ? 'h-16 pt-3' : 'h-12',
			isHomePage ? 'bg-transparent shadow-none' : 'bg-secondary shadow-sm'
		)}>
			<div className={cn('mx-auto flex h-full items-center justify-between')}>
				<Link href='/'>
					<Image
						src="/img/logo-admin.svg"
						alt='Spoko Restaurant Logo'
						width={isHomePage ? 118 : 92}
						height={isHomePage ? 44 : 36}
						priority
						className="object-contain"
					/>
				</Link>

				<div className="flex items-center gap-2">

					{!currentPath.includes('/checkout') && !currentPath.includes('/thank-you') && (
						<Button onClick={handleOrderTrackingOpen} className="h-9 gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-secondary hover:bg-primary/90 md:px-4">
							<Search size={16} />
							<span className="hidden sm:inline">Śledź zamówienie</span>
						</Button>
					)}
					{currentPath.includes('/order') && (

						<Button onClick={handleCartSheetOpen} variant="ghost" className="h-9 w-9 rounded-lg p-0 text-white hover:bg-white/10 hover:text-white">
							<div className="relative">
								<ShoppingBag size={20} />
								{totalItemsInCart > 0 && (
									<span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-secondary transition-all">
										{totalItemsInCart > 9 ? '9+' : totalItemsInCart}
									</span>
								)}
							</div>
						</Button>
					)}
				</div>

				<OrderTrackingDialog
					isOpen={isOrderTrackingOpen}
					onOpenChange={setIsOrderTrackingOpen}
				/>

				{isCartSheetOpen && <CartSheet onClose={handleCartSheetClose} />}
			</div>
		</header>
	)
}

export default Header
