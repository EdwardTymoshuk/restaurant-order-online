'use client'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { useCart } from '@/app/context/CartContext'
import { getCoordinates, isAddressInDeliveryArea } from '@/lib/deliveryUtils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BsCashCoin } from 'react-icons/bs'
import { FaApplePay, FaGooglePay, FaRegCreditCard } from 'react-icons/fa6'
import { MdKeyboardArrowLeft, MdOutlineDeliveryDining, MdOutlineRestaurantMenu } from 'react-icons/md'
import { toast } from 'sonner'
import { z } from 'zod'
import LoadingButton from '../components/LoadingButton'
import PageSubHeader from '../components/PageSubHeader'
import Switcher from '../components/Switcher'
import TimeDeliverySwitcher from '../components/TimeDeliverySwitcher'
import { Separator } from '../components/ui/separator'

// Схема для доставки
const deliverySchema = z.object({
	name: z.string().min(1, 'Podaj imię').max(20, 'Imię jest zbyt długie'),
	phone: z.string().regex(/^\+?[0-9]{9}$/, 'Podaj numer telefonu w formacie xxxxxxxxxx'),
	city: z.string().min(3, 'Podaj miasto').max(50),
	postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie 00-000'),
	street: z.string().min(1, 'Podaj ulicę').max(50),
	buildingNumber: z.preprocess(
		(val) => val === '' ? undefined : (isNaN(Number(val)) ? undefined : Number(val)),
		z.number({ required_error: 'Podaj numer budynku' })
			.min(1, 'Podaj poprawny numer budynku')
	),
	apartment: z.preprocess(
		(val) => val === '' ? undefined : (isNaN(Number(val)) ? undefined : Number(val)),
		z.number().positive().optional()
	),
	paymentMethod: z.string().min(1, 'Wybierz metodę płatności'),
	deliveryTime: z.union([
		z.literal('asap'),
		z.date().refine((date) => date > new Date(), { message: 'Podaj poprawną godzinę dostawy' }),
	]),
})

const takeOutSchema = z.object({
	name: z.string().min(1, 'Podaj imię').max(20, 'Imię jest zbyt długie'),
	phone: z.string().regex(/^\+?[0-9]{9}$/, 'Podaj numer w formacie xxxxxxxxxx'),
	paymentMethod: z.string().min(1, 'Wybierz metodę płatności'),
	deliveryTime: z.union([
		z.literal('asap'),
		z.date().refine((date) => date > new Date(), { message: 'Podaj poprawną godzinę dostawy' }),
	]),
})

type DeliveryFormData = z.infer<typeof deliverySchema>
type TakeOutFormData = z.infer<typeof takeOutSchema>

