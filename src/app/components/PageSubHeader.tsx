import { cn } from '@/lib/utils'

const PageSubHeader = ({ title, className }: { title: string, className?: string }) => {
	return (
		<h3 className={cn('text-4xl text-center font-semibold text-text-secondary pt-8 pb-4 px-2 self-center mx-2', className)}>
			{title}
		</h3>
	)
}

export default PageSubHeader
