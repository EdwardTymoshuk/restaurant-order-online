'use client'

import MenuItemForm from '@/app/admin-panel/components/MenuItemForm'
import PageSubHeader from '@/app/components/PageSubHeader'
import { Button } from '@/app/components/ui/button'
import { trpc } from '@/utils/trpc'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MdKeyboardArrowLeft } from 'react-icons/md'

const CreateMenuItemPage = () => {
	const { mutateAsync: createMenuItem } = trpc.menu.createMenuItem.useMutation()
	const router = useRouter()

	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (values: {
		name: string
		price: number
		description: string
		category: string
		image: string
		isOrderable: boolean
		isRecommended: boolean
	}) => {
		setIsLoading(true)
		try {
			await createMenuItem(values)
			router.push('/admin-panel?tab=menu')
		} catch (error) {
			console.error("Nie udało się dodać nowej pozycji menu:", error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<Button variant="link" onClick={() => router.push('/admin-panel?tab=menu')} className='p-0 text-secondary'>
				<MdKeyboardArrowLeft size={24} /><span>Wróć do menu</span>
			</Button>
			<PageSubHeader title="Dodaj nową pozycję" />

			<MenuItemForm
				initialValues={{
					name: '',
					price: 0,
					description: '',
					category: 'Inne',
					image: '',
					isOrderable: true,
					isRecommended: false,
				}}
				isLoading={isLoading}
				onSubmit={handleSubmit}
			/>
		</div>
	)
}

export default CreateMenuItemPage
