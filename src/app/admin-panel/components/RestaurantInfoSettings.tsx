'use client'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { Calendar } from '@/app/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import type { OpeningHour, OpeningHourOverride, RestaurantInfo } from '@/app/types/types'
import { trpc } from '@/utils/trpc'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CalendarDays, Mail, MapPin, Phone, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const DEFAULT_INFO: RestaurantInfo = { name: 'Restauracja Spoko', phone: '530 659 666', email: 'info@spokosopot.pl', address: 'Hestii 3, 81-731 Sopot' }
const DEFAULT_HOURS: OpeningHour[] = DAY_NAMES.map((_, index) => ({
  day: index + 1,
  isClosed: false,
  start: index < 5 ? '10:00' : '08:00',
  end: '19:00',
}))

type Props = {
  settingsData?: {
    restaurantInfo?: unknown
    openingHours?: unknown
    openingHourOverrides?: unknown
  }
  refetchSettings: () => Promise<unknown>
}

const parseInfo = (value: unknown): RestaurantInfo => ({
  ...DEFAULT_INFO,
  ...(value && typeof value === 'object' ? value : {}),
}) as RestaurantInfo

const parseHours = (value: unknown): OpeningHour[] => {
  if (!Array.isArray(value)) return DEFAULT_HOURS
  return DAY_NAMES.map((_, index) => {
    const item = value.find((candidate) => candidate && typeof candidate === 'object' && (candidate as { day?: number }).day === index + 1) as Partial<OpeningHour> | undefined
    return { ...DEFAULT_HOURS[index], ...item, day: index + 1 }
  })
}

const parseOverrides = (value: unknown): OpeningHourOverride[] =>
  Array.isArray(value) ? value as OpeningHourOverride[] : []

const TIME_HOURS = Array.from({ length: 24 }, (_, value) => String(value).padStart(2, '0'))
const TIME_MINUTES = ['00', '30']

const DateSelect = ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => {
  const selected = value ? parseISO(value) : undefined
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={label} className="h-10 w-full justify-start gap-2 bg-white text-left font-normal">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className={value ? 'text-slate-800' : 'text-muted-foreground'}>{selected ? format(selected, 'd MMM yyyy', { locale: pl }) : 'Wybierz datę'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={(date) => date && onChange(format(date, 'yyyy-MM-dd'))} initialFocus locale={pl} />
      </PopoverContent>
    </Popover>
  )
}

