'use client'

import { MENU_ITEMS } from '@/config'
import MenuItem from './MenuItem'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel'

const RecommendedProducts = () => {
	// Фільтруємо рекомендовані товари з MENU_ITEMS
	const recommendedItems = MENU_ITEMS.filter(item => item.isRecommended)

	return (
		<div className="overflow-hidden">
			<h3 className="text-xl font-semibold text-text-secondary mb-4">Nasi klienci często dobierają:</h3>

			<Carousel
				opts={{
					align: "start",
				}}
				className="w-full"
			>
				<CarouselContent className='gap-6 ml-0'>
					{recommendedItems.map((item, index) => (
						<CarouselItem key={index} className="mx-auto pl-0">
							<MenuItem name={item.name} price={item.price} orientation='horizontal' className='px-4' />
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious size='sm' className='text-primary hover:text-primary opacity-50 hover:opacity-100 -left-6 bg-transparent hover:bg-transparent transition-all' />
				<CarouselNext size='sm' className='text-primary hover:text-primary opacity-50 hover:opacity-100 -right-6 bg-transparent hover:bg-transparent transition-all' />
			</Carousel>
		</div>
	)
}

export default RecommendedProducts
