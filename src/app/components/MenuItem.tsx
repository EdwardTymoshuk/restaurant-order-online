'use client'

import { useCart } from '@/app/context/CartContext'
import { MenuItemCategory, MenuItemType } from '@/app/types/types'
import { cn } from '@/utils/utils'
import { Check, Minus, Plus, ShoppingBasket } from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'
import { toast } from 'sonner'
import ImageWithFallback from './ImageWithFallback'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

type MenuItemProps = Partial<MenuItemType> & {
  id: string
  name: string
  price: number
  category: MenuItemCategory
  description?: string
  image: string
  orientation?: 'vertical' | 'horizontal'
  className?: string
  isOrderingActive: boolean | undefined
  isPizzaAvailable: boolean | undefined
}

const MenuItem: React.FC<MenuItemProps> = ({
  id,
  name,
  price,
  description,
  image,
  orientation = 'horizontal',
  className,
  category,
  isOrderingActive,
  isPizzaAvailable,
}) => {
  const [addedToCart, setAddedToCart] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const { state, dispatch } = useCart()
  const isVertical = orientation === 'vertical'
  const canExpandDescription = Boolean(description && description.length > 90)

  const existingItem = state.items.find((item) => item.id === id)
  const itemQuantity = existingItem ? existingItem.quantity : 0
  const isDisabled = !isOrderingActive || (category === 'Pizza' && !isPizzaAvailable)

  const checkCategoryConflict = () => {
    const hasBreakfast = state.items.some((cartItem) => cartItem.category === 'Śniadania')
    const hasRegular = state.items.some((cartItem) => cartItem.category !== 'Śniadania' && cartItem.category !== 'Napoje bezalkoholowe')

    if ((hasBreakfast && category !== 'Śniadania' && category !== 'Napoje bezalkoholowe') || (hasRegular && category === 'Śniadania')) {
      toast.warning('Nie można łączyć śniadań z innymi posiłkami w jednym zamówieniu.')
      return false
    }
    return true
  }

  const addToCart = () => {
    if (!name || !price) return
    if (!checkCategoryConflict()) return

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id,
        name,
        category,
        price,
        quantity: 1,
        image,
      },
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 650)
  }

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

  return (
    <article
      className={cn(
        'group flex w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-colors hover:border-secondary/20',
        isVertical ? 'flex-col' : 'min-h-[156px] flex-row',
        isDisabled && 'opacity-70',
        className
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-muted',
          isVertical ? 'aspect-[4/3] w-full' : 'h-auto w-32 sm:w-40'
        )}
      >
        {image ? (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="h-full w-full cursor-zoom-in overflow-hidden text-left"
                aria-label={`Pokaż większe zdjęcie: ${name}`}
              >
                <ImageWithFallback
                  src={image}
                  alt={name}
                  width={isVertical ? 520 : 180}
                  height={isVertical ? 390 : 180}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  containerClassName="h-full w-full"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
              <div className="relative aspect-[4/3] w-full bg-muted sm:aspect-[16/10]">
                <Image
                  src={image}
                  alt={name}
                  fill
                  sizes="(min-width: 768px) 720px, calc(100vw - 2rem)"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="space-y-2 p-5 sm:p-6">
                <DialogTitle className="font-sans text-xl">{name}</DialogTitle>
                <DialogDescription>
                  {category} · {price} zł
                </DialogDescription>
                {description && <p className="text-sm leading-6 text-slate-600">{description}</p>}
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <ImageWithFallback
            src={image}
            alt={name}
            width={isVertical ? 520 : 180}
            height={isVertical ? 390 : 180}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            containerClassName="h-full w-full"
          />
        )}
        {isDisabled && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
            Niedostępne
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {category}
              </p>
              <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950">
                {name}
              </h3>
            </div>
            <p className="shrink-0 text-base font-semibold text-secondary">{price} zł</p>
          </div>

          {description && (
            <div>
              <p
                title={description}
                className={cn(
                  'text-sm leading-6 text-slate-500',
                  !isDescriptionExpanded && 'line-clamp-3'
                )}
              >
                {description}
              </p>
              {canExpandDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((current) => !current)}
                  className="mt-1 text-xs font-semibold text-secondary transition hover:text-secondary/80"
                >
                  {isDescriptionExpanded ? 'Zwiń opis' : 'Czytaj więcej'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {itemQuantity > 0 && !addedToCart ? (
            <div className="ml-auto flex items-center rounded-full border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={decrementQuantity}
                disabled={isDisabled}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Zmniejsz ilość"
              >
                <Minus size={14} />
              </button>
              <span className="flex min-w-9 justify-center text-sm font-semibold text-slate-900">{itemQuantity}</span>
              <button
                type="button"
                onClick={incrementQuantity}
                disabled={isDisabled}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-white shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Zwiększ ilość"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={addToCart}
              disabled={isDisabled}
              className={cn(
                'ml-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold',
                addedToCart ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'bg-secondary text-white hover:bg-secondary/90'
              )}
            >
              {addedToCart ? (
                <>
                  <Check size={15} /> Dodano
                </>
              ) : (
                <>
                  <ShoppingBasket size={15} /> Dodaj
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

export default MenuItem
