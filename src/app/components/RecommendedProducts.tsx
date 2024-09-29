'use client'

import { useMenu } from '../context/MenuContext'
import MenuItem from './MenuItem'

const RecommendedProducts = () => {
	// Отримуємо елементи меню через контекст
	const { menuItems, loading } = useMenu()

	// Фільтруємо елементи, щоб показати тільки рекомендовані
	const recommendedItems = menuItems.filter(item => item.isRecommended)

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
					price={item.price}
					image={item.image!}
					orientation="horizontal"
					className="px-4"
				/>
			))}
		</div>
	)
}

export default RecommendedProducts
