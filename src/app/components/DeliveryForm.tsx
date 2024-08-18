import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { RESTAURANT_COORDINATES } from "@/config/constants"
import {
	Coordinates,
	getCoordinates,
	hasStreetNumber,
	haversineDistance,
} from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Autocomplete } from "@react-google-maps/api"
import Link from "next/link"
import { useEffect, useState } from "react"
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
	formData: FormData
	onFormDataChange: (data: FormData) => void
	addressVerified: boolean
	setAddressVerified: (verified: boolean) => void // Ensure this prop is defined
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
		defaultValues: {
			address: formData.address,
		},
	})

	// Update local form state if formData changes
	useEffect(() => {
		form.setValue("address", formData.address)
	}, [formData, form])

	const onSubmit = async (values: FormData) => {
		setLoading(true)
		setAddressVerified(false) // Reset verified state on submit
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
			onFormDataChange({ address }) // Update parent state
			toast.success("Gratulujemy! Twój adres jest w zasięgu naszej dostawy.")
		} else {
			setLoading(false)
			toast.warning(
				"Niestety twój adres nie jest w zasięgu naszej dostawy."
			)
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
								<FormLabel className="text-lg">Adres:</FormLabel>
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
								{addressVerified && (
									<FormDescription>
										<span className="text-primary">Wybrany adres:</span>{" "}
										{formData.address}
									</FormDescription>
								)}
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
