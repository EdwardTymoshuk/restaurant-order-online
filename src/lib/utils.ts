import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Coordinates = {
  lat: number
  lng: number
}

export function haversineDistance(coords1: Coordinates, coords2: Coordinates): number {
  const R = 6371
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
        "Geocoding API zwróciło błąd lub nie ma wyników:",
        data.status
      )
      return null
    }

    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng }
  } catch (error) {
    console.error("Błąd podczas żądania do Geocoding API:", error)
    return null
  }
}

export function hasStreetNumber(addressComponents: google.maps.GeocoderAddressComponent[] | undefined): boolean {
  if (!addressComponents) return false
  return addressComponents.some((component) =>
    component.types.includes("street_number")
  )
}
