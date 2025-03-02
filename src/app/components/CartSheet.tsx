'use client'

import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet'
import { useCart } from '@/app/context/CartContext'
import { MIN_ORDER_AMOUNT } from '@/config/constants'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { FaMinus, FaPlus } from 'react-icons/fa'
import { IoTrashOutline } from 'react-icons/io5'
import { MdKeyboardArrowRight } from 'react-icons/md'
import ImageWithFallback from './ImageWithFallback'
import RecommendDialog from './RecommendDialog'

const CartSheet = ({ onClose }: { onClose: () => void }) => {
  const { state, dispatch } = useCart()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRecommendDialogOpen, setIsRecommendDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const now = new Date()
  const isBreakfastOnly = now.getHours() >= 8 && now.getHours() < 12

  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const amountNeeded = Math.max(0, MIN_ORDER_AMOUNT - state.totalAmount)

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
    setIsLoading(true)

    startTransition(() => {
      router.push('/checkout')
    })
  }

  if (!isPending && isLoading) {
    setIsLoading(false)
    onClose()
  }

  // Підрахунок загальної кількості товарів у кошику
  const totalItemsInCart = state.items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return (
    <Sheet open={true} onOpenChange={onClose}>
      {' '}
      {/* Передайте функцію закриття */}
      <SheetContent
        side="right"
        className="w-full max-w-md bg-white shadow-xl overflow-y-auto"
      >
        <SheetHeader className="border-b border-gray-200 py-6">
          <div className="flex items-start">
            <SheetTitle className="text-xl font-medium text-text-secondary">
              Twój koszyk
            </SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-6">
          {state.items.length === 0 ? (
            <p className="text-center text-text-foreground">
              Twój koszyk jest pusty
            </p>
          ) : (
            <>
              <ul role="list" className="-my-6 divide-y divide-gray-200">
                {state.items.map((item) => (
                  <li key={item.id} className="flex py-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover object-center"
                        containerClassName="h-24 w-24"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-text-secondary">
                          <h3 className="text-secondary">
                            {item.name.toUpperCase()}
                          </h3>
                          <p className="ml-4">{item.price} zł</p>
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => decrementQuantity(item.id)}
                            disabled={item.quantity === 1}
                            className="h-6 w-6 p-2"
                          >
                            <FaMinus />
                          </Button>
                          <p className="text-gray-500">{item.quantity}</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => incrementQuantity(item.id)}
                            className="h-6 w-6 p-2"
                          >
                            <FaPlus />
                          </Button>
                        </div>
                        <Button
                          variant="link"
                          size="link"
                          onClick={() => removeItem(item.id)}
                          className="text-danger hover:text-danger-light flex items-center space-x-2"
                        >
                          <span>Usuń</span> <IoTrashOutline />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="border-b border w-full mt-8 -px-2"></p>
              <div className="mt-6 flex justify-between text-lg font-semibold text-text-secondary">
                <p>Łączna kwota</p>
                <p>{state.totalAmount} zł</p>
              </div>
              {state.totalAmount < MIN_ORDER_AMOUNT && (
                <div className="mt-4 p-2 bg-warning-light text-warning text-center rounded-md">
                  Brakuje jeszcze {amountNeeded.toFixed(2)} zł do minimalnej
                  kwoty zamówienia, która wynosi 50 zł.
                </div>
              )}
              <div className="mt-6">
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center"
                  onClick={handleRecommendDialogOpen}
                >
                  <span>Do podsumowania</span> <MdKeyboardArrowRight />
                </Button>
              </div>
              <div className="mt-6 flex justify-center text-sm text-gray-500">
                <Button
                  variant="link"
                  size="link"
                  onClick={handleClearCartClick}
                  className="font-medium text-danger hover:text-danger-light flex items-center space-x-2"
                >
                  <span>Wyczyść koszyk</span> <IoTrashOutline />
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
      {/* Модальне вікно для підтвердження очищення кошика */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Czy na pewno chcesz wyczyścić koszyk?</DialogTitle>
            <DialogDescription className="text-text-foreground">
              Ta operacja usunie wszystkie produkty z Twojego koszyka.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4">
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button variant="danger" onClick={clearCart}>
              Wyczyść
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Діалогове вікно з рекомендованими товарами */}
      <RecommendDialog
        isOpen={isRecommendDialogOpen}
        onOpenChange={setIsRecommendDialogOpen}
        onContinue={handleContinue}
        isLoading={isLoading}
        isBreakfastOnly={isBreakfastOnly}
        totalAmount={state.totalAmount}
        amountNeeded={amountNeeded}
      />
    </Sheet>
  )
}

export default CartSheet
