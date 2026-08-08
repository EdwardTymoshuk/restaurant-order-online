// app/components/AddUserDialog.tsx
'use client'

import { Button } from '@/app/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { trpc } from '@/utils/trpc'
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@/lib/roles'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Валідація через Zod
const userSchema = z.object({
	username: z.string().min(2, 'Wymagana nazwa użytkownika'),
	email: z.string().email('Podaj prawidłowy email'),
	password: z.string().min(6, 'Wymagane hasło o długości co najmniej 6 znaków'),
	name: z.string().optional(),
	role: z.enum(['user', 'manager', 'admin'], { required_error: 'Wymagana rola' }),
	permissions: z.array(z.string()).default([]),
})

type UserFormData = z.infer<typeof userSchema>

interface AddUserDialogProps {
	onSuccess: () => void
}

const AddUserDialog = ({ onSuccess }: AddUserDialogProps) => {
	const form = useForm<UserFormData>({
		resolver: zodResolver(userSchema),
		defaultValues: { username: '', email: '', password: '', name: '', role: 'user', permissions: [] },
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
		mutate(data)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email logowania</FormLabel>
							<FormControl><Input {...field} type="email" placeholder="np. kelner@spokosopot.pl" autoComplete="email" /></FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nazwa wyświetlana</FormLabel>
							<FormControl>
								<Input {...field} placeholder="np. Kasia" autoComplete="off" />
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
					name="permissions"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Uprawnienia</FormLabel>
							<div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
								{ALL_PERMISSIONS.map((permission) => (
									<label key={permission} className="flex items-center gap-2 text-sm text-slate-700">
										<input type="checkbox" className="size-4 accent-primary" checked={field.value.includes(permission)} onChange={(event) => field.onChange(event.target.checked ? [...field.value, permission] : field.value.filter((item) => item !== permission))} />
										{PERMISSION_LABELS[permission]}
									</label>
								))}
							</div>
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
										<SelectItem value="user">Kelner</SelectItem>
										<SelectItem value="manager">Manager</SelectItem>
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
