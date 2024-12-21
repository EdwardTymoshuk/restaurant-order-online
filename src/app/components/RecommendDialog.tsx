'use client'

import RecommendedProducts from '@/app/components/RecommendedProducts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { MIN_ORDER_AMOUNT } from '@/config/constants'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { useCart } from '../context/CartContext'
import LoadingButton from './LoadingButton'

interface RecommendDialogProps {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onContinue: () => void
	isLoading: boolean
	isBreakfastOnly: boolean
}

const RecommendDialog: React.FC<RecommendDialogProps> = ({ isOpen, onOpenChange, onContinue, isLoading, isBreakfastOnly }) => {
	const { state } = useCart()
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='h-fit'>
				<DialogDescription hidden>Polecane produkty</DialogDescription>
				<DialogTitle hidden>Polecane produkty</DialogTitle>
				<DialogHeader>
					<h3 className="text-xl font-semibold text-text-secondary mb-4">Polecamy również:</h3>
				</DialogHeader>
				<div className="overflow-auto">
					<RecommendedProducts isBreakfastOnly={isBreakfastOnly} />
				</div>
				<div className="flex justify-end space-x-4 mt-4">
					<LoadingButton isLoading={isLoading} disabled={state.totalAmount < MIN_ORDER_AMOUNT} variant="secondary" onClick={onContinue}>
						Kontynuuj <MdKeyboardArrowRight />
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default RecommendDialog
