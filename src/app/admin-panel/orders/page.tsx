'use client'

import LoadingButton from '@/app/components/LoadingButton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import { useOrders } from '@/app/context/OrdersContext'
import { formatTimeAgo } from '@/utils/formatTimeAgo'
import { getOrderStatuses } from '@/utils/getOrderStatuses'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import { OrderStatus, Prisma } from '@prisma/client'
import orderBy from 'lodash/orderBy'
import { ArrowRight, Bell, Check, ChevronDown, Package, Pencil, Trash2, Truck } from 'lucide-react'
import { useState } from 'react'
import DeliveryTimeManager from '../components/DeliveryTimeManager'
import { FilterButton } from '../components/FilterButton'
import { PageHeader } from '../components/PageHeader'

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: { include: { menuItem: true } }
    promoCode: true
  }
}>

const statusBadgeMap: { [key in OrderStatus]: string } = {
  PENDING:     'bg-warning-light text-warning-dark',
  ACCEPTED:    'bg-info-light text-info-dark',
  IN_PROGRESS: 'bg-info-light text-info-dark',
  READY:       'bg-info-light text-info-dark',
  DELIVERING:  'bg-info-light text-info-dark',
  DELIVERED:   'bg-info-light text-info-dark',
  COMPLETED:   'bg-success-light text-success-dark',
  CANCELLED:   'bg-danger/10 text-danger',
}

const statusLabelMap: { [key in OrderStatus]: string } = {
  PENDING:     'Nowe',
  ACCEPTED:    'Przyjęte',
  IN_PROGRESS: 'W realizacji',
  READY:       'Gotowe',
  DELIVERING:  'W drodze',
  DELIVERED:   'Dostarczone',
  COMPLETED:   'Zakończone',
  CANCELLED:   'Anulowane',
}

const statusButtonMap = (deliveryMethod: 'DELIVERY' | 'TAKE_OUT', status: OrderStatus) => {
  const map: { [key in OrderStatus]: { label: string; nextStatus: OrderStatus | null } } = {
    PENDING:     { label: 'Przyjmij',   nextStatus: 'ACCEPTED' },
    ACCEPTED:    { label: 'Realizuj',   nextStatus: 'IN_PROGRESS' },
    IN_PROGRESS: { label: 'Wydaj',      nextStatus: 'READY' },
    READY:       deliveryMethod === 'DELIVERY'
      ? { label: 'Wyślij',    nextStatus: 'DELIVERING' }
      : { label: 'Odebrane',  nextStatus: 'COMPLETED' },
    DELIVERING:  { label: 'Zakończ',    nextStatus: 'DELIVERED' },
    DELIVERED:   { label: 'Odebrane',   nextStatus: 'COMPLETED' },
    COMPLETED:   { label: 'Zakończone', nextStatus: null },
    CANCELLED:   { label: 'Anulowane',  nextStatus: null },
  }
  return map[status]
}

const statusOrder: OrderStatus[] = [
  'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY',
  'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELLED',
]

const TABS = [
  { value: 'new',         label: 'Nowe',       statuses: ['PENDING'] as OrderStatus[] },
  { value: 'in-progress', label: 'W trakcie',  statuses: ['ACCEPTED', 'IN_PROGRESS', 'READY', 'DELIVERING'] as OrderStatus[] },
  { value: 'completed',   label: 'Zakończone', statuses: ['COMPLETED', 'DELIVERED', 'CANCELLED'] as OrderStatus[] },
]

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs font-sans font-normal uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
    <p className="text-base font-sans font-normal text-dark-gray">{value || '—'}</p>
  </div>
)

