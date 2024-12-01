'use client'

import MenuItemForm from '@/app/admin-panel/components/MenuItemForm'
import PageSubHeader from '@/app/components/PageSubHeader'
import { Button } from '@/app/components/ui/button'
import { MenuItemCategory } from '@/app/types/types'
import { trpc } from '@/utils/trpc'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { MdKeyboardArrowLeft } from 'react-icons/md'

const EditMenuItemPage = ({ params }: { params: { id: string } }) => {
	const { data: menuItem, isLoading } = trpc.menu.getMenuItemById.useQuery({ id: params.id })
	const queryClient = useQueryClient()
	const router = useRouter()

	const { mutateAsync: updateMenuItem } = trpc.menu.updateMenuItem.useMutation({
		onSuccess: async () => {
			await queryClient.invalidateQueries(['menu.getAllMenuItems'])
			router.push('/admin-panel?tab=menu')
		},
	})

	const handleSubmit = async (values: {
		name: string
		price: number
		description: string
		category: MenuItemCategory
		image: string
		isOrderable: boolean
		isRecommended: boolean
	}) => {
		try {
			await updateMenuItem({ id: params.id, ...values })
			console.log('Menu item updated successfully')
		} catch (error) {
			console.error("Failed to update menu item:", error)
		}
	}

	if (isLoading || !menuItem) {
		return <div>Loading...</div>
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<Button variant="link" onClick={() => router.push('/admin-panel?tab=menu')} className='p-0 text-secondary'>
				<MdKeyboardArrowLeft size={24} /><span>Wróć do menu</span>
			</Button>
			<PageSubHeader title={`Edytuj pozycję ${menuItem.name}`} />

			<MenuItemForm
				initialValues={{
					name: menuItem.name,
					price: menuItem.price,
					description: menuItem.description || '',
					category: menuItem.category as MenuItemCategory,
					image: menuItem.image || '',
					isOrderable: menuItem.isOrderable,
					isRecommended: menuItem.isRecommended,
				}}
				isLoading={false}
				onSubmit={handleSubmit}
			/>
		</div>
	)
}

export default EditMenuItemPage