const Page = () => {

	const { state } = useCart()
	const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'take-out'>('take-out')
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	const router = useRouter()

	const { register: registerDelivery, handleSubmit: handleSubmitDelivery, formState: formStateDelivery, setValue: setValueDelivery, getValues: getValuesDelivery, reset: resetDelivery } = useForm<DeliveryFormData>({
		resolver: zodResolver(deliverySchema),
		defaultValues: {
			name: '',
			phone: '',
			paymentMethod: '',
			city: '',
			postalCode: '',
			street: '',
			buildingNumber: undefined,
			apartment: undefined,
			deliveryTime: 'asap',
		},
		mode: 'onChange',
	})

	const { register: registerTakeOut, handleSubmit: handleSubmitTakeOut, formState: formStateTakeOut, setValue: setValueTakeOut, getValues: getValuesTakeOut, reset: resetTakeOut } = useForm<TakeOutFormData>({
		resolver: zodResolver(takeOutSchema),
		defaultValues: {
			name: '',
			phone: '',
			paymentMethod: '',
			deliveryTime: 'asap',
		},
		mode: 'onChange',
	})

	useEffect(() => {
		const savedMethod = localStorage.getItem('deliveryMethod') as 'delivery' | 'take-out'
		if (savedMethod) {
			setDeliveryMethod(savedMethod)
		}
	}, [])

	useEffect(() => {
		const deliveryAddress = localStorage.getItem('deliveryAddress')
		if (deliveryAddress) {
			const parts = deliveryAddress.split(', ')
			if (parts.length >= 3) {
				setValueDelivery('city', parts[1].split(' ')[1])
				setValueDelivery('postalCode', parts[1].split(' ')[0])
				setValueDelivery('street', parts[0].split(' ')[0])
				setValueDelivery('buildingNumber', parseInt(parts[0].split(' ')[1], 10))
			}
		}
	}, [setValueDelivery])

	// Обробка перевірки адреси
	const handleCheckAddress = async () => {
		let isValid = true
		try {
			const formData = getValuesDelivery()

			const { city, postalCode, street, buildingNumber } = formData
			const fullAddress = `${street} ${buildingNumber}, ${postalCode} ${city}`

			const coordinates = await getCoordinates(fullAddress)
			if (!coordinates) {
				toast.error("Podany adres nie istnieje.")
				isValid = false
				return
			}

			const inDeliveryArea = await isAddressInDeliveryArea(fullAddress)
			if (!inDeliveryArea) {
				toast.warning("Twój adres jest poza obszarem dostawy.")
				isValid = false
				return
			}
			return isValid = true

		} catch (error) {
			toast.error("Wystąpił błąd sprawdzenia adresu.")
		} finally {
			return isValid
		}
	}

	const handleTimeChange = (timeOption: 'asap' | Date) => {
		if (deliveryMethod === 'take-out') {
			setValueTakeOut('deliveryTime', timeOption)
		} else {
			setValueDelivery('deliveryTime', timeOption)
		}
	}

	const handlePaymentMethodSelect = (method: string) => {
		setSelectedPaymentMethod(method)
		deliveryMethod === 'take-out' ?
			setValueTakeOut('paymentMethod', method) :
			setValueDelivery('paymentMethod', method)

	}

	const onDeliverySubmit = async (data: DeliveryFormData) => {
		setIsLoading(true)
		let isValid = await handleCheckAddress()

		if (!data.paymentMethod) {
			toast.error('Nie wybrano metody opłaty')
			setIsLoading(false)
			return
		}

		if (isValid === false) {
			setIsLoading(false)
			return
		}

		localStorage.setItem('deliveryAddress', '')

		toast.success('Zamówienie z dostawą zostało złożone!')
		console.log('Delivery order:', { ...data, orderItems: state.items, totalAmount: state.totalAmount })

		resetDelivery()
		resetTakeOut()
		setIsLoading(false)
		// router.push('/thank-you')
	}

	const onTakeOutSubmit = async (data: TakeOutFormData) => {
		setIsLoading(true)
		toast.success('Zamówienie z odbiorem osobistym zostało złożone!')
		console.log('Take-out order:', { ...data, deliveryMethod, orderItems: state.items, totalAmount: state.totalAmount })
		setIsLoading(false)
		// router.push('/thank-you')
	}

	return (
		<div className="container mx-auto p-4">
			<Button variant="link" onClick={() => router.push('/order')} className='p-0 text-secondary'>
				<MdKeyboardArrowLeft size={24} /><span>Wróć do menu</span>
			</Button>

			<PageSubHeader title='Podsumowanie zamówienia' />

			<div className="flex flex-col md:flex-row justify-between gap-8">
				<div className="space-y-8 w-full">
					<div></div>
					<div className="space-y-2">
						<h3 className="text-xl text-secondary font-semibold">Metoda dostawy</h3>
						<Switcher
							options={[
								{ value: 'delivery', label: 'Dostawa', icon: <MdOutlineDeliveryDining /> },
								{ value: 'take-out', label: 'Odbiór', icon: <MdOutlineRestaurantMenu /> },
							]}
							activeValue={deliveryMethod}
							onChange={setDeliveryMethod}
						/>
					</div>
					{deliveryMethod === 'delivery' && (
						<form id='deliveryForm' onSubmit={handleSubmitDelivery(onDeliverySubmit)} className="space-y-8">
							<div className="space-y-4 w-full">
								<div className="space-y-2">
									<h3 className="text-xl text-secondary font-semibold">Czas dostawy</h3>
									<TimeDeliverySwitcher onTimeChange={handleTimeChange} />
								</div>
								<div className='space-y-2'>
									<h3 className="text-xl text-secondary font-semibold">Dane do dostawy</h3>
									<div className="flex flex-col gap-4 w-full">
										<div className='flex w-full gap-4 items-start'>
											<div className='w-full flex flex-col'>
												<label htmlFor="name" className="text-sm font-medium text-text-secondary mt-2">Imię <span className='text-danger'>*</span></label>
												<Input
													id='name'
													placeholder="Imię"
													{...registerDelivery('name')}
													className={`mt-1 ${formStateDelivery.errors.name ? 'border-danger' : ''}`}
												/>
												{formStateDelivery.errors.name && (
													<p className="text-danger text-sm pt-1">{formStateDelivery.errors.name.message}</p>
												)}
											</div>
											<div className='w-full flex flex-col'>
												<label htmlFor="phone" className="block text-sm font-medium text-text-secondary mt-2">Nr telefonu <span className='text-danger'>*</span></label>
												<Input
													id='phone'
													placeholder="Numer телефону"
													{...registerDelivery('phone')}
													className={`mt-1 ${formStateDelivery.errors.phone ? 'border-danger' : ''}`}
												/>
												{formStateDelivery.errors.phone && (
													<p className="text-danger text-sm pt-1">{formStateDelivery.errors.phone.message}</p>
												)}
											</div>
										</div>

										<div className='flex w-full gap-4 items-start'>
											<div className='w-full flex flex-col'>
												<label htmlFor="city" className="block text-sm font-medium text-text-secondary mt-2">Miasto <span className='text-danger'>*</span></label>
												<Input
													id="city"
													placeholder="Miasto"
													{...registerDelivery('city')}
													className={`mt-1 ${formStateDelivery.errors.city ? 'border-danger' : ''}`}
												/>
												{formStateDelivery.errors.city && (
													<p className="text-danger text-sm pt-1">{formStateDelivery.errors.city?.message}</p>
												)}
											</div>
											<div className='w-full flex flex-col'>
												<label htmlFor="postalCode" className="block text-sm font-medium text-text-secondary mt-2">Kod pocztowy <span className='text-danger'>*</span></label>
												<Input
													id="postalCode"
													placeholder="00-000"
													{...registerDelivery('postalCode')}
													className={`mt-1 ${formStateDelivery.errors.postalCode ? 'border-danger' : ''}`}
												/>
												{formStateDelivery.errors.postalCode && (
													<p className="text-danger text-sm pt-1">{formStateDelivery.errors.postalCode?.message}</p>
												)}
											</div>
										</div>
										<div className='w-full flex flex-col'>
											<label htmlFor="street" className="block text-sm font-medium text-text-secondary mt-2">Ulica <span className='text-danger'>*</span></label>
											<Input
												id="street"
												placeholder="Ulica"
												{...registerDelivery('street')}
												className={`mt-1 w-full ${formStateDelivery.errors.street ? 'border-danger' : ''}`}
											/>
											{formStateDelivery.errors.street && (
												<p className="text-danger text-sm pt-1">{formStateDelivery.errors.street?.message}</p>
											)}
										</div>
										<div className='flex w-full gap-4 items-start'>
											<div className='w-full flex flex-col'>
												<label htmlFor="buildingNumber" className="block text-sm font-medium text-text-secondary mt-2">Nr budynku <span className='text-danger'>*</span></label>
												<Input
													id="buildingNumber"
													placeholder="Nr budynku"
													type="number"
													{...registerDelivery('buildingNumber', { valueAsNumber: true })}
													className={`mt-1 ${formStateDelivery.errors.buildingNumber ? 'border-danger' : ''}`}
												/>
												{formStateDelivery.errors.buildingNumber && (
													<p className="text-danger text-sm pt-1">{formStateDelivery.errors.buildingNumber?.message}</p>
												)}
											</div>
											<div className='w-full flex flex-col'>
												<label htmlFor="apartment" className="block text-sm font-medium text-text-secondary mt-2">Nr mieszkania (opcjonalnie)</label>
												<Input
													id="apartment"
													placeholder="Nr mieszkania"
													type="number"
													{...registerDelivery('apartment', { valueAsNumber: true })}
													className="mt-1 w-full"
												/>
												{formStateDelivery.errors.apartment && (
													<p className="text-danger text-sm pt-1">{formStateDelivery.errors.apartment?.message}</p>
												)}
											</div>
										</div>
									</div>
								</div>


								<div className='space-y-2'>
									<h3 className="text-xl text-secondary font-semibold">Płatność przy odbiorze</h3>
									<div className="grid grid-cols-2 gap-4">
										<Button
											type="button"
											variant={selectedPaymentMethod === 'credit_card_offline' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('credit_card_offline')}
											className="flex items-center space-x-2"
										>
											<FaRegCreditCard size={18} />
											<span>Karta płatnicza</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'cash_offline' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('cash_offline')}
											className="flex items-center space-x-2"
										>
											<BsCashCoin size={18} />
											<span>Gotówкa</span>
										</Button>
									</div>
									<h3 className="text-xl text-secondary font-semibold">Płatność online</h3>
									<div className="grid grid-cols-2 gap-4">
										<Button
											type="button"
											variant={selectedPaymentMethod === 'credit_card_online' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('credit_card_online')}
											className="flex items-center space-x-2"
										>
											<FaRegCreditCard size={18} />
											<span>Karta płatnicza</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'blik' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('blik')}
											className="flex items-center space-x-2"
										>
											<span>Blik</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'apple_pay' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('apple_pay')}
											className="flex items-center space-x-2"
										>
											<FaApplePay size={22} />
											<span>Apple Pay</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'google_pay' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('google_pay')}
											className="flex items-center space-x-2"
										>
											<FaGooglePay size={22} />
											<span>Google Pay</span>
										</Button>
									</div>
									{formStateDelivery.errors.paymentMethod && (
										<p className="text-danger text-sm pt-1">{formStateDelivery.errors.paymentMethod?.message}</p>
									)}
								</div>
							</div>
						</form>
					)}

					{deliveryMethod === 'take-out' && (
						<form id='takeOutForm' onSubmit={handleSubmitTakeOut(onTakeOutSubmit)} className="space-y-8">

							<div className="space-y-4 w-full">
								<div className='space-y-2'>
									<div className="space-y-2">
										<h3 className="text-xl text-secondary font-semibold">Czas dostawy</h3>
										<TimeDeliverySwitcher onTimeChange={handleTimeChange} />
									</div>
									<h3 className="text-xl text-secondary font-semibold">Dane do dostawy</h3>
									<div className="flex gap-4 w-full">
										<div className='w-full'>
											<label htmlFor="name" className="block text-sm font-medium text-text-secondary">Imię <span className='text-danger'>*</span></label>
											<Input
												id='name'
												placeholder="Imię"
												{...registerTakeOut('name')}
												className={`flex-1 mt-1 ${formStateTakeOut.errors.name ? 'border-danger' : ''}`}
											/>
											{formStateTakeOut.errors.name && (
												<p className="text-danger text-sm pt-1">{formStateTakeOut.errors.name.message}</p>
											)}
										</div>
										<div className='w-full'>
											<label htmlFor="phone" className="block text-sm font-medium text-text-secondary">Nr telefonu <span className='text-danger'>*</span></label>
											<Input
												id='phone'
												placeholder="Numer телефону"
												{...registerTakeOut('phone')}
												className={`flex-1 mt-1 ${formStateTakeOut.errors.phone ? 'border-danger' : ''}`}
											/>
											{formStateTakeOut.errors.phone && (
												<p className="text-danger text-sm pt-1">{formStateTakeOut.errors.phone.message}</p>
											)}
										</div>
									</div>
								</div>

								<div className='space-y-2'>
									<h3 className="text-xl text-secondary font-semibold">Płatność przy odbiorze</h3>
									<div className="grid grid-cols-2 gap-4">
										<Button
											type="button"
											variant={selectedPaymentMethod === 'credit_card_offline' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('credit_card_offline')}
											className="flex items-center space-x-2"
										>
											<FaRegCreditCard size={18} />
											<span>Karta płatnicza</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'cash_offline' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('cash_offline')}
											className="flex items-center space-x-2"
										>
											<BsCashCoin size={18} />
											<span>Gotówкa</span>
										</Button>
									</div>
									<h3 className="text-xl text-secondary font-semibold">Płatność online</h3>
									<div className="grid grid-cols-2 gap-4">
										<Button
											type="button"
											variant={selectedPaymentMethod === 'credit_card_online' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('credit_card_online')}
											className="flex items-center space-x-2"
										>
											<FaRegCreditCard size={18} />
											<span>Karta płatnicza</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'blik' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('blik')}
											className="flex items-center space-x-2"
										>
											<span>Blik</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'apple_pay' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('apple_pay')}
											className="flex items-center space-x-2"
										>
											<FaApplePay size={22} />
											<span>Apple Pay</span>
										</Button>

										<Button
											type="button"
											variant={selectedPaymentMethod === 'google_pay' ? 'default' : 'secondary'}
											onClick={() => handlePaymentMethodSelect('google_pay')}
											className="flex items-center space-x-2"
										>
											<FaGooglePay size={22} />
											<span>Google Pay</span>
										</Button>
									</div>
									{formStateDelivery.errors.paymentMethod && (
										<p className="text-danger text-sm pt-1">{formStateDelivery.errors.paymentMethod?.message}</p>
									)}
								</div>


							</div>
						</form>
					)}
				</div>
				<Separator className='hidden md:flex h-auto' orientation='vertical' />

				<div className="space-y-6 w-full">
					<h3 className="text-xl text-secondary font-semibold">Twoje zamówienie</h3>
					<ul className="divide-y divide-gray-200">
						{state.items.map((item) => (
							<li key={item.id} className="flex py-6">
								<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
									<img
										src={item.image}
										alt={item.name}
										className="h-full w-full object-cover object-center"
									/>
								</div>
								<div className="ml-4 flex flex-1 flex-col justify-between">
									<div>
										<h3 className="text-secondary font-medium">{item.name}</h3>
										<p className="mt-1 text-sm text-gray-500">Ilość: {item.quantity}</p>
									</div>
									<p className="text-lg font-semibold text-gray-900">
										{item.price * item.quantity} zł
									</p>
								</div>
							</li>
						))}
					</ul>
					<div className="flex font-sans justify-between text-xl font-bold text-text-secondary">
						<span>Total</span>
						<span>{state.totalAmount} zł</span>
					</div>
					<LoadingButton form={deliveryMethod === 'delivery' ? 'deliveryForm' : 'takeOutForm'} variant='secondary' isLoading={isLoading} className="w-full" type="submit">Złóż zamówienie</LoadingButton>
				</div>
			</div>
		</div>
	)
}

export default Page