const TimeSelect = ({ value, onChange, disabled, label }: { value: string; onChange: (value: string) => void; disabled?: boolean; label: string }) => {
  const [hours = '00', minutes = '00'] = value.split(':')
  const update = (nextHours: string, nextMinutes: string) => onChange(`${nextHours}:${nextMinutes}`)

  return (
    <div className="flex gap-1.5" aria-label={label}>
      <Select value={hours} disabled={disabled} onValueChange={(next) => update(next, minutes)}>
        <SelectTrigger className="h-10 min-w-0 flex-1 bg-white px-2.5 font-medium tabular-nums"><SelectValue /></SelectTrigger>
        <SelectContent>{TIME_HOURS.map((hour) => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={minutes} disabled={disabled} onValueChange={(next) => update(hours, next)}>
        <SelectTrigger className="h-10 min-w-0 flex-1 bg-white px-2.5 font-medium tabular-nums"><SelectValue /></SelectTrigger>
        <SelectContent>{TIME_MINUTES.map((minute) => <SelectItem key={minute} value={minute}>{minute}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}

const RestaurantInfoSettings = ({ settingsData, refetchSettings }: Props) => {
  const [info, setInfo] = useState<RestaurantInfo>(DEFAULT_INFO)
  const [hours, setHours] = useState<OpeningHour[]>(DEFAULT_HOURS)
  const [overrides, setOverrides] = useState<OpeningHourOverride[]>([])
  const updateSettings = trpc.settings.updateRestaurantInfo.useMutation()

  useEffect(() => {
    setInfo(parseInfo(settingsData?.restaurantInfo))
    setHours(parseHours(settingsData?.openingHours))
    setOverrides(parseOverrides(settingsData?.openingHourOverrides))
  }, [settingsData])

  const save = async () => {
    try {
      await updateSettings.mutateAsync({ restaurantInfo: info, openingHours: hours, openingHourOverrides: overrides })
      await refetchSettings()
      toast.success('Informacje restauracji zostały zapisane.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać ustawień.')
    }
  }

  const updateHour = (day: number, patch: Partial<OpeningHour>) => {
    setHours((current) => current.map((item) => item.day === day ? { ...item, ...patch } : item))
  }

  const addOverride = () => {
    setOverrides((current) => [...current, {
      id: crypto.randomUUID(),
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      type: 'hours',
      start: '10:00',
      end: '16:00',
      title: 'Zmiana godzin otwarcia',
      message: 'W podanym terminie obowiązują zmienione godziny otwarcia restauracji.',
    }])
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-8 xl:grid-cols-[minmax(260px,0.72fr)_minmax(620px,1.28fr)] xl:items-start">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Dane kontaktowe</h3>
            <p className="mt-1 text-xs text-muted-foreground">Informacje wyświetlane na stronie restauracji.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">Nazwa restauracji</Label>
            <Input id="restaurant-name" value={info.name} onChange={(event) => setInfo({ ...info, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-address"><MapPin className="mr-1 inline size-4" />Adres</Label>
            <Input id="restaurant-address" value={info.address} onChange={(event) => setInfo({ ...info, address: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-phone"><Phone className="mr-1 inline size-4" />Telefon</Label>
            <Input id="restaurant-phone" value={info.phone} onChange={(event) => setInfo({ ...info, phone: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-email"><Mail className="mr-1 inline size-4" />Email</Label>
            <Input id="restaurant-email" type="email" value={info.email} onChange={(event) => setInfo({ ...info, email: event.target.value })} />
          </div>
        </div>

        <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Stałe godziny otwarcia</h3>
          <p className="text-xs text-muted-foreground">Godziny będą grupowane na stronie, jeśli są takie same dla kolejnych dni.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="divide-y divide-border">
            {hours.map((item, index) => (
              <div key={item.day} className="grid items-center gap-3 px-3 py-3 sm:grid-cols-[minmax(130px,1fr)_auto_96px_96px]">
                <span className="text-sm font-medium text-slate-900">{DAY_NAMES[index]}</span>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input className="size-4 accent-primary" type="checkbox" checked={item.isClosed} onChange={(event) => updateHour(item.day, { isClosed: event.target.checked })} />
                  Zamknięte
                </label>
                <TimeSelect value={item.start} disabled={item.isClosed} onChange={(value) => updateHour(item.day, { start: value })} label={`${DAY_NAMES[index]} otwarcie`} />
                <TimeSelect value={item.end} disabled={item.isClosed} onChange={(value) => updateHour(item.day, { end: value })} label={`${DAY_NAMES[index]} zamknięcie`} />
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Czasowe zmiany i dni wolne</h3>
            <p className="text-xs text-muted-foreground">Ustaw zakres dat, zmienione godziny albo całkowite zamknięcie.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOverride}><Plus className="mr-1 size-4" />Dodaj wyjątek</Button>
        </div>
        {overrides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Brak zaplanowanych wyjątków.</div>
        ) : (
          <div className="space-y-3">
            {overrides.map((item) => (
              <div key={item.id} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.3fr_auto]">
                  <div className="space-y-1"><Label>Od</Label><DateSelect value={item.startDate} onChange={(value) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry))} label="Data początkowa" /></div>
                  <div className="space-y-1"><Label>Do</Label><DateSelect value={item.endDate} onChange={(value) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry))} label="Data końcowa" /></div>
                  <div className="space-y-1"><Label>Rodzaj</Label><Select value={item.type} onValueChange={(value: 'hours' | 'closed') => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, type: value } : entry))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hours">Zmienione godziny</SelectItem><SelectItem value="closed">Restauracja zamknięta</SelectItem></SelectContent></Select></div>
                  <Button type="button" variant="ghost" size="icon" className="mt-5 text-destructive" onClick={() => setOverrides((current) => current.filter((entry) => entry.id !== item.id))} aria-label="Usuń wyjątek"><Trash2 className="size-4" /></Button>
                </div>
                {item.type === 'hours' && <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Otwarcie</Label><TimeSelect value={item.start ?? '10:00'} onChange={(value) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, start: value } : entry))} label="Godzina otwarcia wyjątku" /></div><div className="space-y-1"><Label>Zamknięcie</Label><TimeSelect value={item.end ?? '16:00'} onChange={(value) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, end: value } : entry))} label="Godzina zamknięcia wyjątku" /></div></div>}
                <div className="space-y-1"><Label>Tytuł komunikatu</Label><Input value={item.title} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry))} /></div>
                <div className="space-y-1"><Label>Treść komunikatu</Label><Textarea value={item.message} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, message: event.target.value } : entry))} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="button" onClick={save} disabled={updateSettings.isLoading}><Save className="mr-2 size-4" />{updateSettings.isLoading ? 'Zapisywanie...' : 'Zapisz informacje i godziny'}</Button>
    </div>
  )
}

export default RestaurantInfoSettings
