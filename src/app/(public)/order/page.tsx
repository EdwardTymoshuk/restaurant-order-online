'use client'

import MenuItem from '@/app/components/MenuItem'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/app/components/ui/carousel'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import { useCart } from '@/app/context/CartContext'
import { MenuItemCategory, MenuItemType } from '@/app/types/types'
import { CLOSING_HOUR, OPENING_HOUR } from '@/config/constants'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import Autoplay from 'embla-carousel-autoplay'
import { Clock, Search, ShoppingBag, Sparkles, Store } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

const categoryOrder: Record<string, number> = {
  'Oferta Walentynkowa': 0,
  'Oferta Specjalna': 1,
  'Śniadania': 2,
  'Pizza': 3,
}

const sortItems = (items: MenuItemType[], sortOption: string | undefined) => {
  const next = [...items]
  switch (sortOption) {
    case 'Nazwa rosnąco':
      return next.sort((a, b) => a.name.localeCompare(b.name))
    case 'Nazwa malejąco':
      return next.sort((a, b) => b.name.localeCompare(a.name))
    case 'Cena rosnąco':
      return next.sort((a, b) => a.price - b.price)
    case 'Cena malejąco':
      return next.sort((a, b) => b.price - a.price)
    default:
      return next
  }
}

const Order = () => {
  const [sortOption, setSortOption] = useState<string | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const { state } = useCart()

  const { data: menuItems = [], isLoading } = trpc.menu.getMenuItems.useQuery()
  const { data: carouselImages = [], isLoading: isLoadingCarouselImages } = trpc.banner.getAllBanners.useQuery()
  const { data: settings, isLoading: isLoadingSettings } = trpc.settings.getSettings.useQuery()

  useEffect(() => {
    const now = new Date()
    const openingTime = new Date()
    openingTime.setHours(OPENING_HOUR, 0, 0, 0)
    const closingTime = new Date()
    closingTime.setHours(CLOSING_HOUR, 0, 0, 0)
    setIsOpen(now >= openingTime && now < closingTime)
  }, [])

  const activeItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = menuItems
      .map((item) => ({ ...item, category: item.category as MenuItemCategory }))
      .filter((item) => item.isActive)
      .filter((item) => categoryFilter === 'all' || item.category === categoryFilter)
      .filter((item) => {
        if (!query) return true
        return `${item.name} ${item.description ?? ''} ${item.category}`.toLowerCase().includes(query)
      }) as MenuItemType[]

    return sortItems(filtered, sortOption)
  }, [menuItems, categoryFilter, search, sortOption])

  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.filter((item) => item.isActive).map((item) => item.category))).sort((a, b) => {
      const orderA = categoryOrder[a] ?? 100
      const orderB = categoryOrder[b] ?? 100
      if (orderA !== orderB) return orderA - orderB
      return a.localeCompare(b, 'pl')
    })
  }, [menuItems])

  const categoryCounts = useMemo(() => {
    return menuItems.reduce<Record<string, number>>((acc, item) => {
      if (!item.isActive) return acc
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})
  }, [menuItems])

  const groupedItems = useMemo(() => {
    return categories
      .filter((category) => categoryFilter === 'all' || categoryFilter === category)
      .map((category) => ({
        category,
        items: activeItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0)
  }, [activeItems, categories, categoryFilter])

  const totalItemsInCart = state.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="w-full bg-[#f6f7f8] pb-10">
      <section className="w-full rounded-b-[28px] bg-white shadow-sm">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 pb-5 pt-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles size={13} /> Zamów online
              </span>
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              )}>
                <Clock size={13} /> {isOpen ? `Otwarte do ${CLOSING_HOUR}:00` : `Otwarte od ${OPENING_HOUR}:00`}
              </span>
            </div>

            <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
              Menu Spoko Sopot
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
              Wybierz dania, dodaj je do koszyka i zamów z odbiorem albo dostawą. Ceny i dostępność są pobierane z aktualnego menu restauracji.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                <p className="text-xs text-slate-400">Godziny</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{OPENING_HOUR}:00 - {CLOSING_HOUR}:00</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                <p className="text-xs text-slate-400">Menu</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{categories.length || '...'} kategorii</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                <p className="text-xs text-slate-400">Koszyk</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{totalItemsInCart} pozycji</p>
              </div>
            </div>
          </div>

          <Carousel
            className="min-h-[220px] overflow-hidden rounded-2xl border border-border bg-muted"
            plugins={[Autoplay({ delay: 5000 })]}
          >
            <CarouselContent>
              {isLoadingCarouselImages && (
                <CarouselItem>
                  <Skeleton className="h-[220px] w-full lg:h-[300px]" />
                </CarouselItem>
              )}
              {!isLoadingCarouselImages && carouselImages.length === 0 && (
                <CarouselItem>
                  <div className="flex h-[220px] items-center justify-center bg-secondary text-white lg:h-[300px]">
                    <Store size={38} strokeWidth={1.5} />
                  </div>
                </CarouselItem>
              )}
              {carouselImages.map((item) => (
                <CarouselItem key={item.id}>
                  <div className="relative h-[220px] w-full lg:h-[300px]">
                    <Image
                      src={item.imageUrl}
                      alt="Promocja Spoko Sopot"
                      fill
                      sizes="(min-width: 1024px) 420px, 100vw"
                      className="object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {carouselImages.length > 1 && (
              <>
                <CarouselPrevious className="left-3 border-white/70 bg-white/90 text-slate-900 hover:bg-white" />
                <CarouselNext className="right-3 border-white/70 bg-white/90 text-slate-900 hover:bg-white" />
              </>
            )}
          </Carousel>
        </div>
      </section>

      <section className="sticky top-20 z-10 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj dania, składnika lub kategorii"
              className="h-11 rounded-xl border-border bg-muted/40 pl-10"
            />
          </div>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger aria-label="Sortowanie" className="h-11 rounded-xl bg-white lg:w-[190px]">
              <SelectValue placeholder="Sortuj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nazwa rosnąco">Nazwa rosnąco</SelectItem>
              <SelectItem value="Nazwa malejąco">Nazwa malejąco</SelectItem>
              <SelectItem value="Cena rosnąco">Cena rosnąco</SelectItem>
              <SelectItem value="Cena malejąco">Cena malejąco</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
              categoryFilter === 'all'
                ? 'border-secondary bg-secondary text-white'
                : 'border-border bg-white text-slate-600 hover:border-secondary/40'
            )}
          >
            Wszystkie
            <span className={cn('rounded-full px-2 py-0.5 text-xs', categoryFilter === 'all' ? 'bg-white/15' : 'bg-muted')}>
              {menuItems.filter((item) => item.isActive).length}
            </span>
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
                categoryFilter === category
                  ? 'border-secondary bg-secondary text-white'
                  : 'border-border bg-white text-slate-600 hover:border-secondary/40'
              )}
            >
              {category}
              <span className={cn('rounded-full px-2 py-0.5 text-xs', categoryFilter === category ? 'bg-white/15' : 'bg-muted')}>
                {categoryCounts[category] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {isLoadingSettings ? (
          <Skeleton className="mb-4 h-12 w-full rounded-xl" />
        ) : !settings?.isOrderingOpen ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Zamawianie online jest chwilowo niedostępne. W celu zamówienia zadzwoń do nas lub odwiedź nas osobiście.
          </div>
        ) : null}

        {!isOpen && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Restauracja jest teraz zamknięta. Zamówienia realizujemy od {OPENING_HOUR}:00 do {CLOSING_HOUR}:00.
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : groupedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-16 text-center">
            <ShoppingBag className="mx-auto mb-3 text-slate-300" size={36} strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-700">Nie znaleziono pozycji w menu.</p>
            <p className="mt-1 text-xs text-slate-400">Zmień kategorię albo wpisz inną frazę.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedItems.map(({ category, items }) => (
              <section key={category} className="scroll-mt-40">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950 md:text-3xl">{category}</h2>
                    {category === 'Śniadania' && (
                      <p className="mt-1 text-sm text-slate-500">Dostępne wyłącznie w godzinach 8:00 - 12:00.</p>
                    )}
                    {category === 'Pizza' && (
                      <p className="mt-1 text-sm text-slate-500">Pizza 32 cm, dostępna w wybrane dni i godziny.</p>
                    )}
                  </div>
                  <span className="text-sm text-slate-400">{items.length} pozycji</span>
                </div>

                {category === 'Oferta Walentynkowa' && (
                  <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    Specjalna oferta Walentynkowa dostępna tylko w dniach 14-16 lutego i wyłącznie na dostawę.
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((item) => (
                    <MenuItem
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      price={item.price}
                      description={item.description || ''}
                      image={item.image || ''}
                      category={item.category}
                      orientation="horizontal"
                      isOrderingActive={settings?.isOrderingOpen}
                      isPizzaAvailable={settings?.pizzaCategoryEnabled}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Order
