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
		<div className="space-y-2">
			<h3 className="text-xl text-secondary font-semibold">Kod promocyjny</h3>

			<div className="flex gap-2 items-center">
				<Input
					placeholder="Kod promocyjny"
					{...register("promoCode" as Path<T>)}
				/>
				<Button variant="secondary" onClick={onApply} disabled={isLoading}>
					{isLoading ? "Dodaj..." : "Dodaj"}
				</Button>
			</div>

			{errorMessage && <p className="text-danger text-sm pt-1">{errorMessage}</p>}

			{discount && (
				<div className="flex mt-2 text-sm text-secondary bg-primary p-2 w-fit rounded-lg items-center">
					{discount.code} : -{discount.discountValue}
					{discount.discountType === "PERCENTAGE" ? "%" : "zł"}
					{onRemoveDiscount && (
						<button onClick={onRemoveDiscount} className="ml-2 text-danger text-sm">
							<RxCross2 />
						</button>
					)}
				</div>
			)}

			{errors.promoCode && (
				<p className="text-danger text-sm pt-1">{errors.promoCode?.message as string}</p>
			)}
		</div>
	)
}