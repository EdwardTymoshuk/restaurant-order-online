'use client'

import RecommendedProducts from '@/components/RecommendedProducts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MdKeyboardArrowRight } from 'react-icons/md'

interface RecommendDialogProps {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onContinue: () => void
}

const RecommendDialog: React.FC<RecommendDialogProps> = ({ isOpen, onOpenChange, onContinue }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<div className="max-w-full overflow-x-auto">
					<RecommendedProducts />
				</div>
				<div className="flex justify-end space-x-4 mt-4">
					<Button variant="secondary" onClick={onContinue}>Kontynuuj <MdKeyboardArrowRight /></Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default RecommendDialog
