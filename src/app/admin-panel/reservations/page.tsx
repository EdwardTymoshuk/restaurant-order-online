'use client'

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
import { Skeleton } from '@/app/components/ui/skeleton'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import {
  EventType,
  PackageCode,
  Prisma,
  ReservationStatus,
} from '@prisma/client'
import {
  Calendar,
  ChevronDown,
  Clock,
  Mail,
  Phone,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { FilterButton } from '../components/FilterButton'
import { PageHeader } from '../components/PageHeader'

type ReservationListItem = Prisma.ReservationGetPayload<{
  include: {
    offerSnapshot: { select: { total: true; packageCode: true } }
    contact: { select: { name: true; phone: true } }
  }
}>

type ReservationDetail = Prisma.ReservationGetPayload<{
  include: {
    offerSnapshot: true
    extras: true
    contact: true
  }
}>

const statusBadgeMap: Record<ReservationStatus, string> = {
  DRAFT:     'bg-muted text-muted-foreground',
  SENT:      'bg-warning-light text-warning-dark',
  CONFIRMED: 'bg-success-light text-success-dark',
  CANCELLED: 'bg-danger/10 text-danger',
}

const statusLabelMap: Record<ReservationStatus, string> = {
  DRAFT:     'Szkic',
  SENT:      'Nowe',
  CONFIRMED: 'Potwierdzone',
  CANCELLED: 'Anulowane',
}

const packageLabelMap: Record<PackageCode, string> = {
  SILVER:   'Silver',
  GOLD:     'Gold',
  PLATINUM: 'Platinum',
}

const eventTypeLabelMap: Record<EventType, string> = {
  BIRTHDAY:      'Urodziny',
  ANNIVERSARY:   'Rocznica',
  COMMUNION:     'Komunia',
  CHRISTENING:   'Chrzciny',
  COMPANY_EVENT: 'Impreza firmowa',
  OTHER:         'Inne',
}

const TABS = [
  { value: 'new',       label: 'Nowe',         statuses: ['SENT'] as ReservationStatus[] },
  { value: 'confirmed', label: 'Potwierdzone',  statuses: ['CONFIRMED'] as ReservationStatus[] },
  { value: 'cancelled', label: 'Anulowane',     statuses: ['CANCELLED', 'DRAFT'] as ReservationStatus[] },
]

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground mb-0.5">
      {label}
    </p>
    <p className="text-sm font-sans font-normal text-dark-gray">{value || '—'}</p>
  </div>
)

