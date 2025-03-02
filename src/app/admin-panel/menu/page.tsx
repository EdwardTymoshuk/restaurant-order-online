'use client'

import ImageWithFallback from '@/app/components/ImageWithFallback'
import LoadingButton from '@/app/components/LoadingButton'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Switch } from '@/app/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { MenuItemCategory } from '@/app/types/types'
import { trpc } from '@/utils/trpc'
import { MenuItem } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'

const MenuTable = () => {
  const [sortOption, setSortOption] = useState<string | undefined>('default')
  const [categoryFilter, setCategoryFilter] = useState<
    MenuItemCategory | 'all'
  >('all')
  const [isActiveFilter, setisActiveFilter] = useState<string>('all')
  const [isOrderableFilter, setIsOrderableFilter] = useState<string>('all')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [menuItemToDelete, setMenuItemToDelete] = useState<string | null>(null)

  const { data: menuItems = [], isLoading } =
    trpc.menu.getAllMenuItems.useQuery()
  const queryClient = useQueryClient()
  const router = useRouter()
  const queryKey = getQueryKey(trpc.menu.getAllMenuItems)

  const { mutateAsync: updateMenuItem } = trpc.menu.updateMenuItem.useMutation({
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries(queryKey)
      const previousData = queryClient.getQueryData<MenuItem[]>(queryKey)
      if (previousData) {
        queryClient.setQueryData<MenuItem[]>(queryKey, (oldData) => {
          if (!oldData) return oldData
          return oldData.map((item) =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          )
        })
      }
      return { previousData }
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey)
    },
  })

  const { mutateAsync: deleteMenuItem, isLoading: isLoadingDelete } =
    trpc.menu.deleteMenuItem.useMutation({
      onSettled: () => {
        queryClient.invalidateQueries(queryKey)
      },
    })

  // Сортування і фільтрація елементів
  const sortedItems = useMemo(() => {
    if (!menuItems) return []

    let itemsFiltered = menuItems.map((item) => ({
      ...item,
      category: item.category as MenuItemCategory,
    }))

    // Фільтруємо за категоріями
    if (categoryFilter !== 'all') {
      itemsFiltered = itemsFiltered.filter(
        (item) => item.category === categoryFilter
      )
    }

    // Фільтруємо за активністю
    if (isActiveFilter !== 'all') {
      const isActiveValue = isActiveFilter === 'true'
      itemsFiltered = itemsFiltered.filter(
        (item) => item.isActive === isActiveValue
      )
    }

    // Фільтруємо за рекомендаціями
    if (isOrderableFilter !== 'all') {
      const isOrderableValue = isOrderableFilter === 'true'
      itemsFiltered = itemsFiltered.filter(
        (item) => item.isOrderable === isOrderableValue
      )
    }

    // Сортування
    switch (sortOption) {
      case 'Nazwa rosnąco':
        itemsFiltered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'Nazwa malejąco':
        itemsFiltered.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'Cena rosnąco':
        itemsFiltered.sort((a, b) => a.price - b.price)
        break
      case 'Cena malejąco':
        itemsFiltered.sort((a, b) => b.price - a.price)
        break
      case 'Data rosnąco':
        itemsFiltered.sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        )
        break
      case 'Data malejąco':
        itemsFiltered.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        break
      default:
        // Відображення за замовчуванням
        itemsFiltered.reverse() // Реверс за датою додавання
        break
    }

    return itemsFiltered
  }, [menuItems, sortOption, categoryFilter, isActiveFilter, isOrderableFilter])

  const openDeleteDialog = (id: string) => {
    setMenuItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (menuItemToDelete) {
      await deleteMenuItem({ id: menuItemToDelete })
      setMenuItemToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/admin-panel/menu/edit/${id}`)
  }

  const handleAddNewItem = () => {
    router.push('/admin-panel/menu/create')
  }

  const handleToggleisActive = async (id: string, isActive: boolean) => {
    await updateMenuItem({ id, isActive })
  }

  const handleToggleIsOrderable = async (id: string, isOrderable: boolean) => {
    await updateMenuItem({ id, isOrderable })
  }

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <div>
        <Button onClick={handleAddNewItem}>
          <FiPlus /> Dodaj
        </Button>
      </div>
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        <div className="flex gap-2 w-full">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger aria-label="Sortowanie">
              <SelectValue placeholder="Sortuj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Domyślnie</SelectItem>
              <SelectItem value="Nazwa rosnąco">Nazwa rosnąco</SelectItem>
              <SelectItem value="Nazwa malejąco">Nazwa malejąco</SelectItem>
              <SelectItem value="Cena rosnąco">Cena rosnąco</SelectItem>
              <SelectItem value="Cena malejąco">Cena malejąco</SelectItem>
              <SelectItem value="Data rosnąco">Data rosnąco</SelectItem>
              <SelectItem value="Data malejąco">Data malejąco</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(val) =>
              setCategoryFilter(val as MenuItemCategory | 'all')
            }
          >
            <SelectTrigger aria-label="Kategorie">
              <SelectValue placeholder="Filtruj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {Array.from(
                new Set(
                  menuItems.map((item) => item.category as MenuItemCategory)
                )
              ).map((category) => (
                <SelectItem key={category} value={category}>
                  <span>{category}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full gap-2">
          <Select value={isActiveFilter} onValueChange={setisActiveFilter}>
            <SelectTrigger aria-label="Aktywność">
              <SelectValue placeholder="Filtruj po aktywności" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="true">Aktywne</SelectItem>
              <SelectItem value="false">Nieaktywne</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={isOrderableFilter}
            onValueChange={setIsOrderableFilter}
          >
            <SelectTrigger aria-label="Zamawialość">
              <SelectValue placeholder="Filtruj po dostępności do zamówienia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="true">Dostępne do zamówienia</SelectItem>
              <SelectItem value="false">Wyłączone z zamówienia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-text-foreground">LP</TableHead>
                <TableHead className="text-text-foreground hidden lg:table-cell">
                  Obraz
                </TableHead>
                <TableHead className="text-text-foreground">Nazwa</TableHead>
                <TableHead className="text-text-foreground">
                  Kategoria
                </TableHead>
                <TableHead className="text-text-foreground">Cena</TableHead>
                <TableHead className="text-text-foreground hidden lg:table-cell">
                  Aktywne
                </TableHead>
                <TableHead className="text-text-foreground hidden lg:table-cell">
                  Zamówienie
                </TableHead>
                <TableHead className="text-text-foreground">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <ImageWithFallback
                      key={item.image}
                      src={item.image || ''}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-cover"
                      containerClassName="h-12 w-12"
                    />
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-secondary underline"
                    onClick={() => handleEdit(item.id)}
                  >
                    {item.name}
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.price} zł</TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    <Switch
                      checked={item.isActive}
                      onCheckedChange={(value) =>
                        handleToggleisActive(item.id, value)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    <Switch
                      checked={item.isOrderable}
                      onCheckedChange={(value) =>
                        handleToggleIsOrderable(item.id, value)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center space-x-2">
                    <button
                      className="text-info hover:text-info-light"
                      onClick={() => handleEdit(item.id)}
                    >
                      Edytuj
                    </button>
                    <button
                      className="text-danger hover:text-danger-light"
                      onClick={() => openDeleteDialog(item.id)}
                    >
                      Usuń
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Діалогове вікно підтвердження видалення */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Czy na pewno chcesz usunąć tę pozycję menu?
            </DialogTitle>
            <DialogDescription className="text-text-foreground">
              Ta operacja usunie pozycję bezpowrotnie.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Anuluj
            </Button>
            <LoadingButton
              isLoading={isLoadingDelete}
              variant="danger"
              onClick={confirmDelete}
            >
              Usuń
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MenuTable
