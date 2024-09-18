import { MenuItemCategory, MenuItemType } from '@/app/types'
import { trpc } from '@/utils/trps'
import { createContext, useContext, useEffect, useState } from 'react'

interface MenuContextType {
	menuItems: MenuItemType[]
	loading: boolean
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export const useMenu = () => {
	const context = useContext(MenuContext)
	if (!context) {
		throw new Error('useMenu must be used within a MenuProvider')
	}
	return context
}

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
	const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
	const { data: fetchedMenuItems = [], isLoading } = trpc.menu.getMenuItems.useQuery()

	useEffect(() => {
		if (fetchedMenuItems.length > 0) {
			// Перетворюємо категорію явно на MenuItemCategory
			const validMenuItems = fetchedMenuItems.map(item => ({
				...item,
				category: item.category as MenuItemCategory, // Примусовий кастинг категорії
			})) as MenuItemType[]

			setMenuItems(validMenuItems)
		}
	}, [fetchedMenuItems])

	return (
		<MenuContext.Provider value={{ menuItems, loading: isLoading }}>
			{children}
		</MenuContext.Provider>
	)
}
