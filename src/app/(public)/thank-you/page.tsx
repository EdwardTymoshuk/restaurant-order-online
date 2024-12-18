'use client'

import { Skeleton } from '@/app/components/ui/skeleton'
import { formatDate } from '@/utils/formateDate'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MdKeyboardArrowLeft, MdSearch } from 'react-icons/md'
import OrderTrackingDialog from '../../components/OrderTrackingDialog'
import { Button } from '../../components/ui/button'
import { useOrder } from '../../context/OrderContext'

const ThankYouPage = () => {
	const router = useRouter()
	const { orderId, phoneNumber, clientName, deliveryMethod, deliveryTime, clearOrderData } = useOrder()
	const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	// useEffect(() => {
	// 	// Перевірка наявності orderId та phoneNumber
	// 	if (!orderId || !phoneNumber) {
	// 		router.replace('/order') // Перенаправляємо одразу на сторінку "order"
	// 	} else {
	// 		setIsLoading(false) // Якщо все є, знімаємо стан завантаження
	// 	}
	// }, [orderId, phoneNumber, router])



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
		<div className="flex flex-col md:flex-row gap-8 items-center justify-center h-[calc(100vh-5rem)] w-screen max-w-6xl bg-[url('/img/thank-you-page.webp')] bg-cover bg-no-repeat md:bg-none md:bg-background px-8">
			<div className="hidden md:flex relative w-full h-3/4 rounded-md">
				<Image
					src="/img/thank-you-page.webp"
					alt="Thank you"
					fill
					className='object-cover object-top rounded-md'
				/>
			</div>

			{/* Права частина з текстом */}
			<div className="w-full h-3/4 bg-background/90 flex flex-col justify-center md:justify-between items-center lg:items-start rounded-md p-4">
				<h1 className="text-5xl text-center font-semibold text-secondary mb-6">Dziękujemy za zamówienie!</h1>
				<div className="flex flex-col text-xl font-bold my-6 self-center">
					<p>Numer zamówienia: <span className="text-secondary">{orderId}</span></p>
					<p>Numer telefonu: <span className="text-secondary">{phoneNumber}</span></p>
					<p>Metoda dostawy: <span className="text-secondary">{deliveryMethod === 'DELIVERY' ? 'Dostawa' : 'Odbiór'}</span></p>
					<p>Przybliony czas {deliveryMethod === 'DELIVERY' ? 'dostawy' : 'odbioru'}: <span className="text-secondary">
						{deliveryTime ? formatDate(deliveryTime) : 'Czas nieznany'}
					</span></p>
				</div>
				<div className='flex self-center gap-2'>
					<Button variant="secondary" className="w-full mt-4" onClick={() => router.push('/order')}>
						<MdKeyboardArrowLeft size={18} /> Do menu
					</Button>
					<Button variant="secondary" className="w-full mt-4" onClick={() => setIsOrderTrackingOpen(true)}>
						<MdSearch size={18} /> Śledź zamówienie
					</Button>
				</div>
			</div>

			{/* Діалогове вікно для слідкування за замовленням */}
			<OrderTrackingDialog
				isOpen={isOrderTrackingOpen}
				onOpenChange={setIsOrderTrackingOpen}
			/>
		</div>
	)
}

export default ThankYouPage