const Reservations = () => {
  const [activeTab, setActiveTab] = useState('new')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    id: string
    action: 'confirm' | 'cancel'
  } | null>(null)

  const { data: reservations, isLoading, refetch } =
    trpc.reservations.getReservationsList.useQuery({})

  const { data: detail, isFetching: isFetchingDetail } =
    trpc.reservations.getReservationById.useQuery(
      { id: expandedId! },
      { enabled: !!expandedId }
    )

  const updateStatus = trpc.reservations.updateStatus.useMutation({
    onSuccess: () => {
      void refetch()
      setConfirmDialog(null)
    },
  })

  const currentTab = TABS.find((t) => t.value === activeTab)!

  const filteredReservations = (reservations ?? []).filter((r) => {
    const matchTab = currentTab.statuses.includes(r.status)
    const matchFilter = statusFilter === 'ALL' || r.status === statusFilter
    return matchTab && matchFilter
  })

  const tabCount = (tab: typeof TABS[number]) =>
    (reservations ?? []).filter((r) => tab.statuses.includes(r.status)).length

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const tabsNode = (
    <div className="flex items-center gap-0.5">
      {TABS.map((tab) => {
        const count = tabCount(tab)
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

  const toolbarNode = (
    <FilterButton
      activeCount={statusFilter !== 'ALL' ? 1 : 0}
      onClear={() => setStatusFilter('ALL')}
      filters={[
        {
          label: 'Status',
          value: statusFilter,
          onChange: (v) => setStatusFilter(v as ReservationStatus | 'ALL'),
          options: Object.entries(statusLabelMap).map(([k, v]) => ({
            label: v,
            value: k,
          })),
          allLabel: 'Wszystkie statusy',
        },
      ]}
    />
  )

  if (isLoading) {
    return (
      <>
        <div className="sticky top-0 z-20 bg-white border-b border-border h-14" />
        <div className="p-4 md:p-6 lg:p-8 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Rezerwacje" tabs={tabsNode} toolbar={toolbarNode} />

      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8">
        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Calendar size={40} strokeWidth={1} className="mb-3 opacity-30" />
            <p className="text-sm font-sans font-normal">Brak rezerwacji</p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="space-y-2"
            onValueChange={(v) => setExpandedId(v || null)}
          >
            {filteredReservations.map((res, index) => (
              <AccordionItem
                key={res.id}
                value={res.id}
                className="bg-white rounded-xl border border-border overflow-hidden"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 transition-colors [&>svg]:hidden">
                  <div className="flex items-center gap-4 w-full text-left">
                    {/* Index */}
                    <span className="hidden md:block text-sm font-sans font-normal text-muted-foreground w-6 shrink-0 tabular-nums">
                      {index + 1}
                    </span>

                    {/* Date + time */}
                    <div className="flex flex-col shrink-0 min-w-[110px]">
                      <span className="flex items-center gap-1.5 text-sm font-sans font-normal text-dark-gray">
                        <Calendar size={13} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                        {formatDate(res.eventDate)}
                      </span>
                      {(res.startTime || res.endTime) && (
                        <span className="flex items-center gap-1.5 text-xs font-sans font-normal text-muted-foreground mt-0.5">
                          <Clock size={11} strokeWidth={1.5} className="shrink-0" />
                          {res.startTime ?? ''}
                          {res.startTime && res.endTime ? ` – ${res.endTime}` : res.endTime ?? ''}
                        </span>
                      )}
                    </div>

                    {/* Guests */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-sm font-sans font-normal text-dark-gray">
                      <Users size={13} strokeWidth={1.5} className="text-muted-foreground" />
                      {res.adultsCount}
                      {res.childrenCount ? ` + ${res.childrenCount}dz` : ''}
                    </div>

                    {/* Contact */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans font-normal text-dark-gray truncate">
                        {res.contact?.name ?? '—'}
                      </p>
                      <p className="text-xs font-sans font-normal text-muted-foreground truncate">
                        {res.contact?.phone ?? ''}
                      </p>
                    </div>

                    {/* Package + total */}
                    <div className="hidden md:flex flex-col items-end shrink-0 text-right">
                      {res.offerSnapshot?.packageCode && (
                        <span className="text-xs font-sans font-normal text-muted-foreground">
                          {packageLabelMap[res.offerSnapshot.packageCode]}
                        </span>
                      )}
                      {res.offerSnapshot?.total != null && (
                        <span className="text-sm font-sans font-semibold text-dark-gray">
                          {res.offerSnapshot.total} zł
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={cn(
                      'shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-normal',
                      statusBadgeMap[res.status]
                    )}>
                      {statusLabelMap[res.status]}
                    </span>

                    <ChevronDown
                      size={15}
                      strokeWidth={1.5}
                      className="shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180"
                    />
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-t border-border">
                  {isFetchingDetail && expandedId === res.id ? (
                    <div className="p-5 space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <ReservationDetail
                      summary={res}
                      detail={expandedId === res.id ? detail ?? null : null}
                      onConfirm={() => setConfirmDialog({ id: res.id, action: 'confirm' })}
                      onCancel={() => setConfirmDialog({ id: res.id, action: 'cancel' })}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Confirm / Cancel dialog */}
      <Dialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-dark-gray">
              {confirmDialog?.action === 'confirm'
                ? 'Potwierdzić rezerwację?'
                : 'Anulować rezerwację?'}
            </DialogTitle>
            <DialogDescription className="font-sans font-normal text-muted-foreground">
              {confirmDialog?.action === 'confirm'
                ? 'Status zostanie zmieniony na Potwierdzone.'
                : 'Status zostanie zmieniony na Anulowane. Operacja jest nieodwracalna.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmDialog(null)}
            >
              Wróć
            </Button>
            <Button
              variant={confirmDialog?.action === 'cancel' ? 'destructive' : 'default'}
              size="sm"
              disabled={updateStatus.isLoading}
              onClick={() => {
                if (!confirmDialog) return
                updateStatus.mutate({
                  id: confirmDialog.id,
                  status:
                    confirmDialog.action === 'confirm'
                      ? 'CONFIRMED'
                      : 'CANCELLED',
                })
              }}
            >
              {updateStatus.isLoading
                ? 'Zapisywanie…'
                : confirmDialog?.action === 'confirm'
                ? 'Potwierdź'
                : 'Anuluj rezerwację'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Detail panel ────────────────────────────────────────────────────────────

const ReservationDetail = ({
  summary,
  detail,
  onConfirm,
  onCancel,
}: {
  summary: ReservationListItem
  detail: ReservationDetail | null
  onConfirm: () => void
  onCancel: () => void
}) => {
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  return (
    <div className="p-5 space-y-5">
      {/* Contact */}
      <div>
        <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground mb-2">
          Kontakt
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
          <DetailRow label="Imię i nazwisko" value={detail?.contact?.name ?? summary.contact?.name} />
          <DetailRow
            label="Telefon"
            value={
              detail?.contact?.phone ? (
                <a
                  href={`tel:${detail.contact.phone}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Phone size={12} strokeWidth={2} />
                  {detail.contact.phone}
                </a>
              ) : summary.contact?.phone
            }
          />
          <DetailRow
            label="E-mail"
            value={
              detail?.contact?.email ? (
                <a
                  href={`mailto:${detail.contact.email}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Mail size={12} strokeWidth={2} />
                  {detail.contact.email}
                </a>
              ) : null
            }
          />
          {detail?.contact?.notes && (
            <div className="col-span-full">
              <DetailRow label="Uwagi" value={detail.contact.notes} />
            </div>
          )}
        </div>
      </div>

      {/* Event */}
      <div>
        <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground mb-2">
          Wydarzenie
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          <DetailRow label="Data" value={formatDate(summary.eventDate)} />
          <DetailRow
            label="Godziny"
            value={
              summary.startTime
                ? `${summary.startTime}${summary.endTime ? ` – ${summary.endTime}` : ''}`
                : '—'
            }
          />
          <DetailRow
            label="Goście"
            value={`${summary.adultsCount} dorosłych${summary.childrenCount ? ` + ${summary.childrenCount} dzieci` : ''}`}
          />
          <DetailRow
            label="Typ"
            value={eventTypeLabelMap[summary.eventType] ?? summary.eventType}
          />
        </div>
      </div>

      {/* Offer snapshot */}
      {detail?.offerSnapshot && (
        <div>
          <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground mb-2">
            Oferta
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <DetailRow
              label="Pakiet"
              value={detail.offerSnapshot.packageCode
                ? `${detail.offerSnapshot.packageCode.charAt(0)}${detail.offerSnapshot.packageCode.slice(1).toLowerCase()}`
                : '—'}
            />
            <DetailRow label="Rodzaj serwisu" value={detail.offerSnapshot.servingType} />
            <DetailRow label="Cena / os." value={`${detail.offerSnapshot.basePricePerAdult} zł`} />
            <DetailRow label="Czas (h)" value={String(detail.offerSnapshot.durationHours)} />
          </div>

          <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-3 flex flex-wrap gap-x-8 gap-y-1 text-sm font-sans font-normal text-dark-gray">
            <span>Podstawa: <strong>{detail.offerSnapshot.subtotal} zł</strong></span>
            {detail.offerSnapshot.serviceFee > 0 && (
              <span>Serwis 10%: <strong>+{detail.offerSnapshot.serviceFee} zł</strong></span>
            )}
            <span>Suma: <strong>{detail.offerSnapshot.total} zł</strong></span>
          </div>
        </div>
      )}

      {/* Extras */}
      {detail?.extras && detail.extras.length > 0 && (
        <div>
          <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-muted-foreground mb-2">
            Dodatki
          </p>
          <ul className="space-y-1.5">
            {detail.extras.map((extra) => (
              <li
                key={extra.id}
                className="flex items-center justify-between text-sm font-sans font-normal text-dark-gray bg-muted/30 rounded-lg px-3 py-2"
              >
                <span>
                  <span className="text-muted-foreground mr-2">×{extra.quantity}</span>
                  {extra.label}
                </span>
                <span className="font-medium shrink-0 ml-4">+{extra.totalPrice} zł</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-border pt-4 flex items-center gap-3">
        {summary.status === 'SENT' && (
          <Button size="sm" onClick={onConfirm}>
            Potwierdź rezerwację
          </Button>
        )}
        {(summary.status === 'SENT' || summary.status === 'CONFIRMED') && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-sans font-normal text-muted-foreground hover:text-danger transition-colors"
          >
            <X size={13} strokeWidth={2} />
            Anuluj rezerwację
          </button>
        )}
      </div>
    </div>
  )
}

export default Reservations
