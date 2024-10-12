export const getOrderStatuses = (deliveryMethod: string) => [
	{ key: 'PENDING', label: 'Nowe zamówienie' },
	{ key: 'ACCEPTED', label: 'Przyjęte do realizacji' },
	{ key: 'IN_PROGRESS', label: 'W trakcie realizacji' },
	{
		key: 'READY',
		label: deliveryMethod === 'DELIVERY' ? 'Gotowe do wysyłki' : 'Gotowe do odbioru',
	},
	...(deliveryMethod === 'DELIVERY' ? [
		{ key: 'DELIVERING', label: 'W trakcie dostarczenia' },
	] : []),
	{
		key: 'DELIVERED',
		label: deliveryMethod === 'DELIVERY' ? 'Dostarczone' : 'Odebrane',
	},
	{ key: 'COMPLETED', label: 'Zakończone' },
	{ key: 'CANCELLED', label: 'Anulowane' },
];

