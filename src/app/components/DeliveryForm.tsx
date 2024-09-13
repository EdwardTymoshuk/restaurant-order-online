'use client'

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { DELIVERY_RADIUS_METERS, RESTAURANT_COORDINATES } from '@/config/constants'
import { Coordinates, getCoordinates, hasStreetNumber, haversineDistance } from "@/lib/deliveryUtils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Autocomplete } from "@react-google-maps/api"
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import { MdOutlineKeyboardArrowRight } from "react-icons/md"
import { toast } from "sonner"
import { z } from "zod"
import LoadingButton from "./LoadingButton"

const formSchema = z.object({
	address: z.string().min(1, "Wprowadź adres").max(200),
})

type FormData = z.infer<typeof formSchema>

interface DeliveryFormProps {
	formData: FormData // Додайте це
	onFormDataChange: (data: FormData) => void // Додайте це
	addressVerified: boolean
	setAddressVerified: (verified: boolean) => void
}

export default function DeliveryForm({
	formData,
	onFormDataChange,
	addressVerified,
	setAddressVerified,
}: DeliveryFormProps) {
	const [deliveryAddressCoordinates, setDeliveryAddressCoordinates] =
		useState<Coordinates | null>(null)
	const [autocomplete, setAutocomplete] =
		useState<google.maps.places.Autocomplete | null>(null)
	const [addressValid, setAddressValid] = useState(true)
	const [loading, setLoading] = useState(false)

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: formData,
	})

	const onSubmit = async (values: FormData) => {
		setLoading(true)
		setAddressVerified(false)
		if (!addressValid) {
			setLoading(false)
			toast.error("Wprowadź numer budynku.")
			return
		}

		const address = values.address
		const deliveryCoordinates = await getCoordinates(address)

		if (!deliveryCoordinates) {
			toast.error("Podany adres nie istnieje.")
			setLoading(false)
			return
		}

		setDeliveryAddressCoordinates(deliveryCoordinates)

		console.log(deliveryAddressCoordinates)

		const distance = haversineDistance(RESTAURANT_COORDINATES, deliveryCoordinates)

		console.log(distance)

		if (distance <= DELIVERY_RADIUS_METERS) {
			setLoading(false)
			setAddressVerified(true)
			localStorage.setItem('deliveryAddress', address)
			toast.success("Gratulacje! Twój adres znajduje się w zasięgu naszej dostawy.")
		} else {
			setLoading(false)
			toast.warning("Niestety, twój adres nie znajduje się w zasięgu naszej dostawy.")
		}
	}


	return (
		<div className="flex flex-col space-y-8">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="mb-8 space-y-4">
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
					<LoadingButton isLoading={loading} type="submit" className="w-full my-4">
						{addressVerified ? (
							<Link href="/order" className="flex items-center">
								Do zamówienia <MdOutlineKeyboardArrowRight />
							</Link>
						) : (
							"Sprawdź"
						)}
					</LoadingButton>
				</form>
			</Form>
		</div>
	)
}
