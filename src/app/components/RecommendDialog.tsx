'use client'

import RecommendedProducts from '@/app/components/RecommendedProducts'
import { Dialog, DialogContent, DialogHeader } from '@/app/components/ui/dialog'
import { MIN_ORDER_AMOUNT } from '@/config/constants'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { useCart } from '../context/CartContext'
import LoadingButton from './LoadingButton'

interface RecommendDialogProps {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onContinue: () => void
	isLoading: boolean
}

const RecommendDialog: React.FC<RecommendDialogProps> = ({ isOpen, onOpenChange, onContinue, isLoading }) => {
	const { state } = useCart()
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='h-fit'>
				<DialogHeader>
					<h3 className="text-xl font-semibold text-text-secondary mb-4">Polecamy również:</h3>
				</DialogHeader>
				<div className="overflow-auto">
					<RecommendedProducts />
				</div>
				<div className="flex justify-end space-x-4 mt-4">

					{/* <Button variant="secondary" onClick={onContinue}>Kontynuuj <MdKeyboardArrowRight /></Button> */}
					<LoadingButton isLoading={isLoading} disabled={state.totalAmount < MIN_ORDER_AMOUNT} variant="secondary" onClick={onContinue}>Kontynuj <MdKeyboardArrowRight /></LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default RecommendDialog
