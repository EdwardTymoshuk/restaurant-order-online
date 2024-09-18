'use client'

import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MdKeyboardArrowLeft, MdSearch } from 'react-icons/md'
import { Separator } from '../components/ui/separator'
import { useOrder } from '../context/OrderContext'

const ThankYouPage = () => {
	const router = useRouter()
	const { orderId, phoneNumber, clientName, deliveryMethod, deliveryTime, clearOrderData } = useOrder()

	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		// Перевірка наявності orderId та phoneNumber
		if (!orderId || !phoneNumber) {
			router.replace('/order') // Перенаправляємо одразу на сторінку "order"
		} else {
			setIsLoading(false) // Якщо все є, знімаємо стан завантаження
		}
	}, [orderId, phoneNumber, router])

	// Функція для форматування дати
	const formatDate = (isoDateString: string): string => {
		const date = new Date(isoDateString)
		return date.toLocaleString('pl-PL', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	if (isLoading) {
		// Показуємо Skeleton під час завантаження або перевірки
		return (
			<div className="flex flex-col md:flex-row items-center justify-center h-[calc(100vh-5rem)] w-screen max-w-6xl bg-background p-0">
				{/* Ліва частина Skeleton для зображення */}
				<div className="hidden md:flex relative w-full h-full">
					<Skeleton className="w-full h-full" />
				</div>

				{/* Права частина Skeleton для тексту */}
				<div className="w-full h-full bg-background p-12 flex flex-col justify-center items-center lg:items-start">
					<Skeleton className="h-10 w-2/3 mb-4" />
					<Skeleton className="h-8 w-1/2 mb-4" />
					<Skeleton className="h-6 w-1/4 mb-4" />
					<Skeleton className="h-6 w-1/4 mb-4" />
					<Skeleton className="h-8 w-full mb-4" />
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col md:flex-row items-center justify-center h-[calc(100vh-5rem)] w-screen max-w-6xl bg-background p-0">
			<div className="hidden md:flex relative w-full h-full">
				<Image
					src="/img/thank-you-page.jpg"
					alt="Thank you"
					fill
					style={{ objectFit: 'cover', objectPosition: 'top' }}
				/>
			</div>

			{/* Права частина з текстом */}
			<div className="w-full h-full bg-background p-12 flex flex-col justify-center items-center lg:items-start">
				<h1 className="text-5xl text-center lg:text-start font-semibold text-secondary mb-6">Dziękujemy za zamówienie!</h1>
				<p className="text-xl text-center text-text-secondary mb-6">
					Witaj <span className="font-bold">{clientName}</span>, Twoje zamówienie zostało pomyślnie złożone!
				</p>
				<Separator orientation='horizontal' />
				<div className="text-xl font-bold my-6">
					<p>Numer zamówienia: <span className="text-secondary">{orderId}</span></p>
					<p>Numer telefonu: <span className="text-secondary">{phoneNumber}</span></p>
					<p>Metoda dostawy: <span className="text-secondary">{deliveryMethod === 'DELIVERY' ? 'Dostawa' : 'Odbiór'}</span></p>
					<p>Przybliony czas {deliveryMethod === 'DELIVERY' ? 'dostawy' : 'odbioru'}: <span className="text-secondary">
						{deliveryTime ? formatDate(deliveryTime) : 'Czas nieznany'}
					</span></p>
				</div>
				<Separator orientation='horizontal' />
				<div className='flex self-center gap-2'>
					<Button variant="secondary" className="w-full mt-4" onClick={() => router.push('/order')}>
						<MdKeyboardArrowLeft size={18} /> Do menu
					</Button>
					<Button variant="secondary" className="w-full mt-4" onClick={() => router.push('/check-order')}>
						<MdSearch size={18} /> Śledź zamóweinie
					</Button>
				</div>
			</div>
		</div>
	)
}

export default ThankYouPage
