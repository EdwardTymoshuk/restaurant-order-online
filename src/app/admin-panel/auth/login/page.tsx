// app/auth/login/page.tsx
'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Валідація через Zod
const loginSchema = z.object({
	identifier: z.string().nonempty('Wprowadź nazwę użytkownika lub email'),
	password: z.string().min(6, 'Wprowadź hasło o długości co najmniej 6 znaków'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage = () => {
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	// Ініціалізація форми
	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	})

	// Обробка логування
	const handleLogin = async (data: LoginFormData) => {
		setIsLoading(true)
		const result = await signIn('credentials', {
			redirect: false,
			identifier: data.identifier,
			password: data.password,
		})

		if (result?.error) {
			setError('Nieprawidłowa nazwa użytkownika lub hasło')
			setIsLoading(false)
		} else {
			router.push('/admin-panel')
		}
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<Card className="w-full max-w-md shadow-md">
				<CardHeader>
					<CardTitle className="text-center">Logowanie</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
							<FormField
								name="identifier"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nazwa użytkownika lub email</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Wprowadź nazwę lub email" autoComplete="off" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="password"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hasło</FormLabel>
										<FormControl>
											<Input {...field} type="password" placeholder="Wprowadź hasło" autoComplete="off" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{error && <p className="text-red-500 text-sm">{error}</p>}
							<LoadingButton isLoading={isLoading} type="submit" className="w-full mt-4">
								Zaloguj się
							</LoadingButton>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="text-center text-sm text-gray-500">
					<p>Nie masz konta? Skontaktuj się z administratorem.</p>
				</CardFooter>
			</Card>
		</div>
	)
}

export default LoginPage
