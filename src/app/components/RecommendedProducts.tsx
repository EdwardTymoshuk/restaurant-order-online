'use client'

import { useMenu } from '../context/MenuContext'
import MenuItem from './MenuItem'

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

	// Якщо дані ще завантажуються, виводимо індикатор завантаження
	if (loading) {
		return <div>Loading...</div>
	}

	// Якщо немає рекомендованих товарів, виводимо повідомлення
	if (recommendedItems.length === 0) {
		return <p>Brak rekomendowanych produktów</p>
	}

	return (
		<div className="max-h-full overflow-auto">
			{recommendedItems.map((item) => (
				<MenuItem
					key={item.id}
					id={item.id}
					name={item.name}
					category={item.category}
					price={item.price}
					image={item.image!}
					orientation="horizontal"
					className="px-4"
					isOrderingActive={true}
					isPizzaAvailable
				/>
			))}
		</div>
	)
}

export default RecommendedProducts
