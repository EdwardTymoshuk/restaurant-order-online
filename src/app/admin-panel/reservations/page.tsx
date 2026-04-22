'use client'

import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/app/components/ui/sheet'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Textarea } from '@/app/components/ui/textarea'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import { EventType, PackageCode, Prisma, ReservationStatus } from '@prisma/client'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Ban,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutList,
  Lock,
  LockOpen,
  Mail,
  Phone,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion'
import { FilterButton } from '../components/FilterButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReservationListItem = Prisma.ReservationGetPayload<{
  include: {
    offerSnapshot: { select: { total: true; packageCode: true } }
    contact: { select: { name: true; phone: true } }
  }
}>

type ReservationDetail = Prisma.ReservationGetPayload<{
  include: { offerSnapshot: true; extras: true; contact: true }
}>

type ViewMode = 'calendar' | 'list'

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

const statusBadgeMap: Record<ReservationStatus, string> = {
  DRAFT:     'bg-muted text-muted-foreground',
  SENT:      'bg-warning/15 text-warning-dark',
  CONFIRMED: 'bg-success/15 text-success',
  CANCELLED: 'bg-danger/10 text-danger',
}

const statusLabelMap: Record<ReservationStatus, string> = {
  DRAFT:     'Szkic',
  SENT:      'Nowe',
  CONFIRMED: 'Potwierdzone',
  CANCELLED: 'Anulowane',
}

const statusDotMap: Record<ReservationStatus, string> = {
  DRAFT:     'bg-muted-foreground',
  SENT:      'bg-warning',
  CONFIRMED: 'bg-success',
  CANCELLED: 'bg-danger',
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
  { value: 'new',       label: 'Nowe',        statuses: ['SENT'] as ReservationStatus[] },
  { value: 'confirmed', label: 'Potwierdzone', statuses: ['CONFIRMED'] as ReservationStatus[] },
  { value: 'cancelled', label: 'Anulowane',    statuses: ['CANCELLED', 'DRAFT'] as ReservationStatus[] },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd')

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
    <p className="text-sm font-sans text-dark-gray">{value || '—'}</p>
  </div>
)

// ─── Form defaults ────────────────────────────────────────────────────────────

const emptyForm = () => ({
  eventDate: '',
  startTime: '',
  endTime: '',
  adultsCount: 12,
  childrenCount: 0,
  eventType: 'OTHER' as EventType,
  status: 'CONFIRMED' as ReservationStatus,
  name: '',
  phone: '',
  email: '',
  notes: '',
  packageCode: '' as PackageCode | '',
  total: '',
})

type FormState = ReturnType<typeof emptyForm>

// ─── Reservation form ─────────────────────────────────────────────────────────

