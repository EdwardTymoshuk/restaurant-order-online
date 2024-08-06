import RestaurantMap from '@/components/RestaurantMap'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DELIVERY_RADIUS_METERS, RESTAURANT_COORDINATES } from '@/constants'
import { Coordinates, getCoordinates, hasStreetNumber, haversineDistance } from '@/lib/utils'
import { zodResolver } from "@hookform/resolvers/zod"
import { Autocomplete, LoadScriptNext } from "@react-google-maps/api"
import Link from 'next/link'
import { useState } from "react"
import { useForm } from "react-hook-form"
import { MdOutlineKeyboardArrowRight } from 'react-icons/md'
import { LineWave } from "react-loader-spinner"
import { toast } from "sonner"
import { z } from "zod"
import LoadingButton from './LoadingButton'

const formSchema = z.object({
	address: z.string().min(1, "Wprowadź adres").max(200),
})

type FormData = z.infer<typeof formSchema>

const libraries: ("places")[] = ["places"]

export default function DeliveryForm() {
	const [deliveryAddressCoordinates, setDeliveryAddressCoordinates] = useState<Coordinates | null>(null)
	const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
	const [addressValid, setAddressValid] = useState(true)
	const [loading, setLoading] = useState(false)
	const [addressVerified, setAddressVerified] = useState(false)
	const [selectedAddress, setSelectedAddress] = useState<string>("")

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			address: "",
		},
	})

	const onSubmit = async (values: FormData) => {
		setLoading(true)
		setAddressVerified(false)
		if (!addressValid) {
			setLoading(false)
			toast.error("Wprowadź nr budynku.")
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

		const distance = haversineDistance(
			RESTAURANT_COORDINATES,
			deliveryCoordinates
		)

		if (distance <= 5) {
			setLoading(false)
			setAddressVerified(true)
			setSelectedAddress(address)
			toast.success("Gratulujemy! Twój adres jest w zasięgu naszej dostawy.")
		} else {
			setLoading(false)
			toast.warning(
				"Niestety twój adres nie jest w zasięgu naszej dostawy."
			)
		}
	}

	return (
		<>
			<LoadScriptNext
				googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
				libraries={libraries}
				loadingElement={
					<div className="flex justify-center items-center h-full">
						<LineWave
							height="100"
							width="100"
							color="#ABD95A"
							ariaLabel="line-wave"
							visible={true}
						/>
					</div>
				}
			>
				<div className="flex flex-col md:flex-row gap-4 lg:gap-8 space-y-8">
					<div className='w-full md:w-3/4'>
						{addressVerified && (
							<div className="text-center flex flex-col">
								<span className='text-4xl text-text-foreground'>Wybrany adres:</span>
								<span className='text-xl text-primary'>{selectedAddress}</span>
							</div>
						)}

						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
								<FormField
									control={form.control}
									name="address"
									render={({ field, fieldState }) => (
										<FormItem>
											<FormLabel className='text-lg'>Adres:</FormLabel>
											<FormControl>
												<Autocomplete
													onLoad={setAutocomplete}
													onPlaceChanged={() => {
														if (autocomplete) {
															const place = autocomplete.getPlace()
															if (place?.formatted_address) {
																const isValid = hasStreetNumber(
																	place.address_components
																)
																setAddressValid(isValid)
																if (!isValid) {
																	toast.error("Proszę wprowadzić numer budynku.")
																}
																form.setValue("address", place.formatted_address)
															}
														}
													}}
												>
													<Input
														{...field}
														className={`${fieldState.invalid || !addressValid
															? "border-red-500"
															: ""
															}`}
														placeholder="Wprowadź adres"
													/>
												</Autocomplete>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{
									!addressVerified ?
										<LoadingButton
											isLoading={loading}
											type="submit"
											className="w-full"
										>
											Sprawdź
										</LoadingButton> :
										<LoadingButton
											isLoading={loading}
											className="w-full"
										>
											<Link href='/order' className='flex items-center'>
												Do zamówienia <MdOutlineKeyboardArrowRight />
											</Link>
										</LoadingButton>
								}
							</form>
						</Form>
					</div>
					<div className='h-96 w-full'>
						<RestaurantMap
							center={RESTAURANT_COORDINATES}
							zoom={11.3}
							markers={[RESTAURANT_COORDINATES, deliveryAddressCoordinates].filter(Boolean) as Coordinates[]}
							circleRadius={DELIVERY_RADIUS_METERS}
							circleOptions={{
								fillColor: "#ABD95A",
								fillOpacity: 0.2,
								strokeColor: "#ABD95A",
								strokeOpacity: 0.2,
								strokeWeight: 1,
							}}
						/>
					</div>
				</div>
			</LoadScriptNext>
		</>
	)
}
