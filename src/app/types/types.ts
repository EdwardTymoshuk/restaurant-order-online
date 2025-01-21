import { z } from 'zod'

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
	'Makarony/Ravioli' |
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
	isActive?: boolean,
	isRecommended?: boolean,
	isOnMainPage?: boolean,
	isOrderable?: boolean,
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
	buildingNumber?: string | null,
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
	nip?: string | null,
}

export const deliverySchema = z.object({
	name: z.string().min(1, 'Podaj imię').max(20, 'Imię jest zbyt długie'),
	phone: z.string().regex(/^\+?[0-9]{9}$/, 'Podaj numer telefonu w formacie xxxxxxxxxx'),
	city: z.string().min(3, 'Podaj miasto').max(50),
	postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie 00-000'),
	street: z.string().min(1, 'Podaj ulicę').max(50),
	buildingNumber: z.string().min(1, 'Podaj numer budynku').max(10),
	apartment: z.preprocess(
		(val) => val === '' ? undefined : (isNaN(Number(val)) ? undefined : Number(val)),
		z.number().positive().optional()
	),
	paymentMethod: z.string().min(1, 'Wybierz metodę płatności'),
	deliveryTime: z.union([
		z.literal('asap'),
		z.date().refine((date) => date > new Date(), { message: 'Podaj poprawną godzinę dostawy' }),
	]),
	comment: z.string().max(200, 'Komentarz jest zbyt długi').optional().transform(val => val === '' ? undefined : val),
	promoCode: z.string().max(20, 'Kod promocyjny jest zbyt długi').optional().transform(val => val === '' ? undefined : val),
	nip: z
		.string()
		.optional()
		.transform(val => val === '' ? undefined : val)
		.refine((val) => val === undefined || /^[0-9]{10}$/.test(val), {
			message: 'Podaj poprawny numer NIP z 10 cyfr',
		})
})

export const takeOutSchema = z.object({
	name: z.string().min(1, 'Podaj imię').max(20, 'Imię jest zbyt długie'),
	phone: z.string().regex(/^\+?[0-9]{9}$/, 'Podaj numer w formacie xxxxxxxxxx'),
	paymentMethod: z.string().min(1, 'Wybierz metodę płatności'),
	deliveryTime: z.union([
		z.literal('asap'),
		z.date().refine((date) => date > new Date(), { message: 'Podaj poprawną godzinę dostawy' }),
	]),
	comment: z.string().max(200, 'Komentarz jest zbyt długi').optional().transform(val => val === '' ? undefined : val),
	promoCode: z.string().max(20, 'Kod promocyjny jest zbyt długi').optional().transform(val => val === '' ? undefined : val),
	nip: z
		.string()
		.optional()
		.transform(val => val === '' ? undefined : val)
		.refine((val) => val === undefined || /^[0-9]{10}$/.test(val), {
			message: 'Podaj poprawny numer NIP z 10 cyfr',
		})
})

export interface DeliveryZone {
	minRadius: number,
	maxRadius: number,
	price: number
}

export type DeliveryFormData = z.infer<typeof deliverySchema>
export type TakeOutFormData = z.infer<typeof takeOutSchema>

export interface DeliveryZone {
	minRadius: number
	maxRadius: number
	price: number
}
