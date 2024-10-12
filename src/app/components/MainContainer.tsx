import { cn } from '@/utils/utils'
import { ReactNode } from 'react'

const MainContainer = ({
	className,
	children
}: {
	className?: string,
	children: ReactNode
}) => {
	return (
		<main className={cn('flex flex-col min-h-screen w-full max-w-6xl items-center pt-20 mx-auto px-2 md:px-8', className)} >
			{children}
		</main>
	)
}

export default MainContainer
