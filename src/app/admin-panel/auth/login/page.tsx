// app/auth/login/page.tsx
'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const loginSchema = z.object({
	identifier: z.string().nonempty('Wprowadź nazwę użytkownika lub email'),
	password: z.string().min(6, 'Wprowadź hasło o długości co najmniej 6 znaków'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage = () => {
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	})

	const handleLogin = async (data: LoginFormData) => {
		setError(null)
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
			await getSession()
			router.push('/admin-panel')
		}
	}

	return (
		<div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-8">
			<div className="w-full max-w-md">
				<div className="mb-6 flex justify-center">
					<div className="flex h-16 w-36 items-center justify-center rounded-xl bg-secondary px-5 shadow-sm">
						<Image
							src="/img/logo-admin.svg"
							alt="Spoko"
							width={120}
							height={64}
							priority
							className="h-auto w-full"
						/>
					</div>
				</div>

				<Card className="overflow-hidden rounded-xl border-border bg-white shadow-sm">
					<CardHeader className="border-b border-border px-6 pb-5 pt-6">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
							Spoko Sopot
						</p>
						<CardTitle className="mt-2 text-2xl font-semibold text-slate-950">Panel administracyjny</CardTitle>
						<p className="text-sm leading-6 text-slate-500">
							Zaloguj się, aby zarządzać zamówieniami, rezerwacjami i treściami restauracji.
						</p>
					</CardHeader>
					<CardContent className="px-6 pb-2 pt-6">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
								<FormField
									name="identifier"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-slate-700">Nazwa użytkownika lub email</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder="np. admin@spokosopot.pl"
													autoComplete="username"
													className="h-11"
												/>
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
											<FormLabel className="text-slate-700">Hasło</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="password"
													placeholder="Wprowadź hasło"
													autoComplete="current-password"
													className="h-11"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{error && (
									<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
										{error}
									</p>
								)}
								<LoadingButton
									isLoading={isLoading}
									type="submit"
									className="mt-2 h-11 w-full rounded-lg"
								>
									Zaloguj się
								</LoadingButton>
							</form>
						</Form>
					</CardContent>
					<CardFooter className="border-t border-border px-6 py-4 text-sm text-slate-500">
						<p>Dostęp tylko dla kont z uprawnieniami panelu.</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}

export default LoginPage
