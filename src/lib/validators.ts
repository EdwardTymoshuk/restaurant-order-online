import { Dispatch, SetStateAction } from 'react'

export const validateDeliveryForm = (
	formData: {
		city: string,
		postalCode: string,
		street: string,
		buildingNumber: string,
		flatNumber?: string
	},
	setErrors: Dispatch<SetStateAction<{
		city: string
		postalCode: string
		street: string
		buildingNumber: string
	}>>) => {

	const cities = ['Gdańsk', 'Sopot', 'Gdynia']

	let valid = true
	let newErrors = {
		city: '',
		postalCode: '',
		street: '',
		buildingNumber: '',
	}

	if (!cities.includes(formData.city)) {
		newErrors.city = 'Podane miasto nie istnieje lub znajduje się poza obszarem naszej dostawy'
		valid = false
	}

	if (!formData.postalCode.startsWith('80') && !formData.postalCode.startsWith('81')) {
		newErrors.postalCode = 'Podano zły kod pocztowy'
		valid = false
	}

	if (!formData.street) {
		newErrors.street = 'Ulica jest wymagana'
		valid = false
	}

	if (!formData.buildingNumber) {
		newErrors.buildingNumber = 'Nr budynku jest wymagany'
		valid = false
	}

	setErrors(newErrors)
	return valid
}