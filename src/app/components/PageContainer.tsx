
import { cn } from '@/utils/utils'
import { ReactNode } from 'react'

const PageContainer = ({
	className,
	children
}: {
	className?: string,
	children: ReactNode
}) => {
	return (
		<div className={cn('w-full flex flex-col items-center justify-center', className)} >
			{children}
		</div>
	)
}

export default PageContainer
