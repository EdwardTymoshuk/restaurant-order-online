'use client'

import MenuItem from '@/app/components/MenuItem'
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

const Page = () => {
	const [sortedItems, setSortedItems] = useState<MenuItemType[]>([])
	const [sortOption, setSortOption] = useState<string | undefined>(undefined)
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)

	const { data: menuItems = [], isLoading } = trpc.menu.getMenuItems.useQuery() // Add isLoading to handle skeleton state

	useEffect(() => {
		// Запобігаємо виконанню, якщо menuItems ще не завантажені
		if (!menuItems || menuItems.length === 0) return

		let itemsFiltered = menuItems
			.map(item => ({
				...item,
				category: item.category as MenuItemCategory,
			}))
			.filter(item => item.isOrderable)

		// Фільтрація за категорією
		if (categoryFilter && categoryFilter !== 'all') {
			itemsFiltered = itemsFiltered.filter(item => item.category === categoryFilter)
		}

		// Сортування
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

		// Установка відсортованих елементів
		setSortedItems(itemsFiltered)
	}, [menuItems, sortOption, categoryFilter])

	const categories = Array.from(new Set(menuItems.map(item => item.category)))

	return (
		<div className="container mx-auto px-4 py-4 space-y-4">
			<Carousel
				className='w-full h-[250px]'
				plugins={[
					Autoplay({
						delay: 5000,
					}),
				]}
			>
				<CarouselContent className='h-full'>
					{CAROUSEL_MAIN_IMAGES.map((item, index) => (
						<CarouselItem key={index} className='relative'>
							<div className='relative h-[250px]'>
								<Image
									src={item.src}
									alt='Carousel image'
									fill
									objectFit='cover'
									className='w-auto min-h-[250px]'
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className='left-0 text-primary hover:text-primary opacity-80 hover:opacity-100 h-8 w-8 bg-transparent hover:bg-transparent' />
				<CarouselNext className='right-0 text-primary hover:text-primary opacity-80 hover:opacity-100 h-8 w-8 bg-transparent hover:bg-transparent' />
			</Carousel>

			<PageSubHeader title='Wybierz swoje ulubione dania' className='' />

			<div className="flex gap-4 mb-4 w-1/2">
				<Select value={sortOption} onValueChange={setSortOption}>
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
				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

			{/* Використовуємо Skeleton під час завантаження */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-16">
					{Array.from({ length: 6 }).map((_, index) => (
						<Skeleton key={index} className="w-full h-24 md:h-32" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-16">
					{sortedItems.map(item => (
						<MenuItem
							id={item.id}
							key={item.id}
							name={item.name}
							price={item.price}
							description={item.description || ''}
							image={item.image || ''}
							category={item.category}
							orientation='horizontal'
						/>
					))}
				</div>
			)}
		</div>
	)
}

export default Page
