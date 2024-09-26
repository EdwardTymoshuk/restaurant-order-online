'use client'

import { useState } from 'react'
import { MdOutlineDeliveryDining, MdOutlineRestaurantMenu } from 'react-icons/md'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

const AddressModal = ({ onClose }: { onClose: () => void }) => {
	const [address, setAddress] = useState('')
	const [activeTab, setActiveTab] = useState('delivery')

	const handleCheckAddress = () => {
		// Додати тут логіку перевірки адреси
		console.log('Checking address:', address)
	}

	const handleOrderClick = () => {
		// Логіка переходу до замовлення
		console.log('Navigating to order for:', activeTab)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-xl font-bold mb-4">Sprawdź czy dostarczamy</h2>

				{/* Світер для вибору "Доставка" або "Odbiór" */}
				<Tabs defaultValue="delivery" onValueChange={setActiveTab}>
					<TabsList className="p-2 flex justify-around bg-transparent">
						<TabsTrigger value="delivery" className="text-lg">
							<MdOutlineDeliveryDining className="text-4xl" />
							Dostawa
						</TabsTrigger>
						<TabsTrigger value="take-out" className="text-lg">
							<MdOutlineRestaurantMenu className="text-4xl" />
							Odbiór
						</TabsTrigger>
					</TabsList>
					<TabsContent value="delivery">
						<Input
							placeholder="Wprowadź adres"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							className="mb-4"
						/>
						<div className="flex justify-end space-x-4">
							<Button variant="secondary" onClick={onClose}>Anuluj</Button>
							<Button variant="default" onClick={handleCheckAddress}>Sprawdź</Button>
						</div>
					</TabsContent>
					<TabsContent value="take-out">
						<div className="flex flex-col text-lg text-center text-text-secondary">
							<span className="text-secondary">Hestii 3, Sopot</span>
							<span>Pn-Pt: 12:00 - 22:00</span>
							<span>Sb-Nd 8:00 - 22:00</span>
						</div>
						<div className="flex justify-end space-x-4 mt-4">
							<Button variant="secondary" onClick={onClose}>Anuluj</Button>
							<Button variant="default" onClick={handleOrderClick}>Do zamówienia</Button>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}

export default AddressModal
