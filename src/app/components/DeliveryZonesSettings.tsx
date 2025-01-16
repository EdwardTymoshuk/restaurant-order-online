'use client'

import { Button } from '@/app/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DeliveryZone } from '../types/types'
import { Input } from './ui/input'
import { Separator } from './ui/separator'

const DeliveryZonesSettings = ({
	deliveryZones,
	onUpdateZones,
}: {
	deliveryZones: DeliveryZone[]
	onUpdateZones: (updatedZones: DeliveryZone[]) => void
}) => {
	const [zones, setZones] = useState<DeliveryZone[]>(() => deliveryZones)
	const [isAdding, setIsAdding] = useState(false)
	const [newZone, setNewZone] = useState<DeliveryZone | null>(null)

	const memoizedDeliveryZones = useMemo(() => deliveryZones, [deliveryZones])
	const memoizedOnUpdateZones = useCallback(onUpdateZones, [onUpdateZones])

	const handleAddZone = () => {
		if (isAdding) return

		const previousMaxRadius = zones.length > 0 ? zones[zones.length - 1].maxRadius : 0
		setNewZone({ minRadius: previousMaxRadius, maxRadius: 0, price: 0 })
		setIsAdding(true)
	}

	const isZoneValid = (newZone: DeliveryZone, existingZones: DeliveryZone[]) => {
		return !existingZones.some(zone =>
			(newZone.minRadius < zone.maxRadius && newZone.maxRadius > zone.minRadius)
		)
	}

	const handleConfirmNewZone = () => {
		if (!newZone) return

		if (newZone.maxRadius <= newZone.minRadius) {
			toast.error('Maksymalny zasięg musi być większy od minimalnego.')
			return
		}

		if (newZone.price <= 0) {
			toast.error('Cena musi być większa od 0.')
			return
		}

		if (!isZoneValid(newZone, zones)) {
			toast.error('Nowa strefa nakłada się na istniejącą.')
			return
		}

		setZones([...zones, newZone])
		setNewZone(null)
		setIsAdding(false)
		memoizedOnUpdateZones([...zones, newZone]) // Save to parent
		toast.success('Nowa strefa została dodana.')
	}


	const handleCancelNewZone = () => {
		setNewZone(null)
		setIsAdding(false)
	}

	const handleRemoveZone = (index: number) => {
		if (index === 0 && zones.length > 1) {
			toast.error('Pierwszej strefy nie można usunąć, dopóki istnieją inne strefy.')
			return
		}

		const updatedZones = zones.filter((_, i) => i !== index)
		setZones(updatedZones)
		memoizedOnUpdateZones(updatedZones)
		toast.info('Strefa została usunięta.')
	}

	useEffect(() => {
		setZones(memoizedDeliveryZones)
	}, [memoizedDeliveryZones])

	return (
		<div className="p-4">
			<h2 className="text-xl font-semibold mb-4">Strefy dostawy</h2>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Minimalny zasięg (km)</TableHead>
						<TableHead>Maksymalny zasięg (km)</TableHead>
						<TableHead>Cena (zł)</TableHead>
						<TableHead>Akcje</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{zones.map((zone, index) => (
						<TableRow key={index}>
							<TableCell>{zone.minRadius} km</TableCell>
							<TableCell>{zone.maxRadius} km</TableCell>
							<TableCell>{zone.price} zł</TableCell>
							<TableCell>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => handleRemoveZone(index)}
									disabled={index === 0 && zones.length > 1} // Disable the "Usuń" button for the first zone if there are other zones
								>
									Usuń
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<Separator className="w-3/4 justify-self-center color" />

			{/* Display new zone as a table row */}
			{isAdding && newZone && (
				<div className="flex flex-col md:flex-row gap-4 w-3/4 justify-self-center pt-4">
					<div className="w-full">
						<Input type="number" value={newZone.minRadius} disabled />
					</div>
					<div className="w-full">
						<Input
							type="number"
							value={newZone.maxRadius}
							onChange={(e) =>
								setNewZone({ ...newZone, maxRadius: parseFloat(e.target.value) || NaN })
							}
						/>
					</div>
					<div className="w-full">
						<Input
							type="number"
							value={newZone.price}
							onChange={(e) =>
								setNewZone({ ...newZone, price: parseFloat(e.target.value) || NaN })
							}
						/>
					</div>
					<div className="flex self-center gap-2">
						<Button variant="default" size="sm" onClick={handleConfirmNewZone}>
							Dodaj
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={handleCancelNewZone}
						>
							Anuluj
						</Button>
					</div>
				</div>
			)}

			{/* Add button to initiate new zone */}
			{!isAdding && (
				<Button className="mt-4" onClick={handleAddZone}>
					Dodaj strefę
				</Button>
			)}
		</div>
	)
}

export default DeliveryZonesSettings
