import { Checkbox } from "@/app/components/ui/checkbox"
import { Input } from "@/app/components/ui/input"
import { FieldValues, Path, UseFormReturn } from "react-hook-form"

/**
 * Provides a checkbox for enabling NIP input
 * and a conditional input field for the NIP itself.
 */
interface CheckoutNipSectionProps<T extends { nip?: string } & FieldValues> {
	form: UseFormReturn<T>
	isNipRequired: boolean
	setIsNipRequired: (val: boolean) => void
}

/**
 * Renders a NIP field tied to form.register("nip")
 * only if isNipRequired is true.
 */
export default function CheckoutNipSection<T extends { nip?: string } & FieldValues>({
	form,
	isNipRequired,
	setIsNipRequired,
}: CheckoutNipSectionProps<T>) {
	const {
		register,
		formState: { errors },
	} = form

	return (
		<section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div>
				<span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
					Faktura
				</span>
				<h3 className="font-serif text-2xl font-bold text-secondary">Dane do faktury</h3>
			</div>

			<div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
				<Checkbox
					id="nipCheckbox"
					checked={isNipRequired}
					onCheckedChange={(checked) => setIsNipRequired(Boolean(checked))}
				/>
				<label
					htmlFor="nipCheckbox"
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Dodać numer NIP
				</label>
			</div>

			{isNipRequired && (
				<div className="mt-4">
					<label htmlFor="nip" className="text-sm font-medium text-text-secondary mt-2">
					Numer NIP
				</label>
					<Input
						id="nip"
						placeholder="NIP"
						type="string"
						{...register("nip" as Path<T>)} // Використовуємо "as Path<T>" для явного вказівки типу
						className={`mt-1 h-12 rounded-xl border-slate-200 bg-slate-50/70 ${errors.nip ? "border-danger" : ""}`}
					/>
					{errors.nip && (
						<p className="text-danger text-sm pt-1">{errors.nip?.message as string}</p>
					)}
				</div>
			)}
		</section>
	)
}
