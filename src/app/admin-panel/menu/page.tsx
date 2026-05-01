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
import { Skeleton } from '@/app/components/ui/skeleton'
import { Switch } from '@/app/components/ui/switch'
import { MenuItemCategory } from '@/app/types/types'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import { MenuItem } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { ArrowUpDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FilterButton } from '../components/FilterButton'
import { PageHeader } from '../components/PageHeader'

type SortOption = 'default' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc'

const SORT_OPTIONS = [
  { value: 'default',    label: 'Domyślnie' },
  { value: 'name_asc',   label: 'Nazwa A–Z' },
  { value: 'name_desc',  label: 'Nazwa Z–A' },
  { value: 'price_asc',  label: 'Cena rosnąco' },
  { value: 'price_desc', label: 'Cena malejąco' },
  { value: 'date_asc',   label: 'Najstarsze' },
  { value: 'date_desc',  label: 'Najnowsze' },
]

const TABLE_COLS = [
  { key: 'name',  label: 'Nazwa',     sortAsc: 'name_asc',   sortDesc: 'name_desc'  },
  { key: 'price', label: 'Cena',      sortAsc: 'price_asc',  sortDesc: 'price_desc' },
]

const MenuTable = () => {
  const [sortOption, setSortOption]               = useState<SortOption>('default')
  const [categoryFilter, setCategoryFilter]       = useState<MenuItemCategory | 'ALL'>('ALL')
  const [isActiveFilter, setIsActiveFilter]       = useState<'ALL' | 'true' | 'false'>('ALL')
  const [isOrderableFilter, setIsOrderableFilter] = useState<'ALL' | 'true' | 'false'>('ALL')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [menuItemToDelete, setMenuItemToDelete]   = useState<string | null>(null)

  const { data: menuItems = [], isLoading } = trpc.menu.getAllMenuItems.useQuery()
  const queryClient = useQueryClient()
  const router = useRouter()
  const queryKey = getQueryKey(trpc.menu.getAllMenuItems)

  const { mutateAsync: updateMenuItem } = trpc.menu.updateMenuItem.useMutation({
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries(queryKey)
      const previousData = queryClient.getQueryData<MenuItem[]>(queryKey)
      if (previousData) {
        queryClient.setQueryData<MenuItem[]>(queryKey, (oldData) =>
          oldData?.map((item) => item.id === updatedItem.id ? { ...item, ...updatedItem } : item)
        )
      }
      return { previousData }
    },
    onError: (_, __, context) => {
      if (context?.previousData) queryClient.setQueryData(queryKey, context.previousData)
    },
    onSettled: () => queryClient.invalidateQueries(queryKey),
  })

  const { mutateAsync: deleteMenuItem, isLoading: isLoadingDelete } =
    trpc.menu.deleteMenuItem.useMutation({
      onSettled: () => queryClient.invalidateQueries(queryKey),
    })

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((i) => i.category as MenuItemCategory))),
    [menuItems]
  )

  const activeFilterCount = [
    categoryFilter !== 'ALL',
    isActiveFilter !== 'ALL',
    isOrderableFilter !== 'ALL',
    sortOption !== 'default',
  ].filter(Boolean).length

  const sortedItems = useMemo(() => {
    let items = menuItems.map((i) => ({ ...i, category: i.category as MenuItemCategory }))

    if (categoryFilter !== 'ALL')    items = items.filter((i) => i.category === categoryFilter)
    if (isActiveFilter !== 'ALL')    items = items.filter((i) => i.isActive === (isActiveFilter === 'true'))
    if (isOrderableFilter !== 'ALL') items = items.filter((i) => i.isOrderable === (isOrderableFilter === 'true'))

    switch (sortOption) {
      case 'name_asc':   items.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name_desc':  items.sort((a, b) => b.name.localeCompare(a.name)); break
      case 'price_asc':  items.sort((a, b) => a.price - b.price); break
      case 'price_desc': items.sort((a, b) => b.price - a.price); break
      case 'date_asc':   items.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()); break
      case 'date_desc':  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); break
      default:           items.reverse(); break
    }
    return items
  }, [menuItems, sortOption, categoryFilter, isActiveFilter, isOrderableFilter])

  const clearFilters = () => {
    setSortOption('default')
    setCategoryFilter('ALL')
    setIsActiveFilter('ALL')
    setIsOrderableFilter('ALL')
  }

  const cycleSort = (ascKey: SortOption, descKey: SortOption) => {
    setSortOption((prev) =>
      prev === ascKey ? descKey : prev === descKey ? 'default' : ascKey
    )
  }

  const SortIcon = ({ ascKey, descKey }: { ascKey: SortOption; descKey: SortOption }) => (
    <ArrowUpDown
      size={13}
      strokeWidth={2}
      className={cn(
        'shrink-0 transition-colors',
        sortOption === ascKey || sortOption === descKey ? 'text-primary' : 'text-muted-foreground'
      )}
    />
  )

  // ── PageHeader slots ───────────────────────────────────────────────────────
  const actionsNode = (
    <Button size="sm" className="h-8 gap-1.5 text-sm" onClick={() => router.push('/admin-panel/menu/create')}>
      <Plus size={14} strokeWidth={2.5} />
      Dodaj pozycję
    </Button>
  )

  const toolbarNode = (
    <FilterButton
      activeCount={activeFilterCount}
      onClear={clearFilters}
      filters={[
        {
          label: 'Sortowanie',
          value: sortOption,
          onChange: (v) => setSortOption(v as SortOption),
          options: SORT_OPTIONS.filter((o) => o.value !== 'default'),
          allLabel: 'Domyślnie',
        },
        {
          label: 'Kategoria',
          value: categoryFilter,
          onChange: (v) => setCategoryFilter(v as MenuItemCategory | 'ALL'),
          options: categories.map((c) => ({ label: c, value: c })),
          allLabel: 'Wszystkie kategorie',
        },
        {
          label: 'Widoczność',
          value: isActiveFilter,
          onChange: (v) => setIsActiveFilter(v as 'ALL' | 'true' | 'false'),
          options: [{ label: 'Aktywne', value: 'true' }, { label: 'Nieaktywne', value: 'false' }],
          allLabel: 'Wszystkie',
        },
        {
          label: 'Dostępność do zamówienia',
          value: isOrderableFilter,
          onChange: (v) => setIsOrderableFilter(v as 'ALL' | 'true' | 'false'),
          options: [{ label: 'Dostępne', value: 'true' }, { label: 'Wyłączone', value: 'false' }],
          allLabel: 'Wszystkie',
        },
      ]}
    />
  )

  return (
    <>
      <PageHeader title="Menu" actions={actionsNode} toolbar={toolbarNode} />

      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Count */}
            <p className="text-sm font-sans font-normal text-muted-foreground mb-4">
              {sortedItems.length} {sortedItems.length === 1 ? 'pozycja' : 'pozycji'}
            </p>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-border bg-muted/40">
                <span className="text-xs font-sans font-normal uppercase tracking-widest text-muted-foreground w-6">#</span>
                <button
                  onClick={() => cycleSort('name_asc', 'name_desc')}
                  className="flex items-center gap-1.5 text-xs font-sans font-normal uppercase tracking-widest text-muted-foreground hover:text-dark-gray text-left"
                >
                  Nazwa <SortIcon ascKey="name_asc" descKey="name_desc" />
                </button>
                <span className="text-xs font-sans font-normal uppercase tracking-widest text-muted-foreground w-24 text-center">Kategoria</span>
                <button
                  onClick={() => cycleSort('price_asc', 'price_desc')}
                  className="flex items-center gap-1.5 text-xs font-sans font-normal uppercase tracking-widest text-muted-foreground hover:text-dark-gray w-20 justify-end"
                >
                  <SortIcon ascKey="price_asc" descKey="price_desc" /> Cena
                </button>
                <span className="text-xs font-sans font-normal uppercase tracking-widest text-muted-foreground w-20 text-center hidden lg:block">Aktywne</span>
                <span className="text-xs font-sans font-normal uppercase tracking-widest text-muted-foreground w-24 text-center hidden lg:block">Zamówienie</span>
                <span className="w-16" />
              </div>

              {/* Rows */}
              {sortedItems.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <p className="text-sm font-sans font-normal">Brak pozycji</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Index */}
                      <span className="text-sm font-sans font-normal text-muted-foreground w-6 tabular-nums">
                        {index + 1}
                      </span>

                      {/* Name + image */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                          <ImageWithFallback
                            key={item.image}
                            src={item.image || ''}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover"
                            containerClassName="w-10 h-10"
                          />
                        </div>
                        <button
                          onClick={() => router.push(`/admin-panel/menu/edit/${item.id}`)}
                          className="text-base font-sans font-normal text-dark-gray hover:text-secondary transition-colors truncate text-left"
                        >
                          {item.name}
                        </button>
                      </div>

                      {/* Category */}
                      <span className="w-24 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-muted text-xs font-sans font-normal text-dark-gray truncate max-w-full">
                          {item.category}
                        </span>
                      </span>

                      {/* Price */}
                      <span className="text-base font-sans font-normal text-dark-gray w-20 text-right tabular-nums">
                        {item.price} zł
                      </span>

                      {/* Active toggle */}
                      <div className="w-20 flex justify-center hidden lg:flex">
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={(v) => updateMenuItem({ id: item.id, isActive: v })}
                        />
                      </div>

                      {/* Orderable toggle */}
                      <div className="w-24 flex justify-center hidden lg:flex">
                        <Switch
                          checked={item.isOrderable}
                          onCheckedChange={(v) => updateMenuItem({ id: item.id, isOrderable: v })}
                        />
                      </div>

                      {/* Actions */}
                      <div className="w-16 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/admin-panel/menu/edit/${item.id}`)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => { setMenuItemToDelete(item.id); setIsDeleteDialogOpen(true) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-dark-gray">Usunąć pozycję menu?</DialogTitle>
            <DialogDescription className="font-sans font-normal text-muted-foreground">
              Ta operacja jest nieodwracalna.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteDialogOpen(false)}>Anuluj</Button>
            <LoadingButton isLoading={isLoadingDelete} variant="danger" size="sm" onClick={async () => {
              if (menuItemToDelete) {
                await deleteMenuItem({ id: menuItemToDelete })
                setMenuItemToDelete(null)
                setIsDeleteDialogOpen(false)
              }
            }}>
              Usuń
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MenuTable
