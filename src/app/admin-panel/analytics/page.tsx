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
  BarChart3,
  Check,
  ChevronDown,
  Globe2,
  Laptop,
  MapPin,
  MousePointerClick,
  Smartphone,
  Tablet,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '../components/PageHeader'

type Range = 'day' | 'week' | 'month' | 'year' | 'all'

type AnalyticsData = {
  range: Range
  generatedAt: string
  analytics: {
    pageViews: number
    visitors: number
    sites: Array<{ site: string; pageViews: number; visitors: number }>
    topPaths: Array<{ site: string; path: string; views: number }>
    topReferrers: Array<{ label: string; views: number }>
    topLocations: Array<{ label: string; views: number }>
    devices: Array<{ label: string; views: number }>
  }
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Błąd podczas pobierania statystyk')
  return response.json() as Promise<AnalyticsData>
}

const number = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

const formatTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : '-'

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

const formatPathLabel = (path: string) => {
  if (path === '/') return 'Strona główna'
  return path.replace(/^\/+/, '').replace(/[-_]/g, ' ') || path
}

const deviceLabel: Record<string, string> = {
  desktop: 'Komputer',
  mobile: 'Telefon',
  tablet: 'Tablet',
  unknown: 'Nieznane urządzenie',
}

const DeviceIcon = ({ device }: { device: string }) => {
  if (device === 'mobile') return <Smartphone size={18} />
  if (device === 'tablet') return <Tablet size={18} />
  return <Laptop size={18} />
}

const StatCard = ({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string
  value: string
  helper: string
  icon: React.ElementType
}) => (
  <Card className="border-border shadow-sm">
    <CardContent className="flex items-start justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
}: {
  label: string
  value: number
  valueLabel?: string
  sublabel?: string
  max: number
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
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
    {text}
  </div>
)

export default function AnalyticsPage() {
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

  const datePickerSlot = range === 'month' || range === 'year'
    ? (
      <div className={cn('flex h-9 shrink-0 justify-end', range === 'month' ? 'w-[150px]' : 'w-[116px]')}>
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
    : null

  const rangeTabs = (
    <div className="flex flex-nowrap items-center gap-2">
      {datePickerSlot}
      <div className="grid h-9 shrink-0 grid-cols-5 rounded-lg border border-border bg-muted p-1">
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
      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        <PageHeader title="Statystyki" toolbar={rangeTabs} />
        <div className="space-y-5 p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        <PageHeader title="Statystyki" toolbar={rangeTabs} />
        <div className="p-4 md:p-6 lg:p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Nie udało się pobrać statystyk.
          </div>
        </div>
      </div>
    )
  }

  const websiteStats = data.analytics.sites.find((site) => site.site === 'spokosopot.pl')
  const orderStats = data.analytics.sites.find((site) => site.site === 'order.spokosopot.pl')
  const websiteViews = websiteStats?.pageViews ?? 0
  const orderViews = orderStats?.pageViews ?? 0
  const maxPathViews = Math.max(...data.analytics.topPaths.map((item) => item.views), 0)
  const maxReferrerViews = Math.max(...data.analytics.topReferrers.map((item) => item.views), 0)
  const maxLocationViews = Math.max(...data.analytics.topLocations.map((item) => item.views), 0)
  const maxDeviceViews = Math.max(...data.analytics.devices.map((item) => item.views), 0)

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <PageHeader title="Statystyki" toolbar={rangeTabs} />

      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <section>
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ruch na stronach</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Anonimowe statystyki zebrane po zgodzie użytkowników.
              </p>
            </div>
            <div className="text-sm text-muted-foreground md:text-right">
              <p>Dane za {rangeLabel[range]}</p>
              <p className="text-xs">Aktualizacja: {formatDate(data.generatedAt)}, {formatTime(data.generatedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Odsłony razem" value={number(data.analytics.pageViews)} helper="Wszystkie zarejestrowane wejścia" icon={Globe2} />
            <StatCard title="Odwiedzający" value={number(data.analytics.visitors)} helper="Anonimowi unikalni użytkownicy" icon={Users} />
            <StatCard title="spokosopot.pl" value={number(websiteViews)} helper={`${number(websiteStats?.visitors ?? 0)} odwiedzających stronę reprezentacyjną`} icon={MousePointerClick} />
            <StatCard title="order.spokosopot.pl" value={number(orderViews)} helper={`${number(orderStats?.visitors ?? 0)} odwiedzających stronę zamówień`} icon={BarChart3} />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MousePointerClick className="text-primary" size={20} />
                Najpopularniejsze podstrony
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.analytics.topPaths.length === 0 ? (
                <EmptyState text="Brak danych analitycznych w wybranym zakresie." />
              ) : (
                data.analytics.topPaths.map((item) => (
                  <ProgressRow
                    key={`${item.site}:${item.path}`}
                    label={formatPathLabel(item.path)}
                    sublabel={`${item.site} · techniczna ścieżka: ${item.path}`}
                    value={item.views}
                    valueLabel={`${number(item.views)} odsłon`}
                    max={maxPathViews}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe2 className="text-primary" size={20} />
                Strony
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.analytics.sites.length === 0 ? (
                <EmptyState text="Brak danych dla domen." />
              ) : (
                data.analytics.sites.map((site) => (
                  <div key={site.site} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{site.site}</p>
                      <p className="text-xs text-muted-foreground">{number(site.visitors)} odwiedzających</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-900">{number(site.pageViews)} odsłon</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MousePointerClick className="text-primary" size={20} />
                Źródła wejść
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.analytics.topReferrers.length === 0 ? (
                <EmptyState text="Brak źródeł wejść." />
              ) : (
                data.analytics.topReferrers.map((item) => (
                  <ProgressRow
                    key={item.label}
                    label={item.label}
                    value={item.views}
                    valueLabel={number(item.views)}
                    max={maxReferrerViews}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="text-primary" size={20} />
                Lokalizacje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.analytics.topLocations.length === 0 ? (
                <EmptyState text="Brak danych lokalizacji." />
              ) : (
                data.analytics.topLocations.map((item) => (
                  <ProgressRow
                    key={item.label}
                    label={item.label}
                    value={item.views}
                    valueLabel={number(item.views)}
                    max={maxLocationViews}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Laptop className="text-primary" size={20} />
                Urządzenia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.analytics.devices.length === 0 ? (
                <EmptyState text="Brak danych urządzeń." />
              ) : (
                data.analytics.devices.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <DeviceIcon device={item.label} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <ProgressRow
                        label={deviceLabel[item.label] ?? item.label}
                        value={item.views}
                        valueLabel={number(item.views)}
                        max={maxDeviceViews}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
