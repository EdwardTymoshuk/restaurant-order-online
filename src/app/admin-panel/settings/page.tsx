'use client'

import { Button } from '@/app/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/app/components/ui/table'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { trpc } from '@/utils/trpc'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import UserList from '../components/UserList'

import DeliveryZonesSettings from '@/app/components/DeliveryZonesSettings'
import LoadingButton from '@/app/components/LoadingButton'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/app/components/ui/accordion'
import { DeliveryZone } from '@/app/types/types'
import Image from 'next/image'
import { toast } from 'sonner'
import BannerUploader from '../components/BannerUploader'

interface PromoCode {
	id: string
	code: string
	discountType: 'FIXED' | 'PERCENTAGE'
	discountValue: number
	isActive: boolean
	isUsed: boolean
	expiresAt: Date | null
	isOneTimeUse: boolean
}

interface Banner {
	id: string
	imageUrl: string
	linkUrl: string | null
	position: number | null
}


const Settings = () => {
	const isAdmin = useIsAdmin()


	// Отримуємо налаштування
	const { data: settingsData, refetch: refetchSettings } = trpc.settings.getSettings.useQuery()
	const updateOrderingState = trpc.settings.updateOrderingState.useMutation({
		onSuccess: () => {
			refetchSettings()
		},
	})
	const updateDeliveryCost = trpc.settings.updateDeliveryCost.useMutation({
		onSuccess: () => {
			refetchSettings()
		},
	})
	const updateOrderWaitTime = trpc.settings.updateOrderWaitTime.useMutation({
		onSuccess: () => {
			refetchSettings()
		},
	})
	const updateDeliveryZonePrices = trpc.settings.updateDeliveryZonePrices.useMutation({
		onSuccess: () => {
			refetchSettings()
		},
	})


	// Стан для налаштувань
	const [isOrderingOpen, setIsOrderingOpen] = useState<boolean>(false)
	const [orderWaitTime, setOrderWaitTime] = useState<number>(30)
	const [deliveryCost, setDeliveryCost] = useState<number>(5)
	const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])

	// Отримуємо промокоди
	const { data: promoCodesData, refetch: refetchPromoCodes } = trpc.promoCode.getAllPromoCodes.useQuery()
	const createPromoCode = trpc.promoCode.createPromoCode.useMutation({
		onSuccess: () => {
			refetchPromoCodes()
		},
	})
	const deletePromoCode = trpc.promoCode.deletePromoCode.useMutation({
		onSuccess: () => {
			refetchPromoCodes()
		},
	})

	// Отримуємо банери
	const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null)
	const { data: bannersData, refetch: refetchBanners } = trpc.banner.getAllBanners.useQuery()

	const createBanner = trpc.banner.createBanner.useMutation({
		onSuccess: () => {
			refetchBanners()
		},
	})

	const deleteBanner = trpc.banner.deleteBanner.useMutation({
		onMutate: (variables) => {
			setDeletingBannerId(variables.id) // Зберігаємо ID банера, який видаляється
		},
		onSuccess: () => {
			setDeletingBannerId(null) // Скидаємо ID після успішного виконання
			refetchBanners()
		},
		onError: () => {
			setDeletingBannerId(null) // Скидаємо ID у випадку помилки
		},
	})

	const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
	const [banners, setBanners] = useState<Banner[]>([])
	const [isPromoCodeDialogOpen, setIsPromoCodeDialogOpen] = useState(false)

	useEffect(() => {
		if (settingsData) {
			setIsOrderingOpen(settingsData.isOrderingOpen)
			setOrderWaitTime(settingsData.orderWaitTime)
			setDeliveryCost(settingsData.deliveryCost)

		}
	}, [settingsData])

	useEffect(() => {
		if (promoCodesData) {
			setPromoCodes(promoCodesData)
		}
	}, [promoCodesData])

	useEffect(() => {
		if (bannersData) {
			setBanners(bannersData)
		}
	}, [bannersData])

	useEffect(() => {
		if (settingsData?.deliveryZones) {
			const zones = settingsData.deliveryZones as unknown as DeliveryZone[]
			setDeliveryZones(zones)
		}
	}, [settingsData])

	const handleUpdateZones = (updatedZones: DeliveryZone[]) => {
		updateDeliveryZonePrices.mutate(updatedZones)
	}

	// Стан для нового промокоду
	const [newPromoCode, setNewPromoCode] = useState<{
		code: string
		discountType: 'FIXED' | 'PERCENTAGE'
		discountValue: string
		isActive: boolean
		expiresInDays: number | null
		isOneTimeUse: boolean
	}>({
		code: '',
		discountType: 'FIXED',
		discountValue: '',
		isActive: true,
		expiresInDays: null,
		isOneTimeUse: false,
	})

	const handleAddPromoCode = () => {
		if (!newPromoCode.code.trim()) {
			toast.warning('Proszę wpisać kod promocyjny.')
			return
		}

		if (!newPromoCode.discountValue.trim()) {
			toast.warning('Proszę wpisać wartość zniżki.')
			return
		}

		const discountValue = parseFloat(newPromoCode.discountValue)
		if (isNaN(discountValue) || discountValue <= 0) {
			toast.warning('Proszę wpisać prawidłową wartość zniżki.')
			return
		}

		const expiresAt = newPromoCode.expiresInDays
			? dayjs().add(newPromoCode.expiresInDays, 'day').toISOString()
			: undefined

		createPromoCode.mutate({
			code: newPromoCode.code,
			discountType: newPromoCode.discountType,
			discountValue: discountValue,
			isActive: newPromoCode.isActive,
			isOneTimeUse: newPromoCode.isOneTimeUse,
			expiresAt: expiresAt,
		})

		setNewPromoCode({
			code: '',
			discountType: 'FIXED',
			discountValue: '',
			isActive: true,
			expiresInDays: null,
			isOneTimeUse: false,
		})
		setIsPromoCodeDialogOpen(false)
	}

	const generateRandomCode = () => {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		let result = ''
		const charactersLength = characters.length
		for (let i = 0; i < 10; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Ustawienia</h1>
			<div className="space-y-8">
				<section>
					<h2 className="text-xl font-semibold">Zamówienia Online</h2>
					<div className="flex items-center space-x-4">
						<Switch
							checked={isOrderingOpen}
							onCheckedChange={(checked) => {
								setIsOrderingOpen(checked)
								updateOrderingState.mutate({
									isOrderingOpen: checked
								})
							}}
						/>
						<span>{isOrderingOpen ? 'Aktywne' : 'Wyłączone'}</span>
					</div>
				</section>

				<DeliveryZonesSettings
					deliveryZones={deliveryZones}
					onUpdateZones={handleUpdateZones}
				/>

				<section>
					<h2 className="text-xl font-semibold">Czas oczekiwania</h2>
					<Select
						value={orderWaitTime.toString()}
						onValueChange={(value) => {
							const newTime = Number(value)
							setOrderWaitTime(newTime)
							updateOrderWaitTime.mutate({
								orderWaitTime: newTime,
							})
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Wybierz czas oczekiwania" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="30">30 minut</SelectItem>
							<SelectItem value="45">45 minut</SelectItem>
							<SelectItem value="60">60 minut</SelectItem>
							<SelectItem value="75">75 minut</SelectItem>
							<SelectItem value="90">90 minut</SelectItem>
							<SelectItem value="120">120 minut</SelectItem>
						</SelectContent>
					</Select>
				</section>

				<section>
					<Accordion type="single" collapsible>
						<AccordionItem value="promoCodes">
							<AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">Kody promocyjne</AccordionTrigger>
							<AccordionContent>
								<Table>
									<TableHeader className="text-text-foreground">
										<TableRow>
											<TableHead>Kod</TableHead>
											<TableHead>Typ zniżki</TableHead>
											<TableHead>Wartość</TableHead>
											<TableHead>Data zakończenia</TableHead>
											<TableHead>Jednorazowy</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Akcje</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{promoCodes.map((promo) => (
											<TableRow key={promo.id}>
												<TableCell className="font-bold">{promo.code}</TableCell>
												<TableCell>
													{promo.discountType === 'FIXED'
														? 'Kwota stała'
														: 'Procent'}
												</TableCell>
												<TableCell>
													{promo.discountValue}{' '}
													{promo.discountType === 'FIXED' ? 'zł' : '%'}
												</TableCell>
												<TableCell>
													{promo.expiresAt
														? dayjs(promo.expiresAt).format('YYYY-MM-DD')
														: 'Bezterminowy'}
												</TableCell>
												<TableCell>{promo.isOneTimeUse ? 'Tak' : 'Nie'}</TableCell>
												<TableCell>{promo.isUsed ? 'Wykorzystany' : 'Aktywny'}</TableCell>
												<TableCell>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => {
															deletePromoCode.mutate({ id: promo.id })
														}}
													>
														Usuń
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								<Button onClick={() => setIsPromoCodeDialogOpen(true)} className="mt-4">
									Dodaj
								</Button>

								{/* Діалог для додавання нового промокоду */}
								<Dialog open={isPromoCodeDialogOpen} onOpenChange={setIsPromoCodeDialogOpen}>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Dodaj nowy kod promocyjny</DialogTitle>
										</DialogHeader>
										<div className="space-y-4">
											<div className="flex items-center space-x-2">
												<Input
													placeholder="Kod"
													value={newPromoCode.code}
													onChange={(e) =>
														setNewPromoCode((prev) => ({
															...prev,
															code: e.target.value,
														}))
													}
												/>
												<Button
													onClick={() =>
														setNewPromoCode((prev) => ({
															...prev,
															code: generateRandomCode(),
														}))
													}
												>
													Zgenerować
												</Button>
											</div>

											<Select
												value={newPromoCode.discountType}
												onValueChange={(value) =>
													setNewPromoCode((prev) => ({
														...prev,
														discountType: value as 'FIXED' | 'PERCENTAGE',
														discountValue: '',
													}))
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Typ zniżki" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="FIXED">Kwota stała</SelectItem>
													<SelectItem value="PERCENTAGE">Procent</SelectItem>
												</SelectContent>
											</Select>
											<Input
												type="number"
												placeholder="Wartość"
												value={newPromoCode.discountValue}
												onChange={(e) => {
													let value = e.target.value

													value = value.replace(/[^0-9.]/g, '')

													if (value === '') {
														setNewPromoCode((prev) => ({
															...prev,
															discountValue: '',
														}))
														return
													}

													let numericValue = parseFloat(value)

													if (numericValue < 0) {
														numericValue = 0
													}

													if (
														newPromoCode.discountType === 'PERCENTAGE' &&
														numericValue > 100
													) {
														numericValue = 100
													}

													setNewPromoCode((prev) => ({
														...prev,
														discountValue: numericValue.toString(),
													}))
												}}
											/>

											<div>
												<label className="flex items-center space-x-2">
													<Switch
														checked={newPromoCode.isOneTimeUse}
														onCheckedChange={(checked) =>
															setNewPromoCode((prev) => ({
																...prev,
																isOneTimeUse: checked,
															}))
														}
													/>
													<span>Kod jednorazowy</span>
												</label>
											</div>

											<div>
												<label className="flex items-center space-x-2">
													<Switch
														checked={newPromoCode.expiresInDays === null}
														onCheckedChange={(checked) =>
															setNewPromoCode((prev) => ({
																...prev,
																expiresInDays: checked ? null : 30,
															}))
														}
													/>
													<span>
														{newPromoCode.expiresInDays === null
															? 'Bezterminowy'
															: 'Terminowy'}
													</span>
												</label>
												{newPromoCode.expiresInDays !== null && (
													<div className="pt-4">
														<Input
															type="number"
															placeholder="Dni ważności"
															value={
																newPromoCode.expiresInDays !== null
																	? newPromoCode.expiresInDays.toString()
																	: ''
															}
															onChange={(e) =>
																setNewPromoCode((prev) => ({
																	...prev,
																	expiresInDays: Number(e.target.value),
																}))
															}
														/>
													</div>
												)}
											</div>
										</div>
										<DialogFooter>
											<Button
												onClick={handleAddPromoCode}
												disabled={
													!newPromoCode.code.trim() ||
													!newPromoCode.discountValue.trim()
												}
											>
												Dodaj
											</Button>
											<Button
												variant="secondary"
												onClick={() => setIsPromoCodeDialogOpen(false)}
											>
												Anuluj
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</section>
				<section>
					<Accordion type="single" collapsible>
						<AccordionItem value="banners">
							<AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">Banery reklamowe</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-4">
									{/* Список банерів */}
									{bannersData && bannersData.length > 0 ? (
										bannersData.map((banner, index) => (
											<div key={banner.id} className="flex items-center justify-between space-x-4 max-w-lg">
												{/* Зображення */}
												<Image
													src={banner.imageUrl}
													width={400}
													height={100}
													alt={`Baner-${index + 1}`}
													className="w-full h-auto object-cover rounded-md shadow-sm"
												/>

												{/* Кнопка видалення */}
												<LoadingButton
													isLoading={deletingBannerId === banner.id}
													variant="destructive"
													size="sm"
													onClick={() => deleteBanner.mutate({ id: banner.id })}
													className="ml-4"
												>
													Usuń
												</LoadingButton>
											</div>

										))
									) : (
										<p className="text-gray-500 mt-2">Brak banerów. Dodaj nowy baner poniżej.</p>
									)}

									{/* Додавання нового банера */}
									<BannerUploader
										onImageUpload={(imageUrl) => {
											createBanner.mutate({
												imageUrl,
												linkUrl: '',
												position: banners.length + 1,
											})
										}}
									/>
									<p className='text-text-foreground italic'>*Zalecany rozmiar banera - to <span className='text-text-secondary'>1056 px x 384 px</span></p>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</section>


				{isAdmin && (
					<section>
						<UserList />
					</section>
				)}

			</div>
		</div>
	)
}

export default Settings
