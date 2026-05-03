'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { Skeleton } from '@/app/components/ui/skeleton'
import { cn } from '@/utils/utils'
import {
  CalendarCheck,
  Check,
  ChefHat,
  ChevronDown,
  Clock,
  CreditCard,
  Crown,
  PackageCheck,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '../components/PageHeader'

type Range = 'day' | 'week' | 'month' | 'year' | 'all'

type DashboardData = {
  range: Range
  generatedAt: string
  orders: {
    count: number
    revenue: number
    averageValue: number
    activeCount: number
    deliveryCount: number
    takeOutCount: number
  }
  reservations: {
    count: number
    revenue: number
    guests: number
    pendingCount: number
    confirmedCount: number
    upcomingCount: number
  }
  menu: {
    activeItems: number
    orderableItems: number
    topItems: Array<{ id: string; name: string; category: string; quantity: number; revenue: number }>
    weakestItems: Array<{ id: string; name: string; category: string; quantity: number; revenue: number }>
  }
  customers: {
    uniqueCount: number
    topCustomers: Array<{ name: string; phone: string; orders: number; spent: number }>
  }
  operations: {
    activeOrders: Array<{
      id: string
      name: string
      phone: string
      status: string
      deliveryMethod: string
      deliveryTime: string | null
      amount: number
      createdAt: string
    }>
    upcomingReservations: Array<{
      id: string
      name: string
      status: string
      eventDate: string
      startTime: string | null
      endTime: string | null
      guests: number
      total: number
    }>
    latestOrders: Array<{
      id: string
      name: string
      status: string
      amount: number
      items: string[]
      createdAt: string
    }>
    latestReservations: Array<{
      id: string
      name: string
      status: string
      eventDate: string
      total: number
      createdAt: string
    }>
  }
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Błąd podczas pobierania danych')
  return response.json() as Promise<DashboardData>
}

const money = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value) + ' zł'

const number = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

const formatTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : '—'

const rangeLabel: Record<Range, string> = {
  day: 'dzisiaj',
  week: 'ostatnie 7 dni',
  month: 'wybrany miesiąc',
  year: 'bieżący rok',
  all: 'cały okres',
}

const currentDate = new Date()
const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
const currentYear = String(currentDate.getFullYear())
const yearOptions = Array.from({ length: 8 }, (_, index) => String(currentDate.getFullYear() - index))
const monthOptions = [
  'Sty',
  'Lut',
  'Mar',
  'Kwi',
  'Maj',
  'Cze',
  'Lip',
  'Sie',
  'Wrz',
  'Paź',
  'Lis',
  'Gru',
]

const getMonthLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return value
  const monthIndex = Number(match[2]) - 1
  return `${monthOptions[monthIndex] ?? match[2]} ${match[1]}`
}

const statusLabel: Record<string, string> = {
  PENDING: 'Nowe',
  ACCEPTED: 'Przyjęte',
  IN_PROGRESS: 'W realizacji',
  READY: 'Gotowe',
  DELIVERING: 'Dostawa',
  DELIVERED: 'Dostarczone',
  COMPLETED: 'Zakończone',
  CANCELLED: 'Anulowane',
  SENT: 'Nowa',
  CONFIRMED: 'Potwierdzona',
}

const StatCard = ({
  title,
  value,
  helper,
  icon: Icon,
  tone = 'default',
}: {
  title: string
  value: string
  helper: string
  icon: React.ElementType
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) => (
  <Card className="border-border shadow-sm">
    <CardContent className="flex items-start justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </div>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          tone === 'success' && 'bg-emerald-50 text-emerald-600',
          tone === 'warning' && 'bg-amber-50 text-amber-600',
          tone === 'danger' && 'bg-red-50 text-red-600',
          tone === 'default' && 'bg-primary/10 text-primary'
        )}
      >
        <Icon size={20} />
      </div>
    </CardContent>
  </Card>
)

const ProgressRow = ({
  label,
  value,
  valueLabel,
  sublabel,
  max,
  showBar = true,
}: {
  label: string
  value: number
  valueLabel?: string
  sublabel?: string
  max: number
  showBar?: boolean
}) => {
  const width = max > 0 && value > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-900">{valueLabel ?? value}</span>
      </div>
      {showBar && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
        </div>
      )}
    </div>
  )
}

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-3">
    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h2>
    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
  </div>
)

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
    {text}
  </div>
)

