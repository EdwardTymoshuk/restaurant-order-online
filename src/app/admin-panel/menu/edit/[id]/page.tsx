'use client'

import MenuItemForm from '@/app/admin-panel/components/MenuItemForm'
import { AdminNavbar } from '@/app/admin-panel/components/AdminNavbar'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import { MenuItemCategory } from '@/app/types/types'
import { trpc } from '@/utils/trpc'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
		isActive: boolean
		isRecommended: boolean
		isOnMainPage: boolean
		isOrderable: boolean
	}) => {
		try {
			await updateMenuItem({ id: params.id, ...values })
		} catch (error) {
			console.error("Failed to update menu item:", error)
		}
	}

	if (isLoading || !menuItem) {
		return (
			<div className="min-h-screen bg-muted/40 pt-14">
				<AdminNavbar activeTab="menu" />
				<div className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
					<Skeleton className="h-24 w-full rounded-2xl" />
					<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
						<Skeleton className="h-[420px] rounded-2xl" />
						<div className="space-y-5">
							<Skeleton className="h-[300px] rounded-2xl" />
							<Skeleton className="h-[240px] rounded-2xl" />
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-muted/40 pt-14">
			<AdminNavbar activeTab="menu" />
			<header className="border-b border-border bg-white">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6">
					<div className="min-w-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.push('/admin-panel?tab=menu')}
							className="mb-2 -ml-2 gap-1.5 text-slate-600"
						>
							<ArrowLeft size={16} />
							Wróć do menu
						</Button>
						<h1 className="truncate font-serif text-2xl font-semibold text-slate-950 md:text-3xl">
							Edytuj pozycję
						</h1>
						<p className="mt-1 truncate text-sm text-muted-foreground">
							{menuItem.name}
						</p>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
				<MenuItemForm
					initialValues={{
						name: menuItem.name,
						price: menuItem.price,
						description: menuItem.description || '',
						category: menuItem.category as MenuItemCategory,
						image: menuItem.image || '',
						isActive: menuItem.isActive,
						isOrderable: menuItem.isOrderable,
						isRecommended: menuItem.isRecommended,
						isOnMainPage: menuItem.isOnMainPage,
					}}
					isLoading={false}
					onSubmit={handleSubmit}
				/>
			</main>
		</div>
	)
}

export default EditMenuItemPage
