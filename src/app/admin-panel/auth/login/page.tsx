// app/auth/login/page.tsx
'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
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
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-secondary/35 blur-3xl" />
				<div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-primary/35 blur-3xl" />
			</div>

			<div className="relative z-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-2xl lg:grid-cols-2">
				<section className="hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
					<div>
						<p className="text-xs uppercase tracking-[0.24em] text-slate-300">Spoko Sopot</p>
						<h1 className="mt-3 text-3xl font-semibold leading-tight">
							Panel administracyjny
						</h1>
						<p className="mt-4 text-sm leading-6 text-slate-300">
							Zarządzaj zamówieniami, menu i ustawieniami restauracji z jednego miejsca.
						</p>
					</div>
					<p className="text-xs text-slate-400">
						Bezpieczny dostęp tylko dla kont z uprawnieniami administracyjnymi.
					</p>
				</section>

				<Card className="w-full border-0 bg-transparent shadow-none">
					<CardHeader className="px-6 pb-4 pt-8 sm:px-10">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 lg:hidden">
							Spoko Admin
						</p>
						<CardTitle className="text-2xl font-semibold text-slate-900">Logowanie</CardTitle>
						<p className="text-sm text-slate-500">
							Podaj dane konta administratora, aby przejść do panelu.
						</p>
				</CardHeader>
					<CardContent className="px-6 pb-2 sm:px-10">
					<Form {...form}>
							<form onSubmit={form.handleSubmit(handleLogin)} className="space-y-5">
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
					<CardFooter className="px-6 pb-8 pt-3 text-sm text-slate-500 sm:px-10">
						<p>Brak dostępu? Skontaktuj się z właścicielem systemu.</p>
				</CardFooter>
			</Card>
			</div>
		</div>
	)
}

export default LoginPage
