'use client'

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { RESTAURANT_COORDINATES } from '@/config/constants'
import { Coordinates, getCoordinates, hasStreetNumber, haversineDistance } from "@/utils/deliveryUtils"
import { trpc } from '@/utils/trpc'
import { zodResolver } from "@hookform/resolvers/zod"
import { Autocomplete } from "@react-google-maps/api"
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react' // Додаємо useTransition
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { DeliveryZone } from '../types/types'
import LoadingButton from "./LoadingButton"

const formSchema = z.object({
	address: z.string().min(1, "Wprowadź adres").max(200),
})

type FormData = z.infer<typeof formSchema>

interface DeliveryFormProps {
	formData: FormData
	onFormDataChange: (data: FormData) => void
	addressVerified: boolean
	setAddressVerified: (verified: boolean) => void
	setAddressCoordinates: (coordinates: Coordinates | null) => void // Додаємо пропс
}

export default function DeliveryForm({
	formData,
	onFormDataChange,
	addressVerified,
	setAddressVerified,
	setAddressCoordinates
}: DeliveryFormProps) {
	const [deliveryAddressCoordinates, setDeliveryAddressCoordinates] =
		useState<Coordinates | null>(null)
	const [autocomplete, setAutocomplete] =
		useState<google.maps.places.Autocomplete | null>(null)
	const [addressValid, setAddressValid] = useState(true)
	const [loading, setLoading] = useState(false)

	const router = useRouter()
	const [isPending, startTransition] = useTransition() // Використовуємо useTransition для переходу

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: formData,
	})

	const { data: settingsData, isLoading: isSettingsLoading } = trpc.settings.getSettings.useQuery()
	// Parse delivery zones with type safety
	const deliveryZones: DeliveryZone[] = useMemo(() => {
		try {
			return Array.isArray(settingsData?.deliveryZones)
				? (settingsData?.deliveryZones as unknown as DeliveryZone[])
				: []
		} catch {
			console.error('Failed to parse delivery zones from settings.')
			return []
		}
	}, [settingsData])

	const onSubmit = async (values: FormData) => {
		setLoading(true)
		setAddressVerified(false)

		const address = values.address
		const deliveryCoordinates = await getCoordinates(address)

		if (!deliveryCoordinates) {
			toast.error("Podany adres nie istnieje.")
			setLoading(false)
			return
		}

		// Обчислюємо, чи адреса в зоні доставки
		const inDeliveryArea = deliveryZones.some((zone) => {
			const distance = haversineDistance(RESTAURANT_COORDINATES, deliveryCoordinates) / 1000
			return distance >= zone.minRadius && distance <= zone.maxRadius
		})

		setAddressCoordinates(deliveryCoordinates)

		if (inDeliveryArea) {
			setAddressVerified(true)
			toast.success("Świetna wiadomość, Twój adres znajduje się w zasięgu naszej dostawy.")
		} else {
			toast.warning("Niestety, Twój adres znajduje się poza зasięgiem naszej dostawy.")
		}

		setLoading(false)
	}



	// Обробляємо перенаправлення при натисканні на кнопку після валідації
	const handleOrderClick = () => {
		if (addressVerified) {
			// Використовуємо startTransition для асинхронного переходу
			startTransition(() => {
				router.push('/order')
			})
		}
	}

	return (
		<div className="flex flex-col space-y-8">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="mb-2 space-y-4">
					<FormField
						control={form.control}
						name="address"
						render={({ field, fieldState }) => (
							<FormItem>
								<FormControl>
									<Autocomplete
										onLoad={setAutocomplete}
										onPlaceChanged={() => {
											if (autocomplete) {
												const place = autocomplete.getPlace()
												if (place?.formatted_address) {
													const isValid = hasStreetNumber(place.address_components)
													setAddressValid(isValid)
													if (!isValid) {
														toast.error("Proszę wprowadzić numer budynku.")
													}
													form.setValue("address", place.formatted_address)
													onFormDataChange({ address: place.formatted_address })
												}
											}
										}}
									>
										<Input
											{...field}
											className={`${fieldState.invalid || !addressValid ? "border-danger" : ""}`}
											placeholder="Wprowadź adres"
										/>
									</Autocomplete>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Використовуємо одну кнопку для обох випадків */}
					{/* <LoadingButton
						isLoading={loading || isPending} // Показуємо стан завантаження під час переходу
						type={addressVerified ? "button" : "submit"}
						variant='secondary'
						className="w-full my-4"
						onClick={handleOrderClick}
					>
						{addressVerified ? (
							<div className="flex items-center">
								Do zamówienia <MdOutlineKeyboardArrowRight />
							</div>
						) : (
							"Sprawdź"
						)}
					</LoadingButton> */}
					<LoadingButton
						isLoading={loading || isPending} // Показуємо стан завантаження під час переходу
						type='submit'
						variant='default'
						className="w-full my-4"
					>
						Sprawdź
					</LoadingButton>
				</form>
			</Form>
		</div>
	)
}