const ReservationForm = ({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: FormState
  onSave: (f: FormState) => void
  onCancel: () => void
  isSaving: boolean
}) => {
  const [f, setF] = useState<FormState>(initial)
  const set = (key: keyof FormState, value: string | number) =>
    setF((prev) => ({ ...prev, [key]: value }))

  const valid =
    f.eventDate &&
    f.adultsCount >= 1 &&
    f.name.trim() &&
    f.phone.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)

  return (
    <div className="space-y-5">
      {/* Date & time */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Data i godziny</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-3">
            <Input type="date" value={f.eventDate} onChange={(e) => set('eventDate', e.target.value)} />
          </div>
          <Input placeholder="Początek np. 14:00" value={f.startTime} onChange={(e) => set('startTime', e.target.value)} />
          <Input placeholder="Koniec np. 22:00" value={f.endTime} onChange={(e) => set('endTime', e.target.value)} />
          <Select value={f.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabelMap).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Guests */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Goście i typ</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dorośli</label>
            <Input type="number" min={1} value={f.adultsCount} onChange={(e) => set('adultsCount', Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dzieci</label>
            <Input type="number" min={0} value={f.childrenCount} onChange={(e) => set('childrenCount', Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Typ</label>
            <Select value={f.eventType} onValueChange={(v) => set('eventType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeLabelMap).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Kontakt</p>
        <div className="space-y-2">
          <Input placeholder="Imię i nazwisko *" value={f.name} onChange={(e) => set('name', e.target.value)} />
          <Input placeholder="Telefon *" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input placeholder="E-mail *" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          <Textarea placeholder="Uwagi" value={f.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
        </div>
      </div>

      {/* Offer (optional) */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Oferta (opcjonalnie)</p>
        <div className="grid grid-cols-2 gap-2">
          <Select value={f.packageCode} onValueChange={(v) => set('packageCode', v)}>
            <SelectTrigger><SelectValue placeholder="Pakiet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Brak</SelectItem>
              {Object.entries(packageLabelMap).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Suma (zł)" type="number" value={f.total} onChange={(e) => set('total', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" disabled={!valid || isSaving} onClick={() => onSave(f)}>
          {isSaving ? 'Zapisywanie…' : 'Zapisz'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Anuluj</Button>
      </div>
    </div>
  )
}

// ─── Calendar cell ────────────────────────────────────────────────────────────

const CalendarCell = ({
  date,
  reservations,
  isBlocked,
  blockedNote,
  isCurrentMonth,
  isSelected,
  onClick,
}: {
  date: Date
  reservations: ReservationListItem[]
  isBlocked: boolean
  blockedNote?: string | null
  isCurrentMonth: boolean
  isSelected: boolean
  onClick: () => void
}) => {
  const _isToday = isToday(date)
  const hasSent = reservations.some((r) => r.status === 'SENT')
  const hasConfirmed = reservations.some((r) => r.status === 'CONFIRMED')

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start p-1.5 md:p-2 rounded-lg border transition-colors text-left min-h-[56px] md:min-h-[80px] w-full',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-border hover:bg-muted/40',
        !isCurrentMonth && 'opacity-30',
        isBlocked && 'bg-muted/60 border-border cursor-default'
      )}
    >
      <span
        className={cn(
          'text-xs md:text-sm font-medium leading-none',
          _isToday && 'text-primary font-semibold',
          !isCurrentMonth && 'text-muted-foreground'
        )}
      >
        {date.getDate()}
      </span>

      {isBlocked && (
        <span className="mt-1 hidden md:flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock size={9} />
          {blockedNote ?? 'Zajęte'}
        </span>
      )}

      {!isBlocked && reservations.length > 0 && (
        <div className="mt-auto flex flex-col gap-0.5 w-full">
          {reservations.slice(0, 2).map((r) => (
            <span
              key={r.id}
              className={cn(
                'hidden md:block truncate text-[10px] rounded px-1 py-0.5 leading-tight',
                r.status === 'CONFIRMED' ? 'bg-success/15 text-success' :
                r.status === 'SENT'      ? 'bg-warning/15 text-warning-dark' :
                                           'bg-muted text-muted-foreground'
              )}
            >
              {r.contact?.name ?? '—'}
            </span>
          ))}
          {reservations.length > 2 && (
            <span className="hidden md:block text-[10px] text-muted-foreground px-1">
              +{reservations.length - 2} więcej
            </span>
          )}
          {/* Mobile: dots only */}
          <div className="md:hidden flex gap-0.5 mt-0.5">
            {hasSent && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
            {hasConfirmed && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
          </div>
        </div>
      )}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const Reservations = () => {
  const { status: sessionStatus } = useSession()
  const enabled = sessionStatus === 'authenticated'

  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('new')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [editReservation, setEditReservation] = useState<ReservationDetail | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: 'confirm' | 'cancel' } | null>(null)
  const [blockDateInput, setBlockDateInput] = useState('')
  const [blockNoteInput, setBlockNoteInput] = useState('')
  const [blockPanelOpen, setBlockPanelOpen] = useState(false)

  // Data
  const { data: reservations, isLoading, refetch } = trpc.reservations.getReservationsList.useQuery({}, { enabled })
  const { data: blockedDates, refetch: refetchBlocked } = trpc.reservations.getBlockedDates.useQuery(undefined, { enabled })
  const { data: detail } = trpc.reservations.getReservationById.useQuery(
    { id: expandedId! },
    { enabled: !!expandedId && enabled }
  )

  // Mutations
  const createReservation = trpc.reservations.createReservation.useMutation({ onSuccess: () => { void refetch(); setAddOpen(false) } })
  const updateReservation = trpc.reservations.updateReservation.useMutation({ onSuccess: () => { void refetch(); setEditReservation(null) } })
  const deleteReservation = trpc.reservations.deleteReservation.useMutation({ onSuccess: () => { void refetch(); setDeleteId(null) } })
  const updateStatus = trpc.reservations.updateStatus.useMutation({ onSuccess: () => { void refetch(); setConfirmDialog(null) } })
  const upsertBlocked = trpc.reservations.upsertBlockedDate.useMutation({ onSuccess: () => { void refetchBlocked(); setBlockDateInput(''); setBlockNoteInput('') } })
  const deleteBlocked = trpc.reservations.deleteBlockedDate.useMutation({ onSuccess: () => void refetchBlocked() })

  // ── Calendar helpers ────────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [calendarMonth])

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, ReservationListItem[]>()
    for (const r of reservations ?? []) {
      const key = toDateKey(new Date(r.eventDate))
      const existing = map.get(key) ?? []
      existing.push(r)
      map.set(key, existing)
    }
    return map
  }, [reservations])

  const blockedByDate = useMemo(() => {
    const map = new Map<string, { id: string; notes: string | null }>()
    for (const b of blockedDates ?? []) {
      if (b.isBlocked) map.set(toDateKey(new Date(b.date)), { id: b.id, notes: b.notes })
    }
    return map
  }, [blockedDates])

  const selectedReservations = useMemo(() => {
    if (!selectedDate) return []
    return reservationsByDate.get(toDateKey(selectedDate)) ?? []
  }, [selectedDate, reservationsByDate])

  const selectedBlocked = selectedDate ? blockedByDate.get(toDateKey(selectedDate)) : undefined

  // ── Form submit ─────────────────────────────────────────────────────────────

  const handleSave = useCallback((f: FormState, id?: string) => {
    const payload = {
      eventDate: f.eventDate,
      startTime: f.startTime || null,
      endTime: f.endTime || null,
      adultsCount: Number(f.adultsCount),
      childrenCount: Number(f.childrenCount),
      eventType: f.eventType,
      status: f.status,
      contact: { name: f.name, phone: f.phone, email: f.email, notes: f.notes || null },
      packageCode: (f.packageCode as PackageCode) || null,
      total: f.total ? Number(f.total) : null,
    }
    if (id) {
      updateReservation.mutate({ id, ...payload })
    } else {
      createReservation.mutate(payload)
    }
  }, [createReservation, updateReservation])

  // ── Tabs for list view ──────────────────────────────────────────────────────

  const currentTab = TABS.find((t) => t.value === activeTab)!
  const filteredReservations = (reservations ?? []).filter((r) => {
    return currentTab.statuses.includes(r.status) && (statusFilter === 'ALL' || r.status === statusFilter)
  })

  const tabCount = (tab: typeof TABS[number]) =>
    (reservations ?? []).filter((r) => tab.statuses.includes(r.status)).length

  // ── Tabs node ───────────────────────────────────────────────────────────────

  const tabsNode = viewMode === 'list' ? (
    <div className="flex items-center gap-0.5">
      {TABS.map((tab) => {
        const count = tabCount(tab)
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex items-center gap-2 h-14 px-5 text-sm font-sans font-normal border-b-2 transition-all',
              isActive ? 'border-primary text-dark-gray' : 'border-transparent text-muted-foreground hover:text-dark-gray'
            )}
          >
            {tab.label}
            <span className={cn(
              'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs',
              isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  ) : null

  const toolbarNode = (
    <div className="flex items-center gap-2">
      {viewMode === 'list' && (
        <FilterButton
          activeCount={statusFilter !== 'ALL' ? 1 : 0}
          onClear={() => setStatusFilter('ALL')}
          filters={[{
            label: 'Status', value: statusFilter,
            onChange: (v) => setStatusFilter(v as ReservationStatus | 'ALL'),
            options: Object.entries(statusLabelMap).map(([k, v]) => ({ label: v, value: k })),
            allLabel: 'Wszystkie statusy',
          }]}
        />
      )}
      {/* View toggle */}
      <div className="flex items-center rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setViewMode('calendar')}
          className={cn('flex items-center gap-1.5 px-3 h-8 text-xs font-sans transition-colors',
            viewMode === 'calendar' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-dark-gray')}
        >
          <Calendar size={13} /> Kalendarz
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn('flex items-center gap-1.5 px-3 h-8 text-xs font-sans transition-colors',
            viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-dark-gray')}
        >
          <LayoutList size={13} /> Lista
        </button>
      </div>
      <Button size="sm" onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
        <Plus size={14} /> Dodaj
      </Button>
      <button
        onClick={() => setBlockPanelOpen(true)}
        className="flex items-center gap-1.5 px-3 h-8 text-xs font-sans rounded-lg border border-border text-muted-foreground hover:text-dark-gray transition-colors"
      >
        <Ban size={13} /> Blokady
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <>
        <div className="sticky top-0 z-20 bg-white border-b border-border h-14" />
        <div className="p-4 md:p-6 lg:p-8 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Rezerwacje" tabs={tabsNode} toolbar={toolbarNode} />

      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8">

        {/* ── CALENDAR VIEW ─────────────────────────────────────────────── */}
        {viewMode === 'calendar' && (
          <div className="space-y-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <h2 className="text-base font-sans font-semibold text-dark-gray capitalize">
                {format(calendarMonth, 'LLLL yyyy', { locale: pl })}
              </h2>
              <button
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-sans font-normal text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const key = toDateKey(date)
                const dayReservations = reservationsByDate.get(key) ?? []
                const blocked = blockedByDate.get(key)
                return (
                  <CalendarCell
                    key={key}
                    date={date}
                    reservations={dayReservations}
                    isBlocked={!!blocked}
                    blockedNote={blocked?.notes}
                    isCurrentMonth={isSameMonth(date, calendarMonth)}
                    isSelected={!!selectedDate && isSameDay(date, selectedDate)}
                    onClick={() => setSelectedDate((prev) => prev && isSameDay(prev, date) ? null : date)}
                  />
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" />Nowe</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" />Potwierdzone</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />Anulowane</span>
              <span className="flex items-center gap-1.5"><Lock size={11} />Zablokowane</span>
            </div>
          </div>
        )}

        {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
        {viewMode === 'list' && (
          filteredReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Calendar size={40} strokeWidth={1} className="mb-3 opacity-30" />
              <p className="text-sm font-sans">Brak rezerwacji</p>
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
                      <span className="hidden md:block text-sm font-sans text-muted-foreground w-6 shrink-0 tabular-nums">{index + 1}</span>
                      <div className="flex flex-col shrink-0 min-w-[110px]">
                        <span className="flex items-center gap-1.5 text-sm font-sans text-dark-gray">
                          <Calendar size={13} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                          {formatDate(res.eventDate)}
                        </span>
                        {(res.startTime || res.endTime) && (
                          <span className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground mt-0.5">
                            <Clock size={11} strokeWidth={1.5} className="shrink-0" />
                            {res.startTime ?? ''}{res.startTime && res.endTime ? ` – ${res.endTime}` : res.endTime ?? ''}
                          </span>
                        )}
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-sm font-sans text-dark-gray">
                        <Users size={13} strokeWidth={1.5} className="text-muted-foreground" />
                        {res.adultsCount}{res.childrenCount ? ` + ${res.childrenCount}dz` : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-dark-gray truncate">{res.contact?.name ?? '—'}</p>
                        <p className="text-xs font-sans text-muted-foreground truncate">{res.contact?.phone ?? ''}</p>
                      </div>
                      <div className="hidden md:flex flex-col items-end shrink-0 text-right">
                        {res.offerSnapshot?.packageCode && (
                          <span className="text-xs font-sans text-muted-foreground">{packageLabelMap[res.offerSnapshot.packageCode]}</span>
                        )}
                        {res.offerSnapshot?.total != null && (
                          <span className="text-sm font-sans font-semibold text-dark-gray">{res.offerSnapshot.total} zł</span>
                        )}
                      </div>
                      <span className={cn('shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-sans', statusBadgeMap[res.status])}>
                        {statusLabelMap[res.status]}
                      </span>
                      <ChevronDown size={15} strokeWidth={1.5} className="shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-border">
                    <ReservationDetailPanel
                      summary={res}
                      detail={expandedId === res.id ? detail ?? null : null}
                      onConfirm={() => setConfirmDialog({ id: res.id, action: 'confirm' })}
                      onCancel={() => setConfirmDialog({ id: res.id, action: 'cancel' })}
                      onEdit={async (r) => {
                        const full = await (expandedId === res.id && detail ? Promise.resolve(detail) : Promise.resolve(null))
                        setEditReservation(full)
                      }}
                      onDelete={() => setDeleteId(res.id)}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )
        )}
      </div>

      {/* ── Day sheet (calendar click) ────────────────────────────────────────── */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-sans font-semibold text-dark-gray capitalize">
              {selectedDate
                ? format(selectedDate, 'd MMMM yyyy', { locale: pl })
                : ''}
            </SheetTitle>
          </SheetHeader>

          {selectedBlocked && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2.5">
              <Lock size={14} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans text-dark-gray">{selectedBlocked.notes ?? 'Termin zablokowany'}</p>
              </div>
              <button
                onClick={() => deleteBlocked.mutate({ id: selectedBlocked.id })}
                className="text-muted-foreground hover:text-danger transition-colors"
              >
                <LockOpen size={14} />
              </button>
            </div>
          )}

          {!selectedBlocked && selectedDate && (
            <button
              onClick={() => {
                if (!selectedDate) return
                upsertBlocked.mutate({ date: toDateKey(selectedDate), isBlocked: true, notes: 'Termin zajęty' })
              }}
              className="mb-4 w-full flex items-center gap-1.5 justify-center text-xs font-sans text-muted-foreground hover:text-dark-gray border border-dashed border-border rounded-lg px-3 py-2 transition-colors"
            >
              <Lock size={12} /> Zablokuj ten dzień
            </button>
          )}

          {selectedReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar size={32} strokeWidth={1} className="mb-2 opacity-30" />
              <p className="text-sm font-sans">Brak rezerwacji</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedReservations.map((res) => (
                <div key={res.id} className="rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/30 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans font-medium text-dark-gray truncate">{res.contact?.name ?? '—'}</p>
                      <p className="text-xs font-sans text-muted-foreground">
                        {res.startTime ? `${res.startTime}${res.endTime ? ` – ${res.endTime}` : ''}` : ''}
                        {' · '}
                        {res.adultsCount} dorosłych{res.childrenCount ? ` + ${res.childrenCount} dzieci` : ''}
                      </p>
                    </div>
                    <span className={cn('shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans', statusBadgeMap[res.status])}>
                      {statusLabelMap[res.status]}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-1.5 text-sm font-sans text-dark-gray">
                    {res.contact?.phone && (
                      <a href={`tel:${res.contact.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                        <Phone size={12} />{res.contact.phone}
                      </a>
                    )}
                    {res.offerSnapshot?.total != null && (
                      <p className="text-sm font-semibold">{res.offerSnapshot.total} zł</p>
                    )}
                  </div>
                  <div className="border-t border-border px-4 py-2.5 flex items-center gap-3">
                    {res.status === 'SENT' && (
                      <button
                        onClick={() => setConfirmDialog({ id: res.id, action: 'confirm' })}
                        className="text-xs font-sans text-success hover:underline"
                      >
                        Potwierdź
                      </button>
                    )}
                    {(res.status === 'SENT' || res.status === 'CONFIRMED') && (
                      <button
                        onClick={() => setConfirmDialog({ id: res.id, action: 'cancel' })}
                        className="text-xs font-sans text-muted-foreground hover:text-danger transition-colors flex items-center gap-1"
                      >
                        <X size={11} /> Anuluj
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(res.id)}
                      className="ml-auto text-xs font-sans text-muted-foreground hover:text-danger transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            className="mt-5 w-full"
            onClick={() => {
              setAddOpen(true)
            }}
          >
            <Plus size={14} className="mr-1.5" /> Dodaj rezerwację na ten dzień
          </Button>
        </SheetContent>
      </Sheet>

      {/* ── Add reservation dialog ───────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(open) => !open && setAddOpen(false)}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-dark-gray">Nowa rezerwacja</DialogTitle>
          </DialogHeader>
          <ReservationForm
            initial={{
              ...emptyForm(),
              eventDate: selectedDate ? toDateKey(selectedDate) : '',
            }}
            onSave={(f) => handleSave(f)}
            onCancel={() => setAddOpen(false)}
            isSaving={createReservation.isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit reservation dialog ──────────────────────────────────────────── */}
      <Dialog open={!!editReservation} onOpenChange={(open) => !open && setEditReservation(null)}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-dark-gray">Edytuj rezerwację</DialogTitle>
          </DialogHeader>
          {editReservation && (
            <ReservationForm
              initial={{
                eventDate: toDateKey(new Date(editReservation.eventDate)),
                startTime: editReservation.startTime ?? '',
                endTime: editReservation.endTime ?? '',
                adultsCount: editReservation.adultsCount,
                childrenCount: editReservation.childrenCount ?? 0,
                eventType: editReservation.eventType,
                status: editReservation.status,
                name: editReservation.contact?.name ?? '',
                phone: editReservation.contact?.phone ?? '',
                email: editReservation.contact?.email ?? '',
                notes: editReservation.contact?.notes ?? '',
                packageCode: (editReservation.offerSnapshot?.packageCode ?? '') as PackageCode | '',
                total: editReservation.offerSnapshot?.total?.toString() ?? '',
              }}
              onSave={(f) => handleSave(f, editReservation.id)}
              onCancel={() => setEditReservation(null)}
              isSaving={updateReservation.isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-dark-gray">Usuń rezerwację?</DialogTitle>
            <DialogDescription className="font-sans text-muted-foreground">
              Operacja jest nieodwracalna. Rezerwacja zostanie trwale usunięta z bazy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Wróć</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteReservation.isLoading}
              onClick={() => deleteId && deleteReservation.mutate({ id: deleteId })}
            >
              {deleteReservation.isLoading ? 'Usuwanie…' : 'Usuń'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm / Cancel dialog ──────────────────────────────────────────── */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-dark-gray">
              {confirmDialog?.action === 'confirm' ? 'Potwierdzić rezerwację?' : 'Anulować rezerwację?'}
            </DialogTitle>
            <DialogDescription className="font-sans text-muted-foreground">
              {confirmDialog?.action === 'confirm'
                ? 'Status zostanie zmieniony na Potwierdzone.'
                : 'Status zostanie zmieniony na Anulowane.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmDialog(null)}>Wróć</Button>
            <Button
              variant={confirmDialog?.action === 'cancel' ? 'destructive' : 'default'}
              size="sm"
              disabled={updateStatus.isLoading}
              onClick={() => confirmDialog && updateStatus.mutate({
                id: confirmDialog.id,
                status: confirmDialog.action === 'confirm' ? 'CONFIRMED' : 'CANCELLED',
              })}
            >
              {updateStatus.isLoading
                ? 'Zapisywanie…'
                : confirmDialog?.action === 'confirm' ? 'Potwierdź' : 'Anuluj rezerwację'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Blocked dates manager ────────────────────────────────────────────── */}
      <Sheet open={blockPanelOpen} onOpenChange={setBlockPanelOpen}>
        <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-sans font-semibold text-dark-gray flex items-center gap-2">
              <Ban size={16} /> Zablokowane daty
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-2 mb-5">
            <Input
              type="date"
              value={blockDateInput}
              onChange={(e) => setBlockDateInput(e.target.value)}
            />
            <Input
              placeholder="Powód (opcjonalnie)"
              value={blockNoteInput}
              onChange={(e) => setBlockNoteInput(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!blockDateInput || upsertBlocked.isLoading}
              onClick={() => upsertBlocked.mutate({ date: blockDateInput, isBlocked: true, notes: blockNoteInput || null })}
            >
              <Lock size={13} className="mr-1.5" />
              {upsertBlocked.isLoading ? 'Zapisywanie…' : 'Zablokuj datę'}
            </Button>
          </div>

          <div className="space-y-1.5">
            {(blockedDates ?? []).filter((b) => b.isBlocked).length === 0 && (
              <p className="text-sm font-sans text-muted-foreground text-center py-8">Brak zablokowanych dat</p>
            )}
            {(blockedDates ?? [])
              .filter((b) => b.isBlocked)
              .map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <Lock size={12} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-dark-gray">
                      {format(new Date(b.date), 'd MMM yyyy', { locale: pl })}
                    </p>
                    {b.notes && <p className="text-xs font-sans text-muted-foreground truncate">{b.notes}</p>}
                  </div>
                  <button
                    onClick={() => deleteBlocked.mutate({ id: b.id })}
                    className="text-muted-foreground hover:text-danger transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ─── Detail panel (list view) ─────────────────────────────────────────────────

const ReservationDetailPanel = ({
  summary,
  detail,
  onConfirm,
  onCancel,
  onEdit,
  onDelete,
}: {
  summary: ReservationListItem
  detail: ReservationDetail | null
  onConfirm: () => void
  onCancel: () => void
  onEdit: (r: ReservationDetail) => void
  onDelete: () => void
}) => (
  <div className="p-5 space-y-5">
    <div>
      <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Kontakt</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
        <DetailRow label="Imię i nazwisko" value={detail?.contact?.name ?? summary.contact?.name} />
        <DetailRow
          label="Telefon"
          value={detail?.contact?.phone ? (
            <a href={`tel:${detail.contact.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
              <Phone size={12} strokeWidth={2} />{detail.contact.phone}
            </a>
          ) : summary.contact?.phone}
        />
        <DetailRow
          label="E-mail"
          value={detail?.contact?.email ? (
            <a href={`mailto:${detail.contact.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
              <Mail size={12} strokeWidth={2} />{detail.contact.email}
            </a>
          ) : null}
        />
        {detail?.contact?.notes && (
          <div className="col-span-full"><DetailRow label="Uwagi" value={detail.contact.notes} /></div>
        )}
      </div>
    </div>

    <div>
      <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Wydarzenie</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
        <DetailRow label="Data" value={formatDate(summary.eventDate)} />
        <DetailRow
          label="Godziny"
          value={summary.startTime ? `${summary.startTime}${summary.endTime ? ` – ${summary.endTime}` : ''}` : '—'}
        />
        <DetailRow
          label="Goście"
          value={`${summary.adultsCount} dorosłych${summary.childrenCount ? ` + ${summary.childrenCount} dzieci` : ''}`}
        />
        <DetailRow label="Typ" value={eventTypeLabelMap[summary.eventType] ?? summary.eventType} />
      </div>
    </div>

    {detail?.offerSnapshot && (
      <div>
        <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Oferta</p>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex flex-wrap gap-x-8 gap-y-1 text-sm font-sans text-dark-gray">
          <span>Pakiet: <strong>{packageLabelMap[detail.offerSnapshot.packageCode] ?? detail.offerSnapshot.packageCode}</strong></span>
          <span>Podstawa: <strong>{detail.offerSnapshot.subtotal} zł</strong></span>
          {detail.offerSnapshot.serviceFee > 0 && <span>Serwis: <strong>+{detail.offerSnapshot.serviceFee} zł</strong></span>}
          <span>Suma: <strong>{detail.offerSnapshot.total} zł</strong></span>
        </div>
      </div>
    )}

    {detail?.extras && detail.extras.length > 0 && (
      <div>
        <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Dodatki</p>
        <ul className="space-y-1.5">
          {detail.extras.map((extra) => (
            <li key={extra.id} className="flex items-center justify-between text-sm font-sans text-dark-gray bg-muted/30 rounded-lg px-3 py-2">
              <span><span className="text-muted-foreground mr-2">×{extra.quantity}</span>{extra.label}</span>
              <span className="font-medium shrink-0 ml-4">+{extra.totalPrice} zł</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="border-t border-border pt-4 flex items-center gap-3">
      {summary.status === 'SENT' && (
        <Button size="sm" onClick={onConfirm}>Potwierdź rezerwację</Button>
      )}
      {(summary.status === 'SENT' || summary.status === 'CONFIRMED') && (
        <button onClick={onCancel} className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground hover:text-danger transition-colors">
          <X size={13} strokeWidth={2} /> Anuluj rezerwację
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {detail && (
          <button onClick={() => onEdit(detail)} className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground hover:text-dark-gray transition-colors">
            Edytuj
          </button>
        )}
        <button onClick={onDelete} className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground hover:text-danger transition-colors">
          <Trash2 size={13} strokeWidth={2} /> Usuń
        </button>
      </div>
    </div>
  </div>
)

export default Reservations
