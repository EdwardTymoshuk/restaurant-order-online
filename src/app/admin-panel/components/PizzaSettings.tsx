'use client'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Separator } from '@/app/components/ui/separator'
import { Switch } from '@/app/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { trpc } from '@/utils/trpc'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface PizzaAvailability {
	day: number
	startHour: number
	endHour: number
}

interface PizzaSettingsProps {
	settingsData: {
		pizzaCategoryEnabled: boolean
		pizzaAvailability: PizzaAvailability[]
	}
	refetchSettings: () => void
}

const PizzaSettings: React.FC<PizzaSettingsProps> = ({ settingsData, refetchSettings }) => {
	// TRPC mutation to update pizza settings in the database
	const updatePizzaAvailability = trpc.settings.updatePizzaAvailability.useMutation({
		onSuccess: refetchSettings,
	})

	// Local state to manage pizza category toggle
	const [isPizzaEnabled, setIsPizzaEnabled] = useState(settingsData.pizzaCategoryEnabled)
	// Local state to manage time-based availability
	const [availability, setAvailability] = useState<PizzaAvailability[]>(settingsData.pizzaAvailability)
	const [isAdding, setIsAdding] = useState(false)
	const [newEntry, setNewEntry] = useState<PizzaAvailability | null>(null)

	const memoizedSettings = useMemo(() => settingsData, [settingsData])

	useEffect(() => {
		setIsPizzaEnabled(memoizedSettings.pizzaCategoryEnabled)
		setAvailability(memoizedSettings.pizzaAvailability)
	}, [memoizedSettings])

	/**
	 * Handles updating the server whenever changes are made
	 */
	const saveChanges = (updatedAvailability: PizzaAvailability[]) => {
		updatePizzaAvailability.mutate({
			enabled: isPizzaEnabled,
			availability: updatedAvailability,
		})
	}

	/**
	 * Confirms the addition of a new availability entry
	 */
	const handleConfirmNewEntry = () => {
		if (!newEntry) return

		if (newEntry.startHour >= newEntry.endHour) {
			toast.error('Godzina rozpoczęcia musi być wcześniejsza niż godzina zakończenia.')
			return
		}

		const updatedAvailability = [...availability, newEntry]
		setAvailability(updatedAvailability)
		saveChanges(updatedAvailability) // Save changes to server
		setNewEntry(null)
		setIsAdding(false)
		toast.success('Nowa dostępność została dodana.')
	}

	/**
	 * Cancels the addition of a new availability entry
	 */
	const handleCancelNewEntry = () => {
		setNewEntry(null)
		setIsAdding(false)
	}

	/**
	 * Removes an availability entry by index
	 * @param index - Index of the entry to remove
	 */
	const handleRemoveEntry = (index: number) => {
		const updatedAvailability = availability.filter((_, i) => i !== index)
		setAvailability(updatedAvailability)
		saveChanges(updatedAvailability) // Save changes to server
		toast.info('Dostępność została usunięta.')
	}

	/**
	 * Adds a new availability entry with default values
	 */
	const handleAddEntry = () => {
		if (isAdding) return
		setNewEntry({ day: 1, startHour: 12, endHour: 19 })
		setIsAdding(true)
	}

	/**
	 * Toggles the pizza category enabled/disabled status
	 */
	const handleToggleEnabled = (enabled: boolean) => {
		setIsPizzaEnabled(enabled)
		updatePizzaAvailability.mutate({
			enabled,
			availability,
		})
		toast.success(`Kategoria pizzy została ${enabled ? 'włączona' : 'wyłączona'}.`)
	}

	return (
		<div>
			<h2 className="text-xl font-semibold mb-4">Dostępność kategorii pizzy</h2>

			{/* Switch for enabling/disabling pizza category */}
			<div className="flex items-center space-x-4 mb-4">
				<Switch checked={isPizzaEnabled} onCheckedChange={handleToggleEnabled} />
				<span>{isPizzaEnabled ? 'Włączone' : 'Wyłączone'}</span>
			</div>

			{isPizzaEnabled && (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Dzień</TableHead>
								<TableHead>Godzina rozpoczęcia</TableHead>
								<TableHead>Godzina zakończenia</TableHead>
								<TableHead>Akcje</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{availability.map((entry, index) => (
								<TableRow key={index}>
									<TableCell>
										{['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'][entry.day]}
									</TableCell>
									<TableCell>{entry.startHour}:00</TableCell>
									<TableCell>{entry.endHour}:00</TableCell>
									<TableCell>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleRemoveEntry(index)}
										>
											Usuń
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<Separator className="my-4" />

					{/* New entry row */}
					{isAdding && newEntry && (
						<div className="flex flex-col md:flex-row gap-4 w-3/4 justify-self-center pt-4">
							<Select
								value={newEntry.day.toString()}
								onValueChange={(value) => setNewEntry({ ...newEntry, day: Number(value) })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Wybierz dzień" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">Niedziela</SelectItem>
									<SelectItem value="1">Poniedziałek</SelectItem>
									<SelectItem value="2">Wtorek</SelectItem>
									<SelectItem value="3">Środa</SelectItem>
									<SelectItem value="4">Czwartek</SelectItem>
									<SelectItem value="5">Piątek</SelectItem>
									<SelectItem value="6">Sobota</SelectItem>
								</SelectContent>
							</Select>
							<Input
								type="number"
								placeholder="Godzina rozpoczęcia"
								value={newEntry.startHour}
								onChange={(e) => setNewEntry({ ...newEntry, startHour: Number(e.target.value) })}
							/>
							<Input
								type="number"
								placeholder="Godzina zakończenia"
								value={newEntry.endHour}
								onChange={(e) => setNewEntry({ ...newEntry, endHour: Number(e.target.value) })}
							/>
							<div className="flex self-center gap-2">
								<Button variant="default" size="sm" onClick={handleConfirmNewEntry}>
									Dodaj
								</Button>
								<Button variant="secondary" size="sm" onClick={handleCancelNewEntry}>
									Anuluj
								</Button>
							</div>
						</div>
					)}

					{/* Button to add a new entry */}
					{!isAdding && (
						<Button className="mt-4" onClick={handleAddEntry}>
							Dodaj dostępność
						</Button>
					)}
				</>
			)}
		</div>
	)
}

export default PizzaSettings
