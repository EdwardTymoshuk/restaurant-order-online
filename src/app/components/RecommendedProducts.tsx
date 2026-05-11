'use client'

import { ShoppingBag } from 'lucide-react'
import { useMenu } from '../context/MenuContext'
import MenuItem from './MenuItem'
import { Skeleton } from './ui/skeleton'

const RecommendedProducts = ({ isBreakfastOnly }: { isBreakfastOnly: boolean }) => {
	// Отримуємо елементи меню через контекст
	const { menuItems, loading } = useMenu()

	// Фільтруємо елементи, щоб показати тільки рекомендовані
	const recommendedItems = menuItems.filter(item => {
		const isRecommended = item.isRecommended
		const isCorrectCategory =
			isBreakfastOnly ? item.category === 'Śniadania' : item.category !== 'Śniadania'

		return isRecommended && isCorrectCategory
	})

	if (loading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 3 }).map((_, index) => (
					<Skeleton key={index} className="h-40 w-full rounded-2xl" />
				))}
			</div>
		)
	}

	if (recommendedItems.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
				<ShoppingBag className="mx-auto mb-3 text-slate-300" size={34} strokeWidth={1.5} />
				<p className="text-sm font-semibold text-slate-800">Brak rekomendowanych produktów</p>
				<p className="mt-1 text-xs text-slate-400">Możesz przejść dalej do podsumowania.</p>
			</div>
		)
	}

	return (
		<div className="space-y-3">
			{recommendedItems.map((item) => (
				<MenuItem
					key={item.id}
					id={item.id}
					name={item.name}
					category={item.category}
					price={item.price}
					image={item.image!}
					orientation="horizontal"
					className="shadow-none"
					isOrderingActive={true}
					isPizzaAvailable
				/>
			))}
		</div>
	)
}

export default RecommendedProducts
