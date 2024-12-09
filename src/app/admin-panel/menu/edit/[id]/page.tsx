'use client'

import MenuItemForm from '@/app/admin-panel/components/MenuItemForm'
import PageSubHeader from '@/app/components/PageSubHeader'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
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
		isOnMainPage: boolean
	}) => {
		try {
			await updateMenuItem({ id: params.id, ...values })
			console.log('Menu item updated successfully')
		} catch (error) {
			console.error("Failed to update menu item:", error)
		}
	}

	if (isLoading || !menuItem) {
		return (
			<div className="container mx-auto space-y-8 px-4 py-6">
				<Skeleton className='h-8 w-1/6 lg:w-1/12' />
				<Skeleton className='h-14 w-1/2 mx-auto' />
				<Skeleton className='h-10 w-full mx-auto' />
				<div className='flex flex-row gap-4'>
					<Skeleton className='h-10 w-full mx-auto' />
					<Skeleton className='h-10 w-full mx-auto' />
				</div>
				<Skeleton className='h-32 w-full mx-auto' />
				<Skeleton className='h-52 w-full md:w-1/6' />
				<Skeleton className='h-32 w-full mx-auto' />
				<Skeleton className='h-8 w-1/6 lg:w-1/12 justify-end' />
			</div>
		)
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
					isOnMainPage: menuItem.isOnMainPage,
				}}
				isLoading={false}
				onSubmit={handleSubmit}
			/>
		</div>
	)
}

export default EditMenuItemPage
