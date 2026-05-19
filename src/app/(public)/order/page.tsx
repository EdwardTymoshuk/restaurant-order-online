'use client'

import MenuItem from '@/app/components/MenuItem'
import { Button } from '@/app/components/ui/button'
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
import { DeliveryZone, MenuDownloadDocument, MenuItemCategory, MenuItemType } from '@/app/types/types'
import { menuItemCategories } from '@/config'
import { CLOSING_HOUR, OPENING_HOUR } from '@/config/constants'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import Autoplay from 'embla-carousel-autoplay'
import { Bike, Clock, Download, FileText, MapPin, Search, ShoppingBag, Sparkles, Store } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

const categoryOrder = menuItemCategories.reduce<Record<string, number>>((acc, category, index) => {
  acc[category] = index
  return acc
}, {})

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

const getCategoryId = (category: string) =>
  `category-${category.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-')}`

const BESTSELLERS_CATEGORY = 'Bestsellery'
const SCROLL_OFFSET = 128
const FORCE_ORDERING_OPEN_FOR_TEST =
  process.env.NEXT_PUBLIC_FORCE_ORDERING_OPEN === 'true'

const Order = () => {
  const [sortOption, setSortOption] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const categoryBarRef = useRef<HTMLDivElement | null>(null)
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const { data: menuItems = [], isLoading } = trpc.menu.getMenuItems.useQuery()
  const { data: bestsellerItems = [] } = trpc.menu.getBestsellers.useQuery()
  const { data: carouselImages = [], isLoading: isLoadingCarouselImages } = trpc.banner.getAllBanners.useQuery()
  const { data: settings, isLoading: isLoadingSettings } = trpc.settings.getSettings.useQuery()
  const isOrderingOpen = FORCE_ORDERING_OPEN_FOR_TEST || settings?.isOrderingOpen
  const menuDocuments = useMemo(() => {
    if (!Array.isArray(settings?.menuDocuments)) return []
    return (settings.menuDocuments as unknown as MenuDownloadDocument[])
      .filter((document) => document.isActive && document.url)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [settings?.menuDocuments])

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
      .filter((item) => {
        if (!query) return true
        return `${item.name} ${item.description ?? ''} ${item.category}`.toLowerCase().includes(query)
      }) as MenuItemType[]

    return sortItems(filtered, sortOption)
  }, [menuItems, search, sortOption])

  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.filter((item) => item.isActive).map((item) => item.category))).sort((a, b) => {
      const orderA = categoryOrder[a] ?? 100
      const orderB = categoryOrder[b] ?? 100
      if (orderA !== orderB) return orderA - orderB
      return a.localeCompare(b, 'pl')
    })
  }, [menuItems])

  const filteredBestsellerItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = bestsellerItems
      .map((item) => ({ ...item, category: item.category as MenuItemCategory }))
      .filter((item) => {
        if (!query) return true
        return `${item.name} ${item.description ?? ''} ${item.category}`.toLowerCase().includes(query)
      }) as MenuItemType[]

    return sortOption ? sortItems(filtered, sortOption) : filtered
  }, [bestsellerItems, search, sortOption])

  const navigationCategories = useMemo(() => {
    if (filteredBestsellerItems.length === 0) return categories
    return [BESTSELLERS_CATEGORY, ...categories]
  }, [categories, filteredBestsellerItems.length])

  const categoryCounts = useMemo(() => {
    const counts = menuItems.reduce<Record<string, number>>((acc, item) => {
      if (!item.isActive) return acc
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})

    if (filteredBestsellerItems.length > 0) {
      counts[BESTSELLERS_CATEGORY] = filteredBestsellerItems.length
    }

    return counts
  }, [filteredBestsellerItems.length, menuItems])

  const groupedItems = useMemo(() => {
    const regularGroups = categories
      .map((category) => ({
        category,
        items: activeItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0)

    if (filteredBestsellerItems.length === 0) return regularGroups

    return [
      {
        category: BESTSELLERS_CATEGORY,
        items: filteredBestsellerItems,
      },
      ...regularGroups,
    ]
  }, [activeItems, categories, filteredBestsellerItems])

  const minimumDeliveryPrice = useMemo(() => {
    if (!Array.isArray(settings?.deliveryZones)) return null

    const prices = (settings.deliveryZones as unknown as DeliveryZone[])
      .map((zone) => zone.price)
      .filter((price) => Number.isFinite(price))

    return prices.length > 0 ? Math.min(...prices) : null
  }, [settings])

  const scrollToCategory = (category: string) => {
    const section = document.getElementById(getCategoryId(category))
    const container = scrollContainerRef.current
    if (!section || !container) return

    setActiveCategory(category)
    container.scrollTo({
      top: section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - SCROLL_OFFSET,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    if (groupedItems.length === 0) {
      setActiveCategory('all')
      return
    }

    const container = scrollContainerRef.current
    if (!container) return

    let frame = 0

    const updateActiveCategory = () => {
      let nextCategory = 'all'
      const containerTop = container.getBoundingClientRect().top

      groupedItems.forEach(({ category }) => {
        const section = document.getElementById(getCategoryId(category))
        if (!section) return

        if (section.getBoundingClientRect().top - containerTop <= SCROLL_OFFSET + 8) {
          nextCategory = category
        }
      })

      setActiveCategory((current) => {
        if (current === nextCategory) return current
        return nextCategory
      })
    }

    const handleScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        updateActiveCategory()
        frame = 0
      })
    }

    updateActiveCategory()
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [groupedItems])

  useEffect(() => {
    const button = categoryButtonRefs.current[activeCategory]
    const bar = categoryBarRef.current
    if (!button || !bar) return

    const buttonLeft = button.offsetLeft
    const centeredLeft = buttonLeft - (bar.clientWidth - button.clientWidth) / 2

    bar.scrollTo({
      left: Math.max(centeredLeft, 0),
      behavior: 'smooth',
    })
  }, [activeCategory])

  return (
    <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto bg-[#f6f7f8] pb-10">
      <section className="w-full border-b border-border bg-white">
        <div className="grid w-full items-center gap-8 px-4 pb-8 pt-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)] lg:px-8">
          <div className="min-w-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Zamówienia Spoko Sopot
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
              Menu Spoko Sopot
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Zamów ulubione dania ze Spoko Sopot z dostawą pod wskazany adres albo odbierz je wygodnie w restauracji. Świeże menu, szybki wybór i koszyk gotowy w kilka kliknięć.
            </p>

            <div className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <Clock size={17} className="shrink-0 text-primary" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold text-slate-400">Godziny otwarcia</span>
                  <strong className="font-semibold text-slate-950">{OPENING_HOUR}:00 - {CLOSING_HOUR}:00</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <Bike size={17} className="shrink-0 text-primary" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold text-slate-400">Dostawa</span>
                  <strong className="font-semibold text-slate-950">już od {minimumDeliveryPrice ?? 5} zł</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <MapPin size={17} className="shrink-0 text-primary" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold text-slate-400">Odbiór</span>
                  <strong className="truncate font-semibold text-slate-950">Hestii 3, 81-731 Sopot</strong>
                </span>
              </div>
            </div>
          </div>

          <Carousel
            className="min-h-[220px] overflow-hidden rounded-2xl bg-muted shadow-sm"
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
                      sizes="(min-width: 1024px) 42vw, 100vw"
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

      {menuDocuments.length > 0 && (
        <section className="border-b border-border bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 lg:px-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Menu PDF</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Pobierz menu w wersji do druku</h2>
              </div>
              <p className="hidden text-sm text-slate-500 md:block">
                Alternatywna wersja dla gości, którzy wolą pobrać plik.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {menuDocuments.map((document) => (
                <a
                  key={document.id}
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-slate-50 px-4 py-4 transition hover:border-secondary/30 hover:bg-secondary/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{document.title}</p>
                      <p className="text-xs text-slate-500">
                        {document.type === 'menu'
                          ? 'Menu dań'
                          : document.type === 'drinks'
                            ? 'Menu napojów'
                            : 'Dokument PDF'}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="shrink-0 gap-2">
                    <span>
                      <Download size={14} />
                      Pobierz
                    </span>
                  </Button>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="flex w-full flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:px-8">
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

        <div ref={categoryBarRef} className="flex w-full gap-2 overflow-x-auto px-4 pb-3 lg:px-8">
          <button
            ref={(node) => {
              categoryButtonRefs.current.all = node
            }}
            onClick={() => {
              setActiveCategory('all')
              scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
              activeCategory === 'all'
                ? 'border-secondary bg-secondary text-white'
                : 'border-border bg-white text-slate-600 hover:border-secondary/40'
            )}
          >
            Wszystkie
            <span className={cn('rounded-full px-2 py-0.5 text-xs', activeCategory === 'all' ? 'bg-white/15' : 'bg-muted')}>
              {menuItems.filter((item) => item.isActive).length}
            </span>
          </button>
          {navigationCategories.map((category) => (
            <button
              key={category}
              ref={(node) => {
                categoryButtonRefs.current[category] = node
              }}
              onClick={() => scrollToCategory(category)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
                activeCategory === category
                  ? 'border-secondary bg-secondary text-white'
                  : category === BESTSELLERS_CATEGORY
                    ? 'border-primary/30 bg-primary/10 text-secondary hover:border-primary/60 hover:bg-primary/15'
                    : 'border-border bg-white text-slate-600 hover:border-secondary/40'
              )}
            >
              {category === BESTSELLERS_CATEGORY && <Sparkles size={15} />}
              {category}
              <span className={cn('rounded-full px-2 py-0.5 text-xs', activeCategory === category ? 'bg-white/15' : 'bg-muted')}>
                {categoryCounts[category] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="w-full px-4 py-6 lg:px-8">
        {isLoadingSettings ? (
          <Skeleton className="mb-4 h-12 w-full rounded-xl" />
        ) : !isOrderingOpen ? (
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
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr))]">
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
              <section
                key={category}
                id={getCategoryId(category)}
                className={cn(
                  'scroll-mt-32',
                  category === BESTSELLERS_CATEGORY && 'rounded-[28px] border border-primary/25 bg-primary/5 p-4 shadow-sm md:p-5'
                )}
              >
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-950 md:text-3xl">
                      {category === BESTSELLERS_CATEGORY && (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-secondary">
                          <Sparkles size={18} />
                        </span>
                      )}
                      {category}
                    </h2>
                    {category === BESTSELLERS_CATEGORY && (
                      <p className="mt-1 text-sm text-slate-500">
                        Najchętniej wybierane pozycje i rekomendacje restauracji.
                      </p>
                    )}
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

                <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr))]">
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
                      isOrderingActive={isOrderingOpen}
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
