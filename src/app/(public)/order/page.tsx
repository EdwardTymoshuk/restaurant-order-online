'use client'

import MenuItem from '@/app/components/MenuItem'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/app/components/ui/carousel'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import { MenuItemCategory, MenuItemType } from '@/app/types/types'
import { CLOSING_HOUR, OPENING_HOUR } from '@/config/constants'
import { trpc } from '@/utils/trpc'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { LuCircleSlash2 } from "react-icons/lu"
import PageSubHeader from '../../components/PageSubHeader'

const categoryOrder: Record<string, number> = {
	'Oferta Walentynkowa': 0,
	'Oferta Specjalna': 1,
}

const Order = () => {
	// States for managing UI and data
	const [sortedItems, setSortedItems] = useState<MenuItemType[]>([])
	const [sortOption, setSortOption] = useState<string | undefined>(undefined)
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>('all')
	const [activeAccordion, setActiveAccordion] = useState<string | null>(null)
	const [isBreakfastOnly, setIsBreakfastOnly] = useState<boolean>(false)
	const [isOpen, setIsOpen] = useState(true)

	// Fetch menu items, banners, and settings from the server
	const { data: menuItems = [], isLoading } = trpc.menu.getMenuItems.useQuery()
	const { data: carouselImages = [], isLoading: isLoadingCarouselImages } = trpc.banner.getAllBanners.useQuery()
	const { data: settings, isLoading: isLoadingSettings } = trpc.settings.getSettings.useQuery()

	// Utility function to check if the restaurant is open
	const isRestaurantOpen = () => {
		const now = new Date()
		const openingTime = new Date()
		openingTime.setHours(OPENING_HOUR, 0, 0, 0)
		const closingTime = new Date()
		closingTime.setHours(CLOSING_HOUR, 0, 0, 0)

		return now >= openingTime && now < closingTime
	}

	useEffect(() => {
		setIsOpen(isRestaurantOpen())
	}, [])

	// Logic for restricting menu items based on time (e.g., breakfast only)
	useEffect(() => {
		const now = new Date()
		const currentHour = now.getHours()
		const isBreakfastTime = currentHour >= 8 && currentHour < 12
		setIsBreakfastOnly(isBreakfastTime)
		if (isBreakfastTime) {
			setCategoryFilter('Śniadania')
			setActiveAccordion('Śniadania')
		}
	}, [])

	// Sorting and filtering logic for menu items
	useEffect(() => {
		if (!menuItems || menuItems.length === 0) return

		let itemsFiltered = menuItems
			.map(item => ({
				...item,
				category: item.category as MenuItemCategory,
			}))
			.filter(item => item.isActive)

		if (isBreakfastOnly && categoryFilter !== 'Śniadania') {
			itemsFiltered = []
		} else if (categoryFilter && categoryFilter !== 'all') {
			itemsFiltered = itemsFiltered.filter(item => item.category === categoryFilter)
		}

		switch (sortOption) {
			case 'Nazwa rosnąco':
				itemsFiltered.sort((a, b) => a.name.localeCompare(b.name))
				break
			case 'Nazwa malejąco':
				itemsFiltered.sort((a, b) => b.name.localeCompare(a.name))
				break
			case 'Cena rosnąco':
				itemsFiltered.sort((a, b) => a.price - b.price)
				break
			case 'Cena malejąco':
				itemsFiltered.sort((a, b) => b.price - a.price)
				break
			default:
				break
		}

		setSortedItems(itemsFiltered)
	}, [menuItems, sortOption, categoryFilter, isBreakfastOnly])

	// Generate unique category list from menu items
	const categories = Array.from(new Set(menuItems.map(item => item.category)))

	// Sorting categories
	const sortedCategories = [...new Set([...categories])].sort((a, b) => {
		const orderA = categoryOrder[a] ?? Infinity
		const orderB = categoryOrder[b] ?? Infinity
		return orderA - orderB
	  })
	  

	return (
		<div className="container mx-auto px-4 py-4 space-y-4">
			{/* Carousel for banners */}
			<Carousel
				className="w-full h-96"
				plugins={[
					Autoplay({
						delay: 5000,
					}),
				]}
			>
				<CarouselContent className="h-full">
					{isLoadingCarouselImages && <Skeleton className="w-[1056px] h-[384px]" />}
					{carouselImages.map((item, index) => (
						<CarouselItem key={index} className="relative">
							<div className="relative h-96 w-auto rounded-md">
								<Image
									src={item.imageUrl}
									alt="Carousel image"
									width={1056}
									height={384}
									className="object-cover w-full h-96 rounded-md"
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="left-0 text-primary hover:text-primary opacity-80 hover:opacity-100 h-8 w-8 bg-transparent hover:bg-transparent" />
				<CarouselNext className="right-0 text-primary hover:text-primary opacity-80 hover:opacity-100 h-8 w-8 bg-transparent hover:bg-transparent" />
			</Carousel>

			{/* Page subheader */}
			<PageSubHeader title="Wybierz na co masz dziś ochotę" />

			{/* Display ordering status */}
			{isLoadingSettings ? <Skeleton className="w-full h-8" /> : (!settings?.isOrderingOpen &&
				<div className="flex justify-self-center w-fit p-4 bg-yellow-100 text-warning text-center rounded-md">
					Zamawianie online jest chwilowo niedostępne. <br />W celu zamówienia zadzwoń do nas lub odwiedź nas osobiście.
				</div>
			)}

			{/* Sorting and category filtering controls */}
			<div className="flex gap-4 mb-4 w-1/2">
				<Select
					value={sortOption}
					onValueChange={setSortOption}
				>
					<SelectTrigger aria-label="Sortowanie">
						<SelectValue placeholder="Sortuj" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Nazwa rosnąco">Nazwa rosnąco</SelectItem>
						<SelectItem value="Nazwa malejąco">Nazwa malejąco</SelectItem>
						<SelectItem value="Cena rosnąco">Cena rosnąco</SelectItem>
						<SelectItem value="Cena malejąco">Cena malejąco</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={categoryFilter}
					onValueChange={(value) => {
						setCategoryFilter(value)
						setActiveAccordion(value === 'all' ? null : value)
					}}
					disabled={isBreakfastOnly} // Restrict category changes during breakfast hours
				>
					<SelectTrigger aria-label="Kategorie">
						<SelectValue placeholder="Filtruj" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Wszystkie</SelectItem>
						{sortedCategories.map(category => (
							<SelectItem key={category} value={category}>{category}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Display breakfast-only notice */}
			{isBreakfastOnly && (
				<div className="text-center text-lg text-secondary mt-8">
					W godzinach 8:00 - 12:00 dostępne są tylko śniadania.
				</div>
			)}

			{/* Display restaurant closed notice */}
			{!isOpen && (
				<div className="mt-4 p-2 bg-red-100 text-danger text-center rounded-md">
					Restauracja jest zamknięta. Zamówienia są realizowane od godziny{' '}
					{OPENING_HOUR}:00 do{' '}
					{CLOSING_HOUR}:00.
				</div>
			)}

			{/* Menu items displayed by category */}
			<Accordion
				type="single"
				collapsible
				className="space-y-4"
				value={activeAccordion || undefined}
				onValueChange={setActiveAccordion}
			>
				{isLoading ? (
					<div className="grid grid-cols-1 gap-y-4 gap-x-16">
						{Array.from({ length: 4 }).map((_, index) => (
							<Skeleton key={index} className="w-full h-24 md:h-32" />
						))}
					</div>
				) : (
					sortedCategories
						.filter(category => categoryFilter === 'all' || categoryFilter === category)
						.map((category, index) => (
							<AccordionItem key={category} value={category} className="border-0">
								<AccordionTrigger className="text-text-foreground hover:text-text-secondary data-[state=open]:text-text-secondary text-4xl md:text-5xl hover:no-underline text-start">
									{/* Add a condition for the breakfast category */}
									{category === 'Śniadania' ? (
										<span className="space-x-0 flex flex-col items-start">
											<span>{category}</span>
											<span className="text-secondary text-sm">
												(Dostępne wyłącznie w godzinach 8:00 - 12:00)
											</span>
										</span>
									) : category === 'Pizza' ? (
										<span className="space-x-0 flex flex-col items-start">
											<span className='flex items-end gap-2'>{category} <i className='text-4xl flex items-bottom gap-2'>(32 cm <LuCircleSlash2 />)</i></span>
											<span className="text-secondary text-sm">
												(Dostępne w wybrane dni i godziny)
											</span>
										</span>
									)  : (
										category
									)}
								</AccordionTrigger>
								<AccordionContent>
								{category === 'Oferta Walentynkowa' && (
                    <div className="w-full bg-red-50 text-danger p-4 rounded-lg mb-4 text-base flex flex-col">
                        <p><strong>Specjalna oferta Walentynkowa</strong> dostępna tylko w dniach <strong>14-16 lutego</strong>.</p>
                        <p>Menu walentynkowe jest przygotowane z myślą o wyjątkowych chwilach i dostępne <strong>wyłącznie na dostawę</strong>.</p>
                        <p>Zalecamy składanie zamówień z wyprzedzeniem, aby zagwarantować sobie romantyczny wieczór bez stresu.</p>
                        <p>W razie pytań prosimy o kontakt telefoniczny.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
									{sortedItems
										.filter(item => item.category === category)
										.map(item => (
											<MenuItem
												key={item.id}
												id={item.id}
												name={item.name}
												price={item.price}
												description={item.description || ''}
												image={item.image || ''}
												category={item.category}
												orientation="horizontal"
												isBreakfastOnly={isBreakfastOnly}
												isOrderingActive={settings?.isOrderingOpen && isOpen}
												isPizzaAvailable={settings?.pizzaCategoryEnabled}
											/>
										))}
										</div>
								</AccordionContent>
							</AccordionItem>

						))
				)}
			</Accordion>
		</div>
	)
}

export default Order
