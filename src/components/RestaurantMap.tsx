import { Coordinates, cn } from '@/lib/utils'
import { Circle, GoogleMap, Marker } from "@react-google-maps/api"

interface RestaurantMapProps {
	center: Coordinates
	zoom: number
	markers?: Coordinates[]
	circleRadius?: number
	circleOptions?: google.maps.CircleOptions
	className?: string
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({
	center,
	zoom,
	markers = [],
	circleRadius,
	circleOptions,
	className = '',
}) => {
	return (
		<div className={cn('h-80 w-full', className)}>
			<GoogleMap
				mapContainerStyle={{ width: '100%', height: '100%' }}
				center={center}
				zoom={zoom}
			>
				{markers.map((marker, index) => (
					<Marker key={index} position={marker} />
				))}

				{circleRadius && (
					<Circle
						center={center}
						radius={circleRadius}
						options={circleOptions}
					/>
				)}
			</GoogleMap>
		</div>
	)
}

export default RestaurantMap