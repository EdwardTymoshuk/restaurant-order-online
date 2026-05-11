"use client"

import { Button } from "@/app/components/ui/button"
import { cn } from "@/utils/utils"
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
	const paymentButtonClass = (active: boolean) =>
		cn(
			"h-12 justify-center gap-2 rounded-xl border text-sm font-bold transition",
			active
				? "border-secondary bg-secondary text-white shadow-md shadow-secondary/15 hover:bg-secondary/90"
				: "border-slate-200 bg-slate-50 text-secondary hover:border-secondary/30 hover:bg-white"
		)
	const disabledPaymentButtonClass =
		"h-12 justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400"

	return (
		<section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div>
				<span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
					Płatność
				</span>
				<h3 className="font-serif text-2xl font-bold text-secondary">
					Wybierz sposób płatności
				</h3>
			</div>

			{/* Hidden input for form tracking */}
			<input type="hidden" {...register("paymentMethod" as Path<T>)} />

			<div className="space-y-3">
				<p className="text-sm font-semibold text-slate-500">Płatność przy odbiorze</p>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setValue("paymentMethod" as Path<T>, "credit_card_offline" as PathValue<T, Path<T>>)}
						className={paymentButtonClass(selected === "credit_card_offline")}
					>
						<FaRegCreditCard size={18} />
						<span>Karta płatnicza</span>
					</Button>

					<Button
						type="button"
						variant="ghost"
						onClick={() => setValue("paymentMethod" as Path<T>, "cash_offline" as PathValue<T, Path<T>>)}
						className={paymentButtonClass(selected === "cash_offline")}
					>
						<BsCashCoin size={18} />
						<span>Gotówka</span>
					</Button>
				</div>
			</div>

			<div className="space-y-3">
				<p className="text-sm font-semibold text-slate-500">
					Płatność online <span className="font-medium text-slate-400">(chwilowo niedostępna)</span>
				</p>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setValue("paymentMethod" as Path<T>, "credit_card_online" as PathValue<T, Path<T>>)}
						className={disabledPaymentButtonClass}
						disabled
					>
						<FaRegCreditCard size={18} />
						<span>Karta płatnicza</span>
					</Button>

					<Button
						type="button"
						variant="ghost"
						onClick={() => setValue("paymentMethod" as Path<T>, "blik" as PathValue<T, Path<T>>)}
						className={disabledPaymentButtonClass}
						disabled
					>
						<BsFillBootstrapFill size={18} />
						<span>Blik</span>
					</Button>

					<Button
						type="button"
						variant="ghost"
						onClick={() => setValue("paymentMethod" as Path<T>, "apple_pay" as PathValue<T, Path<T>>)}
						className={disabledPaymentButtonClass}
						disabled
					>
						<FaApple size={18} />
						<span>Apple Pay</span>
					</Button>

					<Button
						type="button"
						variant="ghost"
						onClick={() => setValue("paymentMethod" as Path<T>, "google_pay" as PathValue<T, Path<T>>)}
						className={disabledPaymentButtonClass}
						disabled
					>
						<FaGoogle size={18} />
						<span>Google Pay</span>
					</Button>
				</div>
			</div>

			{errorMessage && (
				<p className="text-sm font-semibold text-danger">{errorMessage}</p>
			)}
		</section>
	)
}
