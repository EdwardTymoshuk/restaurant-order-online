'use client'

import ImageWithFallback from '@/app/components/ImageWithFallback'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Skeleton } from '@/app/components/ui/skeleton'
import { Switch } from '@/app/components/ui/switch'
import { MenuItemCategory } from '@/app/types'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table" // Імпортуємо компоненти таблиці з Shadcn
import { trpc } from '@/utils/trpc'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FiPlus } from "react-icons/fi"

const MenuTable = () => {
	const [sortOption, setSortOption] = useState<string | undefined>('default')
	const [categoryFilter, setCategoryFilter] = useState<MenuItemCategory | 'all'>('all')
	const [isOrderableFilter, setIsOrderableFilter] = useState<string>('all')
	const [isRecommendedFilter, setIsRecommendedFilter] = useState<string>('all')

	const { data: menuItems = [], isLoading } = trpc.menu.getAllMenuItems.useQuery()
	const queryClient = useQueryClient()
	const router = useRouter()

	const { mutateAsync: updateMenuItem } = trpc.menu.updateMenuItem.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries(['menu.getAllMenuItems'])
		},
	})

	const { mutateAsync: deleteMenuItem } = trpc.menu.deleteMenuItem.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries(['menu.getAllMenuItems'])
		},
	})

	// Сортування і фільтрація елементів
	const sortedItems = useMemo(() => {
		if (!menuItems) return []

		let itemsFiltered = menuItems.map(item => ({
			...item,
			category: item.category as MenuItemCategory,
		}))

		// Фільтруємо за категоріями
		if (categoryFilter !== 'all') {
			itemsFiltered = itemsFiltered.filter(item => item.category === categoryFilter)
		}

		// Фільтруємо за активністю
		if (isOrderableFilter !== 'all') {
			const isOrderableValue = isOrderableFilter === 'true'
			itemsFiltered = itemsFiltered.filter(item => item.isOrderable === isOrderableValue)
		}

		// Фільтруємо за рекомендаціями
		if (isRecommendedFilter !== 'all') {
			const isRecommendedValue = isRecommendedFilter === 'true'
			itemsFiltered = itemsFiltered.filter(item => item.isRecommended === isRecommendedValue)
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
			case 'Data rosnąco':
				itemsFiltered.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
				break
			case 'Data malejąco':
				itemsFiltered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
				break
			default:
				// Відображення за замовчуванням
				itemsFiltered.reverse() // Реверс за датою додавання
				break
		}

		return itemsFiltered
	}, [menuItems, sortOption, categoryFilter, isOrderableFilter, isRecommendedFilter])

	const handleToggleIsOrderable = async (id: string, value: boolean) => {
		await updateMenuItem({ id, isOrderable: value })
	}

	const handleToggleIsRecommended = async (id: string, value: boolean) => {
		await updateMenuItem({ id, isRecommended: value })
	}

	const handleDelete = async (id: string) => {
		await deleteMenuItem({ id })
	}

	const handleEdit = (id: string) => {
		router.push(`/admin-panel/menu/edit/${id}`)
	}

	const handleAddNewItem = () => {
		router.push('/admin-panel/menu/create')
	}

	return (
		<div className="container mx-auto px-4 py-4 space-y-4">
			<div>
				<Button onClick={handleAddNewItem}>
					<FiPlus /> Dodaj
				</Button>
			</div>
			<div className="flex flex-col lg:flex-row gap-2 mb-4">
				<div className='flex gap-2 w-full'>
					<Select value={sortOption} onValueChange={setSortOption}>
						<SelectTrigger aria-label="Sortowanie" > {/* Обмежуємо ширину для маленьких екранів */}
							<SelectValue placeholder='Sortuj' />
						</SelectTrigger>
						<SelectContent >
							<SelectItem value="default">Domyślnie</SelectItem>
							<SelectItem value="Nazwa rosnąco">Nazwa rosnąco</SelectItem>
							<SelectItem value="Nazwa malejąco">Nazwa malejąco</SelectItem>
							<SelectItem value="Cena rosnąco">Cena rosnąco</SelectItem>
							<SelectItem value="Cena malejąco">Cena malejąco</SelectItem>
							<SelectItem value="Data rosnąco">Data rosnąco</SelectItem>
							<SelectItem value="Data malejąco">Data malejąco</SelectItem>
						</SelectContent>
					</Select>
					<Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as MenuItemCategory | 'all')}>
						<SelectTrigger aria-label="Kategorie" > {/* Обмежуємо ширину для маленьких екранів */}
							<SelectValue placeholder='Filtruj' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Wszystkie</SelectItem>
							{Array.from(new Set(menuItems.map(item => item.category as MenuItemCategory))).map(category => (
								<SelectItem key={category} value={category}>
									<span >{category}</span> {/* Додаємо скорочення */}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='flex w-full gap-2'>
					<Select value={isOrderableFilter} onValueChange={setIsOrderableFilter}>
						<SelectTrigger aria-label="Aktywność" >
							<SelectValue placeholder='Filtruj po aktywności' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Wszystkie</SelectItem>
							<SelectItem value="true">Aktywne</SelectItem>
							<SelectItem value="false">Nieaktywne</SelectItem>
						</SelectContent>
					</Select>
					<Select value={isRecommendedFilter} onValueChange={setIsRecommendedFilter}>
						<SelectTrigger aria-label="Rekomendacje" >
							<SelectValue placeholder='Filtruj po rekomendacjach' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Wszystkie</SelectItem>
							<SelectItem value="true">Rekomendowane</SelectItem>
							<SelectItem value="false">Nierekomendowane</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{isLoading ? (
				<Skeleton className="h-40 w-full" />
			) : (
				<div className="overflow-x-auto"> {/* Додаємо горизонтальний скрол */}
					<Table className="min-w-full">
						<TableHeader>
							<TableRow>
								<TableHead className='text-text-foreground'>LP</TableHead>
								<TableHead className='text-text-foreground hidden lg:table-cell'>Obraz</TableHead> {/* Приховуємо на малих екранах */}
								<TableHead className='text-text-foreground'>Nazwa</TableHead>
								<TableHead className='text-text-foreground'>Kategoria</TableHead>
								<TableHead className='text-text-foreground'>Cena</TableHead>
								<TableHead className='text-text-foreground hidden lg:table-cell'>Aktywne</TableHead> {/* Приховуємо на малих екранах */}
								<TableHead className='text-text-foreground hidden lg:table-cell'>Rekomendowane</TableHead> {/* Приховуємо на малих екранах */}
								<TableHead className='text-text-foreground'>Akcje</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedItems.map((item, index) => (
								<TableRow key={item.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className="hidden lg:table-cell">
										<ImageWithFallback
											src={`${item.image}?t=${item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now()}`}
											alt={item.name}
											width={48}
											height={48}
											className="h-12 w-12 object-cover"
											containerClassName="h-12 w-12"
										/>
									</TableCell>
									<TableCell className="cursor-pointer text-secondary underline" onClick={() => handleEdit(item.id)}>
										{item.name}
									</TableCell>
									<TableCell>{item.category}</TableCell>
									<TableCell className="text-right">{item.price} zł</TableCell>
									<TableCell className="text-center hidden lg:table-cell">
										<Switch
											checked={item.isOrderable}
											onCheckedChange={(value) => handleToggleIsOrderable(item.id, value)}
										/>
									</TableCell>
									<TableCell className="text-center hidden lg:table-cell">
										<Switch
											checked={item.isRecommended}
											onCheckedChange={(value) => handleToggleIsRecommended(item.id, value)}
										/>
									</TableCell>
									<TableCell className="text-center space-x-2">
										<button className="text-info hover:text-info-light" onClick={() => handleEdit(item.id)}>Edytuj</button>
										<button className="text-danger hover:text-danger-light" onClick={() => handleDelete(item.id)}>Usuń</button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}

export default MenuTable
