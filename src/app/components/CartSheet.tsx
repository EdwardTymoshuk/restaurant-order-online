'use client'

import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet'
import { useCart } from '@/app/context/CartContext'
import { useState } from 'react'
import { BsCart4 } from "react-icons/bs"
import { IoTrashOutline } from "react-icons/io5"
import { MdKeyboardArrowRight } from "react-icons/md"
import RecommendDialog from './RecommendDialog'

const CartSheet = () => {
	const { state, dispatch } = useCart()
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isRecommendDialogOpen, setIsRecommendDialogOpen] = useState(false)

	const incrementQuantity = (id: string) => {
		dispatch({ type: 'INCREASE_QUANTITY', payload: id })
	}

	const decrementQuantity = (id: string) => {
		dispatch({ type: 'DECREASE_QUANTITY', payload: id })
	}

	const removeItem = (id: string) => {
		dispatch({ type: 'REMOVE_ITEM', payload: id })
	}

	const clearCart = () => {
		dispatch({ type: 'CLEAR_CART' })
		setIsDialogOpen(false)
	}

	const handleClearCartClick = () => {
		setIsDialogOpen(true)
	}

	const handleRecommendDialogOpen = () => {
		setIsRecommendDialogOpen(true)
	}

	const handleContinue = () => {
		setIsRecommendDialogOpen(false)
	}

	// Підрахунок загальної кількості товарів у кошику
	const totalItemsInCart = state.items.reduce((total, item) => total + item.quantity, 0)

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="ghost" className="flex items-center space-x-2 hover:bg-transparent p-0 m-0 ring-0">
					<div className="relative scale-75 group">
						<BsCart4 className="h-8 w-8 text-text-secondary group-hover:text-secondary" />
						{totalItemsInCart > 0 && (
							<span className="absolute -top-2 left-4 rounded-full bg-secondary group-hover:brightness-125 p-0.5 px-2 text-sm text-text-primary transition-all">
								{totalItemsInCart}
							</span>
						)}
					</div>
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-full max-w-md bg-white shadow-xl overflow-y-auto">
				<SheetHeader className="border-b border-gray-200 py-6">
					<div className="flex items-start">
						<SheetTitle className="text-xl font-medium text-text-secondary">Twój koszyk</SheetTitle>
					</div>
				</SheetHeader>
				<div className="flex-1 overflow-y-auto py-6">
					{state.items.length === 0 ? (
						<p className="text-center text-text-foreground">Twój koszyk jest pusty</p>
					) : (
						<>
							<ul role="list" className="-my-6 divide-y divide-gray-200">
								{state.items.map((item) => (
									<li key={item.id} className="flex py-6">
										<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
											{item.image ? (
												<img
													src={item.image}
													alt={item.name}
													className="h-full w-full object-cover object-center"
												/>
											) : (
												<div className="h-full w-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
													No image
												</div>
											)}
										</div>

										<div className="ml-4 flex flex-1 flex-col">
											<div>
												<div className="flex justify-between text-base font-medium text-text-secondary">
													<h3 className='text-secondary'>{item.name.toUpperCase()}</h3>
													<p className="ml-4">{item.price} zł</p>
												</div>
											</div>
											<div className="flex flex-1 items-end justify-between text-sm">
												<div className="flex items-center space-x-2">
													<Button
														variant='outline'
														size='sm'
														onClick={() => decrementQuantity(item.id)}
														disabled={item.quantity === 1}
													>
														-
													</Button>
													<p className="text-gray-500">{item.quantity}</p>
													<Button
														variant='outline'
														size='sm'
														onClick={() => incrementQuantity(item.id)}
													>
														+
													</Button>
												</div>
												<Button
													variant='link'
													size='link'
													onClick={() => removeItem(item.id)}
													className="text-danger hover:text-danger-light"
												>
													Usuń
												</Button>
											</div>
										</div>
									</li>
								))}
							</ul>
							<p className='border-b border w-full mt-8 -px-2'></p>
							<div className="mt-6 flex justify-between text-lg font-semibold text-text-secondary">
								<p>Total</p>
								<p>{state.totalAmount} zł</p>
							</div>
							<div className="mt-6">
								<Button variant='secondary' className='w-full' onClick={handleRecommendDialogOpen}>
									Do podsumowania <MdKeyboardArrowRight />
								</Button>
							</div>
							<div className="mt-6 flex justify-center text-sm text-gray-500">
								<Button
									variant='link'
									size='link'
									onClick={handleClearCartClick}
									className="font-medium text-danger hover:text-danger-light"
								>
									Wyczyść koszyk
									<IoTrashOutline />
								</Button>
							</div>
						</>
					)}
				</div>
			</SheetContent>

			{/* Модальне вікно для підтвердження очищення кошика */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger asChild>
					<div className="hidden"></div>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Czy na pewno chcesz wyczyścić koszyk?</DialogTitle>
						<DialogDescription className='text-text-foreground'>Ta operacja usunie wszystkie produkty z Twojego koszyka.</DialogDescription>
					</DialogHeader>
					<div className="flex justify-end space-x-4">
						<Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
						<Button variant="destructive" onClick={clearCart}>Wyczyść</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Діалогове вікно з рекомендованими товарами */}
			<RecommendDialog
				isOpen={isRecommendDialogOpen}
				onOpenChange={setIsRecommendDialogOpen}
				onContinue={handleContinue}
			/>
		</Sheet>
	)
}

export default CartSheet
