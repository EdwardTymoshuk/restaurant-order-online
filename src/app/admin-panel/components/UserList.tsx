'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { trpc } from '@/utils/trpc'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { useState } from 'react'
import AddUserDialog from '../components/AddUserDialog'

const UserList = () => {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [userToDelete, setUserToDelete] = useState<string | null>(null) // ID користувача для видалення

	const queryClient = useQueryClient()
	const queryKey = getQueryKey(trpc.user.getAllUsers)

	const { data: users, isLoading } = trpc.user.getAllUsers.useQuery()
	const { mutate } = trpc.user.deleteUser.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries(queryKey)
		},
	})

	// Обробка підтвердження видалення користувача
	const handleDeleteUser = () => {
		if (userToDelete) {
			mutate({ userId: userToDelete })
			setUserToDelete(null)
			setIsDeleteDialogOpen(false)
		}
	}

	return (
		<div>
			<Accordion type="single" collapsible >
				<AccordionItem value="users" className='border-none'>
					<AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
						Lista użytkowników
					</AccordionTrigger>
					<AccordionContent>
						{isLoading ? (
							<div className="space-y-2">
								<Skeleton className="w-full h-8" />
								<Skeleton className="w-full h-8" />
								<Skeleton className="w-full h-8" />
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table className="min-w-full ">
									<TableHeader>
										<TableRow>
											<TableHead className="py-2 px-4 text-left text-text-foreground">Nazwa użytkownika</TableHead>
											<TableHead className="py-2 px-4 text-left text-text-foreground">Imię</TableHead>
											<TableHead className="py-2 px-4 text-left text-text-foreground">Rola</TableHead>
											<TableHead className="py-2 px-4 text-left text-text-foreground">Akcja</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{users?.map((user) => (
											<TableRow key={user.id}>
												<TableCell className="py-2 px-4">{user.username}</TableCell>
												<TableCell className="py-2 px-4">{user.name ? user.name : 'Brak'}</TableCell>
												<TableCell className="py-2 px-4">{user.role}</TableCell>
												<TableCell className="py-2 px-4">
													<Button
														variant="link"
														className='text-danger p-0'
														onClick={() => {
															setUserToDelete(user.id)
															setIsDeleteDialogOpen(true)
														}}
													>
														Usuń
													</Button>
												</TableCell>
											</TableRow>
										)
										)}
									</TableBody>
								</Table>
								<div className="mt-4">
									<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
										<DialogTrigger asChild>
											<Button variant="default">Dodaj użytkownika</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Dodaj nowego użytkownika</DialogTitle>
											</DialogHeader>
											<AddUserDialog onSuccess={() => setIsDialogOpen(false)} />
										</DialogContent>
									</Dialog>
								</div>
							</div>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			{/* Підтвердження видалення користувача */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Potwierdź usunięcie użytkownika</DialogTitle>
					</DialogHeader>
					<p className="mb-4">Czy na pewno chcesz usunąć tego użytkownika?</p>
					<div className="flex justify-end space-x-4">
						<Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
							Anuluj
						</Button>
						<Button variant="destructive" onClick={handleDeleteUser}>
							Usuń
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default UserList
