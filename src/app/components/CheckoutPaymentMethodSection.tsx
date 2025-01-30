"use client"

import { Button } from "@/app/components/ui/button"
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import { BsCashCoin, BsFillBootstrapFill } from "react-icons/bs"
import { FaApple, FaGoogle, FaRegCreditCard } from "react-icons/fa"

/**
 * Handles multiple payment method buttons. Each button
 * sets the "paymentMethod" field in the form. A hidden
 * input can track that field for validation.
 */
interface CheckoutPaymentMethodSectionProps<T extends FieldValues> {
	form: UseFormReturn<T>
	errorMessage?: string
}

/**
 * Renders payment method options, updates form state on click,
 * and displays an error if paymentMethod is invalid.
 */
export default function CheckoutPaymentMethodSection<T extends FieldValues>({
	form,
	errorMessage,
}: CheckoutPaymentMethodSectionProps<T>) {
	const { setValue, watch, register } = form
	const selected = watch("paymentMethod" as Path<T>)

	return (
		<div className="space-y-2">
			<h3 className="text-xl text-secondary font-semibold">Płatność przy odbiorze</h3>

			{/* Hidden input for form tracking */}
			<input type="hidden" {...register("paymentMethod" as Path<T>)} />

			<div className="grid grid-cols-2 gap-4">
				<Button
					type="button"
					variant={selected === "credit_card_offline" ? "default" : "secondary"}
					onClick={() => setValue("paymentMethod" as Path<T>, "credit_card_offline" as PathValue<T, Path<T>>)}

					className="flex items-center space-x-2"
				>
					<FaRegCreditCard size={18} />
					<span>Karta płatnicza</span>
				</Button>

				<Button
					type="button"
					variant={selected === "cash_offline" ? "default" : "secondary"}
					onClick={() => setValue("paymentMethod" as Path<T>, "cash_offline" as PathValue<T, Path<T>>)}
					className="flex items-center space-x-2"
				>
					<BsCashCoin size={18} />
					<span>Gotówka</span>
				</Button>
			</div>

			<h3 className="text-xl text-secondary font-semibold">
				Płatność online (chwilowo niedostępna)
			</h3>

			<div className="grid grid-cols-2 gap-4">
				<Button
					type="button"
					variant={selected === "credit_card_online" ? "default" : "secondary"}
					onClick={() => setValue("paymentMethod" as Path<T>, "credit_card_online" as PathValue<T, Path<T>>)}
					className="flex items-center space-x-2"
					disabled
				>
					<FaRegCreditCard size={18} />
					<span>Karta płatnicza</span>
				</Button>

				<Button
					type="button"
					variant={selected === "blik" ? "default" : "secondary"}
					onClick={() => setValue("paymentMethod" as Path<T>, "blik" as PathValue<T, Path<T>>)}
					className="flex items-center space-x-2"
					disabled
				>
					<BsFillBootstrapFill size={18} />
					<span>Blik</span>
				</Button>

				<Button
					type="button"
					variant={selected === "apple_pay" ? "default" : "secondary"}
					onClick={() => setValue("paymentMethod" as Path<T>, "apple_pay" as PathValue<T, Path<T>>)}
					className="flex items-center space-x-2"
					disabled
				>
					<FaApple size={18} />
					<span>Apple Pay</span>
				</Button>

				<Button
					type="button"
					variant={selected === "google_pay" ? "default" : "secondary"}
					onClick={() => setValue("paymentMethod" as Path<T>, "google_pay" as PathValue<T, Path<T>>)}
					className="flex items-center space-x-2"
					disabled
				>
					<FaGoogle size={18} />
					<span>Google Pay</span>
				</Button>
			</div>

			{errorMessage && (
				<p className="text-danger text-sm pt-1">{errorMessage}</p>
			)}
		</div>
	)
}