const Orders = () => {
  const [activeTab, setActiveTab]                       = useState('new')
  const [statusFilter, setStatusFilter]                 = useState<OrderStatus | 'ALL'>('ALL')
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<'DELIVERY' | 'TAKE_OUT' | 'ALL'>('ALL')
  const [selectedStatus, setSelectedStatus]             = useState<{ [key: string]: OrderStatus }>({})
  const [isEditingStatus, setIsEditingStatus]           = useState<{ [key: string]: boolean }>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen]     = useState(false)
  const [orderToDelete, setOrderToDelete]               = useState<string | null>(null)

  const {
    allOrders,
    highlightedOrderIds,
    isDialogOpen,
    handleCloseDialog,
    newOrderCount,
    setAllOrders,
  } = useOrders()

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: (_, variables) => {
      setAllOrders((prev) =>
        prev.map((o) =>
          o.id === variables.orderId
            ? { ...o, status: variables.status, statusUpdatedAt: new Date() }
            : o
        )
      )
    },
  })

  const { mutate: mutateDelete, isLoading: isLoadingDelete } =
    trpc.order.deleteOrder.useMutation({
      onSuccess: (_, variables) => {
        setAllOrders((prev) => prev.filter((o) => o.id !== variables.orderId))
        setIsDeleteDialogOpen(false)
      },
    })

  const activeFilterCount = [
    statusFilter !== 'ALL',
    deliveryMethodFilter !== 'ALL',
  ].filter(Boolean).length

  const sortedOrders = orderBy(
    [...(allOrders || [])],
    [(o: OrderWithItems) => new Date(o.createdAt).getTime()],
    ['desc']
  )

  const filteredOrders = sortedOrders.filter((o) => {
    const matchStatus = statusFilter !== 'ALL' ? o.status === statusFilter : true
    const matchMethod = deliveryMethodFilter !== 'ALL' ? o.deliveryMethod === deliveryMethodFilter : true
    return matchStatus && matchMethod
  })

  const tabOrders = (tab: typeof TABS[number]) =>
    filteredOrders.filter((o) => tab.statuses.includes(o.status))

  const currentTab = TABS.find((t) => t.value === activeTab)!

  const confirmStatusChange = (orderId: string, e: React.MouseEvent, next: OrderStatus | null) => {
    e.stopPropagation()
    if (!next) return
    setAllOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: next } : o))
    updateStatus.mutate({ orderId, status: next })
    setIsEditingStatus((prev) => ({ ...prev, [orderId]: false }))
  }

  const toggleStatusEdit = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const current = allOrders?.find((o) => o.id === orderId)?.status
    setSelectedStatus((prev) => ({ ...prev, [orderId]: current as OrderStatus }))
    setIsEditingStatus((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const clearFilters = () => {
    setStatusFilter('ALL')
    setDeliveryMethodFilter('ALL')
  }

  const getOrderLabel = (count: number) => {
    if (count === 1) return 'nowe zamówienie'
    if (count >= 2 && count <= 4) return 'nowe zamówienia'
    return 'nowych zamówień'
  }

  // ── Tabs (center slot) ─────────────────────────────────────────────────────
  const tabsNode = (
    <div className="flex items-center gap-0.5">
      {TABS.map((tab) => {
        const count = tabOrders(tab).length
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex items-center gap-2 h-14 px-5 text-sm font-sans font-normal border-b-2 transition-all duration-150',
              isActive
                ? 'border-primary text-dark-gray'
                : 'border-transparent text-muted-foreground hover:text-dark-gray'
            )}
          >
            {tab.label}
            <span className={cn(
              'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-normal',
              isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )

  // ── Toolbar (right slot) ───────────────────────────────────────────────────
  const toolbarNode = (
    <FilterButton
      activeCount={activeFilterCount}
      onClear={clearFilters}
      filters={[
        {
          label: 'Status',
          value: statusFilter,
          onChange: (v) => setStatusFilter(v as OrderStatus | 'ALL'),
          options: statusOrder.map((s) => ({ label: statusLabelMap[s], value: s })),
          allLabel: 'Wszystkie statusy',
        },
        {
          label: 'Metoda dostawy',
          value: deliveryMethodFilter,
          onChange: (v) => setDeliveryMethodFilter(v as 'DELIVERY' | 'TAKE_OUT' | 'ALL'),
          options: [
            { label: 'Dostawa', value: 'DELIVERY' },
            { label: 'Odbiór własny', value: 'TAKE_OUT' },
          ],
          allLabel: 'Wszystkie metody',
        },
      ]}
    />
  )

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!allOrders) {
    return (
      <>
        <div className="sticky top-14 z-20 bg-white border-b border-border h-12" />
        <div className="p-4 md:p-6 lg:p-8 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </>
    )
  }

  // ── Order list renderer ────────────────────────────────────────────────────
  const orders = tabOrders(currentTab)

  return (
    <>
      <PageHeader
        title="Zamówienia"
        tabs={tabsNode}
        toolbar={toolbarNode}
      />

      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Package size={40} strokeWidth={1} className="mb-3 opacity-30" />
            <p className="text-sm font-sans font-normal">Brak zamówień</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {orders.map((order, index) => {
              const { relativeTime, fullDate, fullTime } = formatTimeAgo(new Date(order.createdAt))
              const btn = statusButtonMap(order.deliveryMethod, order.status)
              const isHighlighted = highlightedOrderIds.has(order.id)
              const itemsPreview = order.items?.slice(0, 2).map((i) => i.menuItem?.name).join(', ')
              const itemsMore = (order.items?.length || 0) - 2

              return (
                <AccordionItem
                  key={order.id}
                  value={order.id}
                  className={cn(
                    'bg-white rounded-xl border border-border overflow-hidden',
                    isHighlighted && 'border-success ring-1 ring-success/30'
                  )}
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 transition-colors [&>svg]:hidden">
                    <div className="flex items-center gap-4 w-full text-left">
                      {/* Index */}
                      <span className="hidden md:block text-sm font-sans font-normal text-muted-foreground w-6 shrink-0 tabular-nums">
                        {index + 1}
                      </span>

                      {/* Method badge */}
                      <span className={cn(
                        'hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-sans font-normal shrink-0',
                        order.deliveryMethod === 'DELIVERY'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-muted text-dark-gray'
                      )}>
                        {order.deliveryMethod === 'DELIVERY'
                          ? <><Truck size={12} strokeWidth={2} /> Dostawa</>
                          : <><Package size={12} strokeWidth={2} /> Odbiór</>}
                      </span>

                      {/* Customer + items */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-sans font-normal text-dark-gray truncate">{order.name}</p>
                        <p className="text-sm font-sans font-normal text-muted-foreground truncate">
                          {itemsPreview}{itemsMore > 0 ? ` +${itemsMore}` : ''}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="hidden md:block text-right shrink-0">
                        <p className="text-sm font-sans font-normal text-dark-gray">
                          {relativeTime || `${fullDate} ${fullTime}`}
                        </p>
                        <p className="text-xs font-sans font-normal text-muted-foreground">
                          dostawa: {new Date(order.deliveryTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Status (click to edit) */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isEditingStatus[order.id] ? (
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={selectedStatus[order.id]}
                              onValueChange={(v) => setSelectedStatus((prev) => ({ ...prev, [order.id]: v as OrderStatus }))}
                            >
                              <SelectTrigger className="h-7 text-xs w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getOrderStatuses(order.deliveryMethod).map((s) => (
                                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <button
                              onClick={(e) => confirmStatusChange(order.id, e, selectedStatus[order.id])}
                              className="w-7 h-7 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success/20"
                            >
                              <Check size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => toggleStatusEdit(order.id, e)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-sans font-normal transition-opacity hover:opacity-80',
                              statusBadgeMap[order.status]
                            )}
                          >
                            {statusLabelMap[order.status]}
                            <Pencil size={10} strokeWidth={2} />
                          </button>
                        )}
                      </div>

                      {/* Action button */}
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {btn?.nextStatus ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-sans font-normal gap-1.5"
                            onClick={(e) => confirmStatusChange(order.id, e, btn.nextStatus)}
                          >
                            {btn.label}
                            <ArrowRight size={13} strokeWidth={2} />
                          </Button>
                        ) : (
                          <span className="text-xs font-sans text-muted-foreground italic">—</span>
                        )}
                      </div>

                      {/* Chevron */}
                      <ChevronDown size={15} strokeWidth={1.5} className="shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="border-t border-border">
                    <div className="p-5 space-y-5">
                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        <DetailRow label="Klient" value={order.name} />
                        <DetailRow label="Telefon" value={order.phone} />
                        <DetailRow label="Płatność" value={
                          order.paymentMethod === 'cash_offline' ? 'Gotówka przy odbiorze' : 'Karta przy odbiorze'
                        } />
                        <DetailRow label="Nr zamówienia" value={<span className="font-mono text-xs">{order.id.slice(0, 8)}…</span>} />
                        {order.nip && <DetailRow label="NIP" value={order.nip} />}
                        {order.comment && <DetailRow label="Komentarz" value={order.comment} />}
                      </div>

                      {/* Delivery address */}
                      {order.deliveryMethod === 'DELIVERY' && (
                        <div>
                          <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground mb-1.5">Adres dostawy</p>
                          <p className="text-sm font-sans font-normal text-dark-gray">
                            {order.street} {order.buildingNumber}{order.apartment ? `/${order.apartment}` : ''}, {order.postalCode} {order.city}
                          </p>
                        </div>
                      )}

                      {/* Order items */}
                      <div>
                        <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground mb-2">Zamówienie</p>
                        <ul className="space-y-1.5">
                          {order.items?.map((item) => (
                            <li key={item.id} className="flex items-center gap-2.5 text-sm font-sans font-normal text-dark-gray">
                              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-normal text-muted-foreground shrink-0">
                                {item.quantity}
                              </span>
                              {item.menuItem?.name || 'Nieznana pozycja'}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Promo */}
                      {order.promoCode?.code && (
                        <div className="bg-muted rounded-lg p-3 space-y-1">
                          <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground">Promocja</p>
                          <p className="text-xs font-sans font-normal text-dark-gray">
                            Kod: <span className="font-mono">{order.promoCode.code}</span> — rabat {order.promoCode.discountValue}{order.promoCode.discountType === 'PERCENTAGE' ? '%' : ' zł'}
                          </p>
                          <p className="text-xs text-muted-foreground">Kwota przed rabatem: {order.totalAmount} zł</p>
                        </div>
                      )}

                      {/* Total */}
                      <p className="text-sm font-sans font-normal text-dark-gray">
                        Kwota: <span className="font-semibold">{order.finalAmount} zł</span>
                      </p>

                      {/* Delivery time manager */}
                      <div className="border-t border-border pt-4">
                        <DeliveryTimeManager orderId={order.id} currentDeliveryTime={order.deliveryTime} />
                      </div>

                      {/* Delete */}
                      <div className="border-t border-border pt-3">
                        <button
                          onClick={() => { setOrderToDelete(order.id); setIsDeleteDialogOpen(true) }}
                          className="flex items-center gap-1.5 text-xs font-sans font-normal text-muted-foreground hover:text-danger transition-colors"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                          Usuń zamówienie
                        </button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-dark-gray">Usunąć zamówienie?</DialogTitle>
            <DialogDescription className="font-sans font-normal text-muted-foreground">
              Ta operacja jest nieodwracalna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteDialogOpen(false)}>Anuluj</Button>
            <LoadingButton variant="danger" size="sm" isLoading={isLoadingDelete} onClick={() => orderToDelete && mutateDelete({ orderId: orderToDelete })}>
              Usuń
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New orders dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="rounded-2xl" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Nowe zamówienie</DialogTitle>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell size={22} strokeWidth={1.5} className="text-primary" />
            </div>
            <p className="text-base font-sans font-normal text-dark-gray">
              Masz <span className="font-semibold">{newOrderCount}</span> {getOrderLabel(newOrderCount)}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDialog} className="w-full">OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Orders
