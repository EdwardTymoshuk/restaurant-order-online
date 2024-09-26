'use client'

import ImageUploader from '@/app/admin-panel/components/ImageUploader'
import PageSubHeader from '@/app/components/PageSubHeader'
import { Button } from '@/app/components/ui/button'
import { Input } from "@/app/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/app/components/ui/select"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Textarea } from "@/app/components/ui/textarea"
import { MenuItemCategory } from '@/app/types'
import { menuItemCategories } from '@/config'
import { trpc } from '@/utils/trps'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MdKeyboardArrowLeft } from 'react-icons/md'

const EditMenuItemPage = ({ params }: { params: { id: string } }) => {
	const { data: menuItem, isLoading } = trpc.menu.getMenuItemById.useQuery({ id: params.id })
	const { mutateAsync: updateMenuItem } = trpc.menu.updateMenuItem.useMutation()
	const router = useRouter()

	const [name, setName] = useState('')
	const [price, setPrice] = useState(0)
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState<MenuItemCategory>('Inne')
	const [image, setImage] = useState('')

	useEffect(() => {
		if (menuItem) {
			setName(menuItem.name)
			setPrice(menuItem.price)
			setDescription(menuItem.description || '')
			setCategory(menuItem.category as MenuItemCategory)
			setImage(menuItem.image || '')
		}
	}, [menuItem])

	const handleImageUpload = (imageUrl: string) => {
		console.log('Image url:', imageUrl)
		setImage(imageUrl)
	}

	const handleSubmit = async () => {
		try {
			await updateMenuItem({
				id: params.id,
				name,
				price,
				description,
				category,
				image,
			})
			router.push('/admin-panel?tab=menu')
		} catch (error) {
			console.error("Failed to update menu item:", error)
		}
	}


	if (isLoading) {
		return <Skeleton className="h-40 w-full" />
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<Button variant="link" onClick={() => router.push('/admin-panel?tab=menu')} className='p-0 text-secondary'>
				<MdKeyboardArrowLeft size={24} /><span>Wróć do menu</span>
			</Button>
			<div className="flex justify-between items-center mb-6">
				<PageSubHeader title={`Edytuj pozycję ${name}`} />
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<label className="block font-medium text-secondary">Nazwa</label>
					<Input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nazwa"
					/>
					<div className='flex flex-col md:flex-row gap-4'>
						<div className='w-full'>
							<label className="block font-medium text-secondary">Cena (PLN)</label>
							<Input
								type="number"
								value={price}
								onChange={(e) => setPrice(parseFloat(e.target.value))}
								placeholder="Cena"
							/>
						</div>
						<div className='w-full'>
							<label className="block font-medium text-secondary">Kategoria</label>
							<Select
								value={category}
								onValueChange={(val) => setCategory(val as MenuItemCategory)}
							>
								<SelectTrigger aria-label="Kategoria">
									<SelectValue placeholder="Wybierz kategorię" />
								</SelectTrigger>
								<SelectContent>
									{menuItemCategories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<label className="block font-medium text-secondary">Opis</label>
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Opis"
					/>

					<label className="block font-medium text-secondary">Zdjęcie</label>
					<ImageUploader onImageUpload={handleImageUpload} productTitle={name} />
				</div>

				<div className="text-right">
					<Button variant='default' onClick={handleSubmit}>Zapisz</Button>
				</div>
			</div>
		</div>
	)
}

export default EditMenuItemPage
