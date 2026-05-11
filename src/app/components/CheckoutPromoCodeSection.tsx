"use client"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { RxCross2 } from "react-icons/rx"

/**
 * Represents an applied discount (if any).
 */
interface DiscountInfo {
	code: string
	discountValue: number
	discountType: "PERCENTAGE" | "FIXED"
}

/**
 * Allows entering a promo code, shows an error or current discount.
 */
interface CheckoutPromoCodeSectionProps<T extends FieldValues> {
	form: UseFormReturn<T>
	onApply: () => void
	isLoading: boolean
	errorMessage?: string
	discount?: DiscountInfo | null
	onRemoveDiscount?: () => void
}

/**
 * Renders an input field bound to form.register("promoCode")
 * and a button to apply. Also displays any active discount.
 */
export default function CheckoutPromoCodeSection<T extends FieldValues>({
	form,
	onApply,
	isLoading,
	errorMessage,
	discount,
	onRemoveDiscount,
}: CheckoutPromoCodeSectionProps<T>) {
	const { register, formState: { errors } } = form

	return (
		<section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div>
				<span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
					Rabat
				</span>
				<h3 className="font-serif text-2xl font-bold text-secondary">Kod promocyjny</h3>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Input
					placeholder="Kod promocyjny"
					{...register("promoCode" as Path<T>)}
					className="h-12 rounded-xl border-slate-200 bg-slate-50/70"
				/>
				<Button
					type="button"
					variant="ghost"
					onClick={onApply}
					disabled={isLoading}
					className="h-12 rounded-xl bg-secondary px-6 font-bold text-white hover:bg-secondary/90"
				>
					{isLoading ? "Dodaj..." : "Dodaj"}
				</Button>
			</div>

			{errorMessage && <p className="text-danger text-sm pt-1">{errorMessage}</p>}

			{discount && (
				<div className="flex w-fit items-center rounded-xl bg-primary/15 px-3 py-2 text-sm font-semibold text-secondary">
					{discount.code} : -{discount.discountValue}
					{discount.discountType === "PERCENTAGE" ? "%" : "zł"}
					{onRemoveDiscount && (
						<button type="button" onClick={onRemoveDiscount} className="ml-2 text-danger text-sm">
							<RxCross2 />
						</button>
					)}
				</div>
			)}

			{errors.promoCode && (
				<p className="text-danger text-sm pt-1">{errors.promoCode?.message as string}</p>
			)}
		</section>
	)
}
