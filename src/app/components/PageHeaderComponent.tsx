import Image from 'next/image'
import PageContainer from './PageContainer'
import { Separator } from './ui/separator'
import { Skeleton } from './ui/skeleton'

const PageHeaderContainer = ({ title, description, image, isLoading }: { title: string, description: string, image: string, isLoading: boolean }) => {
	return (
		<PageContainer>
			{isLoading ? (
				<Skeleton className="h-16 w-3/4 mx-auto mb-4" />
			) : (
				<h2 className='text-4xl text-center font-semibold text-text-secondary py-4 px-2 self-center mx-2'>
					{title}
				</h2>
			)}

			<Separator className='mb-8 mx-auto w-1/2 bg-primary' />

			<div className='relative w-full h-96 mb-8'>
				{isLoading ? (
					<Skeleton className="w-full h-full rounded-lg" />
				) : (
					<Image
						src={image}
						alt={`${title} image header`}
						fill
						className='object-cover rounded-lg'
					/>
				)}
			</div>

			{isLoading ? (
				<Skeleton className="h-6 w-5/6 mx-auto mb-4" />
			) : (
				<span className='flex mx-auto text-sm md:text-lg lg:text-xl text-justify text-text-secondary'>
					{description}
				</span>
			)}

			<Separator className='my-8 mx-auto w-1/2 bg-primary' />
		</PageContainer>
	)
}

export default PageHeaderContainer
