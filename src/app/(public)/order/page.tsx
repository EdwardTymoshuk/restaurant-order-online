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
} from "@/app/components/ui/select"
import { Skeleton } from '@/app/components/ui/skeleton'
import { MenuItemCategory, MenuItemType } from '@/app/types'
import { CAROUSEL_MAIN_IMAGES } from '@/config'
import { trpc } from '@/utils/trpc'
import Autoplay from "embla-carousel-autoplay"
import Image from 'next/image'
import { useEffect, useState } from 'react'
import PageSubHeader from '../../components/PageSubHeader'

const Order = () => {
	const [sortedItems, setSortedItems] = useState<MenuItemType[]>([])
	const [sortOption, setSortOption] = useState<string | undefined>(undefined)
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>('all')
	const [activeAccordion, setActiveAccordion] = useState<string | null>(null)
	const [isBreakfastOnly, setIsBreakfastOnly] = useState<boolean>(false)

	const { data: menuItems = [], isLoading } = trpc.menu.getMenuItems.useQuery()

	// Перевірка часу для обмеження доступу до меню
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

	useEffect(() => {
		if (!menuItems || menuItems.length === 0) return

		let itemsFiltered = menuItems
			.map(item => ({
				...item,
				category: item.category as MenuItemCategory,
			}))
			.filter(item => item.isOrderable)

		// Обмеження відображення тільки сніданків, якщо активний режим сніданку
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

	const categories = Array.from(new Set(menuItems.map(item => item.category)))

	return (
		<div className="container mx-auto px-4 py-4 space-y-4">
			<Carousel
				className='w-full h-96'
				plugins={[
					Autoplay({
						delay: 5000,
					}),
				]}
			>
				<CarouselContent className='h-full'>
					{CAROUSEL_MAIN_IMAGES.map((item, index) => (
						<CarouselItem key={index} className='relative '>
							<div className='relative h-96 rounded-md'>
								<Image
									src={item.src}
									alt='Carousel image'
									width={1056}
									height={384}
									className='object-cover w-full h-96 rounded-md'
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className='left-0 text-primary hover:text-primary opacity-80 hover:opacity-100 h-8 w-8 bg-transparent hover:bg-transparent' />
				<CarouselNext className='right-0 text-primary hover:text-primary opacity-80 hover:opacity-100 h-8 w-8 bg-transparent hover:bg-transparent' />
			</Carousel>

			<PageSubHeader title='Wybierz na co masz dziś ochotę' />

			<div className="flex gap-4 mb-4 w-1/2">
				<Select
					value={sortOption}
					onValueChange={setSortOption}
				>
					<SelectTrigger aria-label="Sortowanie">
						<SelectValue placeholder='Sortuj' />
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
					disabled={isBreakfastOnly} // Заборона зміни категорій під час сніданку
				>
					<SelectTrigger aria-label="Kategorie">
						<SelectValue placeholder='Filtruj' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Wszystkie</SelectItem>
						{categories.map(category => (
							<SelectItem key={category} value={category}>{category}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Відображення меню з розбиттям по категоріях */}
			{isBreakfastOnly && (
				<div className="text-center text-lg text-secondary mt-8">
					W godzinach 8:00 - 12:00 dostępne są tylko śniadania.
				</div>
			)}
			<Accordion
				type="single"
				collapsible
				className='space-y-4'
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
					categories
						.filter(category => categoryFilter === 'all' || categoryFilter === category)
						.map((category, index) => (
							<AccordionItem key={category} value={category} className='border-0'>
								<AccordionTrigger className='text-text-foreground hover:text-text-secondary data-[state=open]:text-text-secondary text-4xl md:text-5xl hover:no-underline'>
									{!isBreakfastOnly && category === 'Śniadania' ? (
										<span className='space-x-4 flex items-center'>
											<span>{category}</span>
											<span className='text-secondary text-sm'>(Śniadania dostępne wyłącznie w godzinach 8-12)</span>
										</span>
									) : category}
								</AccordionTrigger>
								<AccordionContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
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
												orientation='horizontal'
												isBreakfastOnly={isBreakfastOnly}
											/>
										))}
								</AccordionContent>
							</AccordionItem>
						))
				)}
			</Accordion>
		</div>
	)
}

export default Order
