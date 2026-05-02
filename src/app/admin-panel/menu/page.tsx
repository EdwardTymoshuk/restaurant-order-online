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
import { menuItemCategories } from '@/config'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import { MenuItem } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { ArrowUpDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
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

const MenuTable = () => {
  const [sortOption, setSortOption]               = useState<SortOption>('default')
  const [categoryFilter, setCategoryFilter]       = useState<MenuItemCategory | 'ALL'>('ALL')
  const [isActiveFilter, setIsActiveFilter]       = useState<'ALL' | 'true' | 'false'>('ALL')
  const [isOrderableFilter, setIsOrderableFilter] = useState<'ALL' | 'true' | 'false'>('ALL')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [menuItemToDelete, setMenuItemToDelete]   = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const groupedItems = useMemo(() => {
    const groups = new Map<MenuItemCategory, typeof sortedItems>()

    for (const item of sortedItems) {
      const current = groups.get(item.category) ?? []
      current.push(item)
      groups.set(item.category, current)
    }

    return Array.from(groups.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => {
        const aIndex = menuItemCategories.indexOf(a.category)
        const bIndex = menuItemCategories.indexOf(b.category)
        if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category)
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
  }, [sortedItems])

  const updateMenuItemWithoutJump = async (payload: { id: string; isActive?: boolean; isOrderable?: boolean }) => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    await updateMenuItem(payload)
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollTop
    })
  }

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

      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-sans font-normal text-muted-foreground">
                {sortedItems.length} {sortedItems.length === 1 ? 'pozycja' : 'pozycji'}
              </p>
              <div className="hidden items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground lg:flex">
                <button
                  onClick={() => cycleSort('name_asc', 'name_desc')}
                  className="flex items-center gap-1.5 hover:text-dark-gray"
                >
                  Nazwa <SortIcon ascKey="name_asc" descKey="name_desc" />
                </button>
                <button
                  onClick={() => cycleSort('price_asc', 'price_desc')}
                  className="flex items-center gap-1.5 hover:text-dark-gray"
                >
                  <SortIcon ascKey="price_asc" descKey="price_desc" /> Cena
                </button>
              </div>
            </div>

            {sortedItems.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border border-border bg-white py-16 text-muted-foreground">
                <p className="text-sm font-sans font-normal">Brak pozycji</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedItems.map((group) => (
                  <section key={group.category} className="overflow-hidden rounded-2xl border border-border bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/35 px-5 py-3">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">{group.category}</h2>
                        <p className="text-xs text-muted-foreground">
                          {group.items.length} {group.items.length === 1 ? 'pozycja' : 'pozycji'}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                        {group.items.filter((item) => item.isActive).length} aktywne
                      </span>
                    </div>

                    <div className="hidden grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-border bg-white px-5 py-2.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground lg:grid">
                      <span className="w-6">#</span>
                      <button
                        onClick={() => cycleSort('name_asc', 'name_desc')}
                        className="flex items-center gap-1.5 text-left hover:text-dark-gray"
                      >
                        Pozycja <SortIcon ascKey="name_asc" descKey="name_desc" />
                      </button>
                      <button
                        onClick={() => cycleSort('price_asc', 'price_desc')}
                        className="flex w-20 items-center justify-end gap-1.5 hover:text-dark-gray"
                      >
                        <SortIcon ascKey="price_asc" descKey="price_desc" /> Cena
                      </button>
                      <span className="w-20 text-center">Widoczna</span>
                      <span className="w-24 text-center">Zamówienia</span>
                      <span className="w-24 text-right">Akcje</span>
                    </div>

                    <div className="divide-y divide-border">
                      {group.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 group lg:grid-cols-[auto_1fr_auto_auto_auto_auto] lg:gap-4 lg:px-5"
                        >
                          <span className="hidden w-6 text-sm font-sans font-normal text-muted-foreground tabular-nums lg:block">
                            {index + 1}
                          </span>

                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                              <ImageWithFallback
                                key={item.image}
                                src={item.image || ''}
                                alt={item.name}
                                width={44}
                                height={44}
                                className="h-11 w-11 object-cover"
                                containerClassName="h-11 w-11"
                              />
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => router.push(`/admin-panel/menu/edit/${item.id}`)}
                                className="block truncate text-left text-base font-sans font-normal text-dark-gray transition-colors hover:text-secondary"
                              >
                                {item.name}
                              </button>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground lg:hidden">
                                <span>{item.price} zł</span>
                                <span>{item.isActive ? 'Widoczna' : 'Ukryta'}</span>
                                <span>{item.isOrderable ? 'Zamówienia online' : 'Bez zamówień online'}</span>
                              </div>
                            </div>
                          </div>

                          <span className="w-20 text-right text-base font-sans font-normal text-dark-gray tabular-nums">
                            {item.price} zł
                          </span>

                          <div className="hidden w-20 justify-center lg:flex">
                            <Switch
                              checked={item.isActive}
                              aria-label={`Widoczność pozycji ${item.name}`}
                              onCheckedChange={(v) => updateMenuItemWithoutJump({ id: item.id, isActive: v })}
                            />
                          </div>

                          <div className="hidden w-24 justify-center lg:flex">
                            <Switch
                              checked={item.isOrderable}
                              aria-label={`Dostępność do zamówienia pozycji ${item.name}`}
                              onCheckedChange={(v) => updateMenuItemWithoutJump({ id: item.id, isOrderable: v })}
                            />
                          </div>

                          <div className="flex w-20 items-center justify-end gap-1 lg:w-24">
                            <button
                              onClick={() => router.push(`/admin-panel/menu/edit/${item.id}`)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/10 hover:text-secondary"
                              aria-label={`Edytuj ${item.name}`}
                            >
                              <Pencil size={15} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => { setMenuItemToDelete(item.id); setIsDeleteDialogOpen(true) }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                              aria-label={`Usuń ${item.name}`}
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
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
