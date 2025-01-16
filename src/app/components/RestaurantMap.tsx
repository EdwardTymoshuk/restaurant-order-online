import { Coordinates } from '@/utils/deliveryUtils'
import { cn } from '@/utils/utils'
import { Circle, GoogleMap, InfoWindow, Marker } from "@react-google-maps/api"
import { useState } from "react"

interface DeliveryZone {
	minRadius: number
	maxRadius: number
	price: number
}

interface RestaurantMapProps {
	center: Coordinates
	zoom: number
	markers?: Coordinates[]
	deliveryZones?: DeliveryZone[]
	circleOptions?: google.maps.CircleOptions
	className?: string
	addressMarker?: Coordinates | null// Додаємо проп для адреси користувача
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({
	center,
	zoom,
	markers = [],
	deliveryZones = [],
	circleOptions,
	className = '',
	addressMarker, // Приймаємо адресну позначку
}) => {
	const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
	const [infoPosition, setInfoPosition] = useState<Coordinates | null>(null)

	// Function to check which zone was clicked
	const handleMapClick = (event: google.maps.MapMouseEvent) => {
		if (!event.latLng || !deliveryZones) return

		const clickedLat = event.latLng.lat()
		const clickedLng = event.latLng.lng()

		// Calculate the distance from the center to the click point
		const distanceFromCenter = google.maps.geometry.spherical.computeDistanceBetween(
			new google.maps.LatLng(center.lat, center.lng),
			new google.maps.LatLng(clickedLat, clickedLng)
		)

		// Find the corresponding zone
		const foundZone = deliveryZones.find(
			(zone) =>
				distanceFromCenter >= zone.minRadius * 1000 &&
				distanceFromCenter <= zone.maxRadius * 1000
		)

		if (foundZone) {
			setSelectedZone(foundZone)
			setInfoPosition({ lat: clickedLat, lng: clickedLng }) // Position of InfoWindow
		} else {
			setSelectedZone(null)
			setInfoPosition(null)
		}
	}

	return (
		<div className={cn('h-full w-full', className)}>
			<GoogleMap
				mapContainerStyle={{ width: '100%', height: '100%' }}
				center={center}
				zoom={zoom}
				onClick={handleMapClick} // Handle click on map
			>
				{/* Render restaurant marker */}
				{markers.map((marker, index) => (
					<Marker key={`restaurant-${index}`} position={marker} />
				))}

				{/* Render user address marker */}
				{addressMarker && (
					<Marker
						position={addressMarker}

					/>
				)}

				{/* Render delivery zones */}
				{deliveryZones.map((zone, index) => (
					<Circle
						key={`zone-${index}`}
						center={center}
						radius={zone.maxRadius * 1000}
						options={{
							strokeOpacity: 0.5,
							strokeWeight: 0.3,
							fillColor: '#aad957',
							fillOpacity: 0.1,
							clickable: false, // Disable direct click
							...circleOptions,
						}}
					/>
				))}

				{/* Info window for selected delivery zone */}
				{selectedZone && infoPosition && (
					<InfoWindow
						position={infoPosition}
						onCloseClick={() => {
							setSelectedZone(null)
							setInfoPosition(null)
						}}
					>
						<div>
							<h2 className='text-lg text-text-secondary'>Koszt dostawy:</h2>
							<p className='text-lg font-bold text-center text-secondary'>{selectedZone.price} zł</p>
						</div>
					</InfoWindow>
				)}
			</GoogleMap>
		</div>
	)
}

export default RestaurantMap
