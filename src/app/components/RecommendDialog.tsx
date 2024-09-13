'use client'

import RecommendedProducts from '@/app/components/RecommendedProducts'
import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent } from '@/app/components/ui/dialog'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { SheetClose } from './ui/sheet'

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
					<SheetClose>
						<Button variant="secondary" onClick={onContinue}>Kontynuuj <MdKeyboardArrowRight /></Button>
					</SheetClose>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default RecommendDialog
