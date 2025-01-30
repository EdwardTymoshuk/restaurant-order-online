"use client"

/**
 * DeliveryCostDisplay
 * Receives the deliveryCost from global cart state (could be -1, null, or >= 0).
 * If deliveryCost is null => we haven't computed yet.
 * If -1 => address is out of zone or invalid => show "Wprowadź poprawny adres..."
 * If >= 0 => show "Koszt dostawy: X zł"
 * 
 * Comments in English, Polish UI text remains.
 */

interface DeliveryCostDisplayProps {
	deliveryCost: number | null
	// We can treat -1 as "out of zone" special case
}

export default function DeliveryCostDisplay({
	deliveryCost,
}: DeliveryCostDisplayProps) {
	if (deliveryCost === null) {
		return (
			<div className="flex font-sans justify-between text-lg text-text-secondary">
				<span className="text-primary">
					Wprowadź adres, aby obliczyć koszt dostawy.
				</span>
			</div>
		)
	}

	if (deliveryCost === -1) {
		return (
			<div className="flex font-sans justify-between text-lg text-text-secondary">
				{/* For out-of-zone or invalid => "poprawny" */}
				<span className="text-primary">
					Wprowadź poprawny adres, aby obliczyć koszt dostawy.
				</span>
			</div>
		)
	}

	// Otherwise, cost is a number >= 0
	return (
		<div className="flex font-sans justify-between text-lg text-text-secondary">
			<span>Koszt dostawy:</span>
			<span>{deliveryCost} zł</span>
		</div>
	)
}
