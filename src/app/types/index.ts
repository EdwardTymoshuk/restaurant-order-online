export interface NavBarItem {
	label: string,
	link: string,
}

export interface CarouselImage {
	src: string,
}

export interface Opinion {
	author: string,
	date: string,
	message: string,
	rate: 1 | 2 | 3 | 4 | 5,
}

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
	'Wina Białe' |
	'Wina Czerwone' |
	'Drinki' |
	'Whisky' |
	'Rum' |
	'Gin' |
	'Tequila' |
	'Cognac / Brandy' |
	'Wódka'

export interface MenuItemType {
	id: string,
	name: string,
	price: number,
	description: string | null | undefined,
	category: MenuItemCategory,
	image: string | null | undefined,
	isOrderable?: boolean,
	isRecommended?: boolean,
}