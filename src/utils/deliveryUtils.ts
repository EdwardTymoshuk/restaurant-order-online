"use client"

/**
 * Utility functions for delivery-related logic.
 * Now we return -1 when the address is out of delivery zones or invalid.
 * Comments in English, keep Polish text if needed in other places.
 */

import { RESTAURANT_COORDINATES } from "@/config/constants"

export type Coordinates = {
	lat: number
	lng: number
}

export function haversineDistance(coords1: Coordinates, coords2: Coordinates): number {
	/**
	 * Calculates the great-circle distance between two lat/lng points (in meters).
	 * Uses the haversine formula. Returns meters.
	 */
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
	/**
	 * Fetches lat/lng using Google Geocoding API.
	 * Returns null if address is invalid or no results.
	 */
	if (!address || address.trim() === "") {
		console.error("Address is empty or invalid.")
		return null
	}
	try {
		const response = await fetch(
			`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
				address
			)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
		)

		const data = await response.json()

		if (data.status !== "OK" || !data.results.length) {
			console.error("Geocoding API returned an error or no results:", data.status)
			return null
		}

		const { lat, lng } = data.results[0].geometry.location
		return { lat, lng }
	} catch (error) {
		console.error("Error fetching from Geocoding API:", error)
		return null
	}
}

export async function isAddressInDeliveryArea(
	address: string,
	deliveryZones: { minRadius: number; maxRadius: number; price: number }[]
): Promise<boolean> {
	/**
	 * Checks if address is within any of the defined deliveryZones.
	 * Returns true if the distance from RESTAURANT_COORDINATES
	 * fits at least one zone range.
	 */
	const coordinates = await getCoordinates(address)
	if (coordinates) {
		const distanceMeters = haversineDistance(RESTAURANT_COORDINATES, coordinates)
		const distanceKm = distanceMeters / 1000
		return deliveryZones.some(
			(zone) => distanceKm >= zone.minRadius && distanceKm <= zone.maxRadius
		)
	}
	return false
}

export async function getDeliveryCost(
	address: string,
	deliveryZones: { minRadius: number; maxRadius: number; price: number }[]
): Promise<number> {
	/**
	 * Returns the delivery cost based on which delivery zone the address falls into.
	 * If address is out of all zones or invalid, we return -1.
	 * If address is found but outside known zones => return -1.
	 * If address is valid and inside a zone => return zone.price.
	 */
	const coordinates = await getCoordinates(address)
	if (!coordinates) {
		// If we cannot fetch valid coordinates, treat it as out of zone => -1
		return -1
	}
	const distanceMeters = haversineDistance(RESTAURANT_COORDINATES, coordinates)
	const distanceKm = distanceMeters / 1000

	const zone = deliveryZones.find(
		(zone) => distanceKm >= zone.minRadius && distanceKm <= zone.maxRadius
	)
	if (!zone) {
		// If no matching zone => -1 means "invalid or out of zone"
		return -1
	}
	return zone.price
}

export function hasStreetNumber(
	addressComponents: google.maps.GeocoderAddressComponent[] | undefined
): boolean {
	/**
	 * Optional helper to check if address has a street_number
	 * if you use google.maps.Geocoder types
	 */
	if (!addressComponents) return false
	return addressComponents.some((component) =>
		component.types.includes("street_number")
	)
}
