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
		<div className="h-dvh overflow-y-auto bg-secondary md:bg-muted">
			<div className="flex min-h-full flex-col items-center justify-center px-4 py-8 md:px-8">

				{/* Logo — mobile only, above card */}
				<div className="mb-6 flex justify-center lg:hidden">
					<Image
						src="/img/logo-admin.svg"
						alt="Spoko"
						width={140}
						height={74}
						priority
						className="h-auto w-36"
					/>
				</div>

				<div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl lg:grid lg:grid-cols-[0.95fr_1fr]">
					{/* Panel lewy — tylko desktop */}
					<section className="hidden min-h-[580px] flex-col justify-between bg-secondary p-10 text-white lg:flex">
						<div>
							<Image
								src="/img/logo-admin.svg"
								alt="Spoko"
								width={150}
								height={79}
								priority
								className="h-auto w-36"
							/>
							<p className="mt-12 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
								Spoko Sopot
							</p>
							<h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">
								Panel administracyjny restauracji
							</h1>
							<p className="mt-5 max-w-md text-sm leading-7 text-white/75">
								Jedno miejsce do obsługi zamówień, rezerwacji, menu, galerii i treści widocznych dla gości.
							</p>
						</div>

						<div className="grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
							<div>
								<p className="text-xs uppercase tracking-[0.16em] text-white/45">Zamówienia</p>
								<p className="mt-2 text-sm font-semibold text-white">obsługa online</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.16em] text-white/45">Rezerwacje</p>
								<p className="mt-2 text-sm font-semibold text-white">kalendarz sali</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.16em] text-white/45">Strona</p>
								<p className="mt-2 text-sm font-semibold text-white">menu i treści</p>
							</div>
						</div>
					</section>

					{/* Formularz */}
					<section className="flex min-h-[480px] items-center justify-center px-5 py-10 sm:px-10">
						<Card className="w-full max-w-md border-0 bg-transparent shadow-none">
							<CardHeader className="px-0 pb-7">
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
									Logowanie
								</p>
								<CardTitle className="mt-3 text-3xl font-semibold text-slate-950">Wejdź do panelu</CardTitle>
								<p className="mt-2 text-sm leading-6 text-slate-500">
									Podaj dane konta z uprawnieniami administracyjnymi.
								</p>
							</CardHeader>
							<CardContent className="px-0 pb-2">
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
							<CardFooter className="px-0 pt-5 text-sm text-slate-500">
								<p>Dostęp tylko dla osób obsługujących panel Spoko.</p>
							</CardFooter>
						</Card>
					</section>
				</div>
			</div>
		</div>
	)
}

export default LoginPage
