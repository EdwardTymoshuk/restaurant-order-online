'use client'

import RecommendedProducts from '@/app/components/RecommendedProducts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { MIN_ORDER_AMOUNT } from '@/config/constants'
import { ArrowRight, Sparkles } from 'lucide-react'
import LoadingButton from './LoadingButton'

interface RecommendDialogProps {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onContinue: () => void
	isLoading: boolean
	isBreakfastOnly: boolean
	totalAmount: number
	amountNeeded: number
}

const RecommendDialog: React.FC<RecommendDialogProps> = ({ isOpen, onOpenChange, onContinue, isLoading, isBreakfastOnly, totalAmount, amountNeeded }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-hidden p-0">
				<DialogDescription hidden>Polecane produkty</DialogDescription>
				<DialogTitle hidden>Polecane produkty</DialogTitle>
				<DialogHeader className="border-b border-border px-5 py-5 text-left sm:text-left">
					<div className="flex items-start gap-3 pr-8">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
							<Sparkles size={20} />
						</div>
						<div>
							<h3 className="font-serif text-2xl font-semibold leading-tight text-slate-950">Polecamy również</h3>
							<p className="mt-1 text-sm leading-6 text-slate-500">
								Dodaj coś jeszcze do zamówienia albo przejdź dalej do podsumowania.
							</p>
						</div>
					</div>
				</DialogHeader>
				<div className="max-h-[58vh] overflow-y-auto px-5 py-5">
					<RecommendedProducts isBreakfastOnly={isBreakfastOnly} />
				</div>
				{totalAmount < MIN_ORDER_AMOUNT && (
					<div className="mx-5 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
						Brakuje jeszcze {amountNeeded.toFixed(2)} zł do minimalnej kwoty zamówienia, która wynosi 50 zł.
					</div>
				)}
				<div className="flex justify-end border-t border-border bg-white px-5 py-4">
					<LoadingButton
						isLoading={isLoading}
						disabled={totalAmount < MIN_ORDER_AMOUNT}
						variant="default"
						onClick={onContinue}
						className="h-11 rounded-xl bg-primary px-5 text-secondary hover:bg-primary/90"
					>
						Kontynuj <ArrowRight size={16} />
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>

	)
}

export default RecommendDialog
