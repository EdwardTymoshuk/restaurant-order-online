// Тип для навігаційних елементів
export interface NavBarItem {
	label: string,
	link: string,
}

// Тип для зображень у каруселі
export interface CarouselImage {
	src: string,
}

// Тип для відгуків (Opinions)
export interface Opinion {
	author: string,
	date: string,
	message: string,
	rate: 1 | 2 | 3 | 4 | 5,
}

// Тип для категорій меню
export type MenuItemCategory =
	'Dania główne' |
	'Pizza' |
	'Burgery' |
	'Dla dzieci' |
	'Dodatki' |
	'Desery' |
	'Napoje' |
	'Śniadania' |
	'Przystawki' |
	'Zupy' |
	'Bowle' |
	'Vege' |
	'Dania rybne' |
	'Owoce morza' |
	'Dania mięsne' |
	'Klasyczne koktaile' |
	'Na ciepło' |
	'Herbata' |
	'Kawa' |
	'Napoje zimne' |
	'Piwo butelkowe' |
	'Piwo bezalkoholowe' |
	'Piwo beczkowe' |
	'Piwo smakowe' |
	'Wina Białe' |
	'Wina Czerwone' |
	'Wina Musujące' |
	'Drinki' |
	'Whisky' |
	'Rum' |
	'Gin' |
	'Tequila' |
	'Cognac / Brandy' |
	'Wódka' |
	'Napoje alkoholowe' |
	'Napoje bezalkoholowe' |
	'Napoje łekkoprocentowe' |
	'Inne'

// Тип для позицій меню
export interface MenuItemType {
	id: string,
	name: string,
	price: number,
	description: string | null | undefined,
	category: MenuItemCategory,
	image: string | null | undefined,
	isOrderable?: boolean,
	isRecommended?: boolean,
	createdAt: Date,
	updatedAt: Date,
}

// Тип для статусу замовлення
export enum OrderStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED',
	IN_PROGRESS = 'IN_PROGRESS',
	READY = 'READY',
	DELIVERING = 'DELIVERING',
	DELIVERED = 'DELIVERED',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
}

// Тип для методу доставки
export enum DeliveryMethod {
	DELIVERY = 'DELIVERY',
	TAKE_OUT = 'TAKE_OUT',
}

// Тип для позицій замовлення (OrderItem)
export interface OrderItemType {
	id: string,
	quantity: number,
	menuItemId: string, // Foreign key для MenuItem
	menuItem: MenuItemType, // Зв'язаний об'єкт MenuItem
	orderId: string, // Foreign key для Order
}

// Тип для замовлення (Order)
export interface OrderType {
	id: string,
	name: string,
	phone: string,
	city?: string | null,
	postalCode?: string | null,
	street?: string | null,
	buildingNumber?: number | null,
	apartment?: number | null,
	deliveryMethod: DeliveryMethod,
	paymentMethod: string,
	deliveryTime: Date,
	items: OrderItemType[], // Массив позицій замовлення
	totalAmount: number,
	status: OrderStatus,
	comment?: string | null,
	promoCode?: string | null,
	createdAt: Date,
	updatedAt: Date,
}
