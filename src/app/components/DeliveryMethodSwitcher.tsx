'use client'

import { Input } from '@/app/components/ui/input'
import { getCoordinates, isAddressInDeliveryArea } from '@/lib/deliveryUtils'
import { validateDeliveryForm } from '@/lib/validators'
import { useEffect, useState } from 'react'
import { MdOutlineDeliveryDining, MdOutlineRestaurantMenu } from 'react-icons/md'
import { toast } from 'sonner'
import Switcher from '../components/Switcher'
import { useCheckout } from '../context/CheckoutContext'
import { Button } from './ui/button'

interface DeliveryMethodSwitcherProps {
	deliveryMethod: 'delivery' | 'take-out'
	setDeliveryMethod: (method: 'delivery' | 'take-out') => void
	setAddress: (address: string) => void
	onValidate: (isValid: boolean) => void
}

interface OptionsProps {
	value: 'delivery' | 'take-out',
	label: string,
	icon: React.ReactNode,
}

const DeliveryMethodSwitcher: React.FC<DeliveryMethodSwitcherProps> = ({ deliveryMethod, setDeliveryMethod, setAddress, onValidate }) => {
	// const [deliveryData, setdeliveryData] = useState({
	// 	city: '',
	// 	postalCode: '',
	// 	street: '',
	// 	buildingNumber: '',
	// 	flatNumber: ''
	// })
	const [loading, setLoading] = useState(false)
	const [errors, setErrors] = useState({
		city: '',
		postalCode: '',
		street: '',
		buildingNumber: '',
	})

	const options: OptionsProps[] = [
		{ value: 'delivery', label: 'Dostawa', icon: <MdOutlineDeliveryDining /> },
		{ value: 'take-out', label: 'Odbiór', icon: <MdOutlineRestaurantMenu /> },
	]

	const { setDeliveryData, deliveryData } = useCheckout()

	useEffect(() => {
		const deliveryAddress = localStorage.getItem('deliveryAddress')
		if (deliveryAddress) {
			const parts = deliveryAddress.split(', ')
			if (parts.length >= 3) {
				const city = parts[1].split(' ')[1]
				const postalCode = parts[1].split(' ')[0]
				const street = parts[0].split(' ')[0]
				const buildingNumber = parts[0].split(' ')[1]
				setDeliveryData({
					city: city || '',
					postalCode: postalCode || '',
					street: street || '',
					buildingNumber: buildingNumber || '',
					flatNumber: '',
				})
			}
		}
	}, [])

	// useEffect(() => {
	// 	if (deliveryMethod === 'delivery') {
	// 		handleOrderClick()
	// 	}
	// }, [deliveryMethod])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target
		setDeliveryData((prevData) => ({
			...prevData,
			[id]: value,
		}))
	}

	const handleOrderClick = async () => {
		setLoading(true)
		if (!validateDeliveryForm(deliveryData, setErrors)) {
			setLoading(false)
			return
		}

		try {
			const address = `${deliveryData.street} ${deliveryData.buildingNumber}, ${deliveryData.postalCode} ${deliveryData.city}`
			const deliveryCoordinates = await getCoordinates(address)
			if (!deliveryCoordinates) {
				toast.error("Podany adres nie istnieje. Proszę sprawdzić wprowadzone dane.")
				setLoading(false)
				return
			}

			const available = await isAddressInDeliveryArea(address)

			if (available) {
				toast.success('Gratulacje! Twój adres znajduje się w zasięgu naszej dostawy.')
				setAddress(address)
			} else {
				toast.warning('Niestety, twój adres nie znajduje się w zasięgu naszej dostawy.')
			}
		} catch (error) {
			console.error('Error while handling order click:', error)
			toast.error('Wystąpił błąd podczas weryfikacji adresu.')
		} finally {
			setLoading(false)
		}
	}

	const onChange = (value: 'delivery' | 'take-out') => {
		setDeliveryMethod(value)
	}

	return (
		<div className="flex flex-col w-full mx-auto">
			<Switcher
				options={options}
				activeValue={deliveryMethod}
				onChange={onChange}
			/>
			{deliveryMethod === 'delivery' && (
				<div>
					<div className="space-y-4 py-4">
						<form className="space-y-4">
							<div>
								<label htmlFor="city" className="block text-sm font-medium text-text-secondary">Miasto <span className='text-danger'>*</span></label>
								<Input
									id="city"
									value={deliveryData.city}
									onChange={handleChange}
									placeholder='Miasto'
									className={`mt-1 block w-full ${errors.city ? 'border-danger' : ''}`}
								/>
								{errors.city && <p className="text-danger text-sm">{errors.city}</p>}
							</div>
							<div>
								<label htmlFor="postalCode" className="block text-sm font-medium text-text-secondary">Kod pocztowy <span className='text-danger'>*</span></label>
								<Input
									id="postalCode"
									value={deliveryData.postalCode}
									onChange={handleChange}
									placeholder='Kod pocztowy w formacie xx-xxx'
									className={`mt-1 block w-full ${errors.postalCode ? 'border-danger' : ''}`}
								/>
								{errors.postalCode && <p className="text-danger text-sm">{errors.postalCode}</p>}
							</div>
							<div>
								<label htmlFor="street" className="block text-sm font-medium text-text-secondary">Ulica <span className='text-danger'>*</span></label>
								<Input
									id="street"
									value={deliveryData.street}
									onChange={handleChange}
									placeholder='Ulica'
									className={`mt-1 block w-full ${errors.street ? 'border-danger' : ''}`}
								/>
								{errors.street && <p className="text-danger text-sm">{errors.street}</p>}
							</div>
							<div>
								<label htmlFor="buildingNumber" className="block text-sm font-medium text-text-secondary">Nr budynku <span className='text-danger'>*</span></label>
								<Input
									id="buildingNumber"
									value={deliveryData.buildingNumber}
									onChange={handleChange}
									placeholder='Numer budynku'
									className={`mt-1 block w-full ${errors.buildingNumber ? 'border-danger' : ''}`}
								/>
								{errors.buildingNumber && <p className="text-danger text-sm">{errors.buildingNumber}</p>}
							</div>
							<div>
								<label htmlFor="flatNumber" className="block text-sm font-medium text-text-secondary">Nr mieszkania</label>
								<Input
									id="flatNumber"
									value={deliveryData.flatNumber}
									onChange={handleChange}
									placeholder='Numer mieszkania'
									className="mt-1 block w-full"
								/>
							</div>
						</form>
					</div>
					<Button
						variant='secondary'
						onClick={handleOrderClick}
						disabled={loading}
					>
						{loading ? 'Loading...' : 'Check Address'}
					</Button>
				</div>
			)}
		</div>
	)
}

export default DeliveryMethodSwitcher
