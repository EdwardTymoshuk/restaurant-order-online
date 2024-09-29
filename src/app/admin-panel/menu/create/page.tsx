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
import { Textarea } from "@/app/components/ui/textarea"
import { MenuItemCategory } from '@/app/types'
import { Checkbox } from '@/components/ui/checkbox'
import { menuItemCategories } from '@/config'
import { trpc } from '@/utils/trpс'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MdKeyboardArrowLeft } from 'react-icons/md'

const CreateMenuItemPage = () => {
	const { mutateAsync: createMenuItem } = trpc.menu.createMenuItem.useMutation()
	const router = useRouter()

	const [name, setName] = useState('')
	const [price, setPrice] = useState(0)
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState<MenuItemCategory>('Inne')
	const [image, setImage] = useState('')
	const [isOrderable, setIsOrderable] = useState(true)
	const [isRecommended, setIsRecommended] = useState(false)

	const handleImageUpload = (imageUrl: string) => {
		setImage(imageUrl)
	}

	const handleSubmit = async () => {
		try {
			await createMenuItem({
				name,
				price,
				description,
				category,
				image,
				isOrderable,
				isRecommended,
			})
			router.push('/admin-panel?tab=menu')
		} catch (error) {
			console.error("Nie udało się dodać nowej pozycji menu:", error)
		}
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<Button variant="link" onClick={() => router.push('/admin-panel/menu')} className='p-0 text-secondary'>
				<MdKeyboardArrowLeft size={24} /><span>Wróć do menu</span>
			</Button>
			<div className="flex justify-between items-center mb-6">
				<PageSubHeader title="Dodaj nową pozycję" />
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

					<div className="flex items-center space-x-2">
						<Checkbox
							id="isOrderable"
							checked={isOrderable}
							onCheckedChange={(value) => setIsOrderable(value as boolean)}
						/>
						<label htmlFor="isOrderable" className="font-medium text-secondary">Aktywne</label>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="isRecommended"
							checked={isRecommended}
							onCheckedChange={(value) => setIsRecommended(value as boolean)}
						/>
						<label htmlFor="isRecommended" className="font-medium text-secondary">Rekomendowane</label>
					</div>
				</div>

				<div className="text-right">
					<Button variant='default' onClick={handleSubmit}>Dodaj</Button>
				</div>
			</div>
		</div>
	)
}

export default CreateMenuItemPage
