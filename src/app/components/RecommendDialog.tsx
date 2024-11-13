'use client'

import RecommendedProducts from '@/app/components/RecommendedProducts'
import { Dialog, DialogContent, DialogHeader } from '@/app/components/ui/dialog'
import { MdKeyboardArrowRight } from 'react-icons/md'
import LoadingButton from './LoadingButton'

interface RecommendDialogProps {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onContinue: () => void
	isLoading: boolean
}

const RecommendDialog: React.FC<RecommendDialogProps> = ({ isOpen, onOpenChange, onContinue, isLoading }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='h-5/6'>
				<DialogHeader>
					<h3 className="text-xl font-semibold text-text-secondary mb-4">Nasi klienci często dobierają:</h3>
				</DialogHeader>
				<div className="overflow-auto">
					<RecommendedProducts />
				</div>
				<div className="flex justify-end space-x-4 mt-4">

					{/* <Button variant="secondary" onClick={onContinue}>Kontynuuj <MdKeyboardArrowRight /></Button> */}
					<LoadingButton isLoading={isLoading} variant="secondary" onClick={onContinue}>Kontynuj <MdKeyboardArrowRight /></LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default RecommendDialog
