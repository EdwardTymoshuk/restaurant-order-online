// src/lib/deliveryUtils.ts

import { DELIVERY_RADIUS_METERS, RESTAURANT_COORDINATES } from '@/config/constants'

export type Coordinates = {
	lat: number
	lng: number
}

export function haversineDistance(coords1: Coordinates, coords2: Coordinates): number {
	const R = 6371e3 // Earth's radius in meters
	const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180
	const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180
	const a =
		0.5 -
		Math.cos(dLat) / 2 +
		(Math.cos((coords1.lat * Math.PI) / 180) *
			Math.cos((coords2.lat * Math.PI) / 180) *
			(1 - Math.cos(dLng))) /
		2

	return R * 2 * Math.asin(Math.sqrt(a))
}

export async function getCoordinates(address: string): Promise<Coordinates | null> {
	try {
		const response = await fetch(
			`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
				address
			)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
		)

		const data = await response.json()

		if (data.status !== "OK" || !data.results.length) {
			console.error(
				"Geocoding API returned an error or no results:",
				data.status
			)
			return null
		}

		const { lat, lng } = data.results[0].geometry.location
		return { lat, lng }
	} catch (error) {
		console.error("Error fetching from Geocoding API:", error)
		return null
	}
}

export const isAddressInDeliveryArea = async (address: string): Promise<boolean> => {
	const coordinates = await getCoordinates(address)
	if (coordinates) {
		const distance = haversineDistance(
			RESTAURANT_COORDINATES,
			coordinates
		)
		return distance <= DELIVERY_RADIUS_METERS
	}
	return false
}

export function hasStreetNumber(addressComponents: google.maps.GeocoderAddressComponent[] | undefined): boolean {
	if (!addressComponents) return false
	return addressComponents.some((component) =>
		component.types.includes("street_number")
	)
}