export default function DashboardPage() {
  const [range, setRange] = useState<Range>('week')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const query = new URLSearchParams({ range })
  if (range === 'month') query.set('month', selectedMonth)
  if (range === 'year') query.set('year', selectedYear)
  const { data, error } = useSWR(`/api/admin-dashboard?${query.toString()}`, fetcher)
  const selectedMonthYear = Number(selectedMonth.slice(0, 4)) || currentDate.getFullYear()
  const setMonthForYear = (year: number, monthIndex: number) => {
    setSelectedMonth(`${year}-${String(monthIndex + 1).padStart(2, '0')}`)
  }
  const datePickerSlot = (
    <div className="flex h-9 w-[150px] shrink-0 justify-end">
      {range === 'month' && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-[150px] items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-muted/40"
            >
              {getMonthLabel(selectedMonth)}
              <ChevronDown size={15} className="text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[310px] p-3">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedMonth(String(selectedMonthYear - 1) + selectedMonth.slice(4))}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                {selectedMonthYear - 1}
              </button>
              <p className="text-sm font-semibold text-slate-900">{selectedMonthYear}</p>
              <button
                type="button"
                onClick={() => setSelectedMonth(String(selectedMonthYear + 1) + selectedMonth.slice(4))}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                {selectedMonthYear + 1}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {monthOptions.map((month, index) => {
                const value = `${selectedMonthYear}-${String(index + 1).padStart(2, '0')}`
                const active = selectedMonth === value
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setMonthForYear(selectedMonthYear, index)}
                    className={cn(
                      'flex h-9 items-center justify-center rounded-md text-sm transition-colors',
                      active
                        ? 'bg-primary text-secondary font-semibold'
                        : 'text-slate-700 hover:bg-muted'
                    )}
                  >
                    {month}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {range === 'year' && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-[116px] items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-muted/40"
            >
              {selectedYear}
              <ChevronDown size={15} className="text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[220px] p-2">
            <div className="grid grid-cols-2 gap-1">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    'flex h-9 items-center justify-between rounded-md px-3 text-sm transition-colors',
                    selectedYear === year
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-slate-700 hover:bg-muted'
                  )}
                >
                  {year}
                  {selectedYear === year && <Check size={14} />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
  const rangeTabs = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {datePickerSlot}

      <div className="grid h-9 grid-cols-5 rounded-lg border border-border bg-muted p-1">
        {[
          { value: 'day', label: 'Dzisiaj' },
          { value: 'week', label: '7 dni' },
          { value: 'month', label: 'Miesiąc' },
          { value: 'year', label: 'Rok' },
          { value: 'all', label: 'Całość' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRange(option.value as Range)}
            className={cn(
              'min-w-[82px] rounded-md px-3 text-sm font-medium transition-colors',
              range === option.value
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )

  if (!data && !error) {
    return (
      <>
        <PageHeader title="Pulpit" toolbar={rangeTabs} />
        <div className="space-y-5 p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Pulpit" toolbar={rangeTabs} />
        <div className="p-4 md:p-6 lg:p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Nie udało się pobrać danych pulpitu.
          </div>
        </div>
      </>
    )
  }

  const maxTopItemQty = Math.max(...data.menu.topItems.map((item) => item.quantity), 0)
  const maxWeakItemQty = Math.max(...data.menu.weakestItems.map((item) => item.quantity), 0)
  const totalRevenue = data.orders.revenue + data.reservations.revenue

  return (
    <>
      <PageHeader title="Pulpit" toolbar={rangeTabs} />

      <div className="space-y-7 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Dane za {rangeLabel[range]}</p>
          <p className="text-xs text-muted-foreground">
            Ostatnia aktualizacja: {formatDate(data.generatedAt)}, {formatTime(data.generatedAt)}
          </p>
        </div>

        <section>
          <SectionTitle title="Finanse" description="Łączna wartość sprzedaży i rezerwacji w wybranym okresie." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Przychód łącznie" value={money(totalRevenue)} helper="Zamówienia online + rezerwacje" icon={WalletCards} />
            <StatCard title="Przychód zamówień" value={money(data.orders.revenue)} helper={`${data.orders.count} zamówień, średnio ${money(data.orders.averageValue)}`} icon={ShoppingBag} tone="success" />
            <StatCard title="Wartość rezerwacji" value={money(data.reservations.revenue)} helper={`${number(data.reservations.guests)} gości w rezerwacjach`} icon={CreditCard} />
            <StatCard title="Do obsłużenia" value={number(data.orders.activeCount + data.reservations.pendingCount)} helper="Aktywne zamówienia i nowe rezerwacje" icon={Clock} tone="danger" />
          </div>
        </section>

        <section>
          <SectionTitle title="Zamówienia" description="Sprzedaż online i aktualny stan operacyjny zamówień." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Zamówienia online" value={number(data.orders.count)} helper={`${data.orders.deliveryCount} dostaw, ${data.orders.takeOutCount} odbiorów`} icon={ShoppingBag} tone="success" />
            <StatCard title="Aktywne zamówienia" value={number(data.orders.activeCount)} helper="Wymagają obsługi teraz" icon={Clock} tone="warning" />
            <StatCard title="Klienci zamówień" value={number(data.customers.uniqueCount)} helper="Unikalne numery telefonu w okresie" icon={Users} />
            <StatCard title="Średnia wartość" value={money(data.orders.averageValue)} helper="Średnia wartość zamówienia" icon={WalletCards} />
          </div>
        </section>

        <section>
          <SectionTitle title="Rezerwacje" description="Nowe zapytania, potwierdzone rezerwacje i najbliższe eventy." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Rezerwacje" value={number(data.reservations.count)} helper={`${data.reservations.confirmedCount} potwierdzone, ${data.reservations.pendingCount} nowe`} icon={CalendarCheck} tone="warning" />
            <StatCard title="Goście" value={number(data.reservations.guests)} helper="Łączna liczba osób w rezerwacjach" icon={Users} />
            <StatCard title="Nadchodzące eventy" value={number(data.reservations.upcomingCount)} helper="Rezerwacje w najbliższych 14 dniach" icon={PackageCheck} tone="success" />
            <StatCard title="Nowe do potwierdzenia" value={number(data.reservations.pendingCount)} helper="Status: Nowa" icon={Clock} tone="danger" />
          </div>
        </section>

        <section>
          <SectionTitle title="Menu i klienci" description="Popularność pozycji, słabsze pozycje i najbardziej aktywni klienci." />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.85fr]">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="text-primary" size={20} />
              Najczęściej zamawiane dania
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.menu.topItems.length === 0 ? (
              <EmptyState text="Brak zamówionych pozycji w wybranym zakresie." />
            ) : (
              data.menu.topItems.map((item) => (
                <ProgressRow
                  key={item.id}
                  label={item.name}
                  sublabel={`${item.category} · przychód ${money(item.revenue)}`}
                  value={item.quantity}
                  valueLabel={`${item.quantity} szt.`}
                  max={maxTopItemQty}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="text-primary" size={20} />
              Najczęściej zamawiający klienci
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.customers.topCustomers.length === 0 ? (
              <EmptyState text="Brak klientów z zamówieniami w wybranym zakresie." />
            ) : (
              data.customers.topCustomers.map((customer, index) => (
                <div key={customer.phone || customer.name} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{index + 1}. {customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">{customer.orders}x</p>
                    <p className="text-xs text-muted-foreground">{money(customer.spent)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="border-border shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="text-red-500" size={20} />
              Najsłabiej zamawiane pozycje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.menu.weakestItems.length === 0 ? (
              <EmptyState text="Brak aktywnych pozycji dostępnych do zamówienia." />
            ) : (
              data.menu.weakestItems.map((item) => (
                <ProgressRow
                  key={item.id}
                  label={item.name}
                  sublabel={`${item.category} · przychód ${money(item.revenue)}`}
                  value={item.quantity}
                  valueLabel={`${item.quantity} szt.`}
                  max={maxWeakItemQty}
                  showBar={item.quantity > 0}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>

    <section>
      <SectionTitle title="Najbliższe działania" description="Rzeczy, które wymagają uwagi obsługi w pierwszej kolejności." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Najbliższe rezerwacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.operations.upcomingReservations.length === 0 ? (
              <EmptyState text="Brak rezerwacji w najbliższych 14 dniach." />
            ) : (
              data.operations.upcomingReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{reservation.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(reservation.eventDate)} · {reservation.startTime ?? '—'}-{reservation.endTime ?? '—'} · {reservation.guests} os.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {statusLabel[reservation.status] ?? reservation.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Aktywne zamówienia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.operations.activeOrders.length === 0 ? (
              <EmptyState text="Nie ma aktywnych zamówień do obsługi." />
            ) : (
              data.operations.activeOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{order.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.deliveryMethod === 'DELIVERY' ? 'Dostawa' : 'Odbiór'} · {formatTime(order.deliveryTime)} · {money(order.amount)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ostatnia aktywność</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ...data.operations.latestOrders.map((item) => ({
                id: item.id,
                name: item.name,
                createdAt: item.createdAt,
                value: item.amount,
                type: 'Zamówienie',
              })),
              ...data.operations.latestReservations.map((item) => ({
                id: item.id,
                name: item.name,
                createdAt: item.createdAt,
                value: item.total,
                type: 'Rezerwacja',
              })),
            ]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 8)
              .map((item) => (
                <div key={`${item.id}-${item.createdAt}`} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.type} · {formatDate(item.createdAt)}, {formatTime(item.createdAt)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">{money(item.value)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </section>
    </div>
    </>
  )
}
