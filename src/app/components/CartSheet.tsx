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
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
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

  const totalItemsInCart = state.items.reduce((total, item) => total + item.quantity, 0)
  const canContinue = state.items.length > 0

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col overflow-hidden bg-white p-0 shadow-2xl">
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <div className="flex items-center justify-between gap-4">
            <div>
              <SheetTitle className="font-serif text-2xl text-slate-950">Koszyk</SheetTitle>
              <p className="mt-1 text-sm text-slate-500">{totalItemsInCart} pozycji w zamówieniu</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingBag size={20} />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {state.items.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-5 text-center">
              <ShoppingBag className="mb-3 text-slate-300" size={42} strokeWidth={1.5} />
              <p className="text-base font-semibold text-slate-900">Koszyk jest pusty</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Dodaj dania z menu, a pokażą się tutaj.</p>
            </div>
          ) : (
            <ul role="list" className="space-y-3">
              {state.items.map((item) => (
                <li key={item.id} className="rounded-2xl border border-border bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                        containerClassName="h-20 w-20"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.category}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-secondary">{item.price * item.quantity} zł</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-border bg-muted/40 p-1">
                          <button
                            type="button"
                            onClick={() => decrementQuantity(item.id)}
                            disabled={item.quantity === 1}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Zmniejsz ilość"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="flex min-w-8 justify-center text-xs font-semibold text-slate-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => incrementQuantity(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-white shadow-sm transition hover:bg-secondary/90"
                            aria-label="Zwiększ ilość"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-danger"
                          aria-label="Usuń pozycję"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {state.items.length > 0 && (
          <div className="border-t border-border bg-white px-5 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]">
            {state.totalAmount < MIN_ORDER_AMOUNT && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                Brakuje jeszcze {amountNeeded.toFixed(2)} zł do minimalnej kwoty zamówienia {MIN_ORDER_AMOUNT} zł.
              </div>
            )}

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Suma produktów</span>
                <span>{state.totalAmount} zł</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-slate-950">
                <span>Razem</span>
                <span>{state.totalAmount} zł</span>
              </div>
            </div>

            <Button
              className="h-12 w-full rounded-xl bg-primary text-secondary hover:bg-primary/90"
              onClick={() => setIsRecommendDialogOpen(true)}
              disabled={!canContinue}
            >
              Przejdź do podsumowania
            </Button>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 transition hover:text-danger"
            >
              <Trash2 size={13} /> Wyczyść koszyk
            </button>
          </div>
        )}
      </SheetContent>

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
