'use client'

import MenuItemForm from '@/app/admin-panel/components/MenuItemForm'
import { AdminNavbar } from '@/app/admin-panel/components/AdminNavbar'
import { Button } from '@/app/components/ui/button'
import { trpc } from '@/utils/trpc'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
		isActive: boolean
		isRecommended: boolean
		isOnMainPage: boolean
		isOrderable: boolean
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
						<h1 className="font-serif text-2xl font-semibold text-slate-950 md:text-3xl">
							Dodaj nową pozycję
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Uzupełnij dane pozycji, zdjęcie i ustawienia widoczności.
						</p>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
				<MenuItemForm
					initialValues={{
						name: '',
						price: 0,
						description: '',
						category: 'Inne',
						image: '',
						isActive: true,
						isRecommended: false,
						isOnMainPage: false,
						isOrderable: false,
					}}
					isLoading={isLoading}
					onSubmit={handleSubmit}
				/>
			</main>
		</div>
	)
}

export default CreateMenuItemPage
