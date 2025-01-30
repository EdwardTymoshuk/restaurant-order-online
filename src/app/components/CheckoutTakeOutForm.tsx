"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import TimeDeliverySwitcher from "@/app/components/TimeDeliverySwitcher"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"

import { useCart } from "@/app/context/CartContext"
import { useCheckout } from "@/app/context/CheckoutContext"
import { useOrder } from "@/app/context/OrderContext"
import { trpc } from "@/utils/trpc"

import CheckoutNipSection from "./CheckoutNipSection"
import CheckoutPaymentMethodSection from "./CheckoutPaymentMethodSection"
import CheckoutPromoCodeSection from "./CheckoutPromoCodeSection"

/**
 * Zod schema for a take-out form with name, phone, paymentMethod, etc.
 */
const takeOutSchema = z.object({
	name: z.string().min(1, "Podaj imię").max(20, "Imię jest zbyt długie"),
	phone: z
		.string()
		.regex(/^\+?[0-9]{9}$/, "Podaj numer w formacie xxxxxxxxxx"),
	paymentMethod: z.string().min(1, "Wybierz metodę płatności"),
	deliveryTime: z.union([
		z.literal("asap"),
		z.date().refine((date) => date > new Date(), {
			message: "Podaj poprawną godzinę dostawy",
		}),
	]),
	comment: z
		.string()
		.max(200, "Komentarz jest zbyt długi")
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	promoCode: z
		.string()
		.max(20, "Kod promocyjny jest zbyt długi")
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	nip: z
		.string()
		.optional()
		.transform((val) => (val === "" ? undefined : val))
		.refine((val) => val === undefined || /^[0-9]{10}$/.test(val), {
			message: "Podaj poprawny numer NIP z 10 cyfr",
		}),
})

type TakeOutFormData = z.infer<typeof takeOutSchema>

/**
 * Props controlling privacy acceptance, loading states, etc.
 */
interface TakeOutFormProps {
	acceptPrivacy: boolean
	setPrivacyError: (val: boolean) => void
	isLoading: boolean
	setIsLoading: (val: boolean) => void
	isBreakfast: boolean
}

/**
 * Full take-out form with name, phone, time, comment, promo code, NIP, payment, etc.
 */
