import LoadingButton from '@/app/components/LoadingButton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Skeleton } from '@/app/components/ui/skeleton'
import { useOrderSubscription } from '@/hooks/useOrderSubscription'
import { formatTimeAgo } from '@/utils/formatTimeAgo'
import { getOrderStatuses } from '@/utils/getOrderStatuses'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import { OrderStatus, Prisma } from '@prisma/client'
import orderBy from 'lodash/orderBy'
import { useEffect, useState } from 'react'
import { GoSortAsc, GoSortDesc } from "react-icons/go"
import { IoCheckmark } from 'react-icons/io5'
import { RiArrowDropRightLine, RiPencilLine } from "react-icons/ri"
import { toast } from 'sonner'

// Використовуємо Prisma для правильного типу з include
type OrderWithItems = Prisma.OrderGetPayload<{
	include: {
		items: {
			include: {
				menuItem: true
			},
		},
		promoCode: true,
	}
}>

// Мапа для кольорів статусу
const statusColorMap: { [key in OrderStatus]: string } = {
	PENDING: 'text-warning',
	ACCEPTED: 'text-info',
	IN_PROGRESS: 'text-info',
	READY: 'text-info',
	DELIVERING: 'text-info',
	DELIVERED: 'text-info',
	COMPLETED: 'text-success',
	CANCELLED: 'text-danger'
}

// Мапа для кнопок статусу
const statusButtonMap = (deliveryMethod: 'DELIVERY' | 'TAKE_OUT', status: OrderStatus) => {
	const deliveryStatusMap: { [key in OrderStatus]: { label: string, nextStatus: OrderStatus | null } } = {
		PENDING: { label: 'Przyjmij', nextStatus: 'ACCEPTED' },
		ACCEPTED: { label: 'Zrealizuj', nextStatus: 'IN_PROGRESS' },
		IN_PROGRESS: { label: 'Wydaj', nextStatus: 'READY' },
		READY: deliveryMethod === 'DELIVERY'
			? { label: 'Wyślij', nextStatus: 'DELIVERING' }
			: { label: 'Odebrane', nextStatus: 'COMPLETED' },
		DELIVERING: { label: 'Zakończ', nextStatus: 'DELIVERED' },
		DELIVERED: { label: 'Odebrane', nextStatus: 'COMPLETED' },
		COMPLETED: { label: 'Zakończone', nextStatus: null },
		CANCELLED: { label: 'Anulowane', nextStatus: null }
	}

	return deliveryStatusMap[status]
}

// Порядок статусів для сортування


