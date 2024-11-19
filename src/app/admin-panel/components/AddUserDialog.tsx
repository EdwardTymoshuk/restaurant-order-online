// app/components/AddUserDialog.tsx
'use client'

import { Button } from '@/app/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { trpc } from '@/utils/trpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Валідація через Zod
const userSchema = z.object({
	username: z.string().min(2, 'Wymagana nazwa użytkownika'),
	password: z.string().min(6, 'Wymagane hasło o długości co najmniej 6 znaków'),
	name: z.string().optional(),
	role: z.enum(['user', 'admin'], { required_error: 'Wymagana rola' }),
})

type UserFormData = z.infer<typeof userSchema>

interface AddUserDialogProps {
	onSuccess: () => void
}

const AddUserDialog = ({ onSuccess }: AddUserDialogProps) => {
	const form = useForm<UserFormData>({
		resolver: zodResolver(userSchema),
	})

	const queryClient = useQueryClient()
	const queryKey = getQueryKey(trpc.user.getAllUsers)

	const { mutate, isLoading } = trpc.user.createUser.useMutation({
		onSuccess: () => {
			form.reset()
			onSuccess()
			queryClient.invalidateQueries(queryKey)
		},
	})

	const onSubmit = (data: UserFormData) => {
		console.log(data)
		mutate(data)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nazwa użytkownika</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Wprowadź nazwę użytkownika" autoComplete="off" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Hasło</FormLabel>
							<FormControl>
								<Input type="password" {...field} placeholder="Wprowadź hasło" autoComplete="new-password" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Imię</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Wprowadź imię (opcjonalne)" autoComplete="off" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Rola</FormLabel>
							<FormControl>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<SelectTrigger className="mt-1">
										<SelectValue placeholder="Wybierz rolę" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="user">Pracownik</SelectItem>
										<SelectItem value="admin">Administrator</SelectItem>
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isLoading}>
					{isLoading ? 'Dodawanie...' : 'Dodaj użytkownika'}
				</Button>
			</form>
		</Form>
	)
}

export default AddUserDialog