export default function CheckoutTakeOutForm({
	acceptPrivacy,
	setPrivacyError,
	isLoading,
	setIsLoading,
	isBreakfast,
}: TakeOutFormProps) {
	const router = useRouter()
	const { state, dispatch } = useCart()
	const { setOrderData } = useOrder()
	const { isRestaurantClosed } = useCheckout()
	const createOrderMutation = trpc.order.create.useMutation()
	const markPromoCodeAsUsed = trpc.promoCode.markPromoCodeAsUsed.useMutation()
	const trpcContext = trpc.useUtils()

	const [isLoadingPromoCode, setIsLoadingPromoCode] = useState(false)
	const [takeOutErrorMessage, setTakeOutErrorMessage] = useState("")
	const [isNipRequired, setIsNipRequired] = useState(false)
	const paymentMethodRef = useRef<HTMLDivElement | null>(null)

	const form = useForm<TakeOutFormData>({
		resolver: zodResolver(takeOutSchema),
		defaultValues: {
			name: "",
			phone: "",
			paymentMethod: "",
			deliveryTime: "asap",
			comment: "",
			promoCode: "",
			nip: "",
		},
		mode: "onChange",
	})

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		getValues,
		setFocus,
		reset,
	} = form

	/**
	 * Handles successful form submission for take-out scenario.
	 */
	async function onTakeOutSubmit(data: TakeOutFormData) {
		try {
			setIsLoading(true)
			if (!acceptPrivacy) {
				setPrivacyError(true)
				setIsLoading(false)
				return
			}
			if (!data.paymentMethod) {
				toast.error("Nie wybrano metody opłaty")
				setIsLoading(false)
				return
			}

			const promoCode = state.takeOutDiscount?.code
			const finalAmount = state.finalAmount
			const totalAmount = state.totalAmount

			const order = await createOrderMutation.mutateAsync({
				name: data.name,
				phone: data.phone,
				paymentMethod: data.paymentMethod,
				deliveryMethod: "TAKE_OUT",
				deliveryTime:
					data.deliveryTime === "asap"
						? new Date().toISOString()
						: data.deliveryTime.toISOString(),
				items: state.items.map((item) => ({
					menuItemId: item.id,
					quantity: item.quantity,
				})),
				totalAmount,
				finalAmount,
				method: "TAKE_OUT",
				comment: data.comment,
				promoCode,
				nip: data.nip,
			})

			const { id, phone, name, deliveryMethod, deliveryTime } = order
			setOrderData(id, phone, name, deliveryMethod, deliveryTime.toISOString())

			if (promoCode) {
				await markPromoCodeAsUsed.mutateAsync({ promoCode })
			}

			toast.success("Zamówienie złożone pomyślnie!")
			router.push("/thank-you")

			reset()
			dispatch({ type: "CLEAR_CART" })
		} catch {
			toast.error("Błąd przy stworzeniu zamówienia.")
			setIsLoading(false)
		} finally {
			setIsLoading(false)
		}
	}

	/**
	 * If form is invalid, highlight the first erroneous field.
	 */
	function onInvalid(formErrors: typeof errors) {
		const fieldOrder: (keyof TakeOutFormData)[] = ["name", "phone", "paymentMethod"]
		const errorFields = Object.keys(formErrors) as (keyof TakeOutFormData)[]
		for (const fieldName of fieldOrder) {
			if (errorFields.includes(fieldName)) {
				if (fieldName === "paymentMethod") {
					paymentMethodRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
				} else {
					setFocus(fieldName)
				}
				break
			}
		}
		toast.error("Sprawdź błędne pola formularza.")
	}

	/**
	 * Manages payment method selection.
	 */
	function handlePaymentMethodSelect(method: string) {
		setValue("paymentMethod", method)
	}

	/**
	 * Applies a promo code if valid, otherwise shows an error.
	 */
	async function handleApplyPromoCode() {
		setTakeOutErrorMessage("")
		setIsLoadingPromoCode(true)
		const code = getValues("promoCode")
		if (!code) {
			setTakeOutErrorMessage("Wprowadź kod promocyjny.")
			setIsLoadingPromoCode(false)
			return
		}
		try {
			const foundCode = await trpcContext.client.promoCode.validatePromoCode.query({
				promoCode: code,
			})
			if (foundCode) {
				dispatch({
					type: "SET_TAKEOUT_DISCOUNT",
					payload: {
						code: foundCode.code,
						discountValue: foundCode.discountValue,
						discountType: foundCode.discountType,
					},
				})
				toast.success(
					`Kod ${code} został zastosowany! Zniżka: ${foundCode.discountValue
					}${foundCode.discountType === "PERCENTAGE" ? "%" : "zł"}.`
				)
				setValue("promoCode", "")
			}
		} catch (err: any) {
			setTakeOutErrorMessage(err.message || "Błąd podczas weryfikacji kodu.")
			toast.error(err.message || "Błąd podczas weryfikacji kodu.")
		} finally {
			setIsLoadingPromoCode(false)
		}
	}

	/**
	 * Updates the deliveryTime field when user picks a time option.
	 */
	function handleTimeChange(option: "asap" | Date) {
		setValue("deliveryTime", option)
	}

	/**
	 * Clears the 'nip' field if the user unchecks the NIP checkbox.
	 */
	useEffect(() => {
		if (!isNipRequired) {
			setValue("nip", "")
		}
	}, [isNipRequired, setValue])

	return (
		<form
			id="takeOutForm"
			onSubmit={handleSubmit(onTakeOutSubmit, onInvalid)}
			className="space-y-8"
		>
			<div className="space-y-2">
				<h3 className="text-xl text-secondary font-semibold">Czas dostawy</h3>
				<TimeDeliverySwitcher
					isBreakfast={isBreakfast}
					onTimeChange={handleTimeChange}
					isDelivery={false}
					orderWaitTime={30}
				/>
			</div>

			<div className="space-y-2">
				<h3 className="text-xl text-secondary font-semibold">Dane do dostawy</h3>
				<div className="flex gap-4 w-full">
					<div className="w-full">
						<label htmlFor="name" className="block text-sm font-medium text-text-secondary">
							Imię <span className="text-danger">*</span>
						</label>
						<Input
							id="name"
							placeholder="Imię"
							{...register("name")}
							className={`flex-1 mt-1 ${errors.name ? "border-danger" : ""}`}
						/>
						{errors.name && (
							<p className="text-danger text-sm pt-1">{errors.name.message}</p>
						)}
					</div>

					<div className="w-full">
						<label htmlFor="phone" className="block text-sm font-medium text-text-secondary">
							Nr telefonu <span className="text-danger">*</span>
						</label>
						<Input
							id="phone"
							placeholder="Numer telefonu"
							{...register("phone")}
							className={`flex-1 mt-1 ${errors.phone ? "border-danger" : ""}`}
						/>
						{errors.phone && (
							<p className="text-danger text-sm pt-1">{errors.phone.message}</p>
						)}
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<h3 className="text-xl text-secondary font-semibold">Komentarz do zamówienia</h3>
				<Textarea
					id="comment"
					placeholder="Komentarz do zamówienia"
					{...register("comment")}
					className={`mt-1 ${errors.comment ? "border-danger" : ""}`}
				/>
				{errors.comment && (
					<p className="text-danger text-sm pt-1">{errors.comment.message}</p>
				)}
			</div>

			<CheckoutPromoCodeSection<TakeOutFormData>
				form={form}
				onApply={handleApplyPromoCode}
				isLoading={isLoadingPromoCode}
				errorMessage={takeOutErrorMessage}
				discount={state.takeOutDiscount}
				onRemoveDiscount={() => dispatch({ type: "REMOVE_TAKEOUT_DISCOUNT" })}
			/>

			<CheckoutNipSection<TakeOutFormData>
				form={form}
				isNipRequired={isNipRequired}
				setIsNipRequired={setIsNipRequired}
			/>

			<div ref={paymentMethodRef}>
				<CheckoutPaymentMethodSection<TakeOutFormData>
					form={form}
					errorMessage={errors.paymentMethod?.message}
				/>
			</div>
		</form>
	)
}
