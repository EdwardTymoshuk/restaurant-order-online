'use client'

import RecommendedProducts from '@/app/components/RecommendedProducts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { MIN_ORDER_AMOUNT } from '@/config/constants'
import { MdKeyboardArrowRight } from 'react-icons/md'
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
			<DialogContent className='h-fit w-[95%] md:w-full mx-auto p-2 md:p-4 rounded-md'>
				<DialogDescription hidden>Polecane produkty</DialogDescription>
				<DialogTitle hidden>Polecane produkty</DialogTitle>
				<DialogHeader>
					<h3 className="text-xl font-semibold text-text-secondary mb-4">Polecamy również:</h3>
				</DialogHeader>
				<div className="overflow-auto">
					<RecommendedProducts isBreakfastOnly={isBreakfastOnly} />
				</div>
				{totalAmount < MIN_ORDER_AMOUNT && (
					<div className="mt-4 p-2 bg-warning-light text-warning text-center rounded-md">
						Brakuje jeszcze {amountNeeded.toFixed(2)} zł do minimalnej kwoty zamówienia, która wynosi 50 zł.
					</div>
				)}
				<div className="flex justify-end space-x-4 mt-4">
					<LoadingButton isLoading={isLoading} disabled={totalAmount < MIN_ORDER_AMOUNT} variant="secondary" onClick={onContinue}>
						Kontynuj <MdKeyboardArrowRight />
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default RecommendDialog