const Orders = () => {
	const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
	const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<'DELIVERY' | 'TAKE_OUT' | 'ALL'>('ALL')

	const [selectedStatus, setSelectedStatus] = useState<{ [key: string]: OrderStatus }>({})
	const [isEditingStatus, setIsEditingStatus] = useState<{ [key: string]: boolean }>({})
	const [localOrders, setLocalOrders] = useState<OrderWithItems[]>([])
	const [sortConfig, setSortConfig] = useState<{ key: 'status' | 'deliveryMethod' | 'createdAt' | 'deliveryTime'; direction: 'asc' | 'desc' }>({
		key: 'createdAt', // Сортуємо за датою створення за замовчуванням
		direction: 'desc', // Найновіші замовлення зверху
	}); (null)


	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

	// const [orders, setOrders] = useState<OrderWithItems[]>([]) // Основний стан для замовлень
	const [highlightedOrders, setHighlightedOrders] = useState<Set<string>>(new Set()) // Для виділення нових замовлень


	const { data: initialOrders, isLoading, error, refetch } = trpc.order.getAllOrders.useQuery()

	const { newOrders, highlightedOrderIds, isDialogOpen, handleCloseDialog, newOrderCount } = useOrderSubscription()

	const statusOrder: OrderStatus[] = [
		'PENDING',
		'ACCEPTED',
		'IN_PROGRESS',
		'READY',
		'DELIVERING',
		'DELIVERED',
		'COMPLETED',
		'CANCELLED'
	]

	const updateStatus = trpc.order.updateStatus.useMutation({
		onSuccess: () => {
			refetch()
			toast.success('Status zamówienia został pomyślnie zmieniony')
		},
	})

	const { mutate: mutateDelete, isLoading: isLoadingDelete } = trpc.order.deleteOrder.useMutation({
		onSuccess: () => {
			refetch()
			setIsDeleteDialogOpen(false)
			toast.success('Zamówienie zostało pomyślnie usunięte')
		},
	})
	// Початкове завантаження замовлень
	useEffect(() => {
		if (initialOrders) {
			setLocalOrders(initialOrders)
		}
	}, [initialOrders])

	useEffect(() => {
		if (newOrders.length > 0) {
			let newOrderIds: Set<string> = new Set() // Оголошуємо змінну поза блоком

			setLocalOrders((prevOrders) => {
				const allOrders = [...prevOrders]

				newOrders.forEach((newOrder) => {
					if (!prevOrders.some(order => order.id === newOrder.id)) {
						allOrders.push(newOrder)
						newOrderIds.add(newOrder.id) // Зберігаємо нові ID для виділення
					}
				})

				// Оновлюємо стан з новими замовленнями
				setHighlightedOrders(newOrderIds) // Виділяємо тільки нові замовлення

				return allOrders // Повертаємо оновлений список замовлень
			})

			const audio = new Audio('/audio/notification.wav') // Шлях до аудіофайлу
			audio.play()

			// Видаляємо виділення нових замовлень через 5 секунд
			const timeoutId = setTimeout(() => {
				setHighlightedOrders((prev) => {
					const updated = new Set(prev)
					newOrderIds.forEach(id => updated.delete(id)) // Видаляємо ID замовлень після таймера
					return updated
				})
			}, 5000) // Виділення нових замовлень на 5 секунд

			return () => clearTimeout(timeoutId)
		}
	}, [newOrders])





	// Сортування замовлень
	const sortedOrders = sortConfig ? orderBy(
		[...localOrders],
		[
			sortConfig.key === 'status'
				? (order: OrderWithItems) => statusOrder.indexOf(order.status)
				: (order: OrderWithItems) => {
					if (sortConfig.key === 'createdAt' || sortConfig.key === 'deliveryTime') {
						return new Date(order[sortConfig.key]).getTime()
					}
					return order[sortConfig.key]
				}
		],
		[sortConfig.direction]
	) : localOrders

	const handleSort = (key: 'status' | 'deliveryMethod' | 'createdAt' | 'deliveryTime') => {
		setSortConfig(prev => {
			if (prev?.key === key) {
				// Якщо поточний ключ вже обраний, змінюємо напрямок
				return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
			}
			// Інакше, встановлюємо новий ключ з напрямком за замовчуванням
			return { key, direction: 'asc' }
		})
	}

	const getSortIcon = (key: 'status' | 'deliveryMethod' | 'createdAt' | 'deliveryTime') => {
		if (!sortConfig || sortConfig.key !== key) {
			return <GoSortDesc />
		}
		return sortConfig.direction === 'asc' ? <GoSortAsc /> : <GoSortDesc />
	}

	// Фільтрація замовлень
	const filteredOrders = sortedOrders.filter(order => {
		const matchesStatus = statusFilter !== 'ALL' ? order.status === statusFilter : true
		const matchesDeliveryMethod = deliveryMethodFilter !== 'ALL' ? order.deliveryMethod === deliveryMethodFilter : true

		return matchesStatus && matchesDeliveryMethod
	})

	const handleStatusChange = (orderId: string, status: OrderStatus) => {
		setSelectedStatus((prev) => ({ ...prev, [orderId]: status }))
	}

	const confirmStatusChange = (orderId: string, event: React.MouseEvent, newStatus: OrderStatus | null) => {
		event.stopPropagation()

		if (!newStatus) return

		const currentStatus = localOrders?.find(order => order.id === orderId)?.status

		if (newStatus && newStatus !== currentStatus) {
			setLocalOrders((prevOrders) =>
				prevOrders.map((order) =>
					order.id === orderId ? { ...order, status: newStatus } : order
				)
			)

			updateStatus.mutate({
				orderId: orderId,
				status: newStatus,
			})
		}
		setIsEditingStatus((prev) => ({ ...prev, [orderId]: false }))
	}

	const toggleStatusEdit = (orderId: string, event: React.MouseEvent) => {
		event.stopPropagation()
		const currentStatus = localOrders?.find(order => order.id === orderId)?.status
		setSelectedStatus((prev) => ({ ...prev, [orderId]: currentStatus as OrderStatus }))
		setIsEditingStatus((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
	}

	const openDeleteDialog = (orderId: string) => {
		setOrderToDelete(orderId)
		setIsDeleteDialogOpen(true)
	}

	const closeDeleteDialog = () => {
		setIsDeleteDialogOpen(false)
		setOrderToDelete(null)
	}

	const handleDeleteOrder = () => {
		if (!orderToDelete) return
		mutateDelete({ orderId: orderToDelete })
	}

	const getOrderLabel = (count: number) => {
		if (count === 1) return `nowe zamówienie`
		if (count >= 2 && count <= 4) return `nowe zamówienia`
		return `nowych zamówień`
	}

	if (isLoading) return (
		<div className="w-full p-4">
			{/* Скелетон для заголовків */}
			<Skeleton className="w-1/4 h-8 mb-4" />
			{/* Скелетон для таблиці */}
			<div className="space-y-2">
				{[...Array(3)].map((_, index) => (
					<Skeleton key={index} className="w-full h-12" />
				))}
			</div>
		</div>
	)

	if (error) return <div>Something went wrong: {error.message}</div>

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Orders</h1>

			{/* Фільтри */}
			<div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
				{/* Фільтр за статусом */}
				<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'ALL')}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Status zamówienia" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">Wszystkie statusy</SelectItem>
						{statusOrder.map((status) => (
							<SelectItem key={status} value={status}>
								{getOrderStatuses('DELIVERY').find(s => s.key === status)?.label || status}
							</SelectItem>
						))}
					</SelectContent>
				</Select>


				{/* Фільтр за типом доставки */}
				<Select value={deliveryMethodFilter} onValueChange={(value) => setDeliveryMethodFilter(value as 'DELIVERY' | 'TAKE_OUT' | 'ALL')}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Metoda dostawy" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">Wszystkie metody</SelectItem>
						<SelectItem value="DELIVERY">Dostawa</SelectItem>
						<SelectItem value="TAKE_OUT">Odbiór</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Заголовки */}
			{/* Заголовки */}
			<div className='hidden lg:flex flex-1 justify-between items-center gap-4 w-full'>
				<div className="hidden w-full lg:flex justify-between items-center px-4 py-2 font-bold text-lg text-center">
					<p className="w-1/12">#</p>
					<p className="w-2/12 flex items-center justify-center gap-2" onClick={() => handleSort('deliveryMethod')} style={{ cursor: 'pointer' }}>
						Metoda dostawy {getSortIcon('deliveryMethod')}
					</p>
					<p className="w-2/12 flex items-center justify-center gap-2" onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
						Czas utworzenia {getSortIcon('createdAt')}
					</p>
					<p className="w-2/12 flex items-center justify-center gap-2" onClick={() => handleSort('deliveryTime')} style={{ cursor: 'pointer' }}>
						Czas dostawy {getSortIcon('deliveryTime')}
					</p>
					<p className="w-2/12 flex items-center justify-center gap-2" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
						Status {getSortIcon('status')}
					</p>
					<p className="w-2/12">Akcje</p>
				</div>
				<RiArrowDropRightLine className='h-4 w-4 shrink-0' />
			</div>


			{/* Замовлення */}
			<Accordion type="single" collapsible>
				{filteredOrders.map((order, index) => {
					const { relativeTime, fullDate, fullTime } = formatTimeAgo(new Date(order.createdAt))
					const statusButton = statusButtonMap(order.deliveryMethod, order.status)

					return (
						<AccordionItem key={order.id} value={order.id}>
							<AccordionTrigger className={cn(`flex items-center gap-4 px-4 py-2 border-b hover:no-underline ${statusColorMap[order.status]} text-texе-secondary`, {
								'bg-success/80': highlightedOrderIds.has(order.id)
							})}>
								<div className='flex flex-col lg:flex-row justify-between items-center w-full'>
									<p className="w-1/12">{index + 1}</p>
									<p className="w-2/12" onClick={() => setDeliveryMethodFilter(order.deliveryMethod)} style={{ cursor: 'pointer' }}>
										<span className='hover:text-secondary hover:underline'>{order.deliveryMethod === 'DELIVERY' ? 'Dostawa' : 'Odbiór'}</span>
									</p>
									<p className="w-2/12">
										{relativeTime ? (
											relativeTime
										) : (
											<div className="flex flex-col">
												<span>{fullDate}</span>
												<span>{fullTime}</span>
											</div>
										)}
									</p>
									<p className="w-2/12">
										<div className="flex flex-col">
											<span>{new Date(order.deliveryTime).toLocaleDateString()}</span>
											<span>{new Date(order.deliveryTime).toLocaleTimeString()}</span>
										</div>

									</p>
									<p className={`w-2/12 flex gap-2 items-center justify-center ${statusColorMap[order.status]}`}>
										{isEditingStatus[order.id] ? (
											<Select value={selectedStatus[order.id]} onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}>
												<SelectTrigger className="text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{getOrderStatuses(order.deliveryMethod).map((status) => (
														<SelectItem key={status.key} value={status.key}>
															{status.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : (
											<span>{getOrderStatuses(order.deliveryMethod).find(s => s.key === order.status)?.label}</span>
										)}

										<Button
											variant="ghost"
											size="sm"
											onClick={(event) => isEditingStatus[order.id] ? confirmStatusChange(order.id, event, selectedStatus[order.id]) : toggleStatusEdit(order.id, event)}
											className="text-success hover:text-success-light p-0"
										>
											{isEditingStatus[order.id] ? <IoCheckmark /> : <RiPencilLine />}
										</Button>

									</p>
									<div className="w-2/12 flex items-center justify-center">
										{statusButton?.nextStatus ? (
											<Button
												variant="default"
												size="sm"
												onClick={(event) => confirmStatusChange(order.id, event, statusButton.nextStatus)}
											>
												{statusButton.label} <RiArrowDropRightLine size={18} />
											</Button>
										) : (
											<p className="italic">Zakończone</p>
										)}
									</div>
								</div>
							</AccordionTrigger>
							<AccordionContent className="p-4 font-bold">
								<p className='text-base'><span className='text-secondary bold'>Numer zamówienia:</span> {order.id}</p>
								<p className='text-base'><span className='text-secondary bold'>Imię klienta:</span> {order.name}</p>
								<p className='text-base'><span className='text-secondary bold'>Nr telefonu:</span> {order.phone}</p>
								<p className='text-base'><span className='text-secondary bold'>Komentarz:</span> {order.comment || 'Brak komentarza'}</p>
								{order.promoCode?.code &&
									<p className='text-base'>
										<span className='text-secondary bold'>
											Promocja:
										</span>
										<ul className='text-sm'>
											<li className='pl-8 text-secondary'> - Kod promocyjny: <span className='text-text-secondary'>{order.promoCode?.code}</span></li>
											<li className='pl-8 text-secondary'> - Rabat: <span className='text-text-secondary'>{order.promoCode?.discountValue} {order.promoCode?.discountType === 'PERCENTAGE' ? '%' : 'zł'}</span></li>
											<li className='pl-8 text-secondary'> - Kwota przed rabatem: <span className='text-text-secondary'>{order.totalAmount} zł</span></li>
										</ul>
									</p>
								}
								<p className='text-base'><span className='text-secondary bold'>Kwota ostateczna:</span> {order.finalAmount} zł</p>
								{order.nip && <p className='text-base'><span className='text-secondary bold'>Numer NIP:</span> {order.nip}</p>}

								{order.deliveryMethod === 'DELIVERY' && (
									<div className="mt-4">
										<p className="text-base"><span className='text-secondary bold'>Adres dostawy:</span></p>
										<ul className="pl-8 ml-4 text-lg font-extrabold">
											<li><span className='bold'>Miasto:</span> {order.city || 'Brak danych'}</li>
											<li><span className='bold'>Kod pocztowy:</span> {order.postalCode || 'Brak danych'}</li>
											<li><span className='bold'>Ulica:</span> {order.street || 'Brak danych'}</li>
											<li><span className='bold'>Numer budynku:</span> {order.buildingNumber || 'Brak danych'}</li>
											<li><span className='bold'>Numer mieszkania:</span> {order.apartment || 'Brak danych'}</li>
										</ul>
									</div>
								)}

								<p className='text-base'><span className='text-secondary bold'>Zamówienie:</span></p>
								<ul className="list-decimal pl-8 ml-4 text-lg font-extrabold">
									{order.items?.map((item) => (
										<li key={item.id}>
											<span>{item.quantity}x</span> {item.menuItem?.name || 'Unknown item'}
										</li>
									))}
								</ul>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => openDeleteDialog(order.id)}
									className="mt-4"
								>
									Usuń zamówienie
								</Button>
							</AccordionContent>
						</AccordionItem>
					)
				})}
			</Accordion>
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Czy na pewno chcesz usunąć zamówienie?</DialogTitle>
						<DialogDescription className='text-text-foreground'>Ta operacja usunie zamówienie bezpowrotnie.</DialogDescription>
					</DialogHeader>
					<div className="flex justify-end space-x-4">
						<Button variant="secondary" onClick={closeDeleteDialog}>Anuluj</Button>
						<LoadingButton variant="destructive" isLoading={isLoadingDelete} onClick={handleDeleteOrder}>Usuń</LoadingButton>
					</div>
				</DialogContent>
			</Dialog>
			<Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
				<DialogContent className="w-full items-center justify-center" aria-describedby={undefined}>
					<DialogTitle className='sr-only'>Powiadomienie o nowym zamówieniu</DialogTitle>
					<div className='flex items-center text-xl'>
						<p>🔔 Masz {newOrderCount} {getOrderLabel(newOrderCount)}!</p>
					</div>
					<DialogFooter className='w-full'>
						<Button onClick={handleCloseDialog} className='w-full'>OK</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div >

	)
}

export default Orders
