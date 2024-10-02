'use client'

import ImageUploader from '@/app/admin-panel/components/ImageUploader'
import LoadingButton from '@/app/components/LoadingButton'
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { MenuItemCategory } from '@/app/types'
import { Checkbox } from '@/components/ui/checkbox'
import { menuItemCategories } from '@/config'
import { useEffect, useState } from 'react'

interface MenuItemFormProps {
	initialValues: {
		name: string
		price: number
		description: string
		category: MenuItemCategory
		image: string
		isOrderable: boolean
		isRecommended: boolean
	}
	isLoading: boolean
	onSubmit: (values: {
		name: string
		price: number
		description: string
		category: MenuItemCategory
		image: string
		isOrderable: boolean
		isRecommended: boolean
	}) => void
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ initialValues, isLoading, onSubmit }) => {
	const [name, setName] = useState(initialValues.name)
	const [price, setPrice] = useState(initialValues.price)
	const [description, setDescription] = useState(initialValues.description)
	const [category, setCategory] = useState<MenuItemCategory>(initialValues.category)
	const [image, setImage] = useState(initialValues.image)
	const [isOrderable, setIsOrderable] = useState(initialValues.isOrderable)
	const [isRecommended, setIsRecommended] = useState(initialValues.isRecommended)

	const [errors, setErrors] = useState<{ name?: string; price?: string }>({}) // Стан для помилок

	useEffect(() => {
		setName(initialValues.name)
		setPrice(initialValues.price)
		setDescription(initialValues.description)
		setCategory(initialValues.category)
		setImage(initialValues.image)
		setIsOrderable(initialValues.isOrderable)
		setIsRecommended(initialValues.isRecommended)
	}, [initialValues])

	const handleImageUpload = (imageUrl: string) => {
		setImage(imageUrl)
	}

	const validateForm = () => {
		const newErrors: { name?: string; price?: string } = {}
		if (!name) {
			newErrors.name = 'Nazwa produktu jest obowiązkowa'
		}
		if (price <= 0) {
			newErrors.price = 'Cena musi być większa niż zero'
		}
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = () => {
		if (validateForm()) {
			onSubmit({
				name,
				price,
				description,
				category,
				image,
				isOrderable,
				isRecommended,
			})
		}
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<label className="block font-medium text-secondary">Nazwa</label>
				<Input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Nazwa"
				/>
				{errors.name && <p className="text-red-600">{errors.name}</p>} {/* Помилка валідації */}

				<div className='flex flex-col md:flex-row gap-4'>
					<div className='w-full'>
						<label className="block font-medium text-secondary">Cena (PLN)</label>
						<Input
							type="number"
							value={price}
							onChange={(e) => setPrice(parseFloat(e.target.value))}
							placeholder="Cena"
						/>
						{errors.price && <p className="text-red-600">{errors.price}</p>} {/* Помилка валідації */}
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
				<ImageUploader
					onImageUpload={handleImageUpload}
					productTitle={name}
					currentImage={image}
					disabled={!name}  // Якщо назва порожня, то поле неактивне
				/>

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
					<label htmlFor="isRecommended" className="font-medium text-secondary">Polecane</label>
				</div>
			</div>

			<div className="text-right">
				<LoadingButton isLoading={isLoading} onClick={handleSubmit}>
					Zapisz
				</LoadingButton>
			</div>
		</div>
	)
}

export default MenuItemForm
