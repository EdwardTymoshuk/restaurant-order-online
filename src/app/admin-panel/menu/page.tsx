'use client'

import ImageWithFallback from '@/app/components/ImageWithFallback'
import { Button } from '@/app/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/app/components/ui/select"
import { Skeleton } from '@/app/components/ui/skeleton'
import { Switch } from '@/app/components/ui/switch'
import { MenuItemCategory, MenuItemType } from '@/app/types'
import { trpc } from '@/utils/trpс'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiPlus } from "react-icons/fi"

const MenuTable = () => {
	const [sortedItems, setSortedItems] = useState<MenuItemType[]>([])
	const [sortOption, setSortOption] = useState<string | undefined>(undefined)
	const [categoryFilter, setCategoryFilter] = useState<MenuItemCategory | 'all'>('all')
	const [isOrderableFilter, setIsOrderableFilter] = useState<string>('all')
	const [isRecommendedFilter, setIsRecommendedFilter] = useState<string>('all')
	const { data: menuItems = [], isLoading, refetch } = trpc.menu.getAllMenuItems.useQuery()
	const { mutateAsync: updateMenuItem } = trpc.menu.updateMenuItem.useMutation()
	const { mutateAsync: deleteMenuItem } = trpc.menu.deleteMenuItem.useMutation()
	const router = useRouter()

	useEffect(() => {
		if (!menuItems || menuItems.length === 0) return

		let itemsFiltered = menuItems.map(item => ({
			...item,
			category: item.category as MenuItemCategory, // Przeliczanie typu
		}))

		// Filtrowanie po kategoriach
		if (categoryFilter !== 'all') {
			itemsFiltered = itemsFiltered.filter(item => item.category === categoryFilter)
		}

		// Filtrowanie po aktywności
		if (isOrderableFilter !== 'all') {
			const isOrderableValue = isOrderableFilter === 'true'
			itemsFiltered = itemsFiltered.filter(item => item.isOrderable === isOrderableValue)
		}

		// Filtrowanie po rekomendowanych
		if (isRecommendedFilter !== 'all') {
			const isRecommendedValue = isRecommendedFilter === 'true'
			itemsFiltered = itemsFiltered.filter(item => item.isRecommended === isRecommendedValue)
		}

		// Sortowanie
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
	}, [menuItems, sortOption, categoryFilter, isOrderableFilter, isRecommendedFilter])

	const handleToggleIsOrderable = async (id: string, value: boolean) => {
		await updateMenuItem({ id, isOrderable: value })
		refetch()
	}

	const handleToggleIsRecommended = async (id: string, value: boolean) => {
		await updateMenuItem({ id, isRecommended: value })
		refetch()
	}

	const handleDelete = async (id: string) => {
		await deleteMenuItem({ id })
		refetch()
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
				<Button className='rounded-lg h-auto' onClick={handleAddNewItem}><FiPlus /> Dodaj</Button>
			</div>
			<div className="flex gap-4 mb-4">
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
				<Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as MenuItemCategory | 'all')}>
					<SelectTrigger aria-label="Kategorie">
						<SelectValue placeholder='Filtruj' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Wszystkie</SelectItem>
						{Array.from(new Set(menuItems.map(item => item.category as MenuItemCategory))).map(category => (
							<SelectItem key={category} value={category}>{category}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={isOrderableFilter} onValueChange={setIsOrderableFilter}>
					<SelectTrigger aria-label="Aktywność">
						<SelectValue placeholder='Filtruj po aktywności' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Wszystkie</SelectItem>
						<SelectItem value="true">Aktywne</SelectItem>
						<SelectItem value="false">Nieaktywne</SelectItem>
					</SelectContent>
				</Select>
				<Select value={isRecommendedFilter} onValueChange={setIsRecommendedFilter}>
					<SelectTrigger aria-label="Rekomendacje">
						<SelectValue placeholder='Filtruj po rekomendacjach' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Wszystkie</SelectItem>
						<SelectItem value="true">Rekomendowane</SelectItem>
						<SelectItem value="false">Nierekomendowane</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<Skeleton className="h-40 w-full" />
			) : (
				<table className="min-w-full">
					<thead>
						<tr>
							<th className="px-6 py-3 border-b-2 border-gray-300">LP</th>
							<th className="px-6 py-3 border-b-2 border-gray-300">Obraz</th>
							<th className="px-6 py-3 border-b-2 border-gray-300">Nazwa</th>
							<th className="px-6 py-3 border-b-2 border-gray-300">Kategoria</th>
							<th className="px-6 py-3 border-b-2 border-gray-300">Cena</th>
							<th className="px-6 py-3 border-b-2 border-gray-300">Aktywne</th>
							<th className="px-6 py-3 border-b-2 border-gray-300">Rekomendowane</th>
							<th className="px-6 py-3 border-b-2 border-gray-300">Akcje</th>
						</tr>
					</thead>
					<tbody>
						{sortedItems.map((item, index) => (
							<tr key={item.id}>
								<td className="px-6 py-4 border-b border-gray-200 text-center">{index + 1}</td>
								<td className="px-6 py-4 border-b border-gray-200 text-center">
									<ImageWithFallback
										src={item.image ?? ''}
										alt={item.name}
										width={48}
										height={48}
										className="h-12 w-12 object-cover"
										containerClassName="h-12 w-12"
									/>
								</td>
								<td className="px-6 py-4 border-b border-gray-200 text-secondary cursor-pointer" onClick={() => handleEdit(item.id)}>
									{item.name}
								</td>
								<td className="px-6 py-4 border-b border-gray-200">{item.category}</td>
								<td className="px-6 py-4 border-b border-gray-200 text-right">{item.price} zł</td>
								<td className="px-6 py-4 border-b border-gray-200 text-center">
									<Switch
										checked={item.isOrderable}
										onCheckedChange={(value) => handleToggleIsOrderable(item.id, value)}
									/>
								</td>
								<td className="px-6 py-4 border-b border-gray-200 text-center">
									<Switch
										checked={item.isRecommended}
										onCheckedChange={(value) => handleToggleIsRecommended(item.id, value)}
									/>
								</td>
								<td className="px-6 py-4 border-b border-gray-200 text-center space-x-2">
									<button className="text-blue-600" onClick={() => handleEdit(item.id)}>Edytuj</button>
									<button className="text-red-600" onClick={() => handleDelete(item.id)}>Usuń</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	)
}

export default MenuTable